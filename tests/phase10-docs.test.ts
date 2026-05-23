import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 10 pilot artifacts", () => {
  it("exposes a phase 10 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase10"]).toBe(
      "vitest run tests/phase10-pilot.test.ts tests/phase10-docs.test.ts"
    );
  });

  it("documents the controlled SaaS pilot and production persistence boundary", () => {
    const doc = readDoc("docs/phase10/production-saas-pilot.md");

    expect(doc).toContain("Phase 10");
    expect(doc).toContain("PilotTenant");
    expect(doc).toContain("PostgreSQL-compatible");
    expect(doc).toContain("pilot/published snapshot");
    expect(doc).toContain("PrivacyScanResult");
    expect(doc).toContain("No printer, NFC, large-screen, ticketing, or hardware SDK integration");
  });

  it("documents the phase 11 decision and controlled-pilot exit criteria", () => {
    const doc = readDoc("docs/phase10/phase11-decision.md");

    expect(doc).toContain("Phase 11");
    expect(doc).toContain("commercialization");
    expect(doc).toContain("hardware专项");
    expect(doc).toContain("rollback drill");
    expect(doc).toContain("go_no_go_decision");
  });
});
