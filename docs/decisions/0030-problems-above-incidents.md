# 0030: Persistent problems sit above incidents (report, occurrence, problem)
**Status:** 🟨 Proposed (owner approved the plan 2026-10-30; not applied to the database yet)   **Date:** 2026-10-30

## Context
Civic Pulse showed individual incident reports. The real object operators act on is a **persistent territorial problem**: a place where the same kind of issue keeps coming back, reported through several platforms and treated several times. Counting raw reports would inflate recurrence (five citizens reporting the same parked car are one event) and give a wrong picture of whether interventions work.

## Decision
- Three levels: **report** (an `incidents` row, unchanged) → **occurrence** (one real-world event; many reports can describe it) → **problem** (the persistent situation at a place; many occurrences over time).
- **Recurrence and intervention effectiveness count occurrences, never reports.** Report counts are shown next to them as intensity only.
- `incidents`, its nine statuses, the four map groups (`groupOf`), the `tool_*` functions and the existing access rules **stay as they are**. New tables only; no column is added to `incidents` (the guard trigger blocks every update except `assigned_to`, so a `problem_id` there could not be written anyway).
- Problems have their **own lifecycle**: Active, Monitoring, Resolved, Archived. Closing or rejecting an incident never changes its problem; the absence of reports never sets Resolved; a new confirmed occurrence reopens a Resolved problem to Active.
- Linking is **automatic and confidence-based**: high confidence links by itself, medium is flagged for an operator, low stays unassociated. Every link is append-only and keeps its score and explanation, so a wrong link can be corrected without losing a report or its provenance.
- Whether a report is the **same event or a new occurrence** is decided by location and category, vehicle or object identity, evidence the situation continued, a documented intervention and elapsed time. A 24-hour gap is a signal to check, not a rule; when the evidence is not enough the occurrence boundary is marked **uncertain** instead of inventing a new event.
- Source provenance (platform, external id, original dates and status history) lives in side tables, one row per report.
- This first version is **rules only, no AI**. The schema leaves room for AI signals later (bounded, server-side, never able to confirm a link or resolve a problem).

## Consequences
- ✅ The map can show problems, not just dots, and operators see whether a problem is really solved.
- ✅ Nothing existing is edited; the whole layer can be dropped.
- 🟨 More tables to keep consistent (checked by `supabase/tests/matching_smoke.sql`).
- 🟨 Matching can be wrong in both directions (false merge hides recurrence, false split inflates it); thresholds are tuned against planted synthetic truth first and uncertain cases are flagged.
- ⬜ Not in this version: operator review screens, correction and intervention entry, real platform ingestion, AI signals, agent tools for problems.
