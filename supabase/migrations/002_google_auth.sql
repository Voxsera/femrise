-- Run this ONLY if you already ran schema.sql before Google sign-in was added.
-- (A fresh schema.sql already includes these changes.)

alter table public.profiles add column if not exists onboarded boolean not null default false;
update public.profiles set onboarded = true where primary_sport is not null; -- existing email sign-ups

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

