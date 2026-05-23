# 第9阶段 SaaS 后台基础版 v0.1

## 目标

第9阶段把 Phase 8 的本地运营后台升级为 SaaS 后台基础版。系统先使用本地 TypeScript repository adapter 验证 PostgreSQL-compatible 数据模型、租户空间、账号角色、权限策略、配置版本、发布快照、匿名指标和审计日志。

## 核心能力

- `TenantWorkspace v0.1`：支持内部运营空间和示例 B 端客户空间。
- `AdminAccount v0.1`：支持产品、内容、合规、法务、运营、工程和只读观察者角色。
- `PermissionPolicy v0.1`：viewer 不可编辑，content 不可发布，legal/compliance 可阻断发布门禁，operations 可下线卡牌但必须填写原因。
- `ConfigVersion v0.2`：在 Phase 8 版本基础上加入 tenant、checksum、发布人和 rollback 信息。
- `PublishedConfigSnapshot v0.1`：公开 H5 只读取已发布快照；后台草稿不会直接进入用户结果。
- `SaasAuditLog v0.1`：后台写操作只保存 before/after hash 摘要，不保存人脸数据或大字段原文。
- `AnonymousMetricsEvent v0.2`：只接收匿名流程事件，不包含图片、视频、关键点数组、人脸模板或普通用户身份。

## 隐私与合规边界

SaaS 后台不得记录摄像头帧、原始图片、视频、关键点数组、人脸模板、普通用户姓名、手机号、用户 ID 或设备指纹。管理员账号用于后台权限和审计，不等同于前台用户身份。

## 验收口径

- Phase 8 `AdminConfigStore` 可迁移为默认租户数据，前程镜和山河镜卡池不丢失。
- published snapshot 可被 H5 前台消费；draft 配置不可被前台读取。
- blocklist、release gates、活动状态、发布和回滚均有 SaaS 审计日志。
- 权限策略覆盖所有后台写操作，越权操作必须失败。
- 本阶段不做公开自助注册、计费、合同管理、小程序、打印机、NFC、大屏或硬件 SDK。
