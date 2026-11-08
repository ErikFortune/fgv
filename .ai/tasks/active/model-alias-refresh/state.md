# State: `model-alias-refresh`

Worker-owned. The brief is frozen; questions, decisions and progress live here.

## Status

Research done 2026-11-08 (all six providers reachable). Implementation in progress on
`model-alias-refresh` (base `integration/asks` @ `c3ab4e48`).

## Source reachability (2026-11-08)

| provider | host | result |
|---|---|---|
| Anthropic | platform.claude.com (`.md` renderings) | 200 |
| OpenAI | developers.openai.com | 200 |
| Google Gemini | ai.google.dev → 301 → aistudio.google.com | 200 (was unreachable in #765) |
| xAI | docs.x.ai (`.md` renderings) | 200 |
| Groq | console.groq.com | 200 (was unreachable in #765) |
| Mistral | docs.mistral.ai | 200 (was unreachable in #765) |

Every page was downloaded raw with `curl` and ids/limits were read from the raw text (HTML
converted to text with a local script, or the provider's own `.md` rendering), never from a
summarising fetch. Raw copies are in the scratchpad (`alias/pages/`), not committed.

## Decisions

- **D1 `@anthropic:sonnet` → `claude-sonnet-5-5`.** Same role (Sonnet), same price ("Claude Sonnet
  5.5 has the same prices as Claude Sonnet 5"), Active. Wire: rejects forced `tool_choice`, so it
  gets an `anthropic-output-format` structured-output entry (listed in that feature's
  `supportedModels`). Adaptive thinking is already covered by the dash-bounded `claude-sonnet-5`
  prefix. `thinking: {type: "disabled"}` 400s on it, but ai-assist never sends `disabled` (its
  `'none'` omits the `thinking` field, which the page says is equivalent to adaptive).
- **D2 `@anthropic:haiku` → `claude-haiku-5-5`.** Same role (Haiku, the smallest/fastest line),
  Active, the old target's earliest-retirement date (2026-10-15) has passed. Wire: manual
  `budget_tokens` 400s, so it is added to `adaptiveThinkingModelPrefixes` by its own id (no page
  states the family); forced `tool_choice` is accepted (migration guide), so the forced-tool
  catch-all stays correct; `temperature` must be omitted, which ai-assist already does unless the
  caller sets it (same as every Claude 5 model). Capability-detection rule added by its own id.
- **D3 `@openai:flagship` → `gpt-6.1-sol`.** Same Sol rung and price ($2/$10); the models page now
  lists GPT-6.1 Sol and the `gpt-6-sol` page says "See GPT-6.1 Sol for the newer Sol model". Wire:
  `reasoning.effort` is low..max with no `none` → added to `thinkingRequiredModelPrefixes`; both
  Chat Completions and Responses endpoints supported; "Tool calling requires the Responses API",
  which every tool-bearing OpenAI call already uses; structured outputs supported; text+image input;
  `128,000 max output tokens` recorded.
- **D4 `@openai:nano` → `gpt-6-luna`.** `gpt-5.4-nano` is Deprecated (shutdown 2027-04-01) and
  OpenAI's deprecations page names `gpt-6-luna` as its recommended replacement. Luna is cheaper
  ($0.10/$0.50 vs $0.20/$1.25), so this is not a move up a price tier. Consequence: `@openai:nano`
  and `@openai:mini` now name the same model, because OpenAI has no GPT-6 model below Luna. See Q1.
- **D5 `@google-gemini:flash-image` → `gemini-nano-banana-2.1`.** Stable, "An update to Nano Banana 2
  (Gemini 3.1 Flash Image)" with "Flash-level speed and cost efficiency". The image guide drives it
  through the same `generateContent` + `responseModalities: [TEXT, IMAGE]` + `imageConfig.aspectRatio`
  wire ai-assist sends. Its id does not match `/^gemini-.*-image/`, so a capability-detection rule
  `/^gemini-nano-banana/` → image-generation was added; it is added to `GeminiFlashImageModelNames`.
- **D6 Groq `defaultModel` `llama-3.3-70b-versatile` → `openai/gpt-oss-120b`.** Groq's deprecations
  page: llama-3.3-70b-versatile shut down 08/16/26 for free and developer tiers (enterprise only now),
  recommended replacement `openai/gpt-oss-120b` (the alternative, `qwen/qwen3.6-27b`, has itself
  since been deprecated). Production model; text in/out (matches `acceptsImageInput: false`); ai-assist
  sends no thinking params to Groq. Max output 65,536 recorded.
- **D7 Mistral `defaultModel.base` `mistral-large-latest` → `mistral-large-4`.** The Mistral Large 3
  page lists its names as `mistral-large-2512` and `mistral-large-latest`, and Large 3 is deprecated
  (10/31/2026, retires 4/30/2027, alternative Mistral Large 4). So the `-latest` alias still names a
  deprecated model. Large 4 is GA, names `mistral-large-4` / `mistral-large-4-0`; the page's own
  example sends `mistral-large-4`, which the lifecycle page defines as "Latest minor version of that
  major generation". Structured outputs and function calling on `/v1/chat/completions`. No max
  output is stated on the page, so nothing is recorded.

## Held (target unchanged) and why

- `@anthropic:opus` (`claude-opus-5-5`), `@anthropic:fable` (`claude-fable-5-1`) — current lineup.
- `@openai:mini` (`gpt-6-luna`), `@openai:pro` (`gpt-6-astra`), `@openai:embedding` — current.
- `@openai:image` (`gpt-image-2.5-sunburst`) — see Q2.
- `@google-gemini:flash`, `:flash-lite` — still the newest GA Flash / Flash-Lite.
- `@google-gemini:pro` (`gemini-3.1-pro-preview`) — see Q3 (Gemini 4 Argon wire unconfirmed).
- `@google-gemini:embedding` (`gemini-embedding-001`) — see Q4.
- xAI: all three — models page recommends grok-4.7 and Grok Imagine Image 2.0; grok-4.3 still the
  base price band.
- Mistral embedding `mistral-embed` — listed, not deprecated.

## Open questions (parked)

- **Q1** `@openai:nano` now duplicates `@openai:mini`. Should the nano alias be retired, or kept as a
  role name that may diverge again? Kept for now (removing an alias is not a currency change).
- **Q2** `gpt-image-2.6-sunburst` exists and is OpenAI's named replacement for the deprecated GPT
  Image 1.x models, but `gpt-image-2.5-sunburst` is still badged "Default" and "Our most capable
  model for image generation and editing", the 2.6 page states no performance tier, and the guide
  states the size table only for 2.5. Role mapping ambiguous and size set unconfirmed → held.
- **Q3** Gemini 4 Argon (`gemini-4-argon`, Stable) is now Google's flagship and would be the natural
  `@google-gemini:pro` target, but: `thinkingLevel` is "required for Gemini 4" and `thinkingBudget`
  (the only thinking field ai-assist sends to Gemini) "is deprecated" there, mapping to the nearest
  level with a warning; thinking cannot be disabled; and the per-request output cap differs by call
  mode (65,536 streaming / 32,768 non-streaming), which one `maxOutputTokens` number cannot express.
  Rotating needs a `thinkingLevel` wire (a feature). Held.
- **Q4** `gemini-embedding-2` is now listed GA (multimodal). Swapping the embedding alias changes the
  vector space under existing indexes, which is not a same-role rotation. Held.
- **Q5** Groq's API reference marks `max_tokens` "Deprecated in favor of max_completion_tokens";
  ai-assist sends `max_tokens` to every OpenAI-format provider except `openai`. Provider-level, not an
  alias concern; noted only.
- **Q6** `gpt-5.1` registry comment said "retired March 2026"; the deprecations page now shows it
  deprecated with shutdown 2027-04-01. Comment corrected (comment-only).
