# Vendor / Supplier Dashboard: Fact Sheet

**Page:** `/dashboard` (titled "My Dashboard")  |  **Role in system:** `vendor`  |  **Test login:** vendor@zimhvacregistry.org

## Purpose
Gives refrigerant suppliers one place to reorder gas, submit compliance certificates, and see the value of their logged transactions, with HEVACRAZ and NOU (National Ozone Unit) review built in.

## Who it's for
Registered refrigerant distributors and suppliers. Vendors join by invitation or the supplier registration form.

## KPI cards (top row)
| Card | What it shows | How it's counted |
|---|---|---|
| Pending Reorders | Reorders awaiting review | Reorders pending HEVACRAZ or NOU review |
| Approved Volume | Total kg approved | Sum of quantities on approved reorders; subnote shows the count |
| Compliance Certificates | Approved certificates | Approved compliance applications; subnote shows how many are pending |
| Ledger Value | Value of logged transactions | Sum of ledger transaction values (USD) returned for this vendor |

## Quick actions
- **Reorder Gas**: submit a new refrigerant reorder
- **Compliance**: distribution and NOU reporting certificates
- **Verify Buyer**: confirm technician registration before a sale
- **Rewards**: vendor rewards and coverage

## Dashboard panels
- **Recent Reorders**: latest reorders with gas type and quantity
- **Compliance Certificates**: recent supplier compliance applications by certificate type

## Menu items available
Dashboard, Refrigerant Catalogue, Cylinder Registry, Import/Export Permits, Reclamation, Rewards, Supplier Compliance, Supply Reports, Vendor Reorder, Verify Buyer, Certificate Verification.

## Key tools
- **Vendor Reorder** (`/suppliers/reorder`): vendor-only
- **Verify Buyer** (`/suppliers/verify-buyer`): vendor-only; checks a buyer is a registered technician
- **Supplier Compliance Hub**: summary of Submitted / Under Review / Approved applications and a submission form
- **Supply Reporting** (`/suppliers`): vendor view of supply reports

## Notes for the fact sheet
- Reorders go through two review stages: HEVACRAZ first, then NOU.
- Vendors cannot see technician, course or admin pages.
