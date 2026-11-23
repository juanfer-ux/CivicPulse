-- Rollback for 20261123000000_tool_recurrence_places.sql. NOT a migration: do not run it in order with the others.
begin;
drop function if exists public.tool_recurrence_places(uuid);
commit;
