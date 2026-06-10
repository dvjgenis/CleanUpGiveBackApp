# Backend

Planned backend services for Clean Up - Give Back. Each domain has its own folder and matching docs under `docs/backend/context/`.

| Service | Folder | Domain doc |
|---------|--------|------------|
| Map & GPS tracking | [`maps/`](maps/) | [maps.md](../docs/backend/context/maps.md) |
| Payments & donations | [`payments/`](payments/) | [payments.md](../docs/backend/context/payments.md) |
| Sessions, photos, activity log | [`sessions/`](sessions/) | [sessions.md](../docs/backend/context/sessions.md) |

## Status

Scaffold only — no runtime services yet. The mobile app currently uses HTML prototype screens without live APIs.

## Next steps

1. Define API specs in `docs/backend/specs/`
2. Implement session service first (core product loop)
3. Integrate maps and payments as dependencies of sessions/shop flows
