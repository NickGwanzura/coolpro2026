# SONNET_ALIGNMENT — Ground-Truth Orientation for This Repo

_Written 2026-07-07 from a fresh read of the actual code (not the older docs). Purpose: give a
new agent (Sonnet) an accurate mental model of the app, its dashboards, and its data flows —
including which existing docs to trust, and exactly where the in-flight refactor stands._

---

## 1. What this app is

**CoolPro / HEVACRAZ platform** — a compliance + field-operations platform for the HVAC-R
industry in Zimbabwe, jointly operated by **HEVACRAZ** (the industry association) and the
**NOU** (National Ozone Unit, Ministry of Environment). One `org_admin` role currently acts as
both authorities (see §7, gap A).

It covers: technician field tools (job planning, gas-usage logging, sizing, OCR nameplate
scanning), a refrigerant catalogue synced from the external **WhatGas** API (ASHRAE safety
classes, GWP), compliance registries (cylinders, import/export permits, reclamation, recycling),
an LMS (courses, exams, certification), supplier/vendor workflows (applications, ledger,
two-stage reorder approvals), CoC (Certificate of Conformance) issuance with QR verification,
invites/user admin, and a Gemini-powered voice assistant.

## 2. Actual tech stack (as of today's code)

| Layer | Reality |
|---|---|
| Framework | Next.js **16** App Router, React **19**, TypeScript, Tailwind **4** |
| Database | **Neon Postgres** via **Drizzle ORM** (`db/client.ts`, `db/schema/*` — 25 tables, see §5) |
| Auth | Real credentialed auth. Signed session cookie `coolpro_session` (`lib/server/auth.ts` — `signSession`/`verifySession`/`requireRole`; edge-safe parse in `lib/server/auth-edge.ts`). bcrypt passwords. Route gating in `middleware.ts` (`ROUTE_ROLE_RULES`) + per-endpoint `requireRole` in every API route. |
| Client data | **SWR hooks in `lib/api.ts`** (~80 exports) — this file is the single client-side data layer. Every DB-backed page goes `page → lib/api.ts hook → /api/* route → Drizzle → Neon`. |
| Files | Cloudflare **R2** via presigned URLs (`lib/server/r2.ts`; course materials upload/download/delete routes) |
| Email | **Resend** (`lib/server/email.ts`) — invites etc. |
| AI | Gemini 2.5 Flash text round-trip for the voice assistant (`/api/voice-assistant`, browser STT/TTS); Groq for sizing advice (`/api/sizing-advice`) |
| External sync | WhatGas refrigerant catalogue (`lib/whatgas/*`; manual "Sync now" in `/admin/refrigerants`, cron endpoint `/api/cron/whatgas-sync` built but **no scheduler calls it**) |
| Deploy | Railway (env vars live there); vercel/netlify/nixpacks configs also present |

**There is no test suite.** Verification so far = `tsc --noEmit`, `eslint`, `next build`, manual API checks.

## 3. Which existing .md files to trust

| File | Status |
|---|---|
| **`REFACTOR_PLAN.md`** | ✅ Accurate audit (2026-07-03) of 38 issues, file:line anchored. **But** a large uncommitted working-tree pass has already fixed roughly half of it — see §8 before acting on any item. |
| **`UNFIXED01.md`** | ✅ Accurate punch list of deliberately-unbuilt things (tests, cron scheduler, password reset, Gemini Live Phase 2, R2 never exercised end-to-end) and operational deps. Still current. |
| `WHATGAS_INTEGRATION_UPDATE.md`, `SYSTEMS_CAPABILITIES*.md`, `PAYMENTS.md`, `README_REGISTRY.md` | Mostly informational; spot-check before relying. |
| **`DATA_FLOWS.md`** | ❌ **Badly stale (2026-03-03).** Describes a localStorage-only mock architecture with fake demo login, "no database", "mock AI". None of that is true anymore. Its "Future Backend Architecture" section describes (roughly) what has since been **built**. Do not use it; prefer this file. Same caveat for `SITE_BLUEPRINT.md`'s data claims. |
| `lib/nav.ts.bak` | Dead artifact of the deleted `lib/nav.ts` (nav truly lives in `components/layout/Sidebar.tsx`). Safe to delete. |

## 4. Roles and dashboards

Six roles (DB enum in `db/schema/users.ts`, mirrored in `lib/roles.ts`):
`technician`, `trainer`, `lecturer`, `vendor`, `org_admin`, `student`.

Navigation = `NAV_SECTIONS` in `components/layout/Sidebar.tsx`, filtered per role.
Route access = `middleware.ts` `ROUTE_ROLE_RULES` (specific prefixes now correctly ordered
before generic ones). **These two lists plus each API route's `requireRole` must stay in
agreement — that triple is the app's whole RBAC model.**

### Dashboard surfaces

| Surface | Route | Who | Data source |
|---|---|---|---|
| Main dashboard | `/dashboard` | everyone (branches on `isAdmin = role==='org_admin'`) | **Live SWR**: `usePlannerJobs`, `useGasLogs`, `useCocRequests` (technician KPIs); `useSupplierApplications`, `useTechnicians`, `useReorders`, `useGasUsage` (admin KPIs). Formerly hardcoded — fixed in the working tree. |
| Admin hub | `/admin` | org_admin | quick links + KPIs |
| NOU Dashboard | `/nou-dashboard` (`components/NouDashboard.tsx`) | org_admin | supplier reorders (NOU stage), course approvals |
| Reporting | `/admin/reporting` | org_admin | re-fetches several datasets client-side (known smell, plan item 36) |
| Refrigerant Analytics | `/admin/refrigerant-analytics` → `/api/admin/refrigerant-analytics` → `lib/whatgas/analytics.ts` | org_admin | now aggregates gas logs, planner jobs, **and** cylinders/permits/reclamation/recycling (plan item 13 fixed in working tree) |
| Jobs & Logs | `/jobs` | technician + org_admin (admin branch now reachable — middleware fixed) | `usePlannerJobs`, `useGasLogs` |
| Trainer/Lecturer LMS | `/learn` (hub, now branches on `trainer || lecturer`), `/learn/manage` (course CRUD, R2 materials, gradebook — now in sidebar) | trainer, lecturer | `useCourses`, `useExamSubmissions` |
| Vendor panels | `/suppliers` (`SupplierManagement`, `VendorReportingPanel`), `/suppliers/reorder`, `/supplier-compliance` | vendor | supplier ledger, reorders, compliance applications |

## 5. Data model (25 Drizzle tables, `db/schema/`)

- **Identity/access**: `users` (role+status enums), `invites`, `technicians`, `technician_verifications`
- **Applications** (all follow the same pending→approve/reject shape): `student_applications`, `technician_applications`, `supplier_applications`, `supplier_compliance_applications`
- **Field ops**: `planner_jobs` (status machine: scheduled → in-progress → completed → follow-up, PATCH `/api/planner-jobs/[id]`), `gas_usage_logs`, `equipment_records`, `ocr_scans`, `coc_requests`
- **LMS**: `courses` (draft → pending_nou → approved/rejected; attachments = R2 keys in module JSON), `exam_submissions`, `trainer_certificate_requests`, `training_sessions`
- **Refrigerant compliance**: `refrigerants` + `whatgas_sync_logs` (WhatGas mirror), `cylinders`, `trade_permits`, `reclamation_records` (pending → passed/failed via `/api/reclamation/[id]`), `recycling_records` (⚠️ still no status/review workflow — plan item 22, undecided)
- **Supplier ops**: `supplier_ledger`, `supplier_reorders` (two-stage: `pending_hevacraz` → `pending_nou` → approved)

## 6. Canonical data flow (and the surviving exceptions)

**The rule:** UI page/component → SWR hook or mutation fn in `lib/api.ts` → `/api/*` route
(`requireRole` first) → Drizzle → Neon. Mutations call SWR `mutate()` to revalidate.
Public verification pages (`/verify-coc`, `/verify-technician`, `/verify-permit`) use
unauthenticated `/api/public/*` routes.

**localStorage is now only used for** (via `STORAGE_KEYS` in `lib/platformStore.ts`):
1. **FieldToolkit installations** — intentionally offline-first with a pending-sync queue
   (`fieldToolkitInstallations`, `fieldToolkitPendingSync`); gas logs from it go to the DB via
   `createGasLogs`, but installations themselves **have no DB table or API route yet**
   (plan item 15 — genuine unmigrated feature).
2. **FieldToolkit checklists** (`fieldToolkitChecklists`).
3. **`ImageAnnotationWorkbench` image records** — full base64 in localStorage, quota/data-loss
   risk (plan item 27, still open).
4. UI prefs (language, voice sessions).

`lib/platformStore.ts` also re-exports course helpers from `lib/api.ts` for
backwards-compatible imports — don't take that as a sign courses are local; they're DB-backed.

## 7. Approval/workflow map (who signs off on what)

| Flow | Submit | Review | Endpoints |
|---|---|---|---|
| Student / technician / supplier / supplier-compliance applications | public or self-serve forms | org_admin | `/api/*-applications/[id]/(approve\|reject)` |
| Course publishing | trainer/lecturer `submitCourse` (draft→pending_nou) | org_admin at `/learn/approvals` | `/api/courses/[id]/(approve\|reject)` |
| CoC requests | technician (`/jobs/request-coc`, requires job `completed`) | org_admin (`/admin/coc-requests`) → PDF + QR → `/verify-coc` | `/api/coc-requests/[id]/…` |
| Certificate requests | trainer | org_admin approve → issue | `/api/certificate-requests/[id]/(approve\|reject\|issue)` |
| Trade permits | vendor | org_admin | `/api/permits/[id]/…` |
| Reclamation batches | technician/vendor | org_admin: pending → passed/failed | `/api/reclamation/[id]` |
| Supplier reorders | vendor | **two-stage**: HEVACRAZ approve, then NOU approve | `/api/supplier-reorders/[id]/(hevacraz\|nou)-(approve\|reject)` |
| Exam grading | (no student submission UI exists — see gap C) | trainer gradebook | `/api/exam-submissions/[id]/grade` |

**Gap A (plan item 5, still open):** both reorder stages `requireRole(['org_admin'])`. There is
no NOU-vs-HEVACRAZ role split anywhere in the schema, so one admin can approve both stages.
Real separation needs a new role/permission — a product decision, don't invent it silently.

## 8. Refactor status — CRITICAL: read before touching REFACTOR_PLAN.md

There is a **large uncommitted working-tree diff** (~28 files, +981/−489) that already executes
much of the plan. `git status` is not noise — it *is* the fix pass. Verify with `git diff`
before re-fixing anything.

**Already fixed in the working tree (verified in code):**
- Items **1, 2**: dashboard + jobs pages now use `usePlannerJobs`/`useGasLogs`/`useCocRequests`; hardcoded technician KPIs gone.
- Item **3**: `PATCH /api/planner-jobs/[id]` with a real status machine + `markJobComplete` in `lib/api.ts`.
- Item **4**: FieldToolkit demo-log seeding removed; logbook starts empty, writes via `createGasLogs`.
- Item **6**: reclamation review route exists (`/api/reclamation/[id]`, org_admin, pending→passed/failed).
- Items **7, 8**: "Manage Courses" in sidebar for trainer+lecturer; `lib/nav.ts` deleted; `/learn` branches on `trainer || lecturer`.
- Item **9**: middleware now grants org_admin access to `/jobs`.
- Item **11**: reporting links to `/learn/approvals`.
- Item **13**: refrigerant analytics aggregates all four compliance modules (`lib/whatgas/analytics.ts`).
- Item **17**: `/api/suppliers/approved` computes real `usagePercent`/`quotaStatus`.
- Items **19, 20, 21, 24, 25, 29**: middleware rule ordering, `createGasLogs` mutate, `.env.example` (RESEND/SITE_URL), `deleteCourseMaterial`, grouped admin sidebar, stale demo copy — all done.

**Still open (confirmed still in code today):**
- **Item 5** — NOU/HEVACRAZ authority split (gap A above). Biggest remaining Tier-1 item.
- **Item 10/12** — `/admin/technicians` and `/admin/certification-engine` are still `router.replace()` redirect stubs; three overlapping user directories remain.
- **Item 14** — exams broken both ways: `certifications/page.tsx` "Start Exam" is still a fake `setTimeout`; no student exam-submission UI, so the (real, working) trainer gradebook stays empty. *(Gap C.)*
- **Item 15** — FieldToolkit installations localStorage-only (no table/route).
- **Items 18, 22, 23, 26, 27** and most Tier-4 polish (16 appears fixed — the synthetic vendor-sale write is gone from `SupplierManagement.tsx`, but confirm).
- Everything in `UNFIXED01.md`: no tests, no cron scheduler hitting `/api/cron/whatgas-sync`, no password reset, R2 upload never exercised for real, **nothing this pass has been verified in a browser**.

**New issue spotted while writing this doc:** `Sidebar.tsx` has a duplicate "Supply Reports"
entry (`/suppliers` listed twice, lines ~100 and ~102 — vendor sees it twice). Dedupe to one
entry with roles `['vendor', 'org_admin']`.

## 9. How to work in this codebase (conventions)

1. **Never add a new localStorage-backed feature.** New data = Drizzle table in `db/schema/` +
   `/api` route with `requireRole` first + SWR hook/mutation in `lib/api.ts` (with `mutate()`
   revalidation) + page consuming the hook. Copy an existing module (cylinders is a clean
   reference) end to end.
2. **RBAC changes touch three places**: `middleware.ts` rules (specific prefixes before generic),
   `Sidebar.tsx` `roles` arrays, and the API route's `requireRole`. Change all three together.
3. **Roles come from the DB enum** (`db/schema/users.ts` → `lib/roles.ts`). Don't hardcode role
   string lists elsewhere.
4. **Statuses are explicit state machines** in the PATCH routes (see planner-jobs, reclamation).
   Follow that pattern for new workflows.
5. **The uncommitted diff is unverified in a browser.** Before building on top of it, run
   `npm run build` + a manual click-through of the flows listed in `UNFIXED01.md` §"Never
   actually verified". Consider committing the current pass first so future diffs are legible.
6. Env vars live on Railway; `.env.example` is now the authoritative variable list. `CRON_SECRET`
   guards the WhatGas cron route; `ENABLE_DEMO_LOGIN` is off in production.

## 10. Sensible next-work order

1. Commit (or review-then-commit) the in-flight refactor pass — it's coherent and mostly Tier 1/2.
2. Browser-verify the UNFIXED01 checklist flows (invite → accept, CoC end-to-end, course
   material upload against real R2, voice assistant answer).
3. Decide + implement the NOU/HEVACRAZ authority split (item 5) — needs a product call on
   whether it's a new role, a sub-permission on org_admin, or per-user flags.
4. Kill the two redirect stubs and collapse the user directories (items 10/12).
5. Exams: either build the student submission flow or hide both dead halves (item 14).
6. Migrate FieldToolkit installations to the DB, keeping the offline pending-sync queue as a
   write-through cache (item 15) — same treatment for ImageAnnotationWorkbench images → R2 (27).
7. Stand up a scheduler for `/api/cron/whatgas-sync`, a password-reset flow, and a minimal test
   suite around auth + the approval state machines.
