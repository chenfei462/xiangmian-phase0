import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 13 commercial scale artifacts", () => {
  it("exposes a phase 13 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase13"]).toBe(
      "vitest run tests/phase13-scale.test.ts tests/phase13-docs.test.ts"
    );
  });

  it("documents commercial scale runbook", () => {
    const doc = readDoc("docs/phase13/commercial-scale-run.md");

    expect(doc).toContain("Phase 13");
    expect(doc).toContain("CustomerScaleBatch");
    expect(doc).toContain("CustomerOnboardingRun");
    expect(doc).toContain("commercial-approved published snapshot");
    expect(doc).toContain("No public signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK");
  });

  it("documents phase 14 decision criteria", () => {
    const doc = readDoc("docs/phase13/phase14-decision.md");

    expect(doc).toContain("Phase 14");
    expect(doc).toContain("commercial scale");
    expect(doc).toContain("billing");
    expect(doc).toContain("hardware专项");
    expect(doc).toContain("go_no_go_decision");
  });
});
