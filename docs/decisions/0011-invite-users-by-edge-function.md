# 0011: Users are invited by an Edge Function
**Status:** Accepted   **Date:** 2026-10-17   Replaces the "cannot create accounts" consequence of [0010](0010-users-screen-uses-access-rules.md).

## Context
The Super Admin needs to add people from the Users screen. Creating an account for someone else needs Supabase's admin key, which must never reach the browser (public repo, public site).

## Decision
The Create user form calls a Supabase Edge Function, `invite-user`. It:
1. checks the caller may manage users and is a Super Admin;
2. validates role, zones and specialty (a specialist's specialty must have categories);
3. sends the invitation email (the person chooses their own password, so nobody handles a password);
4. assigns role and access **as the caller**, so the existing rules and audit triggers apply, and adds a `user_invited` audit event;
5. deletes the new account if any later step fails.

The admin key exists only inside the function, supplied by Supabase. The rule "you can only grant access you have" is enforced in the function so restricted admins can be added later without reopening this.

## Consequences
- ✅ No password is ever typed, sent or stored by us; every invite is audited.
- ✅ A non-Super-Admin cannot invite, even by calling the function directly.
- 🟥 One more thing to deploy (see [deploy.md](../deploy.md)); the SQL smoke test does not cover it, so it has a manual checklist.
- 🟥 Supabase's built-in email sender is rate limited; use a proper email service before real use.
- 🟥 Resend invite, password reset and delete user are not built yet.
