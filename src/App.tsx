import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Camera,
  CameraOff,
  CheckCircle2,
  Eye,
  Hand,
  QrCode,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Smile,
  Sparkles,
  TimerReset,
  XCircle
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  ExpertDrawer,
  type ExpertDrawerPhasePanel,
  type ExpertDrawerTab
} from "./components/ExpertDrawer";
import { Phase8AdminWorkspace } from "./components/Phase8AdminWorkspace";
import { Phase10PilotWorkspace } from "./components/Phase10PilotWorkspace";
import { Phase11CommercialWorkspace } from "./components/Phase11CommercialWorkspace";
import { Phase12ExpansionWorkspace } from "./components/Phase12ExpansionWorkspace";
import { Phase13ScaleWorkspace } from "./components/Phase13ScaleWorkspace";
import { Phase14OpsWorkspace } from "./components/Phase14OpsWorkspace";
import { Phase15GrowthWorkspace } from "./components/Phase15GrowthWorkspace";
import { Phase9SaasWorkspace } from "./components/Phase9SaasWorkspace";
import { VISION_EVENT_TYPES, type VisionEvent, type VisionEventType } from "./lib/contracts";
import { requestDeepSeekCardReading } from "./lib/deepseek";
import { getCameraSurfaceVisualMode } from "./lib/camera-surface";
import { privacyDefault } from "./lib/phase0-content";
import {
  getSourceTitle,
  renderResultTone
} from "./lib/mvp-card-result";
import { type ResultTone } from "./lib/mvp-contracts";
import { renderPosterPngDataUrl } from "./lib/poster-renderer";
import {
  acknowledgePrivacyForCamera,
  attachCardResult,
  beginCalibration,
  completeCalibration,
  createInitialMvpSession,
  enterConsent,
  exitMvpSession,
  fallbackToManual,
  markActionDetected,
  startManualMode,
  type MvpSession
} from "./lib/mvp-flow";
import {
  createAnonymousMvpEvent,
  DISCLAIMER_POLICIES,
  getFallbackMessage
} from "./lib/phase4-governance";
import type { AnonymousMvpEvent, FallbackReason } from "./lib/phase4-contracts";
import {
  DEFAULT_GRAY_TEST_BATCH,
  grayPublishableCandidateCount,
  sampleGrayMetricsReport,
  samplePhase5GoNoGo
} from "./lib/phase5-gray";
import {
  DEFAULT_PHASE7_CAMPAIGN,
  PHASE7_THEME_REGISTRY,
  buildPhase7ReuseReport,
  createPhase7PosterRenderModel,
  drawPhase7CardResultForEvent,
  getCampaignThemePack,
  getScenarioForCampaign,
  getThemeCardsForCampaign
} from "./lib/phase7-registry";
import {
  PHASE8_CONFIG_VERSION,
  addCardToAdminBlocklist,
  buildPhase8AdminReport,
  createPhase8AdminConfigStore,
  exportAdminConfigStore,
  removeCardFromAdminBlocklist
} from "./lib/phase8-admin";
import type { AdminConfigStore, AdminUserRole } from "./lib/phase8-contracts";
import {
  aggregatePhase9MetricsEvents,
  buildPhase9SaasReport,
  getPublishedSnapshotForCampaign,
  phase9DefaultTenantId,
  samplePhase9SaasState
} from "./lib/phase9-saas";
import {
  buildPhase10PilotReport,
  getActivePilotSnapshot,
  samplePhase10PilotState,
  samplePhase10PostgresSchema
} from "./lib/phase10-pilot";
import {
  buildCommercialExportPackage,
  buildPhase11CommercialReport,
  getCommercialApprovedSnapshot,
  samplePhase11CommercialState,
  samplePhase11ManagedPostgresSchema
} from "./lib/phase11-commercial";
import {
  buildCommercialCustomerReport,
  buildPhase12ExpansionReport,
  getExpansionApprovedSnapshot,
  samplePhase12ExpansionSchema,
  samplePhase12ExpansionState
} from "./lib/phase12-expansion";
import {
  buildCustomerReportPackage,
  buildPhase13ScaleReport,
  getScaleApprovedSnapshot,
  samplePhase13ScaleSchema,
  samplePhase13ScaleState
} from "./lib/phase13-scale";
import {
  buildCustomerOpsReportPackage,
  buildPhase14OpsReport,
  getOpsApprovedSnapshot,
  samplePhase14OpsSchema,
  samplePhase14OpsState
} from "./lib/phase14-ops";
import {
  buildCustomerPortfolioReport,
  buildPhase15ExpansionReport,
  getGrowthApprovedSnapshot,
  samplePhase15GrowthSchema,
  samplePhase15GrowthState
} from "./lib/phase15-growth";
import {
  ActionDetector,
  DEFAULT_ACTION_THRESHOLDS,
  PerformanceSampler,
  evaluateVisionQuality,
  extractFaceFeatures,
  loadMediaPipeFaceLandmarker,
  MediaPipeLoadTimeoutError,
  requestCameraStream,
  stopCameraStream,
  type FaceFeatures,
  type MediaPipeLoadState,
  type PerformanceSnapshot,
  type VisionQualityState
} from "./lib/vision";

type CameraState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "active"; stream: MediaStream }
  | { status: "denied"; message: string }
  | { status: "error"; message: string };

const ACTION_SEQUENCE = [
  "look_stable",
  "blink",
  "smile",
  "brow_up",
  "mouth_open",
  "head_turn",
  "eyes_closed"
] as const satisfies readonly VisionEventType[];

const ACTION_LABELS: Record<VisionEventType, string> = {
  look_stable: "正视 2 秒",
  blink: "眨眼",
  smile: "微笑",
  brow_up: "抬眉",
  mouth_open: "张口",
  head_turn: "左右回顾",
  eyes_closed: "闭眼 1 秒",
  manual_draw: "手动抽卡"
};

const ACTION_HINTS: Record<(typeof ACTION_SEQUENCE)[number], string> = {
  look_stable: "看向镜面，保持脸部居中 2 秒。",
  blink: "自然眨一次眼，镜面会捕捉动作事件。",
  smile: "轻轻微笑，不需要夸张表情。",
  brow_up: "抬一下眉，让眉部动作超过阈值。",
  mouth_open: "张口一下即可，不使用麦克风。",
  head_turn: "左右轻轻回顾，避免动作过快。",
  eyes_closed: "闭眼约 1 秒，保持呼吸平稳。"
};

const QUALITY_LABELS: Record<VisionQualityState, string> = {
  ready: "质量通过",
  no_face: "未检测到人脸",
  multi_face: "检测到多人脸",
  low_light: "光线或关键点不足",
  off_center: "脸部未居中",
  model_error: "模型错误",
  loading_timeout: "模型加载超时",
  camera_denied: "摄像头被拒绝"
};

const EMPTY_PERFORMANCE: PerformanceSnapshot = {
  average_frame_time_ms: 0,
  max_frame_time_ms: 0,
  fps: 0,
  sample_count: 0
};

const ACTION_TIMEOUT_MS = 12_000;

type DeepSeekReadingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; reply: string }
  | { status: "error"; message: string };

function makeVisionEvent(
  type: VisionEventType,
  confidence = 1,
  qualityScore = 1
): VisionEvent {
  return {
    type,
    confidence,
    quality_score: qualityScore,
    timestamp: Date.now()
  };
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function calibrationFailureReason(
  mediaPipeState: MediaPipeLoadState,
  qualityState: VisionQualityState
): string {
  if (mediaPipeState.status === "error") {
    return getFallbackMessage("model_error");
  }
  if (mediaPipeState.status === "loading_timeout") {
    return getFallbackMessage("loading_timeout");
  }
  if (mediaPipeState.status !== "ready") {
    return getFallbackMessage("model_error");
  }
  if (qualityState === "ready") {
    return "校准已通过。";
  }
  return getFallbackMessage(qualityState);
}

export function App(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const drawTimerRef = useRef<number | null>(null);
  const actionTimeoutRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<{ close?: () => void } | null>(null);
  const detectorRef = useRef(new ActionDetector(DEFAULT_ACTION_THRESHOLDS));
  const samplerRef = useRef(new PerformanceSampler());
  const lastEventRef = useRef<{ type: VisionEventType; timestamp: number } | null>(null);

  const [session, setSession] = useState<MvpSession>(() => createInitialMvpSession());
  const [cameraState, setCameraState] = useState<CameraState>({ status: "idle" });
  const [mediaPipeState, setMediaPipeState] = useState<MediaPipeLoadState>({ status: "idle" });
  const [qualityState, setQualityState] = useState<VisionQualityState>("no_face");
  const [faceFeatures, setFaceFeatures] = useState<FaceFeatures | null>(null);
  const [performanceSnapshot, setPerformanceSnapshot] =
    useState<PerformanceSnapshot>(EMPTY_PERFORMANCE);
  const [recentVisionEvents, setRecentVisionEvents] = useState<VisionEvent[]>([]);
  const [anonymousEvents, setAnonymousEvents] = useState<AnonymousMvpEvent[]>([]);
  const [selectedAction, setSelectedAction] =
    useState<(typeof ACTION_SEQUENCE)[number]>("blink");
  const [activeTone, setActiveTone] = useState<ResultTone>("classic");
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [deepSeekReading, setDeepSeekReading] =
    useState<DeepSeekReadingState>({ status: "idle" });
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [drawMessage, setDrawMessage] = useState("等待动作或手动抽卡。");
  const [grayNotice, setGrayNotice] = useState("灰度数据只使用匿名事件和人工反馈表。");
  const [activeCampaignId, setActiveCampaignId] = useState(DEFAULT_PHASE7_CAMPAIGN.campaign_id);
  const [adminStore, setAdminStore] = useState<AdminConfigStore>(() => createPhase8AdminConfigStore());
  const [adminRole, setAdminRole] = useState<AdminUserRole>("operations");
  const [adminNotice, setAdminNotice] = useState("Phase 15 中，商业扩展后台草稿不会直接影响公开 H5；只有 active tenant 的 commercial-approved published snapshot 会进入前台。");
  const [expertDrawerOpen, setExpertDrawerOpen] = useState(false);
  const [expertTab, setExpertTab] = useState<ExpertDrawerTab>("ops");
  const [activePhasePanel, setActivePhasePanel] = useState<ExpertDrawerPhasePanel>("phase15");
  const [activeTenantId] = useState(phase9DefaultTenantId);
  const phase9SaasState = useMemo(() => samplePhase9SaasState, []);
  const phase10PilotState = useMemo(() => samplePhase10PilotState, []);
  const phase11CommercialState = useMemo(() => samplePhase11CommercialState, []);
  const phase12ExpansionState = useMemo(() => samplePhase12ExpansionState, []);
  const phase13ScaleState = useMemo(() => samplePhase13ScaleState, []);
  const phase14OpsState = useMemo(() => samplePhase14OpsState, []);
  const phase15GrowthState = useMemo(() => samplePhase15GrowthState, []);
  const activePublishedSnapshot = useMemo(
    () => getPublishedSnapshotForCampaign(phase9SaasState, activeTenantId, activeCampaignId),
    [activeCampaignId, activeTenantId, phase9SaasState]
  );
  const activePilotSnapshot = useMemo(
    () => getActivePilotSnapshot(phase10PilotState, activeTenantId, activeCampaignId),
    [activeCampaignId, activeTenantId, phase10PilotState]
  );
  const activeCommercialSnapshot = useMemo(
    () => getCommercialApprovedSnapshot(phase11CommercialState, activeTenantId, activeCampaignId),
    [activeCampaignId, activeTenantId, phase11CommercialState]
  );
  const activeExpansionSnapshot = useMemo(
    () => getExpansionApprovedSnapshot(phase12ExpansionState, activeTenantId, activeCampaignId),
    [activeCampaignId, activeTenantId, phase12ExpansionState]
  );
  const activeScaleSnapshot = useMemo(
    () => getScaleApprovedSnapshot(phase13ScaleState, activeTenantId, activeCampaignId),
    [activeCampaignId, activeTenantId, phase13ScaleState]
  );
  const activeOpsSnapshot = useMemo(
    () => getOpsApprovedSnapshot(phase14OpsState, activeTenantId, activeCampaignId),
    [activeCampaignId, activeTenantId, phase14OpsState]
  );
  const activeGrowthSnapshot = useMemo(
    () => getGrowthApprovedSnapshot(phase15GrowthState, activeTenantId, activeCampaignId),
    [activeCampaignId, activeTenantId, phase15GrowthState]
  );
  const effectivePublishedSnapshot =
    activeGrowthSnapshot ??
    activeOpsSnapshot ??
    activeScaleSnapshot ??
    activeExpansionSnapshot ??
    activeCommercialSnapshot ??
    activePilotSnapshot ??
    activePublishedSnapshot;
  const publishedBlocklist = effectivePublishedSnapshot?.blocklist ?? [];
  const phase9SaasReport = useMemo(
    () => buildPhase9SaasReport(phase9SaasState),
    [phase9SaasState]
  );
  const phase10PilotReport = useMemo(
    () => buildPhase10PilotReport(phase10PilotState),
    [phase10PilotState]
  );
  const phase11CommercialReport = useMemo(
    () => buildPhase11CommercialReport(phase11CommercialState),
    [phase11CommercialState]
  );
  const phase12ExpansionReport = useMemo(
    () => buildPhase12ExpansionReport(phase12ExpansionState),
    [phase12ExpansionState]
  );
  const phase12CustomerReport = useMemo(
    () => buildCommercialCustomerReport(phase12ExpansionState, "TEN-002"),
    [phase12ExpansionState]
  );
  const phase13ScaleReport = useMemo(
    () => buildPhase13ScaleReport(phase13ScaleState),
    [phase13ScaleState]
  );
  const phase13ReportPackage = useMemo(
    () => buildCustomerReportPackage(phase13ScaleState, "TEN-002"),
    [phase13ScaleState]
  );
  const phase14OpsReport = useMemo(
    () => buildPhase14OpsReport(phase14OpsState),
    [phase14OpsState]
  );
  const phase14OpsReportPackage = useMemo(
    () => buildCustomerOpsReportPackage(phase14OpsState, "TEN-002"),
    [phase14OpsState]
  );
  const phase15ExpansionReport = useMemo(
    () => buildPhase15ExpansionReport(phase15GrowthState),
    [phase15GrowthState]
  );
  const phase15PortfolioReport = useMemo(
    () => buildCustomerPortfolioReport(phase15GrowthState),
    [phase15GrowthState]
  );
  const phase11ExportPackage = useMemo(() => {
    try {
      return buildCommercialExportPackage(phase11CommercialState, activeTenantId, activeCampaignId);
    } catch {
      return null;
    }
  }, [activeCampaignId, activeTenantId, phase11CommercialState]);
  const phase10MetricsSummary = useMemo(
    () =>
      phase10PilotState.metrics_summaries.find(
        (summary) => summary.tenant_id === activeTenantId && summary.campaign_id === activeCampaignId
      ) ?? null,
    [activeCampaignId, activeTenantId, phase10PilotState.metrics_summaries]
  );
  const phase9Metrics = useMemo(
    () => aggregatePhase9MetricsEvents(activeCampaignId, phase9SaasState.metrics_events),
    [activeCampaignId, phase9SaasState.metrics_events]
  );

  const sessionRef = useRef(session);
  const mediaPipeStateRef = useRef(mediaPipeState);
  const qualityStateRef = useRef(qualityState);
  const faceFeaturesRef = useRef(faceFeatures);

  const recordAnonymousEvent = useCallback((event: AnonymousMvpEvent): void => {
    const parsed = createAnonymousMvpEvent(event);

    setAnonymousEvents((current) => [parsed, ...current].slice(0, 8));
  }, []);

  useEffect(() => {
    sessionRef.current = session;
    mediaPipeStateRef.current = mediaPipeState;
    qualityStateRef.current = qualityState;
    faceFeaturesRef.current = faceFeatures;
  }, [faceFeatures, mediaPipeState, qualityState, session]);

  const stopCamera = useCallback((): void => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
    detectorRef.current.reset();
    samplerRef.current = new PerformanceSampler();
    setCameraState({ status: "idle" });
    setMediaPipeState({ status: "idle" });
    setFaceFeatures(null);
    setQualityState("no_face");
    setPerformanceSnapshot(EMPTY_PERFORMANCE);
  }, []);

  const enterFallback = useCallback(
    (reason: FallbackReason): void => {
      setSession((current) => {
        if (current.state === "exit" || current.state === "result") {
          return current;
        }
        return fallbackToManual(current, reason, Date.now());
      });
      recordAnonymousEvent({
        event_type: "fallback_triggered",
        session_step: "fallback",
        fallback_reason: reason,
        timestamp: Date.now()
      });
    },
    [recordAnonymousEvent]
  );

  const startCardDraw = useCallback((baseSession: MvpSession, event: VisionEvent): void => {
    if (drawTimerRef.current !== null) {
      window.clearTimeout(drawTimerRef.current);
    }

    setActiveTone("classic");
    setRecentVisionEvents((current) => [event, ...current].slice(0, 6));
    setDrawMessage(`已收到「${ACTION_LABELS[event.type]}」事件，正在匹配古籍卡牌。`);
    setSession(baseSession);

    drawTimerRef.current = window.setTimeout(() => {
      const result = drawPhase7CardResultForEvent(activeCampaignId, event, publishedBlocklist);

      if (!result) {
        recordAnonymousEvent({
          event_type: "fallback_triggered",
          session_step: "fallback",
          fallback_reason: "no_card_candidate",
          timestamp: Date.now()
        });
        setSession((current) => {
          if (current.state === "exit") {
            return current;
          }
          return fallbackToManual(baseSession, "no_card_candidate", Date.now());
        });
        return;
      }

      recordAnonymousEvent({
        event_type: "card_drawn",
        session_step: "result",
        trigger: result.trigger,
        timestamp: Date.now()
      });
      setSession((current) => {
        if (current.state === "exit") {
          return current;
        }
        return attachCardResult(baseSession, result, Date.now());
      });
    }, 650);
  }, [activeCampaignId, publishedBlocklist, recordAnonymousEvent]);

  const handleVisionEvent = useCallback(
    (event: VisionEvent): void => {
      const lastEvent = lastEventRef.current;
      const enoughTimePassed = !lastEvent || event.timestamp - lastEvent.timestamp > 1800;

      if (lastEvent?.type === event.type && !enoughTimePassed) {
        return;
      }

      const current = sessionRef.current;

      if (current.state !== "action_task") {
        return;
      }

      lastEventRef.current = { type: event.type, timestamp: event.timestamp };
      const drawingSession = markActionDetected(
        current,
        event.type,
        event.quality_score,
        Date.now()
      );
      recordAnonymousEvent({
        event_type: "action_detected",
        session_step: "action_task",
        trigger: event.type,
        timestamp: Date.now()
      });
      startCardDraw(drawingSession, event);
    },
    [recordAnonymousEvent, startCardDraw]
  );

  const beginManualDraw = useCallback((): void => {
    stopCamera();
    const manualSession = startManualMode(sessionRef.current, Date.now());
    recordAnonymousEvent({
      event_type: "manual_mode_selected",
      session_step: "drawing",
      trigger: "manual_draw",
      timestamp: Date.now()
    });
    startCardDraw(manualSession, makeVisionEvent("manual_draw"));
  }, [recordAnonymousEvent, startCardDraw, stopCamera]);

  const resetExperience = useCallback((): void => {
    if (drawTimerRef.current !== null) {
      window.clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    stopCamera();
    lastEventRef.current = null;
    setRecentVisionEvents([]);
    setAnonymousEvents([]);
    setDeepSeekReading({ status: "idle" });
    setCalibrationProgress(0);
    setDrawMessage("等待动作或手动抽卡。");
    setPrivacyChecked(false);
    setSession(createInitialMvpSession());
  }, [stopCamera]);

  async function acceptCameraConsent(): Promise<void> {
    const consentSession = acknowledgePrivacyForCamera(sessionRef.current, Date.now());
    setSession(consentSession);
    recordAnonymousEvent({
      event_type: "camera_consent_granted",
      session_step: "camera_setup",
      timestamp: Date.now()
    });
    setCameraState({ status: "requesting" });

    try {
      const stream = await requestCameraStream();
      streamRef.current = stream;
      setCameraState({ status: "active", stream });
      setSession(beginCalibration(consentSession, Date.now()));

      setMediaPipeState({ status: "loading" });
      loadMediaPipeFaceLandmarker()
        .then((landmarker) => {
          landmarkerRef.current = landmarker;
          setMediaPipeState({ status: "ready", landmarker });
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "MediaPipe 加载失败";
          if (error instanceof MediaPipeLoadTimeoutError) {
            setQualityState("loading_timeout");
            setMediaPipeState({ status: "loading_timeout", message });
            enterFallback("loading_timeout");
            return;
          }
          setQualityState("model_error");
          setMediaPipeState({ status: "error", message });
          enterFallback("model_error");
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : "摄像头授权被拒绝。";
      setCameraState({ status: "denied", message });
      setQualityState("camera_denied");
      enterFallback("camera_denied");
    }
  }

  function closeCameraAndFallback(): void {
    stopCamera();
    enterFallback("action_timeout");
  }

  function beginVisionSimulation(): void {
    stopCamera();
    const consentSession = acknowledgePrivacyForCamera(sessionRef.current, Date.now());
    const calibrationSession = beginCalibration(consentSession, Date.now());
    const actionSession = completeCalibration(
      calibrationSession,
      {
        status: "passed",
        quality_state: "ready",
        quality_score: 0.86,
        duration_ms: 0,
        failure_reason: null
      },
      Date.now()
    );

    setQualityState("ready");
    setMediaPipeState({ status: "idle" });
    setSession(actionSession);
    recordAnonymousEvent({
      event_type: "calibration_passed",
      session_step: "action_task",
      timestamp: Date.now()
    });
  }

  function retryCameraFromFallback(): void {
    stopCamera();
    setSession(enterConsent(sessionRef.current, Date.now()));
  }

  function downloadDataUrl(dataUrl: string, fileName: string): void {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function makePosterFileName(): string {
    return `xiangmian-${sessionRef.current.result?.card_id ?? "poster"}.png`;
  }

  function downloadPoster(): void {
    if (!posterModel) {
      return;
    }

    downloadDataUrl(renderPosterPngDataUrl(posterModel), makePosterFileName());
  }

  async function sharePoster(): Promise<void> {
    if (!posterModel) {
      return;
    }

    const dataUrl = renderPosterPngDataUrl(posterModel);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], makePosterFileName(), { type: "image/png" });
    const shareData = {
      title: posterModel.card_title,
      text: `${posterModel.theme_name} - ${posterModel.action_suggestion}`,
      files: [file]
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return;
    }

    downloadDataUrl(dataUrl, file.name);
  }

  async function generateDeepSeekReading(): Promise<void> {
    if (!session.result || !toneCopy) {
      return;
    }

    setDeepSeekReading({ status: "loading" });

    try {
      const reply = await requestDeepSeekCardReading({
        cardTitle: session.result.safe_title,
        cardCopy: toneCopy.copy,
        modernGloss: session.result.modern_gloss,
        actionSuggestion: session.result.action_suggestion,
        sourceTitle: resultSourceTitle,
        triggerLabel: ACTION_LABELS[session.result.trigger],
        toneLabel: toneCopy.label
      });

      setDeepSeekReading({ status: "success", reply });
    } catch (error) {
      setDeepSeekReading({
        status: "error",
        message: error instanceof Error ? error.message : "DeepSeek 模型调用失败。"
      });
    }
  }

  function exitAndClear(): void {
    if (drawTimerRef.current !== null) {
      window.clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    stopCamera();
    setRecentVisionEvents([]);
    setAnonymousEvents([]);
    recordAnonymousEvent({
      event_type: "session_exited",
      session_step: "exit",
      timestamp: Date.now()
    });
    setSession((current) => exitMvpSession(current, Date.now()));
  }

  useEffect(() => {
    const video = videoRef.current;

    if (cameraState.status === "active" && video) {
      video.srcObject = cameraState.stream;
      void video.play();
    }
  }, [cameraState]);

  useEffect(() => {
    if (session.state !== "calibration") {
      return undefined;
    }

    const startedAt = Date.now();
    setCalibrationProgress(0);

    const progressId = window.setInterval(() => {
      setCalibrationProgress(Math.min(1, (Date.now() - startedAt) / 3000));
    }, 100);
    const timeoutId = window.setTimeout(() => {
      const latestMediaPipeState = mediaPipeStateRef.current;
      const latestQualityState = qualityStateRef.current;
      const latestFeatures = faceFeaturesRef.current;
      const passed = latestMediaPipeState.status === "ready" && latestQualityState === "ready";

      setCalibrationProgress(1);
      setSession((current) => {
        if (current.state !== "calibration") {
          return current;
        }
        return completeCalibration(
          current,
          {
            status: passed ? "passed" : "failed",
            quality_state: passed ? "ready" : latestQualityState,
            quality_score: latestFeatures?.quality_score ?? 0,
            duration_ms: 3000,
            failure_reason: passed
              ? null
              : calibrationFailureReason(latestMediaPipeState, latestQualityState)
          },
          Date.now()
        );
      });
    }, 3000);

    return () => {
      window.clearInterval(progressId);
      window.clearTimeout(timeoutId);
    };
  }, [session.state]);

  useEffect(() => {
    if (session.state !== "action_task") {
      return undefined;
    }

    actionTimeoutRef.current = window.setTimeout(() => {
      enterFallback("action_timeout");
    }, ACTION_TIMEOUT_MS);

    return () => {
      if (actionTimeoutRef.current !== null) {
        window.clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = null;
      }
    };
  }, [enterFallback, session.state]);

  useEffect(() => {
    if (cameraState.status !== "active" || mediaPipeState.status !== "ready") {
      return undefined;
    }

    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    const tick = (): void => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const startedAt = performance.now();
        const result = mediaPipeState.landmarker.detectForVideo(video, startedAt);
        const features = extractFaceFeatures(result, performance.now() - startedAt);
        const nextQualityState = evaluateVisionQuality(features);

        samplerRef.current.recordFrame(features.frame_time_ms);
        setFaceFeatures(features);
        setQualityState(nextQualityState);
        setPerformanceSnapshot(samplerRef.current.getSnapshot());

        const event =
          nextQualityState === "ready" ? detectorRef.current.update(features, Date.now()) : null;

        if (event) {
          handleVisionEvent(event);
        } else if (nextQualityState !== "ready") {
          detectorRef.current.reset();
        }
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cameraState, handleVisionEvent, mediaPipeState]);

  useEffect(() => {
    return () => {
      if (drawTimerRef.current !== null) {
        window.clearTimeout(drawTimerRef.current);
      }
      stopCameraStream(streamRef.current);
      landmarkerRef.current?.close?.();
    };
  }, []);

  const toneCopy = useMemo(
    () => (session.result ? renderResultTone(session.result, activeTone) : null),
    [activeTone, session.result]
  );
  const activeCampaign = useMemo(
    () =>
      effectivePublishedSnapshot?.campaign ??
      PHASE7_THEME_REGISTRY.campaigns.find((campaign) => campaign.campaign_id === activeCampaignId) ??
      DEFAULT_PHASE7_CAMPAIGN,
    [activeCampaignId, effectivePublishedSnapshot]
  );
  const activeTheme = useMemo(
    () => effectivePublishedSnapshot?.theme ?? getCampaignThemePack(activeCampaign.campaign_id),
    [activeCampaign.campaign_id, effectivePublishedSnapshot]
  );
  const activeScenario = useMemo(
    () => getScenarioForCampaign(activeCampaign.campaign_id),
    [activeCampaign.campaign_id]
  );
  const activeCampaignCardCount = useMemo(
    () => getThemeCardsForCampaign(activeCampaign.campaign_id, publishedBlocklist).length,
    [activeCampaign.campaign_id, publishedBlocklist]
  );
  const activeReuseReport = useMemo(
    () => buildPhase7ReuseReport(activeCampaign.scenario_id),
    [activeCampaign.scenario_id]
  );
  const phase8AdminReport = useMemo(
    () => buildPhase8AdminReport(adminStore, PHASE8_CONFIG_VERSION),
    [adminStore]
  );
  const phase8ExportSize = useMemo(
    () => exportAdminConfigStore(adminStore).length,
    [adminStore]
  );
  const posterModel = useMemo(
    () =>
      session.result
        ? createPhase7PosterRenderModel(activeCampaign.campaign_id, session.result, activeTone)
        : null,
    [activeCampaign.campaign_id, activeTone, session.result]
  );
  const progressStyle = { "--progress": `${Math.round(calibrationProgress * 100)}%` } as CSSProperties;
  const resultSourceTitle = session.result ? getSourceTitle(session.result.source_id) : "";
  const canTriggerAction = session.state === "action_task";
  const cameraSurfaceVisualMode = useMemo(
    () => getCameraSurfaceVisualMode(cameraState.status),
    [cameraState.status]
  );
  const blockActiveCampaignCard = useCallback((): void => {
    const nextCardId = activeCampaign.card_pool_ids.find(
      (cardId) => !adminStore.card_blocklist.some((entry) => entry.card_id === cardId)
    );

    if (!nextCardId) {
      setAdminNotice("当前活动卡池没有可新增下线的候选卡。");
      return;
    }

    try {
      setAdminStore(
        addCardToAdminBlocklist(
          adminStore,
          nextCardId,
          adminRole,
          "Phase 11 draft blocklist drill",
          "Excluded from user results after this draft is published as a commercial-approved SaaS snapshot."
        )
      );
      setAdminNotice(`已在草稿中下线 ${nextCardId}；公开 H5 仍读取已发布快照，发布后才会生效。`);
    } catch (error) {
      setAdminNotice(error instanceof Error ? error.message : "卡牌下线失败。");
    }
  }, [activeCampaign.card_pool_ids, adminRole, adminStore]);
  const unblockLatestAdminCard = useCallback((): void => {
    const latest = adminStore.card_blocklist[0];

    if (!latest) {
      setAdminNotice("当前没有已下线卡牌。");
      return;
    }

    try {
      setAdminStore(
        removeCardFromAdminBlocklist(
          adminStore,
          latest.card_id,
          adminRole,
          "Phase 9 draft unblock drill"
        )
      );
      setAdminNotice(`已在草稿中恢复 ${latest.card_id}，Commercial SaaS 审计会在发布/迁移时保留摘要。`);
    } catch (error) {
      setAdminNotice(error instanceof Error ? error.message : "卡牌恢复失败。");
    }
  }, [adminRole, adminStore]);

  const openExpertDrawer = useCallback(
    (tab: ExpertDrawerTab, phasePanel?: ExpertDrawerPhasePanel): void => {
      setExpertTab(tab);
      if (phasePanel) {
        setActivePhasePanel(phasePanel);
      }
      setExpertDrawerOpen(true);
    },
    []
  );

  const closeExpertDrawer = useCallback((): void => {
    setExpertDrawerOpen(false);
  }, []);

  const expertDebugContent = (
    <div className="drawer-section-stack">
      <section className="panel">
        <div className="panel-title">
          <Smile size={18} aria-hidden="true" />
          动作任务
        </div>
        <div className="action-grid">
          {ACTION_SEQUENCE.map((type) => (
            <button
              className={selectedAction === type ? "active" : ""}
              type="button"
              key={type}
              onClick={() => setSelectedAction(type)}
            >
              {ACTION_LABELS[type]}
            </button>
          ))}
        </div>
        <div className="simulator-row" aria-label="动作事件调试触发">
          {VISION_EVENT_TYPES.filter((type) => type !== "manual_draw").map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => handleVisionEvent(makeVisionEvent(type, 0.9, 0.86))}
              disabled={!canTriggerAction}
              title={`调试触发 ${ACTION_LABELS[type]}`}
              aria-label={`simulate ${type}`}
              data-testid={`simulate-action-${type}`}
            >
              {ACTION_LABELS[type]}
            </button>
          ))}
        </div>
        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={beginVisionSimulation}
            disabled={session.state === "drawing" || session.state === "result"}
            aria-label="start vision simulation"
            data-testid="vision-simulation-button"
          >
            <Eye size={18} aria-hidden="true" />
            测试视觉模拟
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <Eye size={18} aria-hidden="true" />
          视觉状态
        </div>
        <dl className="metric-grid">
          <div>
            <dt>会话</dt>
            <dd>{session.state}</dd>
          </div>
          <div>
            <dt>摄像头</dt>
            <dd>{cameraState.status}</dd>
          </div>
          <div>
            <dt>模型</dt>
            <dd>{mediaPipeState.status}</dd>
          </div>
          <div>
            <dt>质量</dt>
            <dd>{QUALITY_LABELS[qualityState]}</dd>
          </div>
          <div>
            <dt>FPS</dt>
            <dd>{performanceSnapshot.fps}</dd>
          </div>
          <div>
            <dt>帧耗时</dt>
            <dd>{performanceSnapshot.average_frame_time_ms}ms</dd>
          </div>
          <div>
            <dt>质量分</dt>
            <dd>{faceFeatures?.quality_score ?? 0}</dd>
          </div>
          <div>
            <dt>Yaw</dt>
            <dd>{faceFeatures?.yaw ?? 0}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-title">
          <TimerReset size={18} aria-hidden="true" />
          最近事件
        </div>
        <div className="event-list">
          {recentVisionEvents.length === 0 ? (
            <p className="muted">暂无动作事件。</p>
          ) : (
            recentVisionEvents.map((event) => (
              <div className="event-row" key={`${event.type}-${event.timestamp}`}>
                <span>{ACTION_LABELS[event.type]}</span>
                <strong>{Math.round(event.confidence * 100)}%</strong>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const expertOpsContent = (
    <div className="drawer-section-stack">
      <section className="panel">
        <div className="panel-title">
          <Rocket size={18} aria-hidden="true" />
          多主题活动
        </div>
        <div className="campaign-switch" aria-label="活动切换">
          {PHASE7_THEME_REGISTRY.campaigns.map((campaign) => {
            const theme = getCampaignThemePack(campaign.campaign_id);

            return (
              <button
                className={activeCampaign.campaign_id === campaign.campaign_id ? "active" : ""}
                type="button"
                key={campaign.campaign_id}
                onClick={() => {
                  setActiveCampaignId(campaign.campaign_id);
                  resetExperience();
                }}
              >
                {theme.name}
              </button>
            );
          })}
        </div>
        <p className="muted">{activeScenario.privacy_notice}</p>
      </section>

      <section className="panel">
        <div className="panel-title">
          <CheckCircle2 size={18} aria-hidden="true" />
          隐私默认值
        </div>
        <ul className="check-list">
          <li>摄像头帧：{privacyDefault.camera_frames}</li>
          <li>原始图像上传：{String(privacyDefault.raw_image_upload)}</li>
          <li>身份识别：{String(privacyDefault.identity_recognition)}</li>
          <li>埋点：{privacyDefault.analytics}</li>
        </ul>
      </section>

      <section className="panel">
        <div className="panel-title">
          <ShieldCheck size={18} aria-hidden="true" />
          灰度埋点草案
        </div>
        <p className="muted">{DISCLAIMER_POLICIES.share_placeholder.copy}</p>
        <div className="event-list">
          {anonymousEvents.length === 0 ? (
            <p className="muted">暂无匿名事件。</p>
          ) : (
            anonymousEvents.map((event) => (
              <div className="event-row" key={`${event.event_type}-${event.timestamp}`}>
                <span>{event.event_type}</span>
                <strong>{event.fallback_reason ?? event.trigger ?? event.card_group ?? "local"}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <CheckCircle2 size={18} aria-hidden="true" />
          灰度批次
        </div>
        <dl className="metric-grid">
          <div>
            <dt>批次</dt>
            <dd>{DEFAULT_GRAY_TEST_BATCH.batch_id}</dd>
          </div>
          <div>
            <dt>版本</dt>
            <dd>{DEFAULT_GRAY_TEST_BATCH.version}</dd>
          </div>
          <div>
            <dt>目标样本</dt>
            <dd>{DEFAULT_GRAY_TEST_BATCH.target_sample_size}</dd>
          </div>
          <div>
            <dt>候选卡牌</dt>
            <dd>{grayPublishableCandidateCount}</dd>
          </div>
          <div>
            <dt>Go/No-Go</dt>
            <dd>{samplePhase5GoNoGo.decision}</dd>
          </div>
          <div>
            <dt>覆盖面</dt>
            <dd>{DEFAULT_GRAY_TEST_BATCH.allowed_surfaces.length}</dd>
          </div>
        </dl>
        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setGrayNotice("反馈入口：记录评分、分享意愿、设备浏览器和问题标签。")}
          >
            反馈入口
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setGrayNotice("问题上报：命中文案或隐私风险时进入卡牌下线复核。")}
          >
            问题上报
          </button>
        </div>
        <p className="muted">{grayNotice}</p>
      </section>

      <section className="panel">
        <div className="panel-title">
          <TimerReset size={18} aria-hidden="true" />
          灰度看板
        </div>
        <dl className="metric-grid">
          <div>
            <dt>完成率</dt>
            <dd>{percent(sampleGrayMetricsReport.completion_rate)}</dd>
          </div>
          <div>
            <dt>手动完成</dt>
            <dd>{percent(sampleGrayMetricsReport.manual_completion_rate)}</dd>
          </div>
          <div>
            <dt>动作成功</dt>
            <dd>{percent(sampleGrayMetricsReport.action_success_rate)}</dd>
          </div>
          <div>
            <dt>结果到达</dt>
            <dd>{percent(sampleGrayMetricsReport.result_reach_rate)}</dd>
          </div>
          <div>
            <dt>分享意愿</dt>
            <dd>{percent(sampleGrayMetricsReport.share_intent_rate)}</dd>
          </div>
          <div>
            <dt>负面反馈</dt>
            <dd>{percent(sampleGrayMetricsReport.negative_feedback_rate)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-title">
          <Rocket size={18} aria-hidden="true" />
          发布活动
        </div>
        <dl className="metric-grid">
          <div>
            <dt>活动</dt>
            <dd>{activeCampaign.campaign_id}</dd>
          </div>
          <div>
            <dt>主题</dt>
            <dd>{activeTheme.name}</dd>
          </div>
          <div>
            <dt>形态</dt>
            <dd>{activeCampaign.surface}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{activeCampaign.release_status}</dd>
          </div>
          <div>
            <dt>主题卡池</dt>
            <dd>{activeCampaignCardCount}</dd>
          </div>
          <div>
            <dt>海报模板</dt>
            <dd>{activeTheme.poster_template_id}</dd>
          </div>
        </dl>
        <p className="muted">{activeTheme.safe_positioning}</p>
      </section>

      <section className="panel">
        <div className="panel-title">
          <BarChart3 size={18} aria-hidden="true" />
          发布看板
        </div>
        <dl className="metric-grid">
          <div>
            <dt>活动数</dt>
            <dd>{activeReuseReport.campaign_count}</dd>
          </div>
          <div>
            <dt>可发布卡</dt>
            <dd>{activeReuseReport.publishable_card_count}</dd>
          </div>
          <div>
            <dt>海报</dt>
            <dd>{activeReuseReport.poster_template_ready ? "ready" : "hold"}</dd>
          </div>
          <div>
            <dt>隐私</dt>
            <dd>{activeReuseReport.privacy_ready ? "ready" : "hold"}</dd>
          </div>
          <div>
            <dt>内容</dt>
            <dd>{activeReuseReport.content_review_ready ? "ready" : "hold"}</dd>
          </div>
          <div>
            <dt>Go/No-Go</dt>
            <dd>{activeReuseReport.go_no_go_decision}</dd>
          </div>
        </dl>
      </section>
    </div>
  );

  const phaseContent = useMemo<Record<ExpertDrawerPhasePanel, React.JSX.Element | null>>(() => {
    const emptyPanels: Record<ExpertDrawerPhasePanel, React.JSX.Element | null> = {
      phase8: null,
      phase9: null,
      phase10: null,
      phase11: null,
      phase12: null,
      phase13: null,
      phase14: null,
      phase15: null
    };

    switch (activePhasePanel) {
      case "phase8":
        return {
          ...emptyPanels,
          phase8: (
            <Phase8AdminWorkspace
              activeCampaignId={activeCampaign.campaign_id}
              adminNotice={adminNotice}
              configVersion={PHASE8_CONFIG_VERSION}
              exportSize={phase8ExportSize}
              report={phase8AdminReport}
              selectedRole={adminRole}
              store={adminStore}
              onBlockCard={blockActiveCampaignCard}
              onRoleChange={setAdminRole}
              onUnblockCard={unblockLatestAdminCard}
            />
          )
        };
      case "phase9":
        return {
          ...emptyPanels,
          phase9: (
            <Phase9SaasWorkspace
              activeTenantId={activeTenantId}
              activeSnapshot={activePublishedSnapshot}
              metrics={phase9Metrics}
              report={phase9SaasReport}
              state={phase9SaasState}
            />
          )
        };
      case "phase10":
        return {
          ...emptyPanels,
          phase10: (
            <Phase10PilotWorkspace
              activeTenantId={activeTenantId}
              activeSnapshot={activePilotSnapshot}
              metricsSummary={phase10MetricsSummary}
              postgresSchema={samplePhase10PostgresSchema}
              report={phase10PilotReport}
              state={phase10PilotState}
            />
          )
        };
      case "phase11":
        return {
          ...emptyPanels,
          phase11: (
            <Phase11CommercialWorkspace
              activeTenantId={activeTenantId}
              activeSnapshot={activeCommercialSnapshot}
              exportPackage={phase11ExportPackage}
              postgresSchema={samplePhase11ManagedPostgresSchema}
              report={phase11CommercialReport}
              state={phase11CommercialState}
            />
          )
        };
      case "phase12":
        return {
          ...emptyPanels,
          phase12: (
            <Phase12ExpansionWorkspace
              activeTenantId={activeTenantId}
              activeSnapshot={activeExpansionSnapshot}
              customerReport={phase12CustomerReport}
              postgresSchema={samplePhase12ExpansionSchema}
              report={phase12ExpansionReport}
              state={phase12ExpansionState}
            />
          )
        };
      case "phase13":
        return {
          ...emptyPanels,
          phase13: (
            <Phase13ScaleWorkspace
              activeTenantId={activeTenantId}
              activeSnapshot={activeScaleSnapshot}
              postgresSchema={samplePhase13ScaleSchema}
              report={phase13ScaleReport}
              reportPackage={phase13ReportPackage}
              state={phase13ScaleState}
            />
          )
        };
      case "phase14":
        return {
          ...emptyPanels,
          phase14: (
            <Phase14OpsWorkspace
              activeTenantId={activeTenantId}
              activeSnapshot={activeOpsSnapshot}
              postgresSchema={samplePhase14OpsSchema}
              report={phase14OpsReport}
              reportPackage={phase14OpsReportPackage}
              state={phase14OpsState}
            />
          )
        };
      case "phase15":
        return {
          ...emptyPanels,
          phase15: (
            <Phase15GrowthWorkspace
              activeTenantId={activeTenantId}
              activeSnapshot={activeGrowthSnapshot}
              portfolioReport={phase15PortfolioReport}
              postgresSchema={samplePhase15GrowthSchema}
              report={phase15ExpansionReport}
              state={phase15GrowthState}
            />
          )
        };
      default: {
        const exhaustiveCheck: never = activePhasePanel;
        throw new Error(`Unhandled phase panel: ${exhaustiveCheck}`);
      }
    }
  }, [
    activeCampaign.campaign_id,
    activeCommercialSnapshot,
    activeExpansionSnapshot,
    activeGrowthSnapshot,
    activeOpsSnapshot,
    activePhasePanel,
    activePilotSnapshot,
    activePublishedSnapshot,
    activeScaleSnapshot,
    activeTenantId,
    adminNotice,
    adminRole,
    adminStore,
    blockActiveCampaignCard,
    phase10MetricsSummary,
    phase10PilotReport,
    phase10PilotState,
    phase11CommercialReport,
    phase11CommercialState,
    phase11ExportPackage,
    phase12CustomerReport,
    phase12ExpansionReport,
    phase12ExpansionState,
    phase13ReportPackage,
    phase13ScaleReport,
    phase13ScaleState,
    phase14OpsReport,
    phase14OpsReportPackage,
    phase14OpsState,
    phase15ExpansionReport,
    phase15GrowthState,
    phase15PortfolioReport,
    phase8AdminReport,
    phase8ExportSize,
    phase9Metrics,
    phase9SaasReport,
    phase9SaasState,
    unblockLatestAdminCard
  ]);

  return (
    <main className="app-shell">
      <section className="mvp-layout">
        <div className="primary-flow">
          <header className="app-header">
            <div>
              <p className="eyebrow">Phase 15 Commercial Expansion</p>
              <h1>观相镜</h1>
            </div>
            <div className="header-actions">
              <div className="status-pill">
                <ShieldCheck size={18} aria-hidden="true" />
                端侧处理
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => openExpertDrawer(expertTab)}
                aria-label="open expert mode"
              >
                <BarChart3 size={18} aria-hidden="true" />
                专家模式
              </button>
            </div>
          </header>

          <section className="summary-panel panel" aria-label="当前活动摘要">
            <div className="summary-copy">
              <p className="eyebrow">当前活动</p>
              <h2>{activeTheme.name}</h2>
              <p>{activeCampaign.display_name}</p>
              <p className="muted">{activeScenario.privacy_notice}</p>
            </div>
            <dl className="summary-metrics">
              <div>
                <dt>形态</dt>
                <dd>{activeCampaign.surface}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{activeCampaign.release_status}</dd>
              </div>
              <div>
                <dt>卡池</dt>
                <dd>{activeCampaignCardCount}</dd>
              </div>
              <div>
                <dt>Phase 16</dt>
                <dd>{phase15ExpansionReport.phase16_recommendation}</dd>
              </div>
            </dl>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => openExpertDrawer("ops")}>
                <Rocket size={18} aria-hidden="true" />
                活动设置
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => openExpertDrawer("phase", "phase15")}
              >
                <BarChart3 size={18} aria-hidden="true" />
                Phase 工作台
              </button>
            </div>
          </section>

          <div className="experience-grid">
            <section className="mirror-panel" aria-label="观相镜主流程">
              <div
                className={`camera-surface${
                  cameraSurfaceVisualMode === "decorative" ? " camera-surface--decorative" : ""
                }`}
              >
                <video ref={videoRef} className="camera-video" playsInline muted />
                {cameraState.status === "active" ? <div className="face-guide" aria-hidden="true" /> : null}

                {session.state === "entry" ? (
                  <div className="surface-overlay">
                    <Sparkles size={36} aria-hidden="true" />
                    <h2>90 秒完成一次{activeTheme.name}抽卡</h2>
                    <p>当前活动：{activeCampaign.display_name}。可使用摄像头端侧动作触发，也可以直接手动抽卡。</p>
                    <p className="surface-disclaimer">{DISCLAIMER_POLICIES.entry.copy}</p>
                    <div className="button-row">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => setSession(enterConsent(sessionRef.current, Date.now()))}
                        aria-label="enter camera experience"
                        data-testid="entry-camera-button"
                      >
                        <Camera size={18} aria-hidden="true" />
                        开镜体验
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={beginManualDraw}
                        aria-label="manual draw card"
                        data-testid="manual-draw-button"
                      >
                        <Hand size={18} aria-hidden="true" />
                        手动抽卡
                      </button>
                    </div>
                  </div>
                ) : null}

                {session.state === "consent" ? (
                  <div className="surface-overlay consent-copy">
                    <ShieldCheck size={34} aria-hidden="true" />
                    <h2>摄像头只用于本次端侧互动</h2>
                    <p>
                      浏览器会请求摄像头权限。人脸关键点和表情动作仅在你的设备上处理，不上传原始图像、视频或身份标识。
                    </p>
                    <p className="surface-disclaimer">{DISCLAIMER_POLICIES.consent.copy}</p>
                    <label className="consent-check">
                      <input
                        type="checkbox"
                        checked={privacyChecked}
                        onChange={(event) => setPrivacyChecked(event.currentTarget.checked)}
                        aria-label="acknowledge privacy"
                        data-testid="privacy-checkbox"
                      />
                      我已知晓这是传统文化娱乐互动，可随时改用手动抽卡。
                    </label>
                    <div className="button-row">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => void acceptCameraConsent()}
                        disabled={!privacyChecked || cameraState.status === "requesting"}
                        aria-label="allow camera and start"
                        data-testid="allow-camera-button"
                      >
                        <Camera size={18} aria-hidden="true" />
                        同意并开镜
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={beginManualDraw}
                        aria-label="continue without camera"
                        data-testid="manual-draw-button"
                      >
                        <Hand size={18} aria-hidden="true" />
                        不开镜
                      </button>
                    </div>
                  </div>
                ) : null}

                {session.state === "camera_setup" || cameraState.status === "requesting" ? (
                  <div className="surface-overlay">
                    <TimerReset size={34} aria-hidden="true" />
                    <h2>正在请求摄像头</h2>
                    <p>授权后会进入 3 秒校准。拒绝授权时自动提供手动抽卡。</p>
                    <p className="surface-disclaimer">{DISCLAIMER_POLICIES.consent.copy}</p>
                  </div>
                ) : null}

                {session.state === "calibration" ? (
                  <div className="surface-overlay compact-overlay">
                    <Eye size={34} aria-hidden="true" />
                    <h2>校准中</h2>
                    <p>{QUALITY_LABELS[qualityState]}，请保持脸部在引导框内。</p>
                    <p className="surface-disclaimer">若光线、多人脸或居中状态不适合开镜，会自动提供手动抽卡。</p>
                    <div className="progress-track" style={progressStyle}>
                      <span />
                    </div>
                  </div>
                ) : null}

                {session.state === "action_task" ? (
                  <div className="surface-overlay task-overlay">
                    <Smile size={34} aria-hidden="true" />
                    <h2>{ACTION_LABELS[selectedAction]}</h2>
                    <p>{ACTION_HINTS[selectedAction]}</p>
                    <p className="surface-disclaimer">超过 {ACTION_TIMEOUT_MS / 1000} 秒未触发动作时，将进入手动抽卡兜底。</p>
                  </div>
                ) : null}

                {session.state === "drawing" ? (
                  <div className="surface-overlay compact-overlay">
                    <Sparkles size={34} aria-hidden="true" />
                    <h2>正在抽取古籍卡牌</h2>
                    <p>{drawMessage}</p>
                  </div>
                ) : null}

                {session.state === "fallback" ? (
                  <div className="surface-overlay compact-overlay">
                    <AlertTriangle size={34} aria-hidden="true" />
                    <h2>已进入兜底模式</h2>
                    <p>{session.calibration?.failure_reason ?? "当前环境不适合开镜。"}</p>
                    <p className="surface-disclaimer">{DISCLAIMER_POLICIES.fallback.copy}</p>
                    <div className="button-row">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={beginManualDraw}
                        aria-label="fallback manual draw"
                        data-testid="manual-draw-button"
                      >
                        <Sparkles size={18} aria-hidden="true" />
                        手动抽卡
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={retryCameraFromFallback}
                        aria-label="retry camera"
                        data-testid="retry-camera-button"
                      >
                        <RefreshCw size={18} aria-hidden="true" />
                        重试开镜
                      </button>
                    </div>
                  </div>
                ) : null}

                {session.state === "exit" ? (
                  <div className="surface-overlay compact-overlay">
                    <CheckCircle2 size={34} aria-hidden="true" />
                    <h2>本次会话已清理</h2>
                    <p>摄像头轨道已停止，本地临时会话数据已清空。</p>
                    <p className="surface-disclaimer">{DISCLAIMER_POLICIES.exit.copy}</p>
                    <button className="primary-button" type="button" onClick={resetExperience}>
                      <RefreshCw size={18} aria-hidden="true" />
                      重新开始
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flow-controls">
                <div className="step-strip" aria-label="MVP 流程状态">
                  {["entry", "consent", "calibration", "action_task", "result", "exit"].map((step) => (
                    <span
                      className={session.state === step ? "active" : ""}
                      key={step}
                    >
                      {step}
                    </span>
                  ))}
                </div>

                <p className="muted">联调工具已收进专家模式，主界面只保留面向用户的流程操作。</p>
                <div className="button-row">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={closeCameraAndFallback}
                    disabled={cameraState.status !== "active"}
                    title="关闭摄像头并提供手动抽卡"
                    aria-label="close camera and fallback"
                  >
                    <CameraOff size={18} aria-hidden="true" />
                    关镜
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={beginManualDraw}
                    aria-label="manual draw card"
                    data-testid="manual-draw-button"
                  >
                    <Sparkles size={18} aria-hidden="true" />
                    手动抽卡
                  </button>
                  <button className="icon-button" type="button" onClick={exitAndClear} title="退出并清理本次会话">
                    <XCircle size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>

            <section className="result-panel" aria-label="古籍卡牌结果">
              {session.result && toneCopy ? (
                <>
                  <div className="result-heading">
                    <p className="card-id">{session.result.card_id}</p>
                    <h2>{session.result.safe_title}</h2>
                    <span>{ACTION_LABELS[session.result.trigger]}</span>
                  </div>

                  <div className="tone-tabs" role="tablist" aria-label="结果表达">
                    {(["classic", "light", "action"] as const).map((tone) => (
                      <button
                        className={activeTone === tone ? "active" : ""}
                        type="button"
                        role="tab"
                        aria-selected={activeTone === tone}
                        key={tone}
                        onClick={() => setActiveTone(tone)}
                      >
                        {renderResultTone(session.result!, tone).label}
                      </button>
                    ))}
                  </div>

                  <p className="result-copy">{toneCopy.copy}</p>
                  <dl className="result-meta">
                    <div>
                      <dt>出处</dt>
                      <dd>{resultSourceTitle}</dd>
                    </div>
                    <div>
                      <dt>现代释义</dt>
                      <dd>{session.result.modern_gloss}</dd>
                    </div>
                  </dl>
                  <p className="disclaimer">
                    {DISCLAIMER_POLICIES.result.copy}
                  </p>
                  {posterModel ? (
                    <div className="poster-preview" aria-label="无原始人脸分享海报预览">
                      <div>
                        <p className="eyebrow">Poster PNG</p>
                        <h3>{posterModel.theme_name}</h3>
                        <strong>{posterModel.card_title}</strong>
                        <p>{posterModel.action_suggestion}</p>
                        <small>{posterModel.disclaimer}</small>
                        {posterModel.venue_notice_required ? <small>{posterModel.onsite_notice_copy}</small> : null}
                      </div>
                      <QrCode size={54} aria-hidden="true" />
                    </div>
                  ) : null}
                  <div className="button-row">
                    <button className="primary-button" type="button" onClick={beginManualDraw}>
                      <Sparkles size={18} aria-hidden="true" />
                      再抽一张
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={downloadPoster}
                      aria-label="download poster"
                      data-testid="download-poster-button"
                    >
                      <QrCode size={18} aria-hidden="true" />
                      下载海报
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => void sharePoster()}
                      aria-label="share poster"
                      data-testid="share-poster-button"
                    >
                      <Rocket size={18} aria-hidden="true" />
                      分享海报
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => void generateDeepSeekReading()}
                      disabled={deepSeekReading.status === "loading"}
                      aria-label="generate DeepSeek reading"
                      data-testid="deepseek-reading-button"
                    >
                      <Sparkles size={18} aria-hidden="true" />
                      {deepSeekReading.status === "loading" ? "生成中" : "模型解读"}
                    </button>
                    <button className="secondary-button" type="button" onClick={exitAndClear}>
                      <XCircle size={18} aria-hidden="true" />
                      退出清理
                    </button>
                  </div>
                  {deepSeekReading.status !== "idle" ? (
                    <div
                      className={`model-reading ${deepSeekReading.status}`}
                      aria-live="polite"
                      data-testid="deepseek-reading-panel"
                    >
                      <p className="eyebrow">DeepSeek v4 Flash</p>
                      {deepSeekReading.status === "loading" ? (
                        <p>正在生成模型解读。</p>
                      ) : deepSeekReading.status === "success" ? (
                        <p>{deepSeekReading.reply}</p>
                      ) : (
                        <p>{deepSeekReading.message}</p>
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="empty-result">
                  <BookOpen size={30} aria-hidden="true" />
                  <h2>结果页等待卡牌</h2>
                  <p>完成动作或手动抽卡后，这里会显示安全标题、出处、现代释义、行动建议和免责声明。</p>
                  <p className="surface-disclaimer">{DISCLAIMER_POLICIES.result.copy}</p>
                </div>
              )}
            </section>
          </div>
        </div>
        <ExpertDrawer
          activePhasePanel={activePhasePanel}
          activeTab={expertTab}
          debugContent={expertDebugContent}
          isOpen={expertDrawerOpen}
          onClose={closeExpertDrawer}
          onPhasePanelChange={setActivePhasePanel}
          onTabChange={setExpertTab}
          opsContent={expertOpsContent}
          phaseContent={phaseContent}
        />
      </section>
    </main>
  );
}
