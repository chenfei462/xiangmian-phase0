import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 14 stable commercial operations artifacts", () => {
  it("exposes a phase 14 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase14"]).toBe(
      "vitest run tests/phase14-ops.test.ts tests/phase14-docs.test.ts"
    );
  });

  it("documents stable commercial operations runbook", () => {
    const doc = readDoc("docs/phase14/stable-ops-run.md");

    expect(doc).toContain("Phase 14");
    expect(doc).toContain("CustomerScaleWave");
    expect(doc).toContain("CustomerAdmissionPolicy");
    expect(doc).toContain("commercial-approved published snapshot");
    expect(doc).toContain("No public signup, billing, online payment, mini program, printer, NFC, large-screen, ticketing, or hardware SDK");
  });

  it("documents phase 15 decision criteria", () => {
    const doc = readDoc("docs/phase14/phase15-decision.md");

    expect(doc).toContain("Phase 15");
    expect(doc).toContain("stable operations");
    expect(doc).toContain("billing");
    expect(doc).toContain("hardware专项");
    expect(doc).toContain("go_no_go_decision");
  });
});
