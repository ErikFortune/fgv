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
 * Core types for AI assist: prompt class, provider descriptors, settings, and chat messages.
 * @packageDocumentation
 */

import { type Result } from '@fgv/ts-utils';
import { type JsonObject } from '@fgv/ts-json-base';

// ============================================================================
// Image Data
// ============================================================================

/**
 * Universal image representation used for both image input (vision prompts)
 * and image output (generation responses).
 *
 * @remarks
 * The base64 string is raw — no `data:` URL prefix. Use {@link AiAssist.toDataUrl} to
 * format it for browser-display contexts.
 *
 * @public
 */
export interface IAiImageData {
  /** MIME type, e.g. `'image/png'`, `'image/jpeg'`, `'image/webp'`. */
  readonly mimeType: string;
  /** Base64-encoded image bytes (no `data:` prefix). */
  readonly base64: string;
}

/**
 * Formats an {@link IAiImageData} as a `data:` URL suitable for browser display.
 * @param image - The image to format
 * @returns A `data:<mime>;base64,<data>` URL string
 * @public
 */
export function toDataUrl(image: IAiImageData): string {
  return `data:${image.mimeType};base64,${image.base64}`;
}

/**
 * Image attachment for a vision (image-input) prompt.
 *
 * @remarks
 * Extends {@link IAiImageData} with an OpenAI-specific `detail` hint that is
 * silently ignored by Anthropic, Gemini, and other providers.
 *
 * @public
 */
export interface IAiImageAttachment extends IAiImageData {
  /**
   * OpenAI vision detail hint:
   * - `'low'`: faster, cheaper, lower fidelity
   * - `'high'`: slower, more expensive, higher fidelity
   * - `'auto'` (default): provider chooses
   *
   * Ignored by providers other than OpenAI.
   */
  readonly detail?: 'low' | 'high' | 'auto';
}

// ============================================================================
// AiPrompt
// ============================================================================

/**
 * A structured AI prompt with system/user split for direct API calls,
 * and a lazily-constructed combined version for copy/paste workflows.
 * @public
 */
export class AiPrompt {
  /** System instructions: schema documentation, format rules, general guidance. */
  public readonly system: string;
  /** User request: the specific entity generation request. */
  public readonly user: string;
  /**
   * Optional image attachments. When present, vision-capable providers will
   * include them in the user message; non-vision providers will reject the
   * call up front (see {@link AiAssist.IAiProviderDescriptor.acceptsImageInput}).
   */
  public readonly attachments: ReadonlyArray<IAiImageAttachment>;

  public constructor(user: string, system: string, attachments?: ReadonlyArray<IAiImageAttachment>) {
    this.system = system;
    this.user = user;
    this.attachments = attachments ?? [];
  }

  /**
   * Combined single-string version (user + system joined) for copy/paste.
   * When attachments are present, includes a sentinel noting they aren't
   * part of the copied text.
   */
  public get combined(): string {
    const sentinel =
      this.attachments.length > 0
        ? `\n\n[${this.attachments.length} image attachment(s) — not included in copied text]`
        : '';
    return `${this.user}${sentinel}\n\n${this.system}`;
  }
}

// ============================================================================
// Chat Message
// ============================================================================

/**
 * A single chat message in OpenAI format.
 * @public
 */
export interface IChatMessage {
  /** Message role */
  readonly role: 'system' | 'user' | 'assistant';
  /** Message content */
  readonly content: string;
}

// ============================================================================
// Server-Side Tools
// ============================================================================

/**
 * Built-in server-side tool types supported across providers.
 * @public
 */
export type AiServerToolType = 'web_search';

/**
 * Configuration specific to web search tools.
 * @public
 */
export interface IAiWebSearchToolConfig {
  readonly type: 'web_search';
  /** Optional: restrict search to these domains. */
  readonly allowedDomains?: ReadonlyArray<string>;
  /** Optional: exclude these domains from search. */
  readonly blockedDomains?: ReadonlyArray<string>;
  /** Optional: max number of searches per request. */
  readonly maxUses?: number;
  /**
   * Optional: enable image understanding during web search.
   * When true, the model can view and analyze images found during search.
   * Currently supported by xAI only; ignored by other providers.
   */
  readonly enableImageUnderstanding?: boolean;
}

/**
 * Union of all server-side tool configurations. Discriminated on `type`.
 * @public
 */
export type AiServerToolConfig = IAiWebSearchToolConfig;

/**
 * Declares a tool as enabled/disabled in provider settings.
 * Tools are disabled by default — consuming apps must opt in explicitly.
 * @public
 */
export interface IAiToolEnablement {
  /** Which tool type. */
  readonly type: AiServerToolType;
  /** Whether this tool is enabled by default for this provider. */
  readonly enabled: boolean;
  /** Optional tool-specific configuration. */
  readonly config?: AiServerToolConfig;
}

// ============================================================================
// Model Specification
// ============================================================================

/**
 * Known context keys for model specification maps.
 * @public
 */
export type ModelSpecKey = 'base' | 'tools' | 'image';

/**
 * All valid {@link ModelSpecKey} values.
 * @public
 */
export const allModelSpecKeys: ReadonlyArray<ModelSpecKey> = ['base', 'tools', 'image'];

/**
 * Default context key used as fallback when resolving a {@link ModelSpec}.
 * @public
 */
export const MODEL_SPEC_BASE_KEY: ModelSpecKey = 'base';

/**
 * A model specification: either a simple model string or a record mapping
 * context keys to nested model specs.
 *
 * @remarks
 * A bare string is equivalent to `{ base: string }`. This keeps the simple
 * case simple while allowing context-aware model selection (e.g. different
 * models for tool-augmented vs. base completions).
 *
 * @example
 * ```typescript
 * // Simple — same model for all contexts:
 * const simple: ModelSpec = 'grok-4-1-fast';
 *
 * // Context-aware — reasoning model when tools are active:
 * const split: ModelSpec = { base: 'grok-4-1-fast', tools: 'grok-4-1-fast-reasoning' };
 *
 * // Future nested — per-tool model selection:
 * const nested: ModelSpec = { base: 'grok-fast', tools: { base: 'grok-r', image: 'grok-v' } };
 * ```
 * @public
 */
export interface IModelSpecMap {
  readonly [key: string]: ModelSpec;
}

/**
 * @public
 */
export type ModelSpec = string | IModelSpecMap;

/**
 * Resolves a {@link ModelSpec} to a concrete model string given an optional context key.
 *
 * @remarks
 * Resolution rules:
 * 1. If the spec is a string, return it directly (context is irrelevant).
 * 2. If the spec is an object and the context key exists, recurse into that branch.
 * 3. Otherwise, fall back to the {@link MODEL_SPEC_BASE_KEY | 'base'} key.
 * 4. If neither context nor `'base'` exists, use the first available value.
 *
 * @param spec - The model specification to resolve
 * @param context - Optional context key (e.g. `'tools'`)
 * @returns The resolved model string
 * @public
 */
export function resolveModel(spec: ModelSpec, context?: string): string {
  if (typeof spec === 'string') {
    return spec;
  }

  // Try the requested context key first
  if (context !== undefined && context in spec) {
    return resolveModel(spec[context]);
  }

  // Fall back to 'base'
  if (MODEL_SPEC_BASE_KEY in spec) {
    return resolveModel(spec[MODEL_SPEC_BASE_KEY]);
  }

  // Last resort: first value in the record
  const first = Object.values(spec)[0];
  /* c8 ignore next 3 - defensive: only reachable with empty object (prevented by converter) */
  if (first === undefined) {
    return '';
  }
  return resolveModel(first);
}

// ============================================================================
// Provider Descriptor
// ============================================================================

/**
 * All known AI provider identifiers.
 * @public
 */
export type AiProviderId =
  | 'copy-paste'
  | 'xai-grok'
  | 'openai'
  | 'openai-compat'
  | 'anthropic'
  | 'google-gemini'
  | 'groq'
  | 'mistral'
  | 'ollama';

/**
 * API format categories for provider routing.
 * @public
 */
export type AiApiFormat = 'openai' | 'anthropic' | 'gemini';

/**
 * API format categories for image-generation provider routing.
 *
 * @remarks
 * - `'openai-images'` — OpenAI Images API. Routes to `/images/generations`
 *   (text-only) or `/images/edits` (when reference images are present).
 * - `'xai-images'` — xAI Images API. Text-only JSON generation request.
 * - `'xai-images-edits'` — xAI Images API for Grok Imagine models. Uses JSON
 *   body with `{ type: "image_url" }` objects (not multipart).
 * - `'gemini-imagen'` — Google Imagen `:predict` endpoint. Text-only.
 * - `'gemini-image-out'` — Google Gemini chat-style `:generateContent`
 *   endpoint that returns image parts (Gemini 2.5 Flash Image / "Nano
 *   Banana"). Accepts reference images.
 *
 * @public
 */
export type AiImageApiFormat =
  | 'openai-images'
  | 'gemini-imagen'
  | 'xai-images'
  | 'xai-images-edits'
  | 'gemini-image-out';

// ============================================================================
// Completion Response
// ============================================================================

/**
 * Result of an AI provider completion call.
 * @public
 */
export interface IAiCompletionResponse {
  /** The generated text content */
  readonly content: string;
  /** Whether the response was truncated due to token limits */
  readonly truncated: boolean;
}

// ============================================================================
// Streaming Events
// ============================================================================

/**
 * A text-content delta arriving during a streaming completion.
 * @public
 */
export interface IAiStreamTextDelta {
  readonly type: 'text-delta';
  /** The newly arrived text fragment. */
  readonly delta: string;
}

/**
 * A server-side tool progress event arriving during a streaming completion.
 * Surfaced for providers that emit explicit tool-progress markers (OpenAI
 * Responses API, Anthropic). Gemini's grounding doesn't emit these.
 * @public
 */
export interface IAiStreamToolEvent {
  readonly type: 'tool-event';
  /** Which server-side tool this event describes. */
  readonly toolType: AiServerToolType;
  /** Tool lifecycle phase. */
  readonly phase: 'started' | 'completed';
  /**
   * Optional provider-specific detail. For web_search this is typically the
   * search query when available; format varies by provider.
   */
  readonly detail?: string;
}

/**
 * Terminal success event for a streaming completion. Carries the aggregated
 * full text and truncation status for callers that want both the progressive
 * UI and the complete result.
 * @public
 */
export interface IAiStreamDone {
  readonly type: 'done';
  /** Whether the response was truncated due to token limits. */
  readonly truncated: boolean;
  /** The full concatenated text from all `text-delta` events. */
  readonly fullText: string;
}

/**
 * Terminal failure event for a streaming completion. After this event no
 * further events are emitted.
 *
 * @remarks
 * Connection-time failures (auth, network, pre-flight CORS rejection) are
 * surfaced via the outer `Result.fail` returned by
 * `callProviderCompletionStream` rather than as an `error` event, so callers
 * can distinguish "didn't start" from "started but errored mid-stream."
 *
 * @public
 */
export interface IAiStreamError {
  readonly type: 'error';
  readonly message: string;
}

/**
 * Discriminated union of events emitted by a streaming completion.
 * @public
 */
export type IAiStreamEvent = IAiStreamTextDelta | IAiStreamToolEvent | IAiStreamDone | IAiStreamError;

/**
 * Describes a single AI provider — single source of truth for all metadata.
 * @public
 */
export interface IAiProviderDescriptor {
  /** Provider identifier (e.g. 'xai-grok', 'anthropic') */
  readonly id: AiProviderId;
  /** Human-readable label (e.g. "xAI Grok") */
  readonly label: string;
  /** Button label for action buttons (e.g. "AI Assist | Grok") */
  readonly buttonLabel: string;
  /** Whether this provider requires an API key secret */
  readonly needsSecret: boolean;
  /** Which API adapter format to use */
  readonly apiFormat: AiApiFormat;
  /** Base URL for the API (e.g. 'https://api.x.ai/v1') */
  readonly baseUrl: string;
  /** Default model specification — string or context-aware map. */
  readonly defaultModel: ModelSpec;
  /** Which server-side tools this provider supports (empty = none). */
  readonly supportedTools: ReadonlyArray<AiServerToolType>;
  /** Whether this provider's API enforces CORS restrictions that prevent direct browser calls. */
  readonly corsRestricted: boolean;
  /**
   * Whether this provider's streaming completion endpoint requires a proxy
   * for direct browser calls. Some providers gate streaming separately from
   * non-streaming (rare), so this is tracked independently from
   * {@link IAiProviderDescriptor.corsRestricted}.
   *
   * @remarks
   * When `true`, `callProviderCompletionStream` rejects up front unless the
   * call is being routed through a proxy.
   */
  readonly streamingCorsRestricted: boolean;
  /**
   * Whether this provider's chat completions API accepts image input
   * (i.e. supports vision prompts). When false, calls with
   * `prompt.attachments` are rejected up front.
   */
  readonly acceptsImageInput: boolean;
  /**
   * Image-generation capabilities, scoped to model id prefixes. Empty or
   * undefined means the provider does not support image generation.
   *
   * @remarks
   * The dispatcher matches the resolved model id against each rule's
   * `modelPrefix` and selects the longest match (see
   * {@link AiAssist.resolveImageCapability}). An empty `modelPrefix` is the
   * catch-all and matches every model id.
   *
   * Multiple entries support providers that host more than one image-API
   * surface under one baseUrl. Google Gemini is the canonical case: the
   * `imagen-*` family is predict-only via `:predict`, while
   * `gemini-2.5-flash-image` uses chat-style `:generateContent` and accepts
   * reference images. Listing both lets callers pick the right model and the
   * dispatcher routes accordingly.
   *
   * Image-model selection reuses the existing `image` {@link ModelSpecKey}.
   * Providers that declare `imageGeneration` should declare a model in
   * `defaultModel.image`, e.g. `{ base: 'gpt-4o', image: 'dall-e-3' }`.
   */
  readonly imageGeneration?: ReadonlyArray<IAiImageModelCapability>;
}

/**
 * Image-generation capability for a model family within a provider. Used as
 * an entry in {@link IAiProviderDescriptor.imageGeneration}.
 *
 * @public
 */
export interface IAiImageModelCapability {
  /**
   * Prefix matched against the resolved image model id. The empty string is
   * the catch-all and matches every model. When multiple rules' prefixes
   * match a model id, the longest prefix wins; ties are broken by
   * first-encountered.
   */
  readonly modelPrefix: string;
  /** API format used to dispatch requests for matching models. */
  readonly format: AiImageApiFormat;
  /**
   * Whether matching models accept reference images via
   * {@link AiAssist.IAiImageGenerationParams.referenceImages}. When false or
   * undefined, calls that include reference images are rejected up front.
   */
  readonly acceptsImageReferenceInput?: boolean;
  /** Accepted size strings. When present, dispatcher pre-validates. */
  readonly acceptedSizes?: ReadonlyArray<string>;
  /** When true, quality param is sent. When false/undefined, don't send quality. */
  readonly supportsQualityParam?: boolean;
  /** Accepted quality values when supportsQualityParam is true. */
  readonly acceptedQualities?: ReadonlyArray<string>;
  /** Maximum count (n). When present, dispatcher pre-validates. */
  readonly maxCount?: number;
  /**
   * How to encode the output format on the wire:
   * - 'response-format': send response_format: 'b64_json' (dall-e-2, dall-e-3)
   * - 'output-format': send output_format (gpt-image-1)
   * - 'none': send neither (Imagen, Gemini Flash)
   */
  readonly outputParamStyle?: 'response-format' | 'output-format' | 'none';
  /** Default MIME type for response images. */
  readonly defaultOutputMimeType?: string;
}

// ============================================================================
// Image Generation — Layered Options Types
// ============================================================================

/** Pixel dimension sizes accepted by dall-e-2. @public */
export type DallE2Size = '256x256' | '512x512' | '1024x1024';

/** Pixel dimension sizes accepted by dall-e-3. @public */
export type DallE3Size = '1024x1024' | '1792x1024' | '1024x1792';

/** Pixel dimension sizes accepted by gpt-image-1. @public */
export type GptImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';

/** All accepted image size strings across all providers. @public */
export type AiImageSize = DallE2Size | DallE3Size | GptImageSize;

/** Quality values for dall-e-3. @public */
export type DallE3Quality = 'standard' | 'hd';

/** Quality values for gpt-image-1. @public */
export type GptImageQuality = 'low' | 'medium' | 'high' | 'auto';

/** All accepted quality strings across all providers. @public */
export type AiImageQuality = DallE3Quality | GptImageQuality;

/** Model names in the DALL-E family. @public */
export type DallEModelNames = 'dall-e-2' | 'dall-e-3';

/** Model names in the GPT Image family. @public */
export type GptImageModelNames = 'gpt-image-1';

/** Model names in the xAI Grok Imagine family. @public */
export type GrokImagineModelNames = 'grok-imagine-image' | 'grok-imagine-image-quality';

/** Model names in the Imagen 4 family. @public */
export type Imagen4ModelNames =
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-ultra-generate-001'
  | 'imagen-4.0-fast-generate-001';

/** Model names in the Gemini Flash Image family. @public */
export type GeminiFlashImageModelNames = 'gemini-2.5-flash-image';

// ---- Family-level config shapes ----

/**
 * Provider-specific config for DALL-E models (dall-e-2, dall-e-3).
 * @remarks
 * style is only valid for dall-e-3; the runtime validator rejects it for dall-e-2.
 * @public
 */
export interface IDallEImageGenerationConfig {
  /** Image dimensions (dall-e-2: 256x256|512x512|1024x1024; dall-e-3: 1024x1024|1792x1024|1024x1792). */
  readonly size?: DallE2Size | DallE3Size;
  /** dall-e-3 only. Quality tier. */
  readonly quality?: DallE3Quality;
  /** dall-e-3 only. Visual style. */
  readonly style?: 'vivid' | 'natural';
}

/**
 * Provider-specific config for gpt-image-1.
 * @public
 */
export interface IGptImageGenerationConfig {
  /** Image dimensions. */
  readonly size?: GptImageSize;
  /** Quality tier. */
  readonly quality?: GptImageQuality;
  /** Output format (replaces response_format for this model). */
  readonly outputFormat?: 'png' | 'jpeg' | 'webp';
  /** JPEG/WebP compression level 0–100. */
  readonly outputCompression?: number;
  /** Background transparency control. */
  readonly background?: 'transparent' | 'opaque' | 'auto';
  /** Content moderation strictness. */
  readonly moderation?: 'low' | 'auto';
}

/**
 * Provider-specific config for xAI Grok Imagine models.
 * @public
 */
export interface IGrokImagineImageGenerationConfig {
  /** Aspect ratio string (xAI uses aspect ratios, not pixel dimensions). */
  readonly aspectRatio?: string;
  /** Resolution hint. */
  readonly resolution?: string;
}

/**
 * Provider-specific config for Google Imagen 4 models.
 * @public
 */
export interface IImagen4GenerationConfig {
  /** Aspect ratio string. */
  readonly aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  /** Output resolution. */
  readonly imageSize?: '1K' | '2K';
  /** Whether to add SynthID watermark. Must be false to use seed. */
  readonly addWatermark?: boolean;
  /** LLM-based prompt rewriting. */
  readonly enhancePrompt?: boolean;
  /** Output MIME type. */
  readonly outputMimeType?: 'image/jpeg' | 'image/png';
  /** JPEG compression quality. */
  readonly outputCompressionQuality?: number;
  /** Person generation policy. */
  readonly personGeneration?: 'allow_all' | 'allow_adult' | 'dont_allow';
}

/**
 * Provider-specific config for Gemini Flash Image.
 * @public
 */
export interface IGeminiFlashImageGenerationConfig {
  /** Aspect ratio string. */
  readonly aspectRatio?: string;
}

// ---- Model-family option blocks ----

/**
 * Base shape shared by all named family option blocks.
 * Provides a typed `models` field for applicability filtering without unsafe casts.
 * @internal
 */
export interface INamedModelFamilyConfig {
  readonly models?: readonly string[];
}

/**
 * Options block scoped to DALL-E family models.
 * @public
 */
export interface IDallEModelOptions extends INamedModelFamilyConfig {
  /** Discriminator: openai provider lineage. */
  readonly provider: 'openai';
  /** Family identifier. */
  readonly family: 'dall-e';
  /** Optional model names this block applies to. Omit = applies to all DALL-E models. */
  readonly models?: DallEModelNames[];
  /** Family-specific config. */
  readonly config: IDallEImageGenerationConfig;
}

/**
 * Options block scoped to GPT Image family models.
 * @public
 */
export interface IGptImageModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'openai';
  readonly family: 'gpt-image';
  readonly models?: GptImageModelNames[];
  readonly config: IGptImageGenerationConfig;
}

/**
 * Options block scoped to xAI Grok Imagine family models.
 * @public
 */
export interface IGrokImagineModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'xai';
  readonly family: 'grok-imagine';
  readonly models?: GrokImagineModelNames[];
  readonly config: IGrokImagineImageGenerationConfig;
}

/**
 * Options block scoped to Google Imagen 4 models.
 * @public
 */
export interface IImagen4ModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'google';
  readonly family: 'imagen-4';
  readonly models?: Imagen4ModelNames[];
  readonly config: IImagen4GenerationConfig;
}

/**
 * Options block scoped to Gemini Flash Image models.
 * @public
 */
export interface IGeminiFlashImageModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'google';
  readonly family: 'gemini-flash-image';
  readonly models?: GeminiFlashImageModelNames[];
  readonly config: IGeminiFlashImageGenerationConfig;
}

/**
 * Escape-hatch options block for models not covered by a named family.
 * @remarks
 * `models` is required — there is no implicit "all" for unknown model families.
 * `config` is `JsonObject` — passed verbatim to the wire request with no validation.
 * This is the "trust me, I know what I'm doing" path for callers who need to send
 * wire params our typed configs don't yet expose.
 * @public
 */
export interface IOtherModelOptions {
  readonly provider: 'other';
  readonly models: string[];
  readonly config: JsonObject;
}

/**
 * Discriminated union of all model-family option blocks.
 * Discriminated on `provider` + `family` fields.
 * @public
 */
export type IModelFamilyConfig =
  | IDallEModelOptions
  | IGptImageModelOptions
  | IGrokImagineModelOptions
  | IImagen4ModelOptions
  | IGeminiFlashImageModelOptions
  | IOtherModelOptions;

// ============================================================================
// Image Generation
// ============================================================================

/**
 * Options for image generation requests.
 *
 * @remarks
 * Uses a layered architecture:
 * 1. Generic top-level options (size, count, quality, seed) apply across providers
 *    via the resolved model's registry mapping.
 * 2. Optional `models` array contains model-family-scoped blocks; the resolver
 *    picks applicable blocks based on the resolved model and applies them in
 *    declaration order.
 *
 * **Merge precedence (later wins):**
 * 1. Generic top-level options (lowest precedence)
 * 2. Family-generic blocks (matching family, models field omitted)
 * 3. Model-specific blocks (models array includes resolved model name)
 * 4. Other blocks (provider: 'other', models array includes resolved model name)
 *
 * Provider-mismatch: blocks whose provider doesn't match the dispatcher's
 * provider lineage are silently skipped.
 *
 * @public
 */
export interface IAiImageGenerationOptions {
  /**
   * Image dimensions for OpenAI models (mapped to `size` field).
   * For xAI aspect ratio or Imagen aspect ratio, use the corresponding `models` family block.
   */
  readonly size?: AiImageSize;
  /** Number of images. Default 1. Some models enforce a maximum. */
  readonly count?: number;
  /**
   * Quality tier. Accepted values differ per model:
   * - dall-e-3: 'standard' | 'hd'
   * - gpt-image-1: 'low' | 'medium' | 'high' | 'auto'
   * Other models ignore this field.
   */
  readonly quality?: AiImageQuality;
  /** Reproducibility seed, where supported. */
  readonly seed?: number;
  /**
   * Optional precision via model-family-scoped blocks. The resolver picks
   * applicable blocks dynamically based on the resolved model.
   */
  readonly models?: ReadonlyArray<IModelFamilyConfig>;
}

/**
 * Parameters for an image-generation request.
 * @public
 */
export interface IAiImageGenerationParams {
  /** The text prompt describing the desired image. */
  readonly prompt: string;
  /** Optional generation options. */
  readonly options?: IAiImageGenerationOptions;
  /**
   * Optional reference images. When present, the provider will use them as
   * visual context (e.g. to preserve a character's appearance across multiple
   * generations). The dispatcher resolves the
   * {@link AiAssist.IAiImageModelCapability} for the requested model and
   * rejects the call up front if `acceptsImageReferenceInput` is not set on
   * the matching capability. An empty array is treated identically to
   * `undefined`.
   */
  readonly referenceImages?: ReadonlyArray<IAiImageAttachment>;
}

/**
 * A single generated image.
 * @public
 */
export interface IAiGeneratedImage extends IAiImageData {
  /**
   * The prompt as rewritten by the provider, if any. OpenAI's image models
   * commonly rewrite prompts; other providers do not.
   */
  readonly revisedPrompt?: string;
}

// ============================================================================
// Model Catalog (listModels)
// ============================================================================

/**
 * Capability vocabulary used to describe what a model can do. Used as both
 * a filter and as a tag in {@link AiAssist.IAiModelInfo.capabilities}.
 *
 * @remarks
 * Adding a new capability is cheap; adding the *first* one after consumers
 * already exist forces churn. The initial vocabulary is intentionally broad
 * even though only `image-generation` is fully exercised today.
 *
 * @public
 */
export type AiModelCapability = 'chat' | 'tools' | 'vision' | 'image-generation';

/**
 * Information about a single model returned by a provider's list endpoint,
 * with capabilities already resolved (native + config rules).
 * @public
 */
export interface IAiModelInfo {
  /** Provider-native model identifier. */
  readonly id: string;
  /** Resolved capability set — union of native declarations and config rules. */
  readonly capabilities: ReadonlySet<AiModelCapability>;
  /** Friendly name for display, when known. */
  readonly displayName?: string;
}

/**
 * One rule in an {@link IAiModelCapabilityConfig}. Multiple rules can match
 * a single model — their capability arrays are unioned.
 * @public
 */
export interface IAiModelCapabilityRule {
  /** RegExp tested against the model id (using `.test`). */
  readonly idPattern: RegExp;
  /** Capabilities this rule attributes to matching models. */
  readonly capabilities: ReadonlyArray<AiModelCapability>;
  /**
   * Friendly display-name override for matching models. The function form
   * lets one rule format many ids (e.g. `(id) => id.toUpperCase()`).
   * If multiple matching rules supply `displayName`, the first match wins.
   */
  readonly displayName?: string | ((id: string) => string);
}

/**
 * Configuration that maps model id patterns to capabilities. Used to
 * augment (or, where the provider supplies no capability info, fully
 * derive) the capability set for each listed model.
 * @public
 */
export interface IAiModelCapabilityConfig {
  /** Per-provider rules. Tried before {@link AiAssist.IAiModelCapabilityConfig.global}. */
  readonly perProvider?: { readonly [P in AiProviderId]?: ReadonlyArray<IAiModelCapabilityRule> };
  /** Cross-provider fallback rules. */
  readonly global?: ReadonlyArray<IAiModelCapabilityRule>;
}

/**
 * Result of an image-generation call.
 * @public
 */
export interface IAiImageGenerationResponse {
  /** The generated images, in provider-returned order. */
  readonly images: ReadonlyArray<IAiGeneratedImage>;
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Configuration for a single AI assist provider.
 * @public
 */
export interface IAiAssistProviderConfig {
  /** Which provider this configures */
  readonly provider: AiProviderId;
  /** For API-based providers: the keystore secret name holding the API key */
  readonly secretName?: string;
  /** Optional model override — string or context-aware map. */
  readonly model?: ModelSpec;
  /** Tool enablement/configuration. Tools are disabled unless explicitly enabled. */
  readonly tools?: ReadonlyArray<IAiToolEnablement>;
  /**
   * Optional caller-supplied endpoint URL (http/https). Overrides
   * `descriptor.baseUrl` for this provider. Used to point a provider at a
   * self-hosted server (Ollama, LM Studio, llama.cpp's openai-server) or a
   * local proxy. Validation lives in `@fgv/ts-extras` — query strings,
   * fragments, and userinfo are rejected.
   */
  readonly endpoint?: string;
}

/**
 * AI assist settings — which providers are enabled and their configuration.
 * @public
 */
export interface IAiAssistSettings {
  /** Enabled providers and their configuration. */
  readonly providers: ReadonlyArray<IAiAssistProviderConfig>;
  /** Which enabled provider is the default for the main button. Falls back to first in list. */
  readonly defaultProvider?: AiProviderId;
  /** Optional proxy URL for routing API requests through a backend server (e.g. `http://localhost:3002`). */
  readonly proxyUrl?: string;
  /** When true, route all providers through the proxy. When false (default), only CORS-restricted providers use the proxy. */
  readonly proxyAllProviders?: boolean;
}

/**
 * Default AI assist settings (copy-paste only).
 * @public
 */
export const DEFAULT_AI_ASSIST: IAiAssistSettings = {
  providers: [{ provider: 'copy-paste' }]
};

// ============================================================================
// Keystore Interface
// ============================================================================

/**
 * Minimal keystore interface for AI assist API key resolution.
 * Satisfied structurally by the concrete `KeyStore` class from `@fgv/ts-extras`.
 * @public
 */
export interface IAiAssistKeyStore {
  /** Whether the keystore is currently unlocked */
  readonly isUnlocked: boolean;
  /** Check if a named secret exists */
  hasSecret(name: string): Result<boolean>;
  /** Get an API key by secret name */
  getApiKey(name: string): Result<string>;
}
