-- Lets the owner delete shopper-activity rows, then removes the two test rows (ids 1 and 2) created during testing.
drop policy if exists "activity admin delete" on public.shopper_activity;
create policy "activity admin delete" on public.shopper_activity for delete using (public.is_admin());
delete from public.shopper_activity where id in (1, 2);
