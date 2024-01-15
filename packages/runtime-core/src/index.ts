import { createRenderer } from './renderer';
import { h } from './h';
// import { Text, Fragment } from './vnode';

export { createRenderer, h };

export * from '@vue/reactivity';

export * from './component';

export * from './apiLifecycle';

export * from './vnode';

export * from './apiInject';

export * from './components/Teleport';

export * from './defineAsyncComponent';

export { KeepAliveImpl as KeepAlive } from './components/KeepAlive';
