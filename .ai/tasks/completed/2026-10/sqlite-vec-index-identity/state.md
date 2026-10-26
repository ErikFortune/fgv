# State: `sqlite-vec-index-identity`

Worker-owned working surface. The brief is frozen; questions and interpretations live here.

## Status

- [x] Setup: branch `sqlite-vec-index-identity` from `origin/sqlite-vec-index-identity` @ 9e68104bf, `rush install`
- [x] Shared identity helper (`indexIdentity.ts`) + `IIndexIdentityReport` in `model.ts`
- [x] Wired into `SqliteVecVectorIndex` and `SqliteVecFragmentIndex`
- [x] Tests: `indexIdentity.test.ts` on both lanes; red shown by compile failure on the pre-stream
      source and by ten reverted mutations (table in `result.md`)
- [x] README / CAPABILITIES / api.md / change file (`minor`)
- [x] Gates (results in `result.md`)
- [x] Finalized to `.ai/tasks/completed/2026-10/sqlite-vec-index-identity/`

## Interpretations (brief silent or ambiguous)

Listed with reasoning in `result.md` § "Interpretations". In short: `incomplete` outranks
`unchecked`; an identity-less first write deletes an orphan row instead of creating the meta table;
an identity-less rebuild still writes the marker; the final rebuild commit is conditional on the
marker; `adoptIdentity` is refused on `match` (brief-literal).

## Questions for the orchestrator

1. Should `identity()` itself run in a read transaction so its two reads are one snapshot? Every
   path that acts on the status already does. Two-line change; not made, to keep the brief's
   surface exactly.
2. Should `adoptIdentity()` succeed idempotently on `match`? The brief says absent-only.

## Notes

- Mid-stream, the four existing "a rebuild prepares nothing" tests went red. Their premise changed,
  not their property. See `result.md` § "An existing test whose premise changed".
- Repo prettier is 2.8 (`common/autoinstallers/rush-prettier`), but `npx prettier` resolves 3.x.
  Formatting was done with a scratch-installed 2.8.8.
