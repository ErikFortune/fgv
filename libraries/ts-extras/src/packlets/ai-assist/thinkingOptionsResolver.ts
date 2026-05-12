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
 * @internal
 */
export interface IResolvedThinkingConfig {
  /** Anthropic: output_config.effort value */
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
 * Maps generic effort to Anthropic wire effort. @internal
 */
function genericEffortToAnthropic(effort: 'low' | 'medium' | 'high'): IAnthropicThinkingConfig['effort'] {
  return effort; // 1:1 mapping for the common subset
}

/**
 * Maps generic effort to OpenAI wire effort. @internal
 */
function genericEffortToOpenAi(effort: 'low' | 'medium' | 'high'): IOpenAiThinkingConfig['effort'] {
  return effort; // 1:1 mapping for the common subset
}

/**
 * Maps generic effort to Gemini thinkingBudget. @internal
 */
function genericEffortToGemini(effort: 'low' | 'medium' | 'high'): number {
  switch (effort) {
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
function genericEffortToXai(effort: 'low' | 'medium' | 'high'): IXAiThinkingConfig['effort'] {
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
 * @param config - The caller's IThinkingConfig
 * @param resolvedModel - The concrete model string after registry resolution
 * @param discriminator - Coarse provider family
 * @returns Merged effective config for wire encoding
 * @internal
 */
export function mergeThinkingConfig(
  config: IThinkingConfig,
  resolvedModel: string,
  discriminator: ThinkingProviderDiscriminator
): Result<IResolvedThinkingConfig> {
  let resolved: IResolvedThinkingConfig = {};

  // Tier 1: generic effort → common-subset mapping
  if (config.effort !== undefined) {
    switch (discriminator) {
      case 'anthropic':
        resolved = { ...resolved, anthropicEffort: genericEffortToAnthropic(config.effort) };
        break;
      case 'openai':
        resolved = { ...resolved, openAiEffort: genericEffortToOpenAi(config.effort) };
        break;
      case 'google':
        resolved = { ...resolved, geminiThinkingBudget: genericEffortToGemini(config.effort) };
        break;
      case 'xai':
        resolved = { ...resolved, xaiEffort: genericEffortToXai(config.effort) };
        break;
    }
  }

  if (!config.providers) {
    return succeed(resolved);
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

  return succeed(resolved);
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
 * Returns a Result.fail if temperature conflicts with thinking mode for the
 * given provider, otherwise succeed(undefined).
 *
 * Per D4: temperature + thinking = Result.fail for Anthropic, OpenAI (when
 * effective effort is non-null and non-'none'), and xAI (conservative default
 * pending live verification). Gemini accepts temperature alongside thinking.
 *
 * @internal
 */
export function checkTemperatureConflict(
  resolved: IResolvedThinkingConfig,
  discriminator: ThinkingProviderDiscriminator,
  temperature: number | undefined
): Result<undefined> {
  if (temperature === undefined) {
    return succeed(undefined);
  }

  switch (discriminator) {
    case 'anthropic':
      if (resolved.anthropicEffort !== undefined) {
        return fail(
          'thinking mode is not compatible with temperature on provider anthropic: remove temperature or disable thinking'
        );
      }
      break;
    case 'openai':
      // 'none' disables reasoning; temperature is accepted in that case
      if (resolved.openAiEffort !== undefined && resolved.openAiEffort !== 'none') {
        return fail(
          'thinking mode is not compatible with temperature on provider openai: remove temperature or disable thinking'
        );
      }
      break;
    case 'xai':
      // Conservative default: fail if xAI effort is active (per D8 — live verification pending)
      if (resolved.xaiEffort !== undefined && resolved.xaiEffort !== 'none') {
        return fail(
          'thinking mode is not compatible with temperature on provider xai: remove temperature or disable thinking'
        );
      }
      break;
    case 'google':
      // Gemini accepts temperature alongside thinkingConfig — no conflict
      break;
  }
  return succeed(undefined);
}
