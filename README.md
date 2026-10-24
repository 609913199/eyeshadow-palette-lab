# Palette Lab · 眼影盘物料工坊

浏览器本地运行的 DIY 透明亚克力眼影盘工具。支持四格、九格、十六格与 20 格心形排版，照片上传、丝印特效、2D 编辑、3D 镜面预览、高清图片与打印裁切图导出。

## 使用

使用静态 HTTP 服务器打开 index.html，或在仓库 Settings → Pages 中选择 main 分支和根目录发布。

所有运行依赖随源码打包，不依赖外部字体、CDN 或图像服务。照片只在浏览器内处理，刷新后会清空，可保存工程继续编辑。

大头抠图使用 MediaPipe SelfieMulticlass 本地 CPU 模型，区分脸、头发、衣服与背景；支持圈选、擦除、恢复与撤销。首次需要下载约 27 MB 的本地模型及运行文件，不向模型服务上传照片。复杂发丝或遮挡需手工修补。波浪丝印采用随明暗改变粗细的弯曲斜线，不对五官整体扭曲。3D 需要 WebGL 支持。

## 文件

- index.html / style.css / app.js：界面与逻辑
- three.module.js / OrbitControls.js / Reflector.js：Three.js 0.170.0 及其组件

Third-party Three.js components are distributed under the MIT License; see THIRD_PARTY_LICENSES.txt.

## AI 依赖

Google SelfieMulticlass 256×256 v1 模型采用 Apache 2.0 许可，参见 MEDIAPIPE_LICENSE.txt。ONNX 转换来源：https://huggingface.co/senty-au/selfie_multiclass_256x256-ONNX （保留 Google 原权重；模型 SHA256：35ec1ecd9ee7f85073c99c00020b7f6751b69506eeacf683bc8665f6117f85b0）。推理使用 ONNX Runtime Web 1.22.0 的 WASM CPU，采用 MIT 许可，见 ONNXRUNTIME_LICENSE.txt。运行文件与模型均由此仓库提供，无需访问外部 AI 服务。
