# State: `chores-2026-10-asks`

Worker-owned. Branch `chores-2026-10-asks`, from the brief commit `c05474933`.

## Progress

- [x] Item 1 — `IProvenance.derivedFrom` docstring (`@fgv/ts-agent-memory`), commit `0cb13fa8c`.
- [x] Item 2 — weighted pick (`@fgv/ts-random`), commit `9032317ff`.
- [x] Repo-wide `rebuild` and `test`, change verify, capability-doc checks.
- [x] Close-out: migrated to `completed/2026-10/`, `meta.yaml`, `README.md`, `docs/CHORES.md` entry.

## Decisions taken during the work

- **Item 1, "queryable".** Not claimed. No retrieval axis, index or store list filter reads
  `provenance.derivedFrom`; the only way to select on it is the generic whole-record
  `IMemoryQuery.filter` predicate. The docstring says exactly that.
- **Item 1, sweep.** `ingest/model.ts` (`IIngestItem.sourceId`) called the field a "back-link"; reworded.
  `CAPABILITIES.md` and the README do not mention `derivedFrom` (their "backlink index" is the link-edge
  index, which is correct and unrelated). `docs/FUTURE.md` still said `derivedFrom` "stays a bare
  `MemoryId`", which the code contradicts (it is an `IEdgeTarget`, and `TECH_DEBT.md` already retired the
  item); corrected in the same commit.
- **Item 2, placement.** `pickWeightedAt` and `IWeightedCandidate` live in `src/generator/generators.ts`
  beside `pickNext`, and reach the public barrel through the existing `export *` as
  `Generator.pickWeightedAt` / `Generator.IWeightedCandidate`.
- **Item 2, draw consumption.** `pickWeighted` always consumes exactly one `nextFloat()`, even when it
  returns `undefined`. Documented and tested, so the generator's position is predictable.
- **`docs/workstreams/2026-10.md`.** Not written. No chore batch has ever been filed there; chore batches
  close in `docs/CHORES.md` § Completed batches, per that file's process notes.

## Open questions

None blocking. See `result.md` § What the brief got wrong.
