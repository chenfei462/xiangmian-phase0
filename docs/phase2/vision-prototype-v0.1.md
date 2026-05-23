# 视觉原型 v0.1

第2阶段把 Phase 0 的摄像头演示升级为端侧视觉原型。目标是验证 MediaPipe Face Landmarker、特征归一、动作阈值、质量状态、性能采样和第1阶段知识库候选卡牌联动。

## 范围

- 保留 Vite + React + TypeScript 原型，不迁移 Next.js。
- 只在端侧处理摄像头帧，不上传、不保存原始图像、视频或关键点模板。
- 新增 `FaceFeatures`、`ActionThresholds`、`VisionQualityState`、`VisionPrototypeReport` 合同。
- 支持正视 2 秒、眨眼、微笑、抬眉、张口、左右回顾、闭眼 1 秒。
- 使用 `getPhase2Handoff()` 的 A/B 审核通过卡牌作为动作候选集。

## Phase 3 交接

Phase 3 MVP 可以沿用本阶段的视觉模块边界：模型加载、摄像头控制、特征归一、动作检测、性能采样、知识库卡牌选择。正式 MVP 只需要替换展示层和持久化策略，不需要重新定义动作事件合同。

## 验收

- `npm run validate:vision` 验证视觉合同、动作阈值、性能采样和知识库联动。
- `npm test` 保证第0-2阶段合同整体不回退。
- `npm run build` 保证 Web/H5 原型可打包。

