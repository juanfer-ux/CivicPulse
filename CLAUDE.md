# Civic Pulse

Roles, permissions, scope (localities, incident categories) and who may approve, escalate or manage users are defined in [docs/roles-and-permissions.md](docs/roles-and-permissions.md). It is the source of truth.

- Read it before touching roles, permissions, RLS policies, the AI agent's tools, or anything that shows or hides data per user.
- Change the document first (with a dated entry in its decision log), then the code and tests.
- If code and the document disagree, say so and ask the owner. Do not silently pick one.
- Run `supabase/tests/rls_smoke.sql` after any permission change.
