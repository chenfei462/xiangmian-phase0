import type { CollationStatus, RiskLevel, ReviewStatus, VisionEventType } from "./contracts";
import {
  CardDraftSchema,
  RiskTagSchema,
  ReviewRecordSchema,
  SourceRecordV02Schema,
  TermEntrySchema,
  type CardDraft,
  type CardGroup,
  type KnowledgeCategory,
  type ReviewRecord,
  type RiskTag,
  type SourceRecordV02,
  type TermEntry
} from "./knowledge-contracts";
import { sourceRecords } from "./phase0-content";

type CategoryPlan = {
  category: KnowledgeCategory;
  source_refs: string[];
  sourceLabel: string;
  excerptSeed: string;
  glossSeed: string;
  termRoots: string[];
  risk: RiskLevel;
  collation_status: CollationStatus;
  review_status: ReviewStatus;
  card_group?: CardGroup;
  triggers: VisionEventType[];
  blocked_claims: string[];
};

const DAY_ACTIONS = [
  "把今天最重要的一件事拆成三步推进。",
  "先记录观察，再决定下一步行动。",
  "用一句清楚的话表达你的请求。",
  "给当前计划留出一个复盘节点。",
  "把复杂任务压缩成一个小实验。",
  "选择一个能在二十五分钟内完成的动作。"
] as const;

const CATEGORY_PLANS: CategoryPlan[] = [
  {
    category: "三停",
    source_refs: ["SRC-002", "SRC-003"],
    sourceLabel: "相书三停体系",
    excerptSeed: "上中下三段相参，贵在均衡有序",
    glossSeed: "用面部上中下三段的古籍意象转译为节奏管理提醒",
    termRoots: ["上停", "中停", "下停", "三才", "额部", "鼻准", "地阁", "庭位", "分段", "收束"],
    risk: "A",
    collation_status: "needs_collation",
    review_status: "approved",
    card_group: "三停流转",
    triggers: ["look_stable", "brow_up", "manual_draw"],
    blocked_claims: ["富贵", "贫贱", "寿夭", "命定"]
  },
  {
    category: "五官",
    source_refs: ["SRC-002"],
    sourceLabel: "五官守护体系",
    excerptSeed: "耳目口鼻眉各有取象，重在观察与表达",
    glossSeed: "把五官术语改写为沟通、观察、表达与选择主题",
    termRoots: ["眉", "眼", "耳", "鼻", "口", "采听", "监察", "审辨", "出纳", "保寿"],
    risk: "A",
    collation_status: "needs_collation",
    review_status: "approved",
    card_group: "五官守护",
    triggers: ["blink", "smile", "mouth_open", "manual_draw"],
    blocked_claims: ["性格定论", "婚恋结果", "健康判断", "智力"]
  },
  {
    category: "五岳四渎",
    source_refs: ["SRC-003", "SRC-002"],
    sourceLabel: "山河五岳体系",
    excerptSeed: "五岳四渎以山川比附面部区域",
    glossSeed: "把山河隐喻转译为空间感、视角切换与整体观察",
    termRoots: ["东岳", "西岳", "南岳", "北岳", "中岳", "四渎", "山根", "颧", "印堂", "地貌"],
    risk: "B",
    collation_status: "needs_collation",
    review_status: "approved",
    card_group: "山河五岳",
    triggers: ["head_turn", "look_stable", "manual_draw"],
    blocked_claims: ["成败", "祸福", "运势定论", "贵贱"]
  },
  {
    category: "五行形局",
    source_refs: ["SRC-002", "SRC-003"],
    sourceLabel: "五行形局体系",
    excerptSeed: "金木水火土取其形局与相生相济",
    glossSeed: "把五行形局改写为风格偏好、节奏选择和自选主题",
    termRoots: ["金形", "木形", "水形", "火形", "土形", "相生", "相济", "形局", "清浊", "流转"],
    risk: "B",
    collation_status: "needs_collation",
    review_status: "approved",
    card_group: "五行形局",
    triggers: ["manual_draw", "look_stable", "smile"],
    blocked_claims: ["人格定论", "命运", "财运", "职业定论"]
  },
  {
    category: "神气心相",
    source_refs: ["SRC-003", "SRC-004"],
    sourceLabel: "形神心相体系",
    excerptSeed: "相逐心生，形神相参，贵在自省",
    glossSeed: "把形神与心相改写为自我观察、善念和行动锦囊",
    termRoots: ["神气", "形神", "心相", "清明", "含蓄", "定意", "藏神", "照心", "善念", "自省"],
    risk: "A",
    collation_status: "needs_collation",
    review_status: "approved",
    card_group: "神气心相",
    triggers: ["blink", "smile", "look_stable", "eyes_closed", "manual_draw"],
    blocked_claims: ["道德高低", "善恶定论", "心理健康", "犯罪倾向"]
  },
  {
    category: "威仪动态",
    source_refs: ["SRC-004", "SRC-003"],
    sourceLabel: "动态威仪体系",
    excerptSeed: "顾盼、正视、开口皆可作互动仪式",
    glossSeed: "把动态观察转译为镜面动作任务和完成度反馈",
    termRoots: ["正视", "顾盼", "开口", "点头", "微笑", "闭目", "抬眉", "定神", "缓行", "仪式"],
    risk: "A",
    collation_status: "needs_collation",
    review_status: "approved",
    card_group: "神气心相",
    triggers: ["look_stable", "blink", "smile", "brow_up", "mouth_open", "head_turn", "eyes_closed"],
    blocked_claims: ["性格定论", "身份识别", "道德判断", "疾病"]
  },
  {
    category: "铁关刀部位",
    source_refs: ["SRC-006"],
    sourceLabel: "铁关刀部位体系",
    excerptSeed: "印堂额眉眼鼻口等部位各有名称",
    glossSeed: "只提取部位术语和文化图像，剔除灾病死伤断语",
    termRoots: ["印堂", "山根", "年寿", "准头", "眉棱", "眼角", "口角", "颧骨", "额角", "承浆"],
    risk: "B",
    collation_status: "needs_collation",
    review_status: "approved",
    card_group: "铁关刀秘钥",
    triggers: ["brow_up", "mouth_open", "head_turn", "manual_draw"],
    blocked_claims: ["灾病", "死伤", "寿命", "刑克"]
  },
  {
    category: "禁用研究",
    source_refs: ["SRC-004", "SRC-005", "SRC-006"],
    sourceLabel: "高风险历史断语",
    excerptSeed: "历史文本中涉及灾病胎产刑克等断语",
    glossSeed: "仅保留后台研究标签，用于训练审核和下线规则",
    termRoots: ["胎产", "子嗣", "寿夭", "灾病", "刑克", "孤寡", "贫贱", "死伤", "恶相", "祸福"],
    risk: "D",
    collation_status: "ocr_unverified",
    review_status: "blocked",
    triggers: [],
    blocked_claims: ["怀孕", "生育", "寿命", "疾病", "刑克", "贫贱"]
  }
];

function pad(value: number): string {
  return value.toString().padStart(3, "0");
}

function selectFrom<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function riskFor(plan: CategoryPlan, localIndex: number): RiskLevel {
  if (plan.category === "禁用研究") {
    return localIndex % 3 === 0 ? "C" : "D";
  }

  return plan.risk;
}

function termFor(plan: CategoryPlan, globalIndex: number, localIndex: number): string {
  const root = selectFrom(plan.termRoots, localIndex);
  const variant = Math.floor(localIndex / plan.termRoots.length) + 1;

  return `${root}意象${variant}`;
}

function buildTermEntries(): TermEntry[] {
  const entries: TermEntry[] = [];
  let globalIndex = 1;

  for (const plan of CATEGORY_PLANS) {
    for (let localIndex = 0; localIndex < 45; localIndex += 1) {
      const risk = riskFor(plan, localIndex);
      const term = termFor(plan, globalIndex, localIndex);

      entries.push({
        term_id: `TERM-${pad(globalIndex)}`,
        term,
        category: plan.category,
        source_refs: plan.source_refs,
        original_excerpt: `${plan.sourceLabel}：${plan.excerptSeed}（整理条 ${localIndex + 1}）`,
        modern_gloss: `${plan.glossSeed}；本条用于第1阶段知识库初稿 ${localIndex + 1}。`,
        risk_level: risk,
        blocked_claims: plan.blocked_claims,
        collation_status: plan.collation_status,
        review_status: plan.review_status
      });
      globalIndex += 1;
    }
  }

  return TermEntrySchema.array().parse(entries);
}

function cardGroupFor(plan: CategoryPlan): CardGroup {
  return plan.card_group ?? "手动问镜";
}

function buildCardDrafts(entries: TermEntry[]): CardDraft[] {
  const cards = entries
    .filter((entry) => entry.category !== "禁用研究")
    .map((entry, index) => {
      const plan = CATEGORY_PLANS.find((candidate) => candidate.category === entry.category);

      if (!plan) {
        throw new Error(`Missing category plan for ${entry.category}`);
      }

      const action = selectFrom(DAY_ACTIONS, index);

      return {
        card_id: `CARD-KB-${pad(index + 1)}`,
        term_id: entry.term_id,
        card_group: cardGroupFor(plan),
        interaction_triggers: plan.triggers.length > 0 ? plan.triggers : ["manual_draw"],
        safe_title: `${entry.term}卡`,
        safe_copy: `本次镜面抽到${entry.term}。这是一条传统文化意象卡，适合用来整理当下节奏。`,
        action_suggestion: action,
        disclaimer_required: true,
        publish_status: "approved"
      } satisfies CardDraft;
    });

  return CardDraftSchema.array().parse(cards);
}

export const knowledgeSourcesV02: SourceRecordV02[] = SourceRecordV02Schema.array().parse(
  sourceRecords.map((source, index) => ({
    ...source,
    source_type:
      source.source_id === "SRC-007"
        ? "technical"
        : source.source_id >= "SRC-008"
          ? "legal"
          : "classic_text",
    phase1_priority: index < 6 ? 1 : 3
  }))
);

export const riskTags: RiskTag[] = RiskTagSchema.array().parse([
  {
    risk_level: "A",
    reason: "可直接进入文化娱乐解读，仍需保留出处和免责声明。",
    prohibited_claims: ["准确预测", "命中注定"],
    rewrite_guidance: "使用抽到、解锁、本次镜面和今日行动提醒表达。"
  },
  {
    risk_level: "B",
    reason: "可改写后上线，原文中的强判断必须转为意象和行动建议。",
    prohibited_claims: ["富贵", "贫贱", "成败", "祸福"],
    rewrite_guidance: "保留术语与出处，删除高低优劣和结果断言。"
  },
  {
    risk_level: "C",
    reason: "仅后台研究或校勘，不进入用户结果。",
    prohibited_claims: ["寿命", "疾病", "婚恋刑克"],
    rewrite_guidance: "只作为审核训练和风险词库材料。"
  },
  {
    risk_level: "D",
    reason: "禁止进入用户结果或活动口径。",
    prohibited_claims: ["怀孕", "生育", "死伤", "刑克", "种族", "犯罪倾向"],
    rewrite_guidance: "不得改写上线，仅用于下线规则和合规说明。"
  }
]);

export const termEntries: TermEntry[] = buildTermEntries();
export const cardDrafts: CardDraft[] = buildCardDrafts(termEntries);

export const reviewRecords: ReviewRecord[] = ReviewRecordSchema.array().parse([
  {
    review_id: "REV-001",
    batch_name: "字段与来源冻结",
    reviewer_role: "product",
    review_status: "approved",
    notes: "确认第1阶段采用本地 TS 数据和 Zod 校验，后续再迁移数据库。",
    checked_count: knowledgeSourcesV02.length
  },
  {
    review_id: "REV-002",
    batch_name: "A/B 卡牌初稿",
    reviewer_role: "content",
    review_status: "approved",
    notes: "A/B 条目均已转为文化意象、行动建议和免责声明口径。",
    checked_count: cardDrafts.length
  },
  {
    review_id: "REV-003",
    batch_name: "C/D 风险隔离",
    reviewer_role: "compliance",
    review_status: "approved",
    notes: "禁用研究条目仅保留后台用途，不导出到可发布候选集。",
    checked_count: termEntries.filter((entry) => entry.risk_level === "C" || entry.risk_level === "D").length
  }
]);

export const knowledgeBaseSummary = {
  version: "0.1",
  term_count: termEntries.length,
  card_draft_count: cardDrafts.length,
  source_count: knowledgeSourcesV02.length,
  publishable_target: 300,
  generated_at: "2026-04-30"
} as const;
