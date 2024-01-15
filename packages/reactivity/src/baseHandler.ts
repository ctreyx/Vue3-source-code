import { MyIsObject, reactive } from '.';
import { track, trigger } from './effect';

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive', //判断是否代理过
}

export const mutableHandlers = {
  get(target, key, recevier) {
    // 传入proxy--> 进入上面if-->进入get方法 -->判断key
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // --> 依赖收集
    track(target, 'get', key);

    const result = Reflect.get(target, key, recevier);
    // -->如果是对象，深度代理
    if (MyIsObject(result)) {
      return reactive(result);
    }
    return result;
  },
  set(target, key, newVal, recevier) {
    const oldVal = target[key];
    const result = Reflect.set(target, key, newVal, recevier);
    if (oldVal !== newVal) {
      trigger(target, 'set', key);
    }
    return result;
  },
};
