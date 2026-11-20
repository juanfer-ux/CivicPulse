-- Rollback for 20261120000000_recurrence_places.sql. NOT a migration: do not run it in order with the others.
begin;
drop table if exists public.recurrence_places;
commit;
