-- =====================================================================
-- FEM RISE CLUB — CHALLENGE PLATFORM SCHEMA (Supabase / Postgres)
-- Run this once in the Supabase SQL editor (or `supabase db push`).
-- Designed to support multiple future challenges, not just this one.
--
-- Golden rule: participants can NEVER write streaks, points, challenge
-- days, check-in timestamps, restore status or statuses directly.
-- All of that happens inside SECURITY DEFINER functions below.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------- ENUMS ----------
create type public.user_role as enum ('participant', 'admin');
create type public.privacy_setting as enum ('public', 'private');
create type public.challenge_status as enum ('draft', 'registration_open', 'live', 'ended');
create type public.participant_status as enum
  ('pending_payment', 'active', 'restore_pending', 'eliminated', 'completed', 'suspended');
create type public.checkin_status as enum ('valid', 'invalid', 'removed');
create type public.day_result_type as enum ('missed', 'restored');
create type public.payment_type as enum ('registration', 'restore');
create type public.payment_status as enum ('created', 'paid', 'failed', 'refunded');
create type public.refund_status as enum ('none', 'requested', 'processed');
create type public.follow_status as enum ('pending', 'approved', 'declined');
create type public.report_status as enum ('open', 'reviewed', 'actioned', 'dismissed');
create type public.unrestored_miss_policy as enum ('eliminate', 'reset_streak');
create type public.notification_audience as enum ('participant', 'admin');

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  username citext not null unique check (username ~ '^[a-z0-9._]{3,24}$'),
  avatar_path text,
  city text,
  primary_sport text,
  privacy public.privacy_setting not null default 'public',
  role public.user_role not null default 'participant',
  is_suspended boolean not null default false,
  onboarded boolean not null default false, -- false for Google sign-ups until they add username/phone/city/sport
  created_at timestamptz not null default now()
);

-- Private contact details — only the owner and admins can read.
create table public.profile_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email text not null,
  phone text
);

-- ---------- CHALLENGES (all admin-configurable settings live here) ----------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status public.challenge_status not null default 'draft',
  start_date date,
  duration_days int not null default 30 check (duration_days between 1 and 365),
  timezone text not null default 'Asia/Kolkata',
  registration_fee_paise int not null default 9900 check (registration_fee_paise >= 0),
  restore_fee_paise int not null default 5000 check (restore_fee_paise >= 0),
  daily_checkin_points int not null default 10,
  referral_points int not null default 10,
  bonus_rules jsonb not null default '{}'::jsonb, -- future bonus point rules
  -- Deadline is deliberately NULL until the admin sets it. No deadline = no automatic "missed" marking.
  checkin_deadline time,
  unrestored_miss_policy public.unrestored_miss_policy not null default 'eliminate',
  last_processed_day int not null default 0,
  prize_headline text not null default 'Win ₹30,000 prize money',
  prize_text text,
  prize_terms text,
  rules jsonb not null default '[]'::jsonb,
  community_guidelines text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- PARTICIPANTS ----------
create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.participant_status not null default 'pending_payment',
  referral_code citext not null,
  referred_by uuid references public.challenge_participants (id),
  joined_at timestamptz not null default now(),
  activated_at timestamptz,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  checkin_count int not null default 0,
  daily_points int not null default 0,
  referral_points int not null default 0,
  bonus_points int not null default 0,
  total_points int generated always as (daily_points + referral_points + bonus_points) stored,
  restore_used boolean not null default false,
  restore_used_on_day int,
  pending_restore_day int, -- the missed day that can still be restored
  eliminated_on_day int,
  eliminated_at timestamptz,
  elimination_reason text,
  previous_streak_at_elimination int,
  unique (challenge_id, user_id),
  unique (challenge_id, referral_code)
);
create index on public.challenge_participants (challenge_id, status);
create index on public.challenge_participants (challenge_id, total_points desc);

-- ---------- DAILY CHECK-INS ----------
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.challenge_participants (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_day int not null,
  image_path text not null, -- storage path in the private "snaps" bucket
  image_hash text, -- for duplicate-photo detection
  sport text not null,
  caption text check (char_length(caption) <= 280),
  submitted_at timestamptz not null default now(),
  status public.checkin_status not null default 'valid',
  status_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  unique (participant_id, challenge_day)
);
create index on public.daily_checkins (challenge_id, challenge_day);
create index on public.daily_checkins (user_id, submitted_at desc);
create index on public.daily_checkins (image_hash);

-- Missed / restored days (completed days come from daily_checkins).
create table public.day_results (
  participant_id uuid not null references public.challenge_participants (id) on delete cascade,
  challenge_day int not null,
  result public.day_result_type not null,
  recorded_at timestamptz not null default now(),
  primary key (participant_id, challenge_day)
);

-- ---------- REFERRALS ----------
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  referrer_participant_id uuid not null references public.challenge_participants (id) on delete cascade,
  referred_participant_id uuid not null unique references public.challenge_participants (id) on delete cascade,
  referral_code citext not null,
  payment_status public.payment_status not null default 'created',
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  awarded_at timestamptz
);

-- ---------- FOLLOWS ----------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  status public.follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------- PAYMENTS & RESTORES ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  participant_id uuid not null references public.challenge_participants (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  payment_type public.payment_type not null,
  amount_paise int not null,
  currency text not null default 'INR',
  status public.payment_status not null default 'created',
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text,
  challenge_day int, -- for restores: the day being restored
  failure_reason text,
  refund_status public.refund_status not null default 'none',
  raw_event jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on public.payments (challenge_id, payment_type, status);

create table public.restores (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.challenge_participants (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  challenge_day int not null,
  payment_id uuid not null references public.payments (id),
  status text not null default 'restored',
  created_at timestamptz not null default now()
);

-- ---------- MODERATION, LOGS, TIMELINE, NOTIFICATIONS ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  checkin_id uuid references public.daily_checkins (id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  action_taken text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id),
  action text not null,
  affected_user_id uuid references public.profiles (id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Per-participant activity timeline (admin "progress timeline").
create table public.activity_events (
  id bigint generated always as identity primary key,
  participant_id uuid not null references public.challenge_participants (id) on delete cascade,
  event_type text not null, -- joined, paid, checkin, missed, restore_purchased, eliminated, completed, referral, invalidated...
  challenge_day int,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.activity_events (participant_id, created_at);

create table public.notifications (
  id bigint generated always as identity primary key,
  audience public.notification_audience not null default 'participant',
  user_id uuid references public.profiles (id) on delete cascade, -- null for admin-wide notifications
  type text not null, -- daily_reminder, milestone, referral, missed, restore, admin_missed_spike, report, payment_failed ...
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.point_adjustments (
  id bigint generated always as identity primary key,
  participant_id uuid not null references public.challenge_participants (id) on delete cascade,
  points int not null,
  reason text not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not is_suspended);
$$;

-- Can the current viewer see this user's snaps?
create or replace function public.can_view_snaps(p_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    p_owner = auth.uid()
    or public.is_admin()
    or exists (select 1 from profiles where id = p_owner and privacy = 'public' and not is_suspended)
    or exists (select 1 from follows where follower_id = auth.uid() and following_id = p_owner and status = 'approved');
$$;

-- Challenge day for a moment in time (1-based). Can be <1 (before start) or > duration (after end).
create or replace function public.challenge_day_at(p_challenge uuid, p_at timestamptz default now())
returns int language sql stable set search_path = public as $$
  select ((p_at at time zone c.timezone)::date - c.start_date) + 1
  from challenges c where c.id = p_challenge and c.start_date is not null;
$$;

-- Deadline (as timestamptz) for a given challenge day. NULL when the admin hasn't configured one.
create or replace function public.day_deadline(p_challenge uuid, p_day int)
returns timestamptz language sql stable set search_path = public as $$
  select ((c.start_date + (p_day - 1)) + c.checkin_deadline) at time zone c.timezone
  from challenges c where c.id = p_challenge and c.start_date is not null and c.checkin_deadline is not null;
$$;

create or replace function public.log_activity(p_participant uuid, p_type text, p_day int, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into activity_events (participant_id, event_type, challenge_day, details) values (p_participant, p_type, p_day, p_details);
$$;

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text default null)
returns void language sql security definer set search_path = public as $$
  insert into notifications (audience, user_id, type, title, body) values ('participant', p_user, p_type, p_title, p_body);
$$;

create or replace function public.notify_admins(p_type text, p_title text, p_body text default null)
returns void language sql security definer set search_path = public as $$
  insert into notifications (audience, user_id, type, title, body) values ('admin', null, p_type, p_title, p_body);
$$;

-- Recalculate streaks and points for one participant from source records.
-- Completed day = valid check-in. Restored day keeps the streak alive. Missed day resets it.
create or replace function public.recompute_participant(p_participant uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_p challenge_participants%rowtype;
  v_c challenges%rowtype;
  v_day int;
  v_streak int := 0;
  v_longest int := 0;
  v_count int := 0;
  v_done boolean;
  v_result day_result_type;
begin
  select * into v_p from challenge_participants where id = p_participant;
  if not found then return; end if;
  select * into v_c from challenges where id = v_p.challenge_id;

  for v_day in 1 .. v_c.duration_days loop
    select exists (
      select 1 from daily_checkins where participant_id = p_participant and challenge_day = v_day and status = 'valid'
    ) into v_done;
    select result into v_result from day_results where participant_id = p_participant and challenge_day = v_day;

    if v_done then
      v_streak := v_streak + 1;
      v_count := v_count + 1;
    elsif v_result = 'restored' then
      null; -- streak protected, no increment
    elsif v_result = 'missed' then
      v_streak := 0;
    end if;
    v_longest := greatest(v_longest, v_streak);
    v_result := null;
  end loop;

  update challenge_participants set
    current_streak = v_streak,
    longest_streak = v_longest,
    checkin_count = v_count,
    daily_points = v_count * v_c.daily_checkin_points,
    referral_points = coalesce((select sum(points_awarded) from referrals where referrer_participant_id = p_participant), 0),
    bonus_points = coalesce((select sum(points) from point_adjustments where participant_id = p_participant), 0)
  where id = p_participant;
end;
$$;

-- =====================================================================
-- AUTH → PROFILE
-- Signup passes profile fields in auth metadata (options.data).
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_username text := lower(v_meta ->> 'username');
  v_onboarded boolean := v_username is not null;
  v_base text;
begin
  -- Google / OAuth sign-ups have no username yet: create a temporary one from the email.
  if v_username is null then
    v_base := left(regexp_replace(lower(split_part(coalesce(new.email, 'player'), '@', 1)), '[^a-z0-9._]', '', 'g'), 16);
    if length(v_base) < 3 then v_base := 'player'; end if;
    loop
      v_username := v_base || '_' || lpad((floor(random() * 10000))::int::text, 4, '0');
      exit when not exists (select 1 from profiles where username = v_username);
    end loop;
  end if;

  insert into profiles (id, full_name, username, city, primary_sport, privacy, avatar_path, onboarded)
  values (
    new.id,
    coalesce(v_meta ->> 'full_name', v_meta ->> 'name', ''),
    v_username,
    v_meta ->> 'city',
    v_meta ->> 'primary_sport',
    coalesce((v_meta ->> 'privacy')::privacy_setting, 'public'),
    v_meta ->> 'avatar_path',
    v_onboarded
  );
  insert into profile_contacts (user_id, email, phone)
  values (new.id, new.email, coalesce(new.phone, v_meta ->> 'phone'));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Participants may edit their own profile, but never their role or suspension.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role' then
    new.role := old.role;
    new.is_suspended := old.is_suspended;
  end if;
  return new;
end;
$$;
create trigger protect_profile_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- =====================================================================
-- PARTICIPANT ACTIONS (called from the app with the user's session)
-- =====================================================================

-- Step 1 of registration: create a pending participant (activated only after payment).
create or replace function public.join_challenge(p_challenge uuid, p_referral_code text default null)
returns challenge_participants language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_c challenges%rowtype;
  v_profile profiles%rowtype;
  v_row challenge_participants%rowtype;
  v_referrer challenge_participants%rowtype;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select * into v_c from challenges where id = p_challenge;
  if v_c.status not in ('registration_open', 'live') then raise exception 'Registration is closed'; end if;
  select * into v_profile from profiles where id = v_uid;
  if v_profile.is_suspended then raise exception 'Account suspended'; end if;

  select * into v_row from challenge_participants where challenge_id = p_challenge and user_id = v_uid;
  if found then return v_row; end if;

  insert into challenge_participants (challenge_id, user_id, referral_code)
  values (p_challenge, v_uid, v_profile.username)
  returning * into v_row;

  if p_referral_code is not null and length(trim(p_referral_code)) > 0 then
    select * into v_referrer from challenge_participants
      where challenge_id = p_challenge and referral_code = lower(trim(p_referral_code)) and user_id <> v_uid;
    if found then
      update challenge_participants set referred_by = v_referrer.id where id = v_row.id;
      insert into referrals (challenge_id, referrer_participant_id, referred_participant_id, referral_code)
      values (p_challenge, v_referrer.id, v_row.id, lower(trim(p_referral_code)));
      v_row.referred_by := v_referrer.id;
    end if;
  end if;

  perform log_activity(v_row.id, 'joined', null);
  return v_row;
end;
$$;

-- Daily check-in. The system decides the challenge day and timestamp.
create or replace function public.submit_checkin(
  p_challenge uuid, p_image_path text, p_sport text, p_caption text default null, p_image_hash text default null
) returns daily_checkins language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_c challenges%rowtype;
  v_p challenge_participants%rowtype;
  v_day int;
  v_deadline timestamptz;
  v_row daily_checkins%rowtype;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select * into v_c from challenges where id = p_challenge;
  if v_c.status <> 'live' then raise exception 'The challenge is not live'; end if;

  select * into v_p from challenge_participants where challenge_id = p_challenge and user_id = v_uid;
  if not found or v_p.status not in ('active', 'restore_pending') then
    raise exception 'You cannot submit check-ins (status: %)', coalesce(v_p.status::text, 'not joined');
  end if;

  v_day := challenge_day_at(p_challenge, now());
  if v_day is null or v_day < 1 or v_day > v_c.duration_days then raise exception 'No challenge day is open right now'; end if;

  v_deadline := day_deadline(p_challenge, v_day);
  if v_deadline is not null and now() > v_deadline then
    raise exception 'Today''s check-in window has closed';
  end if;

  if p_image_path is null or split_part(p_image_path, '/', 1) <> v_uid::text then
    raise exception 'Invalid image path';
  end if;

  insert into daily_checkins (participant_id, challenge_id, user_id, challenge_day, image_path, image_hash, sport, caption)
  values (v_p.id, p_challenge, v_uid, v_day, p_image_path, p_image_hash, p_sport, nullif(trim(p_caption), ''))
  returning * into v_row;

  perform log_activity(v_p.id, 'checkin', v_day, jsonb_build_object('checkin_id', v_row.id));
  perform recompute_participant(v_p.id);

  select * into v_p from challenge_participants where id = v_p.id;
  if v_p.current_streak in (7, 10, 15, 20, 25, 30) then
    perform notify(v_uid, 'milestone', v_p.current_streak || ' days! You''re on a roll.', null);
  end if;

  -- Flag possible duplicate photo for moderation.
  if p_image_hash is not null and exists (
    select 1 from daily_checkins where image_hash = p_image_hash and id <> v_row.id
  ) then
    perform notify_admins('suspicious_submission', 'Possible duplicate snap', 'Day ' || v_day || ' check-in by @' ||
      (select username from profiles where id = v_uid) || ' matches an earlier image.');
  end if;

  return v_row;
end;
$$;

-- Follow someone. Public profiles are approved instantly; private ones become a request.
create or replace function public.follow_user(p_target uuid)
returns follows language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_privacy privacy_setting;
  v_row follows%rowtype;
begin
  if v_uid is null or v_uid = p_target then raise exception 'Invalid follow'; end if;
  select privacy into v_privacy from profiles where id = p_target;
  insert into follows (follower_id, following_id, status, responded_at)
  values (v_uid, p_target, case when v_privacy = 'public' then 'approved' else 'pending' end::follow_status,
          case when v_privacy = 'public' then now() end)
  on conflict (follower_id, following_id) do update set status = excluded.status, created_at = now()
    where follows.status = 'declined'
  returning * into v_row;
  if v_privacy = 'private' then
    perform notify(p_target, 'follow_request', '@' || (select username from profiles where id = v_uid) || ' wants to follow you');
  end if;
  return v_row;
end;
$$;

create or replace function public.respond_follow(p_follower uuid, p_accept boolean)
returns void language sql security definer set search_path = public as $$
  update follows set status = case when p_accept then 'approved' else 'declined' end::follow_status, responded_at = now()
  where follower_id = p_follower and following_id = auth.uid();
$$;

-- =====================================================================
-- PAYMENT CALLBACKS (service role only — called by the verified webhook)
-- =====================================================================

create or replace function public.apply_registration_payment(p_order_id text, p_payment_id text, p_raw jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_pay payments%rowtype;
  v_ref referrals%rowtype;
  v_c challenges%rowtype;
begin
  select * into v_pay from payments where provider_order_id = p_order_id and payment_type = 'registration' for update;
  if not found then raise exception 'Unknown order %', p_order_id; end if;
  if v_pay.status = 'paid' then return; end if; -- idempotent

  update payments set status = 'paid', provider_payment_id = p_payment_id, paid_at = now(), raw_event = p_raw where id = v_pay.id;
  update challenge_participants set status = 'active', activated_at = now()
    where id = v_pay.participant_id and status = 'pending_payment';
  perform log_activity(v_pay.participant_id, 'paid', null, jsonb_build_object('amount_paise', v_pay.amount_paise));

  -- Referral points only after successful payment.
  select * into v_ref from referrals where referred_participant_id = v_pay.participant_id for update;
  if found and v_ref.points_awarded = 0 then
    select * into v_c from challenges where id = v_pay.challenge_id;
    update referrals set payment_status = 'paid', points_awarded = v_c.referral_points, awarded_at = now() where id = v_ref.id;
    perform recompute_participant(v_ref.referrer_participant_id);
    perform log_activity(v_ref.referrer_participant_id, 'referral', null, jsonb_build_object('referred', v_pay.participant_id));
    perform notify((select user_id from challenge_participants where id = v_ref.referrer_participant_id), 'referral',
      'Someone joined through your referral link. +' || v_c.referral_points || ' points!');
  end if;
end;
$$;

create or replace function public.apply_restore_payment(p_order_id text, p_payment_id text, p_raw jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_pay payments%rowtype;
  v_p challenge_participants%rowtype;
begin
  select * into v_pay from payments where provider_order_id = p_order_id and payment_type = 'restore' for update;
  if not found then raise exception 'Unknown order %', p_order_id; end if;
  if v_pay.status = 'paid' then return; end if;

  update payments set status = 'paid', provider_payment_id = p_payment_id, paid_at = now(), raw_event = p_raw where id = v_pay.id;
  select * into v_p from challenge_participants where id = v_pay.participant_id for update;

  if v_p.status <> 'restore_pending' or v_p.restore_used then
    -- Paid too late or twice: keep the money record and flag for refund review.
    update payments set refund_status = 'requested' where id = v_pay.id;
    perform notify_admins('payment_review', 'Restore paid but not applicable', 'Order ' || p_order_id || ' needs a refund review.');
    return;
  end if;

  update day_results set result = 'restored', recorded_at = now()
    where participant_id = v_p.id and challenge_day = v_p.pending_restore_day;
  insert into restores (participant_id, challenge_id, challenge_day, payment_id)
    values (v_p.id, v_p.challenge_id, v_p.pending_restore_day, v_pay.id);
  update challenge_participants set status = 'active', restore_used = true,
    restore_used_on_day = pending_restore_day, pending_restore_day = null
    where id = v_p.id;
  perform log_activity(v_p.id, 'restore_purchased', v_p.pending_restore_day, jsonb_build_object('amount_paise', v_pay.amount_paise));
  perform recompute_participant(v_p.id);
  perform notify(v_p.user_id, 'restore', 'Restore activated. Your challenge continues.');
end;
$$;

create or replace function public.mark_payment_failed(p_order_id text, p_reason text, p_raw jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update payments set status = 'failed', failure_reason = p_reason, raw_event = p_raw
    where provider_order_id = p_order_id and status = 'created';
  if found then
    perform notify_admins('payment_failed', 'Payment failed', 'Order ' || p_order_id || ': ' || coalesce(p_reason, 'unknown'));
  end if;
end;
$$;

-- =====================================================================
-- DEADLINE PROCESSING — marks missed days and applies Restore / elimination.
-- Runs from pg_cron (see bottom). Does nothing until the admin sets a deadline.
-- =====================================================================
create or replace function public.process_day(p_challenge uuid, p_day int)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_c challenges%rowtype;
  v_p challenge_participants%rowtype;
  v_missed int := 0;
  v_total int := 0;
begin
  select * into v_c from challenges where id = p_challenge for update;
  if v_c.checkin_deadline is null then raise exception 'Check-in deadline is not configured'; end if;

  -- 1) Restore window expired: anyone still restore_pending from an earlier day.
  for v_p in select * from challenge_participants
    where challenge_id = p_challenge and status = 'restore_pending' and pending_restore_day < p_day
  loop
    if v_c.unrestored_miss_policy = 'eliminate' then
      update challenge_participants set status = 'eliminated', eliminated_on_day = v_p.pending_restore_day,
        eliminated_at = now(), elimination_reason = 'Missed check-in and did not use Restore',
        previous_streak_at_elimination = v_p.longest_streak, pending_restore_day = null
        where id = v_p.id;
      perform log_activity(v_p.id, 'eliminated', v_p.pending_restore_day, jsonb_build_object('reason', 'restore_not_used'));
      perform notify(v_p.user_id, 'eliminated', 'Your challenge has ended.', 'The Restore window for your missed day has closed.');
    else
      update challenge_participants set status = 'active', pending_restore_day = null where id = v_p.id;
    end if;
  end loop;

  -- 2) Mark today's missed check-ins.
  for v_p in select cp.* from challenge_participants cp
    where cp.challenge_id = p_challenge and cp.status in ('active', 'restore_pending')
      and not exists (select 1 from daily_checkins d where d.participant_id = cp.id and d.challenge_day = p_day and d.status = 'valid')
      and not exists (select 1 from day_results r where r.participant_id = cp.id and r.challenge_day = p_day)
  loop
    v_missed := v_missed + 1;
    insert into day_results (participant_id, challenge_day, result) values (v_p.id, p_day, 'missed');
    perform log_activity(v_p.id, 'missed', p_day);

    if v_p.restore_used or v_p.status = 'restore_pending' then
      update challenge_participants set status = 'eliminated', eliminated_on_day = p_day, eliminated_at = now(),
        elimination_reason = case when v_p.restore_used then 'Missed check-in after Restore was already used'
                                  else 'Missed another check-in while a Restore was pending' end,
        previous_streak_at_elimination = v_p.current_streak, pending_restore_day = null
        where id = v_p.id;
      perform log_activity(v_p.id, 'eliminated', p_day);
      perform notify(v_p.user_id, 'eliminated', 'Your challenge has ended.', 'You''ve already used your Restore.');
    else
      update challenge_participants set status = 'restore_pending', pending_restore_day = p_day where id = v_p.id;
      perform notify(v_p.user_id, 'missed', 'Your streak broke.', 'You missed today''s check-in. You have ONE Restore available.');
    end if;
    perform recompute_participant(v_p.id);
  end loop;

  -- 3) Last day: everyone still active is a finisher.
  if p_day >= v_c.duration_days then
    for v_p in select * from challenge_participants where challenge_id = p_challenge and status = 'active' loop
      update challenge_participants set status = 'completed' where id = v_p.id;
      perform log_activity(v_p.id, 'completed', p_day);
    end loop;
    update challenges set status = 'ended' where id = p_challenge;
  end if;

  select count(*) into v_total from challenge_participants
    where challenge_id = p_challenge and status not in ('pending_payment', 'suspended');
  if v_total > 0 and v_missed::numeric / v_total > 0.15 then
    perform notify_admins('missed_spike', 'High number of missed check-ins',
      v_missed || ' of ' || v_total || ' participants missed Day ' || p_day || '.');
  end if;

  update challenges set last_processed_day = greatest(last_processed_day, p_day), updated_at = now() where id = p_challenge;
  return v_missed;
end;
$$;

-- Process every day whose deadline has passed and hasn't been processed yet.
create or replace function public.process_due_deadlines()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_c challenges%rowtype;
  v_day int;
begin
  for v_c in select * from challenges where status = 'live' and checkin_deadline is not null and start_date is not null loop
    v_day := v_c.last_processed_day + 1;
    while v_day <= v_c.duration_days and day_deadline(v_c.id, v_day) <= now() loop
      perform process_day(v_c.id, v_day);
      v_day := v_day + 1;
    end loop;
  end loop;
end;
$$;

-- =====================================================================
-- ADMIN ACTIONS (every action is written to admin_logs)
-- =====================================================================
create or replace function public.admin_set_checkin_status(p_checkin uuid, p_status checkin_status, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_row daily_checkins%rowtype;
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  update daily_checkins set status = p_status, status_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_checkin returning * into v_row;
  perform recompute_participant(v_row.participant_id);
  perform log_activity(v_row.participant_id, 'checkin_' || p_status::text, v_row.challenge_day, jsonb_build_object('reason', p_reason));
  insert into admin_logs (admin_id, action, affected_user_id, details)
    values (auth.uid(), 'Set Day ' || v_row.challenge_day || ' submission to ' || p_status::text, v_row.user_id,
            jsonb_build_object('checkin_id', p_checkin, 'reason', p_reason));
end;
$$;

create or replace function public.admin_set_suspended(p_user uuid, p_suspended boolean, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  update profiles set is_suspended = p_suspended where id = p_user;
  update challenge_participants set status = case when p_suspended then 'suspended' else 'active' end::participant_status
    where user_id = p_user and status in ('active', 'restore_pending', 'suspended');
  insert into admin_logs (admin_id, action, affected_user_id, details)
    values (auth.uid(), case when p_suspended then 'Suspended participant' else 'Unsuspended participant' end, p_user,
            jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.admin_add_bonus(p_participant uuid, p_points int, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  insert into point_adjustments (participant_id, points, reason, created_by) values (p_participant, p_points, p_reason, auth.uid());
  perform recompute_participant(p_participant);
  insert into admin_logs (admin_id, action, affected_user_id, details)
    values (auth.uid(), 'Added ' || p_points || ' bonus points', (select user_id from challenge_participants where id = p_participant),
            jsonb_build_object('reason', p_reason));
end;
$$;

-- Log every settings change made by an admin.
create or replace function public.log_challenge_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then
    insert into admin_logs (admin_id, action, details)
      values (auth.uid(), 'Changed challenge settings', jsonb_build_object('challenge', new.slug));
  end if;
  return new;
end;
$$;
create trigger log_challenge_update before update on public.challenges
  for each row execute function public.log_challenge_update();

-- =====================================================================
-- PUBLIC READ FUNCTIONS (safe columns only — never contact details or private snaps)
-- =====================================================================
create or replace function public.get_leaderboard(p_challenge uuid, p_limit int default 100, p_search text default null)
returns table (
  rank bigint, user_id uuid, username citext, full_name text, avatar_path text, sport text, city text,
  current_streak int, longest_streak int, points int, referrals bigint, status participant_status, is_private boolean
) language sql stable security definer set search_path = public as $$
  select
    rank() over (order by cp.total_points desc, cp.current_streak desc, cp.activated_at asc) as rank,
    p.id, p.username, p.full_name, p.avatar_path, p.primary_sport, p.city,
    cp.current_streak, cp.longest_streak, cp.total_points,
    (select count(*) from referrals r where r.referrer_participant_id = cp.id and r.payment_status = 'paid'),
    cp.status, p.privacy = 'private'
  from challenge_participants cp
  join profiles p on p.id = cp.user_id
  where cp.challenge_id = p_challenge
    and cp.status not in ('pending_payment', 'suspended')
    and (p_search is null or p.username ilike '%' || p_search || '%' or p.full_name ilike '%' || p_search || '%')
  order by rank
  limit p_limit;
$$;

create or replace function public.get_community_preview(p_challenge uuid, p_limit int default 6)
returns table (
  username citext, full_name text, avatar_path text, sport text, current_streak int, points int,
  is_private boolean, latest_snap_path text, latest_caption text, latest_day int
) language sql stable security definer set search_path = public as $$
  select p.username, p.full_name, p.avatar_path, p.primary_sport, cp.current_streak, cp.total_points,
    p.privacy = 'private',
    case when p.privacy = 'public' then d.image_path end,
    case when p.privacy = 'public' then d.caption end,
    d.challenge_day
  from challenge_participants cp
  join profiles p on p.id = cp.user_id
  left join lateral (
    select image_path, caption, challenge_day from daily_checkins
    where participant_id = cp.id and status = 'valid' order by challenge_day desc limit 1
  ) d on true
  where cp.challenge_id = p_challenge and cp.status in ('active', 'restore_pending', 'completed')
  order by cp.current_streak desc, cp.total_points desc
  limit p_limit;
$$;

create or replace function public.get_participant_count(p_challenge uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from challenge_participants
  where challenge_id = p_challenge and status not in ('pending_payment', 'suspended');
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.day_results enable row level security;
alter table public.referrals enable row level security;
alter table public.follows enable row level security;
alter table public.payments enable row level security;
alter table public.restores enable row level security;
alter table public.reports enable row level security;
alter table public.admin_logs enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;
alter table public.point_adjustments enable row level security;

-- Profiles: basic info is visible (private profiles still show on leaderboard); owner edits own.
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admin profile update" on public.profiles for update using (is_admin());

create policy "own contact" on public.profile_contacts for select using (user_id = auth.uid() or is_admin());
create policy "own contact update" on public.profile_contacts for update using (user_id = auth.uid());

create policy "challenges readable" on public.challenges for select using (true);
create policy "admin edits challenges" on public.challenges for update using (is_admin()) with check (is_admin());
create policy "admin creates challenges" on public.challenges for insert with check (is_admin());

-- Participant rows (streaks/points) are public-facing; nobody but definer functions can write them.
create policy "participants readable" on public.challenge_participants for select using (auth.role() = 'authenticated' or is_admin());

create policy "checkins visible with permission" on public.daily_checkins for select
  using (is_admin() or (status <> 'removed' and can_view_snaps(user_id)));

create policy "own day results" on public.day_results for select
  using (is_admin() or exists (select 1 from challenge_participants cp where cp.id = participant_id and cp.user_id = auth.uid()));

create policy "own referrals" on public.referrals for select
  using (is_admin() or exists (select 1 from challenge_participants cp where cp.id = referrer_participant_id and cp.user_id = auth.uid()));

create policy "follows visible to both sides" on public.follows for select
  using (follower_id = auth.uid() or following_id = auth.uid() or is_admin());
create policy "unfollow" on public.follows for delete using (follower_id = auth.uid());

create policy "own payments" on public.payments for select using (user_id = auth.uid() or is_admin());
create policy "admin payment update" on public.payments for update using (is_admin());

create policy "own restores" on public.restores for select
  using (is_admin() or exists (select 1 from challenge_participants cp where cp.id = participant_id and cp.user_id = auth.uid()));

create policy "file report" on public.reports for insert with check (reporter_id = auth.uid());
create policy "see own reports" on public.reports for select using (reporter_id = auth.uid() or is_admin());
create policy "admin reviews reports" on public.reports for update using (is_admin());

create policy "admin logs read" on public.admin_logs for select using (is_admin());
create policy "admin logs write" on public.admin_logs for insert with check (is_admin() and admin_id = auth.uid());

create policy "own timeline" on public.activity_events for select
  using (is_admin() or exists (select 1 from challenge_participants cp where cp.id = participant_id and cp.user_id = auth.uid()));

create policy "own notifications" on public.notifications for select
  using ((audience = 'participant' and user_id = auth.uid()) or (audience = 'admin' and is_admin()));
create policy "mark notifications read" on public.notifications for update
  using ((audience = 'participant' and user_id = auth.uid()) or (audience = 'admin' and is_admin()));

create policy "admin bonus read" on public.point_adjustments for select
  using (is_admin() or exists (select 1 from challenge_participants cp where cp.id = participant_id and cp.user_id = auth.uid()));

-- Service-only functions: never callable from the browser.
revoke execute on function public.apply_registration_payment(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.apply_restore_payment(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.mark_payment_failed(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.process_day(uuid, int) from public, anon, authenticated;
revoke execute on function public.process_due_deadlines() from public, anon, authenticated;
revoke execute on function public.recompute_participant(uuid) from public, anon, authenticated;
revoke execute on function public.log_activity(uuid, text, int, jsonb) from public, anon, authenticated;
revoke execute on function public.notify(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text) from public, anon, authenticated;

-- =====================================================================
-- STORAGE — private "snaps" bucket, public "avatars" bucket.
-- Files are stored as <user_id>/<filename>.
-- =====================================================================
insert into storage.buckets (id, name, public) values ('snaps', 'snaps', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "upload own snaps" on storage.objects for insert to authenticated
  with check (bucket_id = 'snaps' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "view permitted snaps" on storage.objects for select
  using (bucket_id = 'snaps' and public.can_view_snaps(((storage.foldername(name))[1])::uuid));
create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- SEED: the first challenge. Edit everything later from the Admin Dashboard.
-- =====================================================================
insert into public.challenges (slug, name, status, duration_days, prize_text, rules)
values (
  '30-day-sports-challenge', '30 Day Sports Challenge', 'registration_open', 30,
  'Complete the 30-day challenge, stay consistent and climb the leaderboard. Then step up for the final on-ground round and compete to win ₹30,000 in prize money.',
  '["Entry fee: ₹99","Challenge duration: 30 days","One daily sports check-in required","Participants must upload a daily snap","Missing a day breaks the streak","Earn additional points through successful referrals","The leaderboard is visible to all participants","The challenge ends with a final on-ground round","The winner of the on-ground round wins ₹30,000 prize money","Choose a Public or Private profile","Private profiles still appear on the leaderboard","Private snaps are only visible to approved followers","Uploaded content must follow community guidelines"]'::jsonb
) on conflict (slug) do nothing;

-- =====================================================================
-- SCHEDULING (enable the pg_cron extension in Supabase → Database → Extensions)
-- Checks every 5 minutes for deadlines that have passed.
-- =====================================================================
-- select cron.schedule('femrise-deadlines', '*/5 * * * *', $$ select public.process_due_deadlines(); $$);

-- Make yourself admin after signing up:
-- update public.profiles set role = 'admin' where username = 'your_username';
