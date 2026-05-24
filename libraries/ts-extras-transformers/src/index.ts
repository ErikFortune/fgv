/**
 * `@fgv/ts-extras-transformers` — Result-integration boundary over `@huggingface/transformers`
 * (Node-side).
 *
 * A thin facade that wraps `@huggingface/transformers` calls in `Result<T>` from `@fgv/ts-utils`,
 * mirroring the discipline established by `@fgv/ts-extras-webauthn`: one-line `captureAsyncResult`
 * wrappers around upstream primitives with **no opinionated orchestration** above the boundary.
 *
 * **In scope:** `loadPipeline`, `classify`, `classifyAll`, `embed` — the surface needed by the
 * B-3/B-4a local-classifier and embedding scenarios. `generate` is explicitly deferred until a
 * concrete consumer use case surfaces (see `phase-b2-result.md`).
 *
 * **Explicitly NOT in scope:**
 * - Pipeline cache / lifecycle management
 * - Model registry or download management
 * - GPU/CPU device selection policy
 * - Quantization selection
 * - Embedding-store integration
 * - Classifier label allowlists
 * - Request batching
 * - Pipeline dispose semantics
 *
 * For any of the above, use `@huggingface/transformers` directly (with `captureAsyncResult` for
 * your own Result wrapping).
 *
 * @packageDocumentation
 */

import {
  pipeline as _pipeline,
  type TextClassificationPipeline,
  type TextClassificationOutput,
  type FeatureExtractionPipeline,
  type Tensor,
  type AllTasks,
  type PipelineType
} from '@huggingface/transformers';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

export type {
  TextClassificationPipeline,
  TextClassificationOutput,
  FeatureExtractionPipeline,
  Tensor,
  AllTasks,
  PipelineType
};

export type { PretrainedModelOptions } from '@huggingface/transformers';

/**
 * Result-integration wrapper around `@huggingface/transformers`'s `pipeline` factory.
 * Loads a model and returns a ready-to-use pipeline object.
 *
 * The returned pipeline is the upstream `AllTasks[T]` instance — consumers retain full access
 * to the upstream API. Lifecycle management (caching, disposal, GPU/CPU selection) is the
 * consumer's responsibility.
 *
 * Returns `Promise<Result<AllTasks[T]>>`; upstream errors (network, model-not-found, ONNX
 * initialization failures) are captured as `Failure` with the original message.
 *
 * @param task - The pipeline task type (e.g. `'text-classification'`, `'feature-extraction'`).
 * @param model - The model identifier (HuggingFace Hub ID or local path). If omitted, the
 *   upstream default for the task is used.
 * @param options - Optional `PretrainedModelOptions` (device, dtype, cache_dir, etc.). Passed
 *   through verbatim to the upstream `pipeline()` call.
 *
 * @see https://huggingface.co/docs/transformers.js
 * @public
 */
export async function loadPipeline<T extends PipelineType>(
  task: T,
  model?: string,
  options?: Parameters<typeof _pipeline>[2]
): Promise<Result<AllTasks[T]>> {
  return captureAsyncResult(() => _pipeline(task, model, options));
}

/**
 * Normalises the upstream pipeline's output to a flat `TextClassificationOutput`.
 *
 * The upstream `TextClassificationPipeline` has an overloaded call signature: a single-string
 * input returns `TextClassificationOutput` (flat array), while a string-array input returns
 * `TextClassificationOutput[]` (array-of-arrays). Since `classify` always passes a single
 * string, the flat-array path is the live path. The nested-array branch is defensive and
 * ensures consumers always receive a flat array even if the upstream type union leaks through.
 */
function flattenIfNeeded(
  result: TextClassificationOutput | TextClassificationOutput[]
): TextClassificationOutput {
  if (Array.isArray(result) && result.length > 0 && !Array.isArray(result[0])) {
    return result as TextClassificationOutput;
  }
  // Defensive: if somehow an array-of-arrays came back, flatten one level.
  return (result as unknown as TextClassificationOutput[]).flat();
}

/**
 * Result-integration wrapper that invokes a `TextClassificationPipeline` on a single text input.
 * Returns the classification results as a flat `TextClassificationOutput` (array of
 * `{ label: string; score: number }` entries).
 *
 * Callers should retrieve the pipeline via `loadPipeline('text-classification', modelId)` (or the
 * `'sentiment-analysis'` alias). This helper always passes a single string to the upstream
 * pipeline and normalises the result to `TextClassificationOutput` so consumers don't need to
 * handle the `string | string[]` overload union.
 *
 * Returns `Promise<Result<TextClassificationOutput>>`; upstream errors (inference failures,
 * tokenisation errors) are captured as `Failure` with the original message.
 *
 * @param classifier - A `TextClassificationPipeline` obtained from `loadPipeline`.
 * @param text - The text to classify.
 * @param options - Optional upstream classification options (e.g. `{ top_k: null }` to return
 *   all labels). Passed through verbatim to the pipeline call.
 *
 * @see https://huggingface.co/docs/transformers.js
 * @public
 */
export async function classify(
  classifier: TextClassificationPipeline,
  text: string,
  options?: Parameters<TextClassificationPipeline>[1]
): Promise<Result<TextClassificationOutput>> {
  return captureAsyncResult(async () => {
    const result = await classifier(text, options);
    return flattenIfNeeded(result);
  });
}

/**
 * Convenience wrapper over `classify` that forces `top_k: null` so the full per-label vector
 * is returned for every call. Callers no longer need to remember to pass `{ top_k: null }`.
 *
 * Any caller-supplied options are honoured except `top_k`, which is always overridden to `null`.
 *
 * Returns `Promise<Result<TextClassificationOutput>>`; upstream errors are captured as `Failure`
 * with the original message.
 *
 * @param classifier - A `TextClassificationPipeline` obtained from `loadPipeline`.
 * @param text - The text to classify.
 * @param options - Optional upstream classification options. `top_k` is always set to `null`
 *   regardless of any value supplied here.
 *
 * @see https://huggingface.co/docs/transformers.js
 * @public
 */
export async function classifyAll(
  classifier: TextClassificationPipeline,
  text: string,
  options?: Parameters<TextClassificationPipeline>[1]
): Promise<Result<TextClassificationOutput>> {
  return classify(classifier, text, { ...options, top_k: null });
}

/**
 * Result-integration wrapper that invokes a `FeatureExtractionPipeline` on a text input.
 * Returns the upstream `Tensor` Result-wrapped — no pooling, normalisation, or reshaping is
 * applied. Callers receive the raw output and are responsible for any downstream processing.
 *
 * Callers should retrieve the extractor via `loadPipeline('feature-extraction', modelId)`.
 *
 * Returns `Promise<Result<Tensor>>`; upstream errors (inference failures, tokenisation errors)
 * are captured as `Failure` with the original message.
 *
 * @param extractor - A `FeatureExtractionPipeline` obtained from `loadPipeline`.
 * @param text - The text (or texts) to embed.
 * @param options - Optional upstream feature-extraction options (e.g. `pooling`, `normalize`).
 *   Passed through verbatim to the pipeline call.
 *
 * @see https://huggingface.co/docs/transformers.js
 * @public
 */
export async function embed(
  extractor: FeatureExtractionPipeline,
  text: string | string[],
  options?: Parameters<FeatureExtractionPipeline['_call']>[1]
): Promise<Result<Tensor>> {
  return captureAsyncResult(() => extractor(text, options));
}
