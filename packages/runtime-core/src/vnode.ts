import { MyIsFunction, MyIsObject, MyIsString, ShapeFlags } from '@vue/shared';
import { isTeleport } from './components/Teleport';

// -->判断是是不是虚拟节点

export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}

export const Text = Symbol('Text'); //-->单独处理文本的symbol
export const Fragment = Symbol('Fragment'); //-->单独处理fragment的symbol

export const isSameVnode = (n1, n2) => {
  // -->判断是否同一节点，key和type
  return n1.type === n2.type && n1.key === n2.key;
};

export function createVnode(type, props, children = null, patchFlag = 0) {
  // --> type可以是组件，元素，文本，多样性。这里假设type是字符串
  let shapeFlag = MyIsString(type)
    ? ShapeFlags.ELEMENT
    : isTeleport(type) //-->判断是不是teleport
    ? ShapeFlags.TELEPORT
    : MyIsFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : MyIsObject(type)
    ? ShapeFlags.STAEFUL_COMPONENT //-->如果是对象，STAEFUL代表有状态的组件
    : 0;

  // -->虚拟dom,优势:1.可以跨平台，真实dom元素太多
  const vnode = {
    type,
    props,
    children,
    el: null, //-->真实dom,利于diff
    key: props?.['key'],
    __v_isVnode: true, //-->虚拟节点标识，不做响应式处理
    shapeFlag, //-->判断节点类型，后面渲染时需要
    patchFlag, //-->靶向更新，更新类型
  };

  if (children) {
    let type = 0;
    if (Array.isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN; //-->如果是数组，就是数组子节点
    } else if (MyIsObject(children)) {
      // -->插槽chilren是一个对象，包含插槽名和插槽内容
      type = ShapeFlags.SLOTS_CHILDREN;
    } else {
      children = children.toString();
      type = ShapeFlags.TEXT_CHILDREN; //-->如果是字符串，就是文本子节点
    }
    // -->通过 | 计算出类型
    vnode.shapeFlag |= type;
  }

  // -->靶向更新收集
  if (currentBlock && vnode.patchFlag > 0) {
    currentBlock.push(vnode);
  }

  return vnode;
}

// -->靶向更新

let currentBlock = null;
export function openBlock() {
  currentBlock = [];
}

export function createElementBlock(type, props, children, patchFlag) {
  //patchFlag-->表示是文本变，还是事件变
  const vnode = createVnode(type, props, children, patchFlag);

  return setupBlock(vnode);
}

function setupBlock(vnode) {
  vnode.dynamicChildren = currentBlock;
  currentBlock = null;
  return vnode;
}
export { createVnode as createElementVNode };

export function toDisplayString(val) {
  return MyIsString(val)
    ? val
    : val == null
    ? ''
    : MyIsObject(val)
    ? JSON.stringify(val)
    : String(val);
}
