export function patchStyle(el, preValue, nextValue = {}) {
  // 1-->将新值覆盖
  for (let key in nextValue) {
    el.style[key] = nextValue[key];
  }

  // 2-->如果老的身上有多余的属性，需删除
  if (preValue) {
    for (let key in preValue) {
      // if (nextValue[key] == null) {
      if (!nextValue[key]) {
        el.style[key] = null;
      }
    }
  }
}
