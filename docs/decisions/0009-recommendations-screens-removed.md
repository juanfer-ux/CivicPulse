# 0009: Recommendation screens removed for now; backend kept
**Status:** ✅ Accepted   **Date:** 2026-10-18

## Context
The Recommendations tab and the "Send for human review" button were built from the original brief. The owner does not need them yet.

## Decision
Remove the screens: the Recommendations tab (desktop and mobile "Recs"), its panel, and the send-for-review button in the Investigate answers. Keep the database part (recommendations, decisions, escalation, audit trail, permissions) and the agent's ability to build a proposal, because the roles spec and the permission tests depend on them.

## Consequences
- ✅ A simpler app: the map, the filters and the agent.
- ✅ Nothing to rebuild in the database when the screens return; they can be restored from git history (commit before this one).
- ⚠️ No way to create or decide recommendations from the app until a new screen is built.
