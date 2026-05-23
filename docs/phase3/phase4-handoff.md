# Phase 4 交接说明

第3阶段已把 MVP 主流程收敛到 Web/H5 单端体验。Phase 4 可以在不改变第1阶段知识库和第2阶段视觉合同的前提下，继续补齐发布、增长和运营能力。

## 可继续复用

- `VisionEvent v0.2`、动作阈值、质量状态和端侧摄像头处理策略。
- 第1阶段 `getPhase2Handoff()` 输出的 A/B 审核通过卡牌候选集。
- 第3阶段 `MvpSessionState`、`ConsentState`、`CalibrationResult`、`CardResult`、`MvpEvent`、`ResultTone` 合同。
- 手动抽卡兜底、免责声明和退出清理策略。

## 延期范围

- 分享海报：Phase 4 再设计无原始人脸图像的本地海报生成方案。
- 后台管理：Phase 4 再评估内容审核、卡牌上下架和来源校勘工作台。
- Next.js：Phase 4 再决定是否从 Vite 原型迁移到 Next.js App Router。
- 真实埋点服务：Phase 4 只允许匿名事件，仍不得上传原始图片、视频或人脸模板。
- 小程序：Web/H5 MVP 验证后再评估独立小程序适配成本。

## 交接检查

- 保持 C/D 条目不进入用户结果。
- 保持拒绝摄像头后可完成手动抽卡。
- 保持关闭摄像头后停止视频轨道。
- 新增分享或后台能力前，先复核第0阶段合规红线。
