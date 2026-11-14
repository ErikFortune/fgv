/**
 * Thin embedding adapter — the only facade-touching surface in the scenario.
 *
 * Wraps the injected `embed` function (from either `@fgv/ts-extras-transformers`
 * for Node or `@fgv/ts-web-extras-transformers` for the browser) and extracts a
 * plain `number[]` from the returned `Tensor`.
 *
 * ## Facade agnosticism via injection
 *
 * `embedText` takes `embedFn` as a parameter rather than importing either
 * facade directly. Only type-only imports from `@fgv/ts-web-extras-transformers`
 * are present here — they are erased at compile time and pull no runtime facade
 * into the bundle. The web shell passes the browser facade's `embed`; the CLI
 * shell passes the Node facade's `embed` (loaded via a `webpackIgnore` dynamic
 * import).
 *
 * ## Tensor extraction
 *
 * `embed` is called with `{ pooling: 'mean', normalize: true }` so each input
 * string yields one normalized sentence vector. The resulting Tensor has shape
 * `[1, D]` for a single string input (batch size 1, D embedding dimensions).
 * `tensor.tolist()` returns a nested `any[][]`; row 0 (`result[0]`) is the
 * flat `number[]` vector for the first (and only) sentence.
 *
 * `tolist()` is typed as `any[]` by `@huggingface/transformers`. A single
 * bounded cast to `number[][]` is required to access the inner array; this is
 * safe because:
 *  - `pooling: 'mean'` reduces the token dimension → one row per input.
 *  - `normalize: true` scales the vector to unit length; element values stay in [−1, 1] (and may be negative).
 *  - The outer list length equals the number of input strings (1 here).
 *
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
// Type-only imports — erased by the TypeScript compiler; no runtime facade
// reference enters the web bundle from this module.
import type { FeatureExtractionPipeline, Tensor } from '@fgv/ts-web-extras-transformers';

/**
 * The `embed` operation as exposed by either transformers facade.
 * Injected into {@link embedText} so the adapter core depends on neither
 * concrete facade at runtime.
 *
 * @public
 */
export type EmbedFn = (
  extractor: FeatureExtractionPipeline,
  text: string | string[],
  options?: Parameters<FeatureExtractionPipeline['_call']>[1]
) => Promise<Result<Tensor>>;

/**
 * Embed a single text string and extract a `number[]` sentence vector.
 *
 * Uses `{ pooling: 'mean', normalize: true }` so the Tensor has shape `[1, D]`
 * and each element is a normalized float. Row 0 of `tolist()` is the vector.
 *
 * Returns `Result.fail` when:
 * - the `embed` call fails (e.g. inference error, model not loaded), or
 * - `tolist()` does not produce a non-empty nested array (defensive — should
 *   not occur with a valid `FeatureExtractionPipeline` + `pooling: 'mean'`).
 *
 * @param extractor - A `FeatureExtractionPipeline` obtained from `loadPipeline`.
 * @param text - The text to embed.
 * @param embedFn - Injected facade function.
 * @returns The sentence embedding as a `number[]`.
 *
 * @public
 */
export async function embedText(
  extractor: FeatureExtractionPipeline,
  text: string,
  embedFn: EmbedFn
): Promise<Result<number[]>> {
  return (await embedFn(extractor, text, { pooling: 'mean', normalize: true }))
    .withErrorFormat((message) => `embed failed for text "${text.slice(0, 40)}…": ${message}`)
    .onSuccess((tensor) => {
      // tolist() is typed as any[] by the upstream library. The [1, D] Tensor produced
      // by pooling: 'mean' on a single string returns [[...D floats...]]. The cast to
      // number[][] is safe given the known output shape.
      const nested = tensor.tolist() as number[][];
      /* c8 ignore next 3 - defensive: tolist() on a valid pooled Tensor always returns a non-empty nested array */
      if (nested.length === 0 || nested[0] === undefined || nested[0].length === 0) {
        return fail(`embed produced an empty Tensor for text "${text.slice(0, 40)}…"`);
      }
      return succeed(nested[0]);
    });
}
