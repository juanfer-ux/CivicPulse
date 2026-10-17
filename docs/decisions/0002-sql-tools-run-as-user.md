# 0002: Agent tools run as the signed-in user
**Status:** ✅ Accepted   **Date:** 2026-10-14

## Context
If the agent used a powerful database key, a clever question could return data the person is not allowed to see.

## Decision
Every agent tool is a Postgres function with **security invoker**, called with the user's own sign-in token. Row-level security therefore applies to the agent exactly as it does to the user.

## Consequences
- ✅ The agent can never exceed the user's access, by design.
- ✅ Verified in the permission smoke test (a restricted user's tool results are limited to their locality).
- ⚠️ Any new tool must be security invoker and must not use a service key.
