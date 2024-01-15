<script setup>
import { useCounterStore, useCounterStore1 } from './stores/useCounterStore';
const store = useCounterStore();
const store1 = useCounterStore1();
const handleAdd = () => {
  store.count++; //-->type: "direct"
  store1.count++; //-->type: "direct"
  //-->一次性更新多个属性，状态持久化好用
  // store.$state = { count: 1000, name: 'txx' };

  // store.increment();
  /* 函数方式  type: "patch function"*/
  // store.$patch(() => {
  //   store.count++;
  //   store.frult = [...store.frult, '新水果'];
  //   store.name = 'tx';
  // });
  /* 对象方式  type:patch object */
  // store.$patch({
  //   count: store.count + 1,
  //   frult: [...store.frult, '新水果'],
  //   name: 'tx',
  // });
};
// -->监听更新后的值已经更新的方式
store.$subscribe((mutation, state) => {
  // console.log('mutation', mutation);
  // console.log('state', state);
});

// -->监听action的方式,发布订阅模式
store.$onAction(({ name, after, onError }) => {
  console.log('更新action', name);
  after((res) => {
    console.log('更新action成功', res);
  });

  onError((err) => {
    console.log('更新action失败', err);
  });
});

//-->停止依赖收集,store状态还能改变，但是监听方法全部失效
const handleDipose = () => {
  store.$dispose();
};

// 重置
const handleReset = () => {
  //-->重置初始值功能，只能在options中实现。因为setup无法追溯原始值
  store.$reset(); //-->但是只针对初始值，后面新增的参数不会清除
};
</script>

<template>
  <div>
    <h1>状态机:{{ store.count }}</h1>
    <h1>状态机1:{{ store1.count }}</h1>
    <h1>double:{{ store.doubleCount }}</h1>
    <div>我的名字:{{ store.name }}</div>
  </div>
  <div>
    <span v-for="item in store.frult" :key="item"> {{ item }} </span>
  </div>
  <button @click="handleAdd">点我啊</button>
  <button @click="handleReset">重置</button>
  <button @click="handleDipose">暂停</button>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
