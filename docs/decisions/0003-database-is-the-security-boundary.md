# 0003: The database, not the screen, enforces access
**Status:** ✅ Accepted   **Date:** 2026-10-14

## Context
Hiding buttons is not security: people can change the address, the page state, or the query.

## Decision
All access rules live in Postgres row-level security and helper functions. The browser uses only the **publishable** key. The screen may hide things for clarity but is never trusted. Audit events are written only by triggers.

## Consequences
- ✅ Safe even if the front end is modified or the agent is tricked.
- ⚠️ Rules must be changed in SQL migrations and tested with `supabase/tests/rls_smoke.sql`.
- ⚠️ Details of who can do what: [roles-and-permissions.md](../roles-and-permissions.md).
