import { recordEffectScope } from "./effectScope";

export let activeEffect = undefined;

function cleanupEffect(effect) {
  const { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    /* 
    -->接触依赖，重新触发 
    --> 如果相同地址，会造成添加，删除死循环
    --> 解决: 在trigger执行时，重新设置地址,避免同一地址塌陷
     */
    deps[i].delete(effect);
  }
  effect.length = 0;
}
export class ReactiveEffect {
  public active = true; //-->是否激活状态
  public deps = []; //记录属性，stop()时，清空
  public parent = undefined; // -->父亲，解决下面问题
  constructor(public fn, public scheduler?) {
    //public默认将fn绑定在this

    recordEffectScope(this); //-->effectScope收集依赖 
    
  }
  run() {
    if (!this.active) {
      return this.fn(); //-->如果没有激活，则执行fn,不收集
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;

      cleanupEffect(this); // -->触发前清除该依赖

      return this.fn(); //--> 调用取值，会获取全局activeEffect
    } finally {
      // activeEffect = undefined; // -->收集成功后，清空全局activeEffect
      activeEffect = this.parent;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this); // -->清除依赖
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

const targetMap = new WeakMap();
export function track(target, type, key) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  // -->判断是否收集过 --> 没有就收集
  tarckEffect(dep);
  // const shouldTrack = !dep.has(activeEffect);
  // if (shouldTrack) {
  //   dep.add(activeEffect);
  //   activeEffect.deps.push(dep); // -- > 反向记录
  // }
}
//-->提取公共tarck
export function tarckEffect(dep) {
  if (!activeEffect) return;
  // -->判断是否收集过 --> 没有就收集
  const shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep); // -- > 反向记录
  }
}

export function trigger(target, type, key) {
  const depsMap = targetMap.get(target);
  // --> 触发的值不在模板中。例如{a:1},然后b++ ,不在模板中不触发
  if (!depsMap) return;
  let dep = depsMap.get(key);

  if (dep) {
    triggerEffect(dep);
    // dep = [...dep]; //-->解决分支死循环bug
    // dep.forEach(effect => {
    //   // -->可能出现run时又在存值
    //   if (effect !== activeEffect) {
    //     if (effect.scheduler) {
    //       effect.scheduler();
    //     } else {
    //       effect.run();
    //     }
    //   }
    // });
  }
}

export function triggerEffect(dep) {
  dep = [...dep]; //-->解决分支死循环bug
  dep.forEach(effect => {
    // -->可能出现run时又在存值
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run(); //-->刷新试图
      }
    }
  });
}

/*

 effect(() => {
  state.name  //  -->parent===null , activeEffect是e1
  effect(() => {
    state.age // -- > parent===e1 , activeEffect是e2
  });

  state.user  // 问题-->因为e2已经清空activeEffect,所以这里找不到activeEffect
              // 解决--> activeEffect === parent
});
 
解决办法:
1. 利用弹栈思路，创建[e1,e2] ,进入到e2,然后清除最后一个，user就能获取[e1] 栈里最后一个

2. 查找对应parent

*/
