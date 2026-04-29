# Payments — Integration Guide for Portal Developers

Audience: a developer on the **PesePay** (or equivalent) payment-portal side who must customise their portal to fit this app (`coolpro2026`).

This document is ground truth about **how payments currently flow in this codebase** and what the portal must do to integrate cleanly. Where something is not yet implemented in the app, it is flagged as **GAP** so you know whether the work belongs on your side, our side, or is a contract to be agreed.

---

## 1. TL;DR

- Gateway: **PesePay** (redirect / hosted-portal model). No SDK is installed in this repo.
- No webhook endpoint exists yet. Payment confirmation is currently captured by **pasting the PesePay transaction ID into a form field** after the user returns from the portal.
- Amounts are stored as **USD, 2 decimal places** (`numeric(10,2)` / `numeric(12,2)`), not cents.
- The payer is identified by a signed **session cookie** (`coolpro_session`, HMAC-SHA256). No OAuth, no Clerk, no NextAuth.
- Two payment contexts exist: **membership subscriptions** (student/professional/enterprise) and **refrigerant supplier transactions** (purchase/sale ledger, per-supplier PesePay merchant).
- Merchant IDs are **per-supplier**, captured at supplier registration — there is no single global merchant account.

---

## 2. Payment Contexts

There are two distinct flows. Your portal integration must handle both, or at minimum be aware of both.

### 2.1 Membership Subscriptions (app → platform)

Users pay the platform directly for an annual membership.

| Tier         | Price        | Entry point                                                                 |
| ------------ | ------------ | --------------------------------------------------------------------------- |
| Student      | $7 / year    | [app/(marketing)/join/student/page.tsx:78](app/(marketing)/join/student/page.tsx#L78) |
| Professional | $50 / year   | [app/(marketing)/membership/page.tsx:11](app/(marketing)/membership/page.tsx#L11)     |
| Enterprise   | Custom quote | `/contact?topic=enterprise` (sales flow, no portal)                         |

**Current state:** UI exists, CTAs route to a join/contact form. No live checkout is wired. **GAP — portal integration required.**

### 2.2 Supplier Transactions (buyer → supplier)

Refrigerant purchases/sales are logged to `supplier_ledger`. Each supplier supplies their own PesePay merchant ID at registration, and payments flow buyer → supplier's merchant account — **not to the platform**.

- Merchant registration: [components/SupplierRegistrationForm.tsx:40,64,111](components/SupplierRegistrationForm.tsx#L40) — field `pesepayMerchantId`.
- Purchase capture (technician side): [components/FieldToolkit.tsx:777-788](components/FieldToolkit.tsx#L777-L788) — technician pastes the **PesePay Transaction ID** after paying, marked *"Required for rewards"*.
- Ledger write: `POST /api/supplier-ledger` → [app/api/supplier-ledger/route.ts:64-113](app/api/supplier-ledger/route.ts#L64-L113).

---

## 3. Data Model You Must Populate

All schemas are Drizzle ORM in [db/schema/supplier-ops.ts](db/schema/supplier-ops.ts).

### 3.1 `supplier_applications`

Supplier onboarding; the portal-relevant field is:

| Column               | Type   | Notes                                                    |
| -------------------- | ------ | -------------------------------------------------------- |
| `pesepay_merchant_id`| text   | Merchant ID provided by PesePay for this supplier        |
| `status`             | enum   | `submitted` → `under-review` → `approved` \| `rejected`  |

A supplier must be `approved` before any transaction is accepted against their merchant ID. See [db/schema/supplier-ops.ts:47-70](db/schema/supplier-ops.ts#L47-L70).

### 3.2 `supplier_ledger`

One row per refrigerant transaction. See [db/schema/supplier-ops.ts:88-112](db/schema/supplier-ops.ts#L88-L112).

| Column            | Type            | Portal responsibility                                              |
| ----------------- | --------------- | ------------------------------------------------------------------ |
| `direction`       | `purchase`\|`sale` | Set by app based on viewer role                                 |
| `unit_price_usd`  | numeric(10,2)   | USD, **dollars not cents**, e.g. `25.50`                           |
| `total_value_usd` | numeric(12,2)   | USD, dollars. Must equal `quantity_kg * unit_price_usd` within 2 dp |
| `invoice_number`  | text, required  | **Use the PesePay transaction reference here**                     |
| `transaction_date`| timestamptz     | Time of successful capture                                         |
| `reference_month` | text `YYYY-MM`  | Regulatory reporting bucket                                        |
| `reported_to_nou` | boolean         | Regulatory flag, not payment state                                 |

> There is **no dedicated `payment_status` column.** A row's *presence* in `supplier_ledger` means "settled". If you need a pending state, see §7 (GAP).

### 3.3 Client-side refrigerant log

[types/index.ts:452-474](types/index.ts#L452-L474) — `RefrigerantLog.pesepayTransactionId` is a mirror of the same ID, stored in `localStorage` for the field toolkit. Keep the value identical to `supplier_ledger.invoice_number` for reconciliation.

---

## 4. Auth — Identifying the Paying User

There is **one** auth mechanism, and your portal must work with it.

### 4.1 Session cookie

- Name: `coolpro_session`
- Format: `<base64url(JSON payload)>.<base64url(HMAC-SHA256)>`
- Signing secret: env var `SESSION_SECRET` (64-char hex in `.env.local`)
- TTL: 24 hours
- Flags: `HttpOnly; SameSite=Lax; Path=/`

Implementation: [lib/server/auth.ts](lib/server/auth.ts).

### 4.2 Session payload

```ts
{
  id: string;      // user UUID
  role: 'technician' | 'trainer' | 'vendor' | 'org_admin' | 'lecturer' | 'regulator';
  email: string;
  name: string;
  region: string;
  exp: number;     // ms epoch
}
```

### 4.3 What the portal should do

- **Do not** implement your own auth. When you redirect the user back, the `coolpro_session` cookie will already be on the browser — the app reads it in the callback handler via `readSessionFromRequest(req)` at [lib/server/auth.ts:41](lib/server/auth.ts#L41).
- **Do** pass a tamper-proof correlation ID (see §5) so the callback can match your portal's transaction to the user who started it, even if the session has expired.
- **Role gating** for supplier transactions: `session.role === 'vendor'` and the vendor's `supplier_applications.status === 'approved'`.

---

## 5. Checkout Handshake (the contract you must implement)

This is the flow the portal must support. Items marked **GAP** are not yet built on the app side — we will build them to match whatever contract you agree to, so push back if any field is awkward for PesePay.

### 5.1 App → Portal (initiate)

**GAP — app-side initiator not yet implemented.** Proposed contract:

```
POST https://portal.pesepay.example/checkout
  merchantId:      <supplier pesepay_merchant_id, or platform ID for memberships>
  amount:          <decimal USD, e.g. "50.00">
  currency:        "USD"
  reference:       <app-generated UUID v4, stored server-side keyed to user>
  description:     "CoolPro Professional Membership 2026" | "Refrigerant purchase – 5kg R-410A"
  returnUrl:       https://<app-host>/api/payments/callback?ref=<reference>
  cancelUrl:       https://<app-host>/payments/cancelled?ref=<reference>
  webhookUrl:      https://<app-host>/api/payments/webhook
  customerEmail:   <session.email>
  customerName:    <session.name>
  metadata: {
    userId:   <session.id>,
    role:     <session.role>,
    context:  "membership" | "supplier_purchase" | "supplier_sale",
    tier:     "student" | "professional" | null,
    ledgerDraftId: <uuid|null>   // for supplier flows only
  }
```

The `reference` is the app's idempotency key. The portal **must** echo it back on both `returnUrl` and `webhookUrl`.

### 5.2 Portal → App (return redirect)

Redirect the browser to `returnUrl` with:

```
?ref=<original reference>
&status=success|cancelled|failed
&txnId=<PesePay transaction ID>
```

The app will render a status page; **do not rely on the redirect to mutate database state** — use the webhook for that.

### 5.3 Portal → App (webhook)

**GAP — `POST /api/payments/webhook` not yet implemented.** Proposed contract:

```
POST /api/payments/webhook
Content-Type: application/json
X-Pesepay-Signature: <HMAC-SHA256 of raw body using the shared webhook secret>

{
  "reference": "<app-generated uuid>",
  "txnId":     "<pesepay txn id>",
  "merchantId":"<merchant id used>",
  "amount":    "50.00",
  "currency":  "USD",
  "status":    "success" | "failed" | "reversed",
  "paidAt":    "2026-04-19T13:05:21Z",
  "metadata":  { ... echoed from initiate ... }
}
```

Signature requirements we'll implement on our side:

- Raw-body HMAC-SHA256 hex digest.
- Shared secret from env var `PESEPAY_WEBHOOK_SECRET` (**to be added** to `.env.local`; see §6).
- Constant-time comparison (same pattern as [lib/server/auth.ts:32](lib/server/auth.ts#L32)).
- Reject any payload older than 5 minutes (replay protection) — send a `paidAt` or include a `X-Pesepay-Timestamp` header.

On `status === 'success'`, the webhook handler will:

1. Look up the `reference` → pending checkout row.
2. For memberships: flip user subscription state (**GAP — subscription table does not yet exist**).
3. For supplier purchases: insert into `supplier_ledger` with `invoice_number = txnId`.
4. Return `200 OK` within 5 s. Non-2xx responses should trigger portal retries with exponential backoff (at least 5 retries over 24 h, please).

---

## 6. Environment Variables

Currently present in [.env.local](.env.local):

| Var              | Purpose                     |
| ---------------- | --------------------------- |
| `SESSION_SECRET` | HMAC key for session cookie |
| `DATABASE_URL`   | Neon Postgres connection    |

**To be added** as part of the portal integration — please confirm names with us before launch:

| Var                        | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `PESEPAY_BASE_URL`         | Portal base URL (prod + staging)                      |
| `PESEPAY_PLATFORM_MERCHANT`| Our merchant ID for membership payments               |
| `PESEPAY_INTEGRATION_KEY`  | API key for outbound initiate calls                   |
| `PESEPAY_WEBHOOK_SECRET`   | Shared HMAC secret for webhook signature verification |

No secret must be exposed to the client. Everything above stays server-side only.

---

## 7. State Machine & GAPs

The app today has **no explicit payment state column**. For the integration to be auditable we will need to add one of the following — your input welcome:

- Option A: a `payments` table (`reference`, `user_id`, `context`, `amount`, `currency`, `status`, `txn_id`, `created_at`, `settled_at`) that rows in `supplier_ledger` / a future `memberships` table reference.
- Option B: extend each target table with `payment_status` + `payment_ref`.

Recommended states:

```
initiated  → redirect_sent  → (callback)
                            ├→ success   (webhook confirmed)
                            ├→ cancelled (user aborted)
                            ├→ failed    (portal rejected)
                            └→ reversed  (post-success refund)
```

Refunds / reversals: **not implemented.** If PesePay supports partial refunds, we will need a reverse webhook event.

---

## 8. Currency & Amounts

- Single currency: **USD**. Do not attempt multi-currency without product sign-off.
- Storage is **decimal dollars**, not cents. When you pass amounts to/from the portal, match the schema: `"50.00"`, `"1234.56"`.
- No VAT/tax logic in the app. If PesePay adds fees, they are **deducted on the portal side** — the app records gross `total_value_usd` and is unaware of fees.
- `quantity_kg * unit_price_usd` must reconcile to `total_value_usd` within 1 cent. The app will reject mismatches on supplier ledger writes.

---

## 9. Security Requirements

- **TLS only** for all portal ↔ app traffic. No HTTP fallback.
- **Webhook signing** is mandatory (§5.3). Unsigned webhooks will 401.
- **Idempotency:** the app will dedupe by `(reference, txnId)`. The portal must accept that the webhook may be retried; the app treats it as idempotent.
- **PII minimisation:** send only `email`, `name`, and `userId`. No card data, ever — the membership FAQ at [app/(marketing)/membership/page.tsx:78](app/(marketing)/membership/page.tsx#L78) explicitly states "we never store card details".
- **Merchant ID validation:** before hitting the portal for a supplier transaction, the app will confirm `supplier_applications.status === 'approved'` and that `pesepay_merchant_id` is non-empty.

---

## 10. Testing Checklist for the Portal Developer

Before we point production traffic at you, we need green on:

- [ ] Initiate call returns a redirect URL within 2 s p95.
- [ ] `returnUrl` fires with correct `ref`, `status`, `txnId`.
- [ ] Webhook reaches our `/api/payments/webhook` with a valid `X-Pesepay-Signature`.
- [ ] Replay attack (identical webhook re-sent) results in one ledger row, not two.
- [ ] Cancelled payment: no ledger row, no subscription flip.
- [ ] Failed payment: no ledger row; user sees cancelled page; retry is possible with a **new** `reference`.
- [ ] Refund/reversal: webhook with `status: "reversed"` triggers downstream (TBD once §7 lands).
- [ ] Expired session (>24 h between initiate and return): webhook still completes using `metadata.userId`, not the cookie.

---

## 11. Files to Read First

If you're new to this repo:

1. [lib/server/auth.ts](lib/server/auth.ts) — how users are identified.
2. [db/schema/supplier-ops.ts](db/schema/supplier-ops.ts) — the only payment-adjacent schema.
3. [app/api/supplier-ledger/route.ts](app/api/supplier-ledger/route.ts) — the closest thing to a "post-payment" handler today.
4. [components/SupplierRegistrationForm.tsx](components/SupplierRegistrationForm.tsx) — where merchant IDs enter the system.
5. [components/FieldToolkit.tsx:777-788](components/FieldToolkit.tsx#L777-L788) — where transaction IDs currently enter the system (manually).

---

## 12. Open Questions for PesePay

Please confirm when you respond:

1. Does PesePay support an app-to-portal `initiate` call that returns a hosted-checkout URL, or only a client-side widget?
2. Webhook delivery guarantees — retries, ordering, max latency?
3. Refund / reversal events — what does the payload look like?
4. Are merchant IDs stable once issued, or can they rotate? (Matters for the `pesepay_merchant_id` column.)
5. Is the "manually paste transaction ID" flow in §2.2 something we should keep as a fallback, or can the webhook fully replace it?
