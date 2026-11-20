# ts-utils-mapsuccess-partial-errors — a partial fold reports its failures

**Shipped**: 2026-10-20 into `integration/asks` via #752.
Package: `@fgv/ts-utils` (`base`). Origin: personaility#691 (fgv-ask). Change file typed `minor`.

## Summary

`mapSuccess(results, aggregatedErrors?)` promised to append "any returned error messages" to the
aggregator, but did so only when every result failed. A partial fold — the case a lenient fold
exists for — dropped its failures silently. `mapSuccessAsync` delegates to `mapSuccess` and inherited
the bug; its TSDoc ("discarding failures unless everything failed") described the bug.

Now both append **every** failure, in input order, whether or not anything succeeded. The returned
`Result` is unchanged: `Success` with the successes if any succeeded, `Failure` with the joined
messages if all failed, `Success([])` for empty input.

## What a reader should know

- **This is a behaviour change on an established surface**, typed `minor` because it brings the
  code in line with its documented contract. A caller passing an aggregator to a partial fold now
  sees messages it did not see before. No caller in this repo does.
- **The other twelve folds were checked** (eleven correct; `firstSuccess` takes no aggregator) — table in `result.md`.
  `firstSuccessAsync` appends only when nothing succeeded, and its doc says exactly that.
- **One existing test pinned the bug** and was replaced. The new partial-fold tests were shown red
  against the old code; the all-failed, all-succeeded and empty cases were green before and after.
  The async tests run with `concurrency` > 1 and with delays that reorder completion, so the
  input-order guarantee is exercised.
- **Not changed, worth a look:** `mapDetailedResults` treats a failure with a falsy `detail` as
  ignorable, so it reaches neither the returned result nor the aggregator.

## Artifacts

- `brief.md` — the frozen contract
- `result.md` — the change list, tests with red/green status, the sibling sweep, the caller sweep,
  gate results and observations
- `state.md` — the worker's checkpoint
- `meta.yaml` — the index record
