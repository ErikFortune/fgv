# State — `ai-assist-alias-capability-guard`

Running log of decisions, surprises, and reinterpretations.

## Branch base

Brief named `release @ b689c99ca`. At fetch time `origin/release` was **`fbb08cd55`** — one
commit ahead (`deps: repair root rush shim lockfile; bump @microsoft/rush to 5.178.0`, #575).
Branched from `origin/release` per the instruction's command rather than pinning the stale
SHA; the extra commit is a lockfile/tooling repair with no bearing on this change.

## Verification of the reported defect

Confirmed the orchestrator's table by construction rather than by re-running a probe: the
implementation is a pure `modelId.startsWith(cap.modelPrefix)` longest-prefix filter with no
sigil handling, and every provider declares a `modelPrefix: ''` catch-all. Registry values
that make the reported rows concrete:

| Provider | Alias | Alias target | Specific rule that was being skipped |
|---|---|---|---|
| `openai` | `@openai:image` | `gpt-image-2` | `modelPrefix: 'gpt-image-'`, `acceptsImageReferenceInput: true`, `outputParamStyle: 'output-format'` |
| `xai-grok` | `@xai-grok:imagine` | `grok-imagine-image-quality` | `modelPrefix: 'grok-imagine-'`, `format: 'xai-images-edits'`, `acceptsImageReferenceInput: true` |
| `openai` (embedding) | `@openai:embedding` | `text-embedding-3-small` | `modelPrefix: 'text-embedding-3'`, `supportsDimensions: true`, `maxBatchSize: 2048` |
| `google-gemini` | `@google-gemini:flash-image` | `gemini-3.1-flash-image` | single catch-all only → no mismatch, as reported |

Empirically confirmed at the end of implementation by temporarily reverting the guard:
**7 of the new tests fail against pre-fix behavior** while all **62 pre-existing registry
tests still pass** — which simultaneously demonstrates the catch and the no-regression
property for concrete ids.

**Library-internal paths verified safe and left untouched**, as instructed:
- `apiClient.ts:1336` `resolveProviderModel(descriptor, modelOverride, 'image')` → `:1341`
  `resolveImageCapability(descriptor, model)`. Alias already resolved. Not modified.
- `embeddingClient.ts:394` `resolveProviderModel(..., 'embedding')` → `:400`
  `resolveEmbeddingCapability(descriptor, model)`. Same shape. Not modified.

## Design decision — chose (b), resolve the alias inside the helper

Rejected (a) (`Result<T>` return). Two reasons, the first decisive:

1. **File-surface constraint makes (a) impossible within this stream.** Changing the return
   type forces edits to `apiClient.ts` — which the brief explicitly forbids ("verify only,
   do not change") — and to `embeddingClient.ts`, which is not on the stream's modifiable
   list at all. There is no way to land (a) without violating the declared surface.
2. Even setting that aside, (a) is a breaking signature change; (b) is the smaller
   consumer-facing change and makes *both* input forms correct rather than making one of
   them an error.

Note there is an **open P3 TECH_DEBT entry** (`docs/TECH_DEBT.md:164`) asking for exactly
(a) — `resolveImageCapability` returning `Result<IAiImageModelCapability>` instead of
`| undefined` — with trigger "next substantive change to the provider registry or capability
resolution path". This stream is that trigger, but the file-surface constraint defers it.
**Left open deliberately; flagged in `result.md` for the orchestrator.** The entry was not
edited (`docs/` is outside this stream's surface).

### Why `undefined` for an unresolvable alias is defensible

The brief's objection to `undefined` was that it collides with "no rule matched". That
objection is aimed at the *wrong-capability* outcome, and design (b) eliminates that outcome
entirely: any sigil-prefixed string either resolves to a concrete id (→ the correct
capability) or yields `undefined`. It can never reach the catch-all. And semantically an
unresolvable alias names no model, so "no capability applies" is the truthful answer, not a
lossy one — it fails in the safe direction. Both callers already surface `undefined` as a
loud `Result.fail` ("provider X does not support image generation for model Y").

Worth recording: pre-fix, `undefined` was effectively **unreachable** for any provider
declaring a catch-all — that unreachability *was* the bug. Post-fix `undefined` becomes a
reachable, meaningful signal.

## Implementation notes

- Extracted a shared generic `resolveCapabilityForModel<TCapability extends { readonly
  modelPrefix: string }>` rather than patching both copies. The flaw existed **identically in
  both** functions, which is the argument against leaving them as parallel copies — the
  duplication is what let the defect double. `@internal`, so no API surface added.
- Alias resolution uses `resolveModelAlias(descriptor, modelId).orDefault()` — the
  Result-idiomatic safe-fallback extraction, not `.orThrow()`.
- `registry.ts` already imported types from `./model`; added a value import of
  `resolveModelAlias`. Checked `model.ts` for a back-edge: it imports only from `@fgv/ts-utils`
  and `@fgv/ts-json-base`, so **no import cycle**.

## Surprises

1. **`etc/ts-extras.api.md` regenerates byte-identical to `release`.** The fix is entirely
   behavioral; both public signatures are unchanged. Acceptance criteria asked for a
   regenerated api.md — it was regenerated and there is nothing to commit. This is also the
   cleanest possible evidence that the change is non-breaking. It additionally means the
   expected merge conflict with the two sibling streams on this file does not materialize
   from this side.

2. **TSDoc `{@link}` does not resolve for functions / consts / type aliases in this package —
   in either form.** New `{@link resolveModelAlias}` / `{@link MODEL_ALIAS_SIGIL}` /
   `{@link ModelSpecKey}` references baked `ae-unresolved-link` warnings into `api.md`
   ("does not have an export X" — the symbols are exported under the `AiAssist` namespace).
   Qualifying them as `{@link AiAssist.resolveModelAlias}` swapped the warning for a
   different one ("This type of declaration is not supported yet by the resolver") — the
   namespace-qualified form works for interfaces (there is existing precedent in `model.ts`)
   but **not** for function / const / type-alias declaration kinds.

   Resolved by using **plain code spans** for all new references, per the CODE_REVIEW_CHECKLIST
   rule that an `ae-unresolved-link` in the checked-in `api.md` is a stale-api.md / CI-diff
   liability. Net warning delta: **zero**. Pre-existing bare `{@link}` references elsewhere in
   `model.ts` already carry these warnings; left alone (out of scope, and touching them would
   inflate the diff).

3. **The testbed's capability lookup is fixed by the library guard alone.** With design (b),
   feeding the alias form to `resolveImageCapability` already returns the right answer, so the
   scenario change is not strictly required for correctness. It was still made — see below.

## Testbed decision — `defaultModelFor` returns the concrete id

The brief flagged this as a judgment call ("what the user should SEE vs what capability
lookup needs"). Switched `AiAssist.resolveModel(descriptor.defaultModel, 'image')` →
`AiAssist.resolveProviderModel(descriptor, undefined, 'image')`, because the value has a
**third** consumer the brief's framing surfaces: `SettingsPanel` renders it as
`<input value={model}>`, directly beside a fetched dropdown of concrete ids
(`gpt-image-1`, `dall-e-3`). Showing `@openai:image` in an editable model-id field whose
sibling list shows real ids is incoherent, and any user edit replaces it with a concrete id
anyway.

Wire-path safety is unaffected: the library resolves either form correctly, and
`resolveProviderModel` is the documented call-time chokepoint doing exactly this job.
Secondary benefit — the scenario is now correct **independently** of the library guard
(defense in depth), so a regression in either layer alone is still caught.

The rewrite also replaced an imperative `if (!descriptor) return ''` with a Result chain
(`getProviderDescriptor(...).onSuccess(...).orDefault('')`), removing a branch. Unknown-provider
behavior is preserved (`''`), pinned by the pre-existing test.

## Gates

| Gate | ts-extras | testbed |
|---|---|---|
| `rushx build` | pass | pass |
| `rushx lint` | pass | pass |
| `rushx test` | pass, 100% (`registry.ts` 100/100/100/100) | pass, 100% (`scenarios/imageGeneration` 100%) |
| `rush change --verify` | pass | n/a |

No coverage-closure pass was needed — the scenario-driven tests reached 100% on their own, so
no `c8 ignore` directives were added. `code-reviewer` was still run before declaring coverage
done, per the load-bearing ordering in TESTING_GUIDELINES.
