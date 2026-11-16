-- =====================================================================
-- LIFEHELP  |  Part 3  |  002_part3_admin.sql
-- Run AFTER 001_part2_schema.sql. Run once: SQL Editor > New query > paste > Run.
-- =====================================================================

-- ---------- 1. Moderation flag on user-generated content ----------
alter table public.help_requests      add column if not exists is_hidden boolean not null default false;
alter table public.jobs               add column if not exists is_hidden boolean not null default false;
alter table public.education_resources add column if not exists is_hidden boolean not null default false;
alter table public.donation_items     add column if not exists is_hidden boolean not null default false;
alter table public.blood_requests     add column if not exists is_hidden boolean not null default false;
-- (users cannot edit is_hidden: it is not in any column-level UPDATE grant from Part 2)

-- Hidden content disappears for everyone except its owner and admins
drop policy if exists "help: read non-cancelled or own" on public.help_requests;
create policy "help: read non-cancelled or own" on public.help_requests
  for select to authenticated using (
    (status <> 'cancelled' and not is_hidden) or user_id = auth.uid() or public.is_admin());

drop policy if exists "bloodreq: read open or own" on public.blood_requests;
create policy "bloodreq: read open or own" on public.blood_requests
  for select to authenticated using (
    (status = 'open' and not is_hidden) or requester_id = auth.uid() or public.is_admin());

drop policy if exists "jobs: read active or own" on public.jobs;
create policy "jobs: read active or own" on public.jobs
  for select to authenticated using (
    (is_active and not is_hidden) or posted_by = auth.uid() or public.is_admin());

drop policy if exists "edu: read active or own" on public.education_resources;
create policy "edu: read active or own" on public.education_resources
  for select to authenticated using (
    (is_active and not is_hidden) or posted_by = auth.uid() or public.is_admin());

drop policy if exists "donitems: read visible or own" on public.donation_items;
create policy "donitems: read visible or own" on public.donation_items
  for select to authenticated using (
    (status <> 'withdrawn' and not is_hidden) or donor_id = auth.uid() or public.is_admin());

-- ---------- 2. Reports ----------
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.profiles(id) on delete cascade,
  target_type     text not null check (target_type in ('help_request','job','education','donation','blood_request','profile')),
  target_id       uuid not null,
  reason          text not null check (reason in ('spam','scam','inappropriate','harassment','false_info','other')),
  details         text check (details is null or char_length(details) <= 500),
  status          text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 500),
  resolved_by     uuid references public.profiles(id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index if not exists idx_reports_status_created on public.reports (status, created_at desc);
create index if not exists idx_reports_target on public.reports (target_type, target_id);
create index if not exists idx_reports_reporter on public.reports (reporter_id);

-- Checks the reported item really exists (keeps junk reports out)
create or replace function public.report_target_exists(p_type text, p_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_table text; v_exists boolean;
begin
  v_table := case p_type
    when 'help_request'  then 'help_requests'
    when 'job'           then 'jobs'
    when 'education'     then 'education_resources'
    when 'donation'      then 'donation_items'
    when 'blood_request' then 'blood_requests'
    when 'profile'       then 'profiles'
    else null end;
  if v_table is null then return false; end if;
  execute format('select exists (select 1 from public.%I where id = $1)', v_table) into v_exists using p_id;
  return coalesce(v_exists, false);
end $$;
revoke all on function public.report_target_exists(text, uuid) from public, anon;
grant execute on function public.report_target_exists(text, uuid) to authenticated;

alter table public.reports enable row level security;
create policy "reports: read own or admin" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy "reports: any signed-in user can report" on public.reports
  for insert to authenticated with check (
    reporter_id = auth.uid()
    and public.can_post()
    and public.report_target_exists(target_type, target_id)
    and not (target_type = 'profile' and target_id = auth.uid()));
-- No UPDATE/DELETE policies: admins resolve reports only through admin_resolve_report()

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (reporter_id, target_type, target_id, reason, details) on public.reports to authenticated;

-- ---------- 3. Admin activity log ----------
create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_created on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
create policy "audit: admins read" on public.admin_audit_log
  for select to authenticated using (public.is_admin());
revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

create or replace function public.log_admin_action(p_action text, p_type text, p_id uuid, p_note text)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, note)
  values (auth.uid(), p_action, p_type, p_id, left(p_note, 300));
$$;
revoke all on function public.log_admin_action(text, text, uuid, text) from public, anon, authenticated;

create or replace function public.require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
end $$;
revoke all on function public.require_admin() from public, anon, authenticated;

-- ---------- 4. Admin functions (each one re-checks is_admin) ----------
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return jsonb_build_object(
    'total_users',          (select count(*) from public.profiles),
    'suspended_users',      (select count(*) from public.profiles where is_suspended),
    'active_donors',        (select count(*) from public.blood_donors where is_available),
    'open_help_requests',   (select count(*) from public.help_requests where status = 'open' and not is_hidden),
    'pending_verifications',(select count(*) from public.blood_donors where verification_status = 'pending')
                          + (select count(*) from public.profiles where role = 'ngo' and ngo_name is not null and not ngo_verified),
    'open_reports',         (select count(*) from public.reports where status = 'open')
  );
end $$;

create or replace function public.admin_set_donor_verification(p_user_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if p_status not in ('unverified','pending','verified') then
    raise exception 'Invalid status' using errcode = '23514';
  end if;
  update public.blood_donors set verification_status = p_status where user_id = p_user_id;
  if not found then raise exception 'Donor not found' using errcode = 'P0002'; end if;
  perform public.log_admin_action('set_donor_verification', 'profile', p_user_id, p_status);
end $$;

create or replace function public.admin_set_ngo_verified(p_user_id uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  update public.profiles set ngo_verified = p_verified where id = p_user_id and role = 'ngo';
  if not found then raise exception 'Organisation not found' using errcode = 'P0002'; end if;
  perform public.log_admin_action('set_ngo_verified', 'profile', p_user_id, case when p_verified then 'verified' else 'not verified' end);
end $$;

create or replace function public.admin_set_suspended(p_user_id uuid, p_suspended boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if p_user_id = auth.uid() then
    raise exception 'You cannot suspend yourself' using errcode = '23514';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and is_admin) then
    raise exception 'Administrators cannot be suspended here' using errcode = '23514';
  end if;
  update public.profiles set is_suspended = p_suspended where id = p_user_id;
  if not found then raise exception 'User not found' using errcode = 'P0002'; end if;
  perform public.log_admin_action(case when p_suspended then 'suspend_user' else 'unsuspend_user' end,
                                  'profile', p_user_id, p_reason);
end $$;

-- p_action: 'hide' | 'restore' | 'remove'
create or replace function public.admin_moderate_content(p_type text, p_id uuid, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_table text; v_rows int;
begin
  perform public.require_admin();
  v_table := case p_type
    when 'help_request'  then 'help_requests'
    when 'job'           then 'jobs'
    when 'education'     then 'education_resources'
    when 'donation'      then 'donation_items'
    when 'blood_request' then 'blood_requests'
    else null end;
  if v_table is null or p_action not in ('hide','restore','remove') then
    raise exception 'Invalid request' using errcode = '22023';
  end if;
  if p_action = 'remove' then
    execute format('delete from public.%I where id = $1', v_table) using p_id;
  else
    execute format('update public.%I set is_hidden = $1 where id = $2', v_table) using (p_action = 'hide'), p_id;
  end if;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then raise exception 'Content not found' using errcode = 'P0002'; end if;
  perform public.log_admin_action(p_action || '_content', p_type, p_id, p_note);
end $$;

-- p_status: 'resolved' | 'dismissed'
create or replace function public.admin_resolve_report(p_report_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if p_status not in ('resolved','dismissed') then
    raise exception 'Invalid status' using errcode = '23514';
  end if;
  update public.reports
     set status = p_status, resolution_note = left(p_note, 500), resolved_by = auth.uid(), resolved_at = now()
   where id = p_report_id;
  if not found then raise exception 'Report not found' using errcode = 'P0002'; end if;
  perform public.log_admin_action('report_' || p_status, 'report', p_report_id, p_note);
end $$;

-- Donors can ask admins to verify them (only moves unverified -> pending)
create or replace function public.request_donor_verification()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.blood_donors set verification_status = 'pending'
   where user_id = auth.uid() and verification_status = 'unverified';
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'admin_stats()', 'admin_set_donor_verification(uuid,text)', 'admin_set_ngo_verified(uuid,boolean)',
    'admin_set_suspended(uuid,boolean,text)', 'admin_moderate_content(text,uuid,text,text)',
    'admin_resolve_report(uuid,text,text)', 'request_donor_verification()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- =====================================================================
-- 5. MAKE YOUR TEST ACCOUNT AN ADMIN (run this separately, after the above)
--    Replace the email with the one you registered with.
--
--   update public.profiles
--      set is_admin = true
--    where id = (select id from auth.users where email = 'you@example.com');
--
--   -- check it worked (should return one row with is_admin = true):
--   select id, full_name, is_admin from public.profiles where is_admin;
--
-- Then sign out and sign in again in the app. An "Admin dashboard" button appears on Profile.
-- To remove admin rights later: set is_admin = false with the same query.
-- =====================================================================
