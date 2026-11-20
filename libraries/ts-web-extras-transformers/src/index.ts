/**
 * `@fgv/ts-web-extras-transformers` — Result-integration boundary over `@huggingface/transformers`
 * (browser-side).
 *
 * A thin facade that wraps `@huggingface/transformers` calls in `Result<T>` from `@fgv/ts-utils`,
 * mirroring the discipline established by `@fgv/ts-web-extras-webauthn`: one-line
 * `captureAsyncResult` wrappers around upstream primitives with **no opinionated orchestration**
 * above the boundary.
 *
 * The companion package `@fgv/ts-extras-transformers` provides the equivalent surface for Node
 * consumers. The upstream `@huggingface/transformers` library handles the Node/browser runtime
 * difference (ONNX node vs ONNX web backend) internally — the facade surface is intentionally
 * identical on both sides. The package split follows the fgv `ts-extras` / `ts-web-extras`
 * discipline: separate entry points preserve tree-shaking and allow divergence at B-4a if
 * browser-specific options surface (e.g. WebGPU device hints, IndexedDB cache configuration).
 *
 * **In scope:** `loadPipeline`, `classify`, `classifyAll`, `embed`, `summarize` — the task types
 * exercised by real consumers so far. The general `generate` primitive is explicitly deferred
 * until a concrete consumer use case surfaces (summarization is its own task-specific primitive).
 *
 * **Explicitly NOT in scope:**
 * - Pipeline cache / lifecycle management
 * - Model registry or download management
 * - GPU/CPU/WebGPU device selection policy
 * - Quantization selection
 * - Embedding-store integration
 * - Classifier label allowlists
 * - Request batching
 * - Pipeline dispose semantics
 * - IndexedDB cache configuration
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
  type SummarizationPipeline,
  type SummarizationOutput,
  type Tensor,
  type AllTasks,
  type PipelineType
} from '@huggingface/transformers';
import { captureAsyncResult, type Result } from '@fgv/ts-utils';

export type {
  TextClassificationPipeline,
  TextClassificationOutput,
  FeatureExtractionPipeline,
  SummarizationPipeline,
  SummarizationOutput,
  Tensor,
  AllTasks,
  PipelineType
};

export type { PretrainedModelOptions } from '@huggingface/transformers';

/**
 * Result-integration wrapper around `@huggingface/transformers`'s `pipeline` factory for
 * browser consumers.
 *
 * Loads a model and returns a ready-to-use pipeline object. The upstream library handles the
 * browser-specific runtime (ONNX web backend, WebGPU acceleration, IndexedDB model caching)
 * automatically.
 *
 * The returned pipeline is the upstream `AllTasks[T]` instance — consumers retain full access
 * to the upstream API. Lifecycle management (caching, disposal, WebGPU/WASM selection) is the
 * consumer's responsibility.
 *
 * Returns `Promise<Result<AllTasks[T]>>`; upstream errors (network, model-not-found, ONNX
 * initialization failures, WebGPU unavailability) are captured as `Failure` with the original
 * message.
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
 * Result-integration wrapper that invokes a `TextClassificationPipeline` on a single text input
 * for browser consumers.
 *
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
 * Result-integration wrapper that invokes a `FeatureExtractionPipeline` on a text input for
 * browser consumers.
 *
 * Returns the upstream `Tensor` Result-wrapped — no pooling, normalisation, or reshaping is
 * applied. Callers receive the raw output and are responsible for any downstream processing.
 *
 * Callers should retrieve the extractor via `loadPipeline('feature-extraction', modelId)`. The
 * upstream library automatically uses the ONNX web backend and WebGPU when available.
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

/**
 * Result-integration wrapper that invokes a `SummarizationPipeline` on a single text input for
 * browser consumers.
 *
 * Returns the upstream `SummarizationOutput` Result-wrapped (an array of `{ summary_text }`
 * entries; one for a single-string input).
 *
 * Callers should retrieve the summarizer via `loadPipeline('summarization', modelId)` — e.g.
 * `Xenova/distilbart-cnn-6-6`. This facade applies no opinionated orchestration (no length policy,
 * no local-vs-cloud routing) — `options` are passed through verbatim and the caller owns any
 * escalation decision.
 *
 * Returns `Promise<Result<SummarizationOutput>>`; upstream errors (inference failures, tokenisation
 * errors) are captured as `Failure` with the original message.
 *
 * @param summarizer - A `SummarizationPipeline` obtained from `loadPipeline`.
 * @param text - The text to summarize.
 * @param options - Optional upstream summarization options (e.g. `min_length`, `max_length`,
 *   `max_new_tokens`). Passed through verbatim to the pipeline call.
 *
 * @see https://huggingface.co/docs/transformers.js
 * @public
 */
export async function summarize(
  summarizer: SummarizationPipeline,
  text: string,
  options?: Parameters<SummarizationPipeline>[1]
): Promise<Result<SummarizationOutput>> {
  return captureAsyncResult(() => summarizer(text, options));
}
