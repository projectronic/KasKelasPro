-- KasKelasPro database schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push`) on a fresh project.

-- ============================================================================
-- Types
-- ============================================================================

create type public.app_role as enum ('admin', 'editor', 'viewer');
create type public.iuran_type as enum ('harian', 'bulanan');

-- ============================================================================
-- Tables
-- ============================================================================

-- One row per class. Kept as a single settings row rather than a full
-- multi-tenant "classes" table — this project is meant to be deployed once
-- per class, not shared across classes.
create table public.settings (
  id boolean primary key default true,
  class_name text not null default 'Kelas Saya',
  iuran_type public.iuran_type not null default 'bulanan',
  iuran_amount numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id)
);

-- Nominal iuran untuk periode tertentu yang berbeda dari default di `settings`
-- (mis. bulan pertama lebih besar karena ada biaya pendaftaran).
create table public.dues_overrides (
  id uuid primary key default gen_random_uuid(),
  -- 'YYYY-MM' untuk mode bulanan, 'YYYY-MM-DD' untuk mode harian.
  period text not null unique,
  amount numeric(12, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  parent_name text,
  parent_email text unique,
  parent_phone text,
  active boolean not null default true,
  join_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'viewer',
  member_id uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  -- Periode yang dibayar lunas, format mengikuti settings.iuran_type saat itu.
  period text not null,
  amount numeric(12, 2) not null,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id) on delete set null,
  note text
);

-- Ledger tunggal untuk semua pergerakan dana: iuran masuk ke dompet, transfer
-- dompet<->bank, dan penarikan dari bank. Saldo dihitung dari SUM, bukan
-- disimpan sebagai kolom, supaya selalu konsisten dengan histori.
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet text not null check (wallet in ('dompet', 'bank')),
  type text not null check (type in ('deposit', 'withdrawal', 'transfer_in', 'transfer_out')),
  amount numeric(12, 2) not null check (amount > 0),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.settings (id) values (true);

-- ============================================================================
-- Helper functions
-- ============================================================================

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('admin', 'editor');
$$;

-- Auto-provision a profile row whenever someone signs up.
-- - The very first user to ever sign up becomes the class 'admin'
--   (the person deploying this instance).
-- - Anyone else must sign up with an email already registered as a
--   member's own email or their parent's email in `members`; they become
--   'viewer'. Anyone else is rejected (exception rolls back the signup).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_member_id uuid;
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  if is_first_user then
    insert into public.profiles (id, email, full_name, role)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'admin');
    return new;
  end if;

  select id into matched_member_id
  from public.members
  where email = new.email or parent_email = new.email
  limit 1;

  if matched_member_id is null then
    raise exception
      'Email % belum terdaftar sebagai siswa atau orang tua/wali. Hubungi pengurus kelas.',
      new.email;
  end if;

  insert into public.profiles (id, email, full_name, role, member_id)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'viewer', matched_member_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.settings enable row level security;
alter table public.dues_overrides enable row level security;
alter table public.members enable row level security;
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.wallet_transactions enable row level security;

-- settings: everyone signed in can read; only admin can change.
create policy "settings_select_authenticated" on public.settings
  for select to authenticated using (true);
create policy "settings_update_admin" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- dues_overrides: everyone signed in can read; only admin can manage.
create policy "dues_overrides_select_authenticated" on public.dues_overrides
  for select to authenticated using (true);
create policy "dues_overrides_write_admin" on public.dues_overrides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- members: everyone signed in can read; admin & editor can manage.
create policy "members_select_authenticated" on public.members
  for select to authenticated using (true);
create policy "members_write_editor_or_admin" on public.members
  for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

-- profiles: users can read their own profile, admin/editor can read all
-- (needed to show who recorded a payment, manage roles, etc). Only admin
-- can change a role; users can update their own non-role fields.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_editor_or_admin());
create policy "profiles_update_own_fields" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_manage_roles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- payments: everyone signed in can read (viewer needs this for rekap);
-- admin & editor can record/edit payments.
create policy "payments_select_authenticated" on public.payments
  for select to authenticated using (true);
create policy "payments_write_editor_or_admin" on public.payments
  for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

-- wallet_transactions: everyone signed in can read; admin & editor can write.
create policy "wallet_transactions_select_authenticated" on public.wallet_transactions
  for select to authenticated using (true);
create policy "wallet_transactions_write_editor_or_admin" on public.wallet_transactions
  for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

-- ============================================================================
-- Convenience view: current balance per wallet
-- ============================================================================

create or replace view public.wallet_balances as
select
  wallet,
  sum(case when type in ('deposit', 'transfer_in') then amount else -amount end) as balance
from public.wallet_transactions
group by wallet;

-- ============================================================================
-- Ledger RPCs
--
-- A payment and its wallet entry (or a transfer's two legs) must land
-- together or not at all, so these are single Postgres functions rather than
-- two separate inserts from the client. RLS already blocks non editor/admin
-- writes on the underlying tables, but the explicit role check here gives a
-- readable error message instead of a generic RLS violation.
-- ============================================================================

create or replace function public.record_payment(
  p_member_id uuid,
  p_period text,
  p_amount numeric,
  p_note text default null
)
returns public.payments
language plpgsql
security invoker
as $$
declare
  new_payment public.payments;
begin
  if not public.is_editor_or_admin() then
    raise exception 'Hanya editor atau admin yang bisa mencatat pembayaran.';
  end if;

  insert into public.payments (member_id, period, amount, recorded_by, note)
  values (p_member_id, p_period, p_amount, auth.uid(), p_note)
  returning * into new_payment;

  insert into public.wallet_transactions
    (wallet, type, amount, reference_type, reference_id, note, created_by)
  values
    ('dompet', 'deposit', p_amount, 'payment', new_payment.id, p_note, auth.uid());

  return new_payment;
end;
$$;

create or replace function public.record_withdrawal(
  p_wallet text,
  p_amount numeric,
  p_reason text
)
returns public.wallet_transactions
language plpgsql
security invoker
as $$
declare
  new_tx public.wallet_transactions;
begin
  if not public.is_editor_or_admin() then
    raise exception 'Hanya editor atau admin yang bisa melakukan penarikan.';
  end if;

  insert into public.wallet_transactions
    (wallet, type, amount, reference_type, note, created_by)
  values
    (p_wallet, 'withdrawal', p_amount, 'withdrawal', p_reason, auth.uid())
  returning * into new_tx;

  return new_tx;
end;
$$;

create or replace function public.record_transfer(
  p_from_wallet text,
  p_to_wallet text,
  p_amount numeric,
  p_note text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  tx_group uuid := gen_random_uuid();
begin
  if not public.is_editor_or_admin() then
    raise exception 'Hanya editor atau admin yang bisa transfer dana.';
  end if;

  if p_from_wallet = p_to_wallet then
    raise exception 'Dompet asal dan tujuan tidak boleh sama.';
  end if;

  insert into public.wallet_transactions
    (wallet, type, amount, reference_type, reference_id, note, created_by)
  values
    (p_from_wallet, 'transfer_out', p_amount, 'transfer', tx_group, p_note, auth.uid());

  insert into public.wallet_transactions
    (wallet, type, amount, reference_type, reference_id, note, created_by)
  values
    (p_to_wallet, 'transfer_in', p_amount, 'transfer', tx_group, p_note, auth.uid());
end;
$$;
