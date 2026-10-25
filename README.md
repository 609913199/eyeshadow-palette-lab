# Palette Lab · 眼影盘物料工坊

浏览器本地运行的 DIY 透明亚克力眼影盘工具。支持四格、九格、十六格与 20 格心形排版，照片上传、丝印特效、2D 编辑、3D 镜面预览、高清图片与打印裁切图导出。

## 使用

使用静态 HTTP 服务器打开 index.html，或在仓库 Settings → Pages 中选择 main 分支和根目录发布。

所有运行依赖随源码打包，不依赖外部字体、CDN 或图像服务。照片只在浏览器内处理，刷新后会清空，可保存工程继续编辑。

大头抠图使用 MediaPipe SelfieMulticlass 本地 CPU 模型，区分脸、头发、衣服与背景；支持圈选、擦除、恢复与撤销。模型在独立 Worker 中运行，加载显示进度；20 秒无下载数据会自动重试一次，分段保存进度，慢网持续下载时不会被整体时间限制中断；65 秒无状态变化才停止，支持随时取消。每段最大 256 KiB，已完成分段会保存在本机，取消、刷新后重试可续传。首次需要下载约 16 MB 的本地模型及运行文件，不向模型服务上传照片。复杂发丝或遮挡需手工修补。波浪丝印将斜向丝印线条变为周期性起伏的正弦波浪线，明暗控制线宽。3D 需要 WebGL 支持。

## 文件

- index.html / style.css / app.js：界面与逻辑
- three.module.js / OrbitControls.js / Reflector.js：Three.js 0.170.0 及其组件

Third-party Three.js components are distributed under the MIT License; see THIRD_PARTY_LICENSES.txt.

## AI 依赖

Google SelfieMulticlass 256×256 v1 模型采用 Apache 2.0 许可，参见 MEDIAPIPE_LICENSE.txt。ONNX 转换来源：https://huggingface.co/senty-au/selfie_multiclass_256x256-ONNX （保留 Google 原权重；模型 SHA256：35ec1ecd9ee7f85073c99c00020b7f6751b69506eeacf683bc8665f6117f85b0）。推理使用 ONNX Runtime Web 1.22.0 的 WASM CPU，采用 MIT 许可，见 ONNXRUNTIME_LICENSE.txt。运行文件与模型均由此仓库提供，无需访问外部 AI 服务。

### 轻量模型

head-segmentation-q8.onnx 由原模型逐通道 INT8 权重量化生成，使用 DequantizeLinear 保留浮点激活，约 4.3 MB。转换脚本为 quantize-head.py（依赖 onnx、numpy）。在本项目所用完整参考截图和头像裁切上的头部掩膜 IoU 相对原版约为 98.7%、97.9%，这不代表所有照片的准确率。首轮全图识别后，会裁切头部重新分割。

运行示例：`python quantize-head.py head-segmentation.onnx head-segmentation-q8.onnx`

### 网络较慢时

可下载 PaletteLab-Offline-AI.paletteai，在抠图窗口选择“从文件安装离线 AI 包”。文件仅包含公开模型、运行文件和许可文本，不含用户照片。离线安装会校验两份文件 SHA256，并将分段保存到当前浏览器；随后识别无需下载模型。浏览器清理网站数据后需重新安装。

## 盖背手绘、背景块与开合

- “绘制镜子背面”打开触摸画布；烫银与白色像素可混合，支持擦除、撤销、重做、图形辅助及透明 PNG 导出。烫银使用圆润凸边、接触阴影与银色反光；3D 通过同一高度场生成真实浅浮雕网格，配合金属、清漆及细节法线。移动画笔时使用轻量预览，松笔后计算完整浮雕；平面 PNG 为静态银色高光近似，不能替代真实烫银工艺。镜面在内侧，图案在外侧。
- 单格可切换无图背景块，支持纯色、双色渐变、柔光与棋盘底纹，以及现有艺术滤镜。无需上传照片也能导出。
- 盒盖支持 0–180° 滑杆和数值输入；“盖背展示”将相机转向外侧。
- 工程格式 v2 保存绘画、背景块和开合角度，继续兼容 v1 工程。
