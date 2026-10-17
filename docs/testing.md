# 🧪 Testing

> **Status:** 🟨 Draft (2026-10-17).

## ✅ Before every publish
```bash
npm test         # 16 unit tests (planner, categories and answers)
npm run lint     # code checks
npm run build    # type-check, then bundle
```

## 🧪 What each kind of test covers
| | Kind | Where | Covers |
|---|---|---|---|
| 🟩 | Unit tests (Vitest) | `src/lib/agent.test.ts`, `src/lib/users.test.ts` | Question routing, accent-insensitive localities, percentage rules, empty periods, small samples, ties, honest "cannot answer", proposals with no dispatch, tool errors surfaced; Users screen: diff of granted vs wanted access, Pending/Active/Off status |
| 🟩 | Permission smoke test (SQL) | `supabase/tests/rls_smoke.sql` | **33 checks** for Locality Admin, three kinds of Specialist and Super Admin: scope by locality and category, agent tools scoped the same, nobody promotes themselves, approve and escalate flow, no forged audit events, no pre-approved recommendations, last Super Admin protected, role and access changes audited |
| 🟨 | Manual checklist | below | Screens, sign-in, map |
| ⬜ | Screen tests | none yet | Components and flows |

## 🔐 Running the permission smoke test
1. Open the Supabase **SQL Editor**, paste `supabase/tests/rls_smoke.sql`, run it.
2. It **always ends with an error that contains a `RESULT` line**. That is by design: the error rolls back everything the test created, so no data is left behind.
3. Expect **`RESULT PASS 33/33`**. Any failure is listed by name. A Super Admin must exist, and both seed files must have run.

## 📝 Manual checklist (after a deploy)
- [ ] Sign-in page loads with the logo, no console errors.
- [ ] Sign in; the map shows points (needs hardware acceleration), or the list appears with a message.
- [ ] Filters change the counts; clicking a point opens the incident with placeholder photos.
- [ ] Ask the suggested questions; evidence and limitations appear; map rings appear.
- [ ] Phone width: bottom sheet with Explore and Investigate tabs.
- [ ] Super Admin: **Users** button opens the table; a role or locality change persists after reload; you cannot change your own role. Other roles do not see the button.
- [ ] Category filter: choose Illegal dumping, then Obstructive parking; counts change.

## 🟥 Gaps
| | Gap |
|---|---|
| 🟥 | No sample user per role to **sign in** with (the SQL test uses fake users that are rolled back). |
| 🟥 | No automated screen tests. |

## 💡 Tip: check a screen without signing in
For layout checks I use a temporary page with the database calls replaced by fake data. It is **never committed**.
