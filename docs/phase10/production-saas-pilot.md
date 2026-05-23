# 观相镜 Phase 10: Production SaaS Controlled Pilot v0.1

## Scope

Phase 10 turns the Phase 9 SaaS baseline into a controlled production pilot for 1-2 B-side clients. The H5 front end remains Vite + React + TypeScript, and the backend model keeps TypeScript contracts while adding a PostgreSQL-compatible persistence boundary.

This phase does not add public signup, billing, mini programs, printer, NFC, large-screen, ticketing, or hardware SDK integration. No printer, NFC, large-screen, ticketing, or hardware SDK integration is part of this release.

## Contracts

- `PilotTenant v0.1`: client name, pilot status, pilot window, enabled campaigns, operator contact, and privacy owner.
- `SaasEnvironment v0.1`: staging/pilot release channel, database mode, snapshot source, and metrics mode.
- `PilotRelease v0.1`: tenant, campaign, snapshot, status, releaser, release time, and rollback target.
- `ProductionAuditPolicy v0.1`: required audited actions, retention, hash-only fields, and export permission.
- `PrivacyScanResult v0.1`: target, forbidden fields, pass/fail, and scan timestamp.
- `PilotMetricsSummary v0.1`: anonymous completion, manual, action, poster, and negative feedback metrics.
- `Phase10PilotReport v0.1`: tenant count, pilot releases, rollback drill, privacy check, audit check, customer feedback, and `go_no_go_decision`.

## Runtime Rules

- H5 can read only a pilot/published snapshot. Draft and review states stay invisible to the public front end.
- `paused` releases enter safe fallback and cannot serve a card pool.
- Rollback must point to a previous stable snapshot and must write a hash-only audit record.
- Blocklist, release gate changes, campaign status updates, publish, export, and rollback are audited.
- Metrics stay anonymous and exclude images, videos, keypoint arrays, face templates, user IDs, names, phone numbers, and device fingerprints.

## PostgreSQL-compatible Boundary

The Phase 10 schema preview includes:

- `pilot_tenants`
- `saas_environments`
- `pilot_releases`
- `production_audit_policies`
- `privacy_scan_results`
- `pilot_metrics_summaries`

If a real managed database is not ready, the local adapter must still run the same seed, migration, privacy scan, release, rollback, and report tests.

## Pilot Acceptance

- 1 internal staging run and 1 controlled client demonstration are supported.
- Permission checks and audit logs pass for card blocklist, release gate, campaign status, publish, export, and rollback.
- Privacy scans pass for snapshots, audits, releases, and metrics fixtures.
- H5 can complete the manual draw and result flow from the active pilot snapshot.
- Rollback drill passes before any customer pilot is considered ready.
