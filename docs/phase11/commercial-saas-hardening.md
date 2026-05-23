# 观相镜 Phase 11: Commercial SaaS Hardening v0.1

## Summary

Phase 11 upgrades the Phase 10 controlled pilot into a commercial SaaS hardening release for a small number of manually approved B-side customers. The front end stays Vite + React + TypeScript H5, while the backend model adds real session boundaries, tenant-scoped RBAC, Managed PostgreSQL persistence, backup restore drills, audit export packages, and customer onboarding SOPs.

No public signup, billing, mini program, printer, NFC, large-screen, ticketing, or hardware SDK is included.

## Interfaces

- `CommercialTenant v0.1`: commercial customer workspace, service tier, campaign limit, support owner, privacy owner, and data region.
- `AdminAuthSession v0.1`: manually opened admin session with role, tenant, expiry, MFA flag, and status.
- `TenantPermissionCheck v0.1`: tenant-scoped RBAC decision for an action and target.
- `ManagedDatabaseStatus v0.1`: Managed PostgreSQL migration, backup, and restore drill status.
- `CustomerOnboardingChecklist v0.1`: customer readiness items, evidence, owner role, and completion state.
- `CommercialExportPackage v0.1`: snapshot, anonymous metrics, audit export, and privacy scan references.
- `SupportIncident v0.1`: customer support and incident response record.
- `Phase11CommercialReport v0.1`: migration, RBAC, backup restore, privacy, customer readiness, and Go/No-Go.

## Runtime Rules

- H5 reads only a commercial-approved published snapshot.
- Draft, review, paused, suspended, archived, or rolled_back states cannot be served to the front end.
- Viewer sessions are read-only. Operations can block cards but cannot publish. Engineering can rollback. Legal and compliance can block release gates.
- Cross-tenant access is denied even when the admin has an active session in another tenant.
- Commercial export packages contain only snapshot IDs, anonymous metrics IDs, audit export IDs, privacy scan IDs, and timestamps.
- Privacy scans reject raw images, videos, face keypoints, biometric templates, ordinary user identity fields, phone numbers, and device fingerprints.

## Persistence Boundary

The Phase 11 Managed PostgreSQL-compatible schema includes:

- `commercial_tenants`
- `admin_auth_sessions`
- `tenant_permission_checks`
- `managed_database_statuses`
- `customer_onboarding_checklists`
- `commercial_export_packages`
- `support_incidents`

If a managed database is unavailable, the local adapter must still pass migration, backup restore, RBAC, privacy, export, and H5 snapshot tests.

## Acceptance

- One internal commercial staging tenant and one active B-side customer tenant are present.
- Commercial snapshot access works for active tenants only.
- Backup and restore drill status is passing.
- Customer onboarding and support SOP evidence is complete.
- Phase 12 decision can choose commercial expansion, billing/contract work, or hardware专项 based on measured readiness.
