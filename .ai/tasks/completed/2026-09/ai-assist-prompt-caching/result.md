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

So an ai-assist caller could not obtain reliable prefix cache hits on xAI. §2's premise — prefix
stability is the lever — is correct; the library was withholding the field that makes the lever
connect. That was a defect in shipped code, not a design overstatement.

**Fixed in the same PR as this note.** `supportsPromptCacheRouting(descriptor)` splits routing from
breakpoint support and returns the per-route transport, so xAI now receives the key
(`x-grok-conv-id` header on Chat Completions, `prompt_cache_key` on Responses) while
`systemBreakpoints` stays OpenAI-only. Providers supporting neither still get a request
byte-identical to one built with no `cache` at all — now pinned by comparing against a live
no-cache request, headers included, after a review found the body-only assertion could not see a
header leak.

**Confirmed 2026-09-19** by `libraries/ts-extras/perf/promptCacheRoutingAb.js` against
`grok-4.3`. Both arms vary the final user turn; they differ only in whether a stable `cacheKey`
is supplied:

| arm | cold | warm |
|---|---|---|
| without `cacheKey` (behaviour before the fix) | 192 / 10,076 — 1.9% | **192 / 10,076 — 1.9%** |
| with `cacheKey` (this fix) | 192 / 10,076 — 1.9% | **10,048 / 10,076 — 99.7%** |

**Reproduced identically on a fresh salt**, which is what rules out a TTL-tainted cold reading
rather than merely asserting it was not one. The negative control held in both runs: arm 1 never
hit by routing luck, so the jump is attributable to the key and not to which server happened to
answer.

That closes the loop the harness opened. The standing assertion falsified a premise on its first
execution, the falsification located a real defect in shipped code, and the fix is now confirmed
by the same instrument that found the problem — not by the reasoning that proposed it.

**One detail still does not fit.** The cold floor is `192` in all four cold calls, and the warm
read is `10,048`. Neither is a multiple of 128, so the `floor(matched/128)*128` quantization
reported for xAI third-party does not describe these observations. It is stable rather than
noisy — 192 appeared in the earlier observability run too, at a different input size — so it is
some fixed scaffolding cost rather than measurement jitter. Unexplained, recorded rather than
rounded away.

**Unresolved detail:** the harness's cold reading was `cached=192`, not a multiple of 128, so it
does not fit the reported `floor(matched/128)*128` quantization. Minor, unexplained, noted rather
than smoothed over.

### Scope

C3 sends xAI byte-identical request bodies to those it sent before this stream, so nothing
regressed. What is missing is an improvement xAI can use. The Anthropic and OpenAI emit paths,
which do receive explicit breakpoints, remain entirely unmeasured — no harness exercises them.

---

## Anthropic breakpoint measurement — harness built, not yet run

**2026-09-19, `claude/anthropic-cache-breakpoint-measurement`.** Every prompt-cache measurement
above ran against xAI, whose caching is automatic — no request-side directive is sent, so none of
them exercise C3's emit path. Anthropic is the sharp case: its cache is opt-in **per content
block** via `cache_control`, with no automatic fallback, so a breakpoint is the only thing that can
produce a hit. Until this harness runs, C3's Anthropic emission has never been exercised against a
live provider on any route — it is verified only by request-body assertions.

`perf/promptCacheAnthropicBreakpoint.js` adds that measurement: an A/B against `claude-sonnet-5`
(this provider's `'base'` tier), varying only whether `cache.systemBreakpoints` is supplied, with a
cold-then-warm call pair per arm sharing a ~8,700-token system prefix (comfortably above both the
1,024-token minimum design.md §7 records for Sonnet-class models and the 4,096-token minimum for
Haiku-class ones) and varying only the final user turn. The without-breakpoints arm is the negative
control Anthropic's opt-in cache requires — without it, a hit in the with-breakpoints arm could not
be attributed to `systemBreakpoints` at all. Reports reads and writes separately
(`cachedInputTokens`, `cacheWriteTokens`) since Anthropic's normalizer always reports
`reports: 'reads-and-writes'`, unlike xAI's `'reads'`-only shape above.

**The prediction, written down before the first run** (full text in the file's header):

- arm 1 (no breakpoints), cold and warm — `cachedInputTokens` / `cacheWriteTokens` absent or 0 on
  both calls. No directive was sent, so nothing should be written or read.
- arm 2 (with breakpoints), cold — a cache **write** (`cacheWriteTokens` > 0, `cachedInputTokens`
  near 0).
- arm 2 (with breakpoints), warm — a cache **read** clearing roughly the prefix size (high, not a
  small fixed floor the way xAI's automatic cache showed a ~192-token floor even on a cold call).

A miss means C3's Anthropic emission is wrong, or this design's model of Anthropic caching is
wrong — the response is to revise the design or the code, not the threshold.

**Pure logic (`promptCacheAnthropicBreakpointHarness.ts`) is unit-tested** against fixture usage
blocks (21 tests, 100% statement/branch/function/line coverage on the new file) and reuses
`promptCacheUsageMath.ts`'s ratio/verdict comparison rather than duplicating it — see that file's
`withAnthropicZeroDefaults` for the one Anthropic-specific wrinkle (an absent cache field on a
`reads-and-writes` usage block is a *known* zero per design.md §8, not an unknown value, so it is
safe to default before comparison, unlike the provider-agnostic shared function's stricter
"absent = not computable" rule). Package gates (`rushx build` / `rushx lint` / `rushx test`, full
suite: 2969/2969, 100% coverage) and the change-file gate are all green.

**The harness has not been run.** This environment had no `ANTHROPIC_API_KEY` available, and per
`TESTING_GUIDELINES.md` § "Measurement Harnesses" — *"a harness that has never run asserts
nothing"* — nothing here should be read as a result. To run it:

```
cd libraries/ts-extras && rushx build
ANTHROPIC_API_KEY=... node perf/promptCacheAnthropicBreakpoint.js
```

Paste the output into this section (replacing this paragraph) once it has run — per §8's own
instruction, a miss is reported as a finding, not diagnosed away. Confounds to rule out before
concluding anything from a miss, per this stream's own experience misdiagnosing the xAI miss on
first read (§2's measurement note above): a TTL-tainted cold reading from a prior run sharing the
same salt (re-run once with `SALT=<fresh>` before concluding); a wrong `minCacheablePrefixTokens`
assumption for the resolved model (confirm which concrete model the `'base'` tier actually resolved
to); and account/provider-side caching being disabled or rate-limited rather than the emission
itself being wrong (check the raw response body, not just the normalized `usage` fields, on a
miss).
