-- Mejenga: initial schema
-- Tables: admins, matches, registrations + RLS + payment-proofs storage bucket

-- ========== admins ==========
create table public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  sinpe_phone text,
  created_at timestamptz not null default now()
);

-- Every auth user becomes an admin. Signups are disabled in the dashboard,
-- so users only exist when invited by an admin or added manually (bootstrap).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admins (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== matches ==========
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  match_date date not null,
  match_time time not null,
  location text not null,
  price_crc integer not null check (price_crc >= 0),
  sinpe_phone text not null,
  notes text,
  status text not null default 'open' check (status in ('open', 'cancelled', 'finished')),
  created_by uuid not null references public.admins (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index matches_created_by_idx on public.matches (created_by);
create index matches_status_idx on public.matches (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- ========== registrations ==========
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^[0-9]{8}$'),
  status text not null default 'pending'
    check (status in ('pending', 'proof_submitted', 'approved', 'rejected')),
  payment_proof_path text,
  view_token uuid not null unique default gen_random_uuid(),
  review_note text,
  reviewed_by uuid references public.admins (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (match_id, phone)
);

create index registrations_match_id_idx on public.registrations (match_id);
create index registrations_status_idx on public.registrations (status);
create index registrations_view_token_idx on public.registrations (view_token);

-- ========== RLS ==========
alter table public.admins enable row level security;
alter table public.matches enable row level security;
alter table public.registrations enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

-- admins: users see and edit only their own row
create policy "admins_select_own" on public.admins
  for select to authenticated
  using (id = auth.uid());

create policy "admins_update_own" on public.admins
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- matches: readable by anyone (share links are public), writable by admins only
create policy "matches_select_all" on public.matches
  for select
  using (true);

create policy "matches_insert_admin" on public.matches
  for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());

create policy "matches_update_admin" on public.matches
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "matches_delete_admin" on public.matches
  for delete to authenticated
  using (public.is_admin());

-- registrations: anon may only insert (join) into open matches with clean defaults;
-- no anon SELECT policy — player status is served via server routes using view_token.
create policy "registrations_insert_open_match" on public.registrations
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and payment_proof_path is null
    and reviewed_by is null
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'open'
    )
  );

create policy "registrations_select_admin" on public.registrations
  for select to authenticated
  using (public.is_admin());

create policy "registrations_update_admin" on public.registrations
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "registrations_delete_admin" on public.registrations
  for delete to authenticated
  using (public.is_admin());

-- ========== storage: payment proof screenshots ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "payment_proofs_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin())
  with check (bucket_id = 'payment-proofs' and public.is_admin());
