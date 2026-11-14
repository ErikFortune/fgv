# Design: ai-assist-thinking-config

**Stream:** ai-assist-thinking-config  
**Phase:** A — research and design  
**Date:** 2026-05-11  
**Status:** Draft — awaiting orchestrator/user signoff

---

## Table of Contents

1. [Provider thinking-surface inventory](#1-provider-thinking-surface-inventory)
2. [Current implementation gap analysis](#2-current-implementation-gap-analysis)
3. [IThinkingConfig recommendation](#3-ithinkingconfig-recommendation)
4. [Sampling-param interaction policy](#4-sampling-param-interaction-policy)
5. [Model-capability signaling](#5-model-capability-signaling)
6. [Streaming integration](#6-streaming-integration)
7. [Non-streaming response shape](#7-non-streaming-response-shape)
8. [Migration impact](#8-migration-impact)
9. [Open questions for signoff](#9-open-questions-for-signoff)

---

## 1. Provider thinking-surface inventory

### 1.1 Anthropic Messages API

**Source:** [Building with extended thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking), [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking), [Effort parameter](https://platform.claude.com/docs/en/build-with-claude/effort)

**Model relationship:** Thinking is opt-in per-request on the same model family. There is no separate "Anthropic thinking model" — you use the standard claude-sonnet-4-6, claude-opus-4-7, etc. with a thinking config flag.

**Two modes (one current, one deprecated):**

*Current — Adaptive thinking (recommended for all 4.6+ models):*
```json
{
  "model": "claude-opus-4-7",
  "thinking": { "type": "adaptive" },
  "output_config": { "effort": "medium" },
  "max_tokens": 16000,
  "messages": [...]
}
```

*Deprecated — Extended thinking (still works on 4.5/4.6; **rejected** on 4.7+):*
```json
{
  "model": "claude-opus-4-6",
  "thinking": { "type": "enabled", "budget_tokens": 8192 },
  "temperature": 1,
  "max_tokens": 16000,
  "messages": [...]
}
```

**Effort values (adaptive thinking):** `"low"` | `"medium"` | `"high"` | `"max"` (max: Opus 4.6 only; not available on 4.7+)

**Model availability:**
- Claude Sonnet 4.5: extended thinking only (budget_tokens still supported, not deprecated yet)
- Claude Sonnet 4.6, Opus 4.6: both modes; budget_tokens deprecated, effort recommended
- Claude Opus 4.7+: adaptive only; `type: "enabled"` rejected; `temperature` parameter rejected entirely

**Interaction with `max_tokens`:** thinking tokens count against `max_tokens`. Anthropic recommends setting `max_tokens` higher (≥ 16000) when thinking is enabled.

**Temperature semantics:**
- Extended thinking (type: "enabled"): temperature must be exactly `1`; other values rejected
- Adaptive thinking on Opus 4.7+: temperature parameter rejected entirely (400 error)
- Regular calls (no thinking): temperature 0–1 as normal

**Response shape (non-streaming):**
```json
{
  "content": [
    { "type": "thinking", "thinking": "<reasoning text>" },
    { "type": "text", "text": "<answer>" }
  ],
  "stop_reason": "end_turn"
}
```
When thinking is skipped (adaptive mode, simple query), no thinking block appears.

**Response shape (streaming):** Thinking blocks arrive as `content_block_start` events with `content_block.type === "thinking"`, followed by `content_block_delta` events with `delta.type === "thinking_delta"`. Text blocks arrive with `delta.type === "text_delta"` as today.

---

### 1.2 OpenAI Responses API and o-series

**Source:** [Reasoning models guide](https://platform.openai.com/docs/guides/reasoning), [OpenAI Models](https://platform.openai.com/docs/models), [Chat Completions API reference](https://platform.openai.com/docs/api-reference/chat/create)

**Model relationship:** Two distinct categories:
- **o-series** (o3, o4-mini, o3-deep-research, o4-mini-deep-research): reasoning-only — always reasons, no way to disable
- **GPT-5 family** (gpt-5, gpt-5.1, gpt-5.2, gpt-5.5): hybrid — reasoning is an optional layer enabled via `reasoning_effort`; setting effort to `"none"` disables it
- **gpt-5-pro**: always reasons at high effort (reasoning_effort is fixed)

**Wire format — Responses API (recommended for reasoning models):**
```json
{
  "model": "gpt-5.1",
  "reasoning": { "effort": "high" },
  "input": [...]
}
```

**Wire format — Chat Completions (also works, but Responses API preferred):**
```json
{
  "model": "gpt-5.1",
  "reasoning_effort": "high",
  "messages": [...]
}
```

**Effort values:** `"none"` | `"minimal"` | `"low"` | `"medium"` | `"high"` | `"xhigh"`
- `"none"`: disables reasoning (gpt-5.1+ only)
- `"minimal"`: fastest (introduced for gpt-5+ family)
- `"xhigh"`: highest (gpt-5.1-codex-max and some gpt-5.4+ only)
- Default when omitted varies by model; o-series always reasons regardless

**Interaction with sampling parameters:**
- `temperature`, `top_p`, `presence_penalty`, `frequency_penalty` are **rejected** when reasoning is active (effort ≠ "none")
- These params ARE allowed when `reasoning_effort: "none"` on gpt-5.1+
- o-series models: sampling params always rejected (reasoning is always active)

**Response shape:** Reasoning content does not appear in the output by default. The text response is in `output[].content[].text` as today. Reasoning items can be requested via `include: ["reasoning.encrypted_content"]` but require special handling.

**Streaming:** Standard SSE streaming; reasoning content does not stream by default. The normal `response.output_text.delta` events carry only the final answer text.

---

### 1.3 Google Gemini 2.5 with thinking

**Source:** [Gemini thinking API](https://ai.google.dev/gemini-api/docs/thinking), [Vertex AI thinking](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking), [Gemini models](https://ai.google.dev/gemini-api/docs/models)

**Model relationship:** Thinking is opt-in per-request for most models. Gemini 2.5 Pro is an exception — thinking cannot be disabled (it always reasons).

**Wire format:**
```json
{
  "contents": [...],
  "generationConfig": {
    "temperature": 0.7,
    "thinkingConfig": {
      "thinkingBudget": 4096,
      "includeThoughts": false
    }
  }
}
```

**thinkingBudget values:**
- `0`: disable thinking (only for Flash and Flash-Lite; error on Pro)
- positive integer: specific token cap (soft upper limit)
- `-1`: dynamic thinking — model decides based on query complexity
- omitted: auto (default ~8192 for Flash; Pro always uses dynamic)

**includeThoughts:** boolean; when `true`, thought summary parts appear in the response. When `false` or absent, no thought content in response. Thoughts are summarized (not raw) — billing applies to raw internal tokens.

**Model availability:**
- Gemini 2.5 Pro: always thinks; cannot set thinkingBudget to 0
- Gemini 2.5 Flash: thinking on by default (auto budget); can be disabled with 0
- Gemini 2.5 Flash-Lite: can disable with 0
- Gemini 3 (future): uses `thinkingLevel` param; thinkingBudget accepted for backward compat but may produce unexpected performance

**Interaction with sampling parameters:** Temperature is **not rejected** — it lives in `generationConfig` alongside `thinkingConfig`. This is the key differentiator from Anthropic and OpenAI.

**Response shape (with includeThoughts: true):**
```json
{
  "candidates": [{
    "content": {
      "parts": [
        { "text": "<thought summary>", "thought": true },
        { "text": "<final answer>", "thought": false }
      ]
    }
  }]
}
```
Without `includeThoughts: true`, only the final answer parts appear — no `thought: true` parts.

**Streaming:** Same structure; parts with `thought: true` arrive before the answer parts when thoughts are included.

---

### 1.4 xAI Grok reasoning models

**Source:** [xAI Reasoning docs](https://docs.x.ai/developers/model-capabilities/text/reasoning), [Grok 3 Mini](https://docs.x.ai/developers/models/grok-3-mini), [xAI Models](https://docs.x.ai/developers/models)

**Model relationship:** More complex — reasoning capability varies by specific model variant:
- `grok-3-mini`: supports `reasoning_effort` parameter
- `grok-4.3`: supports `reasoning_effort` parameter (current recommended)
- `grok-4`: always reasons; `reasoning_effort` parameter **rejected with an error** (reasoning is fixed, not configurable)
- `grok-4-1-fast`, `grok-4-1-fast-reasoning`: being retired May 15, 2026 (out of scope for this stream, noted for orchestrator)

**Wire format (OpenAI-compatible Chat Completions):**
```json
{
  "model": "grok-4.3",
  "messages": [...],
  "reasoning_effort": "medium"
}
```

**Effort values:** `"none"` | `"low"` | `"medium"` | `"high"`
- Default on grok-4.3: `"low"`
- `"none"`: disables reasoning
- Not all models support all values

**Interaction with sampling parameters:** Partially unclear from available docs. `presence_penalty`, `frequency_penalty`, and some other params are documented as unsupported for certain Grok variants with reasoning. Whether `temperature` is specifically rejected when reasoning is active is **not conclusively documented** — flagged as an open question (see §9).

**Response shape:** Reasoning content is not returned in the Chat Completions response. The `choices[0].message.content` is the final answer only.

**Streaming:** Standard Chat Completions SSE format; reasoning doesn't surface in stream.

---

## 2. Current implementation gap analysis

All analysis references the `libraries/ts-extras/src/packlets/ai-assist/` packlet.

### 2.1 Where temperature is sent unconditionally

| File | Function | Notes |
|------|----------|-------|
| `apiClient.ts:488` | `callOpenAiCompletion` | `body = { ..., temperature }` — always included |
| `apiClient.ts:554` | `callOpenAiResponsesCompletion` | `body = { ..., temperature }` — always included |
| `apiClient.ts:629` | `callAnthropicCompletion` | `body = { ..., temperature }` — always included |
| `apiClient.ts:705` | `callGeminiCompletion` | `generationConfig: { temperature }` — always included |
| `streamingAdapters/openaiChat.ts:161` | `callOpenAiChatStream` | `body = { ..., temperature }` — always included |
| `streamingAdapters/openaiResponses.ts:174` | `callOpenAiResponsesStream` | `body = { ..., temperature }` — always included |
| `streamingAdapters/anthropic.ts:230` | `callAnthropicStream` | `body = { ..., temperature }` — always included |
| `streamingAdapters/gemini.ts:169` | `callGeminiStream` | `generationConfig: { temperature }` — always included |

`IProviderCompletionParams.temperature` defaults to `0.7`; `IProviderCompletionStreamParams.temperature` also defaults to `0.7`. Both are optional at the type level but always forwarded to every adapter.

### 2.2 Where temperature is optional (already)

`IProviderCompletionParams.temperature?: number` and `IProviderCompletionStreamParams.temperature?: number` are typed as optional, but the defaults mean they're always non-undefined by the time the adapter code runs.

### 2.3 Existing thinking/reasoning handling

**None.** No `thinking`, `reasoning`, `reasoning_effort`, `budget_tokens`, `thinkingConfig`, or `effort` appears anywhere in the packlet. Zero existing thinking support.

### 2.4 Provider-specific gaps

**Anthropic (most affected):**
- Non-streaming, no tools path (`callAnthropicCompletion` + `anthropicResponse` validator): The validator `Validators.arrayOf(anthropicContentBlock)` requires every content block to have a `text: string` field. Thinking blocks have `type: "thinking"` and a `thinking` field, no `text`. This validator **fails** when thinking content blocks are present. The tools path (`extractAnthropicText`) already handles mixed block types correctly and would work.
- Streaming path: Current adapter correctly filters to `text_delta` events only; thinking blocks are silently discarded. **No change needed for backward compat**, but thinking content is lost.
- Request body: Needs `thinking: { type: "adaptive" }` and `output_config: { effort }` fields; temperature must be dropped.

**OpenAI Chat Completions path (xAI, OpenAI, Groq, Mistral):**
- Request body: Needs `reasoning_effort` field (top-level) when thinking requested; temperature must be dropped.
- Response/streaming: No change needed; reasoning content doesn't surface.

**OpenAI Responses API path (when tools active):**
- Request body: Needs `reasoning: { effort }` nested field; temperature must be dropped.
- Response/streaming: No change needed.

**Gemini:**
- Request body: Needs `generationConfig.thinkingConfig.thinkingBudget` when thinking requested; temperature can stay.
- Non-streaming response: If `includeThoughts: false` (recommended), no change needed. If thoughts were included, `candidate.content.parts[0].text` would return thought text, not answer — broken. Decision: don't send `includeThoughts: true`.
- Streaming: Same; without `includeThoughts: true`, no thought parts.

**Summary severity ranking:**
1. Anthropic non-streaming (high impact): Validator breaks; needs fix
2. All four providers (high impact): Temperature suppression missing; causes 400s
3. All four providers (medium): No way to request thinking at all

---

## 3. IThinkingConfig recommendation

### 3.1 Three approaches considered

**Approach A — Common abstraction, registry-driven translation:**

```typescript
interface IThinkingConfig {
  readonly enabled: true;
  readonly effort?: 'low' | 'medium' | 'high';
}
```

A single shape; adapters translate `effort` to provider-specific wire fields. Provider-specific knobs (Anthropic's "max", OpenAI's "xhigh") are not exposed.

*Pros:* Simple caller API; works for most use cases.  
*Cons:* Loses provider-specific nuance; "max" and "xhigh" unavailable; Gemini uses token counts internally and the abstraction is lossy; no escape hatch.

---

**Approach B — Discriminated union per provider:**

```typescript
type IThinkingConfig =
  | { readonly provider: 'anthropic'; readonly effort?: 'low' | 'medium' | 'high' | 'max' }
  | { readonly provider: 'openai'; readonly effort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' }
  | { readonly provider: 'google-gemini'; readonly thinkingBudget?: number }
  | { readonly provider: 'xai-grok'; readonly reasoningEffort?: 'none' | 'low' | 'medium' | 'high' };
```

*Pros:* Full type-level fidelity; callers control every knob; no translation.  
*Cons:* Caller must know which provider they're targeting; forces provider coupling into application code; migration cost for existing callers is high; makes cross-provider code impossible without runtime branching.

---

**Approach C — Capability-driven optional (recommended):**

```typescript
interface IThinkingConfig {
  readonly effort?: 'low' | 'medium' | 'high' | 'max';
  readonly tokenBudget?: number;
}
```

With:
- `effort`: abstract effort level, translated to provider wire format by adapter
- `tokenBudget`: explicit token count (used by Gemini's `thinkingBudget`; ignored by other providers; future Anthropic support could use this)
- `enabled` is implicit: presence of `IThinkingConfig` in the request params means "enable thinking"

Registry declares per-descriptor or per-model `thinkingMode: 'optional' | 'required' | 'unsupported'` (see §5).

*Pros:* Simple caller API; cross-provider code works with one config shape; most capability-relevant knobs preserved; additive (no breaking change to callers who don't opt in); `tokenBudget` is an escape hatch for Gemini power users; `max` preserved for Anthropic.  
*Cons:* "xhigh" (OpenAI) and specific Gemini budgets require tokenBudget; not all cross-provider mappings are semantically equivalent.

### 3.2 Effort mapping to wire format

| Caller effort | Anthropic wire | OpenAI wire | Gemini wire | xAI wire |
|--------------|---------------|-------------|-------------|----------|
| `"low"` | `output_config.effort: "low"` | `reasoning_effort: "low"` | `thinkingBudget: 1024` | `reasoning_effort: "low"` |
| `"medium"` | `output_config.effort: "medium"` | `reasoning_effort: "medium"` | `thinkingBudget: 4096` | `reasoning_effort: "medium"` |
| `"high"` | `output_config.effort: "high"` | `reasoning_effort: "high"` | `thinkingBudget: 8192` | `reasoning_effort: "high"` |
| `"max"` | `output_config.effort: "max"` | `reasoning_effort: "xhigh"` | `thinkingBudget: -1` (dynamic) | `reasoning_effort: "high"` (capped) |
| omitted | `"medium"` (default) | `"medium"` (default) | `-1` (dynamic) | `"low"` (provider default) |
| `tokenBudget: N` | ignored (effort takes priority) | ignored | `thinkingBudget: N` (overrides effort) | ignored |

When `tokenBudget` is present and `effort` is absent for Gemini, use `tokenBudget` directly. When both are present, `tokenBudget` wins for Gemini (it's the escape hatch). For all other providers, `effort` is used and `tokenBudget` is silently ignored.

### 3.3 Placement on request params

`IThinkingConfig` is added as an optional field on both existing request params interfaces:

```typescript
// apiClient.ts
export interface IProviderCompletionParams {
  // ... existing fields unchanged ...
  readonly thinking?: IThinkingConfig;
}

// streamingAdapters/common.ts
export interface IProviderCompletionStreamParams {
  // ... existing fields unchanged ...
  readonly thinking?: IThinkingConfig;
}
```

Absence of `thinking` (or `thinking === undefined`) means no thinking mode — all existing callers are unaffected.

### 3.4 Recommendation summary

**Recommend Option C.**

The three primary drivers:
1. **Cross-provider code**: The `ts-app-shell/useAiAssist.ts` hook selects providers from settings; thinking config shouldn't force app code to branch by provider.
2. **Additive**: Existing callers who don't pass `thinking` get exactly today's behavior. Zero migration cost for non-adopters.
3. **Active-surface freedom**: `ai-assist` is on the active-surface list; we don't need perfect backward compat within the packlet itself — but the consumer-facing interface (`IProviderCompletionParams`) should be additive where possible.

Option B's discriminated union would be the right choice if fidelity to individual provider knobs was the primary goal, but the cost of pushing provider awareness into application code is too high given the packlet's design as a provider-agnostic interface.

---

## 4. Sampling-param interaction policy

### 4.1 Decision

**Policy: Auto-suppress temperature (and top_p where applicable) per provider when thinking is active. Do not expose override.**

Reasoning:
- Anthropic Opus 4.7+ will return a 400 if temperature is present with adaptive thinking — there is no "caller override" that's meaningful.
- OpenAI reasoning models reject temperature — same constraint.
- xAI likely follows the same pattern (see §9, open question).
- Gemini is the exception: temperature is accepted alongside thinkingConfig. We should preserve it.

Specific rules by provider:

| Provider | When thinking enabled | temperature | top_p |
|----------|----------------------|-------------|-------|
| Anthropic | Always | **Dropped** | **Dropped** (not currently sent) |
| OpenAI (Chat + Responses) | When `reasoning_effort` sent | **Dropped** | **Dropped** |
| Gemini | Any | **Kept** | **Kept** (if applicable) |
| xAI | When `reasoning_effort` sent | **Dropped** (pending confirmation — see §9) | Not applicable |

### 4.2 Should callers override?

No. The providers that reject temperature do so at the protocol level with a hard error — there is no "provider-specific knob" that lets an individual call opt back in. Exposing an override would only succeed for Gemini (where it's the default anyway) and fail with 400 for Anthropic/OpenAI. An override field would be misleading.

### 4.3 Request type shape

`temperature` stays as a top-level field on `IProviderCompletionParams` / `IProviderCompletionStreamParams`. It is **conditionally excluded** from the wire body by the adapter, not at the type level. The type remains unchanged; the adapter behavior changes.

This avoids a breaking structural change. The type is already `temperature?: number` (optional), so there's no API contract that "temperature is always sent".

**We do NOT restructure sampling params into a sub-object.** The type change would be a breaking change for all existing callers and isn't worth the cost given that the auto-suppression behavior is the right long-term policy anyway.

### 4.4 Existing callers with explicit temperature

Callers who currently pass `temperature: 0.5` and now select a thinking model will have temperature silently dropped. The correct framing: they opted into thinking mode; thinking mode doesn't accept temperature. This is consistent with how the `acceptsImageInput` gate works — a pre-flight constraint.

If callers want an explicit warning, an advisory `logger.warn("temperature suppressed for thinking model")` can be emitted from the adapter. This is cheap to add and worth doing for observability.

---

## 5. Model-capability signaling

### 5.1 Extending `AiModelCapability`

Add `'thinking'` to the capability vocabulary:

```typescript
export type AiModelCapability = 'chat' | 'tools' | 'vision' | 'image-generation' | 'thinking';
```

This lets callers discover thinking-capable models via `callProviderListModels` with `capability: 'thinking'`. The capability config rules in `DEFAULT_MODEL_CAPABILITY_CONFIG` would be extended to tag known thinking models.

Example additions to `DEFAULT_MODEL_CAPABILITY_CONFIG`:
```typescript
anthropic: [
  { idPattern: /^claude-opus-4/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  { idPattern: /^claude-sonnet-4\.6/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  { idPattern: /^claude-sonnet-4\.5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  { idPattern: /^claude-/, capabilities: ['chat', 'tools', 'vision'] }
],
openai: [
  { idPattern: /^o[34]/, capabilities: ['chat', 'tools', 'thinking'] },
  { idPattern: /^gpt-5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  // ... existing patterns ...
],
'google-gemini': [
  { idPattern: /^gemini-2\.5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  // ... existing patterns ...
],
'xai-grok': [
  { idPattern: /^grok-3-mini/, capabilities: ['chat', 'tools', 'thinking'] },
  { idPattern: /^grok-4\.3/, capabilities: ['chat', 'tools', 'thinking'] },
  { idPattern: /^grok-4$/, capabilities: ['chat', 'tools', 'thinking'] },
  // ... existing patterns ...
]
```

### 5.2 Provider descriptor: thinkingMode

Add `thinkingMode` to `IAiProviderDescriptor`:

```typescript
export type AiThinkingMode = 'optional' | 'required' | 'unsupported';

export interface IAiProviderDescriptor {
  // ... existing fields ...
  /**
   * Whether this provider supports thinking/reasoning mode.
   * - 'optional': thinking is opt-in per-request (Anthropic, OpenAI gpt-5.x, Gemini Flash, xAI)
   * - 'required': the provider/model always thinks (e.g. future model-specific descriptors)
   * - 'unsupported': provider does not support thinking (Groq, Mistral, copy-paste)
   */
  readonly thinkingMode: AiThinkingMode;
}
```

**Provider descriptor values:**

| Provider | `thinkingMode` | Notes |
|----------|---------------|-------|
| `anthropic` | `'optional'` | All Claude 4.x models support thinking; opt-in per request |
| `google-gemini` | `'optional'` | Flash: opt-in; Pro: always-on but accepts thinkingBudget param |
| `openai` | `'optional'` | GPT-5.x: opt-in; o-series: always-on; both accept reasoning.effort |
| `xai-grok` | `'optional'` | grok-4.3: opt-in; grok-4: always reasons (but param rejected) |
| `groq` | `'unsupported'` | No thinking capability |
| `mistral` | `'unsupported'` | No thinking capability |
| `ollama` | `'unsupported'` | Model-dependent but no standardized thinking API |
| `openai-compat` | `'unsupported'` | Self-hosted; no guarantee of thinking support |
| `copy-paste` | `'unsupported'` | No API |

### 5.3 ModelSpecKey extension

Add `'thinking'` to `ModelSpecKey`:

```typescript
export type ModelSpecKey = 'base' | 'tools' | 'image' | 'thinking';
export const allModelSpecKeys: ReadonlyArray<ModelSpecKey> = ['base', 'tools', 'image', 'thinking'];
```

This allows providers to specify a different model for thinking requests. Primary use case is xAI, which has per-variant reasoning capability:

```typescript
// In xai-grok descriptor:
defaultModel: {
  base: 'grok-4.3',
  tools: 'grok-4.3',
  thinking: 'grok-4.3',  // same model, but thinking key allows future override
  image: 'grok-2-image-1212'
}
```

The `callProviderCompletion` and `callProviderCompletionStream` dispatchers would resolve with context `'thinking'` when `params.thinking` is set.

### 5.4 Default model selector

No new `defaultModel.thinking` field is needed at the settings level beyond what `ModelSpecKey` provides. The existing `ModelSpec` map already supports this:

```typescript
// In IAiAssistProviderConfig
readonly model?: ModelSpec;  // unchanged; callers can pass { base: '...', thinking: '...' }
```

A future UI could filter `listModels` by `capability: 'thinking'` to populate a thinking-model selector.

---

## 6. Streaming integration

### 6.1 How thinking content differs per provider

| Provider | Thinking content in stream | Currently handled |
|----------|--------------------------|-------------------|
| Anthropic | `content_block_start` (type: "thinking") + `content_block_delta` (type: "thinking_delta") events, before text blocks | Silently ignored (adapter filters to text_delta only) ✓ |
| OpenAI (Chat/Responses) | Not streamed by default | N/A — not sent |
| Gemini | Parts with `thought: true` when `includeThoughts: true` | N/A — we won't request thoughts |
| xAI | Not streamed by default | N/A — not sent |

### 6.2 Backward compatibility

Existing streaming callers are unaffected by adding `thinking` to the request params:

- **Anthropic streaming**: The current `translateAnthropicStream` generator already silently discards thinking content blocks (it only yields on `text_delta`). Thinking blocks arrive and are skipped without error. **No change needed for backward compat.**
- **OpenAI / xAI**: Reasoning content is not returned in the stream unless explicitly requested. **No change needed.**
- **Gemini**: Without `includeThoughts: true`, no thought parts appear. **No change needed.**

Callers who currently iterate the stream and only handle `text-delta`, `tool-event`, `done`, and `error` events continue to work exactly as today.

### 6.3 Whether/how thinking blocks surface to callers

**Decision: Thinking content is NOT surfaced in this stream. It is silently discarded by all adapters.**

Rationale:
- The caller-facing `IAiStreamEvent` union (`text-delta | tool-event | done | error`) is the public API. Adding `thinking-delta` would be a new event type that existing `onEvent` handlers don't handle.
- The brief explicitly asks for thinking "budget controls" and "coherent abstraction" — not for exposing thought content to callers. Thought display is a separate UX concern.
- Anthropic charges for thinking tokens; surfacing them would change the billing model visible to callers without an explicit opt-in.
- This is deferrable: a future `IAiStreamThinkingDelta` event type + opt-in flag is a clean follow-on.

If callers want thinking content in the future, the right extension point is:
```typescript
interface IThinkingConfig {
  readonly effort?: 'low' | 'medium' | 'high' | 'max';
  readonly tokenBudget?: number;
  readonly exposeThinkingContent?: boolean;  // future: opt-in for thinking-delta events
}
```

This design document does NOT implement `exposeThinkingContent`. It's documented here as the intended extension point.

### 6.4 Streaming request body changes

Each streaming adapter needs `thinking` param added to its function signature and conditionally injected into the request body. The `callProviderCompletionStream` dispatcher passes it through.

---

## 7. Non-streaming response shape

### 7.1 How thinking content surfaces (or doesn't)

**Decision: Thinking content is stripped from all non-streaming responses. `IAiCompletionResponse.content` returns only the final answer text.**

This maintains full backward compatibility: existing callers receive exactly what they receive today.

Per provider:

**Anthropic:** Thinking blocks (`type: "thinking"`) must be filtered from the content array before extraction. The existing `extractAnthropicText` function (used for the tools path) already does this correctly:

```typescript
// extractAnthropicText filters to type === 'text' blocks only
if (typed.type === 'text' && typeof typed.text === 'string') {
  textParts.push(typed.text);
}
```

The non-tools path uses the `anthropicResponse` validator + `response.content[0].text` pattern, which breaks when thinking blocks are present. **Fix required**: route the non-tools path through `extractAnthropicText` when thinking is enabled, or unconditionally (safer).

**OpenAI/xAI:** Reasoning content not in response by default. No change needed.

**Gemini:** Without `includeThoughts: true`, no thought parts. No change needed. If `includeThoughts: true` were sent (which it won't be in this design), the current `candidate.content.parts[0].text` would return the thought text — wrong. This is a landmine documented here so phase B implementer doesn't accidentally add `includeThoughts: true` without fixing the extractor.

### 7.2 Token accounting

**Decision: No separate thinking-token accounting in `IAiCompletionResponse` in this stream.**

Current shape:
```typescript
interface IAiCompletionResponse {
  readonly content: string;
  readonly truncated: boolean;
}
```

Adding thinking token counts would require:
- A new field (additive, not breaking)
- Provider-specific extraction logic
- Different semantics per provider (Anthropic: thinking tokens in usage.cache_read_input_tokens area; OpenAI: reasoning tokens in usage.output_tokens.reasoning_tokens)

This is valuable information but is deferred. If needed in the future:
```typescript
interface IAiCompletionResponse {
  readonly content: string;
  readonly truncated: boolean;
  readonly thinkingTokens?: number;  // future: thinking token count from provider
}
```

The `truncated` flag already reflects whether the total token budget was exhausted (including thinking tokens), so callers get the most important signal today.

---

## 8. Migration impact

### 8.1 Additive changes (no migration required)

The following are strictly additive — no existing code breaks:

| Change | Where | Impact |
|--------|-------|--------|
| `thinking?: IThinkingConfig` on `IProviderCompletionParams` | `apiClient.ts` | Optional field; existing callers unaffected |
| `thinking?: IThinkingConfig` on `IProviderCompletionStreamParams` | `streamingAdapters/common.ts` | Optional field; existing callers unaffected |
| `thinkingMode: AiThinkingMode` on `IAiProviderDescriptor` | `model.ts` | New required field on all descriptors |
| `'thinking'` added to `AiModelCapability` | `model.ts` | Additive enum variant |
| `'thinking'` added to `ModelSpecKey` | `model.ts` | Additive enum variant |
| `IThinkingConfig` type export | `model.ts` (new) | New export |
| `AiThinkingMode` type export | `model.ts` (new) | New export |
| `thinking capability rules` in `DEFAULT_MODEL_CAPABILITY_CONFIG` | `registry.ts` | Additive entries |

### 8.2 Breaking changes

**1. `IAiProviderDescriptor.thinkingMode` is a new required field.**

Every descriptor literal in `BUILTIN_PROVIDERS` (registry.ts) must add `thinkingMode`. All nine built-in providers need the field. TypeScript will catch any missing entries at compile time.

*Blast radius:* Internal to `registry.ts` only. No external consumers create provider descriptors — they only read them. **No consumer migration required.**

**2. `ModelSpecKey` union gains `'thinking'`.**

`allModelSpecKeys` gains a new entry. Code that iterates `allModelSpecKeys` exhaustively (switch statements with `never` checks) would need updating. Current codebase scan shows no such switch — `resolveModel` handles unknown keys gracefully.

*Blast radius:* Low. Likely zero consumer impact.

**3. `AiModelCapability` union gains `'thinking'`.**

Any switch statement exhausting `AiModelCapability` variants would need updating. Current codebase uses this type in `Validators.enumeratedValue` lists (in the proxied list-models validator, `apiClient.ts:990`). This list must be updated to include `'thinking'` or proxied model listings will fail validation for thinking-capable models.

*Blast radius:* `apiClient.ts` internal; affects `callProxiedListModels`. The proxy server side (if separately maintained) also needs updating. If the proxy uses the library's validator via its own bundle, it will need a matching release.

### 8.3 Behavior changes (silent, no type-level signal)

**Temperature auto-suppression:** When callers pass `temperature: 0.7` and also set `thinking: { effort: 'high' }`, temperature is silently dropped for Anthropic and OpenAI/xAI adapters. Today, passing temperature for a thinking model would cause a 400 error (worse behavior). The new behavior is better — but there's no type-level indication.

*Recommendation:* Emit `logger.warn("temperature suppressed for thinking model: {provider}")` from the affected adapters. This ensures callers using observability get a signal.

### 8.4 Consumer: ts-app-shell/useAiAssist.ts

The `generateDirect` and `streamDirect` hooks pass through to `callProviderCompletion` and `callProviderCompletionStream` respectively. These don't currently expose a `thinking` param to callers. **No change required to `useAiAssist.ts` in this stream.** Callers who want thinking mode would either:
1. Call `callProviderCompletion` / `callProviderCompletionStream` directly (already public)
2. Wait for a future `useAiAssist` extension that exposes thinking options

This is acceptable given the brief's scope. Phase B can implement the packlet changes; a follow-on stream can wire thinking into the hook.

### 8.5 Lockstep version policy note

The only change that could be considered "breaking" is `IAiProviderDescriptor.thinkingMode` as a new required field — but this affects only code that *constructs* descriptors (only `registry.ts` internally). Public consumers only read descriptors. Under the lockstep policy, this ships in the same alpha as all other changes. The risk of consumer breakage from this specific change is essentially zero.

---

## 9. Open questions for signoff

**Q1 — xAI temperature rejection (blocking for implementation):**

Is `temperature` rejected by xAI when `reasoning_effort` is set? Available documentation doesn't conclusively state this. One source suggests some parameters are unsupported for Grok variants with reasoning, but doesn't list temperature specifically. Phase B implementer must verify empirically before the adapter suppresses temperature for xAI.

*Recommendation:* Implement xAI to suppress temperature (consistent with Anthropic/OpenAI), add an integration test against the live API, and be prepared to revert if xAI actually accepts temperature alongside reasoning_effort.

---

**Q2 — Anthropic non-streaming path: unconditional fix or conditional?**

The `anthropicResponse` validator fails when thinking blocks are present. Two fix options:
- **Unconditional**: Always use `extractAnthropicText` for the non-tools path (not just when tools are active). This simplifies the code and makes it future-proof.
- **Conditional**: Only use `extractAnthropicText` when `thinking` is set on the request. This preserves the existing validator path for non-thinking calls.

The unconditional fix is cleaner and the existing tools path already uses it safely. But it changes behavior slightly: today, if Anthropic ever returned a thinking block without us requesting it (unexpected but possible in future API changes), we'd silently extract only text rather than failing.

*Recommendation:* Unconditional. The `extractAnthropicText` path is safe and correct; the old path is fragile to Anthropic adding new block types. Approve?

---

**Q3 — Gemini "required" thinking on Gemini 2.5 Pro:**

Gemini 2.5 Pro always thinks and cannot have thinking disabled (thinkingBudget=0 is an error). Should the provider descriptor's `thinkingMode: 'optional'` be wrong for Pro specifically, or do we accept that the descriptor is at the provider level (not model level) and Pro is an outlier within an "optional" provider?

Options:
- Accept the inconsistency: `google-gemini` stays `'optional'` at the descriptor level; Gemini Pro's always-on behavior causes a provider 400 if a caller sends `thinkingConfig.thinkingBudget: 0` (which this design never does, so it's moot in practice)
- Future model-level descriptors: If we eventually support per-model capability records, Pro could declare `'required'`

*Recommendation:* Accept the inconsistency for now. The design never sends `thinkingBudget: 0` for Pro — it's not in scope. Approve?

---

**Q4 — Anthropic "max" effort on Opus 4.7+:**

The research shows "max" effort was available on Opus 4.6 but may not be on Opus 4.7+. If a caller sends `effort: "max"` for a model that doesn't support it, the provider returns a 400. Should the adapter:
- Pass "max" through to the provider and let the 400 surface naturally (current policy for unsupported params)
- Cap "max" at "high" for providers/models that don't support it (silent downgrade)
- Validate against model capability upfront (requires model-level knowledge)

*Recommendation:* Pass through and let the 400 surface. Silently downgrading hides user intent; upfront validation requires per-model data we don't maintain. Approve?

---

**Q5 — xAI registry staleness (out of scope, but flagged):**

The `xai-grok` registry entry references `grok-4-1-fast` and `grok-4-1-fast-reasoning`, which were retired May 15, 2026. The recommended model is now `grok-4.3`. This is outside the scope of the thinking-config stream but would cause 404s for anyone using xAI today.

*Recommendation:* Orchestrator should decide whether to fix the xAI registry entries in this stream (trivial, additive) or open a separate chore. Not blocking for thinking-config design signoff.

---

**Q6 — thinking in proxied completion (phase B scope question):**

The `callProxiedCompletion` and `callProxiedCompletionStream` functions serialize request params to a proxy server. The proxy server (not in this repo) would also need to understand `thinking` params and forward them to providers. Should phase B wire `thinking` through the proxy serialization, or leave proxied callers without thinking support for now?

*Recommendation:* Include thinking in proxy serialization in phase B (trivial to add: serialize `thinking` field into the proxy body). The proxy server implementation is out of scope for this repo but should be noted as a required counterpart change.

---

## Appendix: Full wire-format summary

### Anthropic request with thinking
```json
{
  "model": "claude-opus-4-7",
  "thinking": { "type": "adaptive" },
  "output_config": { "effort": "high" },
  "max_tokens": 16000,
  "system": "...",
  "messages": [...],
  "stream": true
}
// NOTE: temperature omitted entirely
```

### OpenAI Chat Completions request with reasoning
```json
{
  "model": "gpt-5.1",
  "messages": [...],
  "reasoning_effort": "high",
  "stream": true
}
// NOTE: temperature omitted
```

### OpenAI Responses API request with reasoning
```json
{
  "model": "gpt-5.1",
  "input": [...],
  "reasoning": { "effort": "high" },
  "tools": [...],
  "stream": true
}
// NOTE: temperature omitted
```

### Gemini request with thinking
```json
{
  "systemInstruction": { "parts": [{ "text": "..." }] },
  "contents": [...],
  "generationConfig": {
    "temperature": 0.7,
    "thinkingConfig": {
      "thinkingBudget": 4096
    }
  }
}
// NOTE: includeThoughts omitted (no thought content in response)
// NOTE: temperature preserved (Gemini accepts it alongside thinkingConfig)
```

### xAI Grok request with reasoning
```json
{
  "model": "grok-4.3",
  "messages": [...],
  "reasoning_effort": "medium",
  "stream": true
}
// NOTE: temperature omitted (pending Q1 confirmation)
```
