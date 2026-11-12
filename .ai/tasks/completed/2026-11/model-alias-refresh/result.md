# Result: `model-alias-refresh`

**Shipped:** every `ai-assist` alias and default model was checked against provider pages fetched on
2026-11-08, and seven targets moved — `@anthropic:sonnet`, `@anthropic:haiku`, `@openai:flagship`,
`@openai:nano`, `@google-gemini:flash-image`, Groq's default and Mistral's base default — each with the
per-model wire declarations its new target needs; the rest are held with a cited reason.

Base / PR target: `integration/asks`. Package: `@fgv/ts-extras` (change file `minor`). Also touched:
`samples/testbed` (private sample; its probes and tests pin alias targets). PR: #767.

## Method

All six providers were reachable this run (Gemini, Groq and Mistral had been unreachable in #765).
Every page was downloaded raw with `curl`; ids, dates and limits were read from the raw text
(Anthropic and xAI `.md` renderings, Gemini's markdown source, and OpenAI / Groq / Mistral HTML
converted to text by a local script — never from a summarising fetch). OpenAI endpoint support was
read from page markup (an unsupported endpoint's label carries `text-gray-400`). The agent made no
live API call: this environment has no provider credentials. The testbed canaries were extended so
the user's next live run exercises every rotated target (see *Testbed*).

## 1. Rotated aliases and defaults — citations

Fetch date for every row: **2026-11-08**.

| alias / default | old target | new target | URL | quoted line | lifecycle |
|---|---|---|---|---|---|
| `@anthropic:sonnet` (base) | `claude-sonnet-5` | `claude-sonnet-5-5` | https://platform.claude.com/docs/en/about-claude/models/overview | "Claude API ID \| `claude-fable-5-1` \| `claude-opus-5-5` \| `claude-sonnet-5-5` \| `claude-haiku-5-5`" | Active, "Not sooner than September 28, 2027" (model-deprecations) |
| | | | https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5 | "Claude Sonnet 5.5 has the same prices as Claude Sonnet 5, except for prompt cache reads" | old target: Active, "Not sooner than June 30, 2027" |
| `@anthropic:haiku` (non-tier) | `claude-haiku-4-5-20251001` | `claude-haiku-5-5` | https://platform.claude.com/docs/en/about-claude/model-deprecations | "claude-haiku-5-5 \| Active \| N/A \| Not sooner than October 7, 2027" | old target: "claude-haiku-4-5-20251001 \| Active \| N/A \| Not sooner than October 15, 2026" — that date has passed |
| `@openai:flagship` (advanced) | `gpt-6-sol` | `gpt-6.1-sol` | https://developers.openai.com/api/docs/models | "Choose GPT-6.1 Sol to balance intelligence and cost" · "Model ID gpt-6.1-sol … $2 / Input MTok … $10 / Output MTok" | not on the deprecations page |
| | | | https://developers.openai.com/api/docs/models/gpt-6-sol | "See GPT-6.1 Sol for the newer Sol model." | old target: not deprecated, same $2/$10 |
| `@openai:nano` (non-tier) | `gpt-5.4-nano` | `gpt-6-luna` | https://developers.openai.com/api/docs/deprecations | "2026-10-01: GPT-5.3-Codex, GPT-5.1, GPT-5.4-Nano … Apr 1, 2027 · gpt-5.4-nano \| gpt-5.4-nano-2026-03-17 · gpt-6-luna" (shutdown, model, recommended replacement) | old target: **Deprecated**, shutdown 2027-04-01 |
| | | | https://developers.openai.com/api/docs/models | "GPT-6 Luna · Our most efficient model for focused, high-volume tasks. · Model ID gpt-6-luna · $0.1 / Input MTok · $0.5 / Output MTok" | Luna is cheaper than nano's "$0.2 • $1.25" |
| `@google-gemini:flash-image` (image) | `gemini-3.1-flash-image` | `gemini-nano-banana-2.1` | https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1 (served from aistudio.google.com) | "is the latest high-efficiency image generation and conversational editing model. An update to Nano Banana 2 (Gemini 3.1 Flash Image), it maintains Flash-level speed and cost efficiency" · "Stable: `gemini-nano-banana-2.1`" | Stable; old target also Stable, no shutdown |
| Groq `defaultModel` | `llama-3.3-70b-versatile` | `openai/gpt-oss-120b` | https://console.groq.com/docs/deprecations | "llama-3.3-70b-versatile 08/16/26 openai/gpt-oss-120b or qwen/qwen3.6-27b" · "This deprecation applies to free and developer-tier usage; enterprise customers with a committed-spend contract are not affected." | old target shut down 2026-08-16 (free/dev). The alternative `qwen/qwen3.6-27b` was itself deprecated 09/14/26. New target listed under "Production Models" on https://console.groq.com/docs/models |
| Mistral `defaultModel.base` | `mistral-large-latest` | `mistral-large-4` | https://docs.mistral.ai/models/mistral-large-3-25-12 | page data `"names":["mistral-large-2512","mistral-large-latest"]` | the `-latest` alias is still a name of **Mistral Large 3**, deprecated: "Mistral Large 3 \| 25.12 \| mistral-large-2512 \| 10/31/2026 \| 4/30/2027 \| Mistral Large 4" (models overview, Deprecated table) |
| | | | https://docs.mistral.ai/models/mistral-large-4-0 | "October 6, 2026 \| GA" · "Send a request to the Chat Completions API with the `mistral-large-4` model name." · names `["mistral-large-4","mistral-large-4-0"]` | GA. https://docs.mistral.ai/inference/model-lifecycle: "model-name-major … Latest minor version of that major generation" |

## 2. Unchanged — why each is still current

| alias / default | target | reason (quoted, fetched 2026-11-08) |
|---|---|---|
| `@anthropic:opus` | `claude-opus-5-5` | overview: "start with Claude Opus 5.5 for most workloads"; deprecations: Active, not sooner than 2027-09-22 |
| `@anthropic:fable` | `claude-fable-5-1` | overview column "Claude Fable 5.1"; Active, not sooner than 2027-09-01 |
| `@openai:mini` | `gpt-6-luna` | models page: "or GPT-6 Luna for cost-sensitive, high-volume workloads"; no GPT-6.1 Luna |
| `@openai:pro` | `gpt-6-astra` | models page: "GPT-6 Astra, our flagship model for complex reasoning and coding"; no newer Astra |
| `@openai:image` | `gpt-image-2.5-sunburst` | **held, Q2**: the catalog still badges it "Default" and "Our most capable model for image generation and editing"; the 2.6 Sunburst page states "Performance — Not specified", and the image guide's size table names only 2.5 |
| `@openai:embedding` | `text-embedding-3-small` | catalog: "text-embedding-3-small · Small embedding model"; not deprecated |
| `@google-gemini:flash` | `gemini-3.8-flash` | "For any new projects, use our latest models: 3.5 Flash-Lite or 3.8 Flash."; deprecations: "No shutdown date announced" |
| `@google-gemini:flash-lite` | `gemini-3.5-flash-lite` | same sentence; Stable; no Flash-Lite newer than 3.5 except TTS |
| `@google-gemini:pro` | `gemini-3.1-pro-preview` | **held, Q3 — an explicit exception to the GA rule.** The target is a preview model; the only GA candidate, Gemini 4 Argon, requires a `thinkingLevel` wire ai-assist does not send. It stays on the preview until that wire exists |
| `@google-gemini:embedding` | `gemini-embedding-001` | "Stable: `gemini-embedding-001`"; **Q4** for `gemini-embedding-2` |
| `@xai-grok:standard` | `grok-4.3` | grok-4.3 page: $1.25 / $2.50, reasoning "none, low, medium, high, xhigh"; nothing newer in that band |
| `@xai-grok:flagship` | `grok-4.7` | models page: "For everything else, including code, use Grok 4.7. It is the most capable model we've built." |
| `@xai-grok:imagine` | `grok-imagine-image-2.0` | models page: "Images: Grok Imagine Image 2.0" |
| Mistral `defaultModel.embedding` | `mistral-embed` | listed under Embedding models, "Mistral Embed … v 23.12"; names `mistral-embed-2312`, `mistral-embed`; not in the Deprecated table |

## 3. Wire declarations, per new target

| target | declaration | source (quoted) | change |
|---|---|---|---|
| `claude-sonnet-5-5` | structured output | whats-new: "Claude Sonnet 5.5 doesn't support forced tool use. `tool_choice` set to `{"type": "any"}` or `{"type": "tool", "name": "..."}` returns a 400 `invalid_request_error`"; structured-outputs `supportedModels` lists `claude-sonnet-5-5` | **added** `{ modelPrefix: 'claude-sonnet-5-5', format: 'anthropic-output-format' }` |
| | thinking shape | "Manual thinking budgets (`thinking: {"type": "enabled", "budget_tokens": N}`) return a 400 error" | already adaptive via the dash-bounded `claude-sonnet-5` prefix; test pins it |
| | thinking off | "a request that sends `thinking: {"type": "disabled"}` returns a 400"; "omit the `thinking` field or send `thinking: {"type": "adaptive"}`, which is equivalent" | **superseded in review round 1** (§ 3a): first version said "none — `'none'` omits `thinking`", which leaves adaptive thinking on. Now on `thinkingRequiredModelPrefixes`, so `'none'` → `'low'` |
| | sampling / image input / max output | thinking page sampling list includes Sonnet 5.5; overview: all current models take image input; "Max output 128K tokens" | temperature refused before the wire (§ 3b, review round 1); max-output entry existed from #765 |
| `claude-haiku-5-5` | thinking shape | whats-new: "Manual extended thinking returns an error \| Breaking \| Replace `budget_tokens` with adaptive thinking." | **added** to `adaptiveThinkingModelPrefixes` by its own id (claude-haiku-4-5 keeps the budget shape) |
| | structured output / tool choice | migration guide: "Claude Haiku 5.5 accepts a forced `tool_choice` (`any` or a named tool), but the response starts with the tool call and has no `thinking` block." | none — stays on the `anthropic-tool-forced` catch-all; test pins it |
| | sampling, prefill | "Sampling parameters can return an error … Omit `temperature`, `top_p`, and `top_k`"; "Assistant message prefill returns an error" | **amended in review round 1** (§ 3b): a caller's `temperature` is now refused before the wire via `samplingParamsRejectedModelPrefixes`; ai-assist sends no prefill |
| | capability detection | overview: adaptive thinking, text and image input, tool use | **added** `/^claude-haiku-5-5/` → chat, tools, vision, thinking (otherwise only `/^claude-/` matched and thinking was lost) |
| `gpt-6.1-sol` | thinking off | page: "reasoning.effort supports low, medium (default), high, xhigh, and max." | **added** to `thinkingRequiredModelPrefixes` (gpt-6-sol, which lists `none`, is unmatched) |
| | Responses-only | endpoints: Chat Completions and Responses both supported; "Tool calling requires the Responses API." | none — not Responses-only; every tool-bearing OpenAI call already routes to `/responses` |
| | structured output / image input / max output | "Structured outputs Supported"; "Input Text, Image"; "128,000 max output tokens" | **added** `maxOutputTokens` 128000; `/^gpt-6/` detection already covers it; `max_completion_tokens` rule is provider-keyed (`usesMaxCompletionTokensField` → `openai`), so it applies unchanged |
| `gpt-6-luna` (nano) | all | already the base-tier target | none (existing entries) |
| `gemini-nano-banana-2.1` | image wire | image guide (`?generate-content=true`): the basic REST example posts only `contents` to `…/gemini-nano-banana-2.1:generateContent`; `imageConfig.aspectRatio` is documented for it. `callGeminiImageOutGeneration` sends `contents` plus, only when an aspect ratio is set, `generationConfig.imageConfig` — no `responseModalities` *(corrected in review round 1; the first version said it sent `responseModalities`)* | none — the `gemini-image-out` catch-all applies; test pins it |
| | capability detection | "Image generation: Supported"; its id has no `-image` | **added** `/^gemini-nano-banana/` → image-generation |
| | model-name union | — | **added** to `GeminiFlashImageModelNames` |
| `openai/gpt-oss-120b` | input / output / limit | model page: "INPUT Text OUTPUT Text"; "MAX OUTPUT TOKENS 65,536" | **added** Groq `maxOutputTokens` 65536; `acceptsImageInput: false` already right; ai-assist sends no thinking params to Groq |
| `mistral-large-4` | structured output | Large 4 page: "Structured Outputs /v1/chat/completions" | none — the `openai-json-schema` catch-all applies; no max output stated, nothing recorded |

## 3a. `effort: 'none'` on every Anthropic adaptive model *(review round 1, P2-1)*

Source for every row: the per-model table on
https://platform.claude.com/docs/en/build-with-claude/thinking (fetched 2026-11-08), column
`"disabled"`, plus the prose under it: *"Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, Claude
Mythos 5, Claude Opus 5.5, and Claude Mythos Preview reject `thinking: {type: "disabled"}`"*; *"Claude
Sonnet 5.5 … rejects `thinking: {type: "disabled"}` with a 400 error"*; *"Claude Opus 5 also has
thinking on by default and accepts `thinking: {type: "disabled"}` at effort `high` or below"*;
*"Claude Haiku 5.5 also has thinking on by default and accepts `thinking: {type: "disabled"}` at
effort `high` or below"*. A `'none'` sends no effort, so the model's default applies: Opus 5 `high`
(its overview page), Haiku 5.5 `medium` (models overview).

| model | "disabled" column | verdict | what a generic `'none'` now sends |
|---|---|---|---|
| `claude-sonnet-5` | "Thinking off" | accepted | `thinking: {type: 'disabled'}` |
| `claude-opus-5` | "Thinking off at `high` effort or below" | accepted (default `high`) | `thinking: {type: 'disabled'}` |
| `claude-haiku-5-5` | "Thinking off at `high` effort or below" | accepted (default `medium`) | `thinking: {type: 'disabled'}` |
| `claude-sonnet-5-5` | "400 error" | rejected → thinking-required | adaptive + `output_config.effort: 'low'`, or refused under `onUnsupported: 'fail'` |
| `claude-opus-5-5` | "400 error" | rejected → thinking-required | same |
| `claude-fable-5-1`, `claude-fable-5` | "400 error" | rejected → thinking-required (`claude-fable-5`, dash-bounded) | same |
| `claude-mythos-5-1`, `claude-mythos-5` | "400 error" | rejected → thinking-required (`claude-mythos-5`, dash-bounded) | same — and `claude-mythos-5` is now adaptive too: its "enabled with budget_tokens" column reads "400 error" |
| `claude-opus-4-8`, `claude-opus-4-7` *(round 2, Q7)* | "Thinking off" | accepted; now adaptive — their rows read "Thinking off \| Adaptive thinking \| 400 error \| 400 error \| Thinking off", so a budget 400s | `thinking: {type: 'disabled'}`; an effort now goes out adaptive, not as a budget |
| `claude-mythos-preview` *(round 2)* — id from the deprecations page ("claude-mythos-preview \| Deprecated") | "400 error" | rejected → thinking-required; not adaptive ("Extended thinking" for a budget) | budget shape at `'low'` |
| older models (`claude-haiku-4-5`, `-sonnet-4-6`, `-opus-4-6`, …) | — | not adaptive | no `thinking` field — their "No `thinking` field" column reads "Thinking off" |

*Round 2 (A6), widened in round 3 (A11):* `executeClientToolTurn` takes a caller-built
`IResolvedThinkingConfig`, which skips the resolver. It now refuses `anthropicThinkingDisabled` with
no `anthropicEffort` on any thinking-required model ("… cannot run with thinking off …") before
dispatch — including `claude-mythos-preview`, which keeps the budget shape, so the flag would have
sent no field and left it thinking. The two emit-site comments say so.

The shape is "adaptive default with an exception list": no new descriptor field; the exception list
is `thinkingRequiredModelPrefixes`. Before this, the Anthropic thinking-required list was empty and
every adaptive model ran with thinking on when asked for `'none'`.

## 3b. Models that reject sampling parameters *(review round 1, P2-2a)*

ai-assist sends only `temperature` (never `top_p` / `top_k`), so `temperature` is what is refused.

*Amended in review round 2 (A5):* the Anthropic rule is "rejects a **non-default** temperature". The
rule that rejects the default too belongs to API version `2026-10-21`, and ai-assist pins
`anthropic-version: 2023-06-01` (`endpoint.ts`), so `temperature: 1` — Anthropic's default — is still
sent and only other values are refused. That is carried as data: the Anthropic descriptor declares
`samplingParamsAcceptedTemperature: 1` beside the list. OpenAI declares none, so every value is
refused there; the GPT-6 guide has no default carve-out. The round-1 version refused `1` too, which
broke `@anthropic:sonnet` / `@anthropic:opus` callers that send it.

| provider | model(s) declared | source (fetched 2026-11-08) |
|---|---|---|
| anthropic — non-default only (`samplingParamsAcceptedTemperature: 1`) | `claude-fable-5` (+5-1), `claude-mythos-5` (+5-1), `claude-mythos-preview`, `claude-opus-5` (+5-5), `claude-opus-4-8`, `claude-opus-4-7`, `claude-sonnet-5` (+5-5), `claude-haiku-5-5` | thinking page: *"On Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, Claude Mythos 5, Claude Mythos Preview, Claude Opus 5.5, Claude Opus 5, Claude Opus 4.8, Claude Opus 4.7, Claude Sonnet 5.5, Claude Sonnet 5, and Claude Haiku 5.5, non-default `temperature`, `top_p`, or `top_k` values return a 400 error on every request, regardless of whether thinking is used"*; Haiku 5.5 migration guide: *"On Claude Haiku 5.5, omit `temperature`, `top_p`, and `top_k`"* |
| openai — every value | `gpt-6-astra`, `gpt-6.1-sol` | https://developers.openai.com/api/docs/guides/latest-model: *"When reasoning effort is not none, remove temperature, top_p, and top_logprobs"*; neither model has a `none` effort |
| — not declared | `claude-haiku-4-5`, `claude-sonnet-4-6` and older | not in that list; ai-assist pins `anthropic-version: 2023-06-01`, before the `2026-10-21` version that rejects temperature on every model, so they reject it only with thinking on (already refused by `checkTemperatureConflict`) |
| — not declared | `gpt-6-luna`, `gpt-6-sol` | reject temperature unless effort is `none` (default `medium`) — effort-conditional, not a per-model rule; disclosed in § 5, Q8 |
| — not declared | Gemini, xAI, Groq, Mistral targets | no fetched page states a sampling restriction for the alias targets |

The refusal runs after the thinking checks, so `{ effort: 'none', temperature }` on
`gpt-6.1-sol` still gets the existing, more specific "'none' was sent as 'low' … remove temperature"
message.

**Red-then-green.** With `'claude-sonnet-5-5'` removed from `thinkingRequiredModelPrefixes` and
`'claude-haiku-5-5'` removed from `samplingParamsRejectedModelPrefixes`, exactly seven tests in
`thinkingOffAndSampling.test.ts` failed (the three sonnet-5-5 `'none'` rows, and the four haiku
temperature refusals across completion, streaming and client-tool paths); restoring the registry
returned it to 41/41 (`red-test.log`, `green-test.log`).

*Round 3 (A10):* on those models the accepted default is not a thinking conflict either ("…
regardless of whether thinking is used"), so `{ temperature: 1, thinking: { effort: 'low' } }` is
sent on every path; a non-default value with thinking is still refused, and older models keep the
existing thinking/temperature conflict.

**Review round 3 red-then-green** (file now 74 tests): dropping the accepted-default exemption from
`checkTemperatureConflict` and the Anthropic adapter turned exactly the seven "sends temperature 1
with effort low" rows red (completion ×3, streaming ×2, client-tool ×2); restoring the guard's
adaptive condition turned exactly the `claude-mythos-preview` thinking-off-flag row red; each restored
to 74/74 (`r4-red-1.log`, `r4-red-2.log`, `r4-green.log`). A first item-1 mutation compared with
`NaN`, failed lint, and was not counted.

**Review round 2 red-then-green** (file then 61 tests):
- **A5:** removing `samplingParamsAcceptedTemperature: 1` turned 20 tests red — the seven "sends
  temperature 1" rows (haiku-5-5 and sonnet-5-5 across completion, streaming and client-tool, plus
  `@anthropic:opus`), and the thirteen Anthropic refusal rows whose assertion names the
  non-default message. Restored: 61/61 (`r3-red-p1.log`, `r3-green.log`).
- **A6:** deleting the client-tool guard turned exactly the four "refuses a caller-built
  thinking-off flag" rows red (`@anthropic:sonnet`, `claude-opus-5-5`, `claude-fable-5-1`,
  `claude-mythos-5`). Restored: 61/61 (`r3-red-p2.log`, `r3-green.log`). A first attempt that
  short-circuited the condition with `false &&` failed to compile and was not counted.

**Holds re-checked.** The `claude-opus-5-5` / `claude-fable-5-1` / `claude-mythos-5-1` forced-tool
hold stands (Opus 5.5 / Fable 5.1 what's-new pages unchanged in substance). The `gpt-6-astra` and
xAI `thinkingRequired` entries stand (pages still list no `none`). `gpt-5.5-pro` stays Responses-only.

**Typed unions** gained `claude-sonnet-5-5`, `claude-haiku-5-5` (`AnthropicThinkingModelNames`),
`gpt-6.1-sol` (`OpenAiThinkingModelNames`) and `gemini-nano-banana-2.1` (`GeminiFlashImageModelNames`),
so a `models?` filter can name each rotated target. Nothing was removed.

## 4. `maxOutputTokens` entries added

| provider | `modelId` | value | URL | quoted line |
|---|---|---|---|---|
| openai | `gpt-6.1-sol` | 128000 | https://developers.openai.com/api/docs/models/gpt-6.1-sol | "128,000 max output tokens" |
| google-gemini | `gemini-3.8-flash` | 65536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash | "**Output token limit** 65,536" |
| google-gemini | `gemini-3.5-flash-lite` | 65536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite | "**Output token limit** 65,536" |
| google-gemini | `gemini-3.1-pro-preview` | 65536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview | "**Output token limit** 65,536" |
| groq | `openai/gpt-oss-120b` | 65536 | https://console.groq.com/docs/model/openai/gpt-oss-120b | "MAX OUTPUT TOKENS 65,536" |

`@google-gemini:flash`, `:pro` and `:flash-lite` left the coverage test's exclusion list. Still
excluded: image and embedding aliases (no completion limit applies — Nano Banana 2.1's 32,768 output
limit is an image-out model's, not recorded) and both xAI completion aliases (the Responses reference
still says only "Defaults to 128,000 when unset; set a larger value to allow longer generations").
Mistral Large 4's page shows no max-output figure, so Mistral records nothing. The coverage test's id
pattern widened to allow `/` for Groq's owner-prefixed ids.

## 5. Behaviour consumers will see

*(Expanded in review round 1: the first version disclosed only the first, third and last items.)*

- **Anthropic base tier (`@anthropic:sonnet` → `claude-sonnet-5-5`):**
  - structured output now goes out as `output_config.format`, not a forced tool, and
    `structuredOutputSchemaKeywords` returns the JSON-outputs table for it;
  - text the model writes between tool calls longer than a sentence or two comes back as
    progress-update `thinking` blocks (empty at the default `display`), so a client streaming that
    text goes quiet between tool calls;
  - its thinking blocks are bound to the model and conversation: it reads earlier Sonnet 5 / Haiku
    blocks but not Opus 5 / 5.5 / Fable / Mythos ones, which are dropped; editing earlier history
    and replaying a block can 400;
  - it cannot turn thinking off: `'none'` is now sent as `'low'` (or refused under
    `onUnsupported: 'fail'`);
  - a non-default `temperature` is refused before the wire (it was a provider 400); `1` is still sent,
    with or without thinking.
- **`@anthropic:haiku` (→ `claude-haiku-5-5`):** thinks by default (Haiku 4.5 did not), so a call with
  no thinking config now thinks and spends output tokens on it; the same text counts as ~30% more
  tokens; `'none'` now sends `thinking: {type: 'disabled'}`; a non-default `temperature` is refused
  before the wire (Haiku 4.5 accepted any value); structured output still uses the forced tool.
- **Every Anthropic adaptive model:** a generic `'none'` now means thinking off —
  `thinking: {type: 'disabled'}` on `claude-sonnet-5`, `claude-opus-5` and `claude-haiku-5-5`, and
  `'low'` (or a refusal) on Opus 5.5, Sonnet 5.5, Fable and Mythos, which cannot turn thinking off.
  Before, `'none'` silently ran with thinking on at the default effort on all of them.
  A non-default `temperature` is refused before the wire on every Claude 5.x model,
  `claude-mythos-preview` and Opus 4.7 / 4.8; `temperature: 1` is sent. Opus 4.7 / 4.8 now take the
  adaptive thinking shape for an effort (a budget had been a provider 400).
- **OpenAI advanced tier (`@openai:flagship` → `gpt-6.1-sol`):** `'none'` is sent as `'low'` by
  default or refused with `onUnsupported: 'fail'`; `{ effort: 'none', temperature }` is refused
  before sending; any `temperature`, including `1`, is refused before the wire. `gpt-6-astra` (frontier) now gets the
  same up-front temperature refusal.
- **`@openai:nano` (→ `gpt-6-luna`):** names the same model as `@openai:mini`; `temperature` without
  effort `'none'` now 400s at the provider (Luna defaults to `medium`; `gpt-5.4-nano` defaulted to
  `none`) — not guarded, Q8.
- **Groq and Mistral** callers relying on the default model get a different model.

## 6. Testbed

The live canaries follow the new targets: the Anthropic tier canary adds a `@anthropic:haiku` row so
the forced-tool structured-output path is still exercised live (the base tier no longer uses it), the
Gemini tier canary fires one live image generation on the rotated image tier, and the structured-output
scenario probes forced tool on haiku and JSON outputs on the default. The wire probe now uses
`@anthropic:haiku` for tools (its stated "cheapest model" rule; the retirement exception expired) and
`@anthropic:sonnet` for JSON outputs (now the cheapest line that receives them).

## 7. Open questions (in `state.md`)

Q1 **decided** (orchestrator): keep `@openai:nano` → `gpt-6-luna`; removing an alias is a break · Q2 `gpt-image-2.6-sunburst` role mapping ·
Q3 Gemini 4 Argon needs a `thinkingLevel` wire before `@google-gemini:pro` can move · Q4
`gemini-embedding-2` is GA but changes vector space · Q5 Groq marks `max_tokens` deprecated · Q7
`claude-opus-4-8` / `-4-7` budget thinking — **resolved in round 2**, now adaptive · Q8
`gpt-6-luna` / `gpt-6-sol` reject `temperature` unless effort is `'none'` (effort-conditional).

## 8. Gates

Logs under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/alias/`.

Graded by grep over the logs, not by exit code (`not met|Operations failed|error TS|Jest tests? failed|FAILURE`
must be 0; the only `warning` allowed is Rush's tracked-symlink notice).

| gate | result | log |
|---|---|---|
| `ts-extras` build / lint / test | pass; 100% coverage (`registry.ts` 100/100/100/100) | `build1.log`, `lint-extras.log`, `test3.log` |
| `testbed` build / lint / test | pass | `tb-build2.log`, `lint-tb.log`, `tb-test2.log` |
| repo-wide `rush rebuild` | pass — 0 failure patterns, 1 warning (tracked-symlink notice only), 7m10s | `gate-rebuild.log` |
| repo-wide `rush test` | 38/39 pass; `@fgv/ts-res-cli` failed one test in `test/integration/cli-configuration.test.ts` — the known flake. Retried once alone: pass, 0 failure patterns. No NUL padding in either log | `gate-test.log`, `gate-test-tsrescli-retry.log` |
| `rush change --verify --target-branch origin/integration/asks` | pass (`@fgv/ts-extras` change file found; testbed is private) | — |
| prettier 2.8.8 `--check` on every changed file | pass | — |
| `verify-capability-docs.mjs` | pass, 0 failed | — |
| `generate-capability-feed.mjs --check` | pass, 0 stale (regenerated: the stream's `headline` is in both feeds) | — |

### Review round 1 re-run

| gate | result | log |
|---|---|---|
| `ts-extras` build / lint / test | pass; 100% coverage on every touched file (`registry.ts`, `model.ts`, `thinkingOptionsResolver.ts`, `completionClient.ts`, `streamingClient.ts`, `anthropic.ts`, `clientToolContinuationBuilder.ts`) | `r2-build3.log`, `r2-lint.log`, `r2-test4.log` |
| `testbed` build / lint / test | pass | `r2-tb-build.log`, `r2-tb-lint.log`, `r2-tb-test.log` |
| red-then-green (§ 3b) | 7 red with the two declarations removed; 41/41 green restored | `red-test.log`, `green-test.log` |
| repo-wide `rush rebuild` | pass — 0 failure patterns, tracked-symlink notice only, 4m50s | `r2-gate-rebuild.log` |
| repo-wide `rush test` | 36 passed; `@fgv/ts-extras-mcp` failed one test in `egress.test` ("a slow tool … outlives the guarded fetch's headers deadline"), the known flake, which blocked `@fgv/testbed` and `@fgv/ts-extras-re2`. Retried those three once with `--only`: all pass, 0 failure patterns. No NUL padding | `r2-gate-test.log`, `r2-gate-test-retry.log` |
| `rush change --verify`, prettier 2.8.8, `verify-capability-docs`, `generate-capability-feed --check` | pass (feed regenerated: the line now tags `testbed`) | — |

### Review round 2 re-run

| gate | result | log |
|---|---|---|
| `ts-extras` build / lint / test | pass; 100% coverage | `r3-build2.log`, `r3-lint.log`, `r3-test3.log` |
| `testbed` build / lint / test | pass | `r3-tb-build.log`, `r3-tb-lint.log`, `r3-tb-test.log` |
| red-then-green, A5 and A6 (§ 3b) | 20 red without the accepted default; 4 red without the client-tool guard; 61/61 restored | `r3-red-p1.log`, `r3-red-p2.log`, `r3-green.log` |
| repo-wide `rush rebuild` | pass — 0 failure patterns, tracked-symlink notice only, 7m35s | `r3-gate-rebuild.log` |
| repo-wide `rush test` | 36 passed; `@fgv/ts-extras-mcp` failed one timing test in `egress.test` ("an answer over the cap on a resumed (Last-Event-ID) GET fails its request promptly…") — **not** the named slow-tool flake but the same file and the same timing class, in a package this branch does not touch; it blocked `@fgv/testbed` and `@fgv/ts-extras-re2`. Retried those three once with `--only`: all pass, 0 failure patterns. No NUL padding | `r3-gate-test.log`, `r3-gate-test-retry.log` |
| `rush change --verify`, prettier 2.8.8, `verify-capability-docs`, `generate-capability-feed --check` | pass | — |

### Review round 3 re-run, on the merged tree (base `integration/asks` @ `25b33908`, with #766)

**Base merge.** `git merge --no-ff origin/integration/asks` (merge commit `986f1235`, no rebase).
Conflicts were only the two ledger files: in `docs/workstreams/2026-11.md` both entries kept, newest
first (`model-alias-refresh`, `deps-refresh`, `model-max-output-tokens`) and the count line set to
"3 streams"; in `docs/WORKSTREAMS.md` the 2026-11 index line holds all three ids and reads "3
shipped". `docs/TECH_DEBT.md` auto-merged. Nothing under `common/config/rush` conflicted or differs
from the base, so no `rush update`; the lockfile is the base's, untouched. The capability feed was
regenerated by its script (no change). Then `rush purge` + `rush install` on the new Rush/pnpm.

| gate | result | log |
|---|---|---|
| `rush purge` + `rush install` | pass (only the base's deprecated-subdependency notices) | `r4-purge.log`, `r4-install.log` |
| `ts-extras` build / lint / test | pass; 100% coverage | `r4m-build.log`, `r4m-lint.log`, `r4m-test.log` |
| `testbed` build / lint / test | pass | `r4m-tb-build.log`, `r4m-tb-lint.log`, `r4m-tb-test.log` |
| red-then-green, A10 and A11 (§ 3b) | 7 red / 1 red; 74/74 restored | `r4-red-1.log`, `r4-red-2.log`, `r4-green.log` |
| repo-wide `rush rebuild` | pass — 0 failure patterns, tracked-symlink notice only | `r4-gate-rebuild.log` |
| repo-wide `rush lint` | pass — 0 errors, tracked-symlink notice only | `r4-gate-lint.log` |
| repo-wide `rush test` | **39/39 on the first run**, 0 failure patterns, no NUL padding | `r4-gate-test.log` |
| `rush change --verify --target-branch origin/integration/asks`, prettier 2.8.8, `verify-capability-docs`, `generate-capability-feed --check` | pass | — |

No `c8 ignore` was added. No `code-reviewer` pass was run (per the brief; the orchestrator reviews).
