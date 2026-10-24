# Palette Lab · 眼影盘物料工坊

浏览器本地运行的 DIY 透明亚克力眼影盘工具。支持四格、九格、十六格与 20 格心形排版，照片上传、丝印特效、2D 编辑、3D 镜面预览、高清图片与打印裁切图导出。

## 使用

使用静态 HTTP 服务器打开 index.html，或在仓库 Settings → Pages 中选择 main 分支和根目录发布。

所有运行依赖随源码打包，不依赖外部字体、CDN 或图像服务。照片只在浏览器内处理，刷新后会清空，可保存工程继续编辑。

抠图为边缘去底，复杂背景需手工修补。3D 需要 WebGL 支持。

## 文件

- index.html / style.css / app.js：界面与逻辑
- three.module.js / OrbitControls.js / Reflector.js：Three.js 0.170.0 及其组件

Third-party Three.js components are distributed under the MIT License; see THIRD_PARTY_LICENSES.txt.
