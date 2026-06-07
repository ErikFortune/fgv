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
 * Cross-provider embedding client for AI assist. Mirrors the completion and
 * image-generation primitives in `apiClient.ts`: a single dispatcher
 * ({@link AiAssist.callProviderEmbedding}) resolves the provider descriptor's
 * embedding capability and routes to the per-format adapter. `text -> vector`,
 * batch in, `number[][]` out.
 *
 * @packageDocumentation
 */

import { fail, type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import {
  type AiEmbeddingApiFormat,
  type IAiEmbeddingModelCapability,
  type IAiEmbeddingParams,
  type IAiEmbeddingResult,
  type IAiEmbeddingUsage,
  type IAiProviderDescriptor,
  type ModelSpec,
  resolveModel
} from './model';
import { bearerAuthHeader, resolveEffectiveBaseUrl } from './endpoint';
import { resolveEmbeddingCapability, supportsEmbedding } from './registry';
import { type IAiApiConfig, fetchJson } from './http';

// ============================================================================
// Request types
// ============================================================================

/**
 * Parameters for a provider embedding request. Mirrors
 * {@link AiAssist.IProviderImageGenerationParams}.
 * @public
 */
export interface IProviderEmbeddingParams {
  /** The provider descriptor. */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication (empty string for keyless self-hosted providers). */
  readonly apiKey: string;
  /** The embedding request (input + optional knobs). */
  readonly params: IAiEmbeddingParams;
  /**
   * Optional model override — string or context-aware map. Uses
   * `descriptor.defaultModel.embedding` otherwise. Self-hosted providers
   * (`ollama`, `openai-compat`) have no default and require this.
   */
  readonly modelOverride?: ModelSpec;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Optional abort signal for cancelling the in-flight request. */
  readonly signal?: AbortSignal;
  /** Optional override of the descriptor's base URL; the `/embeddings` suffix is appended unchanged. */
  readonly endpoint?: string;
}

// ============================================================================
// OpenAI-format (`/v1/embeddings`) response validators
// ============================================================================

/** @internal */
interface IOpenAiEmbeddingItem {
  index: number;
  embedding: number[];
}
/** @internal */
interface IOpenAiEmbeddingUsage {
  prompt_tokens?: number;
  total_tokens?: number;
}
/** @internal */
interface IOpenAiEmbeddingResponse {
  data: IOpenAiEmbeddingItem[];
  model?: string;
  usage?: IOpenAiEmbeddingUsage;
}

const openAiEmbeddingItem: Validator<IOpenAiEmbeddingItem> = Validators.object<IOpenAiEmbeddingItem>({
  index: Validators.number,
  embedding: Validators.arrayOf(Validators.number)
});
const openAiEmbeddingUsage: Validator<IOpenAiEmbeddingUsage> = Validators.object<IOpenAiEmbeddingUsage>({
  prompt_tokens: Validators.number.optional(),
  total_tokens: Validators.number.optional()
});
const openAiEmbeddingResponse: Validator<IOpenAiEmbeddingResponse> =
  Validators.object<IOpenAiEmbeddingResponse>({
    data: Validators.arrayOf(openAiEmbeddingItem).withConstraint((arr) => arr.length > 0),
    model: Validators.string.optional(),
    usage: openAiEmbeddingUsage.optional()
  });

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Normalizes the `input` field (string | string[]) into a concrete string array.
 * @internal
 */
function toInputArray(input: string | ReadonlyArray<string>): ReadonlyArray<string> {
  return typeof input === 'string' ? [input] : input;
}

/**
 * Builds an {@link IAiEmbeddingUsage} from OpenAI-format usage, or `undefined`
 * when no token counts are reported.
 * @internal
 */
function toEmbeddingUsage(usage: IOpenAiEmbeddingUsage | undefined): IAiEmbeddingUsage | undefined {
  if (usage === undefined || (usage.prompt_tokens === undefined && usage.total_tokens === undefined)) {
    return undefined;
  }
  return {
    ...(usage.prompt_tokens !== undefined ? { promptTokens: usage.prompt_tokens } : {}),
    ...(usage.total_tokens !== undefined ? { totalTokens: usage.total_tokens } : {})
  };
}

// ============================================================================
// OpenAI-format adapter
// ============================================================================

/**
 * Calls the OpenAI `/v1/embeddings` endpoint. Serves OpenAI, Ollama (via `/v1`),
 * openai-compat self-hosted servers, and Mistral. Sends `dimensions` only when
 * the capability declares `supportsDimensions`; always requests
 * `encoding_format: 'float'`.
 *
 * @remarks
 * `encoding_format: 'float'` is a known assumption (design §14 #5): a strict
 * openai-compat server could in principle reject the field, but mainstream
 * servers accept it and it keeps us off the base64 decode path. Low risk.
 *
 * @internal
 */
async function callOpenAiEmbeddings(
  config: IAiApiConfig,
  inputs: ReadonlyArray<string>,
  request: IAiEmbeddingParams,
  capability: IAiEmbeddingModelCapability,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiEmbeddingResult>> {
  const body: Record<string, unknown> = {
    model: config.model,
    input: inputs,
    encoding_format: 'float'
  };
  if (capability.supportsDimensions && request.dimensions !== undefined) {
    body.dimensions = request.dimensions;
  }
  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI embedding: format=openai-embeddings, model=${config.model}, inputs=${inputs.length}`);

  const jsonResult = await fetchJson(`${config.baseUrl}/embeddings`, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return openAiEmbeddingResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `OpenAI embeddings API response: ${msg}`)
    .onSuccess((response) => {
      // The spec allows `data` in any order; align to request order by `index`.
      const ordered = [...response.data].sort((a, b) => a.index - b.index);
      // Validate the response is well-formed against the request before trusting
      // the alignment: a compat server could return an incomplete batch, gapped
      // or duplicate indices, or ragged dimensions — all of which would silently
      // yield misaligned/partial vectors. (inputs is non-empty here; the
      // empty-input case short-circuits before the wire call.)
      if (ordered.length !== inputs.length) {
        return fail(
          `OpenAI embeddings API response: expected ${inputs.length} embedding(s), got ${ordered.length}`
        );
      }
      // After sorting, a perfect 0..n-1 sequence has item.index === position at
      // every slot. Any gap OR duplicate shifts a later element off its position
      // (the second copy of value k, or the element after a missing k, lands at
      // position > its index), so this single walk catches both.
      const misindexed = ordered.findIndex((item, i) => item.index !== i);
      if (misindexed !== -1) {
        return fail(
          `OpenAI embeddings API response: malformed embedding indices ` +
            `(expected 0..${inputs.length - 1}; gap or duplicate at position ${misindexed})`
        );
      }
      const vectors = ordered.map((item) => item.embedding);
      const dimensions = vectors[0].length;
      const ragged = vectors.findIndex((v) => v.length !== dimensions);
      if (ragged !== -1) {
        return fail(
          `OpenAI embeddings API response: inconsistent vector dimensionality ` +
            `(vector ${ragged} has length ${vectors[ragged].length}, expected ${dimensions})`
        );
      }
      const usage = toEmbeddingUsage(response.usage);
      return succeed({
        vectors,
        model: response.model ?? config.model,
        dimensions,
        ...(usage !== undefined ? { usage } : {})
      });
    });
}

// ============================================================================
// Gemini-format (`:batchEmbedContents`) response validators + adapter
// ============================================================================

/** @internal */
interface IGeminiEmbedding {
  values: number[];
}
/** @internal */
interface IGeminiEmbeddingResponse {
  embeddings: IGeminiEmbedding[];
}

const geminiEmbedding: Validator<IGeminiEmbedding> = Validators.object<IGeminiEmbedding>({
  values: Validators.arrayOf(Validators.number)
});
const geminiEmbeddingResponse: Validator<IGeminiEmbeddingResponse> =
  Validators.object<IGeminiEmbeddingResponse>({
    embeddings: Validators.arrayOf(geminiEmbedding).withConstraint((arr) => arr.length > 0)
  });

/**
 * Maps a cross-provider {@link AiAssist.AiEmbeddingTaskType} (kebab-case) to the
 * Gemini wire form (`SCREAMING_SNAKE_CASE`), e.g. `'retrieval-document'` becomes
 * `'RETRIEVAL_DOCUMENT'`.
 * @internal
 */
function toGeminiTaskType(taskType: string): string {
  return taskType.replace(/-/g, '_').toUpperCase();
}

/**
 * Strips a leading `models/` from a model id so the URL path and the per-request
 * `model` field can each apply the prefix exactly once.
 * @internal
 */
function bareGeminiModel(model: string): string {
  return model.startsWith('models/') ? model.slice('models/'.length) : model;
}

/**
 * Calls the Google Gemini `:batchEmbedContents` endpoint. Always uses the batch
 * route (a single input is a one-element batch). Sends `taskType` /
 * `outputDimensionality` only when the capability declares support. Gemini does
 * not report token usage for embeddings, so `usage` is omitted.
 * @internal
 */
async function callGeminiEmbeddings(
  config: IAiApiConfig,
  inputs: ReadonlyArray<string>,
  request: IAiEmbeddingParams,
  capability: IAiEmbeddingModelCapability,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiEmbeddingResult>> {
  const bare = bareGeminiModel(config.model);
  const qualified = `models/${bare}`;
  // `request.taskType` is the open `AiEmbeddingTaskType` union (includes `string & {}`),
  // which `!== undefined` cannot narrow to `string`; resolve it cast-free here.
  const taskType =
    capability.supportsTaskType && request.taskType !== undefined
      ? toGeminiTaskType(request.taskType)
      : undefined;
  const sendDimensions = capability.supportsDimensions && request.dimensions !== undefined;

  const requests = inputs.map((text) => ({
    model: qualified,
    content: { parts: [{ text }] },
    ...(taskType !== undefined ? { taskType } : {}),
    ...(sendDimensions ? { outputDimensionality: request.dimensions } : {})
  }));
  const body: Record<string, unknown> = { requests };
  const headers: Record<string, string> = { 'x-goog-api-key': config.apiKey };
  const url = `${config.baseUrl}/models/${bare}:batchEmbedContents`;

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI embedding: format=gemini-embeddings, model=${bare}, inputs=${inputs.length}`);

  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return geminiEmbeddingResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Gemini embeddings API response: ${msg}`)
    .onSuccess((response) => {
      // Gemini returns embeddings aligned to request order (no index field), so
      // there is no per-item index to re-sort or gap-check (unlike the OpenAI
      // path). Validate the response is well-formed against the request before
      // trusting the positional alignment: a truncated batch or ragged
      // dimensions would silently yield misaligned/partial vectors. (inputs is
      // non-empty here; the empty-input case short-circuits before the wire call.)
      const vectors = response.embeddings.map((e) => e.values);
      if (vectors.length !== inputs.length) {
        return fail(
          `Gemini embeddings API response: expected ${inputs.length} embedding(s), got ${vectors.length}`
        );
      }
      const dimensions = vectors[0].length;
      const ragged = vectors.findIndex((v) => v.length !== dimensions);
      if (ragged !== -1) {
        return fail(
          `Gemini embeddings API response: inconsistent vector dimensionality ` +
            `(vector ${ragged} has length ${vectors[ragged].length}, expected ${dimensions})`
        );
      }
      const result: IAiEmbeddingResult = { vectors, model: bare, dimensions };
      return succeed(result);
    });
}

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Notes any caller-supplied embedding knobs that the resolved capability does
 * not honor. Per design §7 these are a no-op (logged, never a failure) so a
 * cross-provider call site can pass `taskType`/`dimensions` once and have them
 * apply only where supported.
 * @internal
 */
function noteUnsupportedKnobs(
  model: string,
  request: IAiEmbeddingParams,
  capability: IAiEmbeddingModelCapability,
  logger?: Logging.ILogger
): void {
  if (logger === undefined) {
    return;
  }
  if (request.taskType !== undefined && !capability.supportsTaskType) {
    logger.info(`AI embedding: model "${model}" ignores taskType (not supported); proceeding without it`);
  }
  if (request.dimensions !== undefined && !capability.supportsDimensions) {
    logger.info(`AI embedding: model "${model}" ignores dimensions (not supported); proceeding without it`);
  }
}

/**
 * Calls the appropriate embedding API for a given provider. Routes by the
 * `format` of the resolved {@link AiAssist.IAiEmbeddingModelCapability}:
 * `'openai-embeddings'` or `'gemini-embeddings'`.
 *
 * @remarks
 * - Rejects up front when the provider declares no embedding capability, when no
 *   embedding model resolves, or when the batch exceeds the capability's
 *   `maxBatchSize` (no auto-chunking).
 * - An empty `input` array short-circuits to an empty result with no wire call
 *   (most providers HTTP-400 on empty input).
 * - Caller-supplied `dimensions`/`taskType` that the model doesn't support are a
 *   no-op (logged), not a failure (design §7).
 *
 * @param params - Request parameters including descriptor, API key, and input.
 * @returns The embedding vectors aligned to input order, or a failure.
 * @public
 */
export async function callProviderEmbedding(
  params: IProviderEmbeddingParams
): Promise<Result<IAiEmbeddingResult>> {
  const { descriptor, apiKey, params: request, modelOverride, logger, signal, endpoint } = params;

  if (!supportsEmbedding(descriptor)) {
    return fail(`provider "${descriptor.id}" does not support embeddings`);
  }

  const model = resolveModel(modelOverride ?? descriptor.defaultModel, 'embedding');
  if (model.length === 0) {
    return fail(
      `provider "${descriptor.id}": no embedding model resolved; ` +
        `pass modelOverride or set descriptor.defaultModel ` +
        `(a plain string, or an object with an "embedding" entry)`
    );
  }

  const capability = resolveEmbeddingCapability(descriptor, model);
  if (capability === undefined) {
    return fail(`provider "${descriptor.id}" does not support embeddings for model "${model}"`);
  }

  const inputs = toInputArray(request.input);
  if (inputs.length === 0) {
    // Short-circuit: empty batch never hits the wire (design §14 #2).
    return succeed({ vectors: [], model, dimensions: 0 });
  }
  if (capability.maxBatchSize !== undefined && inputs.length > capability.maxBatchSize) {
    return fail(
      `provider "${descriptor.id}": embedding batch of ${inputs.length} exceeds ` +
        `model "${model}" maximum of ${capability.maxBatchSize}`
    );
  }

  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }

  noteUnsupportedKnobs(model, request, capability, logger);

  const config: IAiApiConfig = { baseUrl: baseUrlResult.value, apiKey, model };

  return dispatchEmbedding(capability.format, config, inputs, request, capability, logger, signal);
}

/**
 * Routes a resolved embedding request to the per-format adapter.
 * @internal
 */
function dispatchEmbedding(
  format: AiEmbeddingApiFormat,
  config: IAiApiConfig,
  inputs: ReadonlyArray<string>,
  request: IAiEmbeddingParams,
  capability: IAiEmbeddingModelCapability,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiEmbeddingResult>> {
  switch (format) {
    case 'openai-embeddings':
      return callOpenAiEmbeddings(config, inputs, request, capability, logger, signal);
    case 'gemini-embeddings':
      return callGeminiEmbeddings(config, inputs, request, capability, logger, signal);
    /* c8 ignore next 4 - defensive: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = format;
      return Promise.resolve(fail(`unsupported embedding API format: ${String(_exhaustive)}`));
    }
  }
}

// ============================================================================
// Proxied embedding
// ============================================================================

const proxiedEmbeddingUsage: Validator<IAiEmbeddingUsage> = Validators.object<IAiEmbeddingUsage>({
  promptTokens: Validators.number.optional(),
  totalTokens: Validators.number.optional()
});
const proxiedEmbeddingResponse: Validator<IAiEmbeddingResult> = Validators.object<IAiEmbeddingResult>({
  vectors: Validators.arrayOf(Validators.arrayOf(Validators.number)),
  model: Validators.string,
  dimensions: Validators.number,
  usage: proxiedEmbeddingUsage.optional()
});

/**
 * Calls the embedding endpoint on a proxy server instead of calling the provider
 * API directly from the browser. Endpoint: `POST ${proxyUrl}/api/ai/embedding`.
 * Request body: `{ providerId, apiKey, params, modelOverride? }`. The proxy
 * handles descriptor lookup, model/capability resolution, and provider dispatch.
 * Error body `{ error: string }` is surfaced as `proxy: ${error}`.
 *
 * @param proxyUrl - Base URL of the proxy server (e.g. `http://localhost:3001`).
 * @param params - Same parameters as {@link AiAssist.callProviderEmbedding}.
 * @returns The embedding result, or a failure.
 * @public
 */
export async function callProxiedEmbedding(
  proxyUrl: string,
  params: IProviderEmbeddingParams
): Promise<Result<IAiEmbeddingResult>> {
  const { descriptor, apiKey, params: request, modelOverride, logger, signal } = params;

  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey,
    params: request
  };
  if (modelOverride !== undefined) {
    body.modelOverride = modelOverride;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI embedding proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/embedding`;
  const jsonResult = await fetchJson(url, {}, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const response = jsonResult.value;
  if (typeof response.error === 'string') {
    return fail(`proxy: ${response.error}`);
  }

  return proxiedEmbeddingResponse
    .validate(response)
    .withErrorFormat((msg) => `proxy returned invalid response: ${msg}`);
}
