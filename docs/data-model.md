# 🗃️ Data model

> **Status:** 🟩 Up to date with the database (2026-10-17), except the 🟨 *Problems layer* section, which is the target and is not applied yet. Source: `supabase/migrations/*.sql`. The database is the truth; this page explains it.
> 🔐 Who may read or write each table is defined in [roles-and-permissions.md](roles-and-permissions.md).

## 🗺️ How the tables relate
```mermaid
erDiagram
  PROFILES ||--o{ USER_LOCALITY_ACCESS : "has"
  LOCALITIES ||--o{ USER_LOCALITY_ACCESS : "grants"
  PROFILES ||--o{ USER_INCIDENT_TYPE_ACCESS : "has"
  INCIDENT_CATEGORIES ||--o{ USER_INCIDENT_TYPE_ACCESS : "grants"
  SPECIALIZATIONS ||--o{ INCIDENT_CATEGORIES : "groups"
  INCIDENT_CATEGORIES ||--o{ INCIDENTS : "classifies"
  LOCALITIES ||--o{ INCIDENTS : "contains"
  PROFILES ||--o{ INCIDENTS : "assigned to"
  INCIDENTS ||--o{ INCIDENT_MEDIA : "has"
  INCIDENTS ||--o{ INCIDENT_RELATIONS : "relates"
  LOCALITIES ||--o{ RECOMMENDATIONS : "about"
  INCIDENT_CATEGORIES ||--o{ RECOMMENDATIONS : "about"
  RECOMMENDATIONS ||--o{ DECISIONS : "decided by"
  PROFILES ||--o{ DECISIONS : "makes"
  PROFILES ||--o{ AUDIT_EVENTS : "acts"
```
`role_permissions` stands alone: it lists which actions each role may do.

## 📋 Tables (13)
| Table | Purpose | Key points |
|---|---|---|
| 🏙️ `localities` | The 20 official Bogotá localities | `code` 1 to 20. Boundaries not loaded yet (markers only). |
| 👤 `profiles` | One row per user, created automatically at sign-up | `role` is **null** until a Super Admin assigns one. `is_active`. `email` copied from sign-up (the browser cannot read the auth table). A trigger blocks demoting or switching off the last active Super Admin. `invitation_pending` is true from the invitation until the person confirms the email link (a trigger on the auth table clears it); nobody can change it on their own profile. |
| 📍 `user_locality_access` | Which localities a user may see | (user, locality). |
| 🏷️ `user_incident_type_access` | Which categories a **specialist** may see | (user, category). Locality Admins and Super Admins do not need rows. |
| 🧩 `specializations` | Groups of categories | `traffic`, `environmental`, `infrastructure`. |
| 🗂️ `incident_categories` | What kind of incident | `parking` (traffic), `illegal_dumping` (environmental). Infrastructure has none yet. `active` flag. |
| 🔐 `role_permissions` | **What each role may do**, as data | (role, action). Read by the app and by every access rule. 28 rows. |
| 🚨 `incidents` | Reports (all **synthetic**) | See columns below. 650 today: 500 parking, 150 illegal dumping. |
| 🔗 `incident_relations` | Duplicate or related reports | `duplicate`, `possibly_related`, `same_location`. |
| 📷 `incident_media` | Photos and videos per incident | `storage_path` empty while placeholder. Files go to a private Storage bucket later. |
| 💡 `recommendations` | Suggestions for human review | Has `category`. `evidence` (counts and incident ids from SQL), `limitations`, `status`. |
| ✔️ `decisions` | Approve or reject, **append-only** | Who, when, explanation. A trigger updates the recommendation status. |
| 📜 `audit_events` | Who did what | Written **only by triggers or the escalation function**; users cannot forge entries. User management logs `user_role_changed`, `user_activation_changed`, `locality_access_granted/revoked`, `category_access_granted/revoked`, and `user_invited` (written by the invite function). |

### 🚨 `incidents` columns, grouped
- **Identity:** `id`, `reference` (CP-00001 parking, CD-00001 dumping), `title`, `description`, `category`.
- **Where and when:** `locality_code`, `lat`, `lng` (inside Bogotá bounds), `location_description`, `occurred_at`, `reported_at` (never before occurred).
- **What:** `vehicle_type`, `license_plate` (fictional or empty), and the **type**: `obstruction_subtype` for parking, `subtype` for other categories (household waste, construction debris, bulky items). A rule requires `obstruction_subtype` when the category is parking.
- **AI vs human:** `ai_classification`, `ai_confidence` (0 to 1), `uncertainty_flags`, then `validation_status` and `status` (see [incident-lifecycle.md](incident-lifecycle.md)).
- **Work:** `assigned_to` (exists, no screen yet), `outcome`.
- **Honesty flag:** `is_synthetic` (always true today). `evidence_metadata` is placeholder data.

## 🔤 Enums
`app_role` (**3**: super_admin, locality_admin, specialist_operator) · `incident_status` (9) · `obstruction_subtype` (6) · `vehicle_type` (6) · `recommendation_status` (**4**: proposed, needs_second_approval, approved, rejected) · `media_kind` (photo, video).

## ⚙️ Database functions
| Kind | Names | Security |
|---|---|---|
| 🔑 Permission helpers | `current_app_role`, `has_permission(action)`, `can_access_locality`, `can_access_category`, `can_access(locality, category)`, `shares_locality_with(user)` | Run as the database; callable only by signed-in users. Used by every access rule. |
| ⬆️ Escalation | `escalate_recommendation(id, note)` | Checks permission and scope; sets `needs_second_approval`; writes an audit event. No screen yet. |
| 🪝 Triggers | `handle_new_user`, `guard_profile_changes`, `apply_decision`, `audit_recommendation_proposed` | Not callable from the API. |
| 🛠️ Agent tools | `tool_incidents_by_locality`, `tool_time_distribution`, `tool_period_comparison`, `tool_recurring_locations`, `tool_candidate_areas` | Run **as the signed-in user** (RLS applies), need the `ask_agent` permission, take an optional category. See [ai-agent.md](ai-agent.md). |

## 🌱 Seed data
- `supabase/seed/synthetic_incidents.sql`: 500 **parking** incidents over 120 days across 19 localities (Sumapaz has none: it lies south of the allowed latitude), recurring hotspots, a Chapinero spike in the last 30 days.
- `supabase/seed/synthetic_illegal_dumping.sql`: 150 **illegal dumping** incidents, concentrated in the south (Ciudad Bolívar, Usme, Bosa, Kennedy, Tunjuelito), mostly at night, with recurring hotspots.
- Both include placeholder media rows and are re-runnable; each deletes only its own category.

## 📦 Migrations (run in this order)
1. `20261014000000_init_civic_pulse.sql`: tables, roles, RLS, triggers.
2. `20261014010000_investigation_tools.sql`: ranking, time and period tools.
3. `20261014020000_recurring_and_recommendations.sql`: recurring places, candidate areas, audit hardening.
4. `20261014030000_incident_media.sql`: photos and videos.
5. `20261017000000_escalation_status.sql`: the `needs_second_approval` status.
6. `20261017010000_roles_alignment.sql`: 3 roles, specializations and categories, permissions as data, category scoping, escalation function, category-aware tools.
7. `20261018000000_user_management.sql`: `profiles.email`, last-Super-Admin guard, audit events for role and access changes.
8. `20261018010000_invitation_pending.sql`: `profiles.invitation_pending` and the trigger that clears it when an invitation is accepted.
9. `20261029000000_restrict_incident_updates.sql`: a trigger that lets only `assigned_to` change on an incident (every other column is read-only after insert, for every role). **Written; check that it was run in the shared project.**
10. `20261030000000_problems_layer.sql` 🟨 *proposed, not applied*: the problems layer below (new tables, views, access rules; no change to existing tables).

## 🧩 Problems layer 🟨 *target (decision [0030](decisions/0030-problems-above-incidents.md); not applied to the database yet)*
Three levels: **report** (an `incidents` row) → **occurrence** (one real-world event; many reports can describe it) → **problem** (the persistent situation at a place). `incidents` and everything above stay untouched; the layer only adds tables, so it can be dropped.
```mermaid
erDiagram
  PROBLEMS ||--o{ OCCURRENCES : "has"
  OCCURRENCES ||--o{ INCIDENT_LINKS : "describes"
  INCIDENTS ||--o{ INCIDENT_LINKS : "linked by"
  PROBLEMS ||--o{ INTERVENTIONS : "receives"
  INTERVENTIONS ||--o{ INTERVENTION_RESULTS : "outcome"
  PROBLEMS ||--o{ PROBLEM_EVENTS : "history"
  INCIDENTS ||--|| INCIDENT_SOURCES : "provenance"
  INCIDENTS ||--o{ INCIDENT_SOURCE_STATUS : "original status"
  SOURCE_PLATFORMS ||--o{ INCIDENT_SOURCES : "from"
```
| Table | Purpose | Key points |
|---|---|---|
| `source_platforms` | Where a report came from | `code`, name, `categories` it may carry (a mobility platform cannot carry dumping). All synthetic for now. |
| `incident_sources` | One row per report: its provenance | platform, `external_ref`, `submitted_at`, original category, description and status, evidence references. `unique(platform, external_ref)`. |
| `incident_source_status` | Original status over time | Insert-only. |
| `problems` | A persistent territorial problem | `reference`, `category`, `locality_code`, anchor `lat`/`lng`, `location_description`, `status` (`active`, `monitoring`, `resolved`, `archived`), `merged_into`, `dataset`, `is_synthetic`. No counters: they are derived in views. |
| `occurrences` | One real-world event | `problem_id`, scope columns, `subject_key` (for example a plate), `ended_at`, `ended_reason` (`intervention` or `operator`). Whether its boundary is uncertain is derived from proposed links. |
| `incident_links` | Report → occurrence and problem | **Insert-only.** `state` (`proposed`, `confirmed`, `rejected`, `unlinked`), `actor_type` (`rule`, `ai`, `operator`), `score`, `band`, `explanation` (json), `config_version`, `supersedes`. The latest row per report is the current link. |
| `interventions`, `intervention_results` | Action taken and what happened | Result (`cleared`, `partial`, `no_effect`, `unknown`) is recorded separately and later. Insert-only. |
| `problem_events` | Timeline | Status changes, reopened, notes. Insert-only. |
| `occurrence_rules`, `match_config` | Matching settings | Review gap per category, thresholds, weights and a version; nothing is hard-coded in the matching function. |

**Views:** `incident_current_link`, `occurrence_stats` (first and last report, report count, uncertain boundary) and `problem_stats` (`occurrences_n`, `recurrences_n` = occurrences − 1, `reports_n`, `interventions_n`, `occurrences_after_last_intervention`, `last_seen`, `quiet`). **Recurrence is a number, not a status.**

**Access:** the same rule as incidents. A user reads a row when they have `view_incidents` and `can_access(locality, category)` for its problem; a link also needs its report in scope. There are **no write policies and no new permission**: rows come only from the owner-run matching function and seeds, and nothing in the browser can write them.

**Matching** (`match_unlinked()`, owner-only, never a trigger, never updates `incidents`): see [ai-agent.md](ai-agent.md#-matching-is-rules-not-ai) and [incident-lifecycle.md](incident-lifecycle.md#-problem-status-4-values).

**Seed:** `supabase/seed/synthetic_problems.sql` adds **200 new reports** (tag `evidence_metadata->>'dataset' = 'problems_v1'`) with 16 problems' worth of planted truth (48 occurrences, 32 interventions, about three months, both categories). The 650 existing incidents are never changed. The seed does not fill problems or links: the matcher builds them and `supabase/tests/matching_smoke.sql` compares the result with the planted truth.

## 🎯 Still to build
| | Item |
|---|---|
| ⬜ | Screens to manage users, roles, localities and categories (Super Admin). |
| ⬜ | Team view and incident assignment screens (Locality Admin). |
| ⬜ | Escalate button (the database function exists). |
| ⬜ | Infrastructure categories, once defined. |
