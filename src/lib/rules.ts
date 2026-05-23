import {
  CardRuleSchema,
  VisionEventSchema,
  type CardRule,
  type VisionEvent
} from "./contracts";

const PUBLISHABLE_RISKS = new Set(["A", "B"]);

const UNSAFE_CLAIMS = [
  "一定",
  "富贵",
  "寿命",
  "必然",
  "命中注定",
  "贫贱",
  "疾病",
  "怀孕",
  "生育",
  "刑克",
  "克夫",
  "克妻",
  "犯罪",
  "智力",
  "种族",
  "民族",
  "政治倾向",
  "宗教",
  "性取向"
] as const;

export function scanUnsafeClaims(copy: string): string[] {
  return UNSAFE_CLAIMS.filter((claim) => copy.includes(claim));
}

export function isPublishableRule(rule: CardRule): boolean {
  const parsed = CardRuleSchema.parse(rule);

  return (
    parsed.review_status === "approved" &&
    PUBLISHABLE_RISKS.has(parsed.risk_level) &&
    scanUnsafeClaims(parsed.safe_copy).length === 0
  );
}

export function selectCardForVisionEvent(
  event: VisionEvent,
  rules: CardRule[]
): CardRule | null {
  const parsedEvent = VisionEventSchema.parse(event);

  return (
    rules.find((rule) => rule.trigger === parsedEvent.type && isPublishableRule(rule)) ?? null
  );
}
