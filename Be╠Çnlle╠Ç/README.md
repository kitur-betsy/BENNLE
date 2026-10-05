# Benlle storefront + owner portal

Shoppers need no account: they browse, check out as guests and track an order at `/track` with the order number and email. Only the owner signs in, at `/admin/login` (link in the footer).

React + Vite storefront with a separate owner portal at `/admin`, backed by Supabase (database, auth, image storage).

## One-time Supabase setup

1. **Create the tables.** Supabase → *SQL Editor* → New query → paste all of `supabase/setup.sql` → *Run*.
   It creates the tables, row-level security, checkout/subscribe functions and the `images` storage bucket, and seeds the
   current products, journal, homepage sections and settings. It is safe to run again.
2. **Allow short admin passwords (only if you want one under 6 characters).**
   Authentication → *Sign In / Providers* → Email → *Minimum password length*. Supabase will not accept a password
   shorter than its minimum, so lower it there first. A short password is easy to guess; a longer one is strongly advised.
3. **Turn off public sign-ups.** Authentication → *Sign In / Providers* → switch off *Allow new users to sign up*. Shoppers do not have accounts (they check out as guests and track orders by order number + email), so the only account is the owner's.
4. **Create the owner account.** Authentication → *Users* → *Add user* → email `Betsykitur@gmail.com`, choose a password,
   tick *Auto Confirm User*. The database marks this email as the admin automatically. Only a **confirmed** account
   with that email gets admin access.
5. **Password-reset links.** Authentication → *URL Configuration*: set *Site URL* to your site, and add
   `https://YOUR-SITE/admin/reset-password` (and `http://localhost:5173/admin/reset-password`) to *Redirect URLs*.
6. Keep **Confirm email** switched on (Authentication → Providers → Email). It is what stops anyone else claiming the owner address.

## Run

```
npm install
npm run dev
```

`.env.local` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (`NEXT_PUBLIC_*` names also work).
Only the **publishable** key belongs in this app. Never add a secret / service-role key here.

Until `setup.sql` has been run, the app shows demo data and the admin displays a banner saying so.
Set `VITE_USE_MOCK=true` to force offline demo data (in development the demo admin is `Betsykitur@gmail.com` / `2020`;
that password is stripped from production builds).

## How it fits together

| Area | Where |
|---|---|
| Schema, security rules, seed | `supabase/schema.sql`, `supabase/seed.sql`, combined in `supabase/setup.sql` (regenerate with `node supabase/generate-seed.mjs`) |
| Data access | `src/api/services.js` (Supabase, with offline fallback) |
| Sessions / tokens | `src/api/session.js`, `src/store/auth.js` |
| Owner portal | `src/admin/*` (own shell, guarded by `AdminRoute`) |

Security is enforced by the database: orders are created only through the `place_order` function (prices, stock and
shipping are computed server-side), customers can read only their own orders and addresses, and everything in the
portal is restricted to the confirmed admin account.

## M-Pesa setup

Checkout takes **M-Pesa STK Push** payments (Lipa Na M-Pesa Online). The customer gets a PIN prompt on their phone, the order is
marked paid when Safaricom confirms, and every attempt is stored in `payments` / `payment_events`. The store currency is **KES**
(M-Pesa only charges whole shillings).

How it works: the browser sends only product ids, quantities and a phone number to `stk-push`. The server prices the order from the
`products` table, creates it as `awaiting_payment`, and asks Safaricom to prompt the phone. Safaricom calls `payment-callback`; one
database function (`apply_payment_result`) then marks the payment and order paid and decrements stock in a single transaction.
`payment-status` is the fallback that asks Safaricom directly if a callback is slow or lost. The checkout modal hears about the result
over a Realtime broadcast channel (one per payment, so guests are covered) and falls back to polling after 25 seconds.

### 1. Set the secrets

All M-Pesa credentials live only in Supabase secrets, never in `VITE_*` variables or the repo. Generate the callback secret first:

```
openssl rand -hex 32
```

```
supabase secrets set \
  MPESA_ENV=sandbox \
  MPESA_BASE_URL=https://sandbox.safaricom.co.ke \
  MPESA_CONSUMER_KEY=<from developer.safaricom.co.ke → your app> \
  MPESA_CONSUMER_SECRET=<from the same page> \
  MPESA_SHORTCODE=174379 \
  MPESA_PASSKEY=<Safaricom's public sandbox passkey> \
  MPESA_TRANSACTION_TYPE=CustomerPayBillOnline \
  MPESA_CALLBACK_SECRET=<output of openssl rand -hex 32>
```

A Daraja sandbox app shows Passkey and Short Code as N/A. That is normal: every sandbox app uses the public test shortcode `174379`
and the sandbox passkey from Safaricom's docs (Lipa Na M-Pesa Online → Test credentials). See `supabase/functions/.env.example`.

### 2. Run the migration

Supabase → SQL Editor → paste `supabase/migrations/20261002000000_mpesa_payments.sql` → Run (or `supabase db push`). It is safe to re-run.
It converts existing USD prices, shipping settings and orders to KES **once** (1 USD = 129 KES; guarded by a marker row), adds the payment
columns and the `awaiting_payment` order status, creates `payments` and `payment_events`, and closes the old `place_order()` function
so no order can be created without paying.

> If you regenerate `setup.sql` with `generate-seed.mjs` on a fresh database, run `setup.sql` first and this migration after it.
> The migration is the only place the USD → KES conversion happens.

### 3. Deploy the functions

```
supabase functions deploy stk-push --no-verify-jwt
supabase functions deploy payment-callback --no-verify-jwt
supabase functions deploy payment-status --no-verify-jwt
```

`payment-callback` must be public (Safaricom calls it); it is protected by the `?token=` secret instead. `stk-push` and `payment-status`
are also deployed with `--no-verify-jwt` because shoppers are guests and this project uses the new `sb_publishable_…` API key, which is
not a JWT and would be rejected by the platform check. Both verify the caller themselves: signed-in users and admins by their session
token, guests by the unguessable payment/order id. `stk-push` also limits how often one phone number can be prompted.

Safaricom rejects callback URLs containing `mpesa`, `m-pesa`, `safaricom`, `query`, `sql`, `exec` or `cmd`, hence the function names.

### 4. Test in sandbox

1. `npm run dev`, add a product, check out with an `07…` / `01…` number.
2. The PIN prompt should arrive within a few seconds; enter the PIN and the modal flips to **Paid** and redirects to the order page.
   (Sandbox does not move real money. If no prompt reaches a handset, use the Daraja *Lipa Na M-Pesa Online* simulator with the same shortcode.)
3. Check **Admin → Payments**: the row, its event timeline and the raw callback should be there. **Admin → Orders** shows the payment section.
4. Try: cancel on the phone (shows "You cancelled the payment", *Try again* reuses the same order), ignore the prompt (Timeout state, *check again*),
   and replay the same callback (nothing changes the second time).
5. Logs: Supabase → Edge Functions → each function → Logs. Logs never contain keys, tokens or full phone numbers.

### 5. Go-live checklist

Change **only the secrets**, no code:

- [ ] `MPESA_ENV=production`
- [ ] `MPESA_BASE_URL=https://api.safaricom.co.ke`
- [ ] Live `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` (Daraja app promoted to Go Live)
- [ ] Live `MPESA_SHORTCODE` and `MPESA_PASSKEY` (from the Go Live approval for your Paybill / Till)
- [ ] `MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline` if you use a Till number
- [ ] Set a fresh `MPESA_CALLBACK_SECRET` (`openssl rand -hex 32`); secrets apply on the next invocation, no redeploy needed
- [ ] Make a real KES 1 test purchase, confirm the receipt appears under Admin → Payments, then refund it
- [ ] Admin → Settings → Payments shows **Live**
