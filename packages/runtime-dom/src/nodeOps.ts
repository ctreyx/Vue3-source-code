export const nodeOps = {
  // 增 删 改 查
  insert(child, parent, anchor = null) {
    // 如果没有achor，等于appendChild,插到最后
    parent.insertBefore(child, anchor);
  },
  remove(child) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  setElementText(element, text) {
    element.textContent = text;
  },
  setText(node, text) {
    node.nodeValue = text; //-->文本的值
  },
  querySelector(selector) {
    return document.querySelector(selector);
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  },
  createElement(tag) {
    return document.createElement(tag);
  },
  createText(text) {
    return document.createTextNode(text);
  },
};
