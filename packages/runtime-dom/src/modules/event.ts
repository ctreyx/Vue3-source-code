function createInvoker(callback) {
  const invoker = e => invoker.value(e);
  invoker.value = callback; //-->**典型的换绑事件，通过替换绑定实现更新事件**
  return invoker;
}

export function patchEvent(el, eventName, nextValue) {
  // -->思路:如果直接remove老的再add新的，性能消耗大。所以考虑绑定自定义事件
  // -->add=()=>callback() , 这样不需要remove，修改里面callback即可
  // -->我们需要考虑3种情况：1.第一次绑定没有缓存 2.有缓存且有新值 3.有缓存但新值为空需要删除

  // 1-->Vue在每个el身上绑定了缓存事件_vei
  let invokers = el._vel || (el._vei = {});
  let exits = invokers[eventName]; //-->查看是否缓存过
  let event = eventName.slice(2).toLowerCase(); //-->去掉on前缀

  // 如果有缓存,进行换绑操作
  if (exits && nextValue) {
    exits.value = nextValue;
  }
  // 如果没有缓存，需要创建自定义事件
  else {
    if (nextValue) {
      const invoker = (invokers[eventName] = createInvoker(nextValue));
      // -->绑定事件
      el.addEventListener(event, invoker);
    }
    // -->如果之前绑定过事件，但是新传入的值是null,就删除
    else if (exits) {
      el.removeEventListener(event, exits);
      invokers[eventName] = undefined;
    }
  }
}
