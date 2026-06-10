# Context: components

Shared UI components in `frontend/src/components/`.

## Inventory

| Component | File | Role |
|-----------|------|------|
| ThemedText | `themed-text.tsx` | Theme-aware text |
| ThemedView | `themed-view.tsx` | Theme-aware container |
| ExternalLink | `external-link.tsx` | Opens URLs in in-app browser |
| HintRow | `hint-row.tsx` | Hint / tip row |
| WebBadge | `web-badge.tsx` | Web-only badge |
| AnimatedIcon | `animated-icon.web.tsx` | Web animated icon |

## Patterns

- Use `useColorScheme` / theme constants from `frontend/src/constants/theme.ts`
- Prefer `ThemedView` + `ThemedText` over raw `View`/`Text` for light/dark support

## Policies

- Follow [brand.md](../brand.md) for colors and fonts
- New shared UI goes here; screen-specific UI stays in route files or `frontend/prototype/screens/`
