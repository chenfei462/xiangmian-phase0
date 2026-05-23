# Phase 15 Decision Criteria

Phase 15 should be chosen only after Phase 14 proves stable operations across 10-15 manually admitted commercial customers without privacy, tenant-isolation, SLA, support-capacity, or report-quality regressions.

## Go Signals

- `go_no_go_decision` is `go` in `Phase14OpsReport`.
- Stable operations can support 10-15 active customers across multiple waves.
- Customer admission policies, operation profiles, support capacity, renewal signals, and ops report packages stay current.
- H5 continues to read only active commercial-approved published snapshots.
- Support load stays healthy without public self-service, online billing, or a formal ticketing system.

## Phase 15 Options

- Start a billing and contract module if renewal intent, pricing objections, and contract blockers are the main customer bottleneck.
- Continue commercial expansion if stable operations are healthy and billing evidence is still incomplete.
- Start a hardware专项 only if SaaS governance remains stable and customers have concrete venue requirements.

## Hold Signals

- Any raw face data, user identity, phone number, device fingerprint, keypoint array, or biometric field appears in reports, exports, metrics, audit, snapshots, or support records.
- A customer can read or operate another tenant's activity, snapshot, report package, metrics, audit, or support record.
- Support capacity moves to overloaded status or open incidents persist across the review period.
- Customers require public signup, online payment, mini program, printer, NFC, large-screen, ticketing, or hardware SDK before governance is ready.

## Recommendation

Default Phase 15 direction should be decided by evidence. Choose billing if renewal and contract blockers dominate. Choose continued commercial expansion if support capacity and privacy scans are stable. Keep hardware as a separate专项 until venue networks, device operations, on-site support, and privacy notices are ready.
