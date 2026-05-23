# Phase 14 Stable Commercial Operations Run

Phase 14 moves the Phase 13 commercial scale run from 6-10 customers to 10-15 manually admitted commercial customers. The work focuses on stable operations: customer waves, admission governance, operation profiles, renewal evidence, support capacity, customer ops reports, privacy scans, and published snapshot safety.

## Scope

- Frontend remains Vite + React + TypeScript H5.
- Backend model remains TypeScript SaaS service plus Managed PostgreSQL-compatible persistence boundary.
- H5 only reads an active tenant's `commercial-approved published snapshot`.
- Draft, review, paused, suspended, archived, and rolled_back configuration cannot enter user results.
- Customers are still manually admitted by internal operations.

## Interfaces

- `CustomerScaleWave`: customer wave window, target customer count, tenant ids, admission policy, owner role, and status.
- `CustomerAdmissionPolicy`: max customer count, required reviews, allowed service tiers, stop conditions, and review status.
- `CustomerOperationProfile`: tenant service tier, support owner, privacy owner, contract contact, campaign limit, theme authorization, and status.
- `CustomerRenewalSignal`: renewal intent, pricing objection, requested features, blockers, and next action.
- `SupportCapacitySummary`: active customer count, incidents, open incidents, response-met rate, review completion rate, and capacity status.
- `CustomerOpsReportPackage`: report package references for metrics, privacy scan, audit summary, support summary, health trend, and renewal signal.
- `Phase14OpsReport`: customer count, wave count, admission, SLA, tenant isolation, privacy, support capacity, billing evidence, and `go_no_go_decision`.

## Operating Rules

- Active commercial customers must stay within the 10-15 customer Phase 14 limit.
- Admission is blocked if privacy or compliance reviews are missing, service tier is not allowed, theme authorization is absent, or activity limits are exceeded.
- Tenant isolation blocks customer accounts from reading or operating another tenant's activity, snapshot, report package, metrics, audit, or support record.
- Support capacity must stay healthy: response-met rate remains high, open incidents are cleared, and review completion stays current.
- Renewal and contract signals are recorded only as Phase 15 evidence; they do not create a billing or contract system in Phase 14.

## Privacy Boundary

No public signup, billing, online payment, mini program, printer, NFC, large-screen, ticketing, or hardware SDK.

Phase 14 keeps the existing privacy defaults: no raw image, raw video, camera frame, keypoint array, face template, biometric template, ordinary user identity, phone number, or device fingerprint in snapshots, reports, metrics, exports, audits, or support records.
