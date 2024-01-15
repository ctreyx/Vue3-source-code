
let activeEffectsScope = null
class EffectScope {
    active = true;
    parent = null;
    effects = []
    scopes = []; //-->收集子集的effectScope
    constructor(detached) {
        // detached-->判断是不是独立，如果为false独立，才收集，当父stop，子也会stop。
        if (!detached && activeEffectsScope) {
            activeEffectsScope.scopes.push(this);  //-->activeEffectsScope是父级
        }
    }
    run(fn) {
        if (this.active) {
            try {
                this.parent = activeEffectsScope
                activeEffectsScope = this
                return fn();
            } finally {
                activeEffectsScope = this.parent
            }
        }
    }
    stop() {
        if (this.active) {
            for (let i = 0; i < this.effects.length; i++) {
                this.effects[i].stop()
            }
            //   -->停止子集的依赖
            for (let i = 0; i < this.scopes.length; i++) {
                this.scopes[i].stop();
            }

            this.active = false
        }

    }
}

export function effectScope(detached = false) {
    return new EffectScope(detached)
}

//-->在 effect.ts 中，执行effect 时收集依赖
export function recordEffectScope(effect) {
    //-->在执行effect时，获取当前的 activeEffectsScope ,往里面添加 effect
    if (activeEffectsScope && activeEffectsScope.active) {
        activeEffectsScope.effects.push(effect)
    }

}

