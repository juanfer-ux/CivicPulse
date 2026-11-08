# Storybook

Storybook shows the design-system components one by one, in every variant and state, so they can be compared with Figma and checked for visual changes with Chromatic. It is a development tool only: it never goes into the production build.

## Run it

```bash
npm run storybook          # http://localhost:6006
npm run build-storybook    # static copy in storybook-static/ (not committed)
```

## How it is set up (owner, 2026-11-05)

- **Packages (dev only):** `storybook`, `@storybook/react-vite`, `@chromatic-com/storybook`, and the `chromatic` CLI that was already there. No browser-test addon, no extra addons: the `storybook init` wizard adds Playwright and a Vitest browser project and rewrites `vite.config.ts`; that was removed on purpose.
- **`.storybook/main.ts`:** finds `src/**/*.stories.ts(x)`; reuses `vite.config.ts`, so the `@` alias and Tailwind work as in the app.
- **`.storybook/preview.tsx`:** imports `src/index.css` (tokens, fonts, text styles), wraps stories in the bold Phosphor `IconContext` like `main.tsx`, and uses the app's dark background (`#111113`, or `#18181B` for panels).
- **Stories** sit beside the component: `button.stories.tsx` (every variant in every size, as in Figma) and `stat-card.stories.tsx` (the four trends). Titles follow the Figma pages: *Actions & inputs*, *Data display*, *Navigation & layout*, *Map & agent*, *Auth & brand*.

## Rules

- Only components that **do not import Supabase or read env** get stories (the same rule as the unit tests, [testing.md](testing.md); CI has no `.env`). Screens such as `Dashboard`, `AuthGate` and anything using `auth.tsx` are out.
- A new component gets its story when it is built, and the story shows every Figma variant and state.
- The repository is public: never put the Chromatic project token in code or docs.

## Chromatic (visual review)

1. Create the project on chromatic.com and copy its project token.
2. Publish from your own terminal, with the token in an environment variable (not in the repo):
   ```bash
   CHROMATIC_PROJECT_TOKEN=<token> npx chromatic
   ```
3. For pull requests, a GitHub Actions step runs the same command with the token stored as a repository secret (not set up yet).

## Open

- Stories exist for Button and Stat Card only; the rest of the components still need theirs.
- Chromatic has not been run yet (needs the token).
