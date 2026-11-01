# 🧪 Testing

> **Status:** 🟨 Draft (2026-10-17).

## ✅ Before every publish
```bash
npm test         # 16 unit tests (planner, categories and answers)
npm run lint     # code checks
npm run build    # type-check, then bundle
```

> **Timeouts are generous on purpose.** Each test may take 20 s and each wait (`findBy…`, `waitFor`) 5 s (`vite.config.ts`, `src/test/setup.ts`). The defaults (5 s and 1 s) failed on a busy machine: the invite-user test timed out in every run when 8 test runs shared 4 CPUs. Passing fast is unchanged; the limit only matters when the machine is slow.

> **CI has no `.env`.** A module that tests import must not pull in Supabase or anything that needs env vars (keep pure constants in an import-free file, like `src/lib/markerSizes.ts`). Check by running the tests in a copy without `.env*`. `tsc -b` also type-checks test files, so never commit one whose types or packages the build lacks.

## 🧪 What each kind of test covers
| | Kind | Where | Covers |
|---|---|---|---|
| 🟩 | Unit tests (Vitest) | `src/lib/agent.test.ts`, `src/lib/users.test.ts`, `src/lib/utils.test.ts` | Question routing, accent-insensitive localities, percentage rules, empty periods, small samples, ties, honest "cannot answer", proposals with no dispatch, tool errors surfaced; Users screen: diff of granted vs wanted access, Pending/Active/Off status; invite form rules (name, email, role, zones, at least one category for a specialist) and specialty shown from categories |
| 🟩 | Permission smoke test (SQL) | `supabase/tests/rls_smoke.sql` | **47 checks** for Locality Admin, three kinds of Specialist and Super Admin: scope by locality and category, agent tools scoped the same, nobody promotes themselves, approve and escalate flow, no forged audit events, no pre-approved recommendations, last Super Admin protected, role and access changes audited, invitation flag protected and cleared on accept |
| 🟨 | Manual checklist | below | Screens, sign-in, map |
| ⬜ | Screen tests | none yet | Components and flows |

## 🧩 Problems layer tests 🟨 *(target)*
`supabase/tests/matching_smoke.sql` runs the matcher on the planted `problems_v1` seed inside a rolled-back transaction and prints a confusion matrix against the planted truth, plus invariants: recurrence counts occurrences (one report burst = one occurrence, recurrence 0), nearby unrelated problems stay separate, uncertain cases are flagged, the 650 original incidents are unchanged and `incidents` still rejects an update. `rls_smoke.sql` gets scope and no-write checks for the new tables.

## 🔐 Running the permission smoke test
1. Open the Supabase **SQL Editor**, paste `supabase/tests/rls_smoke.sql`, run it.
2. It **always ends with an error that contains a `RESULT` line**. That is by design: the error rolls back everything the test created, so no data is left behind.
3. Expect **`RESULT PASS 47/47`**. Any failure is listed by name. A Super Admin must exist, and both seed files must have run.

## 📝 Manual checklist (after a deploy)
- [ ] Sign-in page loads with the logo, no console errors.
- [ ] Sign in; the map shows points (needs hardware acceleration), or the list appears with a message.
- [ ] Filters change the counts; clicking a point opens the incident with placeholder photos.
- [ ] Ask the suggested questions; evidence and limitations appear; map rings appear.
- [ ] Look: text is Manrope; default Button and Input are 36 px tall, corners 4 px; no request to fonts.googleapis.com in the browser's Network tab (values in [design-system/foundations.md](design-system/foundations.md)).
- [ ] Phone width: bottom sheet with Explore and Investigate tabs.
- [ ] Create user (needs the function deployed): invite an email you control as each role. Email arrives, link opens **Set up your account** (name and email read-only), after saving you land in the app with the right access; the table shows the new person as **Pending** (tag Invited) until they accept, then **Active**, with the right specialty; the audit trail has `user_invited`. A duplicate email gives a clear message and leaves no extra user. A Locality Admin or Specialist calling the function is refused.
- [ ] Forgot password: on the sign-in page, enter an email and click **Forgot password?**; the email link opens **Set up your account**.
- [ ] Super Admin: **Users** button opens the table; a role or locality change persists after reload; you cannot change your own role. Other roles do not see the button.
- [ ] Category filter: choose Illegal dumping, then Obstructive parking; counts change.

## 🟥 Gaps
| | Gap |
|---|---|
| 🟥 | No sample user per role to **sign in** with (the SQL test uses fake users that are rolled back). |
| 🟥 | No automated screen tests. |

## 💡 Tip: check a screen without signing in
For layout checks I use a temporary page with the database calls replaced by fake data. It is **never committed**.
