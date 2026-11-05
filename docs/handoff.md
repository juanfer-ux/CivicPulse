# 🤝 Handoff: where we are and how we work

For a new session (local or cloud) that has no memory of the earlier chats. Updated 2026-11-01. This is the only place for "where did we stop"; the decisions and the specs live in their own documents.

## 📍 Where we stopped
- **Problem marker is done** (the owner's option F): neutral-700 circle, 1 px status-colored outline, neutral-100 icon, warning triangle with a 4 px outline; sizes set at the farthest zoom and scaled in proportion. Spec: [design-system/components.md](design-system/components.md) (Problem Marker), decision [0032](decisions/0032-problem-marker-option-f.md).
- **2026-11-01 map shapes:** incidents are circles now (they were squares; same sizes). Problem statuses show the warning triangle (16 px) instead of a dot; incident statuses show a round 12 px swatch. The Problems and Incidents toggle chips are hidden while an incident or problem panel is open and come back when it closes. The problem panel waits until the camera has finished flying, then slides out from under the Investigate and Ask panel.
- **Camera and sidebar:** clicking an incident or problem flies the whole trip with no jump, and the sidebar collapses or expands 1 s later ([design.md](design.md)).
- **Colors:** red, orange, blue and yellow have 100–900 scales like indigo, the 400s unchanged; 57 colors in total (amber-400 and coral-400 were removed: errors and the Active problem status use red-300, warnings and Monitoring use yellow-300) ([decision 0033](decisions/0033-color-scales-red-orange-blue-yellow.md)). They are in `src/index.css`, the docs and Figma, but **not used on screen yet**.
- **Map smoothness:** the map is drawn at 2x with antialiasing; antialiasing has no level to set ([decision 0031](decisions/0031-map-drawn-at-2x-with-antialiasing.md)).
- A page that compares the old and new marker side by side is in `explorations/problem-circle-gallery.html`.

## 🟥 Open items
- **Cursor:** the owner says the flicker in Chrome is fixed (2026-11-01); the hand in Safari over the markers is not checked yet.
- **Mobile:** the markers, the Status menu (44 px rows) and the taps are checked on a test page at 390×844; the real screen (bottom sheet, chips, camera flights) still needs a look on a phone, signed in.
- **Brand colors:** done in Figma and code (2026-11-02): `brand-primary` `#E3E3E7` is the primary button's background and `brand-secondary` `#87DBC7` its hover; decision [0035](decisions/0035-brand-primary-and-secondary.md).
- **Text styles** (2026-11-02): the 22 Figma styles are in the docs and the code (decision [0036](decisions/0036-display-typeface-science-gothic.md)); display-lg, display and display-sm are **Michroma** (2026-11-03 and 2026-11-05); Science Gothic is gone; body-sm styles are 13 px since 2026-11-05 (button-sm stays 13.5) ([decision 0038](decisions/0038-display-typeface-michroma.md)); display-sm stays Science Gothic and no screen uses it. The Foundations Typography sheet in Figma may be out of date.
- **Sign in sizes** (2026-11-02): the Sign in desktop frame in Figma is applied in the code (48 px logo with a 13.24 px gap, as of 2026-11-03 (one Logo component in Figma), 740 px value-prop block, 32 px panel padding, 48 px card spacing). The `Set up your account · Desktop 1440` frame may still show older block and padding sizes (not re-checked after the logo change); the code uses the Sign in numbers for both. The footer is English like Figma (owner: Figma wins, 2026-11-02).
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
