# 0010: The Users screen writes through the existing access rules
**Status:** Accepted   **Date:** 2026-10-17

## Context
The Super Admin needs a screen to assign roles, localities and categories. Two ways to build it: let the signed-in Super Admin write the tables directly (the `manage_users` permission already allows it), or call a server function that uses the Supabase service-role key.

## Decision
The screen uses the normal browser connection and the existing rules (decision 0003). No service-role key ever reaches the browser. Safety lives in the database: a trigger refuses to demote or switch off the last active Super Admin, and triggers write every role, activation and access change to the audit trail. The screen also locks the user's own role and status.

## Consequences
- ✅ Nothing new to secure; a non-Super Admin cannot do any of this even by calling the API directly.
- ✅ Every change is traceable.
- 🟥 Cannot create or invite accounts for other people, reset passwords or delete users. That needs a server-side key, so it waits for an Edge Function.
