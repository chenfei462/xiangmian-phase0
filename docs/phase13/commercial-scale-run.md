# Phase 13 Commercial Scale Run

Phase 13 moves the Phase 12 commercial customer expansion from one 3-5 customer batch into a repeatable 6-10 customer scale run. The work is still manually admitted and operations-led: the goal is repeatable onboarding, tenant isolation, SLA performance, customer report packages, privacy scans, support review, and stable published snapshot delivery.

## Scope

- Frontend remains Vite + React + TypeScript H5.
- Backend model remains TypeScript SaaS service plus Managed PostgreSQL-compatible persistence boundary.
- H5 only reads an active tenant's `commercial-approved published snapshot`.
- Draft, review, paused, suspended, archived, and rolled_back configuration cannot enter user results.
- Customers are admitted manually by internal operations; no open self-service path is enabled.

## Interfaces

- `CustomerScaleBatch`: scale batch window, target customer count, tenant ids, owner role, success metrics, and status.
- `CustomerOnboardingRun`: tenant onboarding status, theme authorization, privacy review, legal review, first campaign readiness, and completion time.
- `CustomerHealthTrend`: weekly health score, risk flags, SLA miss count, support incident count, and recommended actions.
- `SlaPerformanceSummary`: response-met rate, escalation count, open incident count, review completion rate, and generation time.
- `CustomerReportPackage`: report package, anonymous metrics summary, privacy scan, audit summary, and support summary references.
- `ScaleReadinessGate`: readiness item, owner role, pass/block status, evidence, blocker reason, and review time.
- `Phase13ScaleReport`: customer count, active customer count, batch count, onboarding, SLA, tenant isolation, privacy, support load, and `go_no_go_decision`.

## Operating Rules

- Two or more active scale batches must cover 6-10 active commercial tenants.
- Every active tenant must have a completed onboarding run before its report package counts toward scale readiness.
- Entitlements enforce allowed campaign count and allowed theme ids before operators can enable a campaign.
- Tenant isolation blocks customer accounts from reading or operating another tenant's activity, snapshot, export package, metrics, audit, support record, or customer report.
- SLA performance must show acceptable response-met rate, no open incidents, and completed support reviews.
- Every active tenant gets a privacy-clean report package before weekly customer success review.

## Privacy Boundary

No public signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK.

Phase 13 keeps the existing privacy defaults: no raw image, raw video, camera frame, keypoint array, face template, biometric template, ordinary user identity, phone number, or device fingerprint in snapshots, reports, metrics, exports, audits, or support records.
