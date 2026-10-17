# 0008: Incident categories and specializations are tables
**Status:** ✅ Accepted   **Date:** 2026-10-17

## Context
The category was a hard-coded `parking` check. The owner defined Traffic, Environmental and Infrastructure specializations, each grouping incident categories, and wants specialists assigned per category.

## Decision
`specializations` and `incident_categories` tables (with an `active` flag). `incidents`, `recommendations` and per-user access point at categories with foreign keys. A specialization is only a grouping; access is granted per category per person.

## Consequences
- ✅ Adding a category (for example under Infrastructure) is a data change, not a redesign.
- ✅ Recommendations and decisions are scoped by category as well as locality.
- ⚠️ Parking-specific fields (`obstruction_subtype`) stay optional; other categories use `subtype`.
