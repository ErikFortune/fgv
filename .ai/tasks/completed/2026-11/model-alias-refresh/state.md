# State: `model-alias-refresh`

Worker-owned. The brief is frozen; questions, decisions and progress live here.

## Status

Research done 2026-11-08 (all six providers reachable). Implementation committed on
`model-alias-refresh` (base `integration/asks` @ `c3ab4e48`); gates in `result.md` § 8. Closed out to
`.ai/tasks/completed/2026-11/model-alias-refresh/`.

Testbed scope note: `samples/testbed` probes and tests pin alias targets, so they were updated in
this branch (brief: "Touch other packages only where a repo-wide test pins an alias target"). The
tier canary also gained a `@anthropic:haiku` row and a Gemini live image, so the forced-tool path
and the rotated image tier stay live-exercised.

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

## Amendments — orchestrator review round 1 (head `923f0aa1`)

Recorded here because `brief.md` is frozen. Decisions are the orchestrator's; the worker carried
them out.

- **A1 (P2-1) `'none'` must mean thinking off on Anthropic adaptive models.** A generic
  `effort: 'none'` used to omit `thinking`, which on an adaptive model is adaptive thinking at the
  default effort. Chosen shape (the "adaptive default with an exception list" option, no new
  descriptor field): on a model in `adaptiveThinkingModelPrefixes`, `'none'` sends
  `thinking: {type: 'disabled'}`; the exception list is the existing
  `thinkingRequiredModelPrefixes`, now populated for Anthropic with the models whose "disabled"
  column reads "400 error", so `'none'` degrades to `'low'` there or refuses under
  `onUnsupported: 'fail'`. Older models keep the omission (their "No `thinking` field" column reads
  "Thinking off"). Carried by a new `IResolvedThinkingConfig.anthropicThinkingDisabled` flag set by
  the resolver and read at both Anthropic emit sites. Per-model verdicts in `result.md` § 3a.
  - Found while doing it: `claude-mythos-5` (not only `-5-1`) is adaptive-only per the same table,
    so the adaptive entry widened from `claude-mythos-5-1` to `claude-mythos-5`; without that, a
    degraded `'low'` on mythos-5 would have gone out as a 400ing budget.
- **A2 (P2-2a) refuse sampling parameters before the wire.** New descriptor field
  `samplingParamsRejectedModelPrefixes` and public predicate `rejectsSamplingParams`; the completion,
  streaming and client-tool paths refuse a `temperature` on a listed model ("… does not accept
  temperature on any request: remove temperature"). ai-assist sends no `top_p`/`top_k`, so
  temperature is the only parameter checked. Anthropic list from the thinking page's sampling
  paragraph; OpenAI `gpt-6-astra` and `gpt-6.1-sol` from the GPT-6 guide (no `'none'`, so always
  rejected). Verdicts in `result.md` § 3b.
- **A3 (P2-2b) disclose every consumer-visible change** in the change file, `result.md` § 5 and the
  ai-assist README.
- **A4 (P3)** correct the image-wire claim (the client sends `contents` plus an optional
  `generationConfig.imageConfig`, no `responseModalities`; the guide's basic REST example sends the
  same); add request-body tests for `@anthropic:sonnet` (JSON outputs, no `tool_choice`) and
  `@anthropic:haiku` (forced tool); record the `@google-gemini:pro` preview target as an explicit
  exception to the GA rule; list `@fgv/testbed` in `meta.yaml` packages.
- **Q1 decided:** keep `@openai:nano` → `gpt-6-luna`. Removing an alias is a break, not a currency
  change.
- **Left as is (orchestrator):** the plain-`startsWith` structured-output prefix matching.

### New open questions from this round

- **Q7** `claude-opus-4-8` and `claude-opus-4-7` are not in `adaptiveThinkingModelPrefixes`, yet the
  same per-model table gives "400 error" for `"enabled"` with `budget_tokens` on both. A non-`'none'`
  effort on either therefore 400s today. Pre-existing, reachable only by `modelOverride`, outside
  the `'none'` contract; not changed.
- **Q8** `gpt-6-luna` (both `@openai:mini` and now `@openai:nano`) and `gpt-6-sol` reject
  `temperature` unless the call sets effort `'none'` (default `medium`; GPT-6 guide: "When reasoning
  effort is not none, remove temperature"). `gpt-5.4-nano` defaulted to `none`, so `@openai:nano` +
  `temperature` with no thinking config used to work and now 400s at the provider. This is
  effort-conditional, not a per-model rule, so it is disclosed but not guarded.

## Amendments — orchestrator review round 2 (head `9a3b5aab`)

- **A5 (P1) Anthropic rejects a *non-default* temperature only.** The thinking page's wording is
  "non-default"; the default-too rule belongs to API version `2026-10-21` and ai-assist pins
  `anthropic-version: 2023-06-01`. Chosen shape: a sibling descriptor field
  `samplingParamsAcceptedTemperature` (Anthropic `1`, OpenAI unset), read by `checkSamplingParams`
  — no provider branch at the call site. Message for Anthropic: "… does not accept a non-default
  temperature (x): remove temperature, or send 1"; OpenAI keeps "… on any request".
- **A6 (P2) refuse a caller-built thinking-off flag on a thinking-required model.**
  `executeClientToolTurn` refuses `anthropicThinkingDisabled` with no `anthropicEffort` when the
  resolved model is adaptive and on `thinkingRequiredModelPrefixes` — exactly the case the emit site
  would turn into `thinking: {type: 'disabled'}`. Emit-site comments corrected for every path.
- **A7 (P3, resolves Q7)** `claude-opus-4-8` and `claude-opus-4-7` added to
  `adaptiveThinkingModelPrefixes`, citing their table rows.
- **A8 (P3)** `claude-mythos-preview` added to the thinking-required and sampling lists: the
  deprecations page names that id, and the thinking page's row and sampling sentence name the model.
  It is not adaptive (its budget column reads "Extended thinking"), so it is not on that list.
- **A9 (P3)** registry comment states that the dash-bounded thinking/sampling lists match a future
  point release of a listed family on purpose (the safe direction for a refusal), unlike the
  exact-id max-output rule.

## Amendments — orchestrator review round 3 (head `d0b50fe7`)

- **A10 (P2) the accepted default temperature also passes with thinking on.** The sampling-
  restricting Anthropic models reject a non-default temperature "regardless of whether thinking is
  used", so their default is not a thinking conflict either. `checkTemperatureConflict` takes an
  optional `acceptedTemperature` and lets it through; callers pass
  `temperatureAcceptedWithThinking(descriptor, model)` (the descriptor's
  `samplingParamsAcceptedTemperature` on a model that `rejectsSamplingParams`, else undefined), and
  the Anthropic streaming adapter takes the same value so its client-tool safety net keeps the
  default. No provider branch. Older models (haiku-4-5, opus-4-6, …) keep the conflict.
- **A11 (P3) the client-tool thinking-off guard keys on thinking-required alone.** It also covers
  `claude-mythos-preview`, which is thinking-required but keeps the budget shape, so the flag would
  have sent no field and the model would have thought.
- **TECH_DEBT** gained a P3 for the `ts-extras-mcp` resumed-GET timing flake seen in round 2.
- **Base merge:** `integration/asks` (with #766, the dependency refresh) merged in with a merge
  commit; see `result.md` § 8.
