# 🧑‍💼 The operator's day (prototype flow)

> Status 🟨 Draft · owner and agent, 2026-11-23. **What it answers:** how does an operator get into the app, analyze some data and take a look at one recurrence, and which of those steps exist in the prototype today? The recording script that runs this flow is [demo-script.md](demo-script.md); the agent's rules are in [ai-agent.md](ai-agent.md).

The flow follows the agent's own loop from the project's capstone brief (kept outside this repo): **Ask → Investigate → Discover → Check rules → Recommend → Challenge → Decide**, with **Act** and **Learn** narrated, not designed as screens. *AI recommends, a human decides.*

## 🗺️ The ten steps
| # | Step | What the operator does | What the system gives them | In the prototype |
|---|---|---|---|---|
| 1 | **Arrive** | Opens the app and wants to know what changed. | The map with the four Stat Cards (top localities and their trend) and "Here's what's happening". | 🟩 Built |
| 2 | **Ask** | Picks or types a question, for example "Which parking obstruction recurrences need attention?" | The agent picks the analysis, answers with a short chart and a "Show on map" button. | 🟩 Built (rule-based, a few phrasings) |
| 3 | **Discover** | Reads the ranked recurrences: which are active, which came back. | Patterns across reports (same corner, different vehicles). | 🟨 Recurrences and returns; no cross-problem links |
| 4 | **Open one recurrence** | Clicks the top one (sidebar, answer row or map). | The recurrence panel: occurrences, returns, reports, interventions, the history, the report dots; Modules menu (timeline). | 🟩 Built |
| 5 | **Understand its surroundings** | Asks "Is this blocking or affecting anything important?" | The few places that matter (school, clinic, bus stop) with distances; "Show places on map". See the design in [ai-agent.md](ai-agent.md). | 🟨 Only the fallback "What is around this recurrence?" exists; the priority question is next |
| 6 | **Check the rules** | Wants to know whether it is a violation here. | The regulation that applies (for example a loading zone until 9 am). | ⬜ Not built |
| 7 | **Recommend** | Asks "What should we do?" | One scoped action tied to the evidence. | ⬜ Not built (the candidate-area answer is the closest) |
| 8 | **Challenge** | "Why this location?" or "What if only one hour?" | The evidence, and the trade-off of the changed constraint. | ⬜ Not built |
| 9 | **Decide** | Approves, adjusts or rejects. | A clear control; nothing is sent without the person. | 🟨 The database part is kept, the screens were removed |
| 10 | **Act and learn** | Narrated: "Patrol created, team assigned", later "no repeats for two weeks". | A line of closing narration. | ⚪ Narrated by design |

## ⏭️ What we build next, in this order
1. The **priority question** at step 5 (the places are already stored).
2. A **recommendation** at step 7, built from what steps 4 and 5 show.
3. **"Why this location?"** at step 8 (reorders evidence we already have).
4. **Regulatory reasoning** at step 6 last: it needs data we do not have.

Keep the status column current in the same pull request that changes a step.
