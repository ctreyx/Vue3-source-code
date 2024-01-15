const { build } = require('esbuild');
const { resolve } = require('path');
// args--> { _: [ 'reactivity' ], f: 'global' }
// minimist --> 解析命令行参数
const args = require('minimist')(process.argv.slice(2)); //node scripts/dev.js reactivity -f global"

const target = args._[0] || 'reactivity'; //打包目标 reactivity
const format = args.f || 'global'; //打包格式 global

// -->获取目标打包package.json文件
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

//  -->打包格式 life->立即执行
// cjs->node中模块 -->  module.exports
//  esm->浏览器中esModule --> import
const outputFormat = format.startsWith('global')
  ? 'iife'
  : format === 'cjs'
  ? 'cjs'
  : 'esm';

// --> 打包输出路径
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);

//-->打包
build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)], // ->打包目标
  outfile, // --> 打包输出路径
  bundle: true, //->打包一起
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name,
  platform: format === 'cjs' ? 'node' : 'browser', //平台
  watch: {
    //监控文件变化
    onRebuild(error) {
      if (!error) console.log('rebuilt~~~~~,重新打包完成');
    },
  },
}).then(() => {
  console.log('watching...,努力打包中');
});
