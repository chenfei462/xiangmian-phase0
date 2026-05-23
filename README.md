# 观相镜 Phase 15

第15阶段交付：商业客户继续扩展 v0.1。当前版本在 Phase 14 稳定运营基础上，扩展到 15-25 个人工准入商业客户，补齐客户增长 cohort、增长策略、生命周期状态、支持容量预测、客户组合报告、续约信号、计费证据收集和 Phase 16 决策依据。

## Commands

```bash
npm install
npm test
npm run validate:knowledge
npm run validate:vision
npm run validate:mvp
npm run validate:phase4
npm run validate:phase5
npm run validate:phase6
npm run validate:phase7
npm run validate:phase8
npm run validate:phase9
npm run validate:phase10
npm run validate:phase11
npm run validate:phase12
npm run validate:phase13
npm run validate:phase14
npm run validate:phase15
npm run typecheck
npm run build
npm run dev
```

## Notes

- 前台继续使用 Vite + React + TypeScript H5，不迁移 Next.js，不做小程序。
- Phase 15 默认扩展到 15-25 个人工准入商业客户，不开放公开注册、自助购买、在线支付、正式计费合同系统或代理商体系。
- H5 只读取 active tenant 的 `commercial-approved published snapshot`；draft、review、paused、suspended、archived、rolled_back 不会进入用户结果。
- Managed PostgreSQL-compatible 边界继续以 TypeScript adapter 和 DDL preview 验证，覆盖 growth cohort、growth policy、lifecycle state、capacity forecast、retention signal、billing evidence backlog、portfolio report。
- 默认不上传、不保存原始图片或视频，不保存人脸模板或关键点数组，不记录普通用户身份字段，不接打印机、NFC、大屏、门票系统或硬件 SDK。
