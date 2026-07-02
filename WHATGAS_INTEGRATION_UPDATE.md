> Draft basis for an email to NOU and HEVACRAZ colleagues. Copy the section below the line into your email client, adjust the greeting/sign-off, and send.

**Suggested subject line:** HEVACRAZ Platform Update — UNEP WhatGas Now Powers Our Refrigerant Data

---

Hi all,

I wanted to flag a significant update to the HEVACRAZ compliance platform: refrigerant data across the system is now sourced directly from **UNEP OzonAction's WhatGas database**, rather than a small manually-maintained list. Below is what this changes in practice.

## Why this matters

Until now, the platform recognised only a handful of refrigerants, with GWP, ODP, and safety classifications entered by hand. That was fine for a demo, but it meant:

- Numbers feeding into NOU reporting weren't guaranteed to match UNEP's own figures.
- Technicians in the field only had safety data for 4 substances.
- There was no systematic way to flag which gases count toward Zimbabwe's Kigali Amendment HFC phase-down obligations.

The platform now syncs the full WhatGas catalogue — GWP, ODP, ASHRAE safety class, Montreal Protocol and Kigali Amendment values, HS/UN codes, and hazard data — and keeps it current automatically.

## What this brings to the project

**For the NOU:**
- **Accurate reporting inputs.** Every gas logged, installed, or traded in the system now carries UNEP-sourced GWP/ODP values, not hand-typed estimates.
- **Kigali & Montreal Protocol flags.** The system can now identify which substances are HFC-controlled under Kigali or ODS-controlled under Montreal, which is the basis for quota tracking.
- **A new Import/Export Permits module**, so permit applications, approvals, and quantities are recorded against real refrigerant identities rather than free text.
- **Cylinder, Reclamation, and Recycling registries** — new modules giving traceability from import through field use to recovery, which supports enforcement against grey-market/unauthorised imports.
- **A refrigerant analytics dashboard** — most-used, most-recovered, and HFC/HCFC/CFC/high-GWP breakdowns, pulled from real field data.

**For HEVACRAZ members and technicians:**
- **A searchable refrigerant catalogue** (by name, ASHRAE code, formula, CAS number, or trade name — e.g. searching "R22", "Freon 22", or "HCFC-22" all return the same substance).
- **Full safety detail per refrigerant** — ASHRAE safety group, flammability, toxicity, hazard symbols — not just the 4 gases previously supported. This matters as A2L/A3 (mildly flammable/flammable) alternatives become more common.
- **A proper refrigerant picker** in Job Planner and the Field Toolkit gas-logging form, replacing free-text entry, so field records are consistent and auditable.

## How it stays current

The catalogue can be refreshed on demand from an admin screen, and is designed to sync automatically (daily/weekly) once we point a scheduler at it. Every sync is logged — records created, updated, or failed — so there's a clear audit trail of when the data last changed.

## What's not done yet

Being upfront about scope:
- The first live sync against our production database hasn't run yet — that's the next step.
- Automated scheduling still needs a scheduler configured (Railway Cron or similar) pointed at the sync endpoint.
- This is infrastructure, not enforcement — its value depends on us actually using it operationally (running syncs, reviewing permits through the new module, requiring technicians to log through the new picker rather than free text).

Happy to walk anyone through the new admin screens or the refrigerant catalogue directly — just let me know.

Best,
[Your name]
