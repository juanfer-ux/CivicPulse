# 📚 Civic Pulse documentation

Start here. Every topic has **one** document; other documents link to it instead of copying it.

## 🗝️ Legend (same in every document)
🟣 Super Admin · 🔵 Locality (Zone) Admin · 🟢 Specialist Operator · ✅ allowed · ❌ not allowed · 🔶 allowed inside scope · 🟩 working · 🟨 partly done · 🟥 gap to fix · ⚪ empty or inactive · ⬜ to do

## 🗺️ Map of the documents
| | Document | What it answers | Status |
|---|---|---|---|
| 🔐 | [roles-and-permissions.md](roles-and-permissions.md) | Who can see and do what? (source of truth for access) | ✅ Approved |
| 🗃️ | [data-model.md](data-model.md) | What is stored, and how are the tables related? | 🟨 Draft |
| 🔄 | [incident-lifecycle.md](incident-lifecycle.md) | How do incidents and recommendations move through states? | 🟨 Draft |
| 🤖 | [ai-agent.md](ai-agent.md) | What can "Investigate and Ask" do, and what are its rules? | 🟨 Draft |
| 🏗️ | [architecture.md](architecture.md) | How do the pieces fit together? | 🟨 Draft |
| 🚀 | [deploy.md](deploy.md) | How do I publish it and fix common problems? | 🟩 In use |
| 🧪 | [testing.md](testing.md) | What is tested and how do I run it? | 🟨 Draft |
| 🎨 | [design.md](design.md) | Brand, mobile rule, Figma workflow (index) | 🟨 Draft |
| 🧩 | [design-system/](design-system/README.md) | The detailed design spec: foundations, components and patterns, accessibility | 🟩 In use |
| 📜 | [decisions/](decisions/README.md) | Why did we choose X? (short numbered records) | 🟩 Started |

## 🧭 Which one do I read?
- 🔒 Changing who can see something → **roles-and-permissions** first.
- 🗄️ Adding or changing a table or column → **data-model**.
- 💬 Changing what the AI agent answers → **ai-agent**.
- 🌐 Something broke after publishing → **deploy** (troubleshooting).
- 🖌️ Building or changing a screen or a component → **design-system/** (values and components) and **design** (rules); accessibility → **design-system/accessibility.md**.

## ✍️ Rules for keeping these useful
1. **One topic, one document.** Link, don't copy.
2. **Technical documents have "as built" (what is true today) and "target" (what we plan).** Never mix them.
3. **Change the document first, then the code.** If they disagree, ask the owner.
4. **Date important decisions** in the document's log or in [decisions/](decisions/README.md).
5. 🔐 This repository is public: no keys, passwords, emails or private links in any document.
