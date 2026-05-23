# 第9阶段迁移报告与 Phase 10 决策建议

## Phase 8 迁移结果

Phase 8 的 `AdminConfigStore` 已映射到 Phase 9 SaaS repository：themes、campaigns、scenarios、venue activations、card blocklist、release gates、metrics fixtures 和 audit logs 均保留在租户草稿配置中。前程镜和山河镜可作为默认内部租户的发布快照。

## Phase 10 推荐方向

优先进入生产 SaaS 试点，而不是立即线下硬件化。原因是第9阶段已经形成租户、权限、发布快照、审计和匿名指标的后台闭环，适合先找 1-2 个 B 端客户做受控试点。

## 生产 SaaS 试点进入条件

- SaaS 权限策略和审计日志通过自动化测试。
- published snapshot 可稳定供 H5 前台读取，并支持回滚。
- 匿名指标看板可支撑完成率、手动兜底率、动作成功率、海报生成率、分享点击率和负面反馈数复盘。
- 隐私扫描确认后台数据、事件和导出包不含原始人脸或普通用户身份字段。

## 线下硬件化暂缓项

打印机、NFC、大屏、门票系统、设备巡检和现场网络仍需单独预研。Phase 10 若进入硬件化，应先做技术风险评估和现场隐私提示方案，不直接并入 SaaS 后台主线。

## Go/No-Go

- Go：Phase 9 报告为 `go`，权限、迁移、隐私、发布快照和回滚均通过验证。
- Hold：匿名指标聚合不稳定，发布门禁无法阻断，或客户演示空间缺少完整审计。
- No-Go：出现原始人脸上传、普通用户身份字段记录、C/D 卡牌进入用户结果、或法务/合规阻断意见。
