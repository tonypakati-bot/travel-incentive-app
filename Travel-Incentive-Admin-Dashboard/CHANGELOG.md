# Changelog

## Unreleased

- Remove RUOLO column from CreateTrip participant section and related documentation (Sezione 5).
  - Rationale: participant role is not stored per-participant; prefer explicit per-trip labels or staffAssignments if needed.
  - Files changed: `components/CreateTrip.tsx`, `StrutturaDB`.
  - No database migration required.

