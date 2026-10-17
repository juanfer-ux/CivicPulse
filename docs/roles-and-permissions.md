# Civic Pulse: Roles & Permissions Spec

**Status:** APPROVED by the owner (2026-10-17). Single source of truth: change this file first, then the code, then the tests. Code is not yet aligned (see section 9).
**Owner:** Juan Fernando. **Applies to:** database (RLS), web app, AI agent.

## 1. Principles
- **Least privilege.** A new user has no role and sees nothing until a Super Admin assigns one.
- **Enforced in the database**, never by hiding UI. The UI may hide things for clarity; the database must still refuse.
- **Four dimensions** decide what a user can do: **role**, **geographic scope** (localities), **incident-category scope**, and **authorized actions** (section 4).
- **The AI agent has no extra power.** It reads and proposes only through tools that run as the signed-in user, so it can never return what that user could not see.
- **Everything consequential is audited**, and audit events are written only by database triggers.

## 2. Roles (3 active)
| Role | Scope | Purpose |
|---|---|---|
| **Super Admin** | Whole city, all categories | Full access across the city. Manages users, roles and system settings. |
| **Locality (Zone) Admin** | Assigned localities, **all categories** inside them | Manages incidents and coordinates their team within their zone. |
| **Specialist Operator** | Assigned localities, and **only the categories the Super Admin assigns** | Investigates incidents in their categories and escalates when needed. |

Removed on 2026-10-17: **General Operator** and **Sector Admin**. (If sector-level access is ever needed, it returns as a new geographic scope, not as a role.)

### Specialist Operator and specializations
A specialization is a **grouping of incident categories**. The Super Admin assigns **categories per person**; the specialization is the label that follows from them. All specialists have identical permissions and differ only in categories.

| Specialization | Incident categories under it | Status |
|---|---|---|
| Traffic | Obstructive parking | Active, has data |
| Environmental | Illegal dumping | Active (synthetic data to be generated) |
| Infrastructure | none yet | Created, empty. Categories added later. |

## 3. Scope model
- **Geography:** the 20 official Bogotá localities. Super Admin sees all; others only their assigned localities.
- **Categories:** Super Admin sees all. Locality Admin sees all categories in their localities. Specialist sees only assigned categories.
- A specialist with **no categories assigned sees nothing** (least privilege).
- Protected incident details and analytics respect scope. The map may show Bogotá as context, but not restricted records.

## 4. Permission matrix
Yes = allowed within the user's scope. `-` = not allowed.

| Action | Super Admin | Locality (Zone) Admin | Specialist Operator |
|---|---|---|---|
| View incidents | all | their localities, all categories | assigned localities and categories |
| View evidence media (photos, videos) | all | in scope | in scope |
| Ask the AI agent (Investigate and Ask) | all data | in scope only | in scope only |
| Propose a recommendation | yes | yes | yes |
| Approve / reject a recommendation | yes | yes | yes, in their categories and localities |
| Escalate for a second approval | n/a | n/a (they are the escalation target) | yes, their choice |
| Review escalated recommendations (second approval) | yes | yes | - |
| Assign incidents to a team member | yes | yes, within their zone | - |
| View their team (specialists in their zone) | all | their zone | - |
| View audit trail | all users | own actions | own actions |
| Manage users, roles, localities and categories per person | yes | - | - |
| Manage system settings (specializations, categories, which localities exist) | yes | - | - |

### Escalation rule
- A specialist can approve or reject on their own. If they want a second opinion they press **Escalate**: the recommendation becomes **needs second approval** and only a Locality Admin of that locality (or the Super Admin) can then decide it.
- Escalation is the **specialist's choice** for now. In the future the AI agent will **advise** escalating instead of approving for large interventions, for example when several incidents in the same area should be grouped. Making escalation mandatory for such cases is an open question (section 8).
- No UI is specified here. Escalation screens come later, with the agent.

## 5. Provisioning
1. Anyone can register. Their profile has **no role**, so they see an "Access pending" screen.
2. Only a Super Admin assigns role, localities and categories. Nobody can change their own role or activation.
3. The **first Super Admin** is bootstrapped once by SQL in the Supabase SQL editor (see README, "Auth and roles"). Never from the app.
4. Production checklist: Confirm email on, leaked-password protection on (see DEPLOY.md).

## 6. Invariants (must always hold)
1. No user can grant themselves a role, activation, or wider scope.
2. A user never receives rows outside their locality and category scope, through the UI, the API or the AI agent.
3. A recommendation is created as `proposed`; its status changes only through a recorded decision or escalation.
4. Decisions are append-only. Audit events are written only by triggers and cannot be forged by users.
5. Only a Super Admin changes system settings and access assignments.
6. A recommendation marked needs-second-approval cannot be decided by a Specialist.

## 7. Test cases (map to `supabase/tests/rls_smoke.sql`)
| # | Case | Expected |
|---|---|---|
| T1 | Locality Admin reads incidents | only their localities, all categories |
| T2 | Specialist reads incidents | only assigned localities and categories |
| T3 | Specialist with no categories | sees nothing |
| T4 | Any non-super-admin changes own role | blocked |
| T5 | Specialist proposes outside scope | blocked |
| T6 | Specialist approves inside scope | allowed |
| T7 | Specialist decides an escalated recommendation | blocked |
| T8 | Locality Admin decides an escalated recommendation | allowed |
| T9 | Locality Admin creates or changes a user | blocked |
| T10 | Locality Admin reads another locality | blocked |
| T11 | Agent tools called as a restricted user | scoped identically to T1 or T2 |
| T12 | User inserts an audit event or a pre-approved recommendation | blocked |
Already covered today: T4 (partly), T10, T11, T12. The rest are to be added.

## 8. Open questions
1. Should escalation ever be **mandatory** (for example for grouped incidents)? Today: advisory, agent-suggested later.
2. May a Locality Admin approve a recommendation **they proposed themselves**? (Suggest: yes for the MVP, audited.)
3. What does "view their team" show: name and specialty only, or also open work? (Suggest: name, specialties, count of open assigned incidents.)
4. When a specialist belongs to several localities, may the Locality Admin of only one of them see them? (Suggest: yes, within the shared locality.)

## 9. As built today (2026-10-17) and gaps
- Database has **5** roles (`app_role` enum) including the two removed ones; `locality_admin`, `specialist_operator` and `general_operator` behave identically (read in scope, propose, approve). Only Super Admin differs.
- Category is hard-coded to `parking` in a check constraint; there is no specializations or categories table.
- A Locality Admin currently needs category rows like a specialist (to be removed: they see all categories in their localities).
- Recommendations and decisions are filtered by **locality only**, not by category: a specialist could see recommendations of other categories in their locality (to fix).
- No escalation status, no team view, no incident assignment screen (`incidents.assigned_to` exists, unused).
- No screen to assign roles or scope (SQL only). Frontend duplicates the role list (`DECIDERS` in `src/components/RecommendationsPanel.tsx`).
- Only Super Admin and Locality Admin are covered by `rls_smoke.sql`.

## 10. Implementation notes (not built; separate approval)
- Reduce `app_role` to 3 values (Postgres cannot drop enum values: recreate the type and migrate).
- New tables: `specializations`, `incident_categories` (code, name, specialization, active); point `user_incident_type_access` at categories.
- Store this matrix as data (`role_permissions`) with `has_permission(action)`; RLS policies call it. One TypeScript `can(role, action)` mirrors it for the UI.
- Add `needs_second_approval` to `recommendation_status`; category-scope recommendations and decisions.
- Super Admin screen for users, roles, localities, categories; sample test user per role; extend `rls_smoke.sql` to T1-T12; generate synthetic illegal-dumping incidents.

## 11. Decision log
| Date | Decision | Why |
|---|---|---|
| 2026-10-17 | Roles reduced to Super Admin, Locality (Zone) Admin, Specialist Operator | Simpler, matches the real organization |
| 2026-10-17 | Specialists differ only by categories, assigned per person by the Super Admin | Same duties, different incident types |
| 2026-10-17 | Parking is under Traffic; illegal dumping under Environmental; Infrastructure created empty | Owner's category model |
| 2026-10-17 | Locality Admin sees all categories in their localities | Brief: investigate incidents within authorized localities |
| 2026-10-17 | Specialists can approve within scope and escalate for a second approval | Owner's escalation model; supersedes the earlier "only admins approve" idea |
| 2026-10-17 | Only the Super Admin manages users and system settings | Least privilege |
| 2026-10-17 | No other roles for now | Owner's decision |
