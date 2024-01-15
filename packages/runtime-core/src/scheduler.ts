let queue = [];
let isFlugsing = false;
const resolvePromise = Promise.resolve();

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  if (!isFlugsing) {
    isFlugsing = true;
    // -->用异步，是为了等待age++完成再渲染
    resolvePromise.then(() => {
      isFlugsing = false;
      let copy = queue.slice(0); //避免处理时又更新值，开辟新地址
      queue.length = 0; //-->拷贝完后马上清空，避免执行时放入任务，被清空
      for (let i = 0; i < copy.length; i++) {
        let job = copy[i];
        job();
      }

      copy.length = 0; //-->清空回收
    });
  }
}
