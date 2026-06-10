# Context: sessions

Session lifecycle, photo checkpoints, and activity tracking.

## Purpose

Core domain for cleanup sessions: setup, live tracking, photo evidence, submission, and approval. Stitch screens cover `session_setup`, `live_session`, `photo_checkpoint`, `submission_confirmation`, and related flows.

## Planned responsibilities

- Create / start / end sessions
- Photo checkpoint capture, storage, and metadata
- Activity log and hour totals
- Submission and admin approval workflow
- Export service record

## Integrations

- `backend/maps/` for GPS track
- Object storage for photo evidence
- Frontend: `expo-camera`, `expo-location` (not yet configured)

## Code

- `backend/sessions/` — service scaffold (empty)
