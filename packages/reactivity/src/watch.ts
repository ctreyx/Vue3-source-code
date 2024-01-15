import { MyIsObject, MyIsFunction } from '.';
import { ReactiveEffect } from './effect';
import { isReactive } from './reactive';

function traversal(value, set = new Set()) {
  // 1-->终结条件：不是对象退出
  if (!MyIsObject(value)) return value;

  // 2.-->避免循环引用，检查是否已经访问过
  if (set.has(value)) return value;

  set.add(value);
  for (let key in value) {
    traversal(value[key], set);
  }

  return value;
}
export function watch(source, cb) {
  let getter;
  let oldValue;
  // 1-->判断传入的source是不是响应式,然后转为函数
  if (isReactive(source)) {
    getter = () => traversal(source); //-->需要递归触发get收集
  } else if (MyIsFunction(source)) {
    getter = source;
  }
  let cleanup;
  const onCleanup = (fn) => {
    cleanup = fn;
  };

  const job = () => {
    if (cleanup) {
      cleanup();
    }
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanup); //-->cb就是watch传入的第二个回调
    oldValue = newValue;
  };
  const effect = new ReactiveEffect(getter, job);
  oldValue = effect.run(); //-->返回监控的值
}
