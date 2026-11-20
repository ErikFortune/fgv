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
 * Per-model Gemini thinking levels.
 * @packageDocumentation
 */

import { type StringOneOf } from '@fgv/ts-utils';

import { type IAiProviderDescriptor, isExactOrDashBoundedPrefix } from './model';

/**
 * Every {@link AiAssist.GeminiThinkingLevel}, lowest first. The same array feeds the
 * `geminiThinkingLevel` converter.
 * @public
 */
export const allGeminiThinkingLevels = ['minimal', 'low', 'medium', 'high'] as const;

/**
 * A Gemini `generationConfig.thinkingConfig.thinkingLevel` value.
 *
 * @remarks
 * `'minimal'` "matches the 'no thinking' setting for most queries" but does not guarantee that
 * thinking is off. Which levels a model accepts is per model (see
 * {@link AiAssist.IAiProviderDescriptor.geminiThinkingLevels}); a level a model does not list is a
 * provider error.
 * @public
 */
export type GeminiThinkingLevel = StringOneOf<typeof allGeminiThinkingLevels>;

/**
 * One entry in {@link AiAssist.IAiProviderDescriptor.geminiThinkingLevels}: a Gemini model controlled by
 * `thinkingLevel` rather than `thinkingBudget`, and the levels it accepts.
 * @public
 */
export interface IGeminiThinkingLevelRule {
  /** A concrete model id, matched exact-or-dash-bounded. */
  readonly modelPrefix: string;
  /** The levels the model accepts, lowest first. The first entry is the model's lowest level. */
  readonly levels: ReadonlyArray<GeminiThinkingLevel>;
}

/**
 * The thinking levels a concrete (already-resolved) Gemini model accepts, per the descriptor's
 * {@link AiAssist.IAiProviderDescriptor.geminiThinkingLevels} (exact-or-dash-bounded match; when several
 * rules match, the longest `modelPrefix` wins).
 *
 * @param descriptor - The provider descriptor supplying the rules.
 * @param modelId - The resolved concrete model id.
 * @returns The matching rule's levels (lowest first), or `undefined` when no rule matches — the
 * model is sent `thinkingBudget`.
 * @public
 */
export function resolveGeminiThinkingLevels(
  descriptor: IAiProviderDescriptor,
  modelId: string
): ReadonlyArray<GeminiThinkingLevel> | undefined {
  let best: IGeminiThinkingLevelRule | undefined;
  for (const rule of descriptor.geminiThinkingLevels ?? []) {
    if (
      isExactOrDashBoundedPrefix(modelId, rule.modelPrefix) &&
      (best === undefined || rule.modelPrefix.length > best.modelPrefix.length)
    ) {
      best = rule;
    }
  }
  return best?.levels;
}

/**
 * Google Gemini-specific thinking configuration.
 * @public
 */
export interface IGeminiThinkingConfig {
  /**
   * Token budget for thinking. Maps 1:1 to `thinkingBudget` on the wire.
   * - 0: disable thinking (Flash and Flash-Lite only; error on Pro)
   * - positive integer: soft token cap
   * - -1: dynamic
   * - omitted: model default
   *
   * @remarks
   * Deprecated by Google on Gemini 4, where a lone budget "maps to the nearest `thinkingLevel` …
   * and returns a warning". Cannot be combined with {@link AiAssist.IGeminiThinkingConfig.thinkingLevel}.
   */
  readonly thinkingBudget?: number;
  /**
   * Thinking level. Maps 1:1 to `thinkingLevel` on the wire, in place of any budget.
   *
   * @remarks
   * Validated before the wire: the value must be a {@link AiAssist.GeminiThinkingLevel}, and on a
   * model with a level declaration ({@link AiAssist.IAiProviderDescriptor.geminiThinkingLevels}) one of that
   * model's levels. On a model with none it is sent verbatim. Setting it together with
   * {@link AiAssist.IGeminiThinkingConfig.thinkingBudget} in one block is refused: Gemini 4 returns a 400
   * for the pair, and no model documents a meaning for it.
   */
  readonly thinkingLevel?: GeminiThinkingLevel;
  /**
   * Whether to include thought summaries in the response.
   * @remarks
   * Reserved for forward compatibility and **currently ignored by every
   * adapter** — nothing reads this field, so setting it has no effect on the
   * request. Surfacing thinking output as stream events is not yet built.
   */
  readonly includeThoughts?: boolean;
}

/**
 * Whether a concrete (already-resolved) Gemini model rejects `thinkingLevel` altogether, per the
 * descriptor's {@link AiAssist.IAiProviderDescriptor.geminiThinkingLevelRejectedModelPrefixes}
 * (exact-or-dash-bounded match).
 *
 * @param descriptor - The provider descriptor supplying the prefixes.
 * @param modelId - The resolved concrete model id.
 * @returns `true` when an explicit `thinkingLevel` is refused for `modelId` before the wire.
 * @public
 */
export function rejectsGeminiThinkingLevel(descriptor: IAiProviderDescriptor, modelId: string): boolean {
  return (
    descriptor.geminiThinkingLevelRejectedModelPrefixes?.some((p) =>
      isExactOrDashBoundedPrefix(modelId, p)
    ) ?? false
  );
}

/**
 * What a concrete Gemini model accepts on the thinking wire: its declared levels (the
 * `thinkingLevel` wire, see {@link AiAssist.resolveGeminiThinkingLevels}), and whether it rejects
 * `thinkingLevel` altogether (see {@link AiAssist.rejectsGeminiThinkingLevel}).
 * @internal
 */
export interface IGeminiModelThinking {
  readonly levels?: ReadonlyArray<GeminiThinkingLevel>;
  readonly rejectsLevel: boolean;
}

/**
 * Reads {@link IGeminiModelThinking} for `modelId` off the descriptor.
 * @internal
 */
export function resolveGeminiModelThinking(
  descriptor: IAiProviderDescriptor,
  modelId: string
): IGeminiModelThinking {
  return {
    levels: resolveGeminiThinkingLevels(descriptor, modelId),
    rejectsLevel: rejectsGeminiThinkingLevel(descriptor, modelId)
  };
}
