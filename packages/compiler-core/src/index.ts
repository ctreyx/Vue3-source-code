import { NodeTypes } from "./ast";


// -->编译模板
export function compile(template) {
    // 1-->编译html模板为js语法，抽象语法树
    const ast = parse(template);

    return ast
    // 2-->预处理ast语法树
    //     transform(ast)

    // 3-->最终生成代码

    //     return generate(ast)
}


/* 公共方法 */
function createParseContext(template) {
    return {
        line: 1, //-->第一行
        column: 1, //-->第一列
        offset: 0, //-->第一个
        source: template, //-->此字段会不停解析，直到解析为空
        originalSource: template, //-->这个不会变
    }
}

function isEnd(context) {
    return !context.source //--> 上下文为空字符串时表示结束
}
//-->获取起始位置
function getCursor(context) {
    const { line, column, offset } = context;
    return { line, column, offset };
}

// -->截取文本，丢入上下文与结束index
function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex)  //-->获取 asd ,剩下 <div></div> {{ss}}
    // -->还需要删除
    advanceBy(context, endIndex)

    return rawText
}

// -->删除文本，丢入上下文与结束index
function advanceBy(context, endIndex) {
    let source = context.source
    // -->更新位置
    advancePositionWithMutation(context, source, endIndex);

    context.source = context.source.slice(endIndex); //-->从结束index开始往前截取
}

//-->更新位置
const advancePositionWithMutation = (context, source, endIndex) => {
    let linesCount = 0
    let linePos = -1
    for (let i = 0; i < endIndex; i++) {
        //--> 回车加一行
        if (source.charCodeAt(i) === 10) {
            linesCount++
            linePos = i
        }
    }

    context.line += linesCount
    context.offset += endIndex
    context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
}


/* 公共方法 */




/* 1.parse 编译模块 */

function parse(template) {
    // 1-->创建上下文，核心步骤，记录解析进度
    const context = createParseContext(template);

    // 2-->解析，如果是 {{}} 表达式 ，< 代表元素，其余是文本
    let nodes = []
    while (!isEnd(context)) {
        const source = context.source
        let node
        if (source.startsWith('{{')) {
            // -->表达式解析
        } else if (source[0] === '<') {
            // -->元素解析
        }

        // -->文本
        if (!node) {
            node = parseText(context)
            console.log(node);

            break
        }
        nodes.push(node)
    }


}

// --> parseText 编译文本
const parseText = context => {
    // 1-->解析文本，只截取正常文本，如果遇到表达式或者元素就结束 。例如asd <div></div> {{ss}},使用假设法
    let endTokens = ['{{', '<']

    // 2-->假设法，默认结束长度是最后
    let endIndex = context.source.length

    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i], 1) //-->从第二个字符开始查找,查看是否有结束标记
        if (index !== -1 && endIndex > index) {
            //-->当前有index,并且大于结束index，说明在字符串内,一直定位,
            endIndex = index
        }
    }

    // -->获取起始数据
    const start = getCursor(context)

    // -->截取内容，会返回截取的内容，并且删除截取的那部分内容，更新位置
    const content = parseTextData(context, endIndex)

    return {
        type: NodeTypes.TEXT,
        content,
        // loc:getSelection() //-->todo
    }
}


/* 1.parse 编译模块结束 */