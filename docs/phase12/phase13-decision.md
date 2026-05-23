# Phase 13 Decision Criteria

Phase 13 should be chosen only after Phase 12 proves commercial expansion can be repeated across 3-5 manually admitted customers without privacy, support, or tenant-isolation regressions.

## Go Signals

- `go_no_go_decision` is `go` in `Phase12ExpansionReport`.
- commercial expansion has at least three active customers with approved SLA policies and no tenant isolation failures.
- Every active tenant has a privacy-clean customer report, audit summary, export package, and customer success review.
- Support runbooks meet the response target and every closed incident has a review record.
- H5 continues to read only active commercial-approved published snapshots.

## Phase 13 Options

- Expand commercial customer scale if support load, privacy scans, and customer reports stay stable.
- Add billing and contract modules if commercial delivery is repeatable and customer scope is stable.
- Start a hardware专项 only if SaaS governance remains stable and a customer has a concrete venue requirement.

## Hold Signals

- Any raw face data, user identity, phone number, device fingerprint, or biometric field appears in reports, exports, metrics, audit, snapshots, or support records.
- A customer can read or operate another tenant's activity, snapshot, export package, metrics, audit, support record, or customer report.
- SLA response misses become frequent enough that manual operations cannot scale.
- Customers request self-service signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK before governance is ready.

## Recommendation

Default Phase 13 direction remains commercial expansion unless support burden or customer contracts require billing first. Hardware should stay a separate专项 because it adds venue network, device operations, incident response, and privacy notice complexity.
