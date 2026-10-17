-- Escalation: a specialist can ask for a second approval from a Locality Admin or Super Admin.
-- Spec: docs/roles-and-permissions.md (section 4, "Escalation rule").
-- This is its own migration because a new enum value cannot be used in the transaction that adds it.
alter type public.recommendation_status add value if not exists 'needs_second_approval';
