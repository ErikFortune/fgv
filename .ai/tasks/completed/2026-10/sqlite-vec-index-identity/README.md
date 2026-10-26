# sqlite-vec-index-identity — the embedding identity lives in the index file

**Shipped**: 2026-10-26 into `integration/asks` via #TBD.
Package: `@fgv/ts-agent-memory-sqlite-vec` (`sqlite-vec-index`). Origin: personaility#699
(fgv-ask). Change file typed `minor` (additive).

## Summary

A reopened `SqliteVecVectorIndex` or `SqliteVecFragmentIndex` recovered its dimension from the
`vec0` DDL and nothing else, so two embedding models of the same width were indistinguishable and a
model swap kept serving vectors from another embedding space. An identity kept in a sidecar could
come apart from the vectors through a copy, restore or snapshot. And `rebuild`, which awaits the
embedder between a clear and the last insert, could leave a partial table that nothing detected.

Now each index takes an optional opaque `identity`, stores it in an ordinary
`fgv_sqlite_vec_meta` table in the same file (one row per index table), and reports it with
`identity()` — `fresh`, `match`, `mismatch`, `absent`, `incomplete` or `unchecked` — on every call.
Writes and queries are fenced on `mismatch` and `incomplete`; `rebuild` is the remedy and marks the
row `rebuilding` in the same transaction as its clear, committing the identity only at the end.
`adoptIdentity()` migrates an `absent` index from a sidecar without re-embedding, and is an
idempotent no-op on `match`. `identity()` takes its reads in one read transaction.

## What a reader should know

- **Legacy files keep working.** No migration; a missing table or row is `absent` and is not fenced.
  A plain write never commits an identity to an existing table.
- **The in-memory indexes were deliberately not touched**, nor the `IVectorIndex` /
  `IFragmentVectorIndex` interfaces. Nothing an in-memory index holds can disagree with its caller.
- **Every check-then-act window is enumerated in `result.md`**, with what closes it. One is left
  open on purpose and documented: concurrent rebuilds of one table on two connections are not
  detected (the marker is not a lock).
- **Limits stated in the README:** a model swap to a different width still needs a
  drop-and-re-index (a rebuild fails and leaves `incomplete`); an older package version ignores the
  meta table, so a downgrade can leave a row that no longer describes the vectors.
- **One existing test's premise changed:** a rebuild now prepares the meta statements once and keeps
  them. The "prepares nothing" tests warm up with one rebuild and still pin that no later rebuild
  prepares anything.
- **Review round 1 changed the design in one place.** A `rebuilding` row reads `incomplete` even
  while the table does not exist yet. The first version reported `fresh`, which let another handle
  certify its own identity over a fresh index's rebuild (P1). The same round made every write
  transaction `IMMEDIATE`, made the rebuild empty whatever table the file holds, made a width change
  fail the rebuild in every mode, and fixed release-during-rebuild. The finding → fix → test → red
  table is in `result.md`.
- **Seven interpretations** where the brief was silent are listed in `result.md`. Two questions
  raised at close-out (a snapshot-consistent `identity()`, idempotent adopt on `match`) were
  answered yes by the orchestrator and landed in a follow-up commit on the same branch.

## Artifacts

- `brief.md` — the frozen contract
- `state.md` — working checkpoint and questions
- `result.md` — what shipped, interpretations, check-then-act table, red→green mutation table, gates
