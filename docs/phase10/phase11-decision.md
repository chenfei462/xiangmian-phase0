# 观相镜 Phase 10 -> Phase 11 Decision

## Decision Frame

Phase 10 should end with a controlled SaaS pilot review. Phase 11 can move toward commercialization only if the pilot proves that customer operations can configure, release, pause, rollback, inspect anonymous metrics, and complete a review without breaking privacy or content safety.

## Go Criteria

- `go_no_go_decision=go` in `Phase10PilotReport`.
- Pilot tenant count is 1-2 customer spaces plus internal staging.
- rollback drill passes and updates the H5 snapshot source.
- Audit check passes with hash-only records for every write operation.
- Privacy check passes for snapshots, metrics, exports, audit logs, and customer reports.
- Customer feedback confirms that the dashboard, blocklist, release gate, and pause flow are usable.

## Hold Criteria

- Any privacy scan detects raw image, video, keypoints, biometric template, ordinary user identity, phone number, or device fingerprint.
- A paused or draft/review campaign can still be consumed by H5.
- Rollback does not restore a previous stable snapshot.
- Operations can publish outside their permission scope, or viewer accounts can edit.
- Customer feedback reports unclear stop-switch, rollback, or content takedown responsibility.

## Phase 11 Options

1. SaaS commercialization: harden authentication, RBAC, managed PostgreSQL, backups, customer onboarding, support SOP, and contract-ready exports.
2. Customer pilot expansion: keep the same no-self-service boundary and add 2-3 more controlled customers.
3. hardware专项: start a separate hardware workstream for onsite mirror, printer, NFC, large screen, ticketing, network, and device巡检 only after SaaS privacy and rollback controls stay stable.

## Recommendation Template

- Recommendation: SaaS commercialization / expanded pilot / hardware专项 / hold.
- Blocking issues: list privacy, permission, audit, rollback, metrics, and customer operation blockers.
- Required fixes: map each blocker to owner, evidence, and due date.
- Next review: define the next Phase 11 gate and success metric.
