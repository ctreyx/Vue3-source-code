// 发布订阅模式
export function addSubscriber(subscription, cb) {
  //  1-->将发布存起来
  subscription.push(cb);
  // 2-->返回一个清除方法
  return function removeSubscription() {
    const indx = subscription.indexOf(cb);
    if (indx > -1) {
      subscription.splice(indx, 1);
    }
  };
}

export function triggerSubscribers(subscription, ...args) {
  subscription.forEach((cb) => cb(...args));
}
