import { MyIsObject } from '@vue/shared';
import { mutableHandlers, ReactiveFlags } from './baseHandler';
import { effect } from './effect';

const reactiveMap = new WeakMap();

export function isReactive(value) {
  //-->双感叹号表示转为布尔
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

export function reactive(target) {
  if (!MyIsObject(target)) return;

  // 2. --> 解决用户传入proxy的情况 --> 进入下面get --> 只有代理对象才有get,才会触发下面get
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  //  1.--> 缓存proxy,避免同一个对象多次被代理,问题用户可能将proxy传入reactive()
  let exisitingProxy = reactiveMap.get(target);
  if (exisitingProxy) return exisitingProxy;

  //  recevier --> 改变调用this指向
  //  mutableHandlers -- > 抽离核心逻辑
  const proxy = new Proxy(target, mutableHandlers);

  reactiveMap.set(target, proxy);
  return proxy;
}
