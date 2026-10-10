-- Run this ONLY if you already ran schema.sql before fees were switched to rupees.
-- Stores fees and payment amounts in rupees (99) instead of paise (9900).

alter table public.challenges rename column registration_fee_paise to registration_fee;
alter table public.challenges rename column restore_fee_paise to restore_fee;
alter table public.payments rename column amount_paise to amount;

alter table public.challenges drop constraint if exists challenges_registration_fee_paise_check;
alter table public.challenges drop constraint if exists challenges_restore_fee_paise_check;

update public.challenges set registration_fee = registration_fee / 100, restore_fee = restore_fee / 100
  where registration_fee >= 100;
update public.payments set amount = amount / 100 where amount >= 100;

alter table public.challenges alter column registration_fee set default 99;
alter table public.challenges alter column restore_fee set default 50;
alter table public.challenges add constraint challenges_registration_fee_check check (registration_fee >= 0);
alter table public.challenges add constraint challenges_restore_fee_check check (restore_fee >= 0);

-- Functions that used the old column names
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
  perform log_activity(v_pay.participant_id, 'paid', null, jsonb_build_object('amount', v_pay.amount));

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
  perform log_activity(v_p.id, 'restore_purchased', v_p.pending_restore_day, jsonb_build_object('amount', v_pay.amount));
  perform recompute_participant(v_p.id);
  perform notify(v_p.user_id, 'restore', 'Restore activated. Your challenge continues.');
end;
$$;

create or replace function public.submit_upi_payment(
  p_challenge uuid, p_utr text, p_proof_path text, p_referral_code text default null
) returns payments language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_c challenges%rowtype;
  v_part challenge_participants%rowtype;
  v_pay payments%rowtype;
  v_utr text := upper(regexp_replace(coalesce(p_utr, ''), '\s', '', 'g'));
begin
  if v_uid is null then raise exception 'Please sign in first'; end if;
  if v_utr !~ '^[A-Z0-9]{10,22}$' then raise exception 'Enter the 12-digit UPI transaction ID from your payment app'; end if;
  if p_proof_path is null or split_part(p_proof_path, '/', 1) <> v_uid::text then
    raise exception 'Please upload the payment screenshot';
  end if;
  select * into v_c from challenges where id = p_challenge;
  if not found then raise exception 'Challenge not found'; end if;

  v_part := join_challenge(p_challenge, p_referral_code);
  if v_part.status <> 'pending_payment' then raise exception 'You are already registered'; end if;

  if exists (select 1 from payments where upper(utr) = v_utr and status <> 'rejected' and participant_id <> v_part.id) then
    raise exception 'This transaction ID has already been used';
  end if;

  -- One open submission per participant: update it if they resubmit before review.
  select * into v_pay from payments
    where participant_id = v_part.id and payment_type = 'registration' and status = 'submitted' for update;
  if found then
    update payments set utr = v_utr, proof_path = p_proof_path, created_at = now()
      where id = v_pay.id returning * into v_pay;
  else
    insert into payments (user_id, participant_id, challenge_id, payment_type, amount, status, provider,
                          provider_order_id, utr, proof_path)
    values (v_uid, v_part.id, p_challenge, 'registration', v_c.registration_fee, 'submitted', 'upi',
            'upi_' || gen_random_uuid(), v_utr, p_proof_path)
    returning * into v_pay;
  end if;

  perform log_activity(v_part.id, 'payment_submitted', null, jsonb_build_object('utr', v_utr));
  perform notify_admins('upi_payment', 'New UPI payment to verify', 'UTR ' || v_utr);
  return v_pay;
end;
$$;
