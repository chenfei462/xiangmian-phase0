# Phase 15 Commercial Expansion Run

Phase 15 continues commercial expansion after Phase 14 stable operations. The target is 15-25 manually admitted commercial customers with repeatable cohorts, lifecycle governance, tenant isolation, support capacity forecasts, customer portfolio reports, billing evidence, retention signals, privacy scans, and published snapshot safety.

## Scope

- Frontend remains Vite + React + TypeScript H5.
- Backend model remains TypeScript SaaS service plus Managed PostgreSQL-compatible persistence boundary.
- H5 only reads an active tenant's `commercial-approved published snapshot`.
- Draft, review, paused, suspended, archived, and rolled_back configuration cannot enter user results.
- Customers are still manually admitted by internal operations.

## Interfaces

- `CustomerGrowthCohort`: growth cohort window, target customer count, tenant ids, growth policy, owner role, and status.
- `CustomerGrowthPolicy`: max customer count, required reviews, service tier allowlist, support capacity thresholds, stop conditions, and review status.
- `CustomerLifecycleState`: tenant lifecycle status, onboarding completion, first campaign publication, last active time, pause reason, and archive reason.
- `GrowthCapacityForecast`: active customer count, support owner count, incidents, open incidents, response-met rate, projected load, and capacity status.
- `CustomerRetentionSignal`: customer health, renewal intent, risk level, expansion opportunity, and next action.
- `BillingEvidenceBacklog`: pricing objection, contract blockers, requested terms, procurement stage, urgency, next action, and review status.
- `CustomerPortfolioReport`: customer count, active count, cohort count, onboarding completion, SLA, privacy, support capacity, and retention risk count.
- `Phase15ExpansionReport`: growth, tenant isolation, privacy, support capacity, billing evidence, Phase 16 recommendation, and `go_no_go_decision`.

## Operating Rules

- Active commercial customers must stay within the 15-25 customer Phase 15 limit.
- Growth admission is blocked if privacy or compliance reviews are missing, support capacity is overloaded, tenant isolation fails, service tier is not allowed, theme authorization is absent, or campaign limits are exceeded.
- Tenant isolation blocks customer accounts from reading or operating another tenant's activity, snapshot, report package, metrics, audit, support record, or billing evidence.
- Support capacity forecasts must stay below the configured projected-load threshold with acceptable response-met rate and no unresolved incident backlog.
- Billing and contract data remain evidence only; they do not create a billing, contract, public signup, or online payment system in Phase 15.

## Privacy Boundary

No public signup, billing, online payment, mini program, printer, NFC, large-screen, ticketing, or hardware SDK.

Phase 15 keeps the existing privacy defaults: no raw image, raw video, camera frame, keypoint array, face template, biometric template, ordinary user identity, phone number, or device fingerprint in snapshots, reports, metrics, exports, audits, support records, or billing evidence.
