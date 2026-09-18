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
 * Request-level prompt-caching plan (design.md §6.1) and the shared validation + splitting logic
 * every adapter that emits cache breakpoints (Anthropic, OpenAI) uses, so the ascending/range/cap
 * rules live in exactly one place rather than being re-derived per adapter.
 *
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';

/**
 * A request-level prompt-caching plan.
 *
 * @remarks
 * Offsets rather than content blocks — see design.md §6.1 for why: `AiPrompt`/`IChatRequest`
 * carry `system` as a plain string, offsets are usable without `@fgv/ts-prompt-assist` (a
 * caller can say "the first 4,000 characters of my system prompt are stable" directly), and
 * they are already the currency `IPromptSection.start`/`.chars` report.
 * @public
 */
export interface IAiCacheRequest {
  /**
   * Strictly ascending UTF-16 offsets into `AiPrompt.system` (equivalently
   * `IProviderCompletionParams.system`), each marking the end of a cacheable prefix. Each must
   * be an integer `> 0` and `< system.length`. Validated where the offsets are actually used
   * (against the request's own `system.length`, and optionally against a cap) — never clamped;
   * an invalid plan fails the request rather than silently caching less than declared.
   */
  readonly systemBreakpoints?: ReadonlyArray<number>;
  /**
   * Opaque cache-routing key, sent where the provider has one (OpenAI `prompt_cache_key`).
   * Ignored by adapters that have no such concept.
   */
  readonly cacheKey?: string;
}

/**
 * Validates an {@link IAiCacheRequest}'s `systemBreakpoints` against the length of the `system`
 * string they index into, and optionally against a per-model write cap.
 *
 * @remarks
 * **Fails loudly, never clamps** (design.md §6.1): a non-ascending, out-of-range, or over-cap
 * offset returns `fail()`. A silently-clamped breakpoint is precisely the silent, non-caching
 * failure this stream exists to remove. `maxBreakpointWrites` is left to the caller to supply —
 * there is no model-keyed cap table in this package yet (design.md §7's `IAiCacheCapability` is
 * out of this slice's scope), and design.md §5.2 establishes that a caller producing breakpoints
 * from the three-level `PromptCacheStability` vocabulary never emits more than two, so an
 * omitted cap is not a soundness gap for that caller — only a direct caller supplying more than a
 * provider's cap would ever need one enforced here.
 *
 * Takes a length rather than {@link validateAiCacheRequest}'s `system` string because a caller
 * building a plan from an `@fgv/ts-prompt-assist` `IPromptComposition` (`totalChars`) has the
 * length without holding the resolved body text itself.
 * @public
 */
export function validateCacheBreakpoints(
  systemLength: number,
  cache: IAiCacheRequest,
  maxBreakpointWrites?: number
): Result<IAiCacheRequest> {
  const offsets = cache.systemBreakpoints;
  if (offsets === undefined || offsets.length === 0) {
    return succeed(cache);
  }
  if (maxBreakpointWrites !== undefined && offsets.length > maxBreakpointWrites) {
    return fail(
      `cache.systemBreakpoints has ${offsets.length} entries, exceeding the cap of ` +
        `${maxBreakpointWrites} for this request`
    );
  }
  let previous = 0;
  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i];
    if (!Number.isInteger(offset) || offset <= 0 || offset >= systemLength) {
      return fail(
        `cache.systemBreakpoints[${i}] (${offset}) must be an integer strictly between 0 and ` +
          `system.length (${systemLength})`
      );
    }
    if (offset <= previous) {
      return fail(
        `cache.systemBreakpoints must be strictly ascending; [${i}] (${offset}) does not exceed ` +
          `the preceding offset (${previous})`
      );
    }
    previous = offset;
  }
  return succeed(cache);
}

/**
 * Validates an {@link IAiCacheRequest}'s `systemBreakpoints` against the `system` string they
 * index into. Thin wrapper over {@link validateCacheBreakpoints} for a caller that holds the
 * actual string (every `ts-extras` adapter) rather than just its length.
 * @public
 */
export function validateAiCacheRequest(
  system: string,
  cache: IAiCacheRequest,
  maxBreakpointWrites?: number
): Result<IAiCacheRequest> {
  return validateCacheBreakpoints(system.length, cache, maxBreakpointWrites);
}

/**
 * One piece of `system` after splitting at its cache breakpoints. Concatenating every segment's
 * `text`, in order, reproduces `system` exactly.
 * @public
 */
export interface ICacheSystemSegment {
  /** This segment's text, a contiguous slice of the original `system` string. */
  readonly text: string;
  /**
   * True for the segment that ends a cacheable prefix — the one a provider's adapter should mark
   * with its native cache directive (Anthropic `cache_control`, OpenAI `prompt_cache_breakpoint`).
   * False for every other segment, including the final (volatile) tail after the last breakpoint.
   */
  readonly cacheBreakpoint: boolean;
}

/**
 * Splits `system` into cache-annotated segments per `cache.systemBreakpoints`, validating first.
 *
 * @remarks
 * When `cache` is `undefined` or declares no breakpoints, returns the whole string as a single
 * non-breakpointed segment — an un-annotated caller's request body is byte-identical to before
 * this feature existed (design.md §11). Shared by the Anthropic and OpenAI adapters so the
 * splitting logic (and its validation) is written once.
 * @internal
 */
export function splitSystemForCache(
  system: string,
  cache: IAiCacheRequest | undefined,
  maxBreakpointWrites?: number
): Result<ReadonlyArray<ICacheSystemSegment>> {
  if (cache?.systemBreakpoints === undefined || cache.systemBreakpoints.length === 0) {
    return succeed([{ text: system, cacheBreakpoint: false }]);
  }
  return validateAiCacheRequest(system, cache, maxBreakpointWrites).onSuccess((validated) => {
    const segments: ICacheSystemSegment[] = [];
    let start = 0;
    // `validateAiCacheRequest` already guarantees `systemBreakpoints` is defined, non-empty,
    // strictly ascending, and every offset is `> 0` and `< system.length`.
    for (const offset of validated.systemBreakpoints as ReadonlyArray<number>) {
      segments.push({ text: system.slice(start, offset), cacheBreakpoint: true });
      start = offset;
    }
    segments.push({ text: system.slice(start), cacheBreakpoint: false });
    return succeed(segments);
  });
}
