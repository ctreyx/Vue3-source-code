import { ShapeFlags } from '@vue/shared';
import { onMounted, onUpdated } from '../apiLifecycle';
import { getCurrentInstance } from '../component';
import { isVnode } from '../vnode';

//-->去掉身上keep-alive的标签
function resetShapeFlag(vnode) {
  let shapeFlag = vnode.shapeFlag;
  if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
  }
  if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
  }
  vnode.shapeFlag = shapeFlag;
}

export const KeepAliveImpl = {
  name: 'KeepAlive',
  __isKeepAlive: true,
  props: {
    include: {}, //-->要缓存的
    exclude: {}, //-->不缓存的
  },
  setup(props, { slots }) {
    const keys = new Set(); //缓存的key
    const cache = new Map(); //key 对应虚拟节点
    let pendingCaheKey = null;
    const instance = getCurrentInstance();

    // 4-->挂载完毕后，再缓存虚拟节点 -->处理bug,在 renderer处理onMounted时，应该isMounted=true后再执行
    function cacheSubtree() {
      if (pendingCaheKey) {
        cache.set(pendingCaheKey, instance.subTree);
      }
    }
    onMounted(cacheSubtree); //-->渲染更新，都要存储缓存，不然切换组件，就不缓存了
    onUpdated(cacheSubtree);

    const { move, createElement } = instance.ctx.renderer;
    const storageContainer = createElement('div'); //-->缓存容器,将渲染好的移入
    // diff-->切换组件时，如果是keepalive,进入该方法-->将老的放入到容器中而不是卸载

    instance.ctx.deactivate = (vnode) => {
      move(vnode, storageContainer);
    };
    instance.ctx.activate = (vnode, container, anchor) => {
      move(vnode, container, anchor);
    };

    // -->基于LRU删除缓存
    let current = null;
    function pruneCacheEntry(key) {
      resetShapeFlag(current);
      keys.delete(key);
      cache.delete(key);
    }
    //-->props无法结构？
    const { include, exclude, max } = props;

    return () => {
      // slots-->虚拟节点，对象 , subTree-->渲染结果
      //-->取插槽虚拟节点第一个，默认取default
      let vnode = slots.default ? slots.default() : null;

      // 1-->不是虚拟节点或不是状态组件，直接返回（函数式组件没有状态，不需要缓存
      if (
        !isVnode(vnode) ||
        !(vnode.shapeFlag & ShapeFlags.STAEFUL_COMPONENT)
      ) {
        return vnode;
      }

      // 2-->获取keepalive缓存的整个组件,vnode就是My1组件
      const comp = vnode.type;
      let key = vnode.key == null ? comp : vnode.key; //-->没有key,用组件作为key
      // 5-->获取组件名，判断是否缓存,如果不包含在缓存中或者包含在不缓存中的，不进行缓存
      const name = comp.name;
      if (
        (name && include && !include.split(',').includes(name)) ||
        (exclude && exclude.split(',').includes(name))
      ) {
        return vnode;
      }

      // 3-->查找缓存
      const cacheVnode = cache.get(key);

      // 4-->缓存没有，添加缓存
      if (cacheVnode) {
        vnode.component = cacheVnode.component;
        //-->在挂载阶段，标记该虚拟节点为keepalive，调用activate方法
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
        keys.delete(key);
        keys.add(key);
      } else {
        keys.add(key); //-->这里不能缓存cache,因为我们要缓存的是渲染后的结果subtree，而不是vnode
        pendingCaheKey = key;
        // -->如果缓存大于最大值，基于LRU算法，将老的删除
        if (props.max && keys.size > props.max) {
          // -->迭代器，将第一个取出来删除
          pruneCacheEntry(keys.values().next().value);
        }
      }
      current = vnode;
      // diff 1-->添加keepalive标签
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
    };
  },
};

export const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;

/* 
  需要处理的之前bug

  1.在 renderer处理onMounted时，应该isMounted=true后再执行
  2.shouldUpdateComponent ,新增 
  if(preChildren ||nextChildren ){
      return true  //-->有孩子一定要更新
    }

  3.updateComponentPreRender 新增      Object.assign( instance.slots,next.children)//-->插槽更新

  4.组件更新patch，没有放入第四个参数instance作为父组件

*/

/* 
 keepalive本身没有功能，只是单纯将插槽渲染。
 需要注意的是，我们缓存的是插槽的subtree,非KeepAlive,所以我们需要在实例渲染后，再存缓存

 用keepalive,type就是KeepAliveImpl,children就是缓存插槽。

 流程:mountComponent 渲染vnode时，判断vnode是不是keepalive,如果是，给实例身上添加ctx上下文-->进入setup渲染 

 diff -->打标签 --> unmount 中传入parentCompoent-->如果是keepalive,调用ctx.deactivate进行假删除

 
---------------

 第二次渲染-->将缓存的component挂到vnode, vnode.component = cacheVnode.component ,然后打上COMPONENT_KEPT_ALIVE标签
 -->在processComponent中判断，如果是COMPONENT_KEPT_ALIVE,那么就不重新创建，而是调用activate,将该缓存数据渲染到节点上。

 max:在每次缓存时，判断当前keys是否大于max,如果大于-->进入pruneCacheEntry，删除keys第一个key-->并且进入resetShapeFlag，将
 剔除缓存的vnode去除keepalive标签
 

*/
