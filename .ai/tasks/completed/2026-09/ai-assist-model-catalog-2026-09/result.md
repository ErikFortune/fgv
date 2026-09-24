# Result — `ai-assist-model-catalog-2026-09`

**Shipped:** ai-assist's tier and image aliases now resolve to the current OpenAI, Gemini and xAI lines, each id taken from a fetched provider page — while Anthropic's are held, because its successors reject the forced tool call its structured output depends on.

**Not verified against the providers.** No live API call was made. This environment has no provider
credentials and none were sought. Every gate below is offline. The table in §1 is the list to check
a testbed run against.

---

## 0. Step zero — documentation reachability (2026-09-24)

| provider | host fetched | result |
|---|---|---|
| OpenAI | `platform.openai.com/docs/models` → 301 → `developers.openai.com/api/docs/models` | 200 |
| Anthropic | `docs.anthropic.com` | **blocked by the egress proxy** (`EGRESS_BLOCKED`) |
| Anthropic | `docs.claude.com/en/docs/about-claude/models/overview` → 302 → `platform.claude.com/docs/en/about-claude/models/overview` | 200 |
| Gemini | `ai.google.dev/gemini-api/docs/models` | 200 |
| xAI | `docs.x.ai/docs/models` | 200 |

`docs.anthropic.com` is still blocked, but it is no longer Anthropic's documentation host:
`docs.claude.com` redirects to `platform.claude.com`, and every Anthropic page below was read there.
All four providers were reachable, so the sweep went ahead.

**How pages were read.** `WebFetch` returns a summarising model's rendering, which is the thing the
brief forbids as a source of identifiers. So every page was **also** downloaded raw with `curl`
(HTML, or the `.md` rendering Anthropic and xAI publish) and each id below was quoted from that raw
text, never from a summary. One example of why that matters: the WebFetch summary of OpenAI's models
page listed `gpt-image-2.5-sunburst`, but that page shows only the display name "GPT-Image-2.5
Sunburst". The id is on the model's own page, which is where it was read.

---

## 1. Cited id table

Fetch date for every row: **2026-09-24**. "Documented" means the page shows the string verbatim in a
field labelled as the API identifier ("Model ID", "Model IDs", "Snapshots", "Model code", "Model
name", "Claude API ID", "API model name"). **Nothing in the catalog was inferred.** §1.5 lists the
ids that were seen and deliberately not adopted.

### 1.1 OpenAI

| id | role | source (label on page) | documented / inferred |
|---|---|---|---|
| `gpt-6-luna` | `@openai:mini` → base | <https://developers.openai.com/api/docs/models/gpt-6-luna> ("Snapshots: Use `gpt-6-luna` in your API requests"); also <https://developers.openai.com/api/docs/models> ("Model ID") | documented |
| `gpt-6-sol` | `@openai:flagship` → advanced | <https://developers.openai.com/api/docs/models/gpt-6-sol> ("Snapshots: Use `gpt-6-sol`…"); models page "Model ID" | documented |
| `gpt-6-astra` | `@openai:pro` → frontier | <https://developers.openai.com/api/docs/models/gpt-6-astra> ("Snapshots"); models page "Model ID" | documented |
| `gpt-image-2.5-sunburst` | `@openai:image` | <https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst> ("Model IDs: Use the undated model ID or pin the dated snapshot": `gpt-image-2.5-sunburst`, `gpt-image-2.5-sunburst-2026-09-08`) | documented |
| `gpt-image-2.5-flare` | union only | <https://developers.openai.com/api/docs/models/gpt-image-2.5-flare> ("Model IDs") | documented |
| `gpt-5.4-nano` | `@openai:nano` (unchanged) | <https://developers.openai.com/api/docs/models/gpt-5.4-nano> ("Snapshots") | documented |
| `text-embedding-3-small` | `@openai:embedding` (unchanged) | <https://developers.openai.com/api/docs/models/text-embedding-3-small> | documented |

Tier placement is from the pages' own positioning and prices: Luna "for cost-sensitive, high-volume
workloads", $0.10 / $0.50; Sol "to balance intelligence and cost", $2 / $10; Astra "our flagship
model for complex reasoning and coding", $10 / $50.

**The names moved rungs.** GPT-5.6 ran luna < terra < sol. GPT-6 runs luna < sol < astra and has no
terra. So `@openai:flagship` now names `gpt-6-sol`, and `@openai:pro` names `gpt-6-astra`. The alias
names are role names, and a registry comment says so, because OpenAI itself calls Astra "our flagship
model".

### 1.2 Google Gemini

| id | role | source | documented / inferred |
|---|---|---|---|
| `gemini-3.8-flash` | `@google-gemini:flash` → base | <https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash> ("Model code"); <https://ai.google.dev/gemini-api/docs/models> ("Endpoint" column) | documented |
| `gemini-3.5-flash-lite` | `@google-gemini:flash-lite` | <https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite> ("Model code") | documented |
| `gemini-3.1-pro-preview` | `@google-gemini:pro` (unchanged) | models page "Endpoint"; <https://ai.google.dev/gemini-api/docs/deprecations> | documented |
| `gemini-3.1-flash-image` | `@google-gemini:flash-image` (unchanged) | models page "Endpoint" (Nano Banana 2) | documented |
| `gemini-embedding-001` | `@google-gemini:embedding` (unchanged) | models page "Endpoint" | documented |

Selection: the models page and the deprecations page both say, verbatim, *"For any new projects, use
our latest models: 3.5 Flash-Lite or 3.8 Flash."* Neither page lists a Pro or a Flash Image newer than
3.1.

### 1.3 xAI

| id | role | source | documented / inferred |
|---|---|---|---|
| `grok-4.7` | `@xai-grok:flagship` → advanced | <https://docs.x.ai/developers/models/grok-4.7.md> ("Model name: `grok-4.7`"); <https://docs.x.ai/docs/models.md> (pricing table) | documented |
| `grok-4.6` | union + idPattern only | <https://docs.x.ai/developers/models/grok-4.6.md> ("Model name") | documented |
| `grok-4.3` | `@xai-grok:standard` → base (unchanged) | <https://docs.x.ai/developers/models/grok-4.3.md>; pricing table | documented |
| `grok-imagine-image-2.0` | `@xai-grok:imagine` | <https://docs.x.ai/developers/models/grok-imagine-image-2.0.md> ("Model name"); <https://docs.x.ai/developers/migration/imagine-image-quality-nov-2.md> | documented |

Selection: the models page says *"For everything else, including code, use Grok 4.7"*, and under
Images it names *"Grok Imagine Image 2.0"*. `grok-4.7` costs the same as `grok-4.5`, $2 / $6, so it
stays in the advanced band. Nothing newer sits in `grok-4.3`'s price band ($1.25 / $2.50), so base
is unchanged.

### 1.4 Anthropic — ids read, aliases deliberately NOT rotated

| id | status | source | documented / inferred |
|---|---|---|---|
| `claude-opus-5-5` | union only; **not** aliased | <https://platform.claude.com/docs/en/about-claude/models/overview> ("Claude API ID"); <https://platform.claude.com/docs/en/about-claude/model-deprecations.md> ("API model name", Active) | documented |
| `claude-fable-5-1` | union only; **not** aliased | same two pages | documented |
| `claude-opus-5` | `@anthropic:opus` (held) | deprecations page: Active, retirement not sooner than 2027-07-24 | documented |
| `claude-fable-5` | `@anthropic:fable` (held) | deprecations page: Active, not sooner than 2027-06-09 | documented |
| `claude-sonnet-5` | `@anthropic:sonnet` (unchanged) | overview "Claude API ID"; Active, not sooner than 2027-06-30 | documented |
| `claude-haiku-4-5-20251001` | `@anthropic:haiku` (unchanged) | overview; Active, **not sooner than 2026-10-15** | documented |

**Why the Anthropic aliases were held.** <https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5.md>,
under "Forced tool use is not supported": *"`tool_choice` set to `{"type": "any"}` or `{"type":
"tool", "name": "..."}` returns a 400 `invalid_request_error`"*. The same page says *"The first three
also apply on Claude Fable 5.1"*. ai-assist's only Anthropic structured-output mechanism is
`anthropic-tool-forced` (`structuredOutput.ts`), which sends `tool_choice: { type: 'tool', name }`.
Rotating `@anthropic:opus` would therefore turn every advanced-tier structured-output call into a
provider 400. That needs a new wire format, which is a feature rather than a rotation. It is filed as
a P2 in `docs/TECH_DEBT.md`.

### 1.5 Seen and deliberately not adopted

| string | where | why not |
|---|---|---|
| `gemini-3.8-pro` | code samples on <https://ai.google.dev/gemini-api/docs/thinking> (Interactions API) | Missing from the models page, the deprecations page and the thinking-level table. It appears only inside examples. **Flagged, not adopted.** |
| `gpt-5.6-cyber`, `gpt-daybreak-*`, `gpt-realtime-*`, `gpt-live-1`, `gemini-3.8-live*`, `*-tts`, `gemini-3.7-flash`, `gemini-3.6-flash`, `grok-4.20-*`, `grok-build-0.1` | the models pages | Real ids, but none fills an ai-assist role. |
| `gemini-embedding-2-preview` | Gemini models page | A preview id, and the `gemini-embedding-001` alias is not deprecated. Swapping it would also change vector dimensionality under existing indexes. |

---

## 2. `idPattern` rules added (`DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider`)

| rule | provider | capabilities | justification |
|---|---|---|---|
| `/^gpt-6/` | openai | chat, tools, vision, thinking | Each GPT-6 model page lists "Input: Text, Image", "Function calling: Supported" and "Reasoning token support". No rule matched `gpt-6` at all, so OpenAI's list endpoint (which carries no native capabilities) would have returned these ids with **no** capabilities. |
| `/^grok-4\.7/` | xai-grok | chat, tools, thinking (+ vision via `/^grok-4/`) | grok-4.7 page: "Function calling: Yes", "Reasoning: Yes", "Modalities: text, image → text". Without the rule, only `/^grok-4/` matched, so thinking was lost. |
| `/^grok-4\.6/` | xai-grok | same | grok-4.6 page is identical apart from the name. |

No change was needed for Gemini (`/^gemini-3/` covers 3.8 and 3.5 Flash-Lite; both pages say
"Thinking: Supported"), Anthropic (`/^claude-opus-/` and `/^claude-fable-/` cover 5-5 and 5-1), the
image ids (`/^gpt-image/`, and xAI `/-image/`), or embeddings.

**Load-bearing check.** Removing `/^gpt-6/` and `/^grok-4\.7/` turns the two new `listModels.test.ts`
cases red. Restoring the rules turns them green.

**Observed and left alone.** `/^gemini-3/` also matches `gemini-3.8-live`, `gemini-3.8-flash-tts`,
`gemini-3.5-transcribe` and similar ids, so those are classified as chat + thinking. That
over-match already existed (`gemini-3.1-flash-tts-preview` had it). Detection accumulates across
rules, so a sibling rule cannot fix it, and it is not a rotation edit.

---

## 3. Capability tables — every one checked

| table | changed? | evidence |
|---|---|---|
| `responsesOnlyModelPrefixes` (openai) | **no** — stays `['gpt-5.5-pro']` | Each GPT-6 model page lists both `v1/chat/completions` and `v1/responses` as supported endpoints. Read from the page markup: unsupported endpoints carry `text-gray-400` and a strike icon. The Sol and Luna pages add *"Chat Completions supports function calling only with reasoning_effort set to none"*. That does not bite here, because every tool-bearing OpenAI call already routes to `/responses` (`completionClient.ts` `usesResponsesApi`, `streamingClient.ts` `hasTools \|\| isResponsesOnlyModel`). A new test pins that no gpt-6 tier target is Responses-only. |
| `usesMaxCompletionTokensField` | no | Keyed on provider id, not model id. Nothing model-specific to rotate. |
| `supportsStreamUsageOption` | no | Provider-id gate (`'openai'`). |
| `supportsCacheUsageReporting` | no | Provider-id gate (`'openai'`, `'xai-grok'`). Every GPT-6 and grok-4.7 page lists cached-input pricing. |
| `supportsPromptCacheBreakpoints` | no | Provider-id gate. |
| `supportsPromptCacheRouting` | no | Provider-id gate. |
| `adaptiveThinkingModelPrefixes` (anthropic) | **no** (comment added) | The dash-bounded matcher already covers `claude-opus-5-5` and `claude-fable-5-1` through `claude-opus-5` and `claude-fable-5`. Both are "Adaptive (always on)" per the overview. Our `'none'` effort omits the `thinking` field, which the Opus 5.5 page says is accepted ("Omit the `thinking` field…"). |
| `structuredOutput` (anthropic) | no — **and the reason the aliases were held** | See §1.4. |
| `structuredOutput` (openai, gemini, xai) | no | Catch-all entries. Every GPT-6, Gemini 3.8 / 3.5-lite and grok-4.7 page lists structured outputs as supported. |
| `imageGeneration` (openai) | no | `gpt-image-2.5-*` matches the existing `gpt-image-` entry. The image-generation guide (<https://developers.openai.com/api/docs/guides/image-generation>) lists the recommended sizes `1024x1024`, `1536x1024` and `1024x1536` plus `auto`, and qualities `low`, `medium`, `high`, `xhigh`, `max`, `auto`. The declared sets are subsets of these, so they stay valid. `xhigh` and `max` are not reachable: that would mean widening the public `GptImageQuality` type (TECH_DEBT P3). |
| `imageGeneration` (xai) | **yes** — new `grok-imagine-image-2.0` entry | <https://docs.x.ai/developers/model-capabilities/images/generation.md> § Quality: *"Allowed values are `low`, `medium`, and `auto` … The parameter is only supported for `grok-imagine-image-2.0`."* The new entry declares `supportsQualityParam: true` and `acceptedQualities: ['low','medium','auto']`. It is a longer-prefix sibling, so `grok-imagine-image` and `-quality` keep `supportsQualityParam: false`. **Both xAI image builders previously never sent `quality` at all**, so the flag alone would have been a false claim. `callXaiImageGeneration` and `callXaiImagesEdits` now send it, gated on the capability. |
| `imageGeneration` (gemini) | no | Image alias unchanged. |
| `embedding` (all) | no | Embedding aliases unchanged. `resolveEmbeddingCapability` matches concrete ids, and none moved. |
| `serverToolsExclusiveWithClientTools` (gemini) | no | Unrelated to model ids. |

## 4. Typed `*ModelNames` unions

| union | added | removed | why |
|---|---|---|---|
| `OpenAiThinkingModelNames` | `gpt-6-astra`, `gpt-6-sol`, `gpt-6-luna` | `o3-deep-research`, `o4-mini-deep-research` | Deprecations page, *"Legacy GPT model snapshots (July 2026 shutdown)"*: both *"shut down on July 23, 2026"*. |
| `GeminiThinkingModelNames` | `gemini-3.8-flash`, `gemini-3.5-flash-lite` | — | `gemini-3.5-flash` and `gemini-3.1-flash-lite` are still served and stay. |
| `XAiThinkingModelNames` | `grok-4.6`, `grok-4.7` | — | |
| `AnthropicThinkingModelNames` | `claude-opus-5-5`, `claude-fable-5-1` | — | Reachable via `modelOverride`. |
| `GptImageModelNames` | `gpt-image-2.5-sunburst`, `gpt-image-2.5-flare` | — | `gpt-image-1` and `gpt-image-1.5` are deprecated but not yet shut down (see §5). |
| `GrokImagineModelNames` | `grok-imagine-image-2.0` | — | `grok-imagine-image-quality` keeps resolving after 2026-11-02 (it redirects). |
| `GeminiFlashImageModelNames` | — | — | Unchanged. |

**Not changed and flagged.** `OpenAiThinkingModelNames` keeps `gpt-5.1`, and a registry comment
says *"gpt-5.1 deliberately absent — retired March 2026"*. The deprecations page fetched today does
not list a `gpt-5.1` shutdown (only `gpt-5.1-chat-latest` and the `gpt-5.1-codex*` ids), so the
retirement claim could not be confirmed and the id was left alone.

**The `models?`-filter redesign case gets stronger.** This rotation had to *narrow* a published
union (the deep-research removal) purely because the provider retired ids. Every such narrowing is
a compile break for any consumer naming the removed ids in a filter. Allowing aliases inside the
`models?` arrays would take the unions off the rotation path. That redesign is still out of scope
here.

## 5. Deprecation and shutdown dates the docs stated (for the next rotation)

| id | date | source |
|---|---|---|
| `grok-imagine-image-quality` | retired **2026-11-02**; afterwards served by `grok-imagine-image-2.0` at `quality: "low"` | xAI migration guide |
| `claude-haiku-4-5-20251001` (`@anthropic:haiku`) | retirement not sooner than **2026-10-15** | Anthropic deprecations |
| `o4-mini`, `gpt-image-1` | shutdown **2026-10-23** | OpenAI deprecations |
| `gpt-image-1.5` | shutdown **2026-12-01** (replacement `gpt-image-2`) | OpenAI deprecations |
| `gpt-5-2025-08-07`, `gpt-5-pro-2025-10-06`, `o3-2025-04-16` | shutdown **2026-12-11** | OpenAI deprecations |
| `gemini-3.1-flash-lite` | shutdown **2027-05-07**, replacement `gemini-3.5-flash-lite` | Gemini deprecations |
| `gemini-2.5-flash-image` | shutdown **2026-10-02** | Gemini deprecations |
| `gemini-2.5-flash` / `-lite` / `-pro` | **no shutdown** — *"These models are not deprecated and will continue to be served until further notice"*, access limited to existing users | Gemini deprecations |
| `claude-opus-5` / `claude-fable-5` / `claude-sonnet-5` | not sooner than 2027-07-24 / 2027-06-09 / 2027-06-30 | Anthropic deprecations |
| `gpt-5.6-luna`/`-terra`/`-sol`, `gpt-5.4-nano`, `grok-4.5`, `grok-4.3`, `gemini-3.5-flash` | none announced as of 2026-09-24 | respective pages |

**One recorded date has since been withdrawn.** The registry recorded the 2.5 Gemini line as shut
down on 2026-10-16. Google now lists it as not deprecated. The registry comments keep that history
and note the withdrawal.

## 6. Risks for the testbed run (not verified here)

Each of these is documented behaviour that no offline gate can observe:

1. **`thinking: { effort: 'none' }` on a rotated tier.** `gpt-6-astra` (frontier) lists effort
   `low`..`max`, with no `none`. `grok-4.7` (advanced) lists `low`..`xhigh`, the same as the `grok-4.5`
   it replaces, so this one is not new. `gemini-3.8-flash` (base) lists thinking levels
   low/medium/high and says *"minimal is not supported and returns an error"*. How it handles our
   `thinkingBudget: 0` is undocumented. Google's Gemini 3 guide confirms `thinking_budget` is *"still
   supported for backward compatibility"*, so non-zero budgets are fine. Filed as TECH_DEBT P3.
2. **Opus 5.5 / Fable 5.1 via `modelOverride` with `structuredOutput`** gets a provider 400 (§1.4).
3. **`grok-imagine-image-2.0` + `quality`** is new on the wire. It has not been sent live.

**Suggested testbed checks.** The base, advanced and frontier completions on OpenAI; base and advanced
on xAI; base on Gemini with and without thinking; `@google-gemini:flash-lite` via `modelOverride`;
image generation on `@openai:image` and `@xai-grok:imagine` (and the latter with `quality: 'medium'`).
Each run should log the resolved id listed in §1.

## 7. Gates (all run 2026-09-24, on the final tree)

| gate | result |
|---|---|
| `rushx build` (ts-extras) | pass, zero warnings once `etc/ts-extras.api.md` was committed (the union edits change the API report) |
| `rushx lint` / `rushx fixlint` (ts-extras, testbed) | clean |
| `rushx test` (ts-extras) | pass, 100% statements / branches / functions / lines |
| repo-wide `install-run-rush.js test` | **35/35 pass**, after the testbed fix below. The first run failed on a missing `ts-extras/lib`, a build collision with a reviewer agent building the same package at the same time. The second run failed in `samples/testbed` — exactly the casualty class the brief predicted. |
| `rush change --verify --target-branch origin/release` | pass (`@fgv/ts-extras` change file; `samples/testbed` is unpublished) |
| `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`, `verify-bundler-resolution`, `verify-tarball-exports` | pass. The last two first needed their autoinstallers (`rush-bundler-check`, `rush-pack-check`) installed in this container. |
| `code-reviewer` (layer 1) | no P1. **P2** `gpt-image-2.5-flare` in `GptImageModelNames` "unverified": **dispositioned, no change**. It is documented under "Model IDs" on <https://developers.openai.com/api/docs/models/gpt-image-2.5-flare> (§1.1); the reviewer's brief named only the aliased id. **P3** ambiguous `@openai:image` comment: fixed. |

**Outside the declared package surface.** The brief scoped the stream to `libraries/ts-extras`.
The repo-wide test showed `samples/testbed` pinning the old concrete ids. That covered the
model-tier canary tests, the image-scenario capability test, and the canary's user-visible
description strings (`src/scenarios/modelTiers/index.ts`). Those pins were updated. No testbed logic
changed. A PR that leaves the repo-wide suite red is not mergeable, and the repo's rule is to fix
consumers rather than leave them broken.
