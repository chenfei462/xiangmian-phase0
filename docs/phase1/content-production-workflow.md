# 内容生产流水线

## 1. 古籍摘录

内容编辑从第0阶段 `SourceRecord v0.2` 中选取资料。优先级为《神相全编》《太清神鉴》《神相铁关刀》，OCR 或来源不稳定资料必须标记 `needs_collation` 或 `ocr_unverified`。

## 2. 术语拆解

每条术语写入 `TermEntry`，必须包含 `source_refs`、`original_excerpt`、`modern_gloss`、`risk_level`、`blocked_claims`、`collation_status`、`review_status`。

## 3. 风险分级

- A：可上线，保留出处和免责声明。
- B：改写后上线，删除强判断。
- C：后台研究，不进入用户结果。
- D：禁止进入用户结果。

## 4. 安全改写

上线文案只能使用“抽到、解锁、本次镜面、今日行动提醒”等表达。禁止命运、健康、寿命、生育、婚恋刑克、贵贱羞辱和敏感属性推断。

## 5. 审核流转

`pending` 表示待审，`approved` 表示可进入候选集，`blocked` 表示仅保留后台记录。A/B 条目必须经内容审核；C/D 条目必须经合规审核并保持 blocked。

