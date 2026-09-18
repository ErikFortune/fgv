# Result — `ai-assist-prompt-caching`

**Shipped:** all three phase-C slices — C1 (observability), C2 (diagnostics + vocabulary), C3
(emit) — closing the stream. `ai-assist` had no prompt-caching support of any kind at the start;
it now reports cache usage across every provider that supplies it, diagnoses cache-hostile
compositions before any request is sent, and places explicit cache breakpoints on Anthropic and
OpenAI requests built from a `ts-prompt-assist` resolve.

## What each slice delivered

**C1 — observability ([PR #668](https://github.com/ErikFortune/fgv/pull/668)).**
`@fgv/ts-extras/ai-assist`: `AiCacheReportingLevel`, `IAiCompletionUsage`,
`IAiCompletionResponse.usage?` / `IAiStreamDone.usage?`, and per-wire-shape normalization across
all five response shapes (Anthropic, OpenAI Chat Completions, OpenAI/xAI Responses ×2 field
names, Gemini). Verified by A3 (design.md §14) to be validator-widening across five shapes, not a
one-line field read as originally scoped.

**C2 — diagnostics + vocabulary ([PR #669](https://github.com/ErikFortune/fgv/pull/669)).**
`@fgv/ts-prompt-assist`: the closed three-level `PromptCacheStability` vocabulary
(`'frozen' | 'per-conversation' | 'per-request'`) with provenance (`PromptCacheStabilityOrigin`),
the two declared homes (`IPromptSlot.cacheStability?`, `IPromptResolveRequest.cacheStability?`),
and the diagnostic engine (`analyzePromptCacheStability`, checks D1–D5) wired into
`IPromptComposition.cacheFindings`. Left one P2 (a `chars === 0` section could count toward the
measured cacheable-prefix total position-dependently) and one open question (OQ-7 — how an
unannotated anti-jailbreak preface's stability should default) for C3, both recorded in
design.md §5.1b / §15 at the time.

**C3 — emit (this PR).** `@fgv/ts-extras/ai-assist`: `IAiCacheRequest`
(`systemBreakpoints?`/`cacheKey?`), `validateAiCacheRequest`/`validateCacheBreakpoints`
(fail-loud, never clamps), `IProviderCompletionParams.cache?`. The Anthropic adapter splits
`system` into content blocks carrying `cache_control` at each declared breakpoint; OpenAI Chat
Completions and Responses split the leading system message/item into content parts carrying
`prompt_cache_breakpoint`, and add `prompt_cache_key` when `cacheKey` is supplied —
`prompt_cache_options` is never touched. `@fgv/ts-prompt-assist`: `toCacheRequest(composition,
hints)` derives a breakpoint plan from a composition's per-section `effectiveStability` (new on
`IPromptSection`). Dependency direction holds per design F1 — `ai-assist` has no reference to
`ts-prompt-assist` anywhere in the new code.

## What changed shape along the way

- **§7's `IAiCacheCapability` model-keyed threshold/cap table was never built.** Design §11
  originally listed it as C1 scope; A3 (design.md §14) resized C1 down to usage-reporting only
  after finding C1 was already validator-widening across five shapes. It was never picked up in
  C2 or C3 either — C3's offset-cap validation (`maxBreakpointWrites`) is a caller-supplied
  parameter with no registry wiring, matching the design's own finding that the three-level
  vocabulary never emits more than two breakpoints, so a cap is never binding for that caller.
  Building the registry table now would be exactly the "gate on a per-model capability table"
  reuse the sibling `ai-assist-thinking-anchoring` stream's own "deliberately not done" note warns
  against. Recorded as a known, permanent scope boundary rather than a deferred slice.
- **OQ-7 resolved to a third option, not either polled default.** design.md §15 posed `'frozen'`
  vs. `'per-request'` for an unannotated preface and recommended, undecided, an explicit
  declaration. C3 implemented the recommendation as stated: `IPromptSafetyPolicy.
  antiJailbreakPrefaceStability?: PromptCacheStability`, defaulting to `'frozen'` (preserving C2's
  shipped behavior for every existing caller) with no refutation path — documented as an
  intentional gap, matching D1/D2's own trust boundary for template content.
- **Streaming request emission is out of scope**, unlike C1's usage-reporting (which explicitly
  chose not to split streaming from non-streaming per OQ-5). `IProviderCompletionStreamParams`
  carries no `cache?` field. This is a narrower posture than OQ-5's reasoning would suggest at
  first glance, but the two are not the same hazard: OQ-5 worried about a caller being unable to
  tell "streaming doesn't report usage" from "not implemented yet" — a silent, same-shape gap.
  Here, a missing `cache?` field is a compile-time absence, not a silently dropped runtime value,
  and design §11's own surface-summary table only ever named `IProviderCompletionParams`. Left as
  a real, but different-in-kind, unaddressed surface rather than folded in.

## Gates

Both packages: `rushx build` / `rushx lint` / `rushx test` green, 100% statement/branch/function/
line coverage. Repo-wide `node common/scripts/install-run-rush.js rebuild`: 36/36, zero warnings.
Repo-wide `rush test` is blocked by the same pre-existing, environmental `mutableFsTree.test.ts`
root-permissions failure in `@fgv/ts-json-base` that C1's PR documented (this environment runs
tests as root; the test's `chmod`-based read-only fixture cannot fail for root regardless of the
change under test) — verified downstream consumers of the widened types individually instead:
`ts-app-shell` (155/155) and `samples/testbed` (534/534), both 100% clean.
