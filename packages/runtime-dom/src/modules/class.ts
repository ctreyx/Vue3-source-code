export function patchClass(el, nextValue) {
  // -->class比较简单，不需要对比，直接覆盖。如果未null,就删除
  // <div class="a b c" ></div>
  if (nextValue == null) {
    el.removeAttribute('class');
  } else {
    el.className = nextValue;
  }
}
