import { reactive } from '@vue/reactivity';
import { hasOwn, ShapeFlags } from '@vue/shared';

export function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};
  const options = instance.propsOptions || {}; //-->propsOptions是组建注册的props,根据是否注册判断是不是props
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      if (hasOwn(options, key)) {
        // 1-->如果存在，放入props
        props[key] = value;
      } else {
        // 2-->不存在,attrs
        attrs[key] = value;
      }
    }
  }
  // props的响应式是第一层，不能用Reactive。因为props不希望在内部被更新
  // 应该状态保存在父级，父更新才更新，这里应该是shallowReactive
  instance.props = reactive(props);
  instance.attrs = attrs;

  // 函数式组件-->没有props注册，所以他的props就是attrs
  if (instance.vnode.shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT) {
    instance.props = instance.attrs;
  }
}

// -->判断props是否更新
export function hasPropsChanged(prevProps, nextProps) {
  const preKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps || {});
  // 1-->判断个数
  if (preKeys.length !== nextKeys.length) {
    return true;
  }
  // 2-->判断属性
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];

    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }
  return false;
}

// 触发更新方法,版本2
export function updateProps(preProps = {}, nextProps = {}) {
  // -->对比props是否需要更新
  if (hasPropsChanged(preProps, nextProps)) {
    // 1-->循环新的，直接覆盖
    for (const key in nextProps) {
      // preProps[key]不是响应式，不会二次渲染。但instance.props是响应式的
      preProps[key] = nextProps[key];
    }
    // 2-->循环老的，新的没有就删除
    for (const key in preProps) {
      if (!hasOwn(nextProps, key)) {
        delete preProps[key];
      }
    }
  }
}

// 触发更新方法,版本1
// export function updateProps(instance, preProps = {}, nextProps = {}) {
//   // -->对比props是否需要更新
//   if (hasPropsChanged(preProps, nextProps)) {
//     // 1-->循环新的，直接覆盖
//     for (const key in nextProps) {
//       instance.props[key] = nextProps[key];
//     }
//     // 2-->循环老的，新的没有就删除
//     for (const key in instance.props) {
//       if (!hasOwn(nextProps, key)) {
//         delete instance.props[key];
//       }
//     }
//   }
// }
