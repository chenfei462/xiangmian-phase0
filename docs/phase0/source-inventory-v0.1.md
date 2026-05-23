# 资料清单 v0.1

用途：为第1阶段古籍知识库和第2阶段视觉原型提供可追溯资料入口。字段保持与 `SourceRecord v0.1` 一致：来源编号、书名/资料名、章节、短摘录、现代释义、URL、校勘状态、风险等级。

| 来源编号 | 书名/资料名 | 章节 | 短摘录 | 现代释义 | URL | 校勘状态 | 风险等级 |
|---|---|---|---|---|---|---|---|
| SRC-001 | 中国哲学书电子化计划 | 主页 | 开放电子图书馆 | 传统文本检索与出处管理入口 | https://ctext.org/zh | verified | A |
| SRC-002 | 神相全编 | 十观 | 先观骨格，次看五行 | 三停、五官、五岳等术语母库 | https://ctext.org/wiki.pl?chapter=905153&if=gb&remap=gb | needs_collation | B |
| SRC-003 | 太清神鉴 | 四库全书本全览 | 形神、三停、五岳四渎 | 形神、气色和五行体系对照 | https://zh.wikisource.org/zh-hant/太清神鑑_(四庫全書本)/全覽 | needs_collation | B |
| SRC-004 | 柳庄相法 | 全书 | 神气、声气、动态观察 | 只取人物脉络和动态观察；胎产、子嗣类不上线 | https://ctext.org/wiki.pl?chapter=90958&if=gb&remap=gb | needs_collation | C |
| SRC-005 | 人相水镜集全编 | 汇编页 | 五官、头面、相外论 | OCR 内容必须人工校勘后再入库 | https://ctext.org/wiki.pl?if=gb&remap=gb&res=473826 | ocr_unverified | C |
| SRC-006 | 神相铁关刀 | 维基文库全书 | 印堂、额、眉、眼、鼻、口 | 只取部位术语和文化寓意，剔除灾病死伤断语 | https://zh.wikisource.org/zh-hant/神相鐵關刀 | needs_collation | C |
| SRC-007 | Google AI Edge MediaPipe Face Landmarker | Face Landmarker task guide | face landmarks, blendshapes | Web/H5 端侧人脸关键点和表情动作预研 | https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker | verified | A |
| SRC-008 | 中华人民共和国个人信息保护法 | 敏感个人信息 | 生物识别信息属于敏感个人信息 | 单独同意、充分必要和严格保护措施边界 | https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm | verified | A |
| SRC-009 | 中央网信办个人信息保护政策法规问答 | 人脸、指纹、声纹等信息 | 不得通过互联网对外传输 | 端侧存储、最短保存期限和单独同意参考 | https://www.cac.gov.cn/2026-01/09/c_1769688003183197.htm | reference_only | A |
| SRC-010 | GDPR Article 9 | Special categories | biometric data | 欧盟场景下生物识别数据限制参考 | https://gdpr-info.eu/art-9-gdpr/ | reference_only | A |
| SRC-011 | GDPR Article 22 | Automated decision-making | automated processing | 避免重大影响自动化决策 | https://gdpr-info.eu/art-22-gdpr/ | reference_only | A |
| SRC-012 | GDPR Article 25 | Data protection by design | by design and by default | 默认保护和最小化采集原则 | https://gdpr-info.eu/art-25-gdpr/ | reference_only | A |

## 第1阶段处理规则

- A：可作为上线资料或技术/合规依据。
- B：可改写后上线，必须保留出处和现代释义。
- C：仅后台研究或人工校勘，默认不上线。
- D：禁止进入用户结果。

