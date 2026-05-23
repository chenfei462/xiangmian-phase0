import {
  CardRuleSchema,
  PrivacyDefaultSchema,
  SourceRecordSchema,
  type CardRule,
  type PrivacyDefault,
  type SourceRecord
} from "./contracts";

export const privacyDefault: PrivacyDefault = PrivacyDefaultSchema.parse({
  camera_frames: "local_only",
  raw_image_upload: false,
  biometric_template_storage: false,
  identity_recognition: false,
  analytics: "anonymous_events_only"
});

export const sourceRecords: SourceRecord[] = SourceRecordSchema.array().parse([
  {
    source_id: "SRC-001",
    book_title: "中国哲学书电子化计划",
    chapter: "主页",
    original_excerpt: "开放电子图书馆",
    modern_gloss: "传统文本检索与出处管理入口。",
    source_url: "https://ctext.org/zh",
    collation_status: "verified",
    risk_level: "A"
  },
  {
    source_id: "SRC-002",
    book_title: "神相全编",
    chapter: "十观",
    original_excerpt: "先观骨格，次看五行",
    modern_gloss: "用于三停、五官、五岳等术语母库。",
    source_url: "https://ctext.org/wiki.pl?chapter=905153&if=gb&remap=gb",
    collation_status: "needs_collation",
    risk_level: "B"
  },
  {
    source_id: "SRC-003",
    book_title: "太清神鉴",
    chapter: "四库全书本全览",
    original_excerpt: "形神、三停、五岳四渎",
    modern_gloss: "用于形神、气色和五行体系对照。",
    source_url: "https://zh.wikisource.org/zh-hant/%E5%A4%AA%E6%B8%85%E7%A5%9E%E9%91%91_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%85%A8%E8%A6%BD",
    collation_status: "needs_collation",
    risk_level: "B"
  },
  {
    source_id: "SRC-004",
    book_title: "柳庄相法",
    chapter: "全书",
    original_excerpt: "神气、声气、动态观察",
    modern_gloss: "用于相法人物脉络和问答式材料；胎产、子嗣类内容不上线。",
    source_url: "https://ctext.org/wiki.pl?chapter=90958&if=gb&remap=gb",
    collation_status: "needs_collation",
    risk_level: "C"
  },
  {
    source_id: "SRC-005",
    book_title: "人相水镜集全编",
    chapter: "汇编页",
    original_excerpt: "五官、头面、相外论",
    modern_gloss: "汇编型参考，OCR 内容必须人工校勘后再入库。",
    source_url: "https://ctext.org/wiki.pl?if=gb&remap=gb&res=473826",
    collation_status: "ocr_unverified",
    risk_level: "C"
  },
  {
    source_id: "SRC-006",
    book_title: "神相铁关刀",
    chapter: "维基文库全书",
    original_excerpt: "印堂、额、眉、眼、鼻、口",
    modern_gloss: "只取部位术语和文化寓意，剔除灾病死伤断语。",
    source_url: "https://zh.wikisource.org/zh-hant/%E7%A5%9E%E7%9B%B8%E9%90%B5%E9%97%9C%E5%88%80",
    collation_status: "needs_collation",
    risk_level: "C"
  },
  {
    source_id: "SRC-007",
    book_title: "Google AI Edge MediaPipe Face Landmarker",
    chapter: "Face Landmarker task guide",
    original_excerpt: "face landmarks, blendshapes, transformation matrices",
    modern_gloss: "用于 Web/H5 端侧人脸关键点和表情动作技术预研。",
    source_url: "https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker",
    collation_status: "verified",
    risk_level: "A"
  },
  {
    source_id: "SRC-008",
    book_title: "中华人民共和国个人信息保护法",
    chapter: "敏感个人信息",
    original_excerpt: "生物识别信息属于敏感个人信息",
    modern_gloss: "用于单独同意、充分必要和严格保护措施边界。",
    source_url: "https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    collation_status: "verified",
    risk_level: "A"
  },
  {
    source_id: "SRC-009",
    book_title: "中央网信办个人信息保护政策法规问答",
    chapter: "人脸、指纹、声纹等信息",
    original_excerpt: "不得通过互联网对外传输",
    modern_gloss: "用于端侧存储、最短保存期限和单独同意设计参考。",
    source_url: "https://www.cac.gov.cn/2026-01/09/c_1769688003183197.htm",
    collation_status: "reference_only",
    risk_level: "A"
  },
  {
    source_id: "SRC-010",
    book_title: "GDPR Article 9",
    chapter: "Special categories of personal data",
    original_excerpt: "biometric data for identifying a natural person",
    modern_gloss: "用于欧盟场景下生物识别数据限制参考。",
    source_url: "https://gdpr-info.eu/art-9-gdpr/",
    collation_status: "reference_only",
    risk_level: "A"
  },
  {
    source_id: "SRC-011",
    book_title: "GDPR Article 22",
    chapter: "Automated individual decision-making",
    original_excerpt: "automated processing, including profiling",
    modern_gloss: "用于避免重大影响自动化决策。",
    source_url: "https://gdpr-info.eu/art-22-gdpr/",
    collation_status: "reference_only",
    risk_level: "A"
  },
  {
    source_id: "SRC-012",
    book_title: "GDPR Article 25",
    chapter: "Data protection by design and by default",
    original_excerpt: "data protection by design and by default",
    modern_gloss: "用于默认保护和最小化采集原则。",
    source_url: "https://gdpr-info.eu/art-25-gdpr/",
    collation_status: "reference_only",
    risk_level: "A"
  }
]);

export const sampleRules: CardRule[] = CardRuleSchema.array().parse([
  {
    rule_id: "R-SANTING-001",
    source_id: "SRC-002",
    term: "三停",
    risk_level: "A",
    input_tags: ["face_centered", "quality_passed"],
    trigger: "look_stable",
    card_id: "CARD-SANTING-001",
    safe_copy: "本次镜面抽到三停调和卡。今天适合把事情分成开局、推进、收束三段完成。",
    blocked_claims: ["富贵", "贫贱", "寿夭", "命定"],
    review_status: "approved"
  },
  {
    rule_id: "R-MU-001",
    source_id: "SRC-003",
    term: "神气",
    risk_level: "A",
    input_tags: ["blink_detected", "eye_motion"],
    trigger: "blink",
    card_id: "CARD-DIANXING-001",
    safe_copy: "你点亮了点星卡。本次互动提醒你先观察，再做选择。",
    blocked_claims: ["善恶", "智力", "犯罪倾向"],
    review_status: "approved"
  },
  {
    rule_id: "R-HEQI-001",
    source_id: "SRC-003",
    term: "和气",
    risk_level: "A",
    input_tags: ["smile_detected", "mouth_corner_up"],
    trigger: "smile",
    card_id: "CARD-HEQI-001",
    safe_copy: "你解锁了和气卡。今天适合用一句清楚、温和的话推进一件小事。",
    blocked_claims: ["人缘必好", "婚恋结果", "性格定论"],
    review_status: "approved"
  },
  {
    rule_id: "R-TIANTING-001",
    source_id: "SRC-002",
    term: "天庭",
    risk_level: "B",
    input_tags: ["brow_up_detected", "upper_face_motion"],
    trigger: "brow_up",
    card_id: "CARD-TIANTING-001",
    safe_copy: "你开启了天庭卡。本次主题是把想法写下来，让计划先有轮廓。",
    blocked_claims: ["官运", "贵贱", "前程断言"],
    review_status: "approved"
  },
  {
    rule_id: "R-CHUNA-001",
    source_id: "SRC-002",
    term: "出纳",
    risk_level: "A",
    input_tags: ["jaw_open_detected", "mouth_motion"],
    trigger: "mouth_open",
    card_id: "CARD-CHUNA-001",
    safe_copy: "你抽到出纳卡。本次建议是把要表达的话压缩成一句可执行请求。",
    blocked_claims: ["口舌灾", "祸福", "疾病"],
    review_status: "approved"
  },
  {
    rule_id: "R-SHANHE-001",
    source_id: "SRC-003",
    term: "五岳四渎",
    risk_level: "B",
    input_tags: ["head_turn_detected", "yaw_motion"],
    trigger: "head_turn",
    card_id: "CARD-SHANHE-001",
    safe_copy: "你切换到山河顾盼卡。今天可以从另一个角度看同一件事。",
    blocked_claims: ["成败", "福祸", "运势定论"],
    review_status: "approved"
  },
  {
    rule_id: "R-MANUAL-001",
    source_id: "SRC-001",
    term: "手动抽卡",
    risk_level: "A",
    input_tags: ["camera_refused", "manual_mode"],
    trigger: "manual_draw",
    card_id: "CARD-MANUAL-001",
    safe_copy: "你进入手动问镜模式。本次不使用摄像头，只抽取一张文化行动卡。",
    blocked_claims: ["身份识别", "面部判断", "敏感属性"],
    review_status: "approved"
  },
  {
    rule_id: "R-BLOCKED-001",
    source_id: "SRC-004",
    term: "胎产",
    risk_level: "D",
    input_tags: ["blocked_domain"],
    trigger: "manual_draw",
    card_id: "CARD-BLOCKED-001",
    safe_copy: "该条目仅作后台研究，不进入用户结果。",
    blocked_claims: ["怀孕", "生育", "子嗣"],
    review_status: "blocked"
  }
]);
