# 0007: Permissions are stored as data and checked by one function
**Status:** ✅ Accepted   **Date:** 2026-10-17

## Context
Access rules were hard-coded in SQL functions (`can_decide`) and repeated in the app (`DECIDERS`). They drifted apart and every change meant editing several places.

## Decision
A `role_permissions` table lists which actions each role may do. One function, `has_permission(action)`, is used by every row-level security rule and tool. The app reads the same table to decide what to show (`can(action)`). The source of truth for the contents is [roles-and-permissions.md](../roles-and-permissions.md).

## Consequences
- ✅ One place to change a permission; database and app cannot disagree.
- ✅ The permission matrix is testable (`supabase/tests/rls_smoke.sql`).
- ⚠️ Changing the matrix means a migration (and an update to the spec first).
