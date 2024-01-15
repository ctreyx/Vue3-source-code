import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
// import { createPinia } from 'pinia';
import { createPinia } from './pinia';

const plugin = {
  install(app) {
    // console.log('plugin install', app);
  },
};
const pinia = createPinia();

// -->use插件，有几个store会执行几次
// -->插件会返回app，options，pinia，store
pinia.use(function (arg) {
  console.log(arg);
  const { store } = arg;
  const { $id } = store;
  let local = localStorage.getItem($id);
  if (local) {
    store.$state = JSON.parse(local);
  }
  store.$subscribe((mutation, state) => {
    localStorage.setItem($id, JSON.stringify(state));
  });
});

createApp(App).use(plugin).use(pinia).mount('#app');

//-->等价于 render(h(App),app)

// Vuex--> 1.ts兼容性差。  2.只能有一个store,module引入多个store  3.mutations与action区别

// pinia-->1.ts兼容强。   2.可以有多个store。   3.mutations删除  4.体积小
