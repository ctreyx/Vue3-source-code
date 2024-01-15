// import { defineStore } from 'pinia';
import { defineStore } from '../pinia';
import { reactive, toRefs, computed } from 'vue';

export const useCounterStore = defineStore('counter', {
  state: () => {
    //-->vue3 state必须是函数
    return {
      count: 0,
      frult: ['apple', 'banner'],
    };
  },
  getters: {
    // -->计算属性
    doubleCount(state) {
      return state.count * 2;
    },
  },
  actions: {
    //-->同步异步都在action
    increment() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // console.log('this', this);
          this.count++; //-->this指向store
          resolve('成功');
        }, 1000);
      });
    },
  },
});
export const useCounterStore1 = defineStore('counter1', {
  state: () => {
    //-->vue3 state必须是函数
    return {
      count: 0,
      frult: ['apple', 'banner'],
    };
  },
  getters: {
    // -->计算属性
    doubleCount(state) {
      return state.count * 2;
    },
  },
  actions: {
    //-->同步异步都在action
    increment() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // console.log('this', this);
          this.count++; //-->this指向store
          resolve('成功');
        }, 1000);
      });
    },
  },
});
// -->自定义版，传入setup,逻辑自己写,需要return
// export const useCounterStore = defineStore('counter', () => {
//   const state = reactive({ count: 2 });

//   const doubleCount = computed(() => {
//     return state.count * 2;
//   });

//   function increment() {
//     console.log(state, this);
//     queueJob(() =>
//       setTimeout(() => {
//         state.count++; //-->this指向store
//       }, 1000)
//     );
//   }

//   return {
//     ...toRefs(state), //-->避免store.state.count,直接转ref
//     doubleCount,
//     increment,
//   };
// });

/* 
 toRefs原理:判断传入是不是reactive-->开辟空间，循环传入的值，每个放入toRef中-->在toRef中，通过get与set获取值
*/

let queue = [];
let isFlugsing = false;
const resolvePromise = Promise.resolve();

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  if (!isFlugsing) {
    isFlugsing = true;
    // -->用异步，是为了等待age++完成再渲染
    resolvePromise.then(() => {
      isFlugsing = false;
      let copy = queue.slice(0); //避免处理时又更新值，开辟新地址
      queue.length = 0; //-->拷贝完后马上清空，避免执行时放入任务，被清空
      for (let i = 0; i < copy.length; i++) {
        let job = copy[i];
        job();
      }

      copy.length = 0; //-->清空回收
    });
  }
}
