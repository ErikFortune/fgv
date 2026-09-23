# prompt-assist-qualifier-stability — qualifier-declared cache stability, and composition on observations

**Status**: ✅ shipped 2026-09-23 via [#689](https://github.com/ErikFortune/fgv/pull/689).

## Summary

Two PersonAIlity asks, both additive, both inside `@fgv/ts-prompt-assist`:

- **A.** `IPromptResolveObservation.composition?` carries the resolve's `IPromptComposition` whole
  when the request asked for one. It is set by a plain assignment, and `cacheFindings` is
  deliberately not hoisted onto the record.
- **B.** `IExpectedQualifierAxis.stability?` (default `'per-request'`) tells the conditional-body
  check (D2) how often an axis changes. D2 now refutes a claim only when an axis that conditioned
  the body is declared less stable than the claim, lowers it to that axis's level, and names the
  axis in the finding.

## The design, and the two options refused

Stability is declared on the axis. Two alternatives were refused:

- **A call-site override that survives D2.** It would turn a verified diagnostic into an
  unfalsifiable assertion; the `adaptOptionalToNullable` precedent already settled this.
- **A per-resolve stability map.** It would be a second source of truth about a property of the
  axis.

A declared axis is not the same assertion as a surviving override. It supplies the missing fact
that makes the evidence interpretable. It never lets a claim survive evidence against it.

## No `@fgv/ts-res` change

`IConditionMatchResult` never names its qualifier. The join goes through prompt-assist's own
declarations instead: `candidateIndex` → `IPromptCandidateRecord.conditions`, which is keyed by
qualifier name.

## What changed shape along the way

- **Losing candidates count.** Crediting only the winners' axes would have *introduced* a false
  `'frozen'` that the old check refuted by accident. Once the body is conditional, the axes of
  losing candidates and `matchAsDefault` winners are folded in.
- **Downgrade target.** A refuted claim now drops to the body's conditioning level rather than
  always to `'per-request'`. With nothing declared the two are identical.

## The compatibility contract

Undeclared axes reproduce every prior refutation exactly, in `slot`, `claimed` and `downgradedTo`.
Tests pin this, and all pre-existing tests pass unmodified. The repo-wide `rush test` is green.

## Left open

A body whose winners include no conditional `'match'` is still blind to a volatile competing
candidate. That covers every winner being unconditional, or every conditional winner having matched
only as `matchAsDefault`. This gap predates the stream. Closing it would add refutations to bodies that are not refuted today, so it
needs its own decision.

## Artifacts

`brief.md` (the contract), `result.md` (what shipped, decisions, gates), `state.md` (final
checkpoint), `meta.yaml`.
