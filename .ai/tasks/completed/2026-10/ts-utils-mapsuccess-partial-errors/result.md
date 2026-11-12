# Result: `ts-utils-mapsuccess-partial-errors`

**Shipped:** `mapSuccess` and `mapSuccessAsync` now append every failure message to a supplied
`aggregatedErrors`, in input order, whether or not any result succeeded — so a partial fold reports
what it dropped, as the parameter always promised. The returned `Result` is unchanged.

Origin: personaility#691 (fgv-ask). Base / target: `integration/asks`. PR: #752.

## What changed

- `libraries/ts-utils/src/packlets/base/mapResults.ts` — `mapSuccess` calls
  `aggregatedErrors?.addMessages(errors)` whenever `errors.length > 0`, then fails only if
  `elements.length === 0`. Previously the append sat inside the all-failed branch. TSDoc for
  `aggregatedErrors` and `@returns` now states both halves, including `Success([])` for empty input.
- `libraries/ts-utils/src/packlets/base/mapResultsAsync.ts` — no code change: `mapSuccessAsync`
  delegates to `mapSuccess` after `_collectResults` restores input order, so it inherits the fix.
  Both overloads' TSDoc said "discarding failures unless everything failed"; they now say "failing
  only if everything failed" and carry a remark that every failure reaches
  `IAsyncResultOptions.aggregatedErrors` in input order.
- `libraries/ts-utils/src/packlets/base/README.md` — the export-table row and the `mapSuccess`
  example now show the aggregator and say every failure reaches it.
- `common/changes/@fgv/ts-utils/ts-utils-mapsuccess-partial-errors_2026-10-20-00-00.json` —
  `minor`, comment stating the behaviour change plainly and that it brings behaviour in line with
  the documented contract (not prefixed `BREAKING:`, per the brief).
- `etc/ts-utils.api.md` — byte-identical (no signature moved).

## Tests

`src/test/unit/mapResults.test.ts` (`mapSuccess function`), three new tests:

| test | red on e15b1d440? |
|---|---|
| partial fold: aggregator gets exactly the failures, in input order, after a pre-seeded message; still `toSucceedWith` the successes | **red** |
| all-succeeded fold adds nothing | green (pins unchanged behaviour) |
| empty input adds nothing, `toSucceedWith([])` | green (pins unchanged behaviour) |

The existing "appends to aggregatedErrors if supplied" test already covers the all-failed case and
is unchanged.

`src/test/unit/mapResultsAsync.test.ts` (`mapSuccessAsync › aggregatedErrors`). The previous test
"appends errors to a supplied aggregator only when everything fails" **pinned the bug** and was
replaced. Five new tests:

| test | red on e15b1d440? |
|---|---|
| partial fold, deferred form, `concurrency: 4`, delays chosen so completion order ≠ input order (e1 finishes last, e3 first); aggregator gets `['earlier', 'e1', 'e3']` | **red** |
| partial fold, `(items, fn)` form, `concurrency: 3`, per-index delays reordering completion; aggregator gets `['even 2', 'even 4']` | **red** |
| all-failed fold unchanged, both forms, `concurrency: 2` | green |
| all-succeeded fold adds nothing, both forms | green |
| empty input adds nothing, both forms | green |

**Red-then-green evidence.** With the tests applied and the fix not yet applied, `heft test
--test-path-pattern mapResults` failed exactly three tests:

```
● async Result family › mapSuccessAsync › aggregatedErrors › receives every failure in input order from a partial fold (deferred form, concurrent)
● async Result family › mapSuccessAsync › aggregatedErrors › receives every failure in input order from a partial fold (items form, concurrent)
● mapResults module › mapSuccess function › appends every failure to aggregatedErrors in input order when only some results failed
```

After the fix: `mapResults.test.js` 61 passed / 0 failed, `mapResultsAsync.test.js` 72 passed / 0
failed; `mapResults.ts` and `mapResultsAsync.ts` at 100% on all four metrics.

## Sibling sweep (`mapResults.ts`, `mapResultsAsync.ts`)

Each fold checked for a gap between what its `aggregatedErrors` doc promises and what it does.

| fold | doc promise | behaviour | verdict |
|---|---|---|---|
| `mapResults` | any error messages appended | appends whenever any failed (and fails) | correct |
| `mapDetailedResults` | any non-ignorable messages appended | appends every non-ignorable failure (and fails) | correct (see observation 2) |
| `mapSuccess` | any returned error messages appended | appended only when all failed | **mismatch — fixed** |
| `mapFailures` | any returned error messages appended | appends each failure as found | correct |
| `allSucceed` | any returned error messages appended | appends whenever any failed (and fails) | correct |
| `firstSuccess` | — (no `aggregatedErrors` parameter) | — | n/a |
| `populateObject` (both overloads) | any returned error messages appended | appends whenever any failed (and fails) | correct |
| `mapResultsAsync` | via `IAsyncResultOptions.aggregatedErrors` | delegates to `mapResults` | correct |
| `mapDetailedResultsAsync` | same | own fold; appends every non-ignorable failure, incl. capture failures | correct |
| `mapSuccessAsync` (both overloads) | same; TSDoc said "discarding failures unless everything failed" | delegated to buggy `mapSuccess` | **mismatch — fixed by the `mapSuccess` fix; TSDoc corrected** |
| `mapFailuresAsync` | same | delegates to `mapFailures` | correct |
| `allSucceedAsync` | same | delegates to `allSucceed` | correct |
| `populateObjectAsync` | any error messages appended | appends whenever any failed (and fails) | correct |
| `firstSuccessAsync` | appended **if no attempt succeeds** | appends only when none succeeded (`no results found` for empty) | correct — the doc deliberately scopes it, and "first" has no partial fold |

## Aggregator-caller sweep

`grep -rE '\bmapSuccess(Async)?\b'` over `libraries/ tools/ samples/` (plus `apps/ services/`,
which do not exist here), excluding `lib/`, `dist/`, `docs/` and `node_modules`:

| site | passes an aggregator? |
|---|---|
| `libraries/ts-utils/src/test/unit/mapResults.test.ts` | yes — the tests above |
| `libraries/ts-utils/src/test/unit/mapResultsAsync.test.ts` | yes — the tests above |
| `libraries/ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts:1928` `mapSuccess(results).orDefault([])` | **no** — unaffected, not changed (per brief) |
| `libraries/ts-agent-memory/src/test/unit/store/lenientOpen.test.ts:209` | no — the name appears only in a test title |

**No production caller anywhere in the repo passes an aggregator to `mapSuccess` /
`mapSuccessAsync`**, so nothing downstream in this monorepo changes behaviour. The repo-wide
`rush test` confirms it.

## Gates

All logs under `<worktree>/.gate-logs/`, graded by grep (`not met|FAILURE|Operations failed|error TS`
= 0; `-i warning` = only the Git-tracked symlink notice).

| gate | result |
|---|---|
| `ts-utils` `rushx fixlint` | clean, no changes |
| prettier 2.8.8 on changed `.ts` files | applied before commit |
| `ts-utils` `rushx build` | 0 errors, 0 warnings |
| `ts-utils` `rushx lint` | 0 errors, 0 warnings |
| `ts-utils` `rushx test` | 0 failures, 0 warnings; All files 99.27 / 99.64 / 99.29 / 99.27 (threshold 98) |
| `rush rebuild` (repo-wide) | `SUCCESS: 39 operations`, 0 bad, symlink notice only |
| `rush test` (repo-wide) | `SUCCESS: 38 operations` + `NO OP: 1` (39), 0 bad, symlink notice only, no NUL padding; no load-sensitive flakes this run |
| `rush change --verify --target-branch origin/integration/asks` | pass |

## Observations (not changed)

1. **`ts-agent-memory`'s `mapSuccess(results).orDefault([])`** passes no aggregator and is
   unaffected. It still drops its failures by design of that call site; if the requester wants them
   reported, the fix there is now one argument.
2. **`mapDetailedResults` / `mapDetailedResultsAsync` treat a failure with a falsy `detail` as
   ignorable** (`result.detail && !ignore.includes(result.detail)`): such a failure reaches neither
   the returned `Result` nor the aggregator. That is a return-value question, not an aggregator
   docs-vs-behaviour gap, and the doc ("details that cannot be ignored") does not clearly cover it,
   so it is outside this brief. Worth a separate look.
3. **The sync family's TSDoc calls `aggregatedErrors` an "Optional string array"**; its type is
   `IMessageAggregator`. Left as is for sibling consistency across the six functions — a wording
   sweep, not a behaviour fix.
4. **`libraries/ts-utils/docs/`** (generated TypeDoc) still carries the old `mapSuccess` wording. It
   is not maintained per stream (it does not include the async family at all), so it was not
   regenerated here.
5. **`CAPABILITIES.md`** never described the old behaviour (it says the async `map*` collectors
   "aggregate every error", which is now true of `mapSuccessAsync` too), so it needed no edit.

## Brief accuracy

- The brief's "README.md line ~41" row (`fails only if all fail`) describes the return value, which
  is unchanged, so it was not wrong; it was amended anyway to mention the aggregator, and the
  `### mapSuccess` example further down (line ~274) was updated to show it.
- Otherwise the brief held: one real mismatch (`mapSuccess`), inherited by `mapSuccessAsync`, and
  `mapSuccessAsync`'s TSDoc described the bug.
