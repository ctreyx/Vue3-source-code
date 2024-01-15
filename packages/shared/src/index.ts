export function MyIsObject(value: any): value is object {
  return typeof value === 'object' && value !== null;
}

export function MyIsFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function MyIsString(value: any): value is string {
  return typeof value === 'string';
}

export function MyIsNumber(value: any): value is string {
  return typeof value === 'number';
}

// -->查看对象身上是否有某属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (value, key) => hasOwnProperty.call(value, key);

// -->调用生命周期函数
export const invokeArrayFunc = arr => {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (MyIsFunction(item)) {
      item();
    }
  }
};

export const enum ShapeFlags { //vue3提供的形状标识，位运算
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1, //<<作用是向左移动一位，从001变成010,得出2
  STAEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPOENT = ShapeFlags.STAEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}

export const enum PatchFlags {
  TEXT = 1, // 动态文字内容

  CLASS = 1 << 1, // 动态 class

  STYLE = 1 << 2, // 动态样式

  PROPS = 1 << 3, // 动态 props

  FULL_PROPS = 1 << 4, // 有动态的key，需要完整diff

  HYDRATE_EVENTS = 1 << 5, // 合并事件，挂载事件

  STABLE_FRAGMENT = 1 << 6, // children 顺序确定的 fragment

  KEYED_FRAGMENT = 1 << 7, // children中有带有key的节点的fragment

  UNKEYED_FRAGMENT = 1 << 8, // 没有key的children的fragment

  NEED_PATCH = 1 << 9, // 只有非props需要patch的，比如`ref`

  DYNAMIC_SLOTS = 1 << 10, // 动态的插槽

  // SPECIAL FLAGS -------------------------------------------------------------

  // 以下是特殊的flag，不会在优化中被用到，是内置的特殊flag
  DEV_ROOT_FRAGMENT = 1 << 1,
  // 表示他是静态节点，他的内容永远不会改变，对于hydrate的过程中，不会需要再对其子节点进行diff
  HOISTED = -1,
  // 用来表示一个节点的diff应该结束
  BAIL = -2,
}
/* 

1 --> | 代表计算，比如 1 0 0 ,是4，0 1 0 是2，、通过计算，每一位包含1的，就得出了这个数字
答案：1 1 0,代表6

2 --> & 是计算有没有包含，比如element是001,COMPOENT是110，如果对应的值一个不是1就是0
答案:得出不包含


*/
