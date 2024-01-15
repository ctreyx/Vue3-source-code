# <script setup>模板 相当于写了 export setup return 数据。

<!-- 安装 -->

1. pnpm create vite-->新创 pinia 项目-->npm i pinia

2. 创建 stores 文件夹-->useCounterStore-->defineStore 创建 store，注意:现在 store 是 return 函数，而不是以前的对象
   使用:引入暴露的 useCounterStore,然后执行 useCounterStore()就阔以获取一个 store,类似 hooks

3. 1-->现在 state 必须是函数 ,getters 与 actions 还是对象 2-->第二个参数可以穿对象和 setup 函数，实现自己逻辑

<!-- 1.注册pinia -> createPinia -->

原理:为 app 全局挂载一个 pinia 实例，实例中有 state 管理全部状态（ pinia.state.value[id]与 pinia.\_s.set(id, store)都是存储状态),\_s 是 map 存储映射状态,\_e 是闭包控制全部状态是否 stop.

步骤:很简单-->createPinia 函数中创建 pinia 的对象，通过 markRaw 创建，避免后面被 proxy.-->然后里面 install 可以获取全局 app,再全局 app.provide 挂载 pinia,后面方便 inject 获取 pinia。

<!-- 2.基础pinia -> defineStore-->

原理:defineStore 这个函数会在 pinia 中通过 id 存储 store,再将用户传入的 state()创建一个 store 跑出去。

步骤:
-->1.判断传入的参数，获得 id 和 setup
-->2.创建函数 useStore,通过 inject 获取 pinia,然后判断 pinia.\_s.has(id)是否注册，没有注册，createOptionsStore
-->3.createOptionsStore 中，解构用户传入的 options,通过 pinia.\_e.run 传入一个函数，函数中再创建一个 store 自己的 scope，调用 setup
--> 4.setup 是重点，setup 会为 pinia.state 赋值用户传入的 state,然后将该状态抛出去，由 stateScope 接受。
-->5.stateScope 会接受很多参数，现在只接受 state,然后将该 stateScope 绑定在 store 上，最后给 pinia.\_s.set 创建映射。
-->6.最后在 useStore 中获取 const store = pinia.\_s.get(id);抛出去，那么用户就可以在调用 useStore 时获取该 store

# 处理 action ,getters

1. actions --> 将 setup 中 return 通过 Object.assign 包裹状态，actions,getters,在外面循环 stateScope 通过判断是不是 function 得到 action，单独将他 this 通过 action.apply(store, arguments)绑定

2. getters-->核心在于，状态机中 getters 是函数，但我们使用的时候，他其实是要给值！！！所以我们需要将他转换为值！在 setup Object.assign 中，将 getters 通过 reduce 全部调用，外面套一层 computed 计算出来结果，然后赋给 reduce 对象即可。#这也是为什么下面 actions 通过 function 判断#
   注意，上面的 pinia.state.value[id]必须包裹 toRefs！这样计算属性才可以通过 set 触发更新视图！

# 处理传入 Setup 函数

原理:很简单，判断传入的 setup 是不是函数，如果是，进入 createSetupStore 中。 --> 整个流程和 options 创建一样，只不过用户传入了 setup,不需要我们手动创建，所以提取公共样式即可。

<!-- pinia基础api -->

# $patch,可一次性更新多值，可传入函数或对象进行更新。

步骤:

1. 在初始 store 中，新创一个 partialState 对象丢进去，放初始方法.
2. patch 接受 partialStateOrMutation，可为对象或函数，如果是对象，直接执行即可，将 store 丢进去.
3. 如果是对象进入 mergeReactiveObjects，分三步。第一步，循环传入的更新值对象，取出 key，一一更新 store 中值。第二步，判断该 key 是不是 store 身上，如果是原型链上的跳过不更新.第三部，对比新老值，如果都是对象，需要继续递归，不然直接更新赋值即可。

# $reset(),重置功能，只能在 options 实现，源码也是。并且只能重置初始值，后面新添的值不会被删除。

步骤:

1. 因为只有 createOptionsStore 中才有用户初始传入的 state,所以只支持 options 重置，所以在 createOptionsStore 中，得到的 store，我们新赠一个方法$reset
2. 然后拿到初始值，就是用户传入的 state 函数。再通过$patch,将新老 store 通过 Object.assign 合并即可。

# $subscribe 可以监听更新后的值与更新的 type.原理很简单，就是 wacth

1.  $subscribe 会接受一个回调与 options,在源码中，scope.run 去执行一个函数，里面执行 watch,watch 接受一个参数是 pinia.state.value[id],这里不用 store 是因为 store 中还有其他 actions,getters 的参数。
2.  watch 第二个回调可以获取更新后得值，此时执行回调，传入更新后的值即可。

# $onAction 发布订阅模式，能监控调用 action 后的动作。需要细细品。

# 流程:setup 中执行 store.$onAction,会将该传入的函数在创建时就存储起来，在执行 action 时调用。

1. 准备工作:创建一个发布订阅文件，里面存储发布与订阅的函数。

2. 在 partialState 中增加一个 $onAction 参数，然后绑定 addSubscriber.bind(null, actionSubscribers),这就会在 setup 执行 onaction 时，收集用户传入的 cb.

# $dispose 停止依赖收集,store 状态还能改变，但是监听方法全部失效

原理:在 partialState 中新增 dipose 方法，调用他，会将 scope 停止，actionSubscribers 存储订阅清空，删除 pinia.\_s 中缓存。很简单

# $state 一次性更新值，通过 defineProperty 实现。

<!-- 插件使用 -->

pinia 身上挂载 use 属性，可以在项目初始化的时候调用做一些调度，比如做持久化管理。use 接受一个函数，插件会返回 app，options，pinia，store 等参数，我们可以利用这些参数做调度。
该插件，会在每个 store 生成时执行一次，可以获取每个 store 的信息。例如状态持久化，可以从 store 中获取$id,将 id 作为 key,在 subscribe 监听状态改变后，将状态存入本地缓存中。

步骤:

1. --> 在 createPinia 中新增 use,将接受的 plugin 的放入\_p 中。
2. --> 在 createSetupStore 中，store 合并后，调用 createSetupStore.\_p 全部发布，并将参数传入进去。
