-- Rollback for 20261030000000_problems_layer.sql. NOT a migration: do not run it in order with the others.
-- Drops only what that migration created; incidents and everything older are untouched.
-- (Removing only the synthetic problems_v1 dataset is easier: see the bottom of supabase/seed/synthetic_problems.sql.)
begin;
drop function if exists public.match_unlinked(text);
drop function if exists public.propose_links(uuid);
drop function if exists public.dist_points(double precision, jsonb);
drop function if exists public.refresh_problem_status(uuid);
drop function if exists public.link_into_problem(uuid, uuid, int, text, jsonb);
drop function if exists public.norm_addr(text);
drop function if exists public.geo_m(double precision, double precision, double precision, double precision);
drop view if exists public.problem_stats;
drop view if exists public.occurrence_stats;
drop view if exists public.incident_current_link;
drop table if exists public.match_config, public.occurrence_rules, public.problem_events, public.intervention_results,
  public.interventions, public.incident_links, public.occurrences, public.problems,
  public.incident_source_status, public.incident_sources, public.source_platforms;
drop sequence if exists public.problem_ref_seq;
drop type if exists public.problem_status;
commit;
