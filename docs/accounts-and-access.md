# Organization accounts & access (no secrets)

Reference for **which systems** Clean Up - Give Back uses, **who to contact**, and **2FA procedures**. Passwords and passcodes live only in **`credentials.local.md`** at the repo root (gitignored — never commit).

---

## Where secrets live

| File | In git? | Purpose |
|------|---------|---------|
| [credentials.local.template.md](../credentials.local.template.md) | Yes | Empty fields — copy to `credentials.local.md` |
| `credentials.local.md` | **No** (gitignored) | Usernames, passwords, passcodes (local only) |
| `.env` | **No** (gitignored) | Firebase, Google Maps API keys for the app |

```bash
cp credentials.local.template.md credentials.local.md
# Fill in credentials.local.md locally. Do not commit.
```

**Policy:** Never paste passwords into specs, ADRs, context docs, or Cursor rules. Never commit `credentials.local.md` or `.env`.

---

## Services overview

| Service | Purpose | 2FA / access notes |
|---------|---------|-------------------|
| **GoDaddy** (website builder) | Org website | Text verification — **text Donna immediately** when a code is sent |
| **Stripe** | Org payments (legacy; app uses store pricing per ADR-001) | 6-digit passcode on file; **confirm Donna is available** before triggering new SMS codes |
| **Apple** (Apple Pay / developer) | Apple services | Security questions on file — see local credentials file |
| **Google** (Google Pay / Gmail) | Google services | See local credentials file |

---

## Key contacts

### David Ritchie — Director of Operations

- **Email:** davidritchie@cleanupgiveback.org
- **Phone:** (847) 373-6322

### Donna — Primary 2FA / account access

- **Email:** donnaadam@cleanupgiveback.org  
  (GoDaddy may use donnaadam@sbcglobal.net — see local credentials file)
- **Phone:** (847) 224-8592  
- **Role:** Main contact for **2FA codes** — notify before any login that sends SMS

---

## 2FA workflow (mandatory)

1. **Before** logging into GoDaddy, Stripe, Apple, or Google admin accounts, message Donna on (847) 224-8592.
2. Start login only when she can receive the code.
3. For GoDaddy: choose **text verification**, then tell Donna you sent it.
4. For Stripe: avoid triggering new codes unless Donna is available; use stored passcode when applicable.
5. Do not share codes in Slack, email, or git — read verbally or via agreed secure channel.

---

## App vs org credentials

| Scope | Examples | Storage |
|-------|----------|---------|
| **Mobile app (this repo)** | Firebase, Google Maps | `.env` from `.env.example` |
| **Org business accounts** | GoDaddy, Stripe, Apple, Google | `credentials.local.md` |
| **Store listing** | App Store Connect, Play Console | Add to `credentials.local.md` when provisioned |

---

## References

- [ADR-001](./adr/ADR-001-upfront-app-store-monetization.md) — app monetization (store upfront; Stripe not in-app)
- [agents.md](./agents.md) — never commit secrets
- [brand.md](./brand.md) — public-facing org identity
