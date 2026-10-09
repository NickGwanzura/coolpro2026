# ZimHVAC Dashboard Fact Sheets

Source: the live ZimHVAC app code (`NickGwanzura/coolpro2026`, served at zimhvacregistry.org). Facts below come from the dashboard page, sidebar navigation and route-permission rules in that code. Nothing here was verified by logging in, so check screenshots against the live site before publishing.

## Roles

| Role | Sheet | Dashboard focus |
|---|---|---|
| Technician | [technician.md](technician.md) | Jobs, certificates (COC), refrigerant logs |
| Trainer / Assessor | [trainer-lecturer.md](trainer-lecturer.md) | Courses, grading, training sessions |
| Lecturer | [trainer-lecturer.md](trainer-lecturer.md) | Same dashboard as Trainer |
| Vendor / Supplier | [vendor.md](vendor.md) | Gas reorders, compliance certificates, ledger |
| Organization Admin | [org-admin.md](org-admin.md) | Registry, approvals, NOU oversight, reporting |
| Student | [student.md](student.md) | Courses, assessments, certificates |
| Contractor | [contractor.md](contractor.md) | Same tools as Technician (pending deploy) plus onboarding |

## How the dashboards work (shared facts)

- Everyone lands on `/dashboard` after login. The page is titled **My Dashboard** for every role except Organization Admin, which is titled **Admin Dashboard**.
- The header greets the user by name ("Welcome back, <name>") and has a date filter (Today / Week / Month). Organization Admin also gets a province filter.
- Each role sees a row of KPI cards, then a row of four Quick Action tiles, then role-specific panels.
- Each KPI card has a "How this is counted" note explaining its calculation.
- Menu items and pages are limited by role. A role that opens a page it isn't allowed to see is blocked by the app.
- Organization Admin has a longer, separate menu and a second dashboard at `/admin` (Compliance Dashboard).
- Some pages are public and need no login: certificate verification (`/verify-technician`, `/verify-coc`, `/verify-permit`).

## Shared pages by role

| Page | Technician | Trainer / Lecturer | Vendor | Org Admin | Student | Contractor |
|---|---|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Yes | Yes | Yes |
| Learning Hub | Yes | Yes | | Yes | Yes | Yes* |
| Safety Center | Yes | Yes | | Yes | Yes | Yes* |
| WhatGas + Risk Engine | Yes | Yes | | Yes | Yes | Yes* |
| Refrigerant Catalogue | Yes | Yes | Yes | Yes | Yes | Yes* |
| Certification | Yes | Yes | | Yes | Yes | Yes* |
| Rewards | Yes | | Yes | Yes | | Yes* |
| Certificate Verification | | Yes | Yes | Yes | | Yes |

\* Contractor access to technician tools is pending deploy (branch `contractor-tool-access`).
