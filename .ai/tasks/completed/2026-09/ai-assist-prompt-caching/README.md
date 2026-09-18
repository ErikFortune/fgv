# ai-assist-prompt-caching — cross-provider prompt-cache observability, diagnostics, and emit

**Shipped**: 2026-09-18 via [PR #668](https://github.com/ErikFortune/fgv/pull/668) (C1),
[PR #669](https://github.com/ErikFortune/fgv/pull/669) (C2), and the PR that carries this
directory's migration (C3).

## Summary

`ai-assist` had no prompt-caching support of any kind. This stream added it in three
independently-shippable slices: C1 makes cache usage (reads/writes, normalized across every
provider's wire shape) visible on completion and streaming responses; C2 gives `ts-prompt-assist`
a closed three-level stability vocabulary (`'frozen' | 'per-conversation' | 'per-request'`) and
resolve-time diagnostics that catch a cache-hostile composition before any request is sent; C3
closes the loop by letting a caller (directly, or via `ts-prompt-assist`'s `toCacheRequest`) place
validated, explicit cache breakpoints on the Anthropic and OpenAI adapters. Every addition across
all three slices is additive and optional — an un-annotated caller's request body is
byte-identical to a build predating this stream.

## Files changed

- `@fgv/ts-extras/ai-assist`: `usageTypes.ts` (new), `usageNormalization.ts` (new),
  `cacheRequest.ts` (new) — `IAiCompletionUsage`, `AiCacheReportingLevel`, `IAiCacheRequest`,
  `validateAiCacheRequest`/`validateCacheBreakpoints`; `completionClient.ts`,
  `streamingClient.ts`/`streamingAdapters/*.ts`, `chatRequestBuilders.ts` — per-wire-shape usage
  extraction and cache-breakpoint content-block/part splitting on the Anthropic and OpenAI
  (Chat Completions + Responses) adapters.
- `@fgv/ts-prompt-assist`: `types/cacheStability.ts` (new) — the vocabulary, provenance, and
  finding types; `resolve/cacheStabilityAnalysis.ts` (new) — `analyzePromptCacheStability` (D1–D5)
  and the C3-added `computeCacheStabilityAnalysis`/`deriveCacheBreakpointOffsets`;
  `resolve/toCacheRequest.ts` (new) — `toCacheRequest(composition, hints)`; `types/slot.ts`,
  `types/trace.ts` (`IPromptSection.effectiveStability?`), `types/safety.ts`
  (`antiJailbreakPrefaceStability?`) for the declared-hint surfaces.

## Per-phase summaries

**Phase A/B (design).** Falsified the brief's opening premise — OpenAI ships an inline
breakpoint mechanism structurally identical to Anthropic's, not "nowhere to send" a cache
directive — and dissolved the brief's "central mechanical question" (which four breakpoints
survive a shared cap): the three-level vocabulary admits at most two downward transitions, so the
cap is never reached and no allocation policy was needed. See `design.md` §§0–13.

**C1 — observability.** `IAiCompletionUsage`/`usage?` on both completion and streaming responses,
normalized across five wire shapes (Anthropic, OpenAI Chat Completions, OpenAI/xAI Responses ×2
field spellings, Gemini). A3 (design.md §14) found C1 was validator-widening across all five
shapes rather than a one-line field read, and introduced an `anthropicResponse` validator to
retire a pre-existing hand-checked-cast anti-pattern on that path.

**C2 — diagnostics + vocabulary.** The closed `PromptCacheStability` vocabulary with provenance,
declared at two homes (`IPromptSlot.cacheStability?`, `IPromptResolveRequest.cacheStability?`,
call-site winning unconditionally), and `analyzePromptCacheStability` (checks D1 multi-scope
binding, D2 conditional-template, D4 cache-hostile ordering, D5 threshold) wired into
`IPromptComposition.cacheFindings`. Left the C2 P2 (`checkThreshold`'s zero-byte-section measure
gap) and OQ-7 (preface default) open for C3.

**C3 — emit.** `IAiCacheRequest` + fail-loud offset validation (never clamps); the Anthropic
adapter splits `system` into content blocks carrying `cache_control` at each breakpoint; OpenAI
Chat Completions and Responses split the leading system message/item into content parts carrying
`prompt_cache_breakpoint`, plus `prompt_cache_key` when a `cacheKey` is supplied —
`prompt_cache_options` untouched throughout. `toCacheRequest` derives a breakpoint plan from a
composition's per-section `effectiveStability` (new field, populated by a refactored
`computeCacheStabilityAnalysis` that the pre-existing `analyzePromptCacheStability` now wraps
unchanged). Also folded in: the C2 P2 fix (a `chars === 0` section now contributes `0` to the
measured prefix total via a filter, not `prefixEnd` index arithmetic) and OQ-7's resolution
(`IPromptSafetyPolicy.antiJailbreakPrefaceStability?`, default `'frozen'`).

## Decisions made during execution

- **§7's `IAiCacheCapability` model-keyed threshold/cap table was never built**, in any slice.
  Design §11 originally scoped it to C1; A3 resized C1 down to usage-reporting only. C3's offset
  cap (`maxBreakpointWrites`) is a caller-supplied parameter with no registry backing — the
  design's own proof that the vocabulary never emits more than two breakpoints means an omitted
  cap is not a soundness gap for that caller, and building the registry now would be exactly the
  "gate on a per-model capability table" reuse `ai-assist-thinking-anchoring`'s own "deliberately
  not done" note warns against.
- **OQ-7 resolved to design's own recommended third option**: an explicit
  `antiJailbreakPrefaceStability?` declaration on `IPromptSafetyPolicy` rather than picking one
  blanket default (`'frozen'` risks a silent permanent cache miss on a dynamic preface;
  `'per-request'` would make every preface-bearing resolve report a false ordering hazard).
  Default is `'frozen'`, preserving C2's shipped behavior for every existing caller.
- **Streaming cache-breakpoint emission is out of scope for C3** — `IProviderCompletionStreamParams`
  gained no `cache?` field. Unlike C1's inclusion of streaming under OQ-5 (where a missing surface
  would have been indistinguishable from "not implemented yet"), an absent field here is a
  compile-time signal, not a silently-dropped runtime one, and design §11's surface table never
  named the streaming params type for the emit slice.
- **OQ-6** (a token-accounting collision with the sibling `ai-assist-thinking-events` stream) was
  resolved at C1 time (design.md §14 A2) by making `IAiCompletionUsage` the token-accounting home
  and recording the decision in `ai-assist-thinking-events`'s own ledger entry.

## Followups

None outstanding. `docs/FUTURE.md` carries the pre-existing note on Gemini explicit
`CachedContent` (design.md §10) as a possible future primitive, not a followup of this stream.

## Lessons codified during the run

- design.md §5.1b / `TESTING_GUIDELINES.md`'s "100% coverage cannot see a predicate that is never
  called" section: a regression test for a position-dependent measurement bug needs a **non-zero**
  value in the position that's supposed to be excluded — every existing test used `measured: 0`,
  under which inclusion and exclusion of the buggy section are indistinguishable in the reported
  total.
- `deriveCacheBreakpointOffsets` only emits a breakpoint on a **strict** stability decrease
  between adjacent runs, not `<=`. Two runs of equal level can become adjacent after
  `collapseEmptyStableRuns` removes an intervening empty run between them; treating "equal" as
  "push a breakpoint" would split a single-stability span for no analytical benefit, spending part
  of the shared write cap on a boundary design.md §5.1(i) does not recognize as a candidate.

## References

- Brief: `brief.md`
- Research: `research.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Design: `design.md`
- PRs: [#668](https://github.com/ErikFortune/fgv/pull/668) (C1),
  [#669](https://github.com/ErikFortune/fgv/pull/669) (C2), and this migration's own PR (C3)
