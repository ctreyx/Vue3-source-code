export function getSequence(arr) {
  const len = arr.length;
  const result = [0]; //-->以默认第0个为基数做序列

  let start, end, middle; //5-->二分查找开始结束与中间针

  let resultLastIndex;

  const p = arr.slice(0); //-->最后要标记索引**当前放的东西不关心，但要和数组一样长**

  for (let i = 0; i < len; i++) {
    let arrI = arr[i]; //1-->获取当前数
    // -->vue中序列为0是新增，意味新增，没有意义
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1]; //3-->result保存的是arr中的i
      // 4-->我们对比的是arr中数字的大小，result保存的是arr中的index,所以需要取出来last与当前对比
      if (arr[resultLastIndex] < arrI) {
        result.push(i); //-->如果大于，直接push到最后一位
        p[i] = resultLastIndex; //3-->当前放到末尾的，记住它前面那个是谁
        continue;
      }
    }

    // -->如果当前值小于最后一位，那么进入二分查找，在结果集中找比当前值大的，用当前值索引替换掉
    start = 0;
    end = result.length - 1;
    //-->start===end停止,1 2 3 4 middle 6 7 8 9 ,如果对比的值大于middle,那么舍弃左边，查找右边。
    while (start < end) {
      middle = ((start + end) / 2) | 0; //-->向下取整，获取中间针

      if (arr[result[middle]] < arrI) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    // 6-->找到中间值后，我们需要做替换操作，此时start和end都是同一个值
    if (arr[result[end]] > arrI) {
      result[end] = i;
      p[i] = result[end - 1]; //3-->记住它前面那个是谁
    }
  }
  //  3-->通过最后一项回溯
  let i = result.length;
  let last = result[i - 1]; //-->找最后一项
  while (i-- > 0) {
    result[i] = last; // 最后一项是确定的
    last = p[last];
  }

  return result;
}
