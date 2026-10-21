# 0016: Authentication stays simple on the Free plan
**Status:** ✅ Accepted   **Date:** 2026-10-21

## Context
Two hardening settings were planned before going live: **Confirm email** and **leaked-password protection**. In the Supabase dashboard, leaked-password protection is "only available on Pro plan and above"; the project is on the Free plan. Confirm email is available on Free, but with the built-in email sender (a few emails per hour) it would make self sign-up slow and add moving parts.

## Decision
Stay on the Free plan and keep authentication as it is: no leaked-password protection, **Confirm email** left off. Passwords need at least 8 characters in our forms. People are invited by the Super Admin (invitation emails confirm the address), and a new self sign-up has no role and sees nothing until a Super Admin assigns one.

## Consequences
- ✅ Nothing extra to configure or pay for; fewer ways for sign-in to fail.
- 🟥 A weak or leaked password is not rejected, and a self sign-up can use an email address it does not own (it still gets no access).
- 🔄 Revisit when moving to Pro (turn on leaked-password protection) or when a real email service is connected (turn on Confirm email).
