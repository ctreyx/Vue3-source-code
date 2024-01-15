import { effectScope, markRaw, ref } from 'vue';
import { symbolPinia } from './rootStore';

export function createPinia() {
  const scope = effectScope(true);
  const state = scope.run(() => ref({})); //-->定义全部状态
  const _p = []; //-->定义插件
  // -->install的作用就是将pinia注册到app
  const pinia = markRaw({
    //markRaw-->避免重复proxy
    install(app) {
      pinia._a = app; //-->挂载全局app到pinia,方便使用
      //1-->将pinia实例注册到app全局
      app.provide(symbolPinia, pinia);
      app.config.globalProperties.$pinia = pinia; //-->兼容vue2
    },
    use(plugin) {
      // -->插件原理，发布订阅
      _p.push(plugin);
      return this;
    },
    _p,
    _a: null,
    state, //-->完整状态
    _e: scope, //-->用来管理整个应用
    _s: new Map(), //-->存储所有store
  });

  return pinia;
}
