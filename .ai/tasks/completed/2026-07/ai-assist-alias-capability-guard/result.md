# Result — `ai-assist-alias-capability-guard`

## What shipped

### 1. The core fix — both capability resolvers are alias-guarded

`libraries/ts-extras/src/packlets/ai-assist/registry.ts`. `resolveImageCapability` and
`resolveEmbeddingCapability` now resolve the incoming model id through `resolveModelAlias`
**before** any prefix matching, via a new shared `@internal` generic helper
`resolveCapabilityForModel<TCapability extends { readonly modelPrefix: string }>`.

Behavior matrix:

| Input | Before | After |
|---|---|---|
| Concrete provider id | correct capability | **unchanged** |
| Registered fgv alias | catch-all → **confidently wrong capability** | correct capability (identical to the concrete id's) |
| Unregistered / cyclic alias | catch-all → wrong capability | `undefined` |

**Public signatures are unchanged.** `etc/ts-extras.api.md` regenerates **byte-identical to
`release`** — the strongest available evidence that the change is non-breaking.

### 2. Testbed call site

`samples/testbed/src/scenarios/imageGeneration/index.tsx`. `defaultModelFor` switched from
the bare `AiAssist.resolveModel(descriptor.defaultModel, 'image')` spec walk (yields the
alias, e.g. `'@openai:image'`) to `AiAssist.resolveProviderModel(descriptor, undefined,
'image')` (yields the concrete id). Also replaced an imperative `if (!descriptor)` guard with
a Result chain.

### 3. TSDoc — the adjacent ask (A)

`model.ts`, doc-only. A `@remarks` block on `ModelSpecKey` and an added paragraph on
`resolveProviderModel` record that `tools` and `thinking` are deliberately **not** model
selectors — they are orthogonal request params riding on top of whatever model the tier
selected, removed from `ModelSpecKey` when the quality-tier axis landed. Both explicitly tell
a tool-path caller to pass a tier and **not** to hand-roll a `resolveModel` +
`resolveModelAlias` walk. No `'tools'` key was added.

## Design choice and why

**Chose (b) — resolve the alias inside the helper.** Rejected (a) (`Result<T>` return type).

The decisive reason is a hard constraint, not a preference: (a) forces edits to
`apiClient.ts`, which the brief explicitly forbids ("verify only, do not change"), and to
`embeddingClient.ts`, which is not on the stream's modifiable file list at all. There is no
way to land (a) inside the declared surface. Independent of that, (b) is the smaller
consumer-facing change and makes *both* input forms correct rather than turning one into an
error.

**On the brief's objection to `undefined`.** The objection was that `undefined` collides with
"no rule matched". That objection targets the *wrong-capability* outcome, which design (b)
eliminates outright: a sigil-prefixed string now either resolves to a concrete id (→ the
correct capability) or yields `undefined`. It can never reach the catch-all. And an
unresolvable alias names no model, so "no capability applies" is truthful rather than lossy —
it fails in the safe direction, and both callers already surface `undefined` as a loud
`Result.fail`. Worth noting: pre-fix, `undefined` was effectively **unreachable** for any
provider declaring a catch-all — that unreachability *was* the bug. Post-fix it becomes a
reachable, meaningful signal.

## Gates

| Gate | `@fgv/ts-extras` | `@fgv/testbed` |
|---|---|---|
| `rushx build` | pass (no api-extractor warning) | pass |
| `rushx lint` | pass | pass |
| `rushx test` | pass, 100%; `registry.ts` 100/100/100/100 | pass, 100%; `scenarios/imageGeneration` 100% |
| `rushx fixlint` | run before final commit | run before final commit |
| `rush change --verify` | pass | n/a |

No coverage-closure pass was required — the scenario-driven tests reached 100% unaided, so
**no `c8 ignore` directives were added**. `code-reviewer` was still run before declaring
coverage done, per the load-bearing ordering in TESTING_GUIDELINES.

## Test that fails against pre-fix behavior

Verified empirically by temporarily reverting the guard and re-running: **7 of the new tests
fail**, while **all 62 pre-existing registry tests still pass** — demonstrating the catch and
the no-regression-for-concrete-ids property in the same run. The failing set covers all three
reported mismatches (openai image, xai wire-format flip, openai embedding
dimensions/batch-guard), the registry-wide invariant sweep, and all three unresolvable-alias
cases.

The invariant sweep (`holds for every registered alias on every built-in provider`) asserts
that for every alias on every descriptor, the alias form and its concrete target select the
identical capability object for **both** modalities. It generalizes past the three hand-picked
repro cases and will catch a future provider that adds a specific-prefix rule alongside a new
alias.

## Layer-1 review summary

`code-reviewer` run on the final diff: **Approved — zero findings at P1, P2, and P3.**

It independently verified the gates, confirmed the file-scope list was honored, and ran its
own sweep for other alias-leak sites, clearing two candidates I had also considered:
`applyCapabilityConfig` (`apiClient.ts:1527`, `idPattern`-based) is fed only concrete ids
returned by a live list-models API, and `mergeThinkingConfig`'s `resolvedModel` is fed from
`resolveProviderModel` at both call sites. Its conclusion matched mine: the two functions
fixed here were the only vulnerable lookup sites in the packlet.

It specifically endorsed the shared-helper factoring (the duplicated-flaw history is the
argument *for* consolidating), the `.orDefault()` + early-return shape over a fuller Result
chain (the failure detail is deliberately discarded because no caller distinguishes
unknown-alias from cyclic-alias), and confirmed TSDoc claims match the implementation.

## Deliberately left undone — for the orchestrator

1. **The open P3 TECH_DEBT entry is still open.** `docs/TECH_DEBT.md:164` asks for exactly
   design (a) — `resolveImageCapability` returning `Result<IAiImageModelCapability>` — with
   trigger "next substantive change to the provider registry or capability resolution path".
   This stream *is* that trigger, but the file-surface constraint (`apiClient.ts` forbidden)
   defers it. The entry was not edited, since `docs/` is outside this stream's surface. A
   follow-on stream that owns `apiClient.ts` + `embeddingClient.ts` could land it; note that
   the guard shipped here removes the *dangerous* half of the problem, leaving only the
   non-idiomatic-return half the entry describes.

2. **Two sibling exported predicates share the same alias-leak class — NOT fixed.**
   `isResponsesOnlyModel` and `isAdaptiveThinkingModel` (both `@public`, both in `model.ts`)
   also prefix-match a caller-supplied model id against descriptor prefix lists with no sigil
   handling. Concretely: `isAdaptiveThinkingModel(anthropicDescriptor, '@anthropic:sonnet')`
   returns `false`, whereas the concrete `'claude-sonnet-5'` returns `true` — a direct
   consumer passing the alias gets the legacy thinking wire shape.

   Not fixed because `model.ts` is **TSDoc-only** in this stream's brief, and per
   CODING_STANDARDS § "When to ask first" an extension outside the declared surface warrants
   a brief amendment rather than unilateral scope growth.

   Mitigating factors that make this lower-priority than the capability bug: both are called
   internally only with already-resolved concrete ids (`apiClient.ts:821,855`,
   `streamingClient.ts:173,211`); both already document "concrete (already-resolved) model
   id" as a precondition; and the failure mode is a loud provider-side HTTP 400 rather than a
   silently wrong request body. Recommend a small follow-on stream that owns `model.ts` and
   applies the same guard to both.

3. **`docs/WORKSTREAMS.md` not updated** — orchestrator-owned per the brief.
