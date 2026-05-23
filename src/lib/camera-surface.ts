export type CameraSurfaceStatus = "idle" | "requesting" | "active" | "denied" | "error";
export type CameraSurfaceVisualMode = "decorative" | "live";

export function getCameraSurfaceVisualMode(
  status: CameraSurfaceStatus
): CameraSurfaceVisualMode {
  return status === "active" ? "live" : "decorative";
}
