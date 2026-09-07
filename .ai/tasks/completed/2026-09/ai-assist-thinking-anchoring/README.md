# ai-assist-thinking-anchoring — a required field that gated nothing, and the one word the generic vocabulary was missing

**Status**: ✅ shipped 2026-09-07 via [#667](https://github.com/ErikFortune/fgv/pull/667).

## Summary

Started as a consumer question, not a stream. A consumer rolled forward to newer models, found
chat noticeably slower, and asked whether the library was pinning thinking to a high effort. It
was not — `resolvedThinking` stays `undefined` unless the caller passes `thinking`, so the latency
was the new models' own defaults. But answering the question surfaced something else.

**Three concerns travel under the name "thinking", anchored at three different levels:**

| concern | anchored at | assessment |
|---|---|---|
| effort **vocabulary** | provider (`IThinkingConfig.providers[]`) | correct — the vocabularies genuinely do not align |
| wire **shape** | **model** (`adaptiveThinkingModelPrefixes`, `responsesOnlyModelPrefixes`) | correct — prefix-matched on the model id |
| **availability** | provider (`IAiProviderDescriptor.thinkingMode`) | wrong, and dead |

The second row is what makes the third suspicious: per-model machinery already existed, on the
same descriptor, immediately beside the field that refused it.

## The finding: a field with a design rationale and no readers

`thinkingMode` was **required** on `IAiProviderDescriptor`, set on all nine registry descriptors
and in 25 test files, documented with a paragraph explaining why availability is declared
per-provider — and **read nowhere**. The actual temperature/thinking compatibility gating switches
on the provider *id*, via `providerDiscriminatorForId`, and never consults it.

Worse, a per-model representation of the same fact already existed and was in use:
`AiModelCapability` includes `'thinking'`, and `DEFAULT_MODEL_CAPABILITY_CONFIG` encodes which
models think, per provider, by RegExp on the model id. So the library carried two answers to
"can this think" — a per-model one used for listing, and a per-provider one used for nothing —
while the `ModelSpecKey` doc comment wrote off the resulting hole as a known limitation:
*"a provider that declares support may still have individual models its own API rejects thinking
on."*

Both were deleted. The doc comment went with the field; a rationale that outlives the thing it
justifies is how the next reader concludes the field was load-bearing.

## The second item: `'none'` had no cross-provider spelling

`IThinkingConfig.effort` was `'low' | 'medium' | 'high'`. Every provider has an off state —
`effort: 'none'` on OpenAI and xAI, `thinkingBudget: 0` on Gemini, and on Anthropic the absence of
the `thinking` param, since its vocabulary has no off value. The generic surface had no way to say
it, so turning thinking **off** was the one operation that forced callers into a per-provider
block. The pre-existing antagonist test at `thinkingParamRejection.antagonist.test.ts:203`
demonstrates it: to express "off" it reaches for
`providers: [{ provider: 'openai', config: { effort: 'none' } }]`.

## What the brief predicted wrong, in both directions

**The hard part turned out to be free.** The brief called the temperature-compatibility matrix
"where the bugs are" — four providers, `'none'` re-enabling `temperature`, all needing to thread
identically. It needed **no new logic**. The `!== 'none'` guards on OpenAI and xAI already existed
in `checkTemperatureConflict`, and Anthropic's branch already gated on
`anthropicEffort !== undefined` — so leaving that field unset for `'none'` satisfied the gate for
free. `checkTemperatureConflict` was never touched. The brief's predicted Anthropic mapping
("emit no thinking param at all") was exactly right, and turned out to be the mapping that also
solved the temperature interaction.

**The easy part hid a real edge.** Generic `'none'` maps to Gemini `thinkingBudget: 0` — and
`IGeminiThinkingConfig.thinkingBudget`'s own doc, one field away, says `0` is *"Flash and
Flash-Lite only; error on Pro."* The layer-1 `code-reviewer` pass caught the new doc comment
overclaiming this as a P2, and it was fixed by documenting the caveat rather than adding
model-aware gating — on the reasoning that the same footgun already existed via an explicit
`providers` block.

That reasoning is sound but incomplete, and finalization filed the remainder to `TECH_DEBT.md`.
The pre-existing door was Gemini-specific, where reading the Gemini field's docs is natural; the
new one is the **generic** field whose entire purpose is not having to think about providers.
`FUTURE.md`'s capability-gating entry does not cover it either — Gemini Pro *does* think, it
simply cannot express "off" as a budget of zero. Different problem, so it needed its own record.

## Deliberately not done

Gating the call path on the per-model capability table. It looks like a free reuse —
`DEFAULT_MODEL_CAPABILITY_CONFIG` already knows which models think — and it is not, because that
table's own doc states its posture: *"Patterns are intentionally narrow — false positives are
worse than missing a model."* Right for a **listing filter**, where a missed model is merely
absent from a menu. Wrong for a **call gate**, where the same miss rejects a request the provider
would have accepted — and new model releases routinely outpace a pattern list, so the rejection
lands on exactly the models a caller reached for via `modelOverride`.

Recorded in `docs/FUTURE.md` with that reasoning attached, because the reasoning is the valuable
part: without it the next reader sees an easy reuse and takes it.

## Verification

Four new end-to-end tests, one per provider, each asserting the wire body — both that thinking is
off and that `temperature` survives. Each was **watched fail** against a single targeted neuter of
its own provider's tier-1 mapping, one at a time, reverted before the next; each produced exactly
one failure, its own, confirming no cross-provider entanglement. Full table in `result.md`.

Independently re-verified at review time: reverting the Anthropic `'none'` guard so it maps
through like the other providers produced exactly one failure — the Anthropic test — failing with
`thinking mode is not compatible with temperature on provider anthropic`, matching the neuter
table's row 1.

**Gates.** `rushx build` / `rushx lint` / `rushx test` clean in `@fgv/ts-extras` (2795 tests, 100%
coverage, no gap closure needed). Repo-wide `rush rebuild` clean across 36 packages with zero
warnings — load-bearing here, since removing a required interface member is precisely the
shared-contract change per-package gates cannot see. `type: major` change file. `api.md`
regenerated.

## Dispositioned, not fixed

Copilot's round-3 review flagged the checked-in generated docs under `libraries/ts-extras/docs/`
as still documenting `thinkingMode` and the old effort union. True, and **not this stream's
doing**: that directory is regenerated in dedicated "update generated docs" PRs (#463, #311),
never in feature PRs, and was already 145 commits stale — missing `renderWithSegments` and
`IPromptComposition` from #663 among others. Regenerating 2094 files inside a focused change would
have buried the diff. Reverted and dispositioned in a PR comment; the Copilot loop stopped there
on diminishing returns, round 3's only finding being out-of-scope rather than a defect.
