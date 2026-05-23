import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 15 commercial expansion artifacts", () => {
  it("exposes a phase 15 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase15"]).toBe(
      "vitest run tests/phase15-expansion.test.ts tests/phase15-docs.test.ts"
    );
  });

  it("documents commercial expansion runbook", () => {
    const doc = readDoc("docs/phase15/commercial-expansion-run.md");

    expect(doc).toContain("Phase 15");
    expect(doc).toContain("CustomerGrowthCohort");
    expect(doc).toContain("CustomerGrowthPolicy");
    expect(doc).toContain("commercial-approved published snapshot");
    expect(doc).toContain("No public signup, billing, online payment, mini program, printer, NFC, large-screen, ticketing, or hardware SDK");
  });

  it("documents phase 16 decision criteria", () => {
    const doc = readDoc("docs/phase15/phase16-decision.md");

    expect(doc).toContain("Phase 16");
    expect(doc).toContain("continue commercial expansion");
    expect(doc).toContain("billing");
    expect(doc).toContain("hardware专项");
    expect(doc).toContain("go_no_go_decision");
  });
});
