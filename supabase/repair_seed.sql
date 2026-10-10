-- Safe to run more than once. Re-creates the storage buckets/policies and the challenge row
-- in case the end of schema.sql didn't run. Fees are in rupees.

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
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false) on conflict do nothing;

drop policy if exists "upload own payment proof" on storage.objects;
create policy "upload own payment proof" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "view own payment proof" on storage.objects;
create policy "view own payment proof" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "upload own snaps" on storage.objects;
create policy "upload own snaps" on storage.objects for insert to authenticated
  with check (bucket_id = 'snaps' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "view permitted snaps" on storage.objects;
create policy "view permitted snaps" on storage.objects for select
  using (bucket_id = 'snaps' and public.can_view_snaps(((storage.foldername(name))[1])::uuid));
drop policy if exists "upload own avatar" on storage.objects;
create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "update own avatar" on storage.objects;
create policy "update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- SEED: the first challenge. Edit everything later from the Admin Dashboard.
-- =====================================================================
insert into public.challenges (slug, name, status, start_date, duration_days, prize_text, rules)
values (
  '21-day-sports-challenge', 'Mid-Winter Arc — 21 Day FemRise Challenge', 'registration_open', '2026-11-01', 21,
  'Complete the 21-day challenge, stay consistent and climb the leaderboard. Then step up for the final on-ground round and compete to win ₹30,000 in prize money.',
  '["Entry fee: ₹99","Challenge duration: 21 days (1–21 November)","One daily sports check-in required","Participants must upload a daily snap","Missing a day breaks the streak","Earn additional points through successful referrals","The leaderboard is visible to all participants","The challenge ends with a final on-ground round","The winner of the on-ground round wins ₹30,000 prize money","Choose a Public or Private profile","Private profiles still appear on the leaderboard","Private snaps are only visible to approved followers","Uploaded content must follow community guidelines"]'::jsonb
) on conflict (slug) do nothing;


-- Check: this should show one row
select slug, name, start_date, duration_days, registration_fee from public.challenges;
