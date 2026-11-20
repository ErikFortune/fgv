# Result: `chores-2026-10-asks`

Two PersonAIlity asks, one commit each, on branch `chores-2026-10-asks` (PR #732 into `integration/asks`).

## Item 1: `IProvenance.derivedFrom` docstring (personaility#670), commit `0cb13fa8c`

**Shipped.** `libraries/ts-agent-memory/src/packlets/types/envelope.ts` now describes the field as
**provenance, not a live reference**: it records which source record produced this record, is stamped per
write, and keeps naming that source after the source is withdrawn (clearing would erase a true fact, and
repointing would assert a write that never happened). A reader who resolves it must handle a source that no
longer exists and, for a versioned kind, an address naming a superseded version. The explanation of why the
field is scope-qualified is kept.

**Sweep.**

| place | finding | action |
|---|---|---|
| `ingest/model.ts` (`IIngestItem.sourceId`) | "scope-qualified back-link" | reworded as an address that is provenance, not a live reference |
| `libraries/ts-agent-memory/CAPABILITIES.md` | no mention of `derivedFrom`; "backlink index" refers to link edges | none needed |
| `libraries/ts-agent-memory/README.md` | no mention of `derivedFrom` or a back-link | none needed |
| `docs/FUTURE.md` (agent-memory scoped-target entry) | said `derivedFrom` "stays a bare `MemoryId`", which the code contradicts | corrected |

Change file: `@fgv/ts-agent-memory`, type `none`. `etc/ts-agent-memory.api.md` is unchanged: API Extractor
does not carry member docstrings into the report.

### The "queryable" verdict: **not queryable. The docstring does not say it is.**

- `git grep derivedFrom -- libraries/ts-agent-memory/src/packlets/retrieve` returns nothing.
- Across `src/packlets`, `derivedFrom` appears only in the type, the envelope converter, the ingest model,
  and the ingest orchestrator's stamping (`orchestrator.ts:852`). The `index` and `store` packlets do not
  index it or filter on it. The one `derivedFrom` hit under `src/test/unit/retrieve` is a test *name*: it
  exercises an ordinary `links` edge, not the provenance field.
- `IMemoryQuery.provenanceSource` matches `provenance.source` only. `CAPABILITIES.md` states it is
  deliberately not a match on any other provenance field.
- The only way to select records by it is the generic whole-record `IMemoryQuery.filter` predicate, which
  reads every envelope-survivor. That is not a query axis. The docstring says: "No retrieval axis indexes
  this field; selecting records by it takes an `IMemoryQuery.filter` predicate over whole records."

## Item 2: weighted pick (personaility#669), commit `9032317ff`

**Shipped** in `libraries/ts-random/src/generator/generators.ts`, beside `pickNext`. It reaches the public
barrel through the existing `export *`, as `Generator.pickWeightedAt` and `Generator.IWeightedCandidate`.

- `interface IWeightedCandidate<T> { readonly item: T; readonly weight: number }`
- `pickWeightedAt<T>(unit, candidates): T | undefined`: pure. TSDoc states every edge rule.
- `PseudoRandomGenerator.pickWeighted<T>(candidates): T | undefined`: delegates to
  `pickWeightedAt(this.nextFloat(), candidates)` and always consumes exactly one draw.
- Docs:
  - a `CAPABILITIES.md` method-table row and a *Weighted pick* section;
  - "Not in scope" updated;
  - a router shortcut ("Need a weighted random choice, or the same choice from a hash?");
  - a `docs/FUTURE.md` entry for `pickWeightedSequence`.
- Change file: `@fgv/ts-random`, type `minor`. Existing behaviour and signatures are unchanged.

### Edge-rule table (`src/test/unit/weightedPick.test.ts`)

| rule | test |
|---|---|
| zero weight never chosen | `eligibility › never chooses a zero-weight candidate` |
| negative weight never chosen | `eligibility › never chooses a negative-weight candidate` |
| `NaN` weight never chosen | `eligibility › never chooses a NaN-weight candidate` |
| `±Infinity` weight never chosen | `eligibility › never chooses an infinite-weight candidate` |
| ineligible candidates take no share | `eligibility › ineligible candidates take no share of the range` |
| empty list → `undefined` | `no eligible candidate › returns undefined for an empty list` |
| all ineligible → `undefined` | `no eligible candidate › returns undefined when every weight is ineligible` |
| `unit = 0` accepted | `unit range › accepts unit = 0 and chooses the first eligible candidate` |
| `unit = 1` accepted, lands on last | `unit range › accepts unit = 1 and chooses the last eligible candidate` |
| `unit < 0` → `undefined` | `unit range › returns undefined for a unit below 0` |
| `unit > 1` → `undefined` | `unit range › returns undefined for a unit above 1` |
| `NaN` unit → `undefined` | `unit range › returns undefined for a NaN unit` |
| `point < cumulative` at a boundary | `walk › a point on a cumulative boundary belongs to the next candidate (point < cumulative)` |
| input order | `walk › walks candidates in input order` |
| last by elimination | `walk › the last eligible candidate wins by elimination on a floating-point shortfall` |
| single eligible | `walk › a single eligible candidate is always chosen` |
| stability pins | `stability › pins fixed (unit, candidates) pairs to their chosen item` |
| matches the consumer's walk | `stability › matches the reference positive-weight walk across a grid of units` |
| rescale only on overflow | `stability › does not rescale ordinary weights` |
| overflow rescale | `overflow › rescales by the largest eligible weight when the total is not finite` and `overflow › keeps relative weights when rescaling` |
| method delegates | `PseudoRandomGenerator.pickWeighted › delegates to pickWeightedAt with the next float` |
| method no eligible → `undefined` | `PseudoRandomGenerator.pickWeighted › returns undefined when no candidate is eligible` |
| one draw per call | `PseudoRandomGenerator.pickWeighted › consumes exactly one draw per call, even when it returns undefined` |
| proportionality | `PseudoRandomGenerator.pickWeighted › chooses in proportion to weight` |

**The rescale-only-on-overflow test has been seen to fail.** I mutated the guard to rescale always
(`if (total > 0)`). Only `does not rescale ordinary weights` went red: `[0.1, 0.2, 0.3]` at
`unit = 0.16666666666666666` chooses `b` unscaled and `a` rescaled. With the guard restored, it is green.

## Gate counts

Logs are in `.gate-logs/` (not committed). Errors are counted by `grep -cE 'not met|FAILURE|Operations failed|error TS'`, warnings by `grep -ci warning`.

| gate | exit | errors | warnings |
|---|---|---|---|
| `ts-agent-memory` `rushx build` / `lint` / `test` | 0 / 0 / 0 | 0 | 0 |
| `ts-random` `rushx build` / `lint` / `test` | 0 / 0 / 0 | 0 | 0 |
| `rush rebuild` (repo-wide) | 0 | 0 | 1 (Git-tracked symlink notice only) |
| `rush test` (repo-wide) | 0 | 0 | 1 (Git-tracked symlink notice only) |

More detail:

- `rush rebuild` reports `SUCCESS: 38 operations`, and `rush test` reports `SUCCESS: 37 operations`. Neither has a `SUCCESS WITH WARNINGS` banner, and the NUL-byte check is clean on both logs.
- `ts-random` runs 154 tests (25 new), with coverage at 100% on every metric.
- `ts-agent-memory` coverage is 100% on every metric.
- `rush change --verify --target-branch origin/integration/asks` finds both change files and passes.
- `verify-capability-docs.mjs` passes: router at 22,756/24,000 chars, 105 shortcuts, 0 failed.
- `generate-capability-feed.mjs --check` reports 0 stale.

## What the brief got wrong

1. **The sweep targets.** The stale claim was not in `CAPABILITIES.md` or the README; neither mentions `derivedFrom`. The contradiction that did exist was in `docs/FUTURE.md`, which still called the field a bare `MemoryId`.
2. **`rushx` is not on PATH either**, only `rush` is noted. Per-package gates were run with
   `node common/scripts/install-run-rushx.js <cmd>`.
3. **"Reproduces the consumer's walk exactly" is true for positive weights only, as the brief says, but adopters should know about one divergence.** The intake note says `appearanceSampler.ts` returns the *first* option when every weight is zero, whereas `pickWeightedAt` returns `undefined`. An avatar whose stored appearance came from an all-zero option list will draw differently unless the consumer keeps that fallback at the call site. This is not a reason to change the decision. It is worth saying on personaility#669 when it closes.
4. **`docs/workstreams/2026-10.md`.** No chore batch has ever been filed there, so no entry was written. The batch closes in `docs/CHORES.md`.
