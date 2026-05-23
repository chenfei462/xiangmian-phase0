# Phase 12 Commercial Customer Expansion Run

Phase 12 expands the Phase 11 commercial SaaS hardening from one controlled B-side customer to a manually admitted 3-5 customer expansion batch. The goal is to prove repeatable onboarding, tenant isolation, SLA response, support runbooks, customer reports, privacy scans, release governance, and operator delivery.

## Scope

- Frontend remains Vite + React + TypeScript H5.
- Backend model remains TypeScript SaaS service plus Managed PostgreSQL-compatible persistence boundary.
- H5 only reads an active tenant's `commercial-approved published snapshot`.
- Draft, review, paused, suspended, archived, and rolled_back configuration cannot enter user results.
- Customers are admitted manually by internal operations; no open self-service path is enabled.

## Interfaces

- `CustomerExpansionBatch`: batch window, target customer count, eligible tenants, success metrics, and status.
- `TenantEntitlement`: service tier, campaign limit, theme authorization, export switch, SLA policy, and customer status.
- `CustomerSlaPolicy`: response target, escalation target, support channel, and review status.
- `CustomerHealthScore`: score, status, risk flags, and review timestamps.
- `CommercialCustomerReport`: campaign count, snapshot count, anonymous completion metrics, support incident count, and privacy result.
- `CustomerSupportRunbook`: scenario, severity, owner role, steps, rollback flag, and review status.
- `CustomerSuccessReview`: period review, health score, blockers, recommended actions, and next review time.
- `Phase12ExpansionReport`: customer count, active customer count, SLA, tenant isolation, privacy, support readiness, and `go_no_go_decision`.

## Operating Rules

- Entitlements enforce allowed campaign count and allowed theme ids before operators can enable a campaign.
- Tenant isolation blocks customer accounts from reading or operating another tenant's activity, snapshot, export package, metrics, audit, support record, or customer report.
- SLA policies must be approved before a tenant can be counted as expansion-ready.
- Every active tenant gets an anonymous customer report and a privacy scan result before weekly review.
- Support runbooks cover privacy concern, release rollback, and onboarding/report confusion.
- Any privacy or content escalation can pause the affected tenant and force rollback to the previous approved snapshot.

## Privacy Boundary

No public signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK.

Phase 12 keeps the existing privacy defaults: no raw image, raw video, camera frame, keypoint array, face template, biometric template, ordinary user identity, phone number, or device fingerprint in snapshots, reports, metrics, exports, audits, or support records.
