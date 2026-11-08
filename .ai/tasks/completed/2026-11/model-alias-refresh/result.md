# Result: `model-alias-refresh`

**Shipped:** every `ai-assist` alias and default model was checked against provider pages fetched on
2026-11-08, and seven targets moved — `@anthropic:sonnet`, `@anthropic:haiku`, `@openai:flagship`,
`@openai:nano`, `@google-gemini:flash-image`, Groq's default and Mistral's base default — each with the
per-model wire declarations its new target needs; the rest are held with a cited reason.

Base / PR target: `integration/asks`. Package: `@fgv/ts-extras` (change file `minor`). Also touched:
`samples/testbed` (private sample; its probes and tests pin alias targets). PR: #TBD.

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
| `@google-gemini:pro` | `gemini-3.1-pro-preview` | **held, Q3**: Gemini 4 Argon is Stable and the flagship, but its wire is not one ai-assist sends (§3) |
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
| | thinking off | "a request that sends `thinking: {"type": "disabled"}` returns a 400"; "omit the `thinking` field or send `thinking: {"type": "adaptive"}`, which is equivalent" | none — ai-assist's `'none'` omits `thinking` and never sends `disabled` |
| | sampling / image input / max output | Claude 5 already rejects temperature (sent only when the caller sets it); overview: all current models take image input; "Max output 128K tokens" | none (entry existed from #765) |
| `claude-haiku-5-5` | thinking shape | whats-new: "Manual extended thinking returns an error \| Breaking \| Replace `budget_tokens` with adaptive thinking." | **added** to `adaptiveThinkingModelPrefixes` by its own id (claude-haiku-4-5 keeps the budget shape) |
| | structured output / tool choice | migration guide: "Claude Haiku 5.5 accepts a forced `tool_choice` (`any` or a named tool), but the response starts with the tool call and has no `thinking` block." | none — stays on the `anthropic-tool-forced` catch-all; test pins it |
| | sampling, prefill | "Sampling parameters can return an error … Omit `temperature`, `top_p`, and `top_k`"; "Assistant message prefill returns an error" | none — temperature is sent only when the caller sets it (as for every Claude 5 model); ai-assist sends no prefill |
| | capability detection | overview: adaptive thinking, text and image input, tool use | **added** `/^claude-haiku-5-5/` → chat, tools, vision, thinking (otherwise only `/^claude-/` matched and thinking was lost) |
| `gpt-6.1-sol` | thinking off | page: "reasoning.effort supports low, medium (default), high, xhigh, and max." | **added** to `thinkingRequiredModelPrefixes` (gpt-6-sol, which lists `none`, is unmatched) |
| | Responses-only | endpoints: Chat Completions and Responses both supported; "Tool calling requires the Responses API." | none — not Responses-only; every tool-bearing OpenAI call already routes to `/responses` |
| | structured output / image input / max output | "Structured outputs Supported"; "Input Text, Image"; "128,000 max output tokens" | **added** `maxOutputTokens` 128000; `/^gpt-6/` detection already covers it; `max_completion_tokens` rule is provider-keyed (`usesMaxCompletionTokensField` → `openai`), so it applies unchanged |
| `gpt-6-luna` (nano) | all | already the base-tier target | none (existing entries) |
| `gemini-nano-banana-2.1` | image wire | image guide (`?generate-content=true`) drives `gemini-nano-banana-2.1` via `:generateContent` with `responseModalities: ['TEXT','IMAGE']` and `imageConfig.aspectRatio` — the shape `callGeminiImageOutGeneration` sends | none — the `gemini-image-out` catch-all applies; test pins it |
| | capability detection | "Image generation: Supported"; its id has no `-image` | **added** `/^gemini-nano-banana/` → image-generation |
| | model-name union | — | **added** to `GeminiFlashImageModelNames` |
| `openai/gpt-oss-120b` | input / output / limit | model page: "INPUT Text OUTPUT Text"; "MAX OUTPUT TOKENS 65,536" | **added** Groq `maxOutputTokens` 65536; `acceptsImageInput: false` already right; ai-assist sends no thinking params to Groq |
| `mistral-large-4` | structured output | Large 4 page: "Structured Outputs /v1/chat/completions" | none — the `openai-json-schema` catch-all applies; no max output stated, nothing recorded |

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

- `@anthropic:sonnet` (the Anthropic **base tier**) structured output now goes out as
  `output_config.format`, not a forced tool, and `structuredOutputSchemaKeywords` returns the
  JSON-outputs table for it.
- `@openai:flagship` (OpenAI **advanced tier**) no longer accepts thinking `'none'`: it is sent as
  `'low'` by default, or refused with `onUnsupported: 'fail'`.
- `@openai:nano` and `@openai:mini` now name the same model.
- Groq and Mistral callers that rely on the default model get a different model.

## 6. Testbed

The live canaries follow the new targets: the Anthropic tier canary adds a `@anthropic:haiku` row so
the forced-tool structured-output path is still exercised live (the base tier no longer uses it), the
Gemini tier canary fires one live image generation on the rotated image tier, and the structured-output
scenario probes forced tool on haiku and JSON outputs on the default. The wire probe now uses
`@anthropic:haiku` for tools (its stated "cheapest model" rule; the retirement exception expired) and
`@anthropic:sonnet` for JSON outputs (now the cheapest line that receives them).

## 7. Open questions (in `state.md`)

Q1 `@openai:nano` duplicates `@openai:mini` — retire it? · Q2 `gpt-image-2.6-sunburst` role mapping ·
Q3 Gemini 4 Argon needs a `thinkingLevel` wire before `@google-gemini:pro` can move · Q4
`gemini-embedding-2` is GA but changes vector space · Q5 Groq marks `max_tokens` deprecated.

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

No `c8 ignore` was added. No `code-reviewer` pass was run (per the brief; the orchestrator reviews).
