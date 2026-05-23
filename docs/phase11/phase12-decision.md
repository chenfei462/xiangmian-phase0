# 观相镜 Phase 11 -> Phase 12 Decision

## Decision Frame

Phase 11 should end with a commercial hardening review. Phase 12 can move toward commercial expansion only if manually approved customers can use the SaaS workflow with clean RBAC, backup restore, privacy scans, export packages, support response, and H5 snapshot isolation.

## Go Criteria

- `go_no_go_decision=go` in `Phase11CommercialReport`.
- At least one active B-side commercial customer tenant is ready.
- Managed PostgreSQL migration and restore drill pass.
- Tenant-scoped RBAC denies viewer edits, operations publish, and cross-tenant access.
- H5 reads only commercial-approved published snapshots.
- Export packages contain no raw face data or ordinary user identity fields.

## Hold Criteria

- Any privacy scan detects image, video, keypoint, biometric template, phone, user identity, or device fingerprint fields.
- Draft, review, paused, suspended, archived, or rolled_back configuration reaches the H5 front end.
- Backup restore cannot prove checksum and snapshot consistency.
- Customer operators cannot complete blocklist, release gate, rollback, metrics, or export workflows.

## Phase 12 Options

1. commercial expansion: add more manually approved customers, stronger onboarding, support SLAs, and customer reporting.
2. billing and contract module: add non-public commercial terms, invoice/export workflow, and customer entitlement limits.
3. hardware专项: start a separate workstream for onsite mirror, printer, NFC, large screen, ticketing, network, and device巡检 after SaaS privacy and rollback controls stay stable.

## Recommendation Template

- Recommendation: commercial expansion / billing and contracts / hardware专项 / hold.
- Blocking issues: list privacy, RBAC, restore drill, H5 snapshot isolation, customer operations, and support blockers.
- Required fixes: map each blocker to owner, evidence, and due date.
- Next review: define the Phase 12 gate and success metric.
