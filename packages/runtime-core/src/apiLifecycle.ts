import { currentInstance, setCurrentInstance } from './component';

export const enum lifecycleHooks {
  BEFORE_CREATE = 'beforeCreate',
  CREATED = 'created',
  BEFORE_MOUNT = 'beforeMount',
  MOUNTED = 'mounted',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATED = 'updated',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNTED = 'unmounted',
}

// -->工厂模式生成生命周期

function createHook(lifecycle) {
  return function (hook, target = currentInstance) {
    // --> 生命周期就是给实例绑定属性队列，在对应步骤调用,所以我们首先需要获取实例
    const hooks = target[lifecycle] || (target[lifecycle] = []); //-->队列，存储每个生命周期的钩子

    // hooks.push(hook)  //-->存储生命周期函数，稍后在对应步骤调用
    const wrappedHook = () => {
      setCurrentInstance(target); //-->解决调用钩子前获取不到instance问题
      hook();
      setCurrentInstance(null);
    };

    hooks.push(wrappedHook);
  };
}

export const onBeforeMount = createHook(lifecycleHooks.BEFORE_MOUNT);
export const onBeforeUpdate = createHook(lifecycleHooks.BEFORE_UPDATE);
export const onMounted = createHook(lifecycleHooks.MOUNTED);
export const onUpdated = createHook(lifecycleHooks.UPDATED);
export const onBeforeUnmount = createHook(lifecycleHooks.BEFORE_UNMOUNT);
export const onUnmounted = createHook(lifecycleHooks.UNMOUNTED);
