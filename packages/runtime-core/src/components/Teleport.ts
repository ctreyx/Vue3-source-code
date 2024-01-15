export const Teleport = {
    __isTeleport: true,
    process(n1, n2, container, internals) {
        let { mountChildren, patchChildren, move } = internals;
        // -->初次渲染
        if (!n1) {
            const target = document.querySelector(n2.props.to); //-->获取目标地址
            if (target) {
                mountChildren(n2.children, target)
            }
        } else {
            // 1-->diff儿子内容
            patchChildren(n1, n2, container)
            // 2-->判断to属性是否变化
            if (n1.props.to !== n2.props.to) {
                const nextTarget = document.querySelector(n2.props.to)
                // -->将儿子移动新的目标地址
                n2.child.forEach(child => move(child, nextTarget))
            }

        }

    }
}


export const isTeleport = type => type.__isTeleport