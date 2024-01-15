//--> 最长递增子序列,基于贪心算法+二分查找+反向追溯
// 原理:
// -->1.当前的比集合中最后一个大，直接push
// -->2.当前的小，进入二分查找，找到第一个大于当前数的替换位置

// 3 2 8 9 5 6 7 11 15 4-->查找个数
// 3
// 2 -->2比3小，查找，找到第一个比2大的
// 2 8 9
// 2 5 9 -->5比9小，查找第一个大于5的
// 2 5 6 -->6比 2 5 大 ，替换9
// 2 5 6 7 11 15 -->最长个数为6个
// 2 4 6 7 11 15 -->就算新增一个4，但是最长个数也没有变，还是6个

function getSequence(arr) {
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

// const res = getSequence([1, 2, 3, 4, 5, 6, 7, 0]); //案例1-->先解决顺序递增,结果 0 1 2 3 4 5 6
// const res = getSequence([3, 2, 8, 9, 5, 6, 7, 11, 15, 4]); //案例2 -->获取正确个数，下面获取正确序列。  [ 1, 9, 5, 6, 7, 8 ] 得到的是索引
const res = getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]); //案例3 -->获取正确个数，下面获取正确序列。  [ 0，0，undefined,1,3,4,4,6,1] 得到的是索引
// [ 0, 1, 3, 4, 6, 7 ]
console.log(res);
