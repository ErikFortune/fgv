# model-max-output-tokens — each model's maximum output tokens, resolvable through aliases

**Shipped**: 2026-11-08 into `integration/asks` via #TBD.
Package: `@fgv/ts-extras` (`ai-assist`). Origin: personaility#724 (fgv-ask). Change file: `minor`.

## Summary

Anthropic and OpenAI refuse a request whose `maxTokens` is above the model's output limit; they do
not clamp it. Because aliases resolve inside fgv, a consumer holding `@anthropic:opus` cannot know
which model it will reach, and had to choose one number for every model the slot might name.

`AiAssist.resolveMaxOutputTokens(descriptor, modelId)` now answers that, alias-first, through the
same helper as the image / embedding / structured-output capability lookups. It returns `undefined`
when the limit is unknown. A consumer caps with `Math.min(cap, limit ?? cap)`; ai-assist itself never
lowers an explicit `maxTokens`, because that would turn a loud refusal into silent truncation.

## What a reader should know

- **Only cited values are recorded.** Anthropic (9 prefixes) and OpenAI (4 completion models), each
  from a provider page fetched on 2026-11-08; the citations table is in `result.md`. Gemini, Groq and
  Mistral docs were unreachable from the session, and xAI states no maximum, so those return
  `undefined` today and their completion aliases are on the test's exclusion list.
- **No catch-all** in the shipped registry, pinned by test. A wrong number is worse than none.
- **Anthropic "128K" is recorded as 128000**, reading `k` as the docs do elsewhere. If it meant
  1,024 the value is 3,072 low: it can cap early, never cause a refusal.
- **`DEFAULT_ANTHROPIC_MAX_TOKENS` (4096) is below every recorded limit**, so no adapter changed. A
  test fails if a recorded Anthropic limit ever drops below it.
- **Out of scope, noticed:** `@anthropic:haiku` names a legacy model past its earliest retirement
  date, and the `gpt-5.4-nano` page marks its snapshot deprecated (`state.md`).

## Artifacts

`brief.md` (frozen contract), `state.md` (research and decisions), `result.md` (API, citations,
gates), `meta.yaml`.
