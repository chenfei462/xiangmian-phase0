import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 12 commercial customer expansion artifacts", () => {
  it("exposes a phase 12 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase12"]).toBe(
      "vitest run tests/phase12-expansion.test.ts tests/phase12-docs.test.ts"
    );
  });

  it("documents commercial customer expansion runbook", () => {
    const doc = readDoc("docs/phase12/customer-expansion-run.md");

    expect(doc).toContain("Phase 12");
    expect(doc).toContain("CustomerExpansionBatch");
    expect(doc).toContain("TenantEntitlement");
    expect(doc).toContain("commercial-approved published snapshot");
    expect(doc).toContain("No public signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK");
  });

  it("documents phase 13 decision criteria", () => {
    const doc = readDoc("docs/phase12/phase13-decision.md");

    expect(doc).toContain("Phase 13");
    expect(doc).toContain("commercial expansion");
    expect(doc).toContain("billing");
    expect(doc).toContain("hardware专项");
    expect(doc).toContain("go_no_go_decision");
  });
});
