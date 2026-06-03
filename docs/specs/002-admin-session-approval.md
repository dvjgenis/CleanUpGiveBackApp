# Spec 002: Admin Session Approval

**JTBD:** As nonprofit staff, I want to review completed cleanup sessions and approve or reject them so that only verified service hours can be credited and exported.

**Activity:** approve or reject a submitted cleanup session

**Scope:** Admin review of one session’s evidence and recording an approval decision in Firestore.

---

## Context

A participant has ended a cleanup session (Phase 3). The session is in `pending_review` with GPS route, timestamps, and live-capture photos attached. An admin or staff user (Donna, David, or designated reviewers) opens the review queue, inspects evidence, and approves or rejects. **Court-ordered** participants require approval before hours count toward their total. **Volunteers** may use the same flow or auto-approve per a future policy — default: same review queue unless product decides otherwise.

Approval unlocks [spec 003](./003-service-confirmation-letter.md) for that session (or contributes to a cumulative letter).

---

## Acceptance Criteria

- [ ] **AC-01:** Given the user has role `admin` or `staff`, when they open the review queue, then they see sessions with status `pending_review` (newest first or by policy).
- [ ] **AC-02:** Given a pending session, when the admin opens it, then they can view start/end time, rounded credited hours, GPS route summary/map, and attached live photos (start, interval, trash bag as applicable).
- [ ] **AC-03:** Given the admin approves a session, when they confirm, then the session status becomes `approved`, `approvedAt` and `approvedBy` are stored, and credited hours count toward the participant’s approved total.
- [ ] **AC-04:** Given the admin rejects a session, when they confirm with a reason (required text), then status becomes `rejected`, reason is stored, and hours do **not** count toward approved totals.
- [ ] **AC-05:** Given a session is not `approved`, when a participant views export options, then an official confirmation letter is **not** available (see spec 003).
- [ ] **AC-06:** Given a court-ordered participant, when their session remains pending, then the UI shows hours as “pending review” not “verified.”
- [ ] **AC-07:** [Accessibility] Approve/reject actions have clear labels; rejection reason field is required and announced to screen readers.
- [ ] **AC-08:** [Security] Only users with admin/staff role in Firestore (or custom claims) can write approval fields; participants cannot self-approve.

---

## Design Notes

- Review UI may be in-app (admin role) or a separate web tool — TBD at implementation; this spec defines data and permissions regardless of surface.
- Show participant legal name, participant ID, program type, and crediting organization on the review screen.

---

## Out of Scope

- PDF letter generation (spec 003)
- Editing session GPS/photos after submit
- Bulk approve
- Email notifications to participant on approval (follow-up)

---

## References

- [project context](../context/project.md) — court approval policy
- [spec 003](./003-service-confirmation-letter.md) — letter after approval
- [implementation plan](../implementation-plan.md) — Phase 4
