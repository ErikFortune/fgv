# `chores-2026-10-asks`: `derivedFrom` docstring and a weighted pick

**Shipped 2026-10-17** via ErikFortune/fgv#732, into `integration/asks`.

---

## What it is

This chore batch closed two PersonAIlity asks.

- **personaility#670 (`@fgv/ts-agent-memory`, docs only).** `IProvenance.derivedFrom` used to be described as a "back-link". It is now documented as provenance: it keeps naming a source after that source is withdrawn, and for a versioned kind it may name a superseded version. Anyone who resolves it has to handle both cases.
- **personaility#669 (`@fgv/ts-random`, additive).** The package gains `pickWeightedAt(unit, candidates)`, a pure function, and `PseudoRandomGenerator.pickWeighted(candidates)`, which runs it over `nextFloat()`.

## What changed shape

- **"Queryable" was not adopted.** No retrieval axis indexes `derivedFrom`. The docstring says so, and points to a whole-record `filter` predicate as the only way to select on the field.
- **The sweep found its contradiction somewhere else.** The brief expected one in `CAPABILITIES.md` or the README, and neither had it. The real one was in `docs/FUTURE.md`, which still called the field a bare `MemoryId`.

## The rules the pick keeps

- **Eligibility.** A weight is eligible only if it is finite and greater than 0. If no weight is eligible, the result is `undefined`.
- **Range of `unit`.** `unit` must lie in `[0, 1]`. Anything outside that range, and `NaN`, gives `undefined`.
- **The walk.**
  - It visits candidates in input order and stops at the first one where `point < cumulative`.
  - The last candidate wins by elimination.
  - This walk is fixed because a consumer stores draws made through it.
- **Overflow.** Weights are rescaled only when their sum overflows. The "never rescale ordinary weights" test was checked by mutation and does fail when the guard is removed.

## Files

- `brief.md`, `state.md` and `result.md` hold the frozen brief, the working record, and the outcome. The outcome includes the edge-rule → test-name table and the gate counts.
- Code:
  - `libraries/ts-agent-memory/src/packlets/types/envelope.ts`
  - `libraries/ts-agent-memory/src/packlets/ingest/model.ts`
  - `libraries/ts-random/src/generator/generators.ts`
  - `libraries/ts-random/src/test/unit/weightedPick.test.ts`

## Left open

- **Weighted pick without replacement (`pickWeightedSequence`).** Recorded in `docs/FUTURE.md`.
- **A note for personaility#669 when it closes.** The avatar sampler currently returns the first option when every weight is zero. `pickWeightedAt` returns `undefined` in that case, so the consumer has to keep that fallback itself.
