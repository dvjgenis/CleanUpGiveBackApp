# Spec 003: Service Confirmation Letter (PDF)

**JTBD:** As a participant, I want to download a formal letter confirming my approved service hours so that I can submit it to my court, school, or employer.

**Activity:** download an approved service confirmation letter as PDF

**Scope:** Generate a single PDF from the org letter template filled with approved participant and hour data for one export request (cumulative approved hours through a chosen date — see AC-03).

---

## Context

Clean Up - Give Back provides a **fixed letter template** with formal confirmation language and **Donna Adam’s** (CEO/admin) typed name and **signature image**. The app performs **mail merge**: template body stays unchanged; placeholders are filled from the participant profile and **admin-approved** session data.

The user opens “My service” or session history after at least one **approved** session. They request a confirmation letter. The app renders HTML from the bundled template (see [ADR-002](../adr/ADR-002-on-device-pdf-via-expo-print.md)), fills merge fields, converts to PDF, and offers **share / save / print** via system sheet.

**Prerequisite:** [spec 002](./002-admin-session-approval.md) — only **approved** hours appear on the letter.

---

## Letter template (fixed — org provided)

Stored under `assets/brand/letter/`:

| Asset | Purpose |
|-------|---------|
| `letter-template.html` | HTML master with `{{placeholders}}` (or equivalent merge syntax) |
| `signature-donna-adam.png` | Donna Adam signature image (transparent PNG) |
| `letterhead-logo.png` | Optional logo for PDF header |

**Fixed content (not editable in app):** formal confirmation wording, nonprofit name/address, Donna Adam title (CEO/admin), signature block, legal disclaimers as provided by the org.

**Merge fields (filled by app):**

| Field | Source |
|-------|--------|
| Participant legal name | Profile `legalName` |
| Participant email | Profile `email` |
| Participant ID | Profile `participantId` |
| Crediting organization | Profile `creditingOrganization` (court, school, employer name) |
| Program type | Profile `programType` (display label only if needed in letter) |
| Total approved hours | Sum of credited hours for sessions with `status === approved` through export date |
| Service date range | Earliest–latest **approved** session dates included in total (or single session if scoped) |
| Letter issue date | Date PDF is generated |
| Approval reference | Optional: latest `approvedAt` or internal session IDs for org records |

Court-ordered profiles may also surface **mandated hours** and **court system** from profile fields (spec 001) if the org template includes those placeholders.

---

## Acceptance Criteria

- [ ] **AC-01:** Given the participant has **zero** approved sessions, when they attempt to download a confirmation letter, then they see a message that no verified hours are available yet (no PDF generated).
- [ ] **AC-02:** Given at least one **approved** session, when the participant taps **Download confirmation letter**, then a PDF is generated and the system share/save sheet opens.
- [ ] **AC-03:** Given approved sessions exist, when the letter is generated, then **total approved hours** on the PDF equals the sum of credited hours for all included approved sessions (per rounding rules in project context).
- [ ] **AC-04:** Given the letter is generated, then merge fields show correct **legal name**, **email**, **crediting organization**, and **participant ID** from the signed-in user’s profile.
- [ ] **AC-05:** Given the letter is generated, then fixed template text and **Donna Adam signature image** match the org master in `assets/brand/letter/` (participants cannot edit boilerplate or signature).
- [ ] **AC-06:** Given a session is `pending_review` or `rejected`, when totals are calculated, then those sessions’ hours are **excluded** from the letter.
- [ ] **AC-07:** Given PDF output, then typography and colors follow [brand.md](../brand.md) (Forest Green `#009540`, Sanchez/Noto Sans where supported in HTML print).
- [ ] **AC-08:** [Accessibility] Export action is labeled clearly; share sheet is reachable after generation; errors (e.g. print failure) show plain-language retry.
- [ ] **AC-09:** [Edge case] Given offline mode, when the user requests a letter, then behavior is defined: either block with message or use last-synced approved data only (document choice at implementation).

---

## Design Notes

- Letter is **cumulative** by default (all approved hours to date). Per-session PDF export may be a follow-up spec if courts require it.
- PDF generation approach: [ADR-002](../adr/ADR-002-on-device-pdf-via-expo-print.md) (HTML template → `expo-print`).
- Filename suggestion: `CUGB-Service-Confirmation-{participantId}-{YYYY-MM-DD}.pdf`.

---

## Out of Scope

- Admin editing letter wording in the app
- Participant editing merge fields manually
- Emailing the letter directly from the app (share sheet is sufficient for v1)
- Notarized or wet-signature workflows
- Raw GPS map or photo appendix in the PDF (separate “session log export” spec if needed later)

---

## References

- [ADR-002](../adr/ADR-002-on-device-pdf-via-expo-print.md)
- [spec 001](./001-core-auth-profiles.md) — profile fields
- [spec 002](./002-admin-session-approval.md) — approval gate
- [brand.md](../brand.md) — PDF typography/colors
- [assets/brand/letter/](../../assets/brand/letter/README.md)
- [implementation plan](../implementation-plan.md) — Phase 4
