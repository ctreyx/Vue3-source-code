export const enum NodeTypes {
  ROOT, // 根节点 0
  ELEMENT, // 元素节点 1
  TEXT, // 文本节点 2
  COMMENT, // 注释节点 3
  SIMPLE_EXPRESSION, // 表达式 4   aaa :a="aa"
  INTERPOLATION, // 双花插值 {{ }} 5   模版表达式
  ATTRIBUTE, // 属性 6
  DIRECTIVE, // 指令 7

  //containers

  COMPOUND_EXPRESSION, //复合表达式
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,

  VNODE_CALL,
  JS_CALL_EXPRESSION,
}
