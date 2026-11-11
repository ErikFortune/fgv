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

import { fail, formatValueForMessage, type Result, succeed } from '@fgv/ts-utils';
import type { ModelSpec, ModelSpecKey } from './model';

/**
 * Default context key used as fallback when resolving a {@link AiAssist.ModelSpec}.
 * @public
 */
export const MODEL_SPEC_BASE_KEY: ModelSpecKey = 'base';

/**
 * Ordered fallback candidates for each quality-tier context key.
 *
 * @remarks
 * A `frontier` request cascades `frontier → advanced → base`; an `advanced`
 * request cascades `advanced → base`. Any context not listed here (the
 * `image`/`embedding` modality keys, or an arbitrary caller-supplied string)
 * resolves flat — just the context itself, then the shared `base` fallback
 * below — matching the pre-tier behavior. `base` maps to `['base']` so a
 * `base` request never over-reaches into a tier branch.
 */
const TIER_FALLBACK: { readonly [k: string]: ReadonlyArray<ModelSpecKey> } = {
  base: ['base'],
  advanced: ['advanced', 'base'],
  frontier: ['frontier', 'advanced', 'base']
};

/**
 * Resolves a {@link AiAssist.ModelSpec} to a concrete model string given an optional context key.
 *
 * @remarks
 * Resolution rules:
 * 1. If the spec is a string, return it directly (context is irrelevant).
 * 2. If the spec is an object, walk the ordered candidate keys for the context:
 *    a quality-tier context (`advanced`/`frontier`) cascades through the
 *    tier-fallback table (`frontier → advanced → base`, `advanced → base`);
 *    every other context resolves flat (`[context]`); `undefined` resolves to
 *    the shared `base` fallback. The first present key wins.
 * 3. Otherwise, fall back to the {@link AiAssist.MODEL_SPEC_BASE_KEY | 'base'} key.
 * 4. If neither context nor `'base'` exists, use the first available value; an
 *    empty spec resolves to `''`.
 *
 * A spec outside the {@link AiAssist.ModelSpec} type — a key holding `undefined`, `null` or a
 * number, reachable from untyped JSON or a cast — also resolves to `''` rather than throwing. Use
 * {@link AiAssist.resolveProviderModel} for a `Failure` that names the provider and the offending key.
 *
 * @param spec - The model specification to resolve
 * @param context - Optional context key (e.g. `'advanced'`)
 * @returns The resolved model string
 * @public
 */
export function resolveModel(spec: ModelSpec, context?: string): string {
  return walkModelSpec(spec, context, 'spec').orDefault('');
}

/**
 * The walk behind {@link AiAssist.resolveModel} and {@link AiAssist.resolveProviderModel}: the same
 * rules, failing with the dotted path of a key whose value is neither a model id nor a spec object.
 * @internal
 */
export function walkModelSpec(spec: ModelSpec, context: string | undefined, path: string): Result<string> {
  if (typeof spec === 'string') {
    return succeed(spec);
  }
  // `ModelSpec` excludes this, but untyped JSON or a cast does not: refuse the value here rather
  // than let the `in` below throw on it.
  if (typeof spec !== 'object' || spec === null) {
    return fail(
      `model spec ${path} is ${formatValueForMessage(spec)}: expected a model id or a model spec object`
    );
  }

  // Ordered candidate keys for this context: a tier key cascades via
  // TIER_FALLBACK; any other key resolves flat as [context]; undefined drops
  // straight to the shared 'base' fallback below.
  // Own keys only, in the spec and in the fallback table: `in` and a plain index would also find
  // `Object.prototype` members, so a context such as `'constructor'` would walk into a function
  // instead of falling back to `base`.
  const hasOwn = (target: object, candidate: string): boolean =>
    Object.prototype.hasOwnProperty.call(target, candidate);
  const order: ReadonlyArray<string> =
    context === undefined ? [] : hasOwn(TIER_FALLBACK, context) ? TIER_FALLBACK[context] : [context];
  const own = (candidate: string): boolean => hasOwn(spec, candidate);
  const key = order.find(own) ?? (own(MODEL_SPEC_BASE_KEY) ? MODEL_SPEC_BASE_KEY : Object.keys(spec)[0]);
  // Last resort exhausted: an empty spec names no model.
  if (key === undefined) {
    return succeed('');
  }
  return walkModelSpec(spec[key], undefined, `${path}.${key}`);
}
