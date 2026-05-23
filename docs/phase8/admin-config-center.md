# 第8阶段运营后台与配置中心 v0.1

## 目标

第8阶段把 Phase 7 的前程镜、山河镜本地多主题注册表沉淀为可复用的后台配置中心。后台 v0.1 只使用本地 TypeScript/Zod 配置和 fixture 数据，验证活动、主题、场景、卡牌下线、发布门禁、匿名指标和审计日志的工作流。

## 核心交付

- `AdminConfigStore v0.1`：集中管理 themes、campaigns、scenarios、venue activations、card blocklist、release gates、metrics fixtures 和 audit logs。
- `ConfigVersion v0.1`：支持 draft、review、published、archived 状态，为后续真实后台和数据库迁移保留版本边界。
- `CardBlocklist` 管理：运营可在本地后台演练 block/unblock；命中 blocklist 的卡牌不得进入结果页或海报。
- `ReleaseGate` 检查：发布前必须确认产品、内容、合规、法务、运营、工程门禁。
- 匿名指标看板：只读取本地匿名事件和指标 fixture，展示完成率、手动兜底率、动作成功率、海报生成率、分享点击和负面反馈。
- 操作审计：block/unblock、活动状态变更、发布门禁变更和配置导入均写入 `AdminAction`。

## 隐私边界

后台配置、指标、审计、导出包不得包含摄像头帧、原始图片、视频、关键点数组、人脸模板、姓名、手机号、用户 ID 或设备指纹。Phase 8 继续保持端侧视觉处理、手动兜底、免责声明和卡牌下线开关。

## 验收口径

- Phase 7 注册表可作为后台种子数据导入，并保持前程镜、山河镜用户链路不退化。
- 配置可导出再导入，结构通过 Zod 校验。
- 所有后台编辑动作必须记录审计日志。
- 发布报告 `Phase8AdminReport` 在隐私检查、发布门禁和内容安全均通过时返回 `go`。
- 本阶段不接真实生产数据库、登录系统、SaaS 租户隔离、打印机、NFC、大屏或硬件 SDK。
