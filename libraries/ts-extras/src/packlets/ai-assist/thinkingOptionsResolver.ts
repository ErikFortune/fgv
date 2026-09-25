// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Merge logic and runtime validation for thinking/reasoning options.
 * @packageDocumentation
 */

import { type JsonObject } from '@fgv/ts-json-base';
import { fail, Result, succeed } from '@fgv/ts-utils';

import type {
  IThinkingConfig,
  IThinkingProviderConfig,
  IAnthropicThinkingConfig,
  IOpenAiThinkingConfig,
  IXAiThinkingConfig
} from './model';

// ============================================================================
// Provider discriminator
// ============================================================================

/**
 * Coarse provider family used to discriminate thinking config blocks.
 * Maps from AiProviderId to the IThinkingProviderConfig `provider` discriminator.
 * @internal
 */
export type ThinkingProviderDiscriminator = 'anthropic' | 'openai' | 'google' | 'xai';

/**
 * Maps an AiProviderId (registry key) to the coarse family discriminator used
 * in IThinkingProviderConfig. Returns undefined for providers without thinking support.
 * @internal
 */
export function providerDiscriminatorForId(providerId: string): ThinkingProviderDiscriminator | undefined {
  switch (providerId) {
    case 'anthropic':
      return 'anthropic';
    case 'openai':
      return 'openai';
    case 'google-gemini':
      return 'google';
    case 'xai-grok':
      return 'xai';
    default:
      return undefined;
  }
}

// ============================================================================
// Resolved wire shape
// ============================================================================

/**
 * Resolved thinking wire parameters for a specific provider, after merging
 * all applicable config blocks. Ready for provider-specific wire encoding.
 *
 * Callers that pre-resolve thinking config outside of the standard streaming
 * helpers (e.g. `executeClientToolTurn`) accept this type via the
 * `resolvedThinking` parameter and pass it directly to the adapter layer.
 * @public
 */
export interface IResolvedThinkingConfig {
  /**
   * Anthropic: effort level. The emit-site picks one of two wire shapes — on the
   * Claude 5 family it sends the effort string verbatim in `output_config` with no
   * budget; on older models it converts via `anthropicEffortToBudgetTokens`. See
   * {@link AiAssist.IAnthropicThinkingConfig.effort}.
   */
  readonly anthropicEffort?: IAnthropicThinkingConfig['effort'];
  /** OpenAI Chat: reasoning_effort value; OpenAI Responses: reasoning.effort */
  readonly openAiEffort?: IOpenAiThinkingConfig['effort'];
  /** Gemini: generationConfig.thinkingConfig.thinkingBudget */
  readonly geminiThinkingBudget?: number;
  /** xAI: reasoning_effort value (omit for grok-4) */
  readonly xaiEffort?: IXAiThinkingConfig['effort'];
  /** Other/passthrough: merged verbatim into wire request */
  readonly otherParams?: JsonObject;
}

// ============================================================================
// Common-subset mapping
// ============================================================================

/**
 * Maps generic effort to Anthropic wire effort. Anthropic has no 'none' value in its
 * own vocabulary — the caller (tier 1 of `mergeThinkingConfig`) handles `'none'` by
 * skipping this mapping entirely, so `anthropicEffort` stays unset and the emit site
 * omits the `thinking` wire param. @internal
 */
function genericEffortToAnthropic(effort: 'low' | 'medium' | 'high'): IAnthropicThinkingConfig['effort'] {
  return effort; // 1:1 mapping for the common subset
}

/**
 * Maps Anthropic effort level to the `thinking.budget_tokens` integer that the
 * Anthropic API requires when `thinking.type === 'enabled'`.
 *
 * Policy: low = 2048, medium = 8192, high = 24000, max = 32000. The lower three
 * align with the Anthropic-published minimum-meaningful budget, a mid-range
 * default, and a "deep thinking" allotment respectively. `max` is the deepest
 * allotment and stays within typical model limits.
 *
 * Only reached for models outside the Claude 5 family — the adaptive-thinking path
 * sends no budget at all.
 *
 * @public
 */
export function anthropicEffortToBudgetTokens(
  effort: NonNullable<IAnthropicThinkingConfig['effort']>
): number {
  switch (effort) {
    case 'low':
      return 2048;
    case 'medium':
      return 8192;
    case 'high':
      return 24000;
    case 'max':
      return 32000;
  }
}

/**
 * Maps generic effort to OpenAI wire effort. @internal
 */
function genericEffortToOpenAi(effort: 'none' | 'low' | 'medium' | 'high'): IOpenAiThinkingConfig['effort'] {
  return effort; // 1:1 mapping for the common subset
}

/**
 * Maps generic effort to Gemini thinkingBudget. `'none'` maps to `0` — Gemini's own
 * off value on the wire, though `IGeminiThinkingConfig.thinkingBudget` documents that `0`
 * is valid only on Flash/Flash-Lite and errors on Pro; this mapping is not model-aware and
 * inherits that same caveat (not a new gap — an explicit `providers` block could already
 * request `thinkingBudget: 0` on any model). @internal
 */
function genericEffortToGemini(effort: 'none' | 'low' | 'medium' | 'high'): number {
  switch (effort) {
    case 'none':
      return 0;
    case 'low':
      return 1024;
    case 'medium':
      return 4096;
    case 'high':
      return 8192;
  }
}

/**
 * Maps generic effort to xAI reasoning_effort. @internal
 */
function genericEffortToXai(effort: 'none' | 'low' | 'medium' | 'high'): IXAiThinkingConfig['effort'] {
  return effort; // 1:1 mapping for the common subset
}

// ============================================================================
// Block applicability
// ============================================================================

/**
 * Returns true when a provider config block applies to the given resolved model
 * and provider discriminator.
 *
 * Applicability rules:
 * - provider must match the coarse discriminator
 * - if models array is present, resolved model must match (exact or base-name prefix)
 * - if models array is absent, the block is provider-generic (applies to all)
 *
 * Prefix matching supports versioned IDs: `'claude-sonnet-4-5'` matches resolved
 * `'claude-sonnet-4-5-20250929'`. An entry matches when it equals the resolved model
 * or when the resolved model starts with the entry followed by a `-`.
 *
 * 'other' blocks require models to be present (enforced by the type).
 * @internal
 */
function modelNameMatches(resolvedModel: string, name: string): boolean {
  return resolvedModel === name || resolvedModel.startsWith(`${name}-`);
}

function blockApplies(
  block: IThinkingProviderConfig,
  resolvedModel: string,
  discriminator: ThinkingProviderDiscriminator
): boolean {
  if (block.provider !== discriminator && block.provider !== 'other') {
    return false;
  }
  if (block.provider === 'other') {
    return block.models.some((name) => modelNameMatches(resolvedModel, name));
  }
  if (block.models !== undefined) {
    return (block.models as ReadonlyArray<string>).some((name) => modelNameMatches(resolvedModel, name));
  }
  return true; // provider-generic block
}

/**
 * Returns true when a block is model-specific (has a models array).
 * Used to partition blocks into merge tiers.
 * @internal
 */
function isModelSpecific(block: IThinkingProviderConfig): boolean {
  if (block.provider === 'other') {
    return true; // other blocks always require models
  }
  return block.models !== undefined;
}

// ============================================================================
// Merge function
// ============================================================================

/**
 * Resolves the effective thinking wire parameters for a specific resolved model
 * by merging all applicable config blocks in precedence order.
 *
 * Precedence (later tier wins; within tier, later declaration wins):
 * 1. Generic effort (top-level IThinkingConfig.effort) → common-subset mapping
 * 2. Provider-generic blocks (matching provider, no models filter)
 * 3. Model-specific blocks (matching provider + models array includes resolved model)
 * 4. Other blocks (provider: 'other', models includes resolved model) — same tier as 3
 *
 * Blocks whose provider does not match are silently skipped.
 *
 * Note: when the resolved OpenAI effort is `'none'`, reasoning is disabled and
 * temperature is accepted; see {@link IOpenAiThinkingConfig.effort} for the full
 * hybrid-mode semantics.
 *
 * A generic `effort: 'none'` on a model that cannot run with thinking off (`thinkingRequired`)
 * is sent as `'low'`, or refused when `config.onUnsupported` is `'fail'`. Provider blocks are
 * not checked — a caller writing one has taken control of the wire value.
 *
 * @param config - The caller's IThinkingConfig
 * @param resolvedModel - The concrete model string after registry resolution
 * @param discriminator - Coarse provider family
 * @param thinkingRequired - Whether `resolvedModel` rejects the off value (see
 *   `isThinkingRequiredModel`)
 * @returns Merged effective config for wire encoding, or a failure when `'none'` is refused
 * @internal
 */
export function mergeThinkingConfig(
  config: IThinkingConfig,
  resolvedModel: string,
  discriminator: ThinkingProviderDiscriminator,
  thinkingRequired: boolean = false
): Result<IResolvedThinkingConfig> {
  return resolveThinkingConfig(config, resolvedModel, discriminator, thinkingRequired).onSuccess((r) =>
    succeed(r.resolved)
  );
}

/**
 * The outcome of {@link resolveThinkingConfig}: the wire config, plus whether a generic `'none'`
 * was actually sent as `'low'`.
 * @internal
 */
export interface IThinkingResolution {
  readonly resolved: IResolvedThinkingConfig;
  /**
   * True only when a generic `'none'` was degraded to `'low'` **and** no provider block then
   * rewrote that provider's effort field, so the wire carries the degraded value.
   */
  readonly noneDegraded: boolean;
}

/**
 * The wire keys through which each provider carries its thinking effort, where an `'other'` block's
 * `otherParams` land (merged last, so they win): the request body for OpenAI, xAI and Anthropic, and
 * `generationConfig` for Gemini.
 */
const EFFORT_WIRE_KEYS: Readonly<Record<ThinkingProviderDiscriminator, ReadonlyArray<string>>> = {
  openai: ['reasoning_effort', 'reasoning'],
  xai: ['reasoning_effort', 'reasoning'],
  google: ['thinkingConfig'],
  anthropic: ['thinking', 'output_config']
};

/**
 * True when an applicable `'other'` block sets `discriminator`'s effort field on the wire. The caller
 * then owns that value, so the `'none'` gate stands aside, the same as for an explicit provider block.
 */
function otherBlockSetsWireEffort(
  config: IThinkingConfig,
  resolvedModel: string,
  discriminator: ThinkingProviderDiscriminator
): boolean {
  return (config.providers ?? []).some(
    (block) =>
      block.provider === 'other' &&
      blockApplies(block, resolvedModel, discriminator) &&
      EFFORT_WIRE_KEYS[discriminator].some((key) => key in block.config)
  );
}

/** The resolved field that carries the effort for `discriminator`. */
function effortFieldFor(
  resolved: IResolvedThinkingConfig,
  discriminator: ThinkingProviderDiscriminator
): unknown {
  switch (discriminator) {
    case 'anthropic':
      return resolved.anthropicEffort;
    case 'openai':
      return resolved.openAiEffort;
    case 'google':
      return resolved.geminiThinkingBudget;
    case 'xai':
      return resolved.xaiEffort;
  }
}

/**
 * {@link mergeThinkingConfig}, also reporting whether the `'none'` degrade reached the wire.
 * The call paths use this so a later failure message can say what was actually sent.
 * @internal
 */
export function resolveThinkingConfig(
  config: IThinkingConfig,
  resolvedModel: string,
  discriminator: ThinkingProviderDiscriminator,
  thinkingRequired: boolean
): Result<IThinkingResolution> {
  let resolved: IResolvedThinkingConfig = {};

  let effort = config.effort;
  let degraded = false;
  if (
    effort === 'none' &&
    thinkingRequired &&
    !otherBlockSetsWireEffort(config, resolvedModel, discriminator)
  ) {
    if (config.onUnsupported === 'fail') {
      return fail(
        `thinking effort 'none' is not supported by ${resolvedModel}: the model cannot run with ` +
          `thinking off (omit onUnsupported, or set it to 'degrade', to send 'low' instead)`
      );
    }
    effort = 'low';
    degraded = true;
  }

  // Tier 1: generic effort → common-subset mapping
  if (effort !== undefined) {
    switch (discriminator) {
      case 'anthropic':
        // Anthropic has no 'none' value: "off" means no `thinking` wire param at all,
        // so 'none' leaves `anthropicEffort` unset rather than mapping to a value. That
        // also satisfies checkTemperatureConflict's anthropic gate (which fails only when
        // anthropicEffort is set), so temperature survives without any special-casing there.
        if (effort !== 'none') {
          resolved = { ...resolved, anthropicEffort: genericEffortToAnthropic(effort) };
        }
        break;
      case 'openai':
        resolved = { ...resolved, openAiEffort: genericEffortToOpenAi(effort) };
        break;
      case 'google':
        resolved = { ...resolved, geminiThinkingBudget: genericEffortToGemini(effort) };
        break;
      case 'xai':
        resolved = { ...resolved, xaiEffort: genericEffortToXai(effort) };
        break;
    }
  }

  const degradedValue = effortFieldFor(resolved, discriminator);
  const outcome = (): IThinkingResolution => ({
    resolved,
    noneDegraded: degraded && effortFieldFor(resolved, discriminator) === degradedValue
  });

  if (!config.providers) {
    return succeed(outcome());
  }

  // Partition into tiers 2 and 3+4
  const applicableBlocks = config.providers.filter((b) => blockApplies(b, resolvedModel, discriminator));
  const genericBlocks = applicableBlocks.filter((b) => !isModelSpecific(b));
  const specificBlocks = applicableBlocks.filter((b) => isModelSpecific(b));

  // Tier 2: provider-generic blocks (declaration order; later wins)
  for (const block of genericBlocks) {
    resolved = applyBlock(resolved, block, discriminator);
  }

  // Tier 3+4: model-specific + other blocks (declaration order; later wins)
  for (const block of specificBlocks) {
    resolved = applyBlock(resolved, block, discriminator);
  }

  return succeed(outcome());
}

/**
 * Applies a single config block to the accumulated resolved config.
 * @internal
 */
function applyBlock(
  current: IResolvedThinkingConfig,
  block: IThinkingProviderConfig,
  discriminator: ThinkingProviderDiscriminator
): IResolvedThinkingConfig {
  if (block.provider === 'other') {
    const merged =
      current.otherParams !== undefined ? { ...current.otherParams, ...block.config } : block.config;
    return { ...current, otherParams: merged };
  }

  switch (discriminator) {
    case 'anthropic':
      if (block.provider === 'anthropic') {
        if (block.config.effort !== undefined) {
          return { ...current, anthropicEffort: block.config.effort };
        }
      }
      break;
    case 'openai':
      if (block.provider === 'openai') {
        if (block.config.effort !== undefined) {
          return { ...current, openAiEffort: block.config.effort };
        }
      }
      break;
    case 'google':
      if (block.provider === 'google') {
        const updated: IResolvedThinkingConfig = { ...current };
        if (block.config.thinkingBudget !== undefined) {
          return { ...updated, geminiThinkingBudget: block.config.thinkingBudget };
        }
        return updated;
      }
      /* c8 ignore next - blockApplies guarantees provider match; unreachable for google */
      break;
    case 'xai':
      if (block.provider === 'xai') {
        if (block.config.effort !== undefined) {
          return { ...current, xaiEffort: block.config.effort };
        }
      }
      break;
  }
  return current;
}

// ============================================================================
// Temperature conflict check
// ============================================================================

/**
 * The temperature-conflict failure message. When the caller asked for `'none'` and the model
 * cannot run with thinking off, the effort that conflicts is the `'low'` that `'none'` was
 * degraded to (see `mergeThinkingConfig`), so the usual advice to "disable thinking" would tell
 * the caller to do what they already did. That case gets its own message.
 */
function temperatureConflict(provider: string, noneDegraded: boolean): Result<undefined> {
  if (noneDegraded) {
    return fail(
      `thinking effort 'none' was sent as 'low' because the model cannot run with thinking off, and ` +
        `thinking mode is not compatible with temperature on provider ${provider}: remove temperature`
    );
  }
  return fail(
    `thinking mode is not compatible with temperature on provider ${provider}: remove temperature or disable thinking`
  );
}

/**
 * Returns a Result.fail if temperature conflicts with thinking mode for the
 * given provider, otherwise succeed(undefined).
 *
 * Per D4: temperature + thinking = Result.fail for Anthropic, OpenAI (when
 * effective effort is non-null and non-'none'), and xAI (conservative default
 * pending live verification). Gemini accepts temperature alongside thinking.
 *
 * `noneDegraded` (from `resolveThinkingConfig`) says a generic `'none'` reached the wire as `'low'`.
 * It affects only the failure message, never the decision.
 *
 * @internal
 */
export function checkTemperatureConflict(
  resolved: IResolvedThinkingConfig,
  discriminator: ThinkingProviderDiscriminator,
  temperature: number | undefined,
  noneDegraded: boolean = false
): Result<undefined> {
  if (temperature === undefined) {
    return succeed(undefined);
  }

  switch (discriminator) {
    case 'anthropic':
      if (resolved.anthropicEffort !== undefined) {
        return temperatureConflict('anthropic', noneDegraded);
      }
      break;
    case 'openai':
      // 'none' disables reasoning; temperature is accepted in that case
      if (resolved.openAiEffort !== undefined && resolved.openAiEffort !== 'none') {
        return temperatureConflict('openai', noneDegraded);
      }
      break;
    case 'xai':
      // Conservative default: fail if xAI effort is active (per D8 — live verification pending)
      if (resolved.xaiEffort !== undefined && resolved.xaiEffort !== 'none') {
        return temperatureConflict('xai', noneDegraded);
      }
      break;
    case 'google':
      // Gemini accepts temperature alongside thinkingConfig — no conflict
      break;
  }
  return succeed(undefined);
}
