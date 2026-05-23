# 第4阶段内容安全复核报告

阶段目标：把第3阶段 H5 MVP 打磨到可小范围灰度状态，重点确认用户可见内容安全、免责声明一致、失败兜底可用。

## SafetyScanReport

- 扫描对象：第1阶段 `getPublishableCardDrafts()` 输出的 A/B 且审核通过卡牌候选。
- 扫描字段：`safe_title`、`safe_copy`、`action_suggestion`。
- 扫描规则：命运定论、预测准确、健康寿命、生育婚恋刑克、贵贱羞辱、犯罪倾向、敏感属性推断等禁区。
- 阶段结论：投诉风险文案为 0；自动扫描未发现需阻断的用户可见卡牌。
- C/D 条目不得进入用户结果，继续只允许作为后台研究材料。

## 审核记录

第4阶段新增 `ContentAuditRecord v0.1`，对每张可发布候选卡记录：

- `target_type=card`
- `target_id=card_id`
- `risk_hits`
- `decision=pass | rewrite | block`
- `reviewer_role`
- `notes`
- `reviewed_at`

自动扫描通过不等同于最终法律结论；公开上线前仍需法务复核。

## 文案红线

禁止用户可见结果出现：

- 命运、财富、职业、学业、婚恋结果的确定性结论。
- 健康、疾病、寿命、怀孕、生育能力、心理状态判断。
- 犯罪倾向、智力高低、道德优劣、种族、民族、宗教、政治倾向、性取向。
- 败相、恶相、贫贱、孤寡、克夫、克妻、刑克等羞辱或歧视性标签。
- AI 算命、准确预测、命中注定等宣传表达。

## 验收命令

- `npm run validate:phase4`
- `npm test`
- `npm run typecheck`
- `npm run build`
