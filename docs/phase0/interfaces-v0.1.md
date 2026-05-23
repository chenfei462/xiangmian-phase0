# 接口草案 v0.1

第0阶段不提供正式生产 API。以下接口作为第1-3阶段的前后端、内容和视觉算法协作合同。

## VisionEvent v0.1

```ts
type VisionEventType =
  | "look_stable"
  | "blink"
  | "smile"
  | "brow_up"
  | "mouth_open"
  | "head_turn"
  | "manual_draw";

type VisionEvent = {
  type: VisionEventType;
  confidence: number;
  quality_score: number;
  timestamp: number;
};
```

## CardRule v0.1

```ts
type CardRule = {
  rule_id: string;
  source_id: string;
  term: string;
  risk_level: "A" | "B" | "C" | "D";
  input_tags: string[];
  trigger: VisionEventType;
  card_id: string;
  safe_copy: string;
  blocked_claims: string[];
  review_status: "pending" | "approved" | "blocked";
};
```

## SourceRecord v0.1

```ts
type SourceRecord = {
  source_id: string;
  book_title: string;
  chapter: string;
  original_excerpt: string;
  modern_gloss: string;
  source_url: string;
  collation_status: "verified" | "needs_collation" | "ocr_unverified" | "reference_only";
  risk_level: "A" | "B" | "C" | "D";
};
```

## PrivacyDefault v0.1

```ts
type PrivacyDefault = {
  camera_frames: "local_only";
  raw_image_upload: false;
  biometric_template_storage: false;
  identity_recognition: false;
  analytics: "anonymous_events_only";
};
```

