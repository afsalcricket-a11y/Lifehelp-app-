-- =====================================================================
-- LIFEHELP  |  Part 4  |  003_part4_location.sql
-- Run AFTER 001 and 002. Run once: SQL Editor > New query > paste > Run.
-- Adds approximate coordinates, a built-in city/district lookup, and
-- distance-aware donor search. Phone numbers stay hidden as before.
-- NOTE: there is no "community_posts" table in LIFEHELP - community posts
-- are stored in public.help_requests, so that is the table updated here.
-- =====================================================================

-- ---------- 1. City / district lookup (read-only reference data) ----------
create table if not exists public.city_coordinates (
  id        serial primary key,
  name      text not null,
  state     text not null,
  kind      text not null check (kind in ('city','district')),
  latitude  double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  aliases   text[] not null default '{}'
);
create unique index if not exists uq_city_coordinates_name on public.city_coordinates (lower(name));

alter table public.city_coordinates enable row level security;
create policy "cities: signed-in users can read" on public.city_coordinates
  for select to authenticated using (true);
revoke all on public.city_coordinates from anon, authenticated;
grant select on public.city_coordinates to authenticated;

insert into public.city_coordinates (name, state, kind, latitude, longitude, aliases) values
 -- Tamil Nadu districts (district headquarters)
 ('Ariyalur','Tamil Nadu','district',11.14,79.08,'{}'),
 ('Chengalpattu','Tamil Nadu','district',12.69,79.98,'{}'),
 ('Chennai','Tamil Nadu','district',13.08,80.27,'{Madras}'),
 ('Coimbatore','Tamil Nadu','district',11.02,76.96,'{Kovai}'),
 ('Cuddalore','Tamil Nadu','district',11.75,79.77,'{Kadalur}'),
 ('Dharmapuri','Tamil Nadu','district',12.13,78.16,'{}'),
 ('Dindigul','Tamil Nadu','district',10.37,77.98,'{}'),
 ('Erode','Tamil Nadu','district',11.34,77.72,'{}'),
 ('Kallakurichi','Tamil Nadu','district',11.74,78.96,'{}'),
 ('Kancheepuram','Tamil Nadu','district',12.83,79.70,'{Kanchipuram,Kanchi}'),
 ('Kanyakumari','Tamil Nadu','district',8.18,77.43,'{Nagercoil}'),
 ('Karur','Tamil Nadu','district',10.96,78.08,'{}'),
 ('Krishnagiri','Tamil Nadu','district',12.52,78.21,'{}'),
 ('Madurai','Tamil Nadu','district',9.92,78.12,'{}'),
 ('Mayiladuthurai','Tamil Nadu','district',11.10,79.65,'{Mayavaram}'),
 ('Nagapattinam','Tamil Nadu','district',10.77,79.84,'{}'),
 ('Namakkal','Tamil Nadu','district',11.22,78.17,'{}'),
 ('Nilgiris','Tamil Nadu','district',11.41,76.69,'{Ooty,Udhagamandalam}'),
 ('Perambalur','Tamil Nadu','district',11.23,78.88,'{}'),
 ('Pudukkottai','Tamil Nadu','district',10.38,78.82,'{Pudukkotai}'),
 ('Ramanathapuram','Tamil Nadu','district',9.37,78.83,'{}'),
 ('Ranipet','Tamil Nadu','district',12.93,79.33,'{}'),
 ('Salem','Tamil Nadu','district',11.65,78.16,'{}'),
 ('Sivaganga','Tamil Nadu','district',9.85,78.48,'{}'),
 ('Tenkasi','Tamil Nadu','district',8.96,77.31,'{}'),
 ('Thanjavur','Tamil Nadu','district',10.79,79.14,'{Tanjore}'),
 ('Theni','Tamil Nadu','district',10.01,77.48,'{}'),
 ('Thoothukudi','Tamil Nadu','district',8.76,78.13,'{Tuticorin}'),
 ('Tiruchirappalli','Tamil Nadu','district',10.79,78.70,'{Trichy,Tiruchi}'),
 ('Tirunelveli','Tamil Nadu','district',8.71,77.76,'{Nellai}'),
 ('Tirupathur','Tamil Nadu','district',12.50,78.57,'{Tirupattur}'),
 ('Tiruppur','Tamil Nadu','district',11.11,77.34,'{Tirupur}'),
 ('Tiruvallur','Tamil Nadu','district',13.14,79.91,'{Thiruvallur}'),
 ('Tiruvannamalai','Tamil Nadu','district',12.23,79.07,'{Thiruvannamalai}'),
 ('Tiruvarur','Tamil Nadu','district',10.77,79.64,'{Thiruvarur}'),
 ('Vellore','Tamil Nadu','district',12.92,79.13,'{}'),
 ('Viluppuram','Tamil Nadu','district',11.94,79.49,'{Villupuram}'),
 ('Virudhunagar','Tamil Nadu','district',9.59,77.96,'{}'),
 -- Tamil Nadu towns
 ('Avadi','Tamil Nadu','city',13.11,80.10,'{}'),
 ('Hosur','Tamil Nadu','city',12.74,77.83,'{}'),
 ('Karaikudi','Tamil Nadu','city',10.07,78.78,'{}'),
 ('Kodaikanal','Tamil Nadu','city',10.24,77.49,'{}'),
 ('Kumbakonam','Tamil Nadu','city',10.96,79.38,'{}'),
 ('Pollachi','Tamil Nadu','city',10.66,77.01,'{}'),
 ('Rameswaram','Tamil Nadu','city',9.29,79.31,'{}'),
 ('Tambaram','Tamil Nadu','city',12.92,80.12,'{}'),
 -- Other major Indian cities
 ('Puducherry','Puducherry','city',11.93,79.83,'{Pondicherry}'),
 ('Bengaluru','Karnataka','city',12.97,77.59,'{Bangalore}'),
 ('Mysuru','Karnataka','city',12.30,76.64,'{Mysore}'),
 ('Mangaluru','Karnataka','city',12.91,74.86,'{Mangalore}'),
 ('Hyderabad','Telangana','city',17.39,78.49,'{}'),
 ('Visakhapatnam','Andhra Pradesh','city',17.69,83.22,'{Vizag}'),
 ('Vijayawada','Andhra Pradesh','city',16.51,80.65,'{}'),
 ('Tirupati','Andhra Pradesh','city',13.63,79.42,'{}'),
 ('Kochi','Kerala','city',9.93,76.27,'{Cochin,Ernakulam}'),
 ('Thiruvananthapuram','Kerala','city',8.52,76.94,'{Trivandrum}'),
 ('Kozhikode','Kerala','city',11.26,75.78,'{Calicut}'),
 ('Mumbai','Maharashtra','city',19.08,72.88,'{Bombay}'),
 ('Pune','Maharashtra','city',18.52,73.86,'{}'),
 ('Nagpur','Maharashtra','city',21.15,79.09,'{}'),
 ('Delhi','Delhi','city',28.61,77.21,'{"New Delhi"}'),
 ('Kolkata','West Bengal','city',22.57,88.36,'{Calcutta}'),
 ('Ahmedabad','Gujarat','city',23.02,72.57,'{}'),
 ('Surat','Gujarat','city',21.17,72.83,'{}'),
 ('Jaipur','Rajasthan','city',26.91,75.79,'{}'),
 ('Lucknow','Uttar Pradesh','city',26.85,80.95,'{}'),
 ('Bhopal','Madhya Pradesh','city',23.26,77.41,'{}'),
 ('Indore','Madhya Pradesh','city',22.72,75.86,'{}'),
 ('Patna','Bihar','city',25.59,85.14,'{}'),
 ('Bhubaneswar','Odisha','city',20.30,85.82,'{}'),
 ('Chandigarh','Chandigarh','city',30.73,76.78,'{}'),
 ('Guwahati','Assam','city',26.14,91.74,'{}')
on conflict do nothing;

-- Finds coordinates for a typed city/district name ("Trichy", "Coimbatore, Tamil Nadu", ...)
create or replace function public.lookup_city_coords(p_name text)
returns table (latitude double precision, longitude double precision)
language sql stable security definer set search_path = public as $$
  select c.latitude, c.longitude
  from public.city_coordinates c
  where nullif(btrim(split_part(coalesce(p_name, ''), ',', 1)), '') is not null
    and (lower(c.name) = lower(btrim(split_part(p_name, ',', 1)))
         or lower(btrim(split_part(p_name, ',', 1))) = any (select lower(a) from unnest(c.aliases) a))
  order by (c.kind = 'district') desc
  limit 1
$$;
revoke all on function public.lookup_city_coords(text) from public, anon;
grant execute on function public.lookup_city_coords(text) to authenticated;

-- ---------- 2. Approximate coordinates on profiles, donors, requests, community posts ----------
alter table public.profiles       add column if not exists latitude double precision check (latitude between -90 and 90);
alter table public.profiles       add column if not exists longitude double precision check (longitude between -180 and 180);
alter table public.blood_donors   add column if not exists latitude double precision check (latitude between -90 and 90);
alter table public.blood_donors   add column if not exists longitude double precision check (longitude between -180 and 180);
alter table public.blood_requests add column if not exists latitude double precision check (latitude between -90 and 90);
alter table public.blood_requests add column if not exists longitude double precision check (longitude between -180 and 180);
alter table public.help_requests  add column if not exists latitude double precision check (latitude between -90 and 90);
alter table public.help_requests  add column if not exists longitude double precision check (longitude between -180 and 180);

create index if not exists idx_blood_donors_coords on public.blood_donors (latitude, longitude) where latitude is not null;
create index if not exists idx_help_requests_coords on public.help_requests (latitude, longitude) where latitude is not null;
create index if not exists idx_blood_requests_coords on public.blood_requests (latitude, longitude) where latitude is not null;

-- One trigger for all four tables:
--  * both coordinates or neither
--  * if none given (or the city changed), fall back to the city / district centre
--  * always round to 2 decimals (about 1 km) so exact positions are never stored
create or replace function public.fill_and_round_coords()
returns trigger language plpgsql set search_path = public as $$
declare v_lat double precision; v_lon double precision; v_city_changed boolean := false;
begin
  if (new.latitude is null) <> (new.longitude is null) then
    new.latitude := null; new.longitude := null;
  end if;

  if tg_op = 'UPDATE' then
    v_city_changed := (new.city is distinct from old.city) or (new.district is distinct from old.district);
    if v_city_changed and new.latitude is not distinct from old.latitude and new.longitude is not distinct from old.longitude then
      new.latitude := null; new.longitude := null;   -- re-derive from the new city
    end if;
  end if;

  if new.latitude is null then
    select l.latitude, l.longitude into v_lat, v_lon from public.lookup_city_coords(new.city) l;
    if v_lat is null then
      select l.latitude, l.longitude into v_lat, v_lon from public.lookup_city_coords(new.district) l;
    end if;
    if v_lat is null and tg_op = 'UPDATE' and v_city_changed then
      v_lat := old.latitude; v_lon := old.longitude;  -- unknown new city: keep the old point
    end if;
    new.latitude := v_lat; new.longitude := v_lon;
  end if;

  if new.latitude is not null then
    new.latitude  := round(new.latitude::numeric, 2)::double precision;
    new.longitude := round(new.longitude::numeric, 2)::double precision;
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_coords on public.profiles;
create trigger trg_profiles_coords before insert or update on public.profiles
  for each row execute function public.fill_and_round_coords();
drop trigger if exists trg_blood_donors_coords on public.blood_donors;
create trigger trg_blood_donors_coords before insert or update on public.blood_donors
  for each row execute function public.fill_and_round_coords();
drop trigger if exists trg_blood_requests_coords on public.blood_requests;
create trigger trg_blood_requests_coords before insert or update on public.blood_requests
  for each row execute function public.fill_and_round_coords();
drop trigger if exists trg_help_requests_coords on public.help_requests;
create trigger trg_help_requests_coords before insert or update on public.help_requests
  for each row execute function public.fill_and_round_coords();

-- Users may set coordinates (GPS) on their own rows; nothing else changes in their permissions
grant update (latitude, longitude) on public.profiles to authenticated;
grant insert (latitude, longitude), update (latitude, longitude) on public.blood_donors to authenticated;
grant insert (latitude, longitude) on public.blood_requests to authenticated;
grant insert (latitude, longitude) on public.help_requests to authenticated;

-- Back-fill existing rows from their city / district (fires the trigger above)
update public.profiles       set city = city where latitude is null and (city is not null or district is not null);
update public.blood_donors   set city = city where latitude is null;
update public.blood_requests set city = city where latitude is null;
update public.help_requests  set city = city where latitude is null;

-- ---------- 3. Distance-aware donor search (still returns NO phone numbers) ----------
drop function if exists public.search_blood_donors(text, text);

create or replace function public.search_blood_donors(
  p_group text default null,
  p_location text default null,
  p_lat double precision default null,
  p_lon double precision default null,
  p_radius_km double precision default null,
  p_sort_nearest boolean default false
)
returns table (user_id uuid, first_name text, blood_group text, city text, district text,
               last_donated_on date, verification_status text, contact_status text,
               latitude double precision, longitude double precision, distance_km double precision)
language sql stable security definer set search_path = public as $$
  with base as (
    select d.user_id as uid,
           split_part(p.full_name, ' ', 1) as fname,
           d.blood_group as bg, d.city as dcity, d.district as ddistrict,
           d.last_donated_on as ldo, d.verification_status as vstatus,
           (select r.status from public.donor_contact_requests r
             where r.requester_id = auth.uid() and r.donor_user_id = d.user_id) as cstatus,
           d.latitude as lat, d.longitude as lon, d.updated_at as upd,
           case when p_lat is not null and p_lon is not null and d.latitude is not null then
             6371 * 2 * asin(sqrt(least(1,
               sin(radians(d.latitude - p_lat) / 2) ^ 2
               + cos(radians(p_lat)) * cos(radians(d.latitude)) * sin(radians(d.longitude - p_lon) / 2) ^ 2)))
           end as dist
    from public.blood_donors d
    join public.profiles p on p.id = d.user_id
    where auth.uid() is not null
      and d.is_available and d.consent_given and not p.is_suspended
      and d.user_id <> auth.uid()
      and (coalesce(p_group, '') = '' or d.blood_group = p_group)
      and (coalesce(p_location, '') = ''
           or strpos(lower(d.city), lower(p_location)) > 0
           or strpos(lower(coalesce(d.district, '')), lower(p_location)) > 0)
  )
  select b.uid, b.fname, b.bg, b.dcity, b.ddistrict, b.ldo, b.vstatus, b.cstatus, b.lat, b.lon, b.dist
  from base b
  where p_radius_km is null or p_lat is null or (b.dist is not null and b.dist <= p_radius_km)
  order by
    case when p_sort_nearest and p_lat is not null then b.dist end asc nulls last,
    (b.vstatus = 'verified') desc,
    b.upd desc
  limit 100
$$;

revoke all on function public.search_blood_donors(text, text, double precision, double precision, double precision, boolean) from public, anon;
grant execute on function public.search_blood_donors(text, text, double precision, double precision, double precision, boolean) to authenticated;

-- Note on public_profiles: it deliberately does NOT expose coordinates. Profile coordinates are private
-- (used only as your own default search origin). Donors, blood requests and community posts carry their own
-- approximate (~1 km / city-centre) coordinates, which is what the map and distance filter use.
