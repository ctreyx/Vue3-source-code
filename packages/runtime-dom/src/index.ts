import { createRenderer } from '@vue/runtime-core';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

const renderOptions = Object.assign(nodeOps, { patchProp }); //-->runtime-dom核心方法

export function render(vnode, container) {
  createRenderer(renderOptions).render(vnode, container);
}

export * from '@vue/runtime-core';
