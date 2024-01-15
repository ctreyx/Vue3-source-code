# VUE3 1:1 源码解析

<!-- 1.环境 -->

1. 安装 pnpm 全局 npm install -g pnpm
2. pnpm init 初始化 pnpm 项目

--我们需要创建一个 packages 目录，与 pnpm-workspace.yaml ,
\*\* .npmrc 文件-->将 pnpm 下载包转为 npm 下载模式，就是全部放进 node_modules 里。

3. pnpm install vue -w -->指定安装到 packages 共享目录下。
4. pnpm install typescript minimist esbuild -w

<!-- 2.模块依赖 -->

1. 需要在每个模块安装依赖，以便打包后能全局使用。
   例如: 到 reactive -> pnpm init -> 新增 buildOptions，就是我们打包后的格式 --> VueReactivity 是 vue3 源码中名字,script 引入后 VueReactivity 便是变量名称。

但 shared 不需要打包到全局，只需用 在 cjs,esm-bundler 等模式下即可使用。

2. 然后每个模块新增 src-index.ts ,随后 devjs 打包中打包入口
   问题: 在 shared 下 indexts 暴露一个方法，然后再 reactive 下引入，是无法引入的，所以我们需要互相关联。

解决：通过 ts 关联--> pnpm tsc --init 生成 ts 配置文件,配置定制内容。

<!--  找到相对应依赖。
"baseUrl": ".",
"paths": { "@vue/*": ["packages/*/src"] }
-->

<!-- 3.构建 -->

1. 新建 script 文件夹，新创 devjs -- >并在全局 package.json 中添加 "dev": "node script/dev.js reactivity -f global" 便于我们 devjs 打包。

2. devjs , 通过 minimist 获得"node script/dev.js reactivity -f global" 参数
   --> 获得 target 目标(reactivity) 与 format 格式(global)  
   --> 获得 pkg 打包目标下的 package.json,读取 buildOptions 打包名称
   --> outputFormat 打包模块格式
   --> 打包出口(即目标文件下面新增 dist 文件夹)
   --> 最后通过 esbuild 完成打包。

<!-- 正式开始 -->

<!-- 1.reactive -->

1. 判断是否为对象 MyIsObject

2. 生成 proxy 代理对象
   -- > 解决传入同一个对象反复代理 : reactiveMap 缓存机制
   -- > 解决传入一个代理对象反复代理 :target[ReactiveFlags.IS_REACTIVE]

# 因为普通对象身上没有 get,无法命中,但如果是代理对象，会进入 if 判断 --> 进入 get 方法 --> 判断 key === target[ReactiveFlags.IS_REACTIVE]

3. tarck 收集，trigger 触发依赖

4. 切换分支，需要在 run() 执行 fn()前 -->cleanupEffect 触发前清除该依赖 --> 会造成死循环问题 --> trigger 拷贝,避免同一地址不断新增删除死循环

5. 调度器:
   --1.清除自身依赖,effect 返回 runner,runner 身上还要挂载\_effect
   --2. scheduleRender 调度器，自己决定数据变化后什么时候更新.
   --->1.在 effect 第二个参数传入 scheduler,这样每个 effect 就有自己的调度器
   --->2.在 trigger 执行时，判断该 effect 身上是否挂载 scheduler，如果没有挂载，则挂载。就三步：

6. 最后进行深度代理-->如果 getter 返回的是对象，则进行深度代理。

<!-- 2.实现computed计算属性 -->

1. 概念:计算属性是基于 effect 实现的类,有缓存，依赖属性更新，脏值更新，视图更新。

2. 原理:基于 effect 实现，第二个参数是 scheduler,调度器,当 state 依赖数值更新，触发 trigger 运行调度器使脏值更新，然后触发 triggerEffect 刷新试图。

3. 流程:访问 value
   -->进入 get value 方法中,收集依赖，使脏值为 false,this.effect.run()返回计算属性的值
   -->更新 state 的值，会触发 scheduler 调度器,刷新试图。

<!-- 3.实现watch -->

1. 概览:第一个参数是监控，第二个是执行函数。如果传入对象，引用的是相同地址，无法区分新旧的值，所以需要传入函数。

2. 原理:基于 effect 实现
   --> 判断传入的 source 是否是响应式，如果是进行递归触发 getter 收集依赖，并且改为回调函数 getter。
   -->将转为的回调函数 getter 与 job(调度器，监控的值更新后触发 job)传入 ReactiveEffect,然后调用 effect.run()存储老的值。
   -->job 中，调用 effect.run 获取新值传入用户传入的 cb 中。
   -->cleanup 类似于防抖,当下一次值更新触发 job 时，调用用户传入的 cleanup,利用闭包可以取消用户上次的函数。

<!-- 4.实现ref -->

1. 概览:ref 就是将非对象转为响应式。因为 reactive 只支持对象,ref 就是 new 实例，利用 object.defineProperty 中 get set 实现收集与触发依赖
   -->很简单，就 return new RefImpl

2. toRefs
   --> 概览:就是将 reactive 的值转为 ref，通过 value 获取值。
   1-->判断是不是 reactive 响应值，如果不是，给出提示。
   2-->然后遍历每一个值，将每个值都 new 实例，通过 get set 响应收集，因为是 reactive 值，所以不需要 trackEffect 与 triggerEffect

3. proxyRefs
   --> 概览:将 ref 实例转为 proxy,不需要通过.value 访问，反向转换
   --> 实现:通过 proxy 遍历，查看每个值身上是不是挂载\_\_v_isRef 属性，如果挂载，returnv.vale。

<!-- 响应式结束 -->

<!-- runtime运行时 -->

## Vue 中为了解耦，将逻辑分成两个模块

- 运行时 核心模块 （不依赖平台的 browser test 小程序 app canvas) 靠的是虚拟 dom
- 针对不同平台运行，vue 针对浏览器

<!-- 1.runtime-dom --操作节点的进行时 -->

- 针对虚拟 dom,VueRuntimeDOM 中 createRenderer 提供渲染容器的方法。

1. 创建 runtime-dom 文件，然后新创 packages.json 与 dist。 packages 内容与 reactivity 一样，只不过需要更改 name 为 VueRuntimeDOM 并且更改包名称。

2. -->创建 nodeOps 放置操作 dom 的方法,patchProp 放置操作属性的方法。

- nodeOps 与 patchProp 都是渲染方法，接下来需要创建渲染器。

# runtime-core 我们日常使用 Vue,是直接 render，不需要调用 createRenderer.render()这样渲染，所以 render 函数就是内部调用 createRenderer 渲染，只不过这部分不是操作 dom，是 runtime-core

<!-- 2.runtime-core -->

- 提供渲染器,放与平台无关的方法。

  1.创建 runtime-core 文件夹，步骤一样，但是不需要 global，因为我们是导入到 dom 这边引用。
  --> 创建 renderer.ts,导出 createRenderer 渲染器方法。
  -->runtime-dom 引入 import { createRenderer } from '@vue/runtime-core'; -->@vue 我们之前已经配置过。

  2.-->h 函数也是 core 方法，我们想在 dom 这边暴露，通过 export \* from '@vue/runtime-core';暴露出所有 core 方法。

# h 函数：

h 函数是多样性的，比如 h('h1','儿子'),或者 h('h1',{style:{color:1},'儿子')，所以我们需要底层创建 vnodets 文件编写 createVnod 函数，最底层，进行操作。

- vnodets 中，createVnode 采用组合方案 shapeFlag,该方法在共享文件中，利用二进制判断是否组合中包含该元素。
  --> 1.判断是不是文本 2.判断有没有子元素，然后通过 | 计算出组合。

# 虚拟 dom 优势：1 可以挂夸平台，因为真实 dom 属性多

- h 函数是多样性的,主要作用是判断各种类型,然后调用 createVnod 创建虚拟函数。
  1-->判断传入值长度，如果是 2，需要判断三种情况。
  2-->如果大于 3，剩下的都是儿子，通过 slice 截取儿子
  3-->如果等于 3，将儿子包装成数组循环遍历，丢入 createVnode 中创建。

<!-- 3. createRenderer 初次渲染-->

- 初次渲染，进入 createRenderer 的 render 函数中，在 container 挂载老节点，然后一步步渲染，不难。但是重点是需要判断纯文本类型

-->纯文本类型,需要身上添加 Symbol('Text') 属性，在渲染 children 函数中，判断 child 是纯文本，那么进入 createVnode(Text, null, child),创建纯文本类型。

# normalize 函数需要创建新的文本 vnode，然后将 vnode 赋值给该 child,避免后面文本没有父节点。

- Text 是暴露出来的 Symbol('Text')

- 还需要处理 vnode 为 null 的卸载

<!-- 4.简单的diff -->

先优化之前 patch 函数内，将 mountElement 提出来，元素判断 diff 专门判断，不要合一起。

- 1. 暴力 diff，如果新旧的 type 不一样（isSameVnode），那么直接删除老的，初始化 n1 为 null,走下面渲染。
- 2. 文本 diff,只需用判断新老文本 children 是否一致，然后替换文本内容即可。

- 元素 diff:

1. --> 因为之前已经判断是不是同一 type 节点，所以这里 patchElement el 可以复用。

props --> 分别循环新老 props,新的覆盖，老的如果新 props 没有该 key,删除

# 之前 mountElement 中渲染 props 写错，传入 el 不是 container

children --> 儿子对比较麻烦，需要对比不同的情况，大致 6 种。

<!-- 5. children初步diff -->

# 注意:需要在 patchProps --> hostPatchProp 中修改传入 undefined,不然无法识别新值没有的情况。给 patchStyle 中 nextValue 默认为{}

--> 原理:通过两次计算，第一次往前推，i++,直到元素不一致或一方为空，退出 while.第二次往后退，e1--,e2--,直到不一致退出。
--> 结束计算后,要么删除，要么增加。下面公式

- 1. 新值：如果 i 大于 e1,有新值，在 i 与 e2 之间,增加
- 2. 删除：如果 i 大于 e2,有旧值，在 i 与 e1 之间，删除
- 3. 新增判断插入位置是前还是后，通过判断 e2+1，下一个元素是否有值。如果有值，则插入前面，不然插入后面

  2.-->diff 乱序

--> 原理: 1.做映射表，遍历新的，然后遍历老的，可以得出是否存在，如果存在则 diff 属性，不然删除. 2.移动位置:需要创建 toBePatched 获得 e2-s2+1,从尾中断的位置减去从头中断位置，算出需要 diff 的个数。然后创建 newIndexToOldIndexMap 在遍历老的时候，如果存在则更改值非 0，可以判断该值是否需要新创建。

3.循环 toBePatched,i--,插入位置是从后插入，方便有参照物。
第一步获得 index=i+s2,获得该元素正确索引。
第二步获得该元素。
第三步获取参照物，也是参考 index+1 是否还有下一个元素，如果有，就插入这个元素前面。
第四步通过 newIndexToOldIndexMap[i] 可以获取该值是不是非 0，如果非 0，代表有老元素,hostInsert 插入。如果为 0，代表新值，patch 创建新值插入。

3.-->最长递增子序列原理:基于贪心算法+二分查找+反向追溯

- 1.当前的值比集合最后一个值大，直接 push
- 2.如果比当最后一个值小，那么通过二分查找，找到第一个大于当前值的位置替换

步骤:

- 1. 定义 len , result=[0](默认第0个开始做序列), let start, end, middle ,resultLastIndex p = arr.slice(0)。

- 2. 循环 arr,拿到 arrI 当前值，对比 result 最后一个索引，通过 arr[resultLastIndex]与 arrI 对比。切记，result 存储的是 arr 的索引，所以需要转换成 arr 的值。
     如果当前值大于 result 存的最后一个索引，那么直接 push(i)

- 3. 如果当前值小于，那么进入二分法，在 result 中查找值！但是比较的值是 arrI，所以需要转换成 arr 的值。

- 4. 最后通过记录前一位的索引，通过反向追溯正确排序。在 result 添加值的时候，都要记住当前的前一项索引.

- 5. 在 diff 中，丢入 newIndexToOldIndexMap 获取最长递增序列，在插入的时候，判断当前的 i 与 increment[j]不相同，就插入，相同的话，就不动,j--

<!-- 6. Fragments -->

- 原理：很简单，没有父级，创建 Fragment 的 Symbol 类型，和 Text 一样使用。
- 在 patch 中，创建 case Fragment 分支，渲染时，因为没有父级，不管初次渲染 mountChildren 还是 patchChildren 比较，都是直接扔 children 进去。

<!-- 7.函数式组件 -->

- 1. 先在 vnode 中新增 MyIsObject(type)判断是否函数式组件。然后再 renderer 中，switch 判断 shapeFlag & ShapeFlags.COMPOENT 是不是组件。
- 2. 初次渲染组件，mountComponent 中，vnode.type 存储的就是函数式组件的 data,render 等，data 是个函数，返回的是对象，丢进 reactive 中拿到 state.
- 3. 创建 instance 实例，身上挂载一系列属性。然后创建 componentUpdateFn 函数，丢到 ReactiveEffect 中，实现响应式更新。将返回的 effect.run 挂载到 instance 的 update 中，实现可强制更新。
- 4. componentUpdateFn,根据 instance 中 isMounted 判断是不是第一次更新。如果是第一次更新， subTree = render.call(state)将 render 中 this 绑定到 state 上，实现响应式。 instance.subTree = subTree 存储老的虚拟节点。
- 5. 如果在定时器中连续 age++，会导致更新叠加，为了解决，我们需要创建 scheduler 防抖。scheduler.ts 中，创建 queue 队列，isFlugsing 更新开关，在更新时，将 isFlugsing 关闭，然后再异步中开启，并且取出 queue 队列任务执行。注意，需要开辟新地址，避免同一地址不断新增删除死循环。执行完毕后回收队列。

<!-- 8.props -->

使用 props,必须在组件中注册，这样才能区分 props 与 attrs。并且禁止更改 props 状态。

- 1. 从 vnode.type 中获取 props 注册方法，vnode.props 中拿到所有 props 参数。在 instance 添加 propsOptions , props , attrs , proxy 属性。

- 2. initProps 注册 props,查看 props 中能否命中 propsOptions ,区分放入 props 与 attrs，绑定在 instance 身上。

- 3. 然后通过 instance.proxy 截止传入的 key,先匹配 state,然后 props 看能否命中。set 时，如果 key 命中 props,则提示不能更新。最后丢进 render.call(instance.proxy),绑定 this 。

# 优化该函数，将逻辑抽离。

- 1. 创建实例， createComponentInstance 函数，就是生成 instance

- 2. 实例赋值，setupComponent，初始化 props,生成 proxy.然后判断 data 是不是函数，是函数将 data 丢进 reactive. ,最后给 instance 添加 render 属性，到时候直接从 instance 获取 render 而不是 vnode.type 中获取。

- 3.启动组件

<!-- 9. 组件的更新,基于父级传入props更新 -->

子组件更新有两种，一种自身状态更新，上面例子。
另一种父组件身上的值传给子组件，子组件会走 diff，更新子组件。子组件 proxy 中 props 是响应式的，直接更新 props 就可以更新试图。

# 注意：normalize 检查字符串或者数字，都按照 Text 格式生成.还有 processFragment 中 ，diff 传入的是 n1,n2,非 children

当父组件 data 更新，会造成子组件 props 更新，processComponent 触发 updateComponent 更新函数。

- 1. 原理很简单，只需用更新 instance 身上 props 便会自动更新试图。因为 instance.props 是响应式.

- 2. 先复用 instance,从 n1.compoent 获取老的实例，然后走 updateProps .

- 3. updateProps 中,比较新老 props 长度与每个属性是否相同，不相同进入 diff.
     先遍历新的，在 instance.props 身上覆盖老得即可。
     然后还需要遍历老的，如果新的没有，删除 instance.props[key]

# 优化，因为后续还有插槽，不能 props 更新就更新，需要控制

- 1. 创建 shouldUpdateComponent 函数，shouldUpdateComponent 函数控制是否更新，在这函数中后面插槽也会判断，现在先判断新老 props 是否相同。

- 2. 如果要更新，给 instance.next 附上 n2 新的虚拟节点，调用 instance.update 函数，走 setupRenderEffect 方法.

- 3. 在 setupRenderEffect 方法中，获取 next,if(next) 存在，进入 updateComponentPreRender(instance, next);

- 4. 进入 updateComponentPreRender 中，清空 next,然后给 instance.node 挂载 next,进入 updateProps 函数中。这里和之前的 updateProps 不同，这里是 preProps[key] = nextProps[key]; 更新，不会主动触发试图，instance.props 会自动触发。我们还是要走下面的 patch 方法更新试图。

<!-- 10.setup -->

用法:可以接受 props 与 ctx 上下文，用于自定义事件与插槽。
在 setup 中，返回对象，源码会通过 proxyRefs 去.value ,如果返回函数，则会渲染到 render 中直接渲染。

原理:

- 1. 在 setupComponent 中，得到 type.setup,判断是否用户传入 setup.如果传入，在 setup 函数中传入 instance。props 和 setupContext(上下文存储自定义事件，插槽，attrs 等)。

- 2. 如果 setupResult 是函数，抛给 render.不然在通过 proxyRefs 挂去 value,挂载 instance.setupState。 在 publicInstanceProxyHandlers 中，通过 proxy 返回 setupState 值。

# 自定义事件，给子组件传入 props 中传入自定义事件。

- 1. 在 setup 第二个参数中，接受上下文，其中有 emit 自定义事件。原理很简单
- 2. 第一步将传入的事件首字母大写,在 vnode.props 中通过映射获取即可,再将传参全部传入事件中。

# 插槽，必须传入 props,而且 children 必须为对象。我们需要在 vnode 中判断 children 是不是对象，新增 type 类型。

用法是 this.$slots.header ，可以获取父组件传入的组件。

原理: 很简单，也是映射，类似$slots,在 publicInstanceProxyHandlers 中做映射。但是前提需要在 instance 身上挂载 slots.

步骤:
1--> 第一步在 instance 初始化挂载 slots 属性。然后 setupComponent 渲染函数时，使用 initSlots 判断 instance 是不是 slots,如果是，给属性 slots=children ,便可以在 get 中获取$slots

<!-- 11.生命周期-->

- 1. 生命周期就是在实例 instance 身上挂载属性，在对应生命周期发布。所以现在问题是找到当前正确 instance.-- >所以需要在 component.ts 中，setup 绑定实例。

- 2. 然后在 createHook 中，获取 hooks ，把用户传入的相对应 hook 存储。再找到 setupRenderEffect ，在对应周期调用实例身上对应的生命周期。

<!-- 12.靶向更新 -->

原理: 靶向更新是模板编译后，\_openBlock 函数会开辟一个 currentBlock,收集当前 vnode 中动态变化的节点。当 createVnode 创建节点时，会判断该 vnode 身上是否有 patchFlag(动态变化类型)，然后会收集到 currentBlock 中。
然后通过 setupBlock ，给 vnode 身上绑定 dynamicChildren 属性，就是动态变化节点收集。

在 render patchElement 中，以前 patchchildren 都是全量，现在需要判断 n2 身上是否有 dynamicChildren,如果有，就对比动态属性。

在 props 比较中，判断 n2 身上是否有 patchFlag,如果命中 PatchFlags.CLASS ,那么久直接更新最新 class,不用以前那样全部对比。

步骤：

- openBlock 开辟队列存储动态属性。
- createElementBlock 底层是 createVnode,但是接受 patchFlag ,创建 vnode 时，判断是否有 patchFlag ,然后添加进 currentBlock 。
  生成的 vnode，再通过 setupBlock 方法，把动态属性收集到 vnode 身上。
- createElementVNode 就是 createVnode

最后在 render patchElement 中 靶向更新。

<!-- 1.compiler-core -->

编译模块，主要分 parse 编译模块，transform 预处理模块，generate 生成模块。

<!-- 1.parse -->

第一部分编译模块 parse

1. 需要创建上下文，记录解析进度。进入 while 循环，直到 context.source 被截取至空。

2. 先文本解析,需要定义解析停止条件 --> ['{{', '<'] 是表达式或者元素，需要停止解析.

3. 进入循环，通过 indexOf 获取索引，查看是否有结束条件。如果有，更新 endIndex,一直往前推。

4. 获取 endIndex 后，需要进行:1.截取内容 parseTextData 2.删除内容 advanceBy 3.更新位置 advancePositionWithMutation

<!--跳过编译部分  -->

<!-- 1. 玩具EffectScope -->

EffectScope 用法就是通过 run()收集里面的 effect,然后 stop 停止。比一个个 stop 方便。
核心在于，收集当前 ReactiveEffect 实例，存到 EffectScope 中。

1. --> effectScope 返回类 EffectScope。里面 run()函数，会返回传入的 fn(),并且通过 activeEffectsScope 绑定上次的父级。

2. --> recordEffectScope 核心收集当前运行的 ReactiveEffect 实例. run()-->将 activeEffectsScope 设为 this-->ReactiveEffect 运行时，给 activeEffectsScope 传入 effect 收集。

--> stop 将 effects 循环 stop 即可。

# 实例 2，传入 true,即不收集子集，每个单独控制 stop.

原理: 在 effectScope（true) 的时候，不收集子集。但为 false 需要收集。

流程: 生成 class EffectScope 时,传入 detached 判断时否为 false -->如果 false 收集 --> 因为生成时还没有调用 run ,所以当前的 activeEffectsScope 还是上次父级的 ，所以往 activeEffectsScope.scopes.push(this) 即可。

<!-- 2.provide-inject -->

用法:父组件调用 provide 传入 key 与 value,子组件 inject 通过 key 调用.
原理：很简单，通过 provide 获取当前实例，在实例身上 provides 属性加入当前的 key 与 value.核心在于必须获取当前实例，所以必须在 setup 中使用该方法。

inject 使用时，获取当前实例，在实例身上找 parent 的 provide. --> 核心在于实例身上必须挂 parent，所以 createComponentInstance 创建实例时，给实例身上加 provides 与 parent .

在 renderer 比较麻烦，需要给 patch 添加 parentComponent。

# 在 createComponentInstance 中，传入 parentComponent 。而在 componentUpdateFn 时，给 patch 第四个参数传入 instance ,instance 时当前的实例，也就是下一个生成的父级，这是重点!

<!-- 3.Teleport 传送门 -->

用法:将内容渲染到指定 dom,在 props 中写 to 目标地址。

1. --> Teleport 是一个对象，里面挂载 \_\_isTeleport 与 process 方法。需要在 createVnode 中判断是不是 teleport,添加 shapeflag 标签.

2. --> 在 renderer patch 中，判断 teleport 标签，因为当前 type 就是 Teleport 对象，所以挂载了 process 方法，我们将 n1, n2, container, internals 丢进去。

3. --> 在 process 中，取出渲染方法，通过 document.querySelector(n2.props.to) 可以获取传送门地址，进行渲染。

<!-- 4.defineAsyncComponent异步组件 -->

异步组件相对应懒加载，在组件返回之前根据状态渲染不同样式。
用法，传入 loader，timeout，errorComponent，loadingComponent，onError 等，实现在异步组件没有 resolve 时，默认用空标签 fragment 展示。等待异步返回，更改 loaded 状态，渲染异步组件。

1. -->定义 loaded ref,当异步组件 then 返回，使 loaded 状态为 true 展示异步组件，原理使通过 ref 实现更新。其余 error 组件与 loading 组件原理都一样。

2. -->onError 需要封装方法，返回 loader().catch,在捕获错误时，给 onError 传入几个方法。这里异步链表，需要仔细看。

<!-- 5.函数式组件 -->

原理很简单，函数式组件没有 data,setup 等，只是纯展示页面。

1-->vnode type 新增函数式判断 -->renderer setupRenderEffect 中判断是有状态组件还是函数式，如果式函数式，直接 vnode.type 丢入 props,因为他自身就是 render --> 但他身上没有 props 注册方法，所以他的 props 就是 attrs

<!-- 6.KeepAlive  -->

原理是插槽，只不过在 keepalive 组件切换时，会进入 unmount 删除，这时调用上下文中 deactivate 方法，将 vnode 移入 keepalive 内部创建的容器中，实现缓存。

流程:

1. KeepAliveImpl 和 teleport 一样是一个对象，里面有自己渲染属性,我们 h 渲染时，type 就是 KeepAliveImpl,children 就是包裹的子集。 -->KeepAliveImpl 中 setup 是核心，setup renturn 一个函数,会当作 render 渲染

2. -->准备工作，定义 keys,cache,pendingCaheKey -->在 return 中，获取插槽的 default()，就是包裹的子集 My1, #判断 vnode 是不是 vnode 和状态组件。-->获取 comp 与 key,没有 key 就用 comp 做为 key,然后 chaeVnode 中查找是否有缓存，如果没有，keys.add(key),这里不缓存 cache,因为现在还没有真实节点 subTree，我们需要在 onMounted,onUpdated 中为 cache 添加缓存。

3. -->mountComponent 渲染 vnode 时，判断 vnode 是不是 keepalive,如果是，给实例身上添加 ctx 上下文 -->进入 setup 渲染
   diff -->打标签 --> unmount 中传入 parentCompoent-->如果是 keepalive,调用 ctx.deactivate 进行假删除

# 这里删除是重点，如果是 keepalive,就调用上下文中 deactivate 将节点渲染到 keepalive 中容器中。

4. 获取缓存渲染-->很简单，将缓存的 component 挂到 vnode, vnode.component = cacheVnode.component ,然后打上 COMPONENT_KEPT_ALIVE 标签
   -->在 processComponent 中判断，如果是 COMPONENT_KEPT_ALIVE,那么就不重新创建，而是调用 activate,将该缓存数据渲染到节点上。

# 重点在渲染阶段，是将缓存节点转移到 container，而不是重新渲染。

5. max -->最多缓存，基于 LRU 算法，将最老的弹栈出去。-->在每次为新缓存时，判断是否有当前 keys 大于 max,如果是，将第一个缓存取出来弹栈-->进入 pruneCacheEntry，删除 keys 第一个 key-->并且进入 resetShapeFlag，将剔除缓存的 vnode 去除 keepalive 标签

<!-- pinia  安装 -->

# <script setup>模板 相当于写了 export setup return 数据。

1.pnpm create vite-->新创 pinia 项目-->npm i pinia

2.创建 stores 文件夹-->useCounterStore-->defineStore 创建 store，注意:现在 store 是 return 函数，而不是以前的对象
使用:引入暴露的 useCounterStore,然后执行 useCounterStore()就阔以获取一个 store,类似 hooks
