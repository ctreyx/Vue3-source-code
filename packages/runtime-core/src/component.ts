import { proxyRefs, reactive } from '@vue/reactivity';
import { hasOwn, MyIsFunction, MyIsObject, ShapeFlags } from '@vue/shared';
import { initProps } from './componentProps';

export let currentInstance = null;
export const setCurrentInstance = (instance) => (currentInstance = instance);
export const getCurrentInstance = () => currentInstance;

export function createComponentInstance(vnode, parent) {
  const instance = {
    ctx: {}, //-->keepsalive上下文
    provides: parent ? parent.provides : Object.create(null), //-->查看父级身上有没有provides，所有组件都用父亲的
    parent, //-->父组件
    vnode,
    data: null,
    subTree: null, //-->vnode组件的虚拟节点，组件渲染的内容
    isMounted: false, //-->是否挂载
    update: null, //--> 挂载effect.run强制更新
    propsOptions: vnode.type.props || {},
    props: {},
    attrs: {},
    proxy: null, //-->用户能取到state,props,attrs等属性
    render: null,
    setupState: null, //-->存储setup数据
    slots: {}, //-->插槽
  };

  return instance;
}

const publicPropertyMap = {
  $attrs: (i) => i.attrs, //-->传入实例，获取实例身上attrs
  $slots: (i) => i.slots, //-->
};
// 抽离proxy
const publicInstanceProxyHandlers = {
  get(target, key) {
    const { data, props, setupState } = target;
    // 1-->如果状态中有该值，返回state的
    if (data && hasOwn(data, key)) {
      return data[key];
    }
    // 2-->判断setupState
    else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    // 2-->如果都没有，查看attrs身上有没有,this.$attrs
    const getter = publicPropertyMap[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, newVal) {
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = newVal;
      return true;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = newVal;
      return true;
    } else if (props && hasOwn(props, key)) {
      // -->不能修改属性，报错
      console.warn('attemptiong to mutate prop ' + (key as string));
      return false;
    }
    return true;
  },
};

function initSlots(instance, children) {
  //1-->判断是不是插槽
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  }
}
export function setupComponent(instance) {
  let { props, type, children } = instance.vnode; //-->instance挂载了vnode

  // 1-->初始化注册props
  initProps(instance, props);

  // 2-->新增插槽初始化
  initSlots(instance, children);

  // 2-->初始化代理对象proxy
  instance.proxy = new Proxy(instance, publicInstanceProxyHandlers);

  let data = type.data;
  // 3-->初始化data,vue3data必须是函数
  if (data) {
    if (!MyIsFunction(data)) {
      return console.warn('data必须是函数');
    }
    instance.data = reactive(data.call(instance.proxy));
  }

  // 4-->新增初始化setupState
  const setup = type.setup;
  if (setup) {
    const setupContext = {
      emit: (event, ...args) => {
        console.log(event[0].toUpperCase(), ...args);
        // 1-->生成自定义事件名称,将event第一个大写。
        const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`;
        // 2-->在vnode.props中映射
        const handler = instance.vnode.props[eventName];
        handler && handler(...args);
      },
      attrs: instance.attrs,
      slots: instance.slots,
    };

    // -->生命周期绑定实例
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, setupContext);
    setCurrentInstance(null);

    // 1-->函数抛给render,对象进行proxyRefs去.value
    if (MyIsFunction(setupResult)) {
      instance.render = setupResult;
    } else if (MyIsObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult); //取消.value-->proxyRefs原理就是通过proxy，判断每个值身上是否有 __v_isRef
    }
  }
  // 4-->初始化render
  if (!instance.render) {
    instance.render = type.render;
  }
}

// -->渲染组件，根据状态组件还是函数式组件

/* 
 有状态type式对象，里面有setup,render,data...而无状态函数式组件type就是函数
*/
export function renderComponent(instance) {
  const { vnode, render, props } = instance;

  if (vnode.shapeFlag & ShapeFlags.STAEFUL_COMPONENT) {
    // 1-->状态组件
    return render.call(instance.proxy, instance.proxy);
  } else {
    // 2-->函数式组件，没有render，直接返回props
    return vnode.type(props);
  }
}
