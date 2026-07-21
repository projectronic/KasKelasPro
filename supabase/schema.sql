-- KasKelasPro database schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push`) on a fresh project.
-- Already have a project running an older version of this schema? Check
-- supabase/migrations/ for incremental upgrade scripts instead of rerunning this file.

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
  school_name text,
  iuran_type public.iuran_type not null default 'bulanan',
  iuran_amount numeric(12, 2) not null default 0,
  -- Kas kelas biasanya berlaku satu tahun ajaran: tanggal/bulan mulai
  -- dihitung dari sini (dipakai bareng members.join_date — dues dihitung
  -- dari yang lebih belakangan, supaya siswa yang masuk di tengah tahun
  -- tidak dianggap nunggak sejak awal tahun).
  period_start_date date not null default current_date,
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

-- Hari libur (weekends are handled in code; this covers national holidays
-- and school breaks), used by the daily payment form to skip non-school
-- days when generating periods for a date range. Seeded by fetching a
-- public holiday API and/or added by hand from Pengaturan.
create table public.holidays (
  date date primary key,
  note text,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  parent_name text,
  -- Not unique: siblings legitimately share one parent's email/phone.
  parent_email text,
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
  -- Cosmetic label only (e.g. "Ketua", "Bendahara") — does NOT grant any
  -- extra access. Actual permissions still come entirely from `role`; see
  -- the README for why this stops short of fully admin-defined permissions.
  title text,
  member_id uuid references public.members (id) on delete set null,
  -- Self-registered accounts start unapproved and can't read class data
  -- until an admin/editor approves them. Admin/editor accounts are always
  -- treated as approved regardless of this flag (see is_approved()).
  approved boolean not null default false,
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

-- Audit trail for admin/editor actions (who did what, when). Populated by
-- the ledger/approval RPCs below, not by direct table writes.
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
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

-- Whether the current user is cleared to read class data: either an
-- approved account, or an admin/editor (who are implicitly always allowed,
-- since they're the ones who do the approving).
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select approved from public.profiles where id = auth.uid()), false)
    or public.is_editor_or_admin();
$$;

-- Auto-provision a profile row whenever someone signs up.
-- - The very first user to ever sign up becomes the class 'admin',
--   pre-approved (the person deploying this instance).
-- - Anyone else signs up as either 'siswa' or 'orang_tua' (registrant_type
--   in user metadata) — no whitelist. A student and their parent register
--   as two *separate* accounts/passwords, matched to the *same* `members`
--   row by student name (case-insensitive) so they don't get double-counted
--   in the roster/dues math: whichever registers first creates the row,
--   the other just fills in their half of it (email vs parent_email). Both
--   start unapproved/inactive until an admin or editor approves via
--   approve_registration() — matching isn't foolproof (two students with
--   the same name would collide), so this still wants a human check.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_user boolean;
  new_member_id uuid;
  registrant_type text;
  student_name text;
  own_name text;
  parent_phone_input text;
  student_phone_input text;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  if is_first_user then
    insert into public.profiles (id, email, full_name, role, approved)
    values (new.id, new.email, new.raw_user_meta_data ->> 'own_name', 'admin', true);
    return new;
  end if;

  registrant_type := coalesce(new.raw_user_meta_data ->> 'registrant_type', 'siswa');
  student_name := trim(new.raw_user_meta_data ->> 'student_name');
  own_name := new.raw_user_meta_data ->> 'own_name';
  parent_phone_input := new.raw_user_meta_data ->> 'parent_phone';
  student_phone_input := new.raw_user_meta_data ->> 'student_phone';

  if registrant_type = 'orang_tua' then
    select id into new_member_id
    from public.members
    where lower(trim(full_name)) = lower(student_name) and parent_email is null
    order by created_at asc
    limit 1;

    if new_member_id is null then
      insert into public.members (full_name, parent_name, parent_email, parent_phone, active)
      values (student_name, own_name, new.email, parent_phone_input, false)
      returning id into new_member_id;
    else
      update public.members
      set parent_name = coalesce(parent_name, own_name),
          parent_email = new.email,
          parent_phone = coalesce(parent_phone, parent_phone_input)
      where id = new_member_id;
    end if;
  else
    select id into new_member_id
    from public.members
    where lower(trim(full_name)) = lower(student_name) and email is null
    order by created_at asc
    limit 1;

    if new_member_id is null then
      insert into public.members (full_name, email, phone, active)
      values (student_name, new.email, student_phone_input, false)
      returning id into new_member_id;
    else
      update public.members
      set email = new.email, phone = coalesce(phone, student_phone_input)
      where id = new_member_id;
    end if;
  end if;

  insert into public.profiles (id, email, full_name, role, member_id, approved)
  values (new.id, new.email, own_name, 'viewer', new_member_id, false);

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
alter table public.holidays enable row level security;
alter table public.members enable row level security;
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.activity_log enable row level security;

-- settings: readable by anyone, even signed-out visitors — it's just class
-- metadata (name, iuran mode/amount, period start), no PII, and the tab
-- title + login page display class_name before anyone is authenticated.
-- Only admin can change it.
create policy "settings_select_public" on public.settings
  for select to anon, authenticated using (true);
create policy "settings_update_admin" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- dues_overrides: approved users can read; only admin can manage.
create policy "dues_overrides_select_approved" on public.dues_overrides
  for select to authenticated using (public.is_approved());
create policy "dues_overrides_write_admin" on public.dues_overrides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- holidays: approved users can read; only admin can manage.
create policy "holidays_select_approved" on public.holidays
  for select to authenticated using (public.is_approved());
create policy "holidays_write_admin" on public.holidays
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- members: approved users can read; admin & editor can manage (including
-- approving/activating a pending self-registered member).
create policy "members_select_approved" on public.members
  for select to authenticated using (public.is_approved());
create policy "members_write_editor_or_admin" on public.members
  for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

-- profiles: users can always read their own profile (needed to show their
-- own pending/approved status), admin/editor can read all. Only admin can
-- change a role directly; users can update their own non-role fields.
-- Approving a registration (editor allowed, not just admin) goes through
-- the approve_registration() function below instead of a direct RLS
-- policy here, since RLS can't restrict *which column* gets updated —
-- an editor-writable UPDATE policy on this table would let editors change
-- roles too, which is admin-only by design.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_editor_or_admin());
create policy "profiles_update_own_fields" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_manage_roles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- payments: approved users can read (viewer needs this for rekap);
-- admin & editor can record/edit payments.
create policy "payments_select_approved" on public.payments
  for select to authenticated using (public.is_approved());
create policy "payments_write_editor_or_admin" on public.payments
  for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

-- wallet_transactions: approved users can read; admin & editor can write.
create policy "wallet_transactions_select_approved" on public.wallet_transactions
  for select to authenticated using (public.is_approved());
create policy "wallet_transactions_write_editor_or_admin" on public.wallet_transactions
  for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

-- activity_log: only admin/editor can see or write the audit trail (more
-- internal than the payment ledger itself, which viewers already see).
create policy "activity_log_select_editor_or_admin" on public.activity_log
  for select to authenticated using (public.is_editor_or_admin());
create policy "activity_log_insert_editor_or_admin" on public.activity_log
  for insert to authenticated with check (public.is_editor_or_admin());

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
  p_note text default null,
  p_paid_at timestamptz default now()
)
returns public.payments
language plpgsql
security invoker
as $$
declare
  new_payment public.payments;
  member_name text;
begin
  if not public.is_editor_or_admin() then
    raise exception 'Hanya editor atau admin yang bisa mencatat pembayaran.';
  end if;

  insert into public.payments (member_id, period, amount, paid_at, recorded_by, note)
  values (p_member_id, p_period, p_amount, p_paid_at, auth.uid(), p_note)
  returning * into new_payment;

  insert into public.wallet_transactions
    (wallet, type, amount, reference_type, reference_id, note, created_by, created_at)
  values
    ('dompet', 'deposit', p_amount, 'payment', new_payment.id, p_note, auth.uid(), p_paid_at);

  select full_name into member_name from public.members where id = p_member_id;
  insert into public.activity_log (actor_id, action)
  values (
    auth.uid(),
    format('Mencatat pembayaran Rp %s dari %s untuk periode %s', p_amount, member_name, p_period)
  );

  return new_payment;
end;
$$;

-- Lets admin/editor fix a wrongly-recorded payment (typo'd amount, wrong
-- period) instead of editing the database directly. Keeps the linked
-- wallet_transactions row in sync and leaves a trace in activity_log.
create or replace function public.correct_payment(
  p_payment_id uuid,
  p_period text,
  p_amount numeric,
  p_note text default null
)
returns public.payments
language plpgsql
security invoker
as $$
declare
  old_payment public.payments;
  updated_payment public.payments;
  member_name text;
begin
  if not public.is_editor_or_admin() then
    raise exception 'Hanya editor atau admin yang bisa mengoreksi pembayaran.';
  end if;

  select * into old_payment from public.payments where id = p_payment_id;
  if old_payment.id is null then
    raise exception 'Pembayaran tidak ditemukan.';
  end if;

  update public.payments
  set period = p_period, amount = p_amount, note = p_note
  where id = p_payment_id
  returning * into updated_payment;

  update public.wallet_transactions
  set amount = p_amount, note = p_note
  where reference_type = 'payment' and reference_id = p_payment_id;

  select full_name into member_name from public.members where id = old_payment.member_id;
  insert into public.activity_log (actor_id, action)
  values (
    auth.uid(),
    format(
      'Mengoreksi pembayaran %s (Rp %s, periode %s -> Rp %s, periode %s)',
      member_name, old_payment.amount, old_payment.period, p_amount, p_period
    )
  );

  return updated_payment;
end;
$$;

-- Lets admin/editor delete a wrongly-recorded payment. The row itself is
-- gone afterward, but activity_log always keeps a trace of what was removed.
create or replace function public.delete_payment(p_payment_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  old_payment public.payments;
  member_name text;
begin
  if not public.is_editor_or_admin() then
    raise exception 'Hanya editor atau admin yang bisa menghapus pembayaran.';
  end if;

  select * into old_payment from public.payments where id = p_payment_id;
  if old_payment.id is null then
    raise exception 'Pembayaran tidak ditemukan.';
  end if;

  select full_name into member_name from public.members where id = old_payment.member_id;

  delete from public.wallet_transactions
  where reference_type = 'payment' and reference_id = p_payment_id;

  delete from public.payments where id = p_payment_id;

  insert into public.activity_log (actor_id, action)
  values (
    auth.uid(),
    format(
      'Menghapus pembayaran Rp %s dari %s untuk periode %s',
      old_payment.amount, member_name, old_payment.period
    )
  );
end;
$$;

create or replace function public.record_withdrawal(
  p_wallet text,
  p_amount numeric,
  p_reason text,
  p_created_at timestamptz default now()
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
    (wallet, type, amount, reference_type, note, created_by, created_at)
  values
    (p_wallet, 'withdrawal', p_amount, 'withdrawal', p_reason, auth.uid(), p_created_at)
  returning * into new_tx;

  insert into public.activity_log (actor_id, action)
  values (
    auth.uid(),
    format('Menarik dana Rp %s dari %s (%s)', p_amount, p_wallet, p_reason)
  );

  return new_tx;
end;
$$;

create or replace function public.record_transfer(
  p_from_wallet text,
  p_to_wallet text,
  p_amount numeric,
  p_note text default null,
  p_created_at timestamptz default now()
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
    (wallet, type, amount, reference_type, reference_id, note, created_by, created_at)
  values
    (p_from_wallet, 'transfer_out', p_amount, 'transfer', tx_group, p_note, auth.uid(), p_created_at);

  insert into public.wallet_transactions
    (wallet, type, amount, reference_type, reference_id, note, created_by, created_at)
  values
    (p_to_wallet, 'transfer_in', p_amount, 'transfer', tx_group, p_note, auth.uid(), p_created_at);

  insert into public.activity_log (actor_id, action)
  values (
    auth.uid(),
    format('Transfer Rp %s dari %s ke %s', p_amount, p_from_wallet, p_to_wallet)
  );
end;
$$;

-- Approves a self-registered account: marks the profile approved and
-- activates its linked member. security definer (not invoker, unlike the
-- ledger RPCs above) because it has to bypass profiles RLS to let editors
-- do this too — see the comment above the profiles policies for why.
create or replace function public.approve_registration(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  approved_email text;
begin
  if not public.is_editor_or_admin() then
    raise exception 'Hanya editor atau admin yang bisa approve pendaftaran.';
  end if;

  update public.profiles set approved = true where id = p_profile_id;

  update public.members
  set active = true
  where id = (select member_id from public.profiles where id = p_profile_id);

  select email into approved_email from public.profiles where id = p_profile_id;
  insert into public.activity_log (actor_id, action)
  values (auth.uid(), format('Approve pendaftaran %s', approved_email));
end;
$$;
