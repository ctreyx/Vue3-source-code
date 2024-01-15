import { MyIsFunction } from '.';
import { ReactiveEffect, tarckEffect, triggerEffect } from './effect';

class ComputedRefImpl {
  public effect; //-->缓存的值
  public _value;
  public _dirty = true; //-->脏值
  public __v_isReadonly = true;
  public __v_isRef = true;
  public dep = new Set();
  constructor(public getter, public setter) {
    // -->计算属性基于effect与调度器实现，当依赖更新触发trigger调用schedule
    this.effect = new ReactiveEffect(getter, () => {
      console.log('sc');

      // -->监听的值更新，调用schedule
      if (!this._dirty) {
        this._dirty = true;
        // -->刷新试图
        triggerEffect(this.dep);
      }
    });
  }
  // -->类中的属性访问器，底层是object.defineProperty
  get value() {
    //   -->收集依赖，借鉴track
    tarckEffect(this.dep);
    // 判断脏值-->返回计算属性的值，计算属性代理为effect
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newVal) {
    this.setter(newVal); //--》直接将新值抛给setter函数
  }
}

export const computed = getterOrOptions => {
  // 1-->传入函数是getter没有setter,传入对象getter,setter
  const onlyGetter = MyIsFunction(getterOrOptions);
  let getter, setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
      console.warn('该计算属性只有getter,没有setter');
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
};
