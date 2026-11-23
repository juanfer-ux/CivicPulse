# 🎬 Demo script (for a recorded run)

> Status 🟨 Draft · owner and agent, 2026-11-23. **What it answers:** what exactly does Claude do, click by click, when it runs the prototype while the owner records the screen? The flow it follows, with what is built and what is not, is [operator-flow.md](operator-flow.md). Finish and tune this script when the steps it uses are built; steps marked ⬜ are placeholders.

## 🧰 Before you press record
- Open the **production** address (or `http://localhost:5173/` for a local run), in a window of **1,880 × 1,000** (the design size; see [design.md](design.md)), signed in as the demo account. **Claude never types the password**: the owner signs in first.
- Add `?places=1` only if the demo should show the places card on every recurrence; the demo normally asks the agent instead (step 5).
- Starting state: nothing open, sidebar expanded, the agent on its landing ("Welcome back"). Reload once to reset.
- Data: the synthetic set. **Recurrence to open: ⚠️ to confirm before recording** (candidates: PR-00085 parking, 41 places, the richest; PR-00082 parking, 25 places; PR-00092 dumping, Kennedy, 5 places, listed in the sidebar).
- If any step below differs from what is on screen, **Claude stops and says so**; it does not improvise.

## 🪜 The steps
| # | Do (exact) | Expect on screen | Hold | Say (optional) |
|---|---|---|---|---|
| 1 | Nothing: let the landing show. | Stat Cards (top localities), "Here's what's happening", "Recurrences to investigate". | 4 s | "This is what the city looks like this morning." |
| 2 | Type in the agent box: `Which parking obstruction recurrences need attention?` and send. | A ranked list of recurrences with a "Show on map" button. ⚠️ confirm the exact wording of the suggested question before recording. | 5 s | "I ask in plain words; the agent picks the analysis." |
| 3 | Click "Show on map". | The answer's recurrences are highlighted on the map. | 4 s | "The answer is on the map, not only in a list." |
| 4 | Click the first recurrence row. | The camera flies in; the recurrence panel opens (occurrences, returns, reports, interventions, history). | 6 s | "One recurrence, with its history." |
| 5 | Type: `What is around this recurrence?` (⬜ later: `Is this blocking or affecting anything important?`) and send. Then click "Show places on map". | A short list of the nearest places with distances; blocks with stems and markers on the map. | 6 s | "What is around it, drawn where it is." |
| 6 | ⬜ Ask whether it is an actual violation here. | ⬜ Not built. | | |
| 7 | ⬜ Ask `What should we do?` | ⬜ Not built. | | |
| 8 | ⬜ Ask `Why this location?` then `What if only one hour?` | ⬜ Not built. | | |
| 9 | ⬜ Approve or reject. **Claude stops and asks the owner before pressing it.** | ⬜ Not built. | | |
| 10 | Narrate only: "Patrol created, team assigned; later, no repeats." | | | |

## 📏 Rules for the run
- 🧑 Claude moves at human pace: one action, then the hold time, then the next.
- 🛑 Claude stops before anything that approves, rejects, sends or deletes, and asks.
- 📸 Claude can take a screenshot at each step and report pass, partial or not built against [operator-flow.md](operator-flow.md).
- 🔁 To rehearse, ask Claude to run the script without recording and list what differs.
