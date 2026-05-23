import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 11 commercial SaaS artifacts", () => {
  it("exposes a phase 11 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase11"]).toBe(
      "vitest run tests/phase11-commercial.test.ts tests/phase11-docs.test.ts"
    );
  });

  it("documents commercial SaaS hardening", () => {
    const doc = readDoc("docs/phase11/commercial-saas-hardening.md");

    expect(doc).toContain("Phase 11");
    expect(doc).toContain("CommercialTenant");
    expect(doc).toContain("AdminAuthSession");
    expect(doc).toContain("Managed PostgreSQL");
    expect(doc).toContain("commercial-approved published snapshot");
    expect(doc).toContain("No public signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK");
  });

  it("documents phase 12 decision criteria", () => {
    const doc = readDoc("docs/phase11/phase12-decision.md");

    expect(doc).toContain("Phase 12");
    expect(doc).toContain("commercial expansion");
    expect(doc).toContain("billing");
    expect(doc).toContain("hardware专项");
    expect(doc).toContain("go_no_go_decision");
  });
});
