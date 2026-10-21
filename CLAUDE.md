# Civic Pulse

Documentation index: [docs/README.md](docs/README.md). Each topic has one document; read the relevant one before changing that area, and update it first.

- Roles, permissions, scope (localities, incident categories), who may approve, escalate or manage users: [docs/roles-and-permissions.md](docs/roles-and-permissions.md). Source of truth for access.
- Tables and migrations: [docs/data-model.md](docs/data-model.md). AI agent tools and rules: [docs/ai-agent.md](docs/ai-agent.md). States: [docs/incident-lifecycle.md](docs/incident-lifecycle.md).
- Publishing and troubleshooting: [docs/deploy.md](docs/deploy.md). Tests: [docs/testing.md](docs/testing.md). Design rules and mobile rule: [docs/design.md](docs/design.md). Design values (tokens, text styles, components): [docs/design-system.md](docs/design-system.md); Figma is the source of truth.

Rules:
- If code and a document disagree, say so and ask the owner. Do not silently pick one.
- Run `supabase/tests/rls_smoke.sql` after any permission change.
- The repository is public: never put keys, passwords, emails or private links in code or docs.
- Every screen must also have a mobile version (about 390x844); see docs/design.md.
