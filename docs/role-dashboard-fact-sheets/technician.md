# Technician Dashboard: Fact Sheet

**Page:** `/dashboard` (titled "My Dashboard")  |  **Role in system:** `technician`  |  **Test login:** technician@zimhvacregistry.org

## Purpose
Daily workspace for a registered HVAC-R technician: see completed jobs, track Certificate of Compliance (COC) requests, log refrigerant recovery, and keep certifications current.

## Who it's for
Registered refrigeration and air-conditioning technicians working in the field.

## KPI cards (top row)
| Card | What it shows | How it's counted |
|---|---|---|
| Jobs Completed | Planner jobs marked completed | Jobs whose scheduled date falls in the selected range (Today / Week / Month) |
| Pending COCs | COC requests awaiting review | Submitted COC requests; the approved count appears as a subnote |
| Refrigerant Recovered | Total kg recovered | Sum of recovery entries from the latest 50 gas-log records |
| Certifications | Valid plus expiring certificates | Certificates valid beyond 30 days plus those expiring within 30 days; flags "N expiring soon" |

## Quick actions
- **Field Operations**: schedule, plan and review field work
- **Field Toolkit**: installations and logs
- **Jobs & Logs**: view all records
- **Certifications**: manage COCs

## Dashboard panels
- **Upcoming Schedule**: next scheduled planner jobs, links to the Planner tab
- **Certifications**: up to 5 most recent certificate records with expiry status
- **Refrigerant Activity**: table of recent gas-log entries (client name, action, amount), links to Field Toolkit

## Menu items available
Dashboard, Learning Hub, Safety Center, Field Operations, Field Toolkit, WhatGas + Risk Engine, Sizing Tool, Refrigerant Catalogue, Cylinder Registry, Reclamation, Recycling, Certification, Rewards, plus an Emergency Mode button in the sidebar.

## Key tools
- **Field Operations**: three tabs: Schedule, Planner, Jobs & Logs
- **Job Planner** and **Request COC** (`/jobs/request-coc`): technician-only
- **Sizing Tool**: cooling-load calculator for freezers and cold rooms (C40, C60, C90, freezer room, cold room); technician-only
- **WhatGas + Risk Engine**: refrigerant lookup and risk checks

## Notes for the fact sheet
- Only technicians can use the Sizing Tool, Job Planner and Request COC.
- Technicians do not see supplier, admin or permit pages.
