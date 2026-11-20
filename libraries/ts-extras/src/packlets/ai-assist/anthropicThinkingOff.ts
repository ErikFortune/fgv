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
 * Per-model Anthropic thinking-off values.
 * @packageDocumentation
 */

import { type IAiProviderDescriptor, isExactOrDashBoundedPrefix } from './model';

/**
 * The `thinking.type` an Anthropic adaptive-thinking model is sent to turn thinking off.
 *
 * @remarks
 * `'disabled'` is the default. `'between_tools'` is the off value on a model that rejects
 * `'disabled'` and instead stops thinking before it responds, while still returning the short
 * updates it writes between tool calls as thinking blocks.
 * @public
 */
export type AnthropicThinkingOffType = 'disabled' | 'between_tools';

/**
 * One entry in {@link IAiProviderDescriptor.anthropicThinkingOffTypes}.
 * @public
 */
export interface IAnthropicThinkingOffRule {
  /** A concrete model id, matched exact-or-dash-bounded. */
  readonly modelPrefix: string;
  /** The `thinking.type` that turns thinking off on a matching model. */
  readonly type: AnthropicThinkingOffType;
}

/**
 * The `thinking.type` that turns thinking off on a concrete (already-resolved) Anthropic model, per
 * the descriptor's {@link IAiProviderDescriptor.anthropicThinkingOffTypes} (exact-or-dash-bounded
 * match, first rule wins).
 *
 * @param descriptor - The provider descriptor supplying the rules.
 * @param modelId - The resolved concrete model id.
 * @returns The matching rule's type, or `'disabled'` when no rule matches.
 * @public
 */
export function resolveAnthropicThinkingOffType(
  descriptor: IAiProviderDescriptor,
  modelId: string
): AnthropicThinkingOffType {
  return (
    descriptor.anthropicThinkingOffTypes?.find((r) => isExactOrDashBoundedPrefix(modelId, r.modelPrefix))
      ?.type ?? 'disabled'
  );
}
