# Contractor Dashboard: Fact Sheet

**Page:** `/dashboard` (titled "My Dashboard")  |  **Role in system:** `contractor`  |  **Test login:** contractor@zimhvacregistry.org

> **Status: pending deploy.** Contractors get the full technician toolset in the code change on branch `contractor-tool-access` (not yet pushed or deployed). Until it is deployed, the live site still shows the old placeholder dashboard and a two-item menu. Publish this sheet only after deployment.

## Purpose
Gives trade contractors the same day-to-day tools as technicians (jobs, installations, refrigerant logs, COC requests, sizing and learning), plus onboarding for their business details.

## Who it's for
Trade contractors (installation, ductwork, electrical, piping/brazing, insulation, general contracting). Contractors are invitation-only: an admin invites them by email, they set a password, then complete the onboarding form.

## Dashboard: same as the Technician dashboard
KPI cards, quick actions and panels are identical to the technician dashboard; see [technician.md](technician.md).

| Card | What it shows |
|---|---|
| Jobs Completed | Planner jobs completed in the selected range |
| Pending COCs | Submitted COC requests (approved count as subnote) |
| Refrigerant Recovered | kg recovered from the latest 50 gas-log entries |
| Certifications | Valid plus expiring certificates |

Quick actions: Field Operations, Field Toolkit, Jobs & Logs, Certifications. Panels: Upcoming Schedule, Certifications, Refrigerant Activity.

## Menu items available (after deploy)
Dashboard, Learning Hub, Safety Center, Field Operations, Field Toolkit, WhatGas + Risk Engine, Sizing Tool, Refrigerant Catalogue, Cylinder Registry, Reclamation, Recycling, Certification, Rewards, Certificate Verification, and the Emergency Mode button.

## Contractor-only page
**Contractor onboarding** (`/contractor-onboarding`) collects:
- Company name, contact name, phone (required)
- Trade specialization: Installation, Ductwork Fabrication, Electrical, Piping / Brazing, Insulation, General Contracting, Other
- Years in operation, team size, safety certification (Yes / No / In progress)
- Services offered: New Installation, Retrofit, Maintenance & Servicing, Emergency Repairs, Refrigerant Recovery, Ductwork, Electrical, Consulting
- Biggest challenge (free text)

Admins review these under Admin → Contractors (`/admin/contractors`).

## How it differs from a Technician
- Contractors are a business account; technicians are individuals in the Technician Registry.
- Contractors join by invitation only; technicians apply and are approved.
- Contractors do not appear in the Technician Registry and have no technician number or QR credential.
- Their jobs, logs and COC requests are saved under their own login, so they are not mixed with a technician's records.

## Notes for the fact sheet
- Contractors still cannot open supplier, course-management or admin pages.
- Whether a contractor's COC requests should carry the same authority as a registered technician's is an open policy question for the admin team.
