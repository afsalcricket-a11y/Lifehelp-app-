-- =====================================================================
-- LIFEHELP  |  Part 2 schema  |  001_part2_schema.sql
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Run it ONCE on a fresh LIFEHELP project (re-running fails on existing policies/triggers).
-- Uses Row Level Security on every table.
-- =====================================================================

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- 1. PROFILES ----------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text not null default '' check (char_length(full_name) <= 60),
  role               text not null default 'public'
                     check (role in ('student','jobseeker','donor','volunteer','ngo','public')),
  phone              text check (phone is null or phone ~ '^[0-9+() -]{7,15}$'),
  city               text check (city is null or char_length(city) <= 60),
  district           text check (district is null or char_length(district) <= 60),
  state              text check (state is null or char_length(state) <= 60),
  blood_group        text check (blood_group is null or blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  is_volunteer       boolean not null default false,
  ngo_name           text check (ngo_name is null or char_length(ngo_name) <= 100),
  ngo_verified       boolean not null default false,   -- set by admins only
  is_admin           boolean not null default false,   -- set by admins only
  is_suspended       boolean not null default false,   -- set by admins only
  preferred_language text not null default 'en' check (preferred_language in ('en','ta')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role/permission helpers (SECURITY DEFINER so policies can call them safely)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.can_post()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and not coalesce((select is_suspended from public.profiles where id = auth.uid()), false)
$$;

-- Auto-create a profile whenever someone registers
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text;
begin
  r := coalesce(new.raw_user_meta_data->>'role', 'public');
  if r not in ('student','jobseeker','donor','volunteer','ngo','public') then r := 'public'; end if;
  insert into public.profiles (id, full_name, role, is_volunteer)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 60), r, r = 'volunteer')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Back-fill profiles for accounts created in Part 1
insert into public.profiles (id, full_name, role, is_volunteer)
select u.id,
       left(coalesce(u.raw_user_meta_data->>'full_name', ''), 60),
       case when u.raw_user_meta_data->>'role' in ('student','jobseeker','donor','volunteer','ngo','public')
            then u.raw_user_meta_data->>'role' else 'public' end,
       (u.raw_user_meta_data->>'role') = 'volunteer'
from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Only safe columns are editable by users (admin flags, verification and suspension are NOT)
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, role, phone, city, district, state, blood_group,
              is_volunteer, ngo_name, preferred_language) on public.profiles to authenticated;

-- Safe, phone-free view other signed-in users may read (names, roles, verified badge)
create or replace view public.public_profiles as
  select id, full_name, role, city, district, is_volunteer, ngo_name, ngo_verified
  from public.profiles
  where not is_suspended;
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;

-- ---------- 2. BLOOD DONOR NETWORK ----------
create table if not exists public.blood_donors (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.profiles(id) on delete cascade,
  blood_group         text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  city                text not null check (char_length(city) between 2 and 60),
  district            text check (district is null or char_length(district) <= 60),
  contact_phone       text not null check (contact_phone ~ '^[0-9+() -]{7,15}$'),
  is_available        boolean not null default true,
  last_donated_on     date,
  consent_given       boolean not null default false check (consent_given),
  consent_at          timestamptz not null default now(),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_blood_donors_group on public.blood_donors (blood_group) where is_available;
create index if not exists idx_blood_donors_city on public.blood_donors (lower(city));
create trigger trg_blood_donors_updated before update on public.blood_donors
  for each row execute function public.set_updated_at();

alter table public.blood_donors enable row level security;
-- Donor rows (incl. phone) are readable ONLY by the owner or admins. Everyone else uses search_blood_donors().
create policy "donors: read own or admin" on public.blood_donors
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "donors: insert own" on public.blood_donors
  for insert to authenticated with check (user_id = auth.uid() and consent_given and public.can_post());
create policy "donors: update own" on public.blood_donors
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "donors: delete own" on public.blood_donors
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.blood_donors from anon, authenticated;
grant select, delete on public.blood_donors to authenticated;
grant insert (user_id, blood_group, city, district, contact_phone, is_available, last_donated_on, consent_given)
  on public.blood_donors to authenticated;
grant update (blood_group, city, district, contact_phone, is_available, last_donated_on)
  on public.blood_donors to authenticated;

-- Contact requests: a donor shares their number only after accepting
create table if not exists public.donor_contact_requests (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null references public.profiles(id) on delete cascade,
  donor_user_id  uuid not null references public.profiles(id) on delete cascade,
  message        text check (message is null or char_length(message) <= 300),
  status         text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at     timestamptz not null default now(),
  unique (requester_id, donor_user_id),
  check (requester_id <> donor_user_id)
);
create index if not exists idx_dcr_donor on public.donor_contact_requests (donor_user_id, created_at desc);
create index if not exists idx_dcr_requester on public.donor_contact_requests (requester_id);

alter table public.donor_contact_requests enable row level security;
create policy "dcr: read involved" on public.donor_contact_requests
  for select to authenticated using (requester_id = auth.uid() or donor_user_id = auth.uid() or public.is_admin());
create policy "dcr: insert as requester" on public.donor_contact_requests
  for insert to authenticated with check (requester_id = auth.uid() and public.can_post());
create policy "dcr: donor updates status" on public.donor_contact_requests
  for update to authenticated using (donor_user_id = auth.uid()) with check (donor_user_id = auth.uid());

revoke all on public.donor_contact_requests from anon, authenticated;
grant select on public.donor_contact_requests to authenticated;
grant insert (requester_id, donor_user_id, message) on public.donor_contact_requests to authenticated;
grant update (status) on public.donor_contact_requests to authenticated;

-- Blood assistance requests
create table if not exists public.blood_requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  blood_group   text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units         int  not null default 1 check (units between 1 and 20),
  hospital      text not null check (char_length(hospital) between 2 and 120),
  city          text not null check (char_length(city) between 2 and 60),
  district      text check (district is null or char_length(district) <= 60),
  urgency       text not null default 'normal' check (urgency in ('normal','urgent','critical')),
  contact_phone text not null check (contact_phone ~ '^[0-9+() -]{7,15}$'),
  note          text check (note is null or char_length(note) <= 500),
  status        text not null default 'open' check (status in ('open','fulfilled','closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_blood_requests_open on public.blood_requests (status, created_at desc);
create index if not exists idx_blood_requests_group on public.blood_requests (blood_group);
create index if not exists idx_blood_requests_requester on public.blood_requests (requester_id);
create trigger trg_blood_requests_updated before update on public.blood_requests
  for each row execute function public.set_updated_at();

alter table public.blood_requests enable row level security;
create policy "bloodreq: read open or own" on public.blood_requests
  for select to authenticated using (status = 'open' or requester_id = auth.uid() or public.is_admin());
create policy "bloodreq: insert own" on public.blood_requests
  for insert to authenticated with check (requester_id = auth.uid() and public.can_post());
create policy "bloodreq: update own" on public.blood_requests
  for update to authenticated using (requester_id = auth.uid()) with check (requester_id = auth.uid());
create policy "bloodreq: delete own" on public.blood_requests
  for delete to authenticated using (requester_id = auth.uid());

revoke all on public.blood_requests from anon, authenticated;
grant select, delete on public.blood_requests to authenticated;
grant insert (requester_id, blood_group, units, hospital, city, district, urgency, contact_phone, note)
  on public.blood_requests to authenticated;
grant update (status, note, units, urgency) on public.blood_requests to authenticated;

-- Donor search: returns NO phone numbers, only first name + area
create or replace function public.search_blood_donors(p_group text default null, p_location text default null)
returns table (user_id uuid, first_name text, blood_group text, city text, district text,
               last_donated_on date, verification_status text, contact_status text)
language sql stable security definer set search_path = public as $$
  select d.user_id,
         split_part(p.full_name, ' ', 1),
         d.blood_group, d.city, d.district, d.last_donated_on, d.verification_status,
         (select r.status from public.donor_contact_requests r
           where r.requester_id = auth.uid() and r.donor_user_id = d.user_id)
  from public.blood_donors d
  join public.profiles p on p.id = d.user_id
  where auth.uid() is not null
    and d.is_available and d.consent_given and not p.is_suspended
    and d.user_id <> auth.uid()
    and (coalesce(p_group, '') = '' or d.blood_group = p_group)
    and (coalesce(p_location, '') = ''
         or strpos(lower(d.city), lower(p_location)) > 0
         or strpos(lower(coalesce(d.district, '')), lower(p_location)) > 0)
  order by (d.verification_status = 'verified') desc, d.updated_at desc
  limit 100
$$;

-- Returns a donor's phone ONLY if that donor accepted the caller's request
create or replace function public.get_donor_contact(p_donor_user_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select d.contact_phone
  from public.blood_donors d
  where d.user_id = p_donor_user_id
    and d.is_available
    and exists (select 1 from public.donor_contact_requests r
                where r.requester_id = auth.uid()
                  and r.donor_user_id = p_donor_user_id
                  and r.status = 'accepted')
$$;

revoke all on function public.search_blood_donors(text, text) from public, anon;
revoke all on function public.get_donor_contact(uuid) from public, anon;
grant execute on function public.search_blood_donors(text, text) to authenticated;
grant execute on function public.get_donor_contact(uuid) to authenticated;

-- ---------- 3. COMMUNITY HELP ----------
create table if not exists public.help_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null default 'request' check (kind in ('request','offer')),
  category    text not null check (category in ('medical','food','education','shelter','transport','elderly','other')),
  title       text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 1000),
  city        text not null check (char_length(city) between 2 and 60),
  district    text check (district is null or char_length(district) <= 60),
  status      text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  accepted_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_help_status_created on public.help_requests (status, created_at desc);
create index if not exists idx_help_category on public.help_requests (category);
create index if not exists idx_help_user on public.help_requests (user_id);
create trigger trg_help_requests_updated before update on public.help_requests
  for each row execute function public.set_updated_at();

alter table public.help_requests enable row level security;
create policy "help: read non-cancelled or own" on public.help_requests
  for select to authenticated using (status <> 'cancelled' or user_id = auth.uid() or public.is_admin());
create policy "help: insert own" on public.help_requests
  for insert to authenticated with check (user_id = auth.uid() and public.can_post());
create policy "help: update own" on public.help_requests
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "help: delete own" on public.help_requests
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.help_requests from anon, authenticated;
grant select, delete on public.help_requests to authenticated;
grant insert (user_id, kind, category, title, description, city, district) on public.help_requests to authenticated;
grant update (status, accepted_by, title, description) on public.help_requests to authenticated;

create table if not exists public.help_responses (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.help_requests(id) on delete cascade,
  responder_id uuid not null references public.profiles(id) on delete cascade,
  message      text not null check (char_length(message) between 2 and 300),
  created_at   timestamptz not null default now(),
  unique (request_id, responder_id)
);
create index if not exists idx_help_resp_request on public.help_responses (request_id);
create index if not exists idx_help_resp_responder on public.help_responses (responder_id);

alter table public.help_responses enable row level security;
create policy "responses: read own or post owner" on public.help_responses
  for select to authenticated using (
    responder_id = auth.uid()
    or exists (select 1 from public.help_requests h where h.id = request_id and h.user_id = auth.uid())
    or public.is_admin());
create policy "responses: insert own on open posts" on public.help_responses
  for insert to authenticated with check (
    responder_id = auth.uid() and public.can_post()
    and exists (select 1 from public.help_requests h
                where h.id = request_id and h.status = 'open' and h.user_id <> auth.uid()));
create policy "responses: delete own" on public.help_responses
  for delete to authenticated using (responder_id = auth.uid());

revoke all on public.help_responses from anon, authenticated;
grant select, delete on public.help_responses to authenticated;
grant insert (request_id, responder_id, message) on public.help_responses to authenticated;

-- ---------- 4. JOB FINDER ----------
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  posted_by     uuid not null references public.profiles(id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 100),
  company       text not null check (char_length(company) between 2 and 100),
  description   text not null check (char_length(description) between 10 and 2000),
  requirements  text check (requirements is null or char_length(requirements) <= 1000),
  city          text not null check (char_length(city) between 2 and 60),
  district      text check (district is null or char_length(district) <= 60),
  job_type      text not null check (job_type in ('full_time','part_time','contract','internship','daily_wage')),
  salary_min    int check (salary_min is null or salary_min >= 0),
  salary_max    int check (salary_max is null or salary_max >= 0),
  apply_contact text not null check (char_length(apply_contact) between 3 and 200),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_max >= salary_min)
);
create index if not exists idx_jobs_active_created on public.jobs (is_active, created_at desc);
create index if not exists idx_jobs_city on public.jobs (lower(city));
create index if not exists idx_jobs_type on public.jobs (job_type);
create index if not exists idx_jobs_poster on public.jobs (posted_by);
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
create policy "jobs: read active or own" on public.jobs
  for select to authenticated using (is_active or posted_by = auth.uid() or public.is_admin());
create policy "jobs: insert own" on public.jobs
  for insert to authenticated with check (posted_by = auth.uid() and public.can_post());
create policy "jobs: update own" on public.jobs
  for update to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());
create policy "jobs: delete own" on public.jobs
  for delete to authenticated using (posted_by = auth.uid());

revoke all on public.jobs from anon, authenticated;
grant select, delete on public.jobs to authenticated;
grant insert (posted_by, title, company, description, requirements, city, district, job_type, salary_min, salary_max, apply_contact)
  on public.jobs to authenticated;
grant update (is_active) on public.jobs to authenticated;

-- ---------- 5. EDUCATION ----------
create table if not exists public.education_resources (
  id          uuid primary key default gen_random_uuid(),
  posted_by   uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 120),
  description text check (description is null or char_length(description) <= 1000),
  category    text not null check (category in ('study_material','scholarship','course','exam_prep')),
  url         text not null check (url ~* '^https?://[^ ]+$' and char_length(url) <= 500),
  language    text not null default 'en' check (language in ('en','ta','both')),
  deadline    date,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_edu_active_created on public.education_resources (is_active, created_at desc);
create index if not exists idx_edu_category on public.education_resources (category);
create index if not exists idx_edu_poster on public.education_resources (posted_by);
create trigger trg_edu_updated before update on public.education_resources
  for each row execute function public.set_updated_at();

alter table public.education_resources enable row level security;
create policy "edu: read active or own" on public.education_resources
  for select to authenticated using (is_active or posted_by = auth.uid() or public.is_admin());
create policy "edu: insert own" on public.education_resources
  for insert to authenticated with check (posted_by = auth.uid() and public.can_post());
create policy "edu: update own" on public.education_resources
  for update to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());
create policy "edu: delete own" on public.education_resources
  for delete to authenticated using (posted_by = auth.uid());

revoke all on public.education_resources from anon, authenticated;
grant select, delete on public.education_resources to authenticated;
grant insert (posted_by, title, description, category, url, language, deadline) on public.education_resources to authenticated;
grant update (is_active) on public.education_resources to authenticated;

-- ---------- 6. DONATIONS ----------
create table if not exists public.donation_items (
  id          uuid primary key default gen_random_uuid(),
  donor_id    uuid not null references public.profiles(id) on delete cascade,
  category    text not null check (category in ('books','clothes','food','household','other')),
  title       text not null check (char_length(title) between 3 and 100),
  description text check (description is null or char_length(description) <= 500),
  quantity    int  not null default 1 check (quantity between 1 and 1000),
  condition   text not null default 'good' check (condition in ('new','good','fair')),
  city        text not null check (char_length(city) between 2 and 60),
  district    text check (district is null or char_length(district) <= 60),
  status      text not null default 'available' check (status in ('available','reserved','donated','withdrawn')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_don_status_created on public.donation_items (status, created_at desc);
create index if not exists idx_don_category on public.donation_items (category);
create index if not exists idx_don_donor on public.donation_items (donor_id);
create trigger trg_don_updated before update on public.donation_items
  for each row execute function public.set_updated_at();

alter table public.donation_items enable row level security;
create policy "donitems: read visible or own" on public.donation_items
  for select to authenticated using (status <> 'withdrawn' or donor_id = auth.uid() or public.is_admin());
create policy "donitems: insert own" on public.donation_items
  for insert to authenticated with check (donor_id = auth.uid() and public.can_post());
create policy "donitems: update own" on public.donation_items
  for update to authenticated using (donor_id = auth.uid()) with check (donor_id = auth.uid());
create policy "donitems: delete own" on public.donation_items
  for delete to authenticated using (donor_id = auth.uid());

revoke all on public.donation_items from anon, authenticated;
grant select, delete on public.donation_items to authenticated;
grant insert (donor_id, category, title, description, quantity, condition, city, district) on public.donation_items to authenticated;
grant update (status) on public.donation_items to authenticated;

create table if not exists public.donation_requests (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.donation_items(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message      text check (message is null or char_length(message) <= 300),
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now(),
  unique (item_id, requester_id)
);
create index if not exists idx_donreq_item on public.donation_requests (item_id);
create index if not exists idx_donreq_requester on public.donation_requests (requester_id);

alter table public.donation_requests enable row level security;
create policy "donreq: read involved" on public.donation_requests
  for select to authenticated using (
    requester_id = auth.uid()
    or exists (select 1 from public.donation_items i where i.id = item_id and i.donor_id = auth.uid())
    or public.is_admin());
create policy "donreq: insert on available items" on public.donation_requests
  for insert to authenticated with check (
    requester_id = auth.uid() and public.can_post()
    and exists (select 1 from public.donation_items i
                where i.id = item_id and i.status = 'available' and i.donor_id <> auth.uid()));
create policy "donreq: donor updates status" on public.donation_requests
  for update to authenticated
  using (exists (select 1 from public.donation_items i where i.id = item_id and i.donor_id = auth.uid()))
  with check (exists (select 1 from public.donation_items i where i.id = item_id and i.donor_id = auth.uid()));
create policy "donreq: requester withdraws" on public.donation_requests
  for delete to authenticated using (requester_id = auth.uid());

revoke all on public.donation_requests from anon, authenticated;
grant select, delete on public.donation_requests to authenticated;
grant insert (item_id, requester_id, message) on public.donation_requests to authenticated;
grant update (status) on public.donation_requests to authenticated;

-- ---------- 7. EMERGENCY CONTACTS (private, per user) ----------
create table if not exists public.emergency_contacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null check (char_length(name) between 2 and 60),
  relationship text check (relationship is null or char_length(relationship) <= 40),
  phone        text not null check (phone ~ '^[0-9+() -]{3,15}$'),
  created_at   timestamptz not null default now()
);
create index if not exists idx_ec_user on public.emergency_contacts (user_id);

create or replace function public.limit_emergency_contacts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.emergency_contacts where user_id = new.user_id) >= 10 then
    raise exception 'Maximum 10 emergency contacts' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger trg_ec_limit before insert on public.emergency_contacts
  for each row execute function public.limit_emergency_contacts();

alter table public.emergency_contacts enable row level security;
create policy "ec: read own" on public.emergency_contacts
  for select to authenticated using (user_id = auth.uid());
create policy "ec: insert own" on public.emergency_contacts
  for insert to authenticated with check (user_id = auth.uid());
create policy "ec: delete own" on public.emergency_contacts
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.emergency_contacts from anon, authenticated;
grant select, delete on public.emergency_contacts to authenticated;
grant insert (user_id, name, relationship, phone) on public.emergency_contacts to authenticated;

-- Note: every table above already revokes all access from the anon (signed-out) role.
