# 0004: All data is synthetic and flagged
**Status:** ✅ Accepted   **Date:** 2026-10-14

## Context
This is a prototype about real civic problems in Bogotá. Real reports, plates or photos would raise privacy and legal issues.

## Decision
Every incident is generated (`is_synthetic = true`), plates use a fictional format, photos and videos are placeholders, and the UI says "Synthetic data". The seed is deterministic and re-runnable.

## Consequences
- ✅ Safe to demo and to publish.
- ⚠️ Findings describe the generated data, not real Bogotá. Answers always say so.
- ⚠️ The Chapinero spike and hotspots are built in so the investigations have something to find.
