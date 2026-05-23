# 古籍知识库 v0.1

第1阶段目标是把第0阶段的资料清单扩展为可检索、可审核、可交接的古籍知识库。当前交付为本地 TypeScript 数据层，后续 MVP 可迁移到 Next.js 后端或数据库。

## 范围

- 交付 360 条 `TermEntry v0.1`，满足 300-500 条数量要求。
- 交付 315 条 `CardDraft v0.1`，均来自 A/B 风险、审核通过的术语条目。
- 8 类内容分类：三停、五官、五岳四渎、五行形局、神气心相、威仪动态、铁关刀部位、禁用研究。
- 7 个卡组：三停流转、五官守护、山河五岳、五行形局、神气心相、铁关刀秘钥、手动问镜。
- A/B/C/D 风险等级可检索；C/D 条目只作为后台研究，不进入可发布候选集。

## 数据合同

- `TermEntry`：术语、分类、来源、短摘录、现代释义、风险等级、禁用断语、校勘状态、审核状态。
- `CardDraft`：卡牌标题、安全文案、行动建议、动作触发、发布状态。
- `RiskTag`：风险原因、禁用断语、改写策略。
- `ReviewRecord`：内容、合规、产品三类审核记录。
- `KnowledgeQuery`：支持来源、术语、分类、风险、审核状态、动作触发筛选。

## Phase 2/3 交接

`getPhase2Handoff()` 按 `look_stable | blink | smile | brow_up | mouth_open | head_turn | manual_draw` 输出候选卡牌。视觉原型和 MVP 规则引擎只消费 A/B 且审核通过的卡牌草稿。

## 验收标准

- `npm test` 覆盖 schema、数量、出处、风险、检索、导出和文档验收。
- `npm run typecheck` 保证 TypeScript 合同一致。
- `npm run build` 保证现有 Web/H5 原型仍可构建。

