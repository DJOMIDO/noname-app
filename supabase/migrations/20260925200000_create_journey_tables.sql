-- Creates the tables used by the flight/train forms, list pages, statistics,
-- details pages, and CSV importer.

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
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
  user_id uuid not null references auth.users (id) on delete cascade,
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
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own flights" on public.flights;
create policy "Users can create their own flights"
  on public.flights for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own flights" on public.flights;
create policy "Users can update their own flights"
  on public.flights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own flights" on public.flights;
create policy "Users can delete their own flights"
  on public.flights for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own trains" on public.trains;
create policy "Users can view their own trains"
  on public.trains for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own trains" on public.trains;
create policy "Users can create their own trains"
  on public.trains for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own trains" on public.trains;
create policy "Users can update their own trains"
  on public.trains for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own trains" on public.trains;
create policy "Users can delete their own trains"
  on public.trains for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.flights to authenticated;
grant select, insert, update, delete on public.trains to authenticated;

-- Ask PostgREST to reload its schema cache immediately after applying this
-- migration in the Supabase SQL editor or migration runner.
notify pgrst, 'reload schema';
