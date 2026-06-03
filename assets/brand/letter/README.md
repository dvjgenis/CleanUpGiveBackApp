# Service confirmation letter assets

Official **letter of confirmation** masters for PDF export (spec 003). Fixed boilerplate + signature; the app only fills merge fields.

## Required files (from organization)

| File | Description |
|------|-------------|
| `letter-template.html` | HTML with placeholders: `{{legalName}}`, `{{email}}`, `{{participantId}}`, `{{creditingOrganization}}`, `{{totalApprovedHours}}`, `{{serviceDateRange}}`, `{{letterDate}}`, etc. |
| `signature-donna-adam.png` | Donna Adam signature (transparent PNG, ~300 DPI print width) |
| `letterhead-logo.png` | Optional logo for letter header |

## Placeholder contract

Document every `{{field}}` in the HTML comment at the top of `letter-template.html`. Must match [spec 003](../../docs/specs/003-service-confirmation-letter.md).

**Do not** allow the app to edit fixed paragraphs or replace the signature with user input.

## Styling

Follow [docs/brand.md](../../docs/brand.md):

- Forest Green `#009540` for accents
- Sanchez (headings) / Noto Sans (body) — use web-safe fallbacks in HTML if custom fonts not embedded
- Print margins suitable for US Letter (8.5×11")

## Sample template structure

Until the org delivers final copy, use `letter-template.sample.html` as a scaffold (placeholder lorem only — replace before production).

## Integration

1. Load HTML template from bundle (`expo-asset` / `require`).
2. Replace merge fields from Firestore profile + approved sessions.
3. Embed signature via `<img src="...">` (base64 or file URI).
4. `expo-print` → PDF → share sheet.

See [ADR-002](../../docs/adr/ADR-002-on-device-pdf-via-expo-print.md).
