# model-alias-refresh — every ai-assist alias and default checked against current provider pages

**Shipped**: 2026-11-08 into `integration/asks` via #767.
Packages: `@fgv/ts-extras` (`ai-assist`); `@fgv/testbed` (`samples/testbed`) updated where it pins
alias targets.
Change file: `minor`.

## Summary

Every alias, `defaultModel` entry and per-model declaration in `registry.ts` was checked against
provider pages downloaded on 2026-11-08. Seven targets moved:

| alias / default | old | new |
|---|---|---|
| `@anthropic:sonnet` (base) | `claude-sonnet-5` | `claude-sonnet-5-5` |
| `@anthropic:haiku` | `claude-haiku-4-5-20251001` | `claude-haiku-5-5` |
| `@openai:flagship` (advanced) | `gpt-6-sol` | `gpt-6.1-sol` |
| `@openai:nano` | `gpt-5.4-nano` | `gpt-6-luna` |
| `@google-gemini:flash-image` | `gemini-3.1-flash-image` | `gemini-nano-banana-2.1` |
| Groq `defaultModel` | `llama-3.3-70b-versatile` | `openai/gpt-oss-120b` |
| Mistral `defaultModel.base` | `mistral-large-latest` | `mistral-large-4` |

Each new target got the declarations its pages require: `claude-sonnet-5-5` on the
`anthropic-output-format` structured-output line (it rejects a forced `tool_choice`),
`claude-haiku-5-5` in `adaptiveThinkingModelPrefixes` (it rejects budget thinking), `gpt-6.1-sol` in
`thinkingRequiredModelPrefixes` (no reasoning effort `none`), two capability-detection rules, and
cited `maxOutputTokens` for `gpt-6.1-sol`, the three Gemini completion targets and Groq's default.

## What a reader should know

- **Review round 1 widened the stream** (`state.md` § Amendments). A generic `effort: 'none'` had
  never turned thinking off on Anthropic adaptive models; it now sends `thinking: {type:
  'disabled'}` where the model accepts it and `'low'` (or a refusal) where it does not. And a new
  `samplingParamsRejectedModelPrefixes` refuses `temperature` before the wire — on Anthropic (every
  Claude 5.x model, Mythos Preview, Opus 4.7/4.8) only a non-default value, `1` still being sent; on
  `gpt-6-astra` and `gpt-6.1-sol` any value. Round 2 also made Opus 4.7/4.8 adaptive and made the
  client-tool path refuse a caller-built thinking-off flag. Verdicts per model are in `result.md`
  §§ 3a–3b.

- **Behaviour changes for alias users**: Anthropic's base tier now sends structured output as
  `output_config.format`; OpenAI's advanced tier no longer runs with thinking off (`'none'` → `'low'`
  by default); `@openai:nano` and `@openai:mini` now name the same model (OpenAI's named replacement
  for the deprecated nano, and GPT-6 has nothing smaller).
- **Held, with reasons** (`result.md` § 2, `state.md` Q1–Q4): `@google-gemini:pro` stays on the 3.1
  Pro preview because Gemini 4 Argon requires `thinkingLevel`, which ai-assist does not send;
  `@openai:image` stays on 2.5 Sunburst, still badged "Default"; `gemini-embedding-001` stays because a
  newer embedding model changes the vector space.
- **No live call was made** — no credentials here. The testbed canaries now exercise every rotated
  target, so the next live run is the verification.

## Artifacts

`brief.md` (frozen contract), `state.md` (decisions D1–D7, open questions Q1–Q6), `result.md`
(citations, wire declarations, limits, gates), `meta.yaml`.
