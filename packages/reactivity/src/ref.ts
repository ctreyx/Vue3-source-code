import { MyIsObject, reactive } from '.';
import { tarckEffect, triggerEffect } from './effect';
import { isReactive } from './reactive';

function toReactive(value) {
  // -->如果是对象，需要转为响应式
  return MyIsObject(value) ? reactive(value) : value;
}

class RefImpl {
  public __v_isRef = true;
  public __v_isShallow = true;
  public _value;
  public dep = new Set();
  constructor(public _rawValue) {
    this._value = toReactive(this._rawValue); //初始化值,如果是对象,递归proxy
  }
  get value() {
    //   -->和computed一样，收集依赖
    tarckEffect(this.dep);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this._rawValue) {
      // -->新值也需要转换为proxy
      this._value = toReactive(newValue);
      this._rawValue = newValue;
      //   -->触发依赖
      triggerEffect(this.dep);
    }
  }
}

//1-->ref就是将对象或者非对象new实例，然后收集触发依赖
export function ref(value) {
  return new RefImpl(value);
}

/*      toRefs        */

// ObjectRefImpl-->只是将.value属性代理到原始类型上
class ObjectRefImpl {
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}
export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

// -->toRefs就是将reactive响应式转为ref实例的方法
export function toRefs(object) {
  // -->判断是不是reactive,不是给出提示
  if (!isReactive(object)) {
    console.warn(
      'toRefs 只接受reactive响应值,vue.global.js:1501 toRefs() expects a reactive object but received a plain one.'
    );
  }

  // 1-->可以传入数据与对象，然后便利
  const result = Array.isArray(object) ? new Array(object.length) : {};
  // 2-->遍历里面每个值，转为ref
  for (let key in object) {
    result[key] = toRef(object, key);
  }

  return result;
}

/*   proxyRefs       */
// 将ref实例转为proxy,不需要通过.value访问，反向转换
export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, recevier) {
      const r = Reflect.get(target, key, recevier);

      // -->判断是不是ref值，省去.value步骤
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, newVal, recevier) {
      const oldValue = Reflect.get(target, key, recevier);
      //  -->判断老值是不是ref
      if (oldValue.__v_isRef) {
        oldValue.value = newVal;
        return true;
      } else {
        const r = Reflect.set(target, key, newVal, recevier);

        return r;
      }
    },
  });
}
