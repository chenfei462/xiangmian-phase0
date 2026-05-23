# Web/H5 技术预研简报

状态：第0阶段可运行原型已落地。当前目录使用 Vite + React + TypeScript 作为轻量预研壳，原因是目标目录中文名会阻断 `create-next-app` 的 npm 包名校验，且完整 Next.js 依赖安装耗时过长。正式 MVP 仍建议迁移到 Next.js App Router。

## 1. 预研目标

- 验证浏览器摄像头授权与拒绝摄像头后的手动抽卡路径。
- 验证 MediaPipe Face Landmarker Web 的加载方案、WASM 根路径和模型地址。
- 验证从 blendshape 到 `VisionEvent v0.1` 的动作映射。
- 验证规则引擎只返回 A/B 风险、审核通过且无高风险断言的卡牌。

## 2. 技术路线

- UI：React + TypeScript。
- 本地原型：Vite，便于快速启动和验证。
- 正式 MVP 默认：Next.js App Router，沿用本阶段的 `src/lib/*` 合同、规则和内容数据。
- MediaPipe：浏览器运行时从 CDN 加载 `@mediapipe/tasks-vision`，模型使用 Face Landmarker float16 task。
- 数据：第0阶段无后端；资料、规则和隐私默认值用 TypeScript 常量固化。

## 3. 动作事件

| 动作事件 | 来源 | 当前实现 |
|---|---|---|
| look_stable | 检测到人脸且无强动作 | 开镜后和 MediaPipe 循环均可触发 |
| blink | eyeBlinkLeft/Right | blendshape 阈值触发，另有模拟按钮 |
| smile | mouthSmileLeft/Right | blendshape 阈值触发，另有模拟按钮 |
| brow_up | browOuterUpLeft/Right | blendshape 阈值触发，另有模拟按钮 |
| mouth_open | jawOpen | blendshape 阈值触发，另有模拟按钮 |
| head_turn | 后续姿态矩阵/yaw | 当前用模拟按钮验证规则链路 |
| manual_draw | 拒绝摄像头或用户主动选择 | 完整可用 |

## 4. Go/No-Go 风险与结论

- Go：React/TypeScript、规则引擎、接口合同、手动抽卡和摄像头权限链路可进入后续阶段。
- Go：MediaPipe Face Landmarker 的 Web 加载方案已在代码层接入，可在浏览器环境继续实测。
- No-Go 条件：若目标活动现场网络无法访问 CDN，必须改为本地托管 WASM 与 task 模型。
- 风险：低端移动设备可能需要降帧；正式 MVP 应增加设备性能探测和按钮替代。
- 风险：Next.js 正式脚手架需使用 ASCII 包名；中文目录可保留，但 `package.json.name` 必须合法。

## 5. 验收方式

- 运行 `npm test` 验证接口、规则护栏和文档交付物。
- 运行 `npm run typecheck` 验证 TypeScript 合同。
- 运行 `npm run build` 验证 Web/H5 原型可打包。
- 运行 `npm run dev` 后在浏览器测试开镜、拒绝摄像头、手动抽卡和至少 3 个动作事件。
