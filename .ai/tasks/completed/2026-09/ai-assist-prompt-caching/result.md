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

---

## The C1 standing assertion, finally run — and it **falsified** the design's prefix-caching premise

**2026-09-19.** `libraries/ts-extras/perf/promptCacheObservability.js` had never been executed.
Run against `grok-4.3`:

```
cold call : reports=reads uncached=8684 cached=192 (2.2% of input) written=undefined output=20
warm call : reports=reads uncached=8684 cached=192 (2.2% of input) written=undefined output=20
```

**What passed.** `reports=reads` on both calls, exactly as §8 predicted — C1's normalization reads
and classifies xAI's usage block correctly, and that is the thing this harness was built to check.

**What failed.** The prediction was ~99% cached on the warm call. The two calls are identical in
every field, and 192 cached tokens matches the recorded ~128-token cold floor rather than a hit.
There was no cache hit at all.

Per §8's own instruction — *"A miss means the design is wrong, and the response is to revise the
design, not to lower a threshold until the harness goes green"* — the entry below is the design
revision, not a threshold adjustment.

### The one variable that differs from OQ-1's measurement

| measurement | request pair | cached |
|---|---|---|
| OQ-1 probe, 2026-09-17 | **byte-identical twice** | 99.5% / 99.2% |
| this harness, 2026-09-19 | same prefix, **different final user turn** | 2.2% |

`samples/testbed`'s `xaiCacheProbe` says so in its own docstring: it *"sends the same
byte-identical request twice"*, using one `TRIVIAL_QUESTION` on both calls. The harness varies the
tail, because varying the tail is what a real caller does.

**This is consistent with xAI keying its cache on the whole request rather than on a prefix** —
under which both numbers are true and **§2's premise is wrong for xAI**. §2 argues the
cache-hostile-ordering diagnostic (D4) is the beachhead because *"every provider in the registry
rewards prefix stability — Gemini implicit, xAI, and OpenAI's default mode have no directive to
send, and the only lever is the order of the bytes."* If xAI does not reward prefix stability,
that sentence is overstated by one provider, and D4's value on xAI specifically is unevidenced.

### Settled the same day — the probe re-ran, and drift is ruled out

`rushx cli xai-cache-probe` on `grok-4.3`, minutes after the harness:

```
Chat Completions  prompt_tokens_details.cached_tokens: cold=128  warm=4800   (of 4822 input)
Responses         input_tokens_details.cached_tokens:  cold=128  warm=4544   (of 4582 input)
```

xAI's cache is alive and healthy today, so provider/account drift is not the explanation. The
discriminator resolves cleanly, with everything held constant but the tail:

| config | prefix | cached | ratio |
|---|---|---|---|
| byte-identical twice | 4,822 tok | 4,800 | **99.5%** |
| same prefix, different final user turn | 8,684 tok | 192 | **2.2%** |

**An initial reading called this conclusive and said xAI caches whole requests rather than
prefixes. That was wrong**, and the error is worth keeping because of how it was made. The two
confounds actually ruled out were *size* (the failing case has the larger prefix) and *drift* (the
probe re-ran healthy minutes later). A third was never controlled for and decides the case:

**xAI's cache is per-server and evictable, and routing can miss on an identical prefix** unless
the request carries a sticky-routing key — `x-grok-conv-id` on Chat Completions,
`prompt_cache_key` on Responses. A byte-identical pair plausibly hashes to the same box; a pair
differing only in its tail need not. xAI *does* match byte-for-byte from the start of the
`messages` array, and appending a turn is the intended hit path.

Two measurements and one unexamined variable produced a confident conclusion in the wrong
direction — the same failure the rest of this stream kept hitting, one layer up: a value that was
never varied, so the thing depending on it was never tested.

### The real finding: a gating defect in C3

`IAiCacheRequest.cacheKey` is emitted only when `supportsPromptCacheBreakpoints(descriptor)`
passes, which is `true` for `'openai'` alone (`completionClient.ts:342`, and the comment there
states the coupling explicitly). But **`cacheKey` is a routing hint, not a breakpoint directive**,
and the two do not share a support condition:

| field | what it is | xAI |
|---|---|---|
| `systemBreakpoints` → `prompt_cache_breakpoint` | explicit cache boundary | not supported — correctly withheld |
| `cacheKey` → `prompt_cache_key` / `x-grok-conv-id` | sticky routing so the prefix lands on the same box | **needed, and withheld** |

So an ai-assist caller cannot obtain reliable prefix cache hits on xAI today. §2's premise —
prefix stability is the lever — is correct; this library withholds the field that makes the lever
connect. That is a defect in shipped code, not a design overstatement.

**Confirming run, not yet done:** re-run the harness with a stable routing key on both calls. A
jump from 2.2% to ~99% on a varying tail confirms both the mechanism and the fix.

**Unresolved detail:** the harness's cold reading was `cached=192`, not a multiple of 128, so it
does not fit the reported `floor(matched/128)*128` quantization. Minor, unexplained, noted rather
than smoothed over.

### Scope

C3 sends xAI byte-identical request bodies to those it sent before this stream, so nothing
regressed. What is missing is an improvement xAI can use. The Anthropic and OpenAI emit paths,
which do receive explicit breakpoints, remain entirely unmeasured — no harness exercises them.
