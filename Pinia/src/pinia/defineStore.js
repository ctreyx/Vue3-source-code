import { isObject } from '@vue/shared';
import {
  computed,
  effectScope,
  getCurrentInstance,
  inject,
  reactive,
  toRefs,
  isRef,
  watch,
} from 'vue';
import { addSubscriber, triggerSubscribers } from './PubSub';
import { symbolPinia } from './rootStore';

export function defineStore(idOrOptions, setup) {
  let id, options;
  // -->传入id和setup,或id写入options也可以
  if (typeof idOrOptions === 'string') {
    id = idOrOptions;
    options = setup;
  } else {
    id = idOrOptions.id;
    options = idOrOptions;
  }

  function useStore() {
    //1-->获取pinia,并且确保是在组件中获取非mainjs
    const instance = getCurrentInstance;
    const pinia = instance && inject(symbolPinia);
    // 3-->判断是不是setupStore
    const isSetupStore = typeof options === 'function';

    // 2-->查看是否注册过，没有注册进行注册
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, pinia);
      } else {
        createOptionsStore(id, options, pinia);
      }
    }

    //3 -->经过createOptionsStore已经挂载了最新的store
    const store = pinia._s.get(id);

    return store;
  }

  return useStore;
}

// -->createSetupStore就是将setup调用,
// 与createOptionsStore逻辑一样，只不过createOptionsStore需要自己创建setup
// createOptionsStore中setup实际就是完成自定义setup的逻辑，抛出所有属性
function createSetupStore(id, setup, pinia, options) {
  let scope;

  // 1-->pinia._e可以控制全部的store状态
  const stateScope = pinia._e.run(() => {
    scope = effectScope();
    return scope.run(() => setup()); //-->每个store有自己的状态，阔以单独stop
  });

  // 4-->处理actions中this指向
  function wrapAction(name, action) {
    return function () {
      // -->发布模式，在action执行时触发
      const afterCallbackList = [];
      const errorCallbackList = [];
      function after(cb) {
        afterCallbackList.push(cb);
      }
      function onError(cb) {
        errorCallbackList.push(cb);
      }
      // -->触发发布
      triggerSubscribers(actionSubscribers, { after, onError, store, name });
      let ret;
      try {
        ret = action.apply(store, arguments);
      } catch (err) {
        // -->如果同步失败，调用失败
        triggerSubscribers(errorCallbackList, err);
      }

      // -->判断是不是promise
      if (ret instanceof Promise) {
        ret
          .then((res) => {
            triggerSubscribers(afterCallbackList, res);
          })
          .catch((err) => {
            triggerSubscribers(errorCallbackList, err);
          });
      } else {
        triggerSubscribers(afterCallbackList, ret);
      }

      return ret;
    };
  }
  for (let key in stateScope) {
    const props = stateScope[key];
    // -->通过函数判断是不是action
    if (typeof props === 'function') {
      stateScope[key] = wrapAction(key, props);
    }
  }

  // patch-->可传入函数或对象
  function $patch(partialStateOrMutation) {
    if (typeof partialStateOrMutation === 'function') {
      // -->如果是函数，直接执行就行
      partialStateOrMutation(store);
    } else {
      // -->如果是对象，递归
      mergeReactiveObjects(store, partialStateOrMutation);
    }
  }

  //3-->核心创建reactive,将store放进去
  // -->partialState放置初始化的方法
  let actionSubscribers = []; //-->存储订阅
  const partialState = {
    $id: id,
    $patch,
    $subscribe: (callback, options) => {
      // -->监控实际就是watch
      scope.run(() => {
        watch(
          pinia.state.value[id], //-->监听的值,如果用store里面还有actions与getters
          (state) => {
            //-->获取更新后的值
            callback({ type: 'direct', storeId: id }, state);
          },
          options
        );
      });
    },
    $onAction: addSubscriber.bind(null, actionSubscribers), //-->订阅模式，避免直接执行，用bind
    $dispose: () => {
      scope.stop(); //-->将scope中函数全部停止
      actionSubscribers = [];
      pinia._s.delete(id); //-->缓存删除
    },
  };
  let store = reactive(partialState);
  // $state
  Object.defineProperty(store, '$state', {
    get: () => pinia.state.value[id], //-->只要状态
    set: (newState) =>
      $patch(($oldState) => Object.assign($oldState, newState)),
  });

  // 3-->store是reactive,可以直接访问
  Object.assign(store, stateScope);

  pinia._p.forEach((plugin) =>
    Object.assign(store, plugin({ store, app: pinia._a, options, $id: id }))
  );
  pinia._s.set(id, store); //-->将store挂载到pinia._s

  return store;
}

function mergeReactiveObjects(store, partialState) {
  // 1-->将传入的新值取出来
  for (let key in partialState) {
    // 2-->判断是不是store自己身上属，原型链上的跳过
    if (!store.hasOwnProperty(key)) continue;

    // 3-->新老值都是对象进入递归,其他直接覆盖,ref是对象不需要递归
    const oldValue = store[key];
    const newValue = partialState[key];
    if (isObject(oldValue) && isObject(newValue) && !isRef(newValue)) {
      mergeReactiveObjects(oldValue, newValue);
    } else {
      store[key] = newValue;
    }
  }
}

function createOptionsStore(id, options, pinia) {
  const { state, getters, actions } = options;

  function setup() {
    // 2-->为pinia中state仓库添加用户传入的state
    pinia.state.value[id] = state ? state() : {}; //-->定义状态
    //-->这里必须转refs,不然计算属性不能生效，ref更新会触发试图
    const localState = toRefs(pinia.state.value[id]);

    return Object.assign(
      localState,
      actions, //-->将action传进去，但是要解决this指向问题
      Object.keys(getters).reduce((computedGetters, name) => {
        computedGetters[name] = computed(() => {
          const getter = getters[name];
          return getter.call(store, store); //-->计算属性就是在外面包裹一层computed即可，很简单
        });

        return computedGetters;
      }, {})
    );
  }

  const store = createSetupStore(id, setup, pinia, options);
  // -->重置功能,使用patch功能将更改后的值更新为初始值,但是只针对初始值，后面新增的参数不会清除
  store.$reset = function () {
    const oldStore = state ? state() : {}; //-->获取用户最初传入的那个函数值
    store.$patch(($store) => {
      Object.assign($store, oldStore);
    });
  };

  return store;
}

// 原始版
// function createOptionsStore(id, options, pinia) {
//   const { state, getters, actions } = options;
//   let scope;
//   //3-->核心创建reactive,将store放进去
//   let store = reactive({});

//   function setup() {
//     // 2-->为pinia中state仓库添加用户传入的state
//     pinia.state.value[id] = state ? state() : {}; //-->定义状态
//     //-->这里必须转refs,不然计算属性不能生效，ref更新会触发试图
//     const localState = toRefs(pinia.state.value[id]);

//     return Object.assign(
//       localState,
//       actions, //-->将action传进去，但是要解决this指向问题
//       Object.keys(getters).reduce((computedGetters, name) => {
//         computedGetters[name] = computed(() => {
//           const getter = getters[name];
//           return getter.call(store, store); //-->计算属性就是在外面包裹一层computed即可，很简单
//         });

//         return computedGetters;
//       }, {})
//     );
//   }

//   // 1-->pinia._e可以控制全部的store状态
//   const stateScope = pinia._e.run(() => {
//     scope = effectScope();
//     return scope.run(() => setup()); //-->每个store有自己的状态，阔以单独stop
//   });

//   // 4-->处理actions中this指向
//   function wrapAction(key, action) {
//     return function () {
//       const ret = action.apply(store, arguments);
//       return ret;
//     };
//   }
//   for (let key in stateScope) {
//     const props = stateScope[key];
//     // -->通过函数判断是不是action
//     if (typeof props === 'function') {
//       stateScope[key] = wrapAction(key, props);
//     }
//   }
//   // 3-->store是reactive,可以直接访问
//   Object.assign(store, stateScope);
//   pinia._s.set(id, store); //-->将store挂载到pinia._s
// }
