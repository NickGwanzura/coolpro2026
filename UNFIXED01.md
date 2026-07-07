# UNFIXED01 — Known Gaps and Unfinished Work

_Snapshot as of 2026-07-03. This reflects what's actually incomplete after a long series of
production-hardening passes this session — not a wishlist, a punch list._

## Not built yet

- **No automated test suite.** Flagged in the original production-readiness audit at the start
  of this workstream; never built. Everything since has been verified via `tsc --noEmit`,
  `eslint`, `next build`, and manual DB/API checks — not unit or integration tests.
- **No scheduler wired to the WhatGas cron sync.** `CRON_SECRET` is set on Railway and
  `/api/cron/whatgas-sync` is fully built and working, but nothing calls it on a schedule. The
  refrigerant catalogue only refreshes when an admin clicks "Sync now" in `/admin/refrigerants`,
  or lazily per-record via the 30-day on-demand detail cache. Needs an external scheduler
  (GitHub Actions cron, cron-job.org, or similar) pointed at that endpoint.
- **No self-service password reset/change flow.** Relevant now that real accounts with real
  passwords exist (self-signup, invites, seeded admin). Currently the only way to change a
  password is a manual DB update.
- **Gemini Live API (Phase 2 voice) not started.** The voice assistant currently uses Gemini
  2.5 Flash over text (browser STT → Gemini → browser TTS). True realtime/interruptible native
  audio was scoped as Phase 2 and deliberately deferred pending a cost/connectivity tradeoff
  decision (Live API bills per second of audio and degrades worse on patchy field connectivity
  than the current text round-trip + graceful fallback).
- **R2 course-material uploads never exercised end-to-end.** Code (`lib/server/r2.ts`, the
  upload/download-url routes, `LMS.tsx`) and credentials are both in place, but no actual upload
  has been tested against the real bucket.

## Never actually verified in a browser

Every fix this session was confirmed via build/lint/typecheck/compiled-output inspection only —
no browser or screenshot tool was available in this environment. Worth a manual click-through
of, at minimum:
- Invite flow end-to-end (`/admin/invites` → email or copied link → `/accept-invite` → login)
- `/admin/users` role/status editing
- JobPlanner's new free-text client fields (replaced a hardcoded fake-client dropdown)
- COC request flow (`/jobs/request-coc` → `/admin/coc-requests` → approve → PDF/QR →
  `/verify-coc`)
- Refrigerant catalogue and autocomplete showing real ASHRAE safety badges
- The corner-radius/border-radius pass across buttons, cards, and modals
- The Gemini voice assistant actually answering a refrigerant safety question correctly

## Confirmed fine, not gaps

- The `ENABLE_DEMO_LOGIN` quick-login panel and the dashboard's "Demo mode" banner are both
  correctly gated (env var currently unset/disabled in production; banner only shows for rows
  explicitly flagged `isDemo: true`). Not bugs.
- No other hardcoded/mock data reachable in production as of the last full sweep (WhatGas
  refrigerant pickers, JobPlanner client list, and OCR scan history were all found and fixed
  earlier; a repeat grep found nothing further).
- No other fake `setTimeout`-only form submissions remain (the COC request flow was the one
  real instance found and fixed — it used to fake success with no backend at all).

## Known operational dependencies (not bugs, just need action from you)

- **Resend**: domain verification confirmed done; sending should work, but hasn't been tested
  with a real invite send-and-receive.
- **Cloudflare R2**: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`,
  `R2_BUCKET_NAME` (`vac`) are all set on Railway. `R2_ENDPOINT` is also set but unused by the
  code (harmless dead variable — the code derives the endpoint from `R2_ACCOUNT_ID` itself).
- **Gemini**: `GEMINI_API_KEY` is set on Railway; voice assistant is live.
