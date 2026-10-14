# Civic Pulse 2.0

Civic Operations Agent prototype for synthetic parking incidents in Bogotá. All incident data is synthetic.

## Stack
React 19, TypeScript (strict), Vite, Tailwind v4, shadcn/ui (Radix, Nova preset), lucide-react. Planned: Supabase (auth, Postgres, RLS), MapLibre, an Edge Function agent.

## Setup
```bash
npm install
npm run dev
npm run build
```

## Design system
Dark-only. Tokens in `src/index.css` come from the CivicPulse Figma file (Theme, Dark) with shadcn token names plus extensions `ai`, `warning`, `incident`, `inset`. Font: Gilroy (licensed; web files copied from the owner's Portfolio_2026 project).

## Status
Phase 2, foundation step 1: scaffold, shadcn/ui, tokens, shell placeholder. Next: Supabase project, schema + RLS, auth.
