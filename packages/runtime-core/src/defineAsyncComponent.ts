import { MyIsFunction } from "@vue/shared";
import { ref } from "@vue/reactivity";
import { Fragment } from "./vnode";
import { h } from "./h";

//-->类似图片懒加载
export function defineAsyncComponent(options) {
    if (MyIsFunction(options)) {
        options = { loader: options };
    }

    return {
        setup() {
            let loaded = ref(false) //-->响应是否加载完毕
            let error = ref(false) //-->响应错误时间
            let loading = ref(false) //-->响应错误时间

            let { loader, timeout, errorComponent, delay, loadingComponent, onError } = options;
            let Comp = null

            // 自定义load支持retry
            const load = () => {
                return loader().catch(err => {
                    //-->如果失败，将errInf,retry,fail丢进onError
                    if (onError) {
                        return new Promise((resolve, reject) => {
                            const retry = () => resolve(load())
                            const fail = () => reject(err)
                            onError(err, retry, fail)
                        })
                    }
                })
            }
            load()
                .then((res) => {
                    Comp = res
                    loaded.value = true //-->-->promise返回,更改状态,重新渲染
                })
                .catch(err => error.value = err)
                .finally(() => loading.value = false) //-->最终不管对错都要取消loading

            //-->根据timeout更改错误组件状态
            setTimeout(() => {
                error.value = true;
            }, timeout);

            //-->有延迟时间,渲染loading组件
            if (delay) {
                setTimeout(() => {
                    loading.value = true;
                }, delay);
            }

            return () => {
                //-->需要优化unmount组件卸载情况
                if (loaded.value) {
                    return h(Comp)
                }
                else if (error.value && errorComponent) {
                    return h(errorComponent)
                }
                else if (loading.value && loadingComponent) {
                    return h(loadingComponent)
                }
                //-->这里需要优化unmount为Fragment清空
                return h(Fragment, []) //-->在组件未加载完毕时，加载空标签

            }
        }

    }
}