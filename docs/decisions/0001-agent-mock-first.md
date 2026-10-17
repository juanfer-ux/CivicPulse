# 0001: The agent starts as rules plus SQL tools, no LLM yet
**Status:** ✅ Accepted   **Date:** 2026-10-14

## Context
The brief wants an AI agent that answers questions with real numbers. An LLM needs a server-side key, cost, and careful testing, and it must never invent figures.

## Decision
Build the agent in **mock mode** first: a rule-based planner picks one SQL tool, and answer text is templated from the returned numbers. A badge says "Mock mode".

## Consequences
- ✅ Every number is real and testable; no key or cost; works offline from any LLM.
- ✅ Tools, answer shape and rules stay when an LLM is added later (it replaces only the planner, in an Edge Function).
- ⚠️ Limited phrasing: unusual questions get "I cannot answer that yet".
