import {
  AnonymousMvpEventSchema,
  FALLBACK_REASONS,
  Phase4QaReportSchema,
  type AnonymousMvpEvent,
  type DisclaimerPolicy,
  type DisclaimerSurface,
  type FallbackReason,
  type Phase4QaReport
} from "./phase4-contracts";

const REVIEWED_AT = "2026-04-30T00:00:00.000Z";

const DISCLAIMER_COPY =
  "本体验为传统文化娱乐互动，不能作为性格、命运、健康、婚恋、职业、财务或任何重要事项的判断依据。";

export const DISCLAIMER_POLICIES: Record<DisclaimerSurface, DisclaimerPolicy> = {
  entry: {
    surface: "entry",
    required: true,
    copy: `${DISCLAIMER_COPY}你可以不开摄像头，直接使用手动抽卡。`,
    review_status: "approved",
    last_reviewed_at: REVIEWED_AT
  },
  consent: {
    surface: "consent",
    required: true,
    copy: `${DISCLAIMER_COPY}摄像头仅用于本次端侧动作互动，不上传、不保存原始图像或视频。`,
    review_status: "approved",
    last_reviewed_at: REVIEWED_AT
  },
  result: {
    surface: "result",
    required: true,
    copy: `${DISCLAIMER_COPY}请把结果当作一张国风互动卡牌和今日行动提醒。`,
    review_status: "approved",
    last_reviewed_at: REVIEWED_AT
  },
  fallback: {
    surface: "fallback",
    required: true,
    copy: `${DISCLAIMER_COPY}当前环境不适合开镜时，可继续使用手动抽卡。`,
    review_status: "approved",
    last_reviewed_at: REVIEWED_AT
  },
  exit: {
    surface: "exit",
    required: true,
    copy: `${DISCLAIMER_COPY}退出后会停止摄像头轨道并清理本地临时会话。`,
    review_status: "approved",
    last_reviewed_at: REVIEWED_AT
  },
  share_placeholder: {
    surface: "share_placeholder",
    required: true,
    copy: `${DISCLAIMER_COPY}后续分享海报不得包含原始人脸图像，默认只展示卡牌与免责声明。`,
    review_status: "approved",
    last_reviewed_at: REVIEWED_AT
  }
};

const FALLBACK_MESSAGES: Record<FallbackReason, string> = {
  camera_denied: "摄像头权限未开启，可以直接使用手动抽卡完成本次体验。",
  model_error: "视觉模型暂时不可用，可以切换到手动抽卡继续体验。",
  no_face: "镜面未检测到人脸，可以调整位置或使用手动抽卡。",
  multi_face: "镜面检测到多人脸，本次体验需要单人入镜，也可以使用手动抽卡。",
  low_light: "当前光线不足，建议靠近柔和光源，或使用手动抽卡。",
  off_center: "脸部未在引导框中，可以重新校准，或使用手动抽卡。",
  loading_timeout: "视觉模型加载超时，可以重试开镜，或继续使用手动抽卡完成体验。",
  action_timeout: "动作触发等待时间过长，已为你准备手动抽卡入口。",
  no_card_candidate: "当前动作没有可用卡牌候选，可以改用手动抽卡。"
};

export function getFallbackMessage(reason: FallbackReason): string {
  return FALLBACK_MESSAGES[reason];
}

export function createAnonymousMvpEvent(event: AnonymousMvpEvent): AnonymousMvpEvent {
  return AnonymousMvpEventSchema.parse(event);
}

export function createPhase4QaReport(
  input: Pick<Phase4QaReport, "content_audit_passed" | "browser_compatibility" | "performance_notes">
): Phase4QaReport {
  return Phase4QaReportSchema.parse({
    ...input,
    fallback_paths_covered: [...FALLBACK_REASONS],
    go_no_go:
      input.content_audit_passed && input.browser_compatibility.length >= 3 ? "go" : "hold"
  });
}
