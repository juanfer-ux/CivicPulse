# 🤝 Handoff: where we are and how we work

For a new session (local or cloud) that has no memory of the earlier chats. Updated 2026-11-01. This is the only place for "where did we stop"; the decisions and the specs live in their own documents.

## 📍 Where we stopped
- **Problem marker is done** (the owner's option F): neutral-700 circle, 1 px status-colored outline, neutral-100 icon, warning triangle with a 4 px outline; sizes set at the farthest zoom and scaled in proportion. Spec: [design-system/components.md](design-system/components.md) (Problem Marker), decision [0032](decisions/0032-problem-marker-option-f.md).
- **Camera and sidebar:** clicking an incident or problem flies the whole trip with no jump, and the sidebar collapses or expands 1 s later ([design.md](design.md)).
- **Colors:** red, orange, blue and yellow have 100–900 scales like indigo, the 400s unchanged; 57 colors in total ([decision 0033](decisions/0033-color-scales-red-orange-blue-yellow.md)). They are in `src/index.css`, the docs and Figma, but **not used on screen yet**.
- **Map smoothness:** the map is drawn at 2x with antialiasing; antialiasing has no level to set ([decision 0031](decisions/0031-map-drawn-at-2x-with-antialiasing.md)).
- A page that compares the old and new marker side by side is in `explorations/problem-circle-gallery.html`.

## 🟥 Open items
- **Cursor:** the pointer flickers in Chrome and the hand is missing in Safari over the markers. The CSS is correct everywhere tested; a screen recording would help.
- **Mobile:** check the recent map changes at about 390×844.
- **Figma variable order:** the Figma plugin cannot reorder variables, so in the variables panel the new color steps sit after the 400s (the palette page is in the right order).
- Not decided yet: the Stat Cards for problems; the operator-actions phase needs permissions approved by the owner first.

## 🧭 How we work (the owner's rules)
- **Figma is the source of truth.** A change goes to code, `docs/` and Figma together; if they disagree, ask the owner.
- **Short answers, fewer elements and colors.** Delete before adding.
- **Neutrals are `neutral-100` to `neutral-900`** (900 darkest); color variables are ordered biggest to smallest.
- **Every screen also has a mobile version** (about 390×844).
- **Commit and push only when the owner asks.** Commits end with the co-author line. Never commit the owner's unrelated changes (check `git status` first).
- **The repository is public:** no keys, passwords, emails or private links. Never type the owner's password into a sign-in form; they sign in themselves.
- **Ponytail coding rule** (see `CLAUDE.md`): the least code that works.

## 🧪 How to check things
- `npm test`, `npm run lint`, `npm run build`. **CI has no `.env`:** modules that tests import must not pull in Supabase (see [testing.md](testing.md)).
- **Visual changes:** measure, don't eyeball. Serve a throwaway test page with the dev server (a file starting with `_`, deleted afterwards), read the pixels back, and compare with the old settings. The real map is behind a sign-in, so say what a test page could not cover.
- Ask the owner what they see on their own screen when a rendering problem remains (their screen is 1x, 3440×1440).
