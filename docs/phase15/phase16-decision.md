# Phase 16 Decision Criteria

Phase 16 should be chosen only after Phase 15 proves 15-25 manually admitted customers can be operated without privacy, tenant-isolation, support-capacity, report-quality, or snapshot-governance regressions.

## Go Signals

- `go_no_go_decision` is `go` in `Phase15ExpansionReport`.
- Commercial expansion can support 15-25 active customers across multiple cohorts.
- Every active tenant has a lifecycle state, retention signal, billing evidence record, privacy scan, and portfolio report coverage.
- H5 continues to read only active commercial-approved published snapshots.
- Support capacity remains healthy and projected load stays below the stop threshold.

## Phase 16 Options

- continue commercial expansion if support capacity is healthy and billing evidence is still not the main blocker.
- Start a billing module if pricing objections, contract blockers, procurement stages, or requested terms become the dominant customer bottleneck.
- Start a hardware专项 only if SaaS governance remains stable and customers have concrete venue requirements.

## Hold Signals

- Any raw face data, user identity, phone number, device fingerprint, keypoint array, or biometric field appears in reports, exports, metrics, audit, snapshots, support records, or billing evidence.
- A customer can read or operate another tenant's activity, snapshot, report package, metrics, audit, support record, or billing evidence.
- Support capacity moves to overloaded status or projected load exceeds the stop threshold.
- Customers require public signup, online payment, mini program, printer, NFC, large-screen, ticketing, or hardware SDK before governance is ready.

## Recommendation

Default Phase 16 direction should be evidence-led. Continue commercial expansion when support capacity is healthy. Choose billing when pricing and contract blockers dominate. Keep hardware as a separate专项 until venue networks, device operations, on-site support, and privacy notices are ready.
