// MVU Zod 运行时加载（全球 CDN 优先）
// 运行时从远程地址加载 MagVarUpdate bundle，无需本地安装 zod
try {
  await import('https://cdn.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js');
} catch (error) {
  await import('https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js');
}
