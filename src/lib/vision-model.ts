import type { FaceLandmarkerResult } from "./vision-features";

const TASKS_VISION_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm";
const TASKS_WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

export type FaceLandmarker = {
  detectForVideo(video: HTMLVideoElement, timestamp: number): FaceLandmarkerResult;
  close?: () => void;
};

type MediaPipeVisionModule = {
  FilesetResolver: {
    forVisionTasks: (wasmRoot: string) => Promise<unknown>;
  };
  FaceLandmarker: {
    createFromOptions: (
      resolver: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate: "GPU" | "CPU" };
        runningMode: "VIDEO";
        outputFaceBlendshapes: boolean;
        outputFacialTransformationMatrixes: boolean;
        numFaces: number;
      }
    ) => Promise<FaceLandmarker>;
  };
};

export type MediaPipeLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; landmarker: FaceLandmarker }
  | { status: "loading_timeout"; message: string }
  | { status: "error"; message: string };

export class MediaPipeLoadTimeoutError extends Error {
  readonly reason = "loading_timeout" as const;

  constructor(timeoutMs: number) {
    super(`MediaPipe FaceLandmarker loading timed out after ${timeoutMs}ms`);
    this.name = "MediaPipeLoadTimeoutError";
  }
}

export type LoadMediaPipeFaceLandmarkerOptions = {
  timeoutMs?: number;
  importVision?: () => Promise<MediaPipeVisionModule>;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new MediaPipeLoadTimeoutError(timeoutMs)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

export async function loadMediaPipeFaceLandmarker(
  options: LoadMediaPipeFaceLandmarkerOptions = {}
): Promise<FaceLandmarker> {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const importVision =
    options.importVision ??
    (() => import(/* @vite-ignore */ TASKS_VISION_CDN) as Promise<MediaPipeVisionModule>);
  const vision = await withTimeout(importVision(), timeoutMs);
  const resolver = await vision.FilesetResolver.forVisionTasks(TASKS_WASM_ROOT);

  return withTimeout(
    vision.FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: FACE_MODEL_URL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      numFaces: 2
    }),
    timeoutMs
  );
}
