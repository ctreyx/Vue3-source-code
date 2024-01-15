import { reactive, ReactiveEffect } from '@vue/reactivity';
import {
  hasOwn,
  invokeArrayFunc,
  MyIsNumber,
  MyIsString,
  PatchFlags,
  ShapeFlags,
} from '@vue/shared';
import {
  createComponentInstance,
  renderComponent,
  setupComponent,
} from './component';
import { hasPropsChanged, initProps, updateProps } from './componentProps';
import { isKeepAlive } from './components/KeepAlive';
import { queueJob } from './scheduler';
import { getSequence } from './sequence';
import { createVnode, Fragment, isSameVnode, Text } from './vnode';

export function createRenderer(renderOptions) {
  // -->renderOptions是runtimeDom传入的创建dom方法，我们需要重名
  const {
    // 增 删 改 查
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    querySelector: hostQuerySelector,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp, //-->操作属性方法
  } = renderOptions;

  //4-->单独处理文本
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      const text = (n2.el = hostCreateText(n2.children));
      hostInsert(text, container);
    } else {
      // -->diff文本，就是新老内容交替，节点都是相同的
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  // 需要更新，避免后面diff更新文本没有父节点
  const normalize = (children, i) => {
    if (MyIsString(children[i]) || MyIsNumber(children[i])) {
      //-->如果是文本，将他改为文本类型，那么就没有props,添上 Text symbol标签。
      const vnode = createVnode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  };
  // 3-->渲染子元素,只需用进入patch
  const mountChildren = (children, container, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children, i); //-->解决文本问题，需要转换类型
      patch(null, child, container, parentComponent);
    }
  };

  // 2-->初次渲染节点
  const mountElement = (vnode, container, anchor, parentComponent) => {
    const { type, props, children, shapeFlag } = vnode;
    // 2.1-->创建节点
    const el = (vnode.el = hostCreateElement(type));
    // 2.2-->操作属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 2.3-->根据二进制判断元素类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // -->文本,直接添加

      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // -->数组元素，循环便利

      mountChildren(children, el, parentComponent);
    }

    // 2.4-->插入到容器
    hostInsert(el, container, anchor);
  };

  const unmountChildren = (children, parentComponent) => {
    children.forEach((child) => {
      unmount(child, parentComponent);
    });
  };

  // diff 4 childrenDiff-->数组childrenDiff
  const patchKeyedChildren = (c1, c2, el, parentComponent) => {
    // -->获取新旧的结尾长度
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // -->sync from start 从头向前推，只要不一致或者一方为空就退出
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el); //-->同一节点,diff props和chidren
      } else {
        break; //-->只要不一致就退出
      }
      i++;
    }
    // -->sync from end 从尾向前推，只要不一致或者一方为空就退出
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
    /* 比较完上面,那么下面开始增删，要么增要么删 */

    // 新增环节-->i比e1大，说明有 *新值*
    //common sequence + mount  -->i和e2之间是新增部分
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          // todo-->判断插入位置，如果e2下一个有值，就是前插，否则就是后插
          const nextPos = e2 + 1;
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor); //-->将e2新值插入
          i++;
        }
      }
    }
    // 删除环节-->i比e2大，说明有 *旧值*
    //common sequence + unmount  -->i和e1之间是删除部分
    else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i], parentComponent);
          i++;
        }
      }
    }
    // -->优化完毕*******************

    // 乱序对比环节-->做映射表，将新值循环一遍，再遍历老的
    // i是头部中断的index,e2是尾部中断的，i到e2中间就是不一致，需要乱序对比的部分
    let s1 = i;
    let s2 = i;

    // // 1-->遍历新的做映射表
    const keyToOldIndexMap = new Map();
    for (let i = s2; i <= e2; i++) {
      const newChild = c2[i];

      keyToOldIndexMap.set(newChild.key, i);
    }

    // 2-->遍历老的,看老值是否存在
    const toBePatched = e2 - s2 + 1; //中间需要比对的个数
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0); //全部初始化为0，用于区分是否映射过
    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i];
      const newIndex = keyToOldIndexMap.get(oldChild.key);

      // -->如果新child不存在，就删除
      if (newIndex == undefined) {
        unmount(oldChild, parentComponent);
      }
      // -->如果存在，就diff
      else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1; //如果映射过，值改为非0
        patch(oldChild, c2[newIndex], el);
      }
    }

    // 优化-->最长递增子序列
    let increment = getSequence(newIndexToOldIndexMap);
    let j = increment.length - 1;

    // 3-->移动位置,这是暴力解法，性能差，可以根据最长子序列算法优化
    // 可以根据 newIndexToOldIndexMap 找到连续的元素不动他们位置，其余动为止
    // 例如 5 3 4 0 ，34是连续的，可以不动
    // 1.创建 toBePatched ,等于往前中断与往后中断的差，就是需要diff个数，循环他
    // 2.创建newIndexToOldIndexMap数组，全部填充为0，可以查到该元素是老元素存在还是新创建的
    for (let i = toBePatched - 1; i >= 0; i--) {
      const index = i + s2; //加上s2,得到在新child中位置
      const current = c2[index];
      let anchor = index + 1 < c2.length ? c2[index + 1].el : null; //-->找下一个元素作为参照物

      if (newIndexToOldIndexMap[i] === 0) {
        // -->等于0，说明是新创建的元素
        patch(null, current, el, anchor);
      } else {
        // 子序列-->i和递增子序列不相同，插入。相同代表位置没有变，不改
        if (i != increment[j]) {
          // 已经存在，插入
          hostInsert(current.el, el, anchor);
        } else {
          j--;
        }
      }
    }
  };

  // diff 3 children-->比较新老儿子
  const patchChildren = (n1, n2, el, parentComponent) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const preShapeFlag = n1.shapeFlag;
    const newShapeFlag = n2.shapeFlag;

    // -->进入新的是文本
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 1-->新文本，老的数组,先删除每一个老的儿子
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        for (let i = 0; i < c1.length; i++) {
          unmountChildren(c1, parentComponent);
        }
      }
      // 然后设置新的文本
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    }
    // -->新的都是数组或者空
    else {
      // -->如果之前是数组，那么新的可能是数组或空
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // -->新的是数组，diff
          patchKeyedChildren(c1, c2, el, parentComponent);
        } else {
          // 5 -->现在是文本或者空（删除之前)
          unmountChildren(c1, parentComponent);
        }
      } else {
        // -->之前都是文本或者空
        if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, ''); //4 数组 文本 -->删除挂载
        }
        if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el, parentComponent); //4 数组 文本 -->删除挂载
        }
      }
    }

    //     新   老
    // 1-->文本 数组 （删除老儿子，设置文本)
    // 3-->数组 数组 （diff)
    // 5-->空 数组 （删除)

    // 2-->文本 文本 （更新文本)
    // 4-->数组 文本 （清空文本，挂载)
    // 6-->空 文本 （删除)
  };

  // diff 2 props-->操作属性

  const patchProps = (oldProps, newProps, el) => {
    // -->遍历新的，直接覆盖
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    // -->遍历旧的，没有就删除
    for (const key in oldProps) {
      if (newProps[key] == null) {
        //-->这里需要改为 undefined ，不然报错
        hostPatchProp(el, key, oldProps[key], undefined);
      }
    }
  };

  //--> 靶向更新,以前是树比较，现在是靶向比较
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

  // diff 1-->
  const patchElement = (n1, n2, container, parentComponent) => {
    // 之前已经判断是不是同一type,这里节点复用
    // 1-->先服用节点
    const el = (n2.el = n1.el);

    // 2-->比较属性
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    let { patchFlag } = n2;
    // --.靶向命中更新
    if (patchFlag & PatchFlags.CLASS) {
      hostPatchProp(el, 'class', null, newProps.class);
    } else {
      patchProps(oldProps, newProps, el);
    }

    // 3-->比较儿子

    // -->以前比较儿子是全量比较，现在要通过靶向比较
    if (n2.dynamicChildren) {
      patchBlockChildren(n1, n2, parentComponent);
    } else {
      patchChildren(n1, n2, el, parentComponent);
    }
  };
  // -->元素判断diff方法
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      // -->初次渲染
      mountElement(n2, container, anchor, parentComponent);
    } else {
      // -->diff
      patchElement(n1, n2, container, parentComponent);
    }
  };

  //-->专门处理Fragment
  const processFragment = (n1, n2, container, parentComponent) => {
    if (n1 == null) {
      mountChildren(n2.children, container, parentComponent);
    } else {
      patchChildren(n1.children, n2.children, container, parentComponent);
    }
  };

  const updateComponentPreRender = (instance, next) => {
    instance.next = null; //清空next
    instance.vnode = next; //更新vnode
    updateProps(instance.props, next.props); //更新props
    Object.assign(instance.slots, next.children); //-->插槽更新
  };

  const mountComponent = (vnode, container, anchor, parentComponent) => {
    // -->提取组件函数
    //  1-->创建实例
    let instance = (vnode.component = createComponentInstance(
      vnode,
      parentComponent
    ));

    // keepAlive上下文
    if (isKeepAlive(vnode)) {
      (instance.ctx as any).renderer = {
        createElement: hostCreateElement,
        move(vnode, container) {
          //-->移动组件
          hostInsert(vnode.component.subTree.el, container);
        },
      };
    }

    //  2-->实例赋值
    setupComponent(instance);
    //  3-->创建effect,启动组件
    setupRenderEffect(instance, container, anchor);
  };
  function setupRenderEffect(instance, container, anchor) {
    const { render } = instance;
    const componentUpdateFn = () => {
      //-->如果初次渲染
      if (!instance.isMounted) {
        const { beforeMount, mounted } = instance;

        // -->生命周期,onBeforeMount
        if (beforeMount) {
          invokeArrayFunc(beforeMount);
        }

        // const subTree = render.call(instance.proxy, instance.proxy); //-->将render的this绑定到instance.proxy
        const subTree = renderComponent(instance); //-->区分函数式组件
        patch(null, subTree, container, anchor, instance); //--> parentComponent 渲染时传入父组件

        instance.subTree = subTree; //-->存储上次渲染的虚拟节点
        instance.isMounted = true;

        // -->生命周期,mounted
        if (mounted) {
          invokeArrayFunc(mounted);
        }
      } else {
        // -->props更新，这里强制刷新组件状态
        const { next } = instance;
        if (next) {
          // 更新前，也要拿到最新属性判断
          updateComponentPreRender(instance, next);
        }
        const { beforeUpdate, updated } = instance;

        // -->生命周期,beforeUpdate
        if (beforeUpdate) {
          invokeArrayFunc(beforeUpdate);
        }
        //-->传入两个proxy做靶向更新
        // const subTree = render.call(instance.proxy, instance.proxy); //-->将render的this绑定到instance.proxy
        const subTree = renderComponent(instance); //-->区分函数式组件
        patch(instance.subTree, subTree, container, anchor, instance);
        // -->生命周期,updated
        if (updated) {
          invokeArrayFunc(updated);
        }

        instance.subTree = subTree;
      }
    };
    // 5-->丢进ReactiveEffect响应
    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(instance.update)
    );
    let update = (instance.update = effect.run.bind(effect)); //调用run可让组件强制更新
    update();
  }

  const shouldUpdateComponent = (n1, n2) => {
    const { props: preProps, children: preChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;

    if (preChildren || nextChildren) {
      return true; //-->有孩子一定要更新
    }

    if (preProps === nextProps) return false;

    // -->判断props是否相同，后面还能判断插槽
    if (hasPropsChanged(preProps, nextProps)) {
      return true;
    } else {
      return false;
    }
  };

  // -->处理组件diff
  const updateComponent = (n1, n2) => {
    // 1-->和节点diff相同，复用instance
    const instance = (n2.component = n1.component);
    // 2-->props更新，触发试图更新
    // const { props: preProps } = n1;
    // const { props: nextProps } = n2;
    // 3-->方便以后更新插槽，这部弃用.
    // updateProps(instance, preProps, nextProps);

    // 4-->instance挂载了update方法，用update强制更新
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2; //-->将新的虚拟节点放next属性
      instance.update(); //-->进入 setupRenderEffect
    }
  };

  // -->统一处理组件，里面区分普通还是函数
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        //-->keepAlive第二次切换时，缓存容器取出而不是重新渲染
        parentComponent.ctx.activate(n2, container, anchor);
      } else {
        //-->初次渲染才添加父组件
        mountComponent(n2, container, anchor, parentComponent);
      }
    } else {
      // -->组件更新靠父组件props
      updateComponent(n1, n2);
    }
  };

  // 1-->核心patch方法,判断渲染是diff还是首次渲染
  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    if (n1 === n2) return;
    const { type, shapeFlag } = n2;

    // 暴力diff,如果 有老节点且新老节点type不一致，那么直接删除渲染新的
    if (n1 && !isSameVnode(n1, n2)) {
      // 先删除，后清空n1，会走下面渲染
      unmount(n1, parentComponent); //-->删除n1
      n1 = null; //-->清空n1,下面会进入重新渲染
    }

    // -->解决无法判断纯文本类型的问题--> Symbol('Text')
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // -->文本专门文本diff,元素专门元素diff
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPOENT) {
          // -->组件diff
          processComponent(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          //-->teleport自己身上有process方法
          type.process(n1, n2, container, {
            mountChildren,
            patchChildren,
            move(vnode, container) {
              // -->将老的传送到新的
              hostInsert(
                vnode.component ? vnode.component.subTree.el : vnode.el,
                container
              );
            },
          });
        }
    }
  };
  const unmount = (vnode, parentComponent) => {
    if (vnode.type == Fragment) {
      return unmountChildren(vnode.children, parentComponent); //-->优化删除fragment儿子
    } else if (vnode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      return parentComponent.ctx.deactivate(vnode); //-->keep-alive组件deactivate
    } else if (vnode.shapeFlag & ShapeFlags.COMPOENT) {
      return unmount(vnode.component.subTree, null); //-->优化删除组件儿子
    }
    // -->将真实节点卸载
    hostRemove(vnode.el);
  };

  const render = (vnode, container) => {
    if (vnode == null) {
      // 1-->如果vnode是空，卸载逻辑,需要通过上一次老的节点来卸载
      if (container._vnode) {
        unmount(container._vnode, null);
      }
    } else {
      patch(container._vnode, vnode, container);
    }
    container._vnode = vnode; //-->存储上次的vnode
  };

  return { render };
}
