# Backend spec: Privacy and data rights

**Date:** 2026-06-30  
**Status:** Draft — engineering requirements  
**Parent:** [privacy-and-data-protection.md](../../compliance/privacy-and-data-protection.md)  
**ADR:** [ADR-003](../../adr/ADR-003-minor-data-protection-baseline.md)

## Overview

Supabase (Postgres, Auth, Storage) must support privacy compliance from day one: minor protection flags, user data rights, secure storage, retention, and cascade deletion.

## Acceptance criteria

### AC-1: Profile privacy fields

- [ ] `profiles` table includes: `date_of_birth_month`, `date_of_birth_year`, `age_verified_at`, `parental_consent_status` (enum: `not_required`, `pending`, `verified`, `denied`), `privacy_tier` (enum: `child_blocked`, `teen`, `adult`)
- [ ] Under-13 users with `parental_consent_status != verified` cannot start sessions or upload photos (enforced server-side)

### AC-2: Row-level security

- [ ] Users can read/write only their own profile, sessions, and evidence
- [ ] Admin role can read submissions for approval; access logged
- [ ] Storage buckets: user-scoped paths; signed URLs with short TTL for photos

### AC-3: Cascade deletion

- [ ] `DELETE /api/users/me` or equivalent triggers:
  - Supabase Auth user deletion
  - Profile row deletion
  - Session rows deletion
  - Storage objects deletion (photos, GPS artifacts)
- [ ] Court-ordered retention exception: flagged records retained per legal schedule; user notified in delete flow

### AC-4: Data export (portability)

- [ ] Endpoint returns user profile, sessions, and metadata in JSON (photos as signed URLs or separate download)
- [ ] Aligns with `export-service-record` and `privacy-rights-request` frontend flows

### AC-5: Retention jobs

- [ ] Scheduled job purges GPS path points after verification window (default: session verified + 90 days — counsel to finalize)
- [ ] Soft-delete grace period: 30 days before hard purge of deleted accounts

### AC-6: Parental consent

- [ ] Store parent email, consent method, `verified_at` timestamp
- [ ] Webhook endpoint for third-party COPPA verification provider (provider TBD)
- [ ] No camera/GPS API access until `parental_consent_status = verified` for under-13

### AC-7: App Store age signals

- [ ] Accept ephemeral age signal from client; apply restrictions in session
- [ ] **Do not persist** raw App Store age-verification payload to database
- [ ] Log enforcement action only (e.g., `age_signal_enforced_at`)

### AC-8: Audit logging

- [ ] Log admin access to user evidence
- [ ] Log data-rights requests (access, deletion) with timestamp and outcome

### AC-9: Third-party DPAs

- [ ] Supabase, Stripe, Google Maps DPAs executed before production
- [ ] Documented in [accounts-and-access.md](../../accounts-and-access.md)

## Schema sketch

```sql
-- profiles extension (additive to planned schema)
alter table profiles add column date_of_birth_month smallint;
alter table profiles add column date_of_birth_year smallint;
alter table profiles add column age_verified_at timestamptz;
alter table profiles add column parental_consent_status text
  check (parental_consent_status in ('not_required','pending','verified','denied'));
alter table profiles add column privacy_tier text
  check (privacy_tier in ('child_blocked','teen','adult'));
alter table profiles add column parent_email text;
alter table profiles add column parental_consent_verified_at timestamptz;
```

## API endpoints (planned)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/privacy/rights-request` | Submit access/deletion request |
| GET | `/privacy/export` | Full data export (CCPA) |
| DELETE | `/users/me` | Account deletion with cascade |
| POST | `/parental-consent/notice` | Send parent notice email |
| POST | `/parental-consent/verify` | Complete verification |

## Security

- Passwords: Supabase Auth defaults (min length, breach check if available)
- Admin dashboard: separate auth; MFA recommended
- Secrets: environment variables only; never in repo

## Out of scope (this spec)

- Final legal retention periods
- COPPA verification vendor selection
- Admin UI implementation
