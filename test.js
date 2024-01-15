// 校验文件名后缀是不是 xlsx和xls
function checkFileName(fileName) {
  var reg = /^[^\\\/:\*\?"<>\|]+\.(xlsx|xls)$/;
  return reg.test(fileName);
}

console.log(checkFileName('test.q'));
