# ADR-002: On-Device PDF via HTML Template and Expo Print

* **Status:** Accepted
* **Date:** 2026-06
* **Owners:** Clean Up - Give Back project team

## Context

Participants need a **formal service confirmation letter** (spec 003) with org-fixed language and Donna Adam’s signature, filled with approved hour data. Options: generate PDF on-device, or on a Firebase Cloud Function with headless Chrome/pdf-lib.

The letter template is updated infrequently, bundled with the app, and must render consistently for print/submission to courts and schools.

## Options Considered

### Option 1: Server-side PDF (Cloud Function + Puppeteer or pdf-lib)

* **Pros:** Identical output across platforms; template updates without app release if stored remotely.
* **Cons:** Backend cost, latency, offline unusable, more infrastructure.

### Option 2: On-device HTML template → PDF (`expo-print`)

* **Pros:** Works offline after data sync; no PDF server; template in `assets/brand/letter/` under version control; fits Expo stack.
* **Cons:** Layout QA on iOS and Android; font embedding requires care.

### Option 3: Pre-filled PDF form fields (pdf-lib)

* **Pros:** Pixel-perfect if org supplies PDF.
* **Cons:** Hard for org to edit; awkward in RN; poor fit for HTML letter with signature image.

## Decision

**We will generate confirmation letters on-device using an HTML letter template in `assets/brand/letter/`, merged with approved session/profile data, converted to PDF via `expo-print` (`Print.printToFileAsync`), then shared with `expo-sharing`.**

## Consequences

* Add dependencies: `expo-print`, `expo-sharing` (and possibly `expo-file-system`) at Phase 4.
* Letter template changes ship with app updates unless we later add remote template fetch (out of scope for v1).
* QA must verify PDF on iOS and Android print preview.

## Revisit

If courts reject mobile-generated PDFs or org requires centralized letter control, consider server generation or signed PDFs.

## References

* [spec 003](../specs/003-service-confirmation-letter.md)
* [assets/brand/letter/README.md](../../assets/brand/letter/README.md)
