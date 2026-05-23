# Phase 14 Decision Criteria

Phase 14 should be chosen only after Phase 13 proves commercial scale can be repeated across 6-10 manually admitted customers without privacy, tenant-isolation, SLA, or support-load regressions.

## Go Signals

- `go_no_go_decision` is `go` in `Phase13ScaleReport`.
- commercial scale has 6-10 active customers across at least two active scale batches.
- Every active tenant has completed onboarding, approved entitlement, clean report package, SLA performance summary, and customer health trend.
- H5 continues to read only active commercial-approved published snapshots.
- Support load stays acceptable without a formal ticketing system.

## Phase 14 Options

- Continue commercial scale if support load, privacy scans, and customer reports stay stable.
- Add billing and contract modules if customer scope, pricing, renewal, and contract evidence become the main blocker.
- Start a hardware专项 only if SaaS governance remains stable and a customer has a concrete venue requirement.

## Hold Signals

- Any raw face data, user identity, phone number, device fingerprint, or biometric field appears in reports, exports, metrics, audit, snapshots, or support records.
- A customer can read or operate another tenant's activity, snapshot, export package, metrics, audit, support record, or customer report.
- SLA response misses or open incidents exceed the manual support capacity.
- Customers request public signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK before governance is ready.

## Recommendation

Default Phase 14 direction remains commercial scale unless contracts and renewals become the primary bottleneck. Billing should come before hardware if revenue operations are unclear; hardware should stay a separate专项 because it adds venue network, device operations, on-site incident response, and privacy-notice complexity.
