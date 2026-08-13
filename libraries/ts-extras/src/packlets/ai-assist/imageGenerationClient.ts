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
 * Image generation clients for AI assist. One dispatcher over the resolved
 * `IAiImageModelCapability.format`, the adapters it routes to (OpenAI images,
 * xAI generations and edits, Gemini image-out), their response validators, the
 * base64 attachment helpers only this modality uses, and the proxied variant.
 *
 * @packageDocumentation
 */

import { type JsonObject } from '@fgv/ts-json-base';
import { fail, type Logging, mapResults, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import {
  type IAiGeneratedImage,
  type IAiImageAttachment,
  type IAiImageGenerationParams,
  type IAiImageGenerationResponse,
  type IAiImageModelCapability,
  type IAiProviderDescriptor,
  type ModelSpec,
  resolveProviderModel
} from './model';
import {} from './thinkingOptionsResolver';
import {} from './chatRequestBuilders';
import { bearerAuthHeader, geminiAuthHeader, resolveEffectiveBaseUrl } from './endpoint';
import { type IAiApiConfig, fetchJson, fetchMultipart } from './http';
import { resolveImageCapability, supportsImageGeneration } from './registry';
import {
  resolveImageOptions,
  validateResolvedOptions,
  type IResolvedImageOptions
} from './imageOptionsResolver';

// ============================================================================
// Image attachment helpers
// ============================================================================

/**
 * Decodes a base64-encoded image attachment into a `Blob` suitable for use as
 * a multipart file field. On Node hands the `Buffer` straight to `Blob`
 * (Buffer extends Uint8Array) to skip an intermediate copy; falls back to
 * `atob` in browsers. Inputs come from `FileReader` or prior provider
 * responses, which are trusted to be valid. Note that Node's
 * `Buffer.from(..., 'base64')` silently strips invalid characters rather
 * than throwing, so failures are only observable in the browser path.
 * @internal
 */
function attachmentToBlob(attachment: IAiImageAttachment): Result<Blob> {
  if (typeof Buffer !== 'undefined') {
    return succeed(new Blob([Buffer.from(attachment.base64, 'base64')], { type: attachment.mimeType }));
  }
  /* c8 ignore start - Browser-only fallback cannot be tested in Node.js environment */
  try {
    const binary = atob(attachment.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return succeed(new Blob([bytes], { type: attachment.mimeType }));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail(`Invalid base64: ${message}`);
  }
  /* c8 ignore stop */
}

/**
 * Maps a MIME type to a sensible file extension for multipart filenames.
 * @internal
 */
function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

// ============================================================================
// Image generation — request types
// ============================================================================

/**
 * Parameters for an image-generation request.
 * @public
 */
export interface IProviderImageGenerationParams {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** The image-generation request */
  readonly params: IAiImageGenerationParams;
  /** Optional model override — string or context-aware map (uses descriptor.defaultModel.image otherwise) */
  readonly modelOverride?: ModelSpec;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Optional abort signal for cancelling the in-flight request. */
  readonly signal?: AbortSignal;
  /** Optional override of the descriptor's base URL; per-route suffix is appended unchanged. */
  readonly endpoint?: string;
}

// ============================================================================
// Image generation — response validators
// ============================================================================

// ---- OpenAI / xAI images format ----

/** @internal */
interface IOpenAiImageItem {
  b64_json: string;
  revised_prompt?: string;
}
/** @internal */
interface IOpenAiImageResponse {
  data: IOpenAiImageItem[];
}

const openAiImageItem: Validator<IOpenAiImageItem> = Validators.object<IOpenAiImageItem>({
  b64_json: Validators.string,
  revised_prompt: Validators.string.optional()
});
const openAiImageResponse: Validator<IOpenAiImageResponse> = Validators.object<IOpenAiImageResponse>({
  data: Validators.arrayOf(openAiImageItem).withConstraint((arr) => arr.length > 0)
});

// ---- Gemini image-out (`:generateContent` returning image parts) format ----

/** @internal */
interface IGeminiImageInlineData {
  mimeType: string;
  data: string;
}
/** @internal */
interface IGeminiImageOutPart {
  text?: string;
  inlineData?: IGeminiImageInlineData;
}
/** @internal */
interface IGeminiImageOutContent {
  parts: IGeminiImageOutPart[];
}
/** @internal */
interface IGeminiImageOutCandidate {
  content?: IGeminiImageOutContent;
  finishReason?: string;
  finishMessage?: string;
}
/** @internal */
interface IGeminiImageOutResponse {
  candidates: IGeminiImageOutCandidate[];
}

const geminiImageInlineData: Validator<IGeminiImageInlineData> = Validators.object<IGeminiImageInlineData>({
  mimeType: Validators.string,
  data: Validators.string
});
const geminiImageOutPart: Validator<IGeminiImageOutPart> = Validators.object<IGeminiImageOutPart>({
  text: Validators.string.optional(),
  inlineData: geminiImageInlineData.optional()
});
const geminiImageOutContent: Validator<IGeminiImageOutContent> = Validators.object<IGeminiImageOutContent>({
  parts: Validators.arrayOf(geminiImageOutPart)
});
const geminiImageOutCandidate: Validator<IGeminiImageOutCandidate> =
  Validators.object<IGeminiImageOutCandidate>({
    content: geminiImageOutContent.optional(),
    finishReason: Validators.string.optional(),
    finishMessage: Validators.string.optional()
  });
const geminiImageOutResponse: Validator<IGeminiImageOutResponse> = Validators.object<IGeminiImageOutResponse>(
  {
    candidates: Validators.arrayOf(geminiImageOutCandidate).withConstraint((arr) => arr.length > 0)
  }
);

// ---- Proxied image generation response ----

const proxiedGeneratedImage: Validator<IAiGeneratedImage> = Validators.object<IAiGeneratedImage>({
  mimeType: Validators.string,
  base64: Validators.string,
  revisedPrompt: Validators.string.optional()
});
const proxiedImageGenerationResponse: Validator<IAiImageGenerationResponse> =
  Validators.object<IAiImageGenerationResponse>({
    images: Validators.arrayOf(proxiedGeneratedImage).withConstraint((arr) => arr.length > 0)
  });

// ============================================================================
// Image generation — adapters
// ============================================================================

/** Routes to /images/generations or /images/edits; handles outputParamStyle. @internal */
async function callOpenAiImageGeneration(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  capability: IAiImageModelCapability,
  resolved: IResolvedImageOptions,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiImageGenerationResponse>> {
  const refs = request.referenceImages ?? [];
  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);

  const effectiveMimeType =
    resolved.outputFormat !== undefined
      ? `image/${resolved.outputFormat}`
      : capability.defaultOutputMimeType ?? 'image/png';

  const fetched =
    refs.length > 0
      ? await callOpenAiImagesEdits(config, capability, request, headers, resolved, logger, signal)
      : await callOpenAiImagesGenerations(config, request, headers, resolved, capability, logger, signal);

  return fetched.onSuccess((json) =>
    openAiImageResponse
      .validate(json)
      .withErrorFormat((msg) => `OpenAI images API response: ${msg}`)
      .onSuccess((response) =>
        succeed({
          images: response.data.map((item) => ({
            mimeType: effectiveMimeType,
            base64: item.b64_json,
            ...(item.revised_prompt !== undefined ? { revisedPrompt: item.revised_prompt } : {})
          }))
        })
      )
  );
}

/** Builds the JSON /images/generations request; handles outputParamStyle. @internal */
function callOpenAiImagesGenerations(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  headers: Record<string, string>,
  resolved: IResolvedImageOptions,
  capability: IAiImageModelCapability,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  const body: Record<string, unknown> = {
    model: config.model,
    prompt: request.prompt,
    n: resolved.n
  };

  // Output format param — conditional on model capability
  if (capability.outputParamStyle === 'response-format') {
    body.response_format = 'b64_json';
  } else if (capability.outputParamStyle === 'output-format') {
    body.output_format = resolved.outputFormat ?? 'png';
  }

  if (resolved.size !== undefined) {
    body.size = resolved.size;
  }
  if (capability.supportsQualityParam && resolved.quality !== undefined) {
    body.quality = resolved.quality;
  }
  if (resolved.seed !== undefined) {
    body.seed = resolved.seed;
  }
  if (resolved.background !== undefined) {
    body.background = resolved.background;
  }
  if (resolved.moderation !== undefined) {
    body.moderation = resolved.moderation;
  }
  if (resolved.outputCompression !== undefined) {
    body.output_compression = resolved.outputCompression;
  }
  if (resolved.otherParams !== undefined) {
    Object.assign(body, resolved.otherParams);
  }
  /* c8 ignore next 1 - optional logger */
  logger?.info(`Image generation: model=${config.model}, n=${resolved.n}`);
  return fetchJson(`${config.baseUrl}/images/generations`, headers, body, logger, signal);
}

/** Builds the multipart /images/edits request with ref images. @internal */
async function callOpenAiImagesEdits(
  config: IAiApiConfig,
  capability: IAiImageModelCapability,
  request: IAiImageGenerationParams,
  headers: Record<string, string>,
  resolved: IResolvedImageOptions,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  const refs = request.referenceImages!; // callers verify refs.length > 0 before calling this function
  const blobsResult = mapResults(
    refs.map((ref, i) => attachmentToBlob(ref).withErrorFormat((msg) => `reference image ${i}: ${msg}`))
  );
  /* c8 ignore next 3 - decode failure unreachable via Node's Buffer.from (silently strips invalid input) */
  if (blobsResult.isFailure()) {
    return fail(blobsResult.message);
  }

  const form = new FormData();
  form.append('model', config.model);
  form.append('prompt', request.prompt);
  form.append('n', String(resolved.n));
  if (capability.outputParamStyle !== 'output-format') {
    form.append('response_format', 'b64_json');
  }
  if (resolved.size !== undefined) {
    form.append('size', resolved.size);
  }
  blobsResult.value.forEach((blob, i) => {
    form.append('image[]', blob, `ref-${i}.${extensionForMimeType(refs[i].mimeType)}`);
  });
  /* c8 ignore next 1 - optional logger */
  logger?.info(`Image edit: model=${config.model}, n=${resolved.n}, refs=${refs.length}`);
  return fetchMultipart(`${config.baseUrl}/images/edits`, headers, form, logger, signal);
}

/** Calls xAI /images/edits with JSON body (not multipart); up to 3 source images. @internal */
async function callXaiImagesEdits(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  resolved: IResolvedImageOptions,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  /* c8 ignore next 1 - defensive: referenceImages always defined when this function is called */
  const refs = request.referenceImages ?? [];
  if (refs.length > 3) {
    return fail(`xAI image edits supports at most 3 reference images; got ${refs.length}`);
  }
  const images = refs.map((ref) => ({
    type: 'image_url',
    url: `data:${ref.mimeType};base64,${ref.base64}`
  }));

  const body: Record<string, unknown> = {
    model: config.model,
    prompt: request.prompt,
    n: resolved.n,
    response_format: 'b64_json',
    image: images
  };
  if (resolved.aspectRatio !== undefined) {
    body.aspect_ratio = resolved.aspectRatio;
  }
  if (resolved.resolution !== undefined) {
    body.resolution = resolved.resolution;
  }
  if (resolved.otherParams !== undefined) {
    Object.assign(body, resolved.otherParams);
  }
  /* c8 ignore next 1 - optional logger */
  logger?.info(`xAI image edit: model=${config.model}, n=${resolved.n}, refs=${refs.length}`);
  return fetchJson(`${config.baseUrl}/images/edits`, bearerAuthHeader(config.apiKey), body, logger, signal);
}

/**
 * Normalizes an xAI images API response (OpenAI-shaped) into the provider-neutral
 * generated-image result.
 *
 * @remarks
 * Shared by the generations path and the edits path. These were two independent
 * copies 160 lines apart — identical but for the receiver name — so the
 * `defaultOutputMimeType` fallback and the error prefix each existed twice, and a
 * fix to one would silently have missed the other.
 * @internal
 */
function normalizeXaiImageResponse(
  json: JsonObject,
  capability: IAiImageModelCapability
): Result<IAiImageGenerationResponse> {
  return openAiImageResponse
    .validate(json)
    .withErrorFormat((msg) => `xAI images API response: ${msg}`)
    .onSuccess((response) =>
      succeed({
        images: response.data.map((item) => ({
          mimeType: capability.defaultOutputMimeType ?? 'image/jpeg',
          base64: item.b64_json
        }))
      })
    );
}

/** Calls xAI /images/generations; uses aspect_ratio instead of size. @internal */
async function callXaiImageGeneration(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  capability: IAiImageModelCapability,
  resolved: IResolvedImageOptions,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiImageGenerationResponse>> {
  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);
  const body: Record<string, unknown> = {
    model: config.model,
    prompt: request.prompt,
    n: resolved.n,
    response_format: 'b64_json'
  };
  if (resolved.aspectRatio !== undefined) {
    body.aspect_ratio = resolved.aspectRatio;
  }
  if (resolved.resolution !== undefined) {
    body.resolution = resolved.resolution;
  }
  if (resolved.otherParams !== undefined) {
    Object.assign(body, resolved.otherParams);
  }
  /* c8 ignore next 1 - optional logger */
  logger?.info(`xAI image generation: model=${config.model}, n=${resolved.n}`);
  const fetched = await fetchJson(`${config.baseUrl}/images/generations`, headers, body, logger, signal);
  return fetched.onSuccess((json) => normalizeXaiImageResponse(json, capability));
}

/**
 * Gemini `finishReason` values that indicate a normal terminal completion rather
 * than a refusal. `STOP` is set on every successful generation (and on completions
 * that return a text part instead of an image); `MAX_TOKENS` is a benign truncation.
 * A candidate carrying only one of these is NOT a decline — treating it as one would
 * mislabel an ordinary no-image outcome as a policy refusal. @internal
 */
const benignGeminiImageFinishReasons: ReadonlySet<string> = new Set(['STOP', 'MAX_TOKENS']);

/** Calls Gemini :generateContent for image output; accepts ref images as inlineData. @internal */
async function callGeminiImageOutGeneration(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  resolved: IResolvedImageOptions,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiImageGenerationResponse>> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;
  const refs = request.referenceImages ?? [];
  const parts: Array<Record<string, unknown>> = [{ text: request.prompt }];
  for (const ref of refs) {
    parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.base64 } });
  }

  const generationConfig: Record<string, unknown> = {};
  if (resolved.geminiAspectRatio !== undefined) {
    generationConfig.imageConfig = { aspectRatio: resolved.geminiAspectRatio };
  }
  if (resolved.otherParams !== undefined) {
    Object.assign(generationConfig, resolved.otherParams);
  }

  const body: Record<string, unknown> = { contents: [{ role: 'user', parts }] };
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }
  const headers: Record<string, string> = geminiAuthHeader(config.apiKey);

  /* c8 ignore next 1 - optional logger */
  logger?.info(`Gemini image-out: model=${config.model}, refs=${refs.length}`);
  return (await fetchJson(url, headers, body, logger, signal)).onSuccess((json) =>
    geminiImageOutResponse
      .validate(json)
      .withErrorFormat((msg) => `Gemini image API response: ${msg}`)
      .onSuccess((response) => {
        const images: IAiGeneratedImage[] = [];
        for (const candidate of response.candidates) {
          for (const part of candidate.content?.parts ?? []) {
            if (part.inlineData) {
              images.push({
                mimeType: part.inlineData.mimeType,
                base64: part.inlineData.data
              });
            }
          }
        }
        if (images.length === 0) {
          // A candidate with no image parts is a *decline* only when it carries a
          // refusal-shaped finishReason — i.e. present and not a benign terminal reason
          // (`STOP`/`MAX_TOKENS`). A normal completion that emitted text-instead-of-image
          // carries `finishReason: 'STOP'` and must fall through to the no-image message.
          const declined = response.candidates.find(
            (candidate) =>
              candidate.finishReason !== undefined &&
              !benignGeminiImageFinishReasons.has(candidate.finishReason)
          );
          if (declined?.finishReason !== undefined) {
            // Truthiness (not `!== undefined`) so an empty-string finishMessage is treated
            // as "no message" and produces no dangling ` — ` separator.
            const suffix = declined.finishMessage ? ` — ${declined.finishMessage}` : '';
            return fail(`Gemini image generation declined: ${declined.finishReason}${suffix}`);
          }
          return fail('Gemini image API response: no image parts in response');
        }
        return succeed({ images });
      })
  );
}

// ============================================================================
// Image generation — dispatcher
// ============================================================================

/**
 * Calls the appropriate image-generation API for a given provider. Routes by the
 * `format` field of the resolved {@link IAiImageModelCapability}:
 * `'openai-images'`, `'xai-images'`, `'xai-images-edits'`, or
 * `'gemini-image-out'`. Rejects up front if `referenceImages` is set but the
 * capability does not declare `acceptsImageReferenceInput`.
 * @param params - Request parameters including descriptor, API key, and prompt
 * @public
 */
export async function callProviderImageGeneration(
  params: IProviderImageGenerationParams
): Promise<Result<IAiImageGenerationResponse>> {
  const { descriptor, apiKey, params: request, modelOverride, logger, signal, endpoint } = params;

  if (!supportsImageGeneration(descriptor)) {
    return fail(`provider "${descriptor.id}" does not support image generation`);
  }
  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }

  const modelResult = resolveProviderModel(descriptor, modelOverride, 'image');
  if (modelResult.isFailure()) {
    return fail(modelResult.message);
  }
  const model = modelResult.value;
  const capability = resolveImageCapability(descriptor, model);
  if (capability === undefined) {
    return fail(`provider "${descriptor.id}" does not support image generation for model "${model}"`);
  }
  if ((request.referenceImages?.length ?? 0) > 0 && !capability.acceptsImageReferenceInput) {
    return fail(`model "${model}" does not support reference images`);
  }

  const resolved = resolveImageOptions(model, capability, request.options);
  const validationResult = validateResolvedOptions(model, capability, resolved);
  if (validationResult.isFailure()) {
    return fail<IAiImageGenerationResponse>(validationResult.message);
  }
  const config: IAiApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model
  };
  /* c8 ignore next 6 - optional logger diagnostic output */
  if (logger) {
    logger.info(
      `AI image generation: provider=${descriptor.id}, format=${capability.format}, ` +
        `model=${config.model}`
    );
  }

  switch (capability.format) {
    case 'openai-images':
      return callOpenAiImageGeneration(config, request, capability, resolved, logger, signal);
    case 'xai-images':
      return callXaiImageGeneration(config, request, capability, resolved, logger, signal);
    case 'xai-images-edits': {
      const refs = request.referenceImages ?? [];
      if (refs.length > 0) {
        const editsResult = await callXaiImagesEdits(config, request, resolved, logger, signal);
        return editsResult.onSuccess((json) => normalizeXaiImageResponse(json, capability));
      }
      return callXaiImageGeneration(config, request, capability, resolved, logger, signal);
    }
    case 'gemini-image-out':
      return callGeminiImageOutGeneration(config, request, resolved, logger, signal);
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = capability.format;
      return fail(`unsupported image API format: ${String(_exhaustive)}`);
    }
  }
}

// ============================================================================
// Proxied image generation
// ============================================================================

/**
 * Calls the image-generation endpoint on a proxy server instead of calling
 * the provider API directly from the browser.
 * Endpoint: `POST ${proxyUrl}/api/ai/image-generation`. Request body:
 * `{providerId, apiKey, params, modelOverride?}`. The proxy handles descriptor
 * lookup, model resolution, provider dispatch, and response normalization
 * (including repackaging `referenceImages` for the upstream wire format).
 * Error body `{error: string}` is surfaced as `proxy: ${error}`.
 * @param proxyUrl - Base URL of the proxy server
 * @param params - Same parameters as {@link callProviderImageGeneration}
 * @public
 */
export async function callProxiedImageGeneration(
  proxyUrl: string,
  params: IProviderImageGenerationParams
): Promise<Result<IAiImageGenerationResponse>> {
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
  logger?.info(`AI image proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/image-generation`;
  const jsonResult = await fetchJson(url, {}, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const response = jsonResult.value as Record<string, unknown>;
  if (typeof response.error === 'string') {
    return fail(`proxy: ${response.error}`);
  }

  return proxiedImageGenerationResponse
    .validate(response)
    .withErrorFormat((msg) => `proxy returned invalid response: ${msg}`);
}
