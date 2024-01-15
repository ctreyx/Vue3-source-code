import { patchAttr } from './modules/attr';
import { patchClass } from './modules/class';
import { patchEvent } from './modules/event';
import { patchStyle } from './modules/style';

export function patchProp(el, key, preValue, nextValue) {
  // 1-->类名 el.className
  if (key === 'class') {
    patchClass(el, nextValue);
  }
  // 2-->样式 el.style
  else if (key === 'style') {
    patchStyle(el, preValue, nextValue);
  }
  // 3-->事件  addEventListener.Vue模板会将@click转为onClick，所以正则判断on开头第二个是大写的字母
  else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  }
  // 4-->普通属性 <div a='1'>  setAttribute
  else {
    patchAttr(el, key, nextValue);
  }
}
