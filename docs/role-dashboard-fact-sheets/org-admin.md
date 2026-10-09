# Organization Admin Dashboard: Fact Sheet

**Pages:** `/dashboard` ("Admin Dashboard") and `/admin` (Compliance Dashboard)  |  **Role in system:** `org_admin`  |  **Test login:** orgadmin@zimhvacregistry.org

## Purpose
Program-wide oversight: monitor the technician registry, approve courses, certificates, suppliers and reorders, track accidents and refrigerant volumes, and manage users.

## Who it's for
HEVACRAZ program administrators. This is the highest role in the app; there is no separate super-admin.

## Admin Dashboard (`/dashboard`)
Header has a date filter (Today / Week / Month) and a **province filter**.

| Card | What it shows | How it's counted |
|---|---|---|
| Active Techs | Active technicians | Technicians with status active, after the province filter |
| Total Technicians | Registry size | All technicians after the province filter, any status |
| Pending Reorder Reviews | Reorders to review | Reorders awaiting HEVACRAZ or NOU review |
| Regions | Provinces covered | Provinces with registered technicians |
| Refrigerant Volume | kg reordered | Reorder quantities created in the selected window (not confirmed consumption) |

**Quick actions:** NOU Dashboard, COC Requests, Supplier Management, Safety Oversight (accidents).

## Compliance Dashboard (`/admin`)
Titled "Admin Dashboard: Program administration and compliance monitoring", with an **Invite users** button. Shows Total GWP Impact, Approved Volume, Active Technicians, Natural Gas Transition, and a Refrigerant Phasedown Progress chart.

## NOU Dashboard (`/nou-dashboard`)
Admin-only. Includes KPIs for Registered Technicians, Purchased Kg, Recovered Kg and Emissions Avoided (CO2-eq). Panels: Pending NOU Actions, Recent System Activity, Refrigerant Volumes Approved YTD, Refrigerant Breakdown, Monthly Purchase vs Usage, Supplier Review & Network, Discrepancy Alerts, Vendor-linked refrigerant logs, Supplier compliance certificates, Grey Market Detection, Regional Snapshot.

## Menu (grouped)
- **Home:** Dashboard, Compliance Dashboard
- **Operations:** Learning Hub, Manage Courses, Field Operations, Field Toolkit, Safety Center
- **Tools:** WhatGas + Risk Engine, Sizing Tool
- **Refrigerants:** Catalogue, Cylinder Registry, Import/Export Permits, Reclamation, Recycling
- **Suppliers:** Supplier Management, Invite Supplier, Supplier Compliance, Vendor Reorder, Verify Buyer, Supplier Approvals
- **Registry & People:** Technician Registry, Certificate Verification, Certifications, Rewards, System Users, Applications, Applicants, Memberships, Email Log, Contractors, Invites
- **Reviews & Data:** NOU Dashboard, Course Approvals, COC Requests, Accidents Module, Reporting, Refrigerant Analytics, Refrigerants (WhatGas Sync)

## Approvals this role owns
Course approvals, certificate (COC) approvals, supplier approvals, applications and invites, reorder reviews (with NOU).

## Notes for the fact sheet
- The Admin sidebar is separate from every other role's sidebar.
- Only Admin can open System Users, Applications, Invites, Memberships, Email Log, Reporting, Accidents, Contractors, Students, Lecturers and Certification Engine.
- Emergency Mode is hidden for this role.
