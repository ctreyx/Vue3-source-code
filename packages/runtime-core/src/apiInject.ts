import { currentInstance } from "./component";


export function provide(key, value) {
    //-->调用provide时，一定在setup,可以拿到当前instance
    if (!currentInstance) return;
    //  3 -->获取父亲做缓存
    let parentProvides =
        currentInstance.parent && currentInstance.parent.provides;

    // 1-->获取当前身上provides
    let provides = currentInstance.provides

    // 4-->只有第一次给子定义才会进入该判断，第二次是不同的
    if (parentProvides === provides) {
        //  2-->儿子的provides不能定义在父亲身上，不然乱套
        provides = currentInstance.provides = Object.create(provides);  //-->如果子更改自己的provides,就需要重写且继承原来
    }

    provides[key] = value;
}

export function inject(key) {
    if (!currentInstance) return;

    const provides = currentInstance.parent && currentInstance.parent.provides;

    if (provides && key in provides) {  //-->孙子在儿子拿不到，可以通过原型链拿父亲的
        return provides[key];
    }
}
