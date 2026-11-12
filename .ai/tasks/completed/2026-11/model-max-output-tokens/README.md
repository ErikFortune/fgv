# model-max-output-tokens — each model's maximum output tokens, resolvable through aliases

**Shipped**: 2026-11-08 into `integration/asks` via #765.
Package: `@fgv/ts-extras` (`ai-assist`). Origin: personaility#724 (fgv-ask). Change file: `minor`.

## Summary

Anthropic and OpenAI refuse a request whose `maxTokens` is above the model's output limit; they do
not clamp it. Because aliases resolve inside fgv, a consumer holding `@anthropic:opus` cannot know
which model it will reach, and had to choose one number for every model the slot might name.

`AiAssist.resolveMaxOutputTokens(descriptor, modelOverride?, context?)` now answers that. It takes
the same `ModelSpec` and tier a completion call takes, resolves them through `resolveProviderModel`,
and returns the limit of the model that call would use, or `undefined` when the limit is unknown. A consumer caps with `Math.min(cap, limit ?? cap)`; ai-assist itself never
lowers an explicit `maxTokens`, because that would turn a loud refusal into silent truncation.

## What a reader should know

- **Only cited values are recorded.** Anthropic (11 model ids) and OpenAI (5 model ids), each
  from a provider page fetched on 2026-11-08; the citations table is in `result.md`. Gemini, Groq and
  Mistral docs could not be read, and xAI states no maximum, so those return `undefined` and their
  completion aliases are on the test's exclusion list.
- **Exact model ids only.** No prefix and no snapshot inheritance; a dated snapshot has a limit only
  when a page names it and it has its own entry. Review rounds 1 and 2 found that longest-prefix
  matching, then a dated-snapshot suffix rule, each gave uncited numbers to ids no page names, and
  the orchestrator amended the brief (`state.md` A1, A4). A wrong number is worse than none.
- **Anthropic "128K" is recorded as 128000**, reading `k` as the docs do elsewhere. If it meant
  1,024 the value is 3,072 low: it can cap early, never cause a refusal.
- **`DEFAULT_ANTHROPIC_MAX_TOKENS` (4096) is below every recorded limit**, so no adapter changed. A
  test fails if a recorded Anthropic limit ever drops below it.
- **Out of scope, noticed:** `@anthropic:haiku` names a legacy model past its earliest retirement
  date, and the `gpt-5.4-nano` page marks its snapshot deprecated (`state.md`).

## Artifacts

`brief.md` (frozen contract), `state.md` (research and decisions), `result.md` (API, citations,
gates), `meta.yaml`.
