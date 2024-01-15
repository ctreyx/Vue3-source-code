import { MyIsObject } from '@vue/shared';
import { createVnode, isVnode } from './vnode';

export function h(type, propsChildren?, children?) {
  const l = arguments.length;
  //  --> 长度为2,第二个可能是props,可能是孩子
  // h('div',{style:{'color':'red'}})
  // h('div',h('span'))
  // h('div',[h('span'),h('span')])

  if (l === 2) {
    // 1-->如果是对象不是数组-->可能是props,可能是节点
    if (MyIsObject(propsChildren) && !Array.isArray(propsChildren)) {
      // 2-->如果第二个是h函数，代表虚拟节点，放进数组，元素循环创建

      if (isVnode(propsChildren)) {
        return createVnode(type, null, [propsChildren]);
      }
      // 3-->第二个是props
      return createVnode(type, propsChildren);
    }
    // -->下面的就是数组或者文本
    else {
      return createVnode(type, null, propsChildren);
    }
  } else {
    if (l > 3) {
      //-->大于3，除了前三个外后面都是儿子
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      // h('div',{},h('span')),将儿子包装成数组
      children = [children];
    }
    return createVnode(type, propsChildren, children);
  }
}
