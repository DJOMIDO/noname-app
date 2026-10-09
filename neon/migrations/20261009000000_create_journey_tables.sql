-- Creates the tables used by the flight/train forms, list pages, statistics,
-- details pages, and CSV importer.
--
-- Requires Neon Auth and the Neon Data API to be enabled on the same branch and
-- database: the `authenticated` role is created by the Data API.
-- auth.user_id() comes from the pg_session_jwt extension and returns the
-- signed-in user id (the JWT `sub` claim, which matches neon_auth.user.id).

create extension if not exists pg_session_jwt;

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.user_id()),
  airline_code text not null,
  flight_number text not null,
  departure_airport text not null,
  stopover_airport text,
  arrival_airport text not null,
  departure_date date not null,
  departure_time time,
  arrival_date date,
  arrival_time time,
  gate text,
  seat_number text,
  aircraft_type text,
  aircraft_reg text,
  price numeric,
  currency text,
  booking_ref text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trains (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.user_id()),
  train_company text not null,
  train_number text not null,
  train_type text,
  departure_station text not null,
  arrival_station text not null,
  departure_city text,
  arrival_city text,
  departure_date date not null,
  departure_time time,
  arrival_date date,
  arrival_time time,
  coach text,
  seat_number text,
  price numeric,
  currency text,
  booking_ref text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flights_user_id_departure_date_idx
  on public.flights (user_id, departure_date desc);

create index if not exists trains_user_id_departure_date_idx
  on public.trains (user_id, departure_date desc);

alter table public.flights enable row level security;
alter table public.trains enable row level security;

drop policy if exists "Users can view their own flights" on public.flights;
create policy "Users can view their own flights"
  on public.flights for select
  to authenticated
  using ((select auth.user_id()) = user_id);

drop policy if exists "Users can create their own flights" on public.flights;
create policy "Users can create their own flights"
  on public.flights for insert
  to authenticated
  with check ((select auth.user_id()) = user_id);

drop policy if exists "Users can update their own flights" on public.flights;
create policy "Users can update their own flights"
  on public.flights for update
  to authenticated
  using ((select auth.user_id()) = user_id)
  with check ((select auth.user_id()) = user_id);

drop policy if exists "Users can delete their own flights" on public.flights;
create policy "Users can delete their own flights"
  on public.flights for delete
  to authenticated
  using ((select auth.user_id()) = user_id);

drop policy if exists "Users can view their own trains" on public.trains;
create policy "Users can view their own trains"
  on public.trains for select
  to authenticated
  using ((select auth.user_id()) = user_id);

drop policy if exists "Users can create their own trains" on public.trains;
create policy "Users can create their own trains"
  on public.trains for insert
  to authenticated
  with check ((select auth.user_id()) = user_id);

drop policy if exists "Users can update their own trains" on public.trains;
create policy "Users can update their own trains"
  on public.trains for update
  to authenticated
  using ((select auth.user_id()) = user_id)
  with check ((select auth.user_id()) = user_id);

drop policy if exists "Users can delete their own trains" on public.trains;
create policy "Users can delete their own trains"
  on public.trains for delete
  to authenticated
  using ((select auth.user_id()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.flights to authenticated;
grant select, insert, update, delete on public.trains to authenticated;

