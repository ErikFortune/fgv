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
 * Completion usage types: what a provider's wire shape can report about
 * prompt-cache reads/writes, and the normalized token accounting built from it.
 *
 * @remarks
 * Its own module rather than part of `model.ts` because it depends on nothing
 * there — `model.ts` imports it, not the reverse — and because `model.ts` was
 * at the `max-lines` cap. Same rationale as `structuredOutputTypes.ts`.
 * @packageDocumentation
 */

import { type JsonObject } from '@fgv/ts-json-base';

/**
 * What a provider's wire shape is able to report about prompt-cache usage,
 * given that a usage block was present on the response at all.
 *
 * @remarks
 * `'reads'` — cache reads are reported; cache writes cannot be (either the API
 * has no write concept, or the field structurally does not exist on this route).
 * `'reads-and-writes'` — both reads and writes are reported.
 *
 * There is deliberately no `'none'` member: "no usage was reported at all" is
 * already expressed by {@link AiAssist.IAiCompletionResponse.usage} itself
 * being absent, and a third value here would be a second, reachable-only-via-
 * bug way to say the same thing — check `usage === undefined`, not a `reports`
 * value, to detect that case.
 *
 * See {@link AiAssist.IAiCompletionUsage.reports} for why this is required
 * rather than optional.
 * @public
 */
export type AiCacheReportingLevel = 'reads' | 'reads-and-writes';

/**
 * Token accounting for a completion, normalized across providers.
 *
 * @remarks
 * Every field but `reports` is best-effort: a provider's wire shape reports
 * what it reports, and an absent field here means the corresponding wire
 * field was itself absent — never a guessed zero. See `reports` for the one
 * exception this rule has to be explicit about.
 * @public
 */
export interface IAiCompletionUsage {
  /**
   * What this response's wire shape *can* report about caching.
   *
   * @remarks
   * **Required, not optional.** An optional field would make an absent
   * `cacheWriteTokens` three-ways ambiguous — no write happened / this API
   * cannot report writes / a build predating the field — and disambiguating
   * exactly that is what this field exists for. Under `'reads-and-writes'`, an
   * absent `cacheWriteTokens` genuinely means zero tokens were written this
   * request — the actionable signal that a breakpoint did not take. Under
   * `'reads'` it means the API cannot say, and inferring "zero writes" from it
   * would be a fabricated fact. Same remedy as
   * `IAiCompletionResponse.structuredOutput`.
   */
  readonly reports: AiCacheReportingLevel;
  /** Input tokens **not** served from cache. Normalized — see `CAPABILITIES.md` for the per-provider table. */
  readonly uncachedInputTokens?: number;
  /** Input tokens served from cache. */
  readonly cachedInputTokens?: number;
  /**
   * Input tokens written to cache.
   *
   * @remarks
   * Two absence cases, disambiguated by `reports` — never by a `0` this field
   * itself carries:
   * - **`reports: 'reads-and-writes'` and this field absent** — the wire
   *   genuinely reported zero tokens written. Treat absence as `0`, not as
   *   unknown; this is the actionable "the breakpoint did not take" signal.
   * - **`reports: 'reads'` and this field absent** — the API cannot report
   *   writes on this route at all (structurally unfillable, e.g. OpenAI/xAI
   *   Chat Completions). Never defaulted to `0` here — that would fabricate a
   *   fact the wire never stated.
   */
  readonly cacheWriteTokens?: number;
  /** Generated output tokens. */
  readonly outputTokens?: number;
  /** Total input = uncached + cached, when both are known. */
  readonly totalInputTokens?: number;
  /** The provider's own usage block, unnormalized, for anything this shape drops. */
  readonly raw?: JsonObject;
}
