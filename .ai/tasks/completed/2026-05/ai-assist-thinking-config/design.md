# Design: ai-assist-thinking-config (v2)

**Stream:** ai-assist-thinking-config  
**Phase:** A revision — applying image-gen layered pattern  
**Date:** 2026-05-11  
**Status:** Draft — awaiting orchestrator/user signoff  
**Supersedes:** `design-v1.md` (archived; research preserved by reference)

---

## Table of Contents

1. [Provider thinking-surface inventory](#1-provider-thinking-surface-inventory)
2. [Current implementation gap analysis](#2-current-implementation-gap-analysis)
3. [IThinkingConfig shape — layered architecture](#3-ithinkingconfig-shape--layered-architecture)
4. [Sampling-param interaction policy](#4-sampling-param-interaction-policy)
5. [Model-capability signaling](#5-model-capability-signaling)
6. [Streaming integration](#6-streaming-integration)
7. [Non-streaming response shape](#7-non-streaming-response-shape)
8. [Migration impact](#8-migration-impact)
9. [Open questions for signoff](#9-open-questions-for-signoff)

---

## 1. Provider thinking-surface inventory

**v1's §1 inventory is thorough and stands in full.** See `design-v1.md` §1 for the complete per-provider research on Anthropic, OpenAI, Gemini, and xAI. This section supplements v1 only where the v2 architecture raises new specifics.

### 1.1 Family-split clarifications for architecture

v2's layered architecture uses a per-provider `models?` narrowing field that requires deciding which model-name strings to include in each provider's union. The research from v1 §1 maps to the following family groupings:

**Anthropic — single family, effort-vocabulary split:**

| Model | Thinking mode | 'max' effort | Temperature |
|-------|--------------|--------------|-------------|
| `claude-sonnet-4-5` | Extended only (budget_tokens) | No | Must be exactly 1 |
| `claude-sonnet-4-6`, `claude-opus-4-6` | Both modes; adaptive recommended | Yes | Must be exactly 1 |
| `claude-opus-4-7` (and later) | Adaptive only | No | Rejected entirely |

All Anthropic models use the same top-level `effort?` knob; the `'max'` value is model-gated at runtime. No structural family split warrants nested blocks. See §3.1 for the justification.

**OpenAI — three behavioral families, same knob shape:**

| Family | Models | Notes |
|--------|--------|-------|
| o-series | `o3`, `o4-mini`, `o3-deep-research`, `o4-mini-deep-research` | Always reasons; `effort: 'none'` rejected |
| gpt-5.x | `gpt-5`, `gpt-5.1`, `gpt-5.2`, `gpt-5.5` | Hybrid; full vocabulary including `'none'` |
| gpt-5-pro | `gpt-5-pro` | Always reasons at high; effort param ignored |

All three families use `effort?` vocabulary. The differences are about accepted *values*, not a different knob shape. No structural family split warranted.

**Gemini — two behavioral families, same knob shape:**

| Family | Models | Notes |
|--------|--------|-------|
| Pro (always-on) | `gemini-2.5-pro` | Cannot set `thinkingBudget: 0`; runtime error |
| Flash/Flash-Lite (opt-in) | `gemini-2.5-flash`, `gemini-2.5-flash-lite` | Can disable with `thinkingBudget: 0` |

Both families share `thinkingBudget?: number` + `includeThoughts?: boolean`. Only value constraints differ. No structural family split warranted.

**xAI — two behavioral families, same knob shape:**

| Family | Models | Notes |
|--------|--------|-------|
| Configurable | `grok-3-mini`, `grok-4.3` | Accept `reasoning_effort` parameter |
| Always-on | `grok-4` | Rejects `reasoning_effort`; wire adapter must omit the param |

`IXAiThinkingConfig.effort?` is defined on all xAI models. The adapter simply omits the field for `grok-4`. No structural family split warranted.

### 1.2 xAI registry staleness (D7)

Per v1 §9 Q5 and D7: `grok-4-1-fast` and `grok-4-1-fast-reasoning` were retired May 15, 2026. These must be removed and replaced with current models in phase B. Current active xAI chat models: `grok-4`, `grok-4.3`, `grok-3-mini`. Default model recommendation: `grok-4.3` for base/tools; `grok-4.3` for thinking. See §8 for registry entry changes.

---

## 2. Current implementation gap analysis

**v1's §2 gap analysis stands in full.** See `design-v1.md` §2 for the complete table of temperature-always-sent locations, existing thinking/reasoning handling (none), and per-provider severity rankings.

### 2.1 What changes under v2 architecture

One key delta from v1:

- **Temperature handling**: v1's §4 proposed auto-suppress + optional `logger.warn`. Per D4, v2 requires `Result.fail` with a clear contextual message when a caller passes `temperature` AND `thinking` on a provider that rejects temperature with thinking active. See §4 for the full policy. The severity of existing temperature-send gaps (v1 §2.1) is thereby elevated: they are not just gaps to fill but behavior changes with a defined failure mode.

Everything else in v1 §2 is unchanged:
- Anthropic non-streaming validator break (§2.4): resolved unconditionally per D5 (see §7)
- OpenAI/xAI: no `reasoning_effort` field currently sent (§2.3)
- Gemini: no `thinkingConfig` field currently sent (§2.3)

---

## 3. IThinkingConfig shape — layered architecture

### 3.1 Family-shape sub-layer decision (D1: option (a) vs (b))

Per D1, the default lean is option **(a) loose-union per provider** with runtime validation, and **(b) nested family blocks** only where genuinely required.

**Assessment for each provider:**

| Provider | Family split | Verdict | Reasoning |
|----------|-------------|---------|-----------|
| Anthropic | effort-vocab ('max' gated per model) | **(a)** | Same `effort?` knob; only value constraints differ. `IAnthropicThinkingConfig` includes `'max'`; runtime rejects 'max' for 4.7+ |
| OpenAI | o-series / gpt-5.x / gpt-5-pro behavioral differences | **(a)** | All three share the same `effort?` shape; value constraints enforced at runtime |
| Gemini | Pro (always-on) vs Flash (opt-in) | **(a)** | Same `thinkingBudget?` + `includeThoughts?` shape; `thinkingBudget: 0` invalid for Pro is runtime-caught |
| xAI | Configurable vs always-on (grok-4) | **(a)** | `effort?` is defined; adapter omits the wire field for grok-4 since it rejects the param |

**Contrast with image-gen, where (b) was used:** Image-gen used nested family blocks (DallE vs GptImage) because those families have fundamentally *different knob shapes* — `style` is DallE-only, `background`/`moderation`/`output_format` are GptImage-only. For thinking-config, every provider's family set shares the same conceptual knobs (effort level, budget); the differences are value constraints or which field is sent. This is a clean case for (a).

**Conclusion: Single per-provider config type (a) for all four providers.** This keeps the API surface minimal and avoids nested-block ceremony that image-gen only needed because of genuine structural divergence.

### 3.2 Concrete TypeScript types

#### Top-level: `IThinkingConfig`

```typescript
/**
 * Thinking/reasoning mode configuration for a completion request.
 *
 * The generic `effort` field covers the common-subset cross-provider vocabulary.
 * For provider-specific precision (Anthropic 'max', OpenAI 'xhigh', Gemini token
 * budgets, xAI effort-level tuning), use the `providers` array of per-provider
 * config blocks.
 *
 * Absence of this field (or `undefined`) means "no thinking mode" — existing
 * callers are unaffected.
 *
 * @public
 */
export interface IThinkingConfig {
  /**
   * Cross-provider effort level. Selects a documented common-subset mapping
   * per provider (see phase B implementation notes). Callers needing full
   * provider vocabulary should use the `providers` array instead.
   *
   * - 'low': minimal reasoning effort
   * - 'medium': balanced reasoning (provider default when omitted varies)
   * - 'high': extended reasoning
   */
  readonly effort?: 'low' | 'medium' | 'high';

  /**
   * Optional per-provider precision blocks. The merge function applies them
   * in declaration order, with model-specific blocks taking precedence over
   * provider-generic blocks (see JSDoc on the merge function for the full
   * precedence chain).
   *
   * Blocks whose `provider` does not match the resolved model's provider are
   * silently skipped.
   */
  readonly providers?: ReadonlyArray<IThinkingProviderConfig>;
}
```

#### Per-provider union: `IThinkingProviderConfig`

```typescript
/**
 * Discriminated union of per-provider thinking config blocks.
 * Discriminated on `provider`.
 *
 * @remarks
 * The `provider` discriminator uses coarse family names ('anthropic', 'openai',
 * 'google', 'xai', 'other') rather than full registry provider IDs. This mirrors
 * the image-gen layered pattern. The dispatcher maps registry provider IDs to
 * these coarse values during merge resolution.
 *
 * @public
 */
export type IThinkingProviderConfig =
  | IAnthropicThinkingOptions
  | IOpenAiThinkingOptions
  | IGeminiThinkingOptions
  | IXAiThinkingOptions
  | IOtherThinkingOptions;
```

#### Per-provider options interfaces

```typescript
/**
 * Anthropic-specific thinking options block.
 *
 * @remarks
 * `config.effort` accepts the full Anthropic vocabulary including 'max'.
 * 'max' is valid on Opus 4.6 only; the runtime validator rejects it for
 * Opus 4.7+ and later models.
 *
 * @public
 */
export interface IAnthropicThinkingOptions {
  readonly provider: 'anthropic';
  /**
   * Optional model narrowing. When omitted, this block applies to all
   * Anthropic thinking-capable models. When provided, the block applies
   * only to the listed model IDs.
   */
  readonly models?: ReadonlyArray<AnthropicThinkingModelNames>;
  /** Anthropic-specific thinking configuration. */
  readonly config: IAnthropicThinkingConfig;
}

/**
 * OpenAI-specific thinking options block.
 *
 * @remarks
 * Applies to both the Chat Completions path (reasoning_effort) and the
 * Responses API path (reasoning.effort). The adapter selects the correct
 * wire field based on which path is active.
 *
 * `config.effort: 'none'` disables reasoning on gpt-5.x models but is
 * rejected by o-series models (which always reason). The runtime validator
 * catches this mismatch.
 *
 * @public
 */
export interface IOpenAiThinkingOptions {
  readonly provider: 'openai';
  readonly models?: ReadonlyArray<OpenAiThinkingModelNames>;
  readonly config: IOpenAiThinkingConfig;
}

/**
 * Google Gemini-specific thinking options block.
 *
 * @public
 */
export interface IGeminiThinkingOptions {
  readonly provider: 'google';
  readonly models?: ReadonlyArray<GeminiThinkingModelNames>;
  readonly config: IGeminiThinkingConfig;
}

/**
 * xAI-specific thinking options block.
 *
 * @remarks
 * `config.effort` is valid for grok-3-mini and grok-4.3. For grok-4, the
 * adapter omits the reasoning_effort wire field (grok-4 always reasons and
 * rejects the param). The block may still be declared with models narrowed
 * to grok-4; the config fields are ignored in that case.
 *
 * @public
 */
export interface IXAiThinkingOptions {
  readonly provider: 'xai';
  readonly models?: ReadonlyArray<XAiThinkingModelNames>;
  readonly config: IXAiThinkingConfig;
}

/**
 * Escape-hatch block for unknown providers or future models not yet
 * covered by typed per-provider configs.
 *
 * @remarks
 * `models` is REQUIRED (no implicit "all") because applying untyped config
 * to unknown providers without explicit model scope is unsafe. The merge
 * function passes Other-block fields verbatim onto the wire request with
 * no validation.
 *
 * Same Other-block semantics as the image-gen layered pattern.
 *
 * @public
 */
export interface IOtherThinkingOptions {
  readonly provider: 'other';
  /** Required: model IDs this block applies to. No implicit "all". */
  readonly models: ReadonlyArray<string>;
  /** Untyped passthrough config merged verbatim into the wire request. */
  readonly config: JsonObject;
}
```

#### Per-provider config shapes (full provider knobs, D3)

```typescript
/**
 * Anthropic thinking configuration. Exposes the full Anthropic effort
 * vocabulary — no silent translation.
 *
 * @remarks
 * All values map directly to Anthropic's `output_config.effort` wire field.
 * 'max' is only accepted on Opus 4.6; the runtime validator returns Result.fail
 * with a contextual message for Opus 4.7+ and later.
 *
 * @public
 */
export interface IAnthropicThinkingConfig {
  /**
   * Anthropic effort level. Maps 1:1 to `output_config.effort` on the wire.
   * - 'low' | 'medium' | 'high': all thinking-capable models
   * - 'max': Opus 4.6 only
   */
  readonly effort?: 'low' | 'medium' | 'high' | 'max';
}

/**
 * OpenAI thinking configuration. Exposes the full OpenAI reasoning effort
 * vocabulary — no silent translation.
 *
 * @remarks
 * Maps to `reasoning_effort` (Chat Completions path) or `reasoning.effort`
 * (Responses API path) on the wire. The adapter selects the correct field.
 *
 * @public
 */
export interface IOpenAiThinkingConfig {
  /**
   * OpenAI reasoning effort. Maps 1:1 to the wire field.
   * - 'none': disables reasoning (gpt-5.x only; rejected by o-series)
   * - 'minimal': fastest (gpt-5.x)
   * - 'low' | 'medium' | 'high': standard tiers
   * - 'xhigh': highest (select gpt-5.x models only)
   */
  readonly effort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
}

/**
 * Google Gemini thinking configuration. Exposes first-class Gemini knobs
 * — no silent translation.
 *
 * @remarks
 * Maps to `generationConfig.thinkingConfig` on the wire.
 *
 * @public
 */
export interface IGeminiThinkingConfig {
  /**
   * Token budget for thinking. Maps 1:1 to `thinkingBudget` on the wire.
   * - 0: disable thinking (Flash and Flash-Lite only; error on Pro)
   * - positive integer: soft token cap
   * - -1: dynamic — model decides based on query complexity
   * - omitted: model default
   */
  readonly thinkingBudget?: number;

  /**
   * Whether to include thought summaries in the response.
   * Maps to `includeThoughts` on the wire.
   *
   * @remarks
   * **This field is placed here for forward-compatibility but is INERT in
   * phase B.** Adapters never send `includeThoughts: true` to Gemini.
   * The followup stream `ai-assist-thinking-events` wires this up as part
   * of thought-surfacing implementation. See §6.
   */
  readonly includeThoughts?: boolean;
}

/**
 * xAI thinking configuration. Exposes the xAI reasoning effort vocabulary.
 *
 * @remarks
 * Maps to `reasoning_effort` on the wire (Chat Completions format).
 * For grok-4, the adapter omits the wire field regardless of this config
 * (grok-4 always reasons and rejects the parameter).
 *
 * @public
 */
export interface IXAiThinkingConfig {
  /**
   * xAI reasoning effort. Maps 1:1 to `reasoning_effort` on the wire.
   * - 'none': disables reasoning
   * - 'low' | 'medium' | 'high': standard tiers
   */
  readonly effort?: 'none' | 'low' | 'medium' | 'high';
}
```

#### Model-name unions

```typescript
/**
 * Model IDs for Anthropic thinking-capable models. Used to narrow
 * `IAnthropicThinkingOptions.models` so that misspelled or non-Anthropic
 * model names are TypeScript errors.
 *
 * @remarks
 * This union should be extended as new Anthropic models are added to the
 * registry. The union is intentionally loose — it lists known models at
 * design time; new models can be added without breaking existing call sites.
 *
 * @public
 */
export type AnthropicThinkingModelNames =
  | 'claude-sonnet-4-5'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'
  | 'claude-opus-4-7';

/**
 * Model IDs for OpenAI thinking-capable models.
 * @public
 */
export type OpenAiThinkingModelNames =
  | 'o3'
  | 'o4-mini'
  | 'o3-deep-research'
  | 'o4-mini-deep-research'
  | 'gpt-5'
  | 'gpt-5.1'
  | 'gpt-5.2'
  | 'gpt-5.5'
  | 'gpt-5-pro';

/**
 * Model IDs for Google Gemini thinking-capable models.
 * @public
 */
export type GeminiThinkingModelNames =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite';

/**
 * Model IDs for xAI thinking-capable models.
 * @public
 */
export type XAiThinkingModelNames =
  | 'grok-3-mini'
  | 'grok-4.3'
  | 'grok-4';
```

### 3.3 Placement on request params

```typescript
// apiClient.ts — non-streaming completion params
export interface IProviderCompletionParams {
  // ... existing fields unchanged ...
  /**
   * Optional thinking/reasoning mode configuration.
   * Absence (or undefined) means "no thinking mode" — existing callers
   * are unaffected.
   */
  readonly thinking?: IThinkingConfig;
}

// streamingAdapters/common.ts — streaming completion params
export interface IProviderCompletionStreamParams {
  // ... existing fields unchanged ...
  readonly thinking?: IThinkingConfig;
}
```

### 3.4 Merge function (D2)

The merge function resolves the effective per-provider thinking config for a specific resolved model. It is a new internal function in the ai-assist packlet (not exported) and runs in both the non-streaming and streaming dispatch paths.

**Precedence chain** (later tier wins; within a tier, declaration order wins — later wins):

1. **Generic top-level** (`IThinkingConfig.effort`) → mapped onto the resolved model's wire shape via a documented common-subset table (see phase B notes)
2. **Provider-generic blocks**: entries in `providers` matching the resolved model's provider with `models` field omitted → applied in declaration order
3. **Model-specific blocks**: entries with `models` array including the resolved model name → applied in declaration order
4. **Other blocks**: entries with `provider: 'other'` whose `models` array includes the resolved model name → applied in declaration order, same precedence tier as model-specific

Blocks whose `provider` does not match the resolved model's provider are silently skipped during filtering. No error.

```typescript
/**
 * Resolves the effective thinking wire params for a specific resolved model.
 *
 * Precedence (later tier wins; within tier, later declaration wins):
 * 1. Generic effort (top-level IThinkingConfig.effort) → common-subset mapping
 * 2. Provider-generic blocks (matching provider, no models filter)
 * 3. Model-specific blocks (matching provider + models array includes resolved model)
 * 4. Other blocks (provider: 'other', models includes resolved model) — same tier as 3
 *
 * @remarks
 * Blocks whose provider does not match the resolved model's provider are
 * silently skipped. This is normal — a config may include blocks for multiple
 * providers; only the relevant one applies.
 *
 * @param config - The caller's IThinkingConfig
 * @param resolvedModel - The concrete model string after registry resolution
 * @param providerDiscriminator - Coarse provider family ('anthropic' | 'openai' | 'google' | 'xai')
 * @returns Merged effective config for wire encoding, or Result.fail if validation fails
 */
function mergeThinkingConfig(
  config: IThinkingConfig,
  resolvedModel: string,
  providerDiscriminator: 'anthropic' | 'openai' | 'google' | 'xai'
): Result<MergedThinkingConfig>
```

### 3.5 Generic `effort` common-subset mapping

The top-level `effort` field uses a minimal, documented common-subset mapping. This is NOT a silent translation table — it is explicitly documented so callers understand what they're getting. Callers who need precision use per-provider blocks.

| Generic `effort` | Anthropic wire | OpenAI wire | Gemini wire | xAI wire |
|-----------------|---------------|-------------|-------------|----------|
| `'low'` | `effort: 'low'` | `effort: 'low'` | `thinkingBudget: 1024` | `reasoning_effort: 'low'` |
| `'medium'` | `effort: 'medium'` | `effort: 'medium'` | `thinkingBudget: 4096` | `reasoning_effort: 'medium'` |
| `'high'` | `effort: 'high'` | `effort: 'high'` | `thinkingBudget: 8192` | `reasoning_effort: 'high'` |
| omitted | Provider default | Provider default | Provider default (`-1` dynamic) | Provider default (`'low'`) |

**Design intent:** The generic effort covers the common case (low/medium/high). Provider-specific vocabulary that has no cross-provider analog ('max', 'xhigh', 'none', 'minimal', specific token budgets) is only available via per-provider config blocks. This is the intended tradeoff — broad callers stay generic; power callers use the providers array.

The Gemini integer values above are the initial defaults. If live verification in phase B shows different sensible defaults, the phase B implementer may adjust them; document any adjustments in `state.md`.

---

## 4. Sampling-param interaction policy

### 4.1 Policy (D4)

**When a caller passes `temperature` AND `thinking` on a provider whose API rejects temperature with thinking active, the adapter returns `Result.fail` with a clear contextual message.**

This is an explicit departure from v1's auto-suppress approach. The reasoning per D4: auto-suppress hides the conflict from the caller; Result.fail surfaces it. The caller opted into thinking mode; they must also resolve the temperature conflict explicitly.

### 4.2 Per-provider matrix

| Provider | When thinking enabled | temperature | Result.fail? |
|----------|----------------------|-------------|--------------|
| Anthropic | Always (any thinking config) | Rejected by API | **Yes** |
| OpenAI Chat + Responses | When effort ≠ undefined or 'none' | Rejected by API | **Yes** |
| Gemini | Any | Accepted alongside thinkingConfig | **No — keep temperature** |
| xAI | When effort ≠ undefined or 'none' | Unknown — phase B step zero | **TBD** (see §9, Q1) |

**OpenAI clarification:** If a caller sends an `IOpenAiThinkingConfig` with `effort: 'none'` (disabling reasoning), temperature is accepted by gpt-5.x. The adapter should only fail if the effective merged effort is non-null and not 'none'.

### 4.3 Error message format (D4)

```
thinking mode is not compatible with temperature on provider <X>: remove temperature or disable thinking
```

Concrete examples:

```
thinking mode is not compatible with temperature on provider anthropic: remove temperature or disable thinking
thinking mode is not compatible with temperature on provider openai: remove temperature or disable thinking
```

### 4.4 Type-level shape

`temperature` stays as a top-level field on `IProviderCompletionParams` and `IProviderCompletionStreamParams`. The conflict is checked at dispatch time (after the merge function produces the effective config), not at the type level. This preserves the additive character of the `thinking?` field.

### 4.5 OpenAI 'none' edge case

When the effective merged effort for an OpenAI model is `'none'`, reasoning is disabled and temperature is accepted. The adapter must check effective effort, not merely the presence of a thinking config:

```typescript
// Pseudocode in the OpenAI adapter
const effectiveEffort = mergeResult.effort;
if (effectiveEffort !== undefined && effectiveEffort !== 'none') {
  if (params.temperature !== undefined) {
    return fail(`thinking mode is not compatible with temperature on provider openai: ...`);
  }
}
```

---

## 5. Model-capability signaling

### 5.1 `AiModelCapability` gains `'thinking'` (D6)

```typescript
// model.ts — current
export type AiModelCapability = 'chat' | 'tools' | 'vision' | 'image-generation';

// model.ts — updated
export type AiModelCapability = 'chat' | 'tools' | 'vision' | 'image-generation' | 'thinking';
```

The `Validators.enumeratedValue` list at `apiClient.ts:990` (proxied list-models validator) must be updated to include `'thinking'` or proxied model listings will fail validation for thinking-capable models.

Example additions to `DEFAULT_MODEL_CAPABILITY_CONFIG` in `registry.ts`:

```typescript
anthropic: [
  { idPattern: /^claude-opus-4/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  { idPattern: /^claude-sonnet-4\.6/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  { idPattern: /^claude-sonnet-4\.5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] },
  { idPattern: /^claude-/, capabilities: ['chat', 'tools', 'vision'] }  // older models
],
openai: [
  { idPattern: /^o[34]/, capabilities: ['chat', 'tools', 'thinking'] },         // o-series
  { idPattern: /^gpt-5/, capabilities: ['chat', 'tools', 'vision', 'thinking'] }, // gpt-5.x
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
  // grok-4-1-fast / grok-4-1-fast-reasoning removed (retired May 15, 2026 — D7)
  // ... remaining non-thinking models ...
]
```

### 5.2 `IAiProviderDescriptor.thinkingMode` (D6)

```typescript
/**
 * Whether this provider supports thinking/reasoning mode.
 * - 'optional': thinking is opt-in per-request
 * - 'required': always-on thinking (reserved for future model-level descriptors)
 * - 'unsupported': provider does not support thinking
 *
 * @remarks
 * 'optional' is used at the provider level even when some models within the
 * provider always reason (e.g. Gemini 2.5 Pro, grok-4, o-series). The always-on
 * nature of those models is enforced at the model level via capability rules; at
 * the provider level, the provider as a whole accepts thinking configuration.
 *
 * @public
 */
export type AiThinkingMode = 'optional' | 'required' | 'unsupported';

export interface IAiProviderDescriptor {
  // ... existing fields unchanged ...
  /**
   * Whether this provider supports thinking/reasoning mode configuration.
   */
  readonly thinkingMode: AiThinkingMode;
}
```

**Concrete values per provider:**

| Provider | `thinkingMode` | Rationale |
|----------|---------------|-----------|
| `anthropic` | `'optional'` | All Claude 4.x models support thinking; opt-in per request |
| `google-gemini` | `'optional'` | Flash: opt-in; Pro: always-on, but accepts `thinkingBudget` param |
| `openai` | `'optional'` | gpt-5.x: opt-in; o-series: always-on; both accept reasoning.effort |
| `xai-grok` | `'optional'` | grok-4.3: opt-in; grok-4: always reasons (param rejected) |
| `groq` | `'unsupported'` | No thinking capability |
| `mistral` | `'unsupported'` | No thinking capability |
| `ollama` | `'unsupported'` | Model-dependent; no standardized thinking API |
| `openai-compat` | `'unsupported'` | Self-hosted; no guaranteed thinking support |
| `copy-paste` | `'unsupported'` | No API |

### 5.3 `ModelSpecKey` gains `'thinking'` (D6)

```typescript
// model.ts — current
export type ModelSpecKey = 'base' | 'tools' | 'image';
export const allModelSpecKeys: ReadonlyArray<ModelSpecKey> = ['base', 'tools', 'image'];

// model.ts — updated
export type ModelSpecKey = 'base' | 'tools' | 'image' | 'thinking';
export const allModelSpecKeys: ReadonlyArray<ModelSpecKey> = ['base', 'tools', 'image', 'thinking'];
```

Primary use case: providers where the best model for reasoning differs from the base model. Also enables callers to configure per-context model selection explicitly:

```typescript
// In IAiAssistProviderConfig — no change to the type; just illustration
const xAiConfig = {
  model: {
    base: 'grok-4.3',
    tools: 'grok-4.3',
    thinking: 'grok-4.3'  // currently same; field allows future differentiation
  }
};
```

The `resolveModel` function in `model.ts` already handles unknown keys via the 'base' fallback (see `resolveModel` implementation). No logic change needed there; only the type and constant array update.

---

## 6. Streaming integration

### 6.1 Per-provider streaming behavior (D9)

Per v1 §6.1 (which stands in full):

| Provider | Thinking content in stream | v2 treatment |
|----------|--------------------------|--------------|
| Anthropic | `thinking_delta` events before text blocks | Silently discarded — adapter already filters to `text_delta` only |
| OpenAI Chat/Responses | Not streamed by default | No change needed |
| Gemini | Parts with `thought: true` only when `includeThoughts: true` | Not requested; no change needed |
| xAI | Not streamed by default | No change needed |

### 6.2 Thinking-event surfacing: OUT OF SCOPE (D9)

**Thinking content is silently discarded by all adapters in phase B.** No new `IAiStreamEvent` variants are added. The `IAiStreamEvent` union (`text-delta | tool-event | done | error`) is unchanged.

This is a firm scope decision, not a gap. The followup stream **`ai-assist-thinking-events`** is queued to design and implement:
- New `IAiStreamEvent` variant for thinking deltas
- Non-streaming response shape change (opt-in `thinking?: string` field)
- Full opt-in plumbing
- Provider-specific surfacing logic per provider's thinking event format
- Token accounting (`thinkingTokens?: number`)

### 6.3 `includeThoughts` field placement

`IGeminiThinkingConfig.includeThoughts?: boolean` is defined in §3's type shapes. **The field is placed now for forward-compatibility with `ai-assist-thinking-events`.**

In phase B:
- Adapters never read `includeThoughts`
- Gemini requests never include `includeThoughts: true` in `thinkingConfig`
- No thought parts appear in responses

When `ai-assist-thinking-events` lands, it wires up `includeThoughts` and the corresponding Anthropic/xAI opt-in mechanism.

### 6.4 Streaming request body additions

Each streaming adapter receives `thinking` from `IProviderCompletionStreamParams` and conditionally adds the provider-specific wire fields. The adapters apply the same merge logic and Result.fail temperature policy as the non-streaming path.

---

## 7. Non-streaming response shape

### 7.1 Anthropic validator fix: unconditional (D5)

The v1 §2.4 finding stands: the non-tools, non-streaming Anthropic path uses `anthropicResponse` validator, which requires every content block to have a `text: string` field. Thinking blocks (`type: "thinking"`) have a `thinking` field instead, causing the validator to fail when thinking content blocks are present.

**Fix (per D5): unconditional routing through `extractAnthropicText`.**

Route the non-tools, non-streaming Anthropic path through `extractAnthropicText` always — not only when thinking is set on the request.

```typescript
// Current (fragile) non-tools path:
//   anthropicResponse validator → response.content[0].text
//
// Fixed (unconditional) non-tools path:
//   extractAnthropicText(responseBody) — already used by the tools path
//   Filters to type === 'text' blocks; future Anthropic block types are safe
```

The `extractAnthropicText` function is already used correctly by the tools path. The non-tools path is the inconsistency. The unconditional fix:
- Handles thinking blocks correctly (they are filtered out, not breaking the extractor)
- Is resilient to future Anthropic API additions of new block types
- Simplifies the non-tools path (removes a conditional branch)

### 7.2 Thinking content not surfaced (D9)

**`IAiCompletionResponse` is unchanged in phase B.**

```typescript
// Unchanged
interface IAiCompletionResponse {
  readonly content: string;
  readonly truncated: boolean;
}
```

Thinking content is stripped from all non-streaming responses. The followup stream `ai-assist-thinking-events` will add `thinking?: string` if appropriate.

Per provider:
- **Anthropic:** Thinking blocks are filtered by `extractAnthropicText` (type === 'text' only). Already correct; the unconditional fix in §7.1 ensures this path is always taken.
- **OpenAI/xAI:** Reasoning content not in response by default. No change.
- **Gemini:** `includeThoughts` is never sent as `true` (§6.3). No thought parts appear. No change.

**Landmine documented for phase B implementer:** If `includeThoughts: true` were accidentally sent to Gemini, `candidate.content.parts[0].text` would return thought text, not answer text — silent wrong output. Phase B implementer must not send `includeThoughts: true` to Gemini without first implementing the thought-stripping logic in the Gemini response extractor.

---

## 8. Migration impact

### 8.1 Additive changes (no migration required)

| Change | File | Impact |
|--------|------|--------|
| `thinking?: IThinkingConfig` on `IProviderCompletionParams` | `apiClient.ts` | Optional; existing callers unaffected |
| `thinking?: IThinkingConfig` on `IProviderCompletionStreamParams` | `streamingAdapters/common.ts` | Optional; existing callers unaffected |
| New types: `IThinkingConfig`, `IThinkingProviderConfig`, per-provider options/config interfaces, model-name unions | `model.ts` | New exports; additive |
| `AiThinkingMode` type export | `model.ts` | New export |
| `'thinking'` added to `AiModelCapability` | `model.ts` | Additive union variant |
| `'thinking'` added to `ModelSpecKey` and `allModelSpecKeys` | `model.ts` | Additive |
| Thinking capability rules in `DEFAULT_MODEL_CAPABILITY_CONFIG` | `registry.ts` | Additive entries |

### 8.2 Breaking changes

**1. `IAiProviderDescriptor.thinkingMode` — new required field**

Every descriptor in `BUILTIN_PROVIDERS` (registry.ts) must add `thinkingMode`. Nine providers. TypeScript catches missing entries at compile time.

*Blast radius:* Internal to `registry.ts` only. Public consumers only read descriptors, never construct them. **No consumer migration required.**

**2. xAI registry staleness fix (D7)**

Remove `grok-4-1-fast` and `grok-4-1-fast-reasoning` from the xAI registry entry (retired May 15, 2026). Update `defaultModel`:

```typescript
// xai-grok descriptor — updated
defaultModel: {
  base: 'grok-4.3',
  tools: 'grok-4.3',
  thinking: 'grok-4.3',
  // image: unchanged (separate stream handled this)
}
```

*Blast radius:* Any callers using xAI with no model override who were relying on `grok-4-1-fast`. Since those models are already retired/erroring (May 15, 2026 sunset), this is a correctness fix. Callers will stop receiving 404s from the API.

**3. `AiModelCapability` and proxied list-models validator**

The `Validators.enumeratedValue` list for `AiModelCapability` at `apiClient.ts:990` must include `'thinking'`. Without this, proxied model listings that include thinking-capable models will fail validation.

*Blast radius:* Internal to `apiClient.ts`. No consumer-facing type change. The proxy server (not in this repo) uses the library's validator via its own bundle — a matching release is required there as well.

### 8.3 Behavior change: temperature + thinking = Result.fail

Callers who currently pass `temperature` alongside a thinking-capable model will receive `Result.fail` rather than a provider 400. This is an improvement (client-side error with descriptive message rather than opaque HTTP error), but callers whose error handling distinguishes between `Result.fail` and a provider 400 may observe different behavior.

*Blast radius:* Any callers currently passing temperature to a thinking-capable model. Today this causes a provider 400 (worse failure mode). The new `Result.fail` is a better signal. No migration action required, but callers should be aware of the behavior change.

### 8.4 Consumer: `ts-app-shell/useAiAssist.ts`

No change required. The `generateDirect` and `streamDirect` hooks pass through to `callProviderCompletion` / `callProviderCompletionStream`. The `thinking?` field is additive. Callers who want thinking mode call `callProviderCompletion` / `callProviderCompletionStream` directly (already public). A follow-on stream can wire thinking into the `useAiAssist` hook.

### 8.5 Lockstep version note

The `IAiProviderDescriptor.thinkingMode` addition is the only change that constructs a required field on a previously-shipped type. It affects only `registry.ts` (internal). Under the lockstep policy, this ships in the same alpha as all other changes. Consumer breakage risk: essentially zero (consumers don't construct provider descriptors).

---

## 9. Open questions for signoff

### Resolved questions from v1

All nine of v1's open questions are resolved by D1-D9:

| v1 Q | Resolution |
|------|-----------|
| Q1 — xAI temperature rejection | D8: phase B step zero live verification; Result.fail if confirmed (see below) |
| Q2 — Anthropic non-streaming fix: unconditional or conditional? | D5: unconditional |
| Q3 — Gemini Pro 'optional' at provider level | D6: accepted — provider-level descriptor stays 'optional'; Pro's always-on is a model-level constraint, not a provider-level constraint. The design never sends thinkingBudget: 0 to Pro. |
| Q4 — Anthropic 'max' for Opus 4.7+ | D3 + runtime validation: pass 'max' through type; runtime validator returns Result.fail for Opus 4.7+. No silent capping. |
| Q5 — xAI registry staleness | D7: fold the fix in. |
| Q6 — thinking in proxied completion | Phase B scope: include thinking in proxy serialization (trivial — serialize `thinking` field into proxy body). Proxy server implementation is out of scope but should be noted as a required counterpart change. |

---

### New open questions from v2 architecture

**Q1 — xAI temperature rejection (D8: phase B step zero)**

Per D8, phase B step zero is a live verification: does xAI reject `temperature` when `reasoning_effort` is set on grok-4.3?

If xAI **rejects temperature**: apply Result.fail per D4 (same as Anthropic/OpenAI).  
If xAI **accepts temperature**: keep temperature for xAI (same as Gemini). Update the §4.2 matrix in phase B state.md.

The design documents the "TBD" state; the phase B implementer resolves it with a live test call before implementing the xAI adapter.

---

**Q2 — Generic effort Gemini token budget defaults**

The §3.5 table uses `1024 / 4096 / 8192` as the low/medium/high Gemini token budget defaults. These values are defensible (low ≈ 1K, medium ≈ 4K, high ≈ 8K) but are not authoritative from live docs. Phase B step zero should verify whether Gemini has documented guidelines for these tiers, and adjust if warranted. If Gemini uses `-1` (dynamic) for all tiers by default, the defaults table should say so. No blocking — phase B can adjust without a design revision.

---

**Q3 — Anthropic Sonnet 4.5 wire format**

v1 §1.1 notes claude-sonnet-4-5 supports "Extended thinking only (budget_tokens still supported)". The current adaptive thinking wire format (`thinking: { type: 'adaptive' }, output_config: { effort }`) may not be supported on Sonnet 4.5. Phase B implementer must verify whether Sonnet 4.5 accepts adaptive mode or requires the deprecated extended mode wire format.

If Sonnet 4.5 requires extended format: the Anthropic adapter needs a model-conditional branch. This is an implementation detail for phase B and does not affect the type architecture. Surface as an implementation note in phase B state.md.

---

**Q4 — Proxy serialization of `thinking`**

When `thinking` is included in proxied completion calls, the proxy server (external to this repo) must also understand and forward `thinking` params to providers. Phase B includes thinking in the proxy serialization — document this in the phase B PR description so the proxy server maintainers know a counterpart change is needed.

---

## Appendix: Wire format summary

Reference `design-v1.md` Appendix for the full per-provider wire format examples. These are unchanged from v1's research.

**Delta from v1 appendix:** The xAI example should use `grok-4.3` (not retired models). All other wire formats are identical.
