var VueRuntimeDOM = (() => {
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

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    KeepAlive: () => KeepAliveImpl,
    MyIsFunction: () => MyIsFunction,
    MyIsObject: () => MyIsObject,
    ReactiveEffect: () => ReactiveEffect,
    Teleport: () => Teleport,
    Text: () => Text,
    computed: () => computed,
    createComponentInstance: () => createComponentInstance,
    createElementBlock: () => createElementBlock,
    createElementVNode: () => createVnode,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    currentInstance: () => currentInstance,
    defineAsyncComponent: () => defineAsyncComponent,
    effect: () => effect,
    effectScope: () => effectScope,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    inject: () => inject,
    isSameVnode: () => isSameVnode,
    isTeleport: () => isTeleport,
    isVnode: () => isVnode,
    lifecycleHooks: () => lifecycleHooks,
    onBeforeMount: () => onBeforeMount,
    onBeforeUnmount: () => onBeforeUnmount,
    onBeforeUpdate: () => onBeforeUpdate,
    onMounted: () => onMounted,
    onUnmounted: () => onUnmounted,
    onUpdated: () => onUpdated,
    openBlock: () => openBlock,
    provide: () => provide,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    recordEffectScope: () => recordEffectScope,
    ref: () => ref,
    render: () => render,
    renderComponent: () => renderComponent,
    setCurrentInstance: () => setCurrentInstance,
    setupComponent: () => setupComponent,
    toDisplayString: () => toDisplayString,
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
  function MyIsString(value) {
    return typeof value === 'string';
  }
  function MyIsNumber(value) {
    return typeof value === 'number';
  }
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (value, key) => hasOwnProperty.call(value, key);
  var invokeArrayFunc = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (MyIsFunction(item)) {
        item();
      }
    }
  };

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

  // packages/runtime-core/src/componentProps.ts
  function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};
    const options = instance.propsOptions || {};
    if (rawProps) {
      for (let key in rawProps) {
        const value = rawProps[key];
        if (hasOwn(options, key)) {
          props[key] = value;
        } else {
          attrs[key] = value;
        }
      }
    }
    instance.props = reactive(props);
    instance.attrs = attrs;
    if (instance.vnode.shapeFlag & 2 /* FUNCTIONAL_COMPONENT */) {
      instance.props = instance.attrs;
    }
  }
  function hasPropsChanged(prevProps, nextProps) {
    const preKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps || {});
    if (preKeys.length !== nextKeys.length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (prevProps[key] !== nextProps[key]) {
        return true;
      }
    }
    return false;
  }
  function updateProps(preProps = {}, nextProps = {}) {
    if (hasPropsChanged(preProps, nextProps)) {
      for (const key in nextProps) {
        preProps[key] = nextProps[key];
      }
      for (const key in preProps) {
        if (!hasOwn(nextProps, key)) {
          delete preProps[key];
        }
      }
    }
  }

  // packages/runtime-core/src/component.ts
  var currentInstance = null;
  var setCurrentInstance = (instance) => (currentInstance = instance);
  var getCurrentInstance = () => currentInstance;
  function createComponentInstance(vnode, parent) {
    const instance = {
      ctx: {},
      provides: parent ? parent.provides : /* @__PURE__ */ Object.create(null),
      parent,
      vnode,
      data: null,
      subTree: null,
      isMounted: false,
      update: null,
      propsOptions: vnode.type.props || {},
      props: {},
      attrs: {},
      proxy: null,
      render: null,
      setupState: null,
      slots: {},
    };
    return instance;
  }
  var publicPropertyMap = {
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots,
  };
  var publicInstanceProxyHandlers = {
    get(target, key) {
      const { data, props, setupState } = target;
      if (data && hasOwn(data, key)) {
        return data[key];
      } else if (setupState && hasOwn(setupState, key)) {
        return setupState[key];
      } else if (props && hasOwn(props, key)) {
        return props[key];
      }
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
        console.warn('attemptiong to mutate prop ' + key);
        return false;
      }
      return true;
    },
  };
  function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
      instance.slots = children;
    }
  }
  function setupComponent(instance) {
    let { props, type, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    instance.proxy = new Proxy(instance, publicInstanceProxyHandlers);
    let data = type.data;
    if (data) {
      if (!MyIsFunction(data)) {
        return console.warn('data\u5FC5\u987B\u662F\u51FD\u6570');
      }
      instance.data = reactive(data.call(instance.proxy));
    }
    const setup = type.setup;
    if (setup) {
      const setupContext = {
        emit: (event, ...args) => {
          console.log(event[0].toUpperCase(), ...args);
          const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`;
          const handler = instance.vnode.props[eventName];
          handler && handler(...args);
        },
        attrs: instance.attrs,
        slots: instance.slots,
      };
      setCurrentInstance(instance);
      const setupResult = setup(instance.props, setupContext);
      setCurrentInstance(null);
      if (MyIsFunction(setupResult)) {
        instance.render = setupResult;
      } else if (MyIsObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
      }
    }
    if (!instance.render) {
      instance.render = type.render;
    }
  }
  function renderComponent(instance) {
    const { vnode, render: render2, props } = instance;
    if (vnode.shapeFlag & 4 /* STAEFUL_COMPONENT */) {
      return render2.call(instance.proxy, instance.proxy);
    } else {
      return vnode.type(props);
    }
  }

  // packages/runtime-core/src/apiLifecycle.ts
  var lifecycleHooks = /* @__PURE__ */ ((lifecycleHooks2) => {
    lifecycleHooks2['BEFORE_CREATE'] = 'beforeCreate';
    lifecycleHooks2['CREATED'] = 'created';
    lifecycleHooks2['BEFORE_MOUNT'] = 'beforeMount';
    lifecycleHooks2['MOUNTED'] = 'mounted';
    lifecycleHooks2['BEFORE_UPDATE'] = 'beforeUpdate';
    lifecycleHooks2['UPDATED'] = 'updated';
    lifecycleHooks2['BEFORE_UNMOUNT'] = 'beforeUnmount';
    lifecycleHooks2['UNMOUNTED'] = 'unmounted';
    return lifecycleHooks2;
  })(lifecycleHooks || {});
  function createHook(lifecycle) {
    return function (hook, target = currentInstance) {
      const hooks = target[lifecycle] || (target[lifecycle] = []);
      const wrappedHook = () => {
        setCurrentInstance(target);
        hook();
        setCurrentInstance(null);
      };
      hooks.push(wrappedHook);
    };
  }
  var onBeforeMount = createHook('beforeMount' /* BEFORE_MOUNT */);
  var onBeforeUpdate = createHook('beforeUpdate' /* BEFORE_UPDATE */);
  var onMounted = createHook('mounted' /* MOUNTED */);
  var onUpdated = createHook('updated' /* UPDATED */);
  var onBeforeUnmount = createHook('beforeUnmount' /* BEFORE_UNMOUNT */);
  var onUnmounted = createHook('unmounted' /* UNMOUNTED */);

  // packages/runtime-core/src/components/Teleport.ts
  var Teleport = {
    __isTeleport: true,
    process(n1, n2, container, internals) {
      let { mountChildren, patchChildren, move } = internals;
      if (!n1) {
        const target = document.querySelector(n2.props.to);
        if (target) {
          mountChildren(n2.children, target);
        }
      } else {
        patchChildren(n1, n2, container);
        if (n1.props.to !== n2.props.to) {
          const nextTarget = document.querySelector(n2.props.to);
          n2.child.forEach((child) => move(child, nextTarget));
        }
      }
    },
  };
  var isTeleport = (type) => type.__isTeleport;

  // packages/runtime-core/src/vnode.ts
  function isVnode(value) {
    return !!(value && value.__v_isVnode);
  }
  var Text = Symbol('Text');
  var Fragment = Symbol('Fragment');
  var isSameVnode = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };
  function createVnode(type, props, children = null, patchFlag = 0) {
    let shapeFlag = MyIsString(type)
      ? 1 /* ELEMENT */
      : isTeleport(type)
      ? 64 /* TELEPORT */
      : MyIsFunction(type)
      ? 2 /* FUNCTIONAL_COMPONENT */
      : MyIsObject(type)
      ? 4 /* STAEFUL_COMPONENT */
      : 0;
    const vnode = {
      type,
      props,
      children,
      el: null,
      key: props == null ? void 0 : props['key'],
      __v_isVnode: true,
      shapeFlag,
      patchFlag,
    };
    if (children) {
      let type2 = 0;
      if (Array.isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else if (MyIsObject(children)) {
        type2 = 32 /* SLOTS_CHILDREN */;
      } else {
        children = children.toString();
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag |= type2;
    }
    if (currentBlock && vnode.patchFlag > 0) {
      currentBlock.push(vnode);
    }
    return vnode;
  }
  var currentBlock = null;
  function openBlock() {
    currentBlock = [];
  }
  function createElementBlock(type, props, children, patchFlag) {
    const vnode = createVnode(type, props, children, patchFlag);
    return setupBlock(vnode);
  }
  function setupBlock(vnode) {
    vnode.dynamicChildren = currentBlock;
    currentBlock = null;
    return vnode;
  }
  function toDisplayString(val) {
    return MyIsString(val)
      ? val
      : val == null
      ? ''
      : MyIsObject(val)
      ? JSON.stringify(val)
      : String(val);
  }

  // packages/runtime-core/src/components/KeepAlive.ts
  function resetShapeFlag(vnode) {
    let shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
      shapeFlag -= 512 /* COMPONENT_KEPT_ALIVE */;
    }
    if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
      shapeFlag -= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
    }
    vnode.shapeFlag = shapeFlag;
  }
  var KeepAliveImpl = {
    name: 'KeepAlive',
    __isKeepAlive: true,
    props: {
      include: {},
      exclude: {},
    },
    setup(props, { slots }) {
      const keys = /* @__PURE__ */ new Set();
      const cache = /* @__PURE__ */ new Map();
      let pendingCaheKey = null;
      const instance = getCurrentInstance();
      function cacheSubtree() {
        if (pendingCaheKey) {
          cache.set(pendingCaheKey, instance.subTree);
        }
      }
      onMounted(cacheSubtree);
      onUpdated(cacheSubtree);
      const { move, createElement } = instance.ctx.renderer;
      const storageContainer = createElement('div');
      instance.ctx.deactivate = (vnode) => {
        move(vnode, storageContainer);
      };
      instance.ctx.activate = (vnode, container, anchor) => {
        move(vnode, container, anchor);
      };
      let current = null;
      function pruneCacheEntry(key) {
        resetShapeFlag(current);
        keys.delete(key);
        cache.delete(key);
      }
      const { include, exclude, max } = props;
      return () => {
        let vnode = slots.default ? slots.default() : null;
        if (
          !isVnode(vnode) ||
          !((vnode.shapeFlag & 4) /* STAEFUL_COMPONENT */)
        ) {
          return vnode;
        }
        const comp = vnode.type;
        let key = vnode.key == null ? comp : vnode.key;
        const name = comp.name;
        if (
          (name && include && !include.split(',').includes(name)) ||
          (exclude && exclude.split(',').includes(name))
        ) {
          return vnode;
        }
        const cacheVnode = cache.get(key);
        if (cacheVnode) {
          vnode.component = cacheVnode.component;
          vnode.shapeFlag |= 512 /* COMPONENT_KEPT_ALIVE */;
          keys.delete(key);
          keys.add(key);
        } else {
          keys.add(key);
          pendingCaheKey = key;
          if (props.max && keys.size > props.max) {
            pruneCacheEntry(keys.values().next().value);
          }
        }
        current = vnode;
        vnode.shapeFlag |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
        return vnode;
      };
    },
  };
  var isKeepAlive = (vnode) => vnode.type.__isKeepAlive;

  // packages/runtime-core/src/scheduler.ts
  var queue = [];
  var isFlugsing = false;
  var resolvePromise = Promise.resolve();
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!isFlugsing) {
      isFlugsing = true;
      resolvePromise.then(() => {
        isFlugsing = false;
        let copy = queue.slice(0);
        queue.length = 0;
        for (let i = 0; i < copy.length; i++) {
          let job2 = copy[i];
          job2();
        }
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core/src/sequence.ts
  function getSequence(arr) {
    const len = arr.length;
    const result = [0];
    let start, end, middle;
    let resultLastIndex;
    const p = arr.slice(0);
    for (let i2 = 0; i2 < len; i2++) {
      let arrI = arr[i2];
      if (arrI !== 0) {
        resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          result.push(i2);
          p[i2] = resultLastIndex;
          continue;
        }
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arr[result[end]] > arrI) {
        result[end] = i2;
        p[i2] = result[end - 1];
      }
    }
    let i = result.length;
    let last = result[i - 1];
    while (i-- > 0) {
      result[i] = last;
      last = p[last];
    }
    return result;
  }

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
    const {
      insert: hostInsert,
      remove: hostRemove,
      setElementText: hostSetElementText,
      setText: hostSetText,
      querySelector: hostQuerySelector,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      createElement: hostCreateElement,
      createText: hostCreateText,
      patchProp: hostPatchProp,
    } = renderOptions2;
    const processText = (n1, n2, container) => {
      if (n1 == null) {
        const text = (n2.el = hostCreateText(n2.children));
        hostInsert(text, container);
      } else {
        const el = (n2.el = n1.el);
        if (n1.children !== n2.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const normalize = (children, i) => {
      if (MyIsString(children[i]) || MyIsNumber(children[i])) {
        const vnode = createVnode(Text, null, children[i]);
        children[i] = vnode;
      }
      return children[i];
    };
    const mountChildren = (children, container, parentComponent) => {
      for (let i = 0; i < children.length; i++) {
        let child = normalize(children, i);
        patch(null, child, container, parentComponent);
      }
    };
    const mountElement = (vnode, container, anchor, parentComponent) => {
      const { type, props, children, shapeFlag } = vnode;
      const el = (vnode.el = hostCreateElement(type));
      if (props) {
        for (const key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent);
      }
      hostInsert(el, container, anchor);
    };
    const unmountChildren = (children, parentComponent) => {
      children.forEach((child) => {
        unmount(child, parentComponent);
      });
    };
    const patchKeyedChildren = (c1, c2, el, parentComponent) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          while (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i], parentComponent);
            i++;
          }
        }
      }
      let s1 = i;
      let s2 = i;
      const keyToOldIndexMap = /* @__PURE__ */ new Map();
      for (let i2 = s2; i2 <= e2; i2++) {
        const newChild = c2[i2];
        keyToOldIndexMap.set(newChild.key, i2);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const oldChild = c1[i2];
        const newIndex = keyToOldIndexMap.get(oldChild.key);
        if (newIndex == void 0) {
          unmount(oldChild, parentComponent);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
          patch(oldChild, c2[newIndex], el);
        }
      }
      let increment = getSequence(newIndexToOldIndexMap);
      let j = increment.length - 1;
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        const index = i2 + s2;
        const current = c2[index];
        let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (newIndexToOldIndexMap[i2] === 0) {
          patch(null, current, el, anchor);
        } else {
          if (i2 != increment[j]) {
            hostInsert(current.el, el, anchor);
          } else {
            j--;
          }
        }
      }
    };
    const patchChildren = (n1, n2, el, parentComponent) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const preShapeFlag = n1.shapeFlag;
      const newShapeFlag = n2.shapeFlag;
      if (newShapeFlag & 8 /* TEXT_CHILDREN */) {
        if (preShapeFlag & 16 /* ARRAY_CHILDREN */) {
          for (let i = 0; i < c1.length; i++) {
            unmountChildren(c1, parentComponent);
          }
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (preShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (newShapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, el, parentComponent);
          } else {
            unmountChildren(c1, parentComponent);
          }
        } else {
          if (preShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, '');
          }
          if (newShapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el, parentComponent);
          }
        }
      }
    };
    const patchProps = (oldProps, newProps, el) => {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (const key in oldProps) {
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    };
    const patchBlockChildren = (n1, n2, parentComponent) => {
      for (let i = 0; i < n2.dynamicChildren.length; i++) {
        patchElement(
          n1.dynamicChildren[i],
          n2.dynamicChildren[i],
          null,
          parentComponent
        );
      }
    };
    const patchElement = (n1, n2, container, parentComponent) => {
      const el = (n2.el = n1.el);
      const oldProps = n1.props || {};
      const newProps = n2.props || {};
      let { patchFlag } = n2;
      if (patchFlag & 2 /* CLASS */) {
        hostPatchProp(el, 'class', null, newProps.class);
      } else {
        patchProps(oldProps, newProps, el);
      }
      if (n2.dynamicChildren) {
        patchBlockChildren(n1, n2, parentComponent);
      } else {
        patchChildren(n1, n2, el, parentComponent);
      }
    };
    const processElement = (n1, n2, container, anchor, parentComponent) => {
      if (n1 == null) {
        mountElement(n2, container, anchor, parentComponent);
      } else {
        patchElement(n1, n2, container, parentComponent);
      }
    };
    const processFragment = (n1, n2, container, parentComponent) => {
      if (n1 == null) {
        mountChildren(n2.children, container, parentComponent);
      } else {
        patchChildren(n1.children, n2.children, container, parentComponent);
      }
    };
    const updateComponentPreRender = (instance, next) => {
      instance.next = null;
      instance.vnode = next;
      updateProps(instance.props, next.props);
      Object.assign(instance.slots, next.children);
    };
    const mountComponent = (vnode, container, anchor, parentComponent) => {
      let instance = (vnode.component = createComponentInstance(
        vnode,
        parentComponent
      ));
      if (isKeepAlive(vnode)) {
        instance.ctx.renderer = {
          createElement: hostCreateElement,
          move(vnode2, container2) {
            hostInsert(vnode2.component.subTree.el, container2);
          },
        };
      }
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    function setupRenderEffect(instance, container, anchor) {
      const { render: render3 } = instance;
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          const { beforeMount, mounted } = instance;
          if (beforeMount) {
            invokeArrayFunc(beforeMount);
          }
          const subTree = renderComponent(instance);
          patch(null, subTree, container, anchor, instance);
          instance.subTree = subTree;
          instance.isMounted = true;
          if (mounted) {
            invokeArrayFunc(mounted);
          }
        } else {
          const { next } = instance;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          const { beforeUpdate, updated } = instance;
          if (beforeUpdate) {
            invokeArrayFunc(beforeUpdate);
          }
          const subTree = renderComponent(instance);
          patch(instance.subTree, subTree, container, anchor, instance);
          if (updated) {
            invokeArrayFunc(updated);
          }
          instance.subTree = subTree;
        }
      };
      const effect2 = new ReactiveEffect(componentUpdateFn, () =>
        queueJob(instance.update)
      );
      let update = (instance.update = effect2.run.bind(effect2));
      update();
    }
    const shouldUpdateComponent = (n1, n2) => {
      const { props: preProps, children: preChildren } = n1;
      const { props: nextProps, children: nextChildren } = n2;
      if (preChildren || nextChildren) {
        return true;
      }
      if (preProps === nextProps) return false;
      if (hasPropsChanged(preProps, nextProps)) {
        return true;
      } else {
        return false;
      }
    };
    const updateComponent = (n1, n2) => {
      const instance = (n2.component = n1.component);
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      }
    };
    const processComponent = (n1, n2, container, anchor, parentComponent) => {
      if (n1 == null) {
        if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
          parentComponent.ctx.activate(n2, container, anchor);
        } else {
          mountComponent(n2, container, anchor, parentComponent);
        }
      } else {
        updateComponent(n1, n2);
      }
    };
    const patch = (
      n1,
      n2,
      container,
      anchor = null,
      parentComponent = null
    ) => {
      if (n1 === n2) return;
      const { type, shapeFlag } = n2;
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1, parentComponent);
        n1 = null;
      }
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container, parentComponent);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 6 /* COMPOENT */) {
            processComponent(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 64 /* TELEPORT */) {
            type.process(n1, n2, container, {
              mountChildren,
              patchChildren,
              move(vnode, container2) {
                hostInsert(
                  vnode.component ? vnode.component.subTree.el : vnode.el,
                  container2
                );
              },
            });
          }
      }
    };
    const unmount = (vnode, parentComponent) => {
      if (vnode.type == Fragment) {
        return unmountChildren(vnode.children, parentComponent);
      } else if (vnode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
        return parentComponent.ctx.deactivate(vnode);
      } else if (vnode.shapeFlag & 6 /* COMPOENT */) {
        return unmount(vnode.component.subTree, null);
      }
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (vnode == null) {
        if (container._vnode) {
          unmount(container._vnode, null);
        }
      } else {
        patch(container._vnode, vnode, container);
      }
      container._vnode = vnode;
    };
    return { render: render2 };
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsChildren, children) {
    const l = arguments.length;
    if (l === 2) {
      if (MyIsObject(propsChildren) && !Array.isArray(propsChildren)) {
        if (isVnode(propsChildren)) {
          return createVnode(type, null, [propsChildren]);
        }
        return createVnode(type, propsChildren);
      } else {
        return createVnode(type, null, propsChildren);
      }
    } else {
      if (l > 3) {
        children = Array.prototype.slice.call(arguments, 2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsChildren, children);
    }
  }

  // packages/runtime-core/src/apiInject.ts
  function provide(key, value) {
    if (!currentInstance) return;
    let parentProvides =
      currentInstance.parent && currentInstance.parent.provides;
    let provides = currentInstance.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(provides);
    }
    provides[key] = value;
  }
  function inject(key) {
    if (!currentInstance) return;
    const provides = currentInstance.parent && currentInstance.parent.provides;
    if (provides && key in provides) {
      return provides[key];
    }
  }

  // packages/runtime-core/src/defineAsyncComponent.ts
  function defineAsyncComponent(options) {
    if (MyIsFunction(options)) {
      options = { loader: options };
    }
    return {
      setup() {
        let loaded = ref(false);
        let error = ref(false);
        let loading = ref(false);
        let {
          loader,
          timeout,
          errorComponent,
          delay,
          loadingComponent,
          onError,
        } = options;
        let Comp = null;
        const load = () => {
          return loader().catch((err) => {
            if (onError) {
              return new Promise((resolve, reject) => {
                const retry = () => resolve(load());
                const fail = () => reject(err);
                onError(err, retry, fail);
              });
            }
          });
        };
        load()
          .then((res) => {
            Comp = res;
            loaded.value = true;
          })
          .catch((err) => (error.value = err))
          .finally(() => (loading.value = false));
        setTimeout(() => {
          error.value = true;
        }, timeout);
        if (delay) {
          setTimeout(() => {
            loading.value = true;
          }, delay);
        }
        return () => {
          if (loaded.value) {
            return h(Comp);
          } else if (error.value && errorComponent) {
            return h(errorComponent);
          } else if (loading.value && loadingComponent) {
            return h(loadingComponent);
          }
          return h(Fragment, []);
        };
      },
    };
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parent = child.parentNode;
      if (parent) {
        parent.removeChild(child);
      }
    },
    setElementText(element, text) {
      element.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    },
    createElement(tag) {
      return document.createElement(tag);
    },
    createText(text) {
      return document.createTextNode(text);
    },
  };

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (nextValue == null) {
      el.removeAttribute('class');
    } else {
      el.className = nextValue;
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vel || (el._vei = {});
    let exits = invokers[eventName];
    let event = eventName.slice(2).toLowerCase();
    if (exits && nextValue) {
      exits.value = nextValue;
    } else {
      if (nextValue) {
        const invoker = (invokers[eventName] = createInvoker(nextValue));
        el.addEventListener(event, invoker);
      } else if (exits) {
        el.removeEventListener(event, exits);
        invokers[eventName] = void 0;
      }
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, preValue, nextValue = {}) {
    for (let key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (preValue) {
      for (let key in preValue) {
        if (!nextValue[key]) {
          el.style[key] = null;
        }
      }
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, preValue, nextValue) {
    if (key === 'class') {
      patchClass(el, nextValue);
    } else if (key === 'style') {
      patchStyle(el, preValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
