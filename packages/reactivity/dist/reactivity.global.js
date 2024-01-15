var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if ((from && typeof from === 'object') || typeof from === 'function') {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, {
            get: () => from[key],
            enumerable:
              !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
          });
    }
    return to;
  };
  var __toCommonJS = (mod) =>
    __copyProps(__defProp({}, '__esModule', { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    MyIsFunction: () => MyIsFunction,
    MyIsObject: () => MyIsObject,
    ReactiveEffect: () => ReactiveEffect,
    computed: () => computed,
    effect: () => effect,
    effectScope: () => effectScope,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    recordEffectScope: () => recordEffectScope,
    ref: () => ref,
    toRef: () => toRef,
    toRefs: () => toRefs,
    watch: () => watch,
  });

  // packages/reactivity/src/effectScope.ts
  var activeEffectsScope = null;
  var EffectScope = class {
    constructor(detached) {
      this.active = true;
      this.parent = null;
      this.effects = [];
      this.scopes = [];
      if (!detached && activeEffectsScope) {
        activeEffectsScope.scopes.push(this);
      }
    }
    run(fn) {
      if (this.active) {
        try {
          this.parent = activeEffectsScope;
          activeEffectsScope = this;
          return fn();
        } finally {
          activeEffectsScope = this.parent;
        }
      }
    }
    stop() {
      if (this.active) {
        for (let i = 0; i < this.effects.length; i++) {
          this.effects[i].stop();
        }
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].stop();
        }
        this.active = false;
      }
    }
  };
  function effectScope(detached = false) {
    return new EffectScope(detached);
  }
  function recordEffectScope(effect2) {
    if (activeEffectsScope && activeEffectsScope.active) {
      activeEffectsScope.effects.push(effect2);
    }
  }

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.deps = [];
      this.parent = void 0;
      recordEffectScope(this);
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = /* @__PURE__ */ new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = /* @__PURE__ */ new Set()));
    }
    tarckEffect(dep);
  }
  function tarckEffect(dep) {
    if (!activeEffect) return;
    const shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
  function trigger(target, type, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    let dep = depsMap.get(key);
    if (dep) {
      triggerEffect(dep);
    }
  }
  function triggerEffect(dep) {
    dep = [...dep];
    dep.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }

  // packages/shared/src/index.ts
  function MyIsObject(value) {
    return typeof value === 'object' && value !== null;
  }
  function MyIsFunction(value) {
    return typeof value === 'function';
  }

  // packages/reactivity/src/baseHandler.ts
  var mutableHandlers = {
    get(target, key, recevier) {
      if (key === '__v_isReactive' /* IS_REACTIVE */) {
        return true;
      }
      track(target, 'get', key);
      const result = Reflect.get(target, key, recevier);
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

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function isReactive(value) {
    return !!(value && value['__v_isReactive' /* IS_REACTIVE */]);
  }
  function reactive(target) {
    if (!MyIsObject(target)) return;
    if (target['__v_isReactive' /* IS_REACTIVE */]) {
      return target;
    }
    let exisitingProxy = reactiveMap.get(target);
    if (exisitingProxy) return exisitingProxy;
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        console.log('sc');
        if (!this._dirty) {
          this._dirty = true;
          triggerEffect(this.dep);
        }
      });
    }
    get value() {
      tarckEffect(this.dep);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newVal) {
      this.setter(newVal);
    }
  };
  var computed = (getterOrOptions) => {
    const onlyGetter = MyIsFunction(getterOrOptions);
    let getter, setter;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn(
          '\u8BE5\u8BA1\u7B97\u5C5E\u6027\u53EA\u6709getter,\u6CA1\u6709setter'
        );
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  };

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!MyIsObject(value)) return value;
    if (set.has(value)) return value;
    set.add(value);
    for (let key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, cb) {
    let getter;
    let oldValue;
    if (isReactive(source)) {
      getter = () => traversal(source);
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
      const newValue = effect2.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return MyIsObject(value) ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(_rawValue) {
      this._rawValue = _rawValue;
      this.__v_isRef = true;
      this.__v_isShallow = true;
      this.dep = /* @__PURE__ */ new Set();
      this._value = toReactive(this._rawValue);
    }
    get value() {
      tarckEffect(this.dep);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this._rawValue) {
        this._value = toReactive(newValue);
        this._rawValue = newValue;
        triggerEffect(this.dep);
      }
    }
  };
  function ref(value) {
    return new RefImpl(value);
  }
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  function toRef(object, key) {
    return new ObjectRefImpl(object, key);
  }
  function toRefs(object) {
    if (!isReactive(object)) {
      console.warn(
        'toRefs \u53EA\u63A5\u53D7reactive\u54CD\u5E94\u503C,vue.global.js:1501 toRefs() expects a reactive object but received a plain one.'
      );
    }
    const result = Array.isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, recevier) {
        const r = Reflect.get(target, key, recevier);
        return r.__v_isRef ? r.value : r;
      },
      set(target, key, newVal, recevier) {
        const oldValue = Reflect.get(target, key, recevier);
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
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
