import { describe, expect, it } from "vitest";

import { getCameraSurfaceVisualMode } from "../src/lib/camera-surface";

describe("getCameraSurfaceVisualMode", () => {
  it("uses the live mode only when the camera is active", () => {
    expect(getCameraSurfaceVisualMode("active")).toBe("live");
  });

  it("uses the decorative mode for non-active camera states", () => {
    expect(getCameraSurfaceVisualMode("idle")).toBe("decorative");
    expect(getCameraSurfaceVisualMode("requesting")).toBe("decorative");
    expect(getCameraSurfaceVisualMode("denied")).toBe("decorative");
    expect(getCameraSurfaceVisualMode("error")).toBe("decorative");
  });
});
