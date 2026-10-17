# 🧪 Testing

> **Status:** 🟨 Draft (2026-10-17).

## ✅ Before every publish
```bash
npm test         # 14 unit tests (planner and answers)
npm run lint     # code checks
npm run build    # type-check, then bundle
```

## 🧪 What each kind of test covers
| | Kind | Where | Covers |
|---|---|---|---|
| 🟩 | Unit tests (Vitest) | `src/lib/agent.test.ts` | Question routing, accent-insensitive localities, percentage rules, empty periods, small samples, ties, honest "cannot answer", proposals with no dispatch, tool errors surfaced |
| 🟩 | Permission smoke test (SQL) | `supabase/tests/rls_smoke.sql` | A restricted user sees only their locality; agent tools are scoped the same; nobody promotes themselves; no forged audit events; no pre-approved recommendations |
| 🟨 | Manual checklist | below | Screens, sign-in, map |
| ⬜ | Screen tests | none yet | Components and flows |

## 🔐 Running the permission smoke test
1. Open the Supabase **SQL Editor**, paste `supabase/tests/rls_smoke.sql`, run it.
2. It **always ends with an error that contains a `RESULT` line**. That is by design: the error rolls back everything the test created, so no data is left behind.
3. Compare the `RESULT` line with the "Expected" list at the top of the file. A Super Admin must exist first.

## 📝 Manual checklist (after a deploy)
- [ ] Sign-in page loads with the logo, no console errors.
- [ ] Sign in; the map shows points (needs hardware acceleration), or the list appears with a message.
- [ ] Filters change the counts; clicking a point opens the incident with placeholder photos.
- [ ] Ask the three suggested questions; evidence and limitations appear; map rings appear.
- [ ] Phone width: bottom sheet with Explore, Investigate and Recs tabs.
- [ ] Send a recommendation for review; approve or reject it; the audit trail shows both steps. ⚠️ This writes real rows to the shared database.

## 🟥 Gaps
| | Gap |
|---|---|
| 🟥 | Permission tests cover only Super Admin and Locality Admin. The full list of cases (T1 to T12) is in [roles-and-permissions.md](roles-and-permissions.md#-7-test-cases-they-map-to-supabasetestsrls_smokesql). |
| 🟥 | No sample user per role to sign in with. |
| 🟥 | No automated screen tests. |

## 💡 Tip: check a screen without signing in
For layout checks I use a temporary page with the database calls replaced by fake data. It is **never committed**.
