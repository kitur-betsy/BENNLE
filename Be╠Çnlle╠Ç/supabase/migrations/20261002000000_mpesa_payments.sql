-- =====================================================================================
-- M-Pesa STK Push payments for Benlle.
-- Run once in Supabase → SQL Editor (after setup.sql), or with `supabase db push`. Safe to re-run.
--
-- What this does
--   1. Converts the store from USD to KES (1 USD = 129 KES), exactly once.
--   2. Adds payment fields to orders and the `awaiting_payment` order status.
--   3. Creates `payments` (one row per STK push) and `payment_events` (append-only audit log).
--   4. Adds two server-only functions the Edge Functions call:
--        create_mpesa_order()   prices an order from the products table (the browser is never trusted)
--        apply_payment_result() marks a payment paid/failed and updates order + stock in ONE transaction
--   5. Closes the old place_order() function: it would create fulfilable orders without any payment.
-- =====================================================================================

-- ---------- 1. USD → KES (runs once; guarded by a marker row) -------------------------------
do $$
declare rate constant numeric := 129;
begin
  if exists (select 1 from public.cms_documents where key = 'currency_kes_v1') then return; end if;

  update public.products set price = round(price * rate);

  update public.cms_documents
     set value = jsonb_set(
                   jsonb_set(value, '{freeShippingThreshold}', to_jsonb(round(coalesce((value ->> 'freeShippingThreshold')::numeric, 60) * rate)), true),
                   '{shippingFlat}', to_jsonb(round(coalesce((value ->> 'shippingFlat')::numeric, 6) * rate)), true)
   where key = 'settings';
  update public.cms_documents
     set value = replace(value::text, 'over $60', 'over KES ' || to_char(round(60 * rate), 'FM999,999'))::jsonb
   where value::text like '%over $60%';

  -- Historic orders keep their meaning: convert totals and line prices too.
  update public.orders set
    subtotal = round(subtotal * rate), shipping = round(shipping * rate), total = round(total * rate),
    items = coalesce((select jsonb_agg(case when e ? 'price' then jsonb_set(e, '{price}', to_jsonb(round((e ->> 'price')::numeric * rate))) else e end)
                      from jsonb_array_elements(items) e), '[]'::jsonb);

  insert into public.cms_documents (key, value) values ('currency_kes_v1', '{"rate": 129}'::jsonb);
end $$;

-- ---------- 2. Orders: payment fields + awaiting_payment status ----------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('awaiting_payment', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'));

alter table public.orders
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists mpesa_receipt text;
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded'));

-- ---------- 3. Payments ---------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders (id) on delete set null,   -- orders.id is text in this project
  user_id uuid references auth.users (id) on delete set null,       -- null for guest checkout
  provider text not null default 'mpesa',
  phone text not null,                                              -- normalised 2547XXXXXXXX / 2541XXXXXXXX
  amount integer not null check (amount > 0),                       -- whole KES
  currency text not null default 'KES',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'timeout')),
  merchant_request_id text,
  checkout_request_id text unique,
  mpesa_receipt text unique,
  result_code integer,
  result_desc text,
  needs_review boolean not null default false,                      -- e.g. amount mismatch: an admin must look
  transaction_date timestamptz,
  raw_request jsonb,
  raw_response jsonb,
  raw_callback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status, created_at desc);
create index if not exists payments_phone_idx on public.payments (phone, created_at desc);

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  payment_id uuid references public.payments (id) on delete cascade,
  checkout_request_id text,
  source text not null check (source in ('stk_request', 'callback', 'status_query')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists payment_events_payment_idx on public.payment_events (payment_id, created_at);
create index if not exists payment_events_checkout_idx on public.payment_events (checkout_request_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();

-- Row-level security. Clients may only READ. Only Edge Functions (service role) write.
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "customers read own payments" on public.payments;
create policy "customers read own payments" on public.payments for select using (auth.uid() = user_id);
drop policy if exists "admins read payments" on public.payments;
create policy "admins read payments" on public.payments for select using (public.is_admin());
drop policy if exists "admins read payment events" on public.payment_events;
create policy "admins read payment events" on public.payment_events for select using (public.is_admin());

-- setup.sql grants broad table access to anon/authenticated; payments never need it.
revoke all on public.payments, public.payment_events from anon, authenticated;
grant select on public.payments, public.payment_events to authenticated;

-- Realtime so signed-in views can follow a payment row (guests use the broadcast channel instead).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payments') then
    alter publication supabase_realtime add table public.payments;
  end if;
end $$;

-- ---------- 4a. Price an order on the server ------------------------------------------------
-- Called only by the stk-push Edge Function (service role). Prices, stock and shipping come from the
-- database. Stock is CHECKED here but only DECREMENTED when the payment succeeds.
create or replace function public.create_mpesa_order(p_user uuid, p_customer jsonb, p_items jsonb, p_order_id text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  k text; r record; v_prod public.products%rowtype; v_lines jsonb := '[]'::jsonb;
  v_sub numeric := 0; v_count int := 0; v_ship numeric; v_total numeric; v_settings jsonb; v_thresh numeric; v_flat numeric;
  v_addr jsonb; v_email text; v_order public.orders%rowtype;
begin
  if p_customer is null or jsonb_typeof(p_customer) <> 'object' then raise exception 'Missing customer details'; end if;
  foreach k in array array['name', 'email', 'address', 'city', 'zip', 'country'] loop
    if coalesce(trim(p_customer ->> k), '') = '' then raise exception 'Please fill in your %', k; end if;
    if char_length(p_customer ->> k) > 300 then raise exception 'Your % is too long', k; end if;
  end loop;
  v_email := lower(trim(p_customer ->> 'email'));
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Your bag is empty';
  end if;
  for r in select e from jsonb_array_elements(p_items) e loop
    if coalesce(r.e ->> 'id', '') = '' or coalesce(r.e ->> 'qty', '') !~ '^[0-9]{1,2}$' or (r.e ->> 'qty')::int < 1 then
      raise exception 'Your bag has an invalid item';
    end if;
  end loop;

  for r in select e ->> 'id' as id, sum((e ->> 'qty')::int)::int as qty
           from jsonb_array_elements(p_items) e group by e ->> 'id' order by e ->> 'id' loop
    select * into v_prod from public.products where id = r.id and status = 'active';
    if not found then raise exception 'An item in your bag is no longer available'; end if;
    if v_prod.stock < r.qty then
      raise exception 'Only % left of %', v_prod.stock, v_prod.name;
    end if;
    v_sub := v_sub + v_prod.price * r.qty;
    v_count := v_count + r.qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('id', v_prod.id, 'name', v_prod.name, 'image', v_prod.image, 'price', v_prod.price, 'qty', r.qty));
  end loop;

  select value into v_settings from public.cms_documents where key = 'settings';
  v_thresh := coalesce((v_settings ->> 'freeShippingThreshold')::numeric, 7740);
  v_flat := coalesce((v_settings ->> 'shippingFlat')::numeric, 774);
  v_ship := case when v_sub >= v_thresh then 0 else v_flat end;
  v_total := v_sub + v_ship;
  if ceil(v_total) < 1 then raise exception 'Your bag total is invalid'; end if;

  v_addr := jsonb_build_object('name', trim(p_customer ->> 'name'), 'email', v_email, 'address', trim(p_customer ->> 'address'),
    'city', trim(p_customer ->> 'city'), 'zip', trim(p_customer ->> 'zip'), 'country', trim(p_customer ->> 'country'));

  if p_order_id is not null then
    select * into v_order from public.orders where id = p_order_id for update;
    if not found or v_order.status <> 'awaiting_payment' or v_order.payment_status = 'paid'
       or v_order.user_id is distinct from p_user then
      raise exception 'This order can no longer be paid. Please start again.';
    end if;
    update public.orders set email = v_email, customer = v_addr, shipping_address = v_addr, items = v_lines, item_count = v_count,
      subtotal = v_sub, shipping = v_ship, total = v_total, payment_status = 'pending'
    where id = p_order_id returning * into v_order;
  else
    insert into public.orders (id, user_id, email, customer, shipping_address, items, item_count, subtotal, shipping, total,
                               status, payment_method, payment_status)
    values ('AU-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)), p_user, v_email, v_addr, v_addr, v_lines, v_count,
            v_sub, v_ship, v_total, 'awaiting_payment', 'mpesa', 'pending')
    returning * into v_order;
  end if;
  return to_jsonb(v_order) || jsonb_build_object('amount', ceil(v_total)::int);
end;
$$;

-- ---------- 4b. Apply a payment result atomically ----------------------------------------------
-- Used by payment-callback and payment-status. Idempotent: replaying the same result changes nothing.
-- p_status: 'paid' | 'failed' | 'cancelled' | 'timeout'. Returns { found, changed, status, order_id, message }.
create or replace function public.apply_payment_result(
  p_checkout_request_id text, p_status text, p_result_code int, p_result_desc text,
  p_receipt text default null, p_amount numeric default null, p_tx_date timestamptz default null, p_callback jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare pay public.payments%rowtype; line jsonb; v_status text; v_desc text; v_review boolean := false;
begin
  select * into pay from public.payments where checkout_request_id = p_checkout_request_id for update;
  if not found then return jsonb_build_object('found', false, 'changed', false); end if;

  -- Already paid: a late callback may only fill in the receipt that the status query could not provide.
  if pay.status = 'paid' then
    if p_status = 'paid' and pay.mpesa_receipt is null and p_receipt is not null then
      update public.payments set mpesa_receipt = p_receipt, transaction_date = coalesce(p_tx_date, transaction_date),
        raw_callback = coalesce(p_callback, raw_callback) where id = pay.id;
      update public.orders set mpesa_receipt = p_receipt where id = pay.order_id and mpesa_receipt is null;
      return jsonb_build_object('found', true, 'changed', true, 'status', 'paid', 'order_id', pay.order_id, 'receipt', p_receipt);
    end if;
    return jsonb_build_object('found', true, 'changed', false, 'status', pay.status, 'order_id', pay.order_id, 'receipt', pay.mpesa_receipt);
  end if;
  -- failed / cancelled are final. A 'timeout' may still be overtaken by a real result from Safaricom.
  if pay.status in ('failed', 'cancelled') then
    return jsonb_build_object('found', true, 'changed', false, 'status', pay.status, 'order_id', pay.order_id);
  end if;
  if pay.status = 'timeout' and p_status = 'timeout' then
    return jsonb_build_object('found', true, 'changed', false, 'status', pay.status, 'order_id', pay.order_id);
  end if;

  v_status := p_status; v_desc := p_result_desc;
  if p_status = 'paid' and p_amount is not null and p_amount <> pay.amount then
    v_status := 'failed'; v_desc := 'Amount mismatch'; v_review := true;
  end if;

  update public.payments set status = v_status, result_code = p_result_code, result_desc = v_desc, needs_review = v_review,
    mpesa_receipt = coalesce(p_receipt, mpesa_receipt), transaction_date = coalesce(p_tx_date, transaction_date),
    raw_callback = coalesce(p_callback, raw_callback)
  where id = pay.id;

  if v_status = 'paid' then
    update public.orders set payment_status = 'paid', paid_at = now(), mpesa_receipt = coalesce(p_receipt, mpesa_receipt),
      status = case when status = 'awaiting_payment' then 'pending' else status end
    where id = pay.order_id and payment_status <> 'paid';
    if found then
      for line in select e from public.orders o, jsonb_array_elements(o.items) e where o.id = pay.order_id loop
        update public.products set stock = greatest(stock - (line ->> 'qty')::int, 0) where id = line ->> 'id';
      end loop;
    end if;
  else
    update public.orders set payment_status = 'failed' where id = pay.order_id and payment_status <> 'paid';
  end if;

  return jsonb_build_object('found', true, 'changed', true, 'status', v_status, 'order_id', pay.order_id,
                            'receipt', p_receipt, 'needs_review', v_review);
end;
$$;

-- Server-only: never callable from the browser.
revoke execute on function public.create_mpesa_order(uuid, jsonb, jsonb, text) from public, anon, authenticated;
revoke execute on function public.apply_payment_result(text, text, int, text, text, numeric, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.create_mpesa_order(uuid, jsonb, jsonb, text) to service_role;
grant execute on function public.apply_payment_result(text, text, int, text, text, numeric, timestamptz, jsonb) to service_role;
grant select, insert, update on public.payments, public.payment_events to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------- 5. Close the unpaid checkout path ---------------------------------------------------
-- place_order() creates fulfilable orders and takes stock with no payment. Checkout now uses stk-push.
revoke execute on function public.place_order(jsonb, jsonb) from public, anon, authenticated;
