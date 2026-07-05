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
 * Chat completion client for AI assist with support for multiple provider APIs.
 * Supports OpenAI-compatible providers (xAI, OpenAI, Groq, Mistral) directly,
 * plus adapters for Anthropic and Google Gemini. When server-side tools (e.g.
 * web_search) are configured, providers that support them include tool
 * configuration in the request and handle tool-augmented responses.
 *
 * @packageDocumentation
 */

import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';
import { fail, type Logging, mapResults, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import {
  AiPrompt,
  type AiModelCapability,
  allModelCapabilities,
  type AiServerToolConfig,
  type IAiCompletionResponse,
  type IAiGeneratedImage,
  type IAiImageAttachment,
  type IAiImageGenerationParams,
  type IAiImageGenerationResponse,
  type IAiImageModelCapability,
  type IAiModelCapabilityConfig,
  type IAiModelCapabilityRule,
  type IAiModelInfo,
  type IAiProviderDescriptor,
  type IChatMessage,
  type IChatRequest,
  type IThinkingConfig,
  type ModelSpec,
  type ModelSpecKey,
  resolveProviderModel
} from './model';
import {
  anthropicEffortToBudgetTokens,
  checkTemperatureConflict,
  mergeThinkingConfig,
  providerDiscriminatorForId,
  type IResolvedThinkingConfig
} from './thinkingOptionsResolver';
import {
  buildAnthropicMessages,
  buildGeminiContents,
  buildMessages,
  buildOpenAiChatUserContent,
  buildOpenAiResponsesUserContent,
  normalizeOutboundMessages,
  splitChatRequest
} from './chatRequestBuilders';
import { bearerAuthHeader, resolveEffectiveBaseUrl } from './endpoint';
import { type IAiApiConfig, fetchJson } from './http';
import { DEFAULT_MODEL_CAPABILITY_CONFIG, resolveImageCapability, supportsImageGeneration } from './registry';
import {
  resolveImageOptions,
  validateResolvedOptions,
  type IResolvedImageOptions
} from './imageOptionsResolver';
import { toAnthropicTools, toGeminiTools, toResponsesApiTools } from './toolFormats';

// ============================================================================
// Types
// ============================================================================

/**
 * Parameters for a provider completion request. Carries the unified
 * {@link AiAssist.IChatRequest} shape (`system?` + ordered `messages`, last =
 * current user turn); history is linearized before the current turn.
 * @public
 */
export interface IProviderCompletionParams extends IChatRequest {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** Sampling temperature (default: 0.7) */
  readonly temperature?: number;
  /** Optional model override — string or context-aware map (uses descriptor.defaultModel otherwise) */
  readonly modelOverride?: ModelSpec;
  /**
   * Optional quality tier selecting which completion model to use. `undefined`
   * selects the `base` tier; `'frontier'` cascades to `advanced` then `base`
   * when a tier is unset for a provider. Orthogonal to `thinking` and `tools`,
   * which never select a model.
   */
  readonly tier?: 'advanced' | 'frontier';
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Server-side tools to include in the request. Overrides settings-level tool config when provided. */
  readonly tools?: ReadonlyArray<AiServerToolConfig>;
  /** Optional abort signal for cancelling the in-flight request. */
  readonly signal?: AbortSignal;
  /**
   * Optional override of the descriptor's default base URL (scheme + host +
   * optional port + path prefix). The per-route suffix (e.g. `/chat/completions`)
   * is appended unchanged. Must be a well-formed `http`/`https` URL. Auth shape
   * is unchanged: `needsSecret` providers still require an API key.
   */
  readonly endpoint?: string;
  /**
   * Optional thinking/reasoning config. Anthropic, OpenAI, and xAI reject `temperature` when
   * the effective merged effort is non-`'none'`; Gemini always accepts both.
   */
  readonly thinking?: IThinkingConfig;
}

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Makes a multipart/form-data POST request and returns the parsed JSON, or a
 * failure. The Content-Type header (with boundary) is set automatically by
 * `fetch` from the `FormData` body — callers must NOT pass it explicitly.
 * @internal
 */
async function fetchMultipart(
  url: string,
  headers: Record<string, string>,
  body: FormData,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API request: POST ${url} (multipart)`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal
    });
  } catch (err: unknown) {
    /* c8 ignore next 1 - defensive: fetch errors are always Error instances in practice */
    const detail = err instanceof Error ? err.message : String(err);
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI API request failed: ${detail}`);
    return fail(`AI API request failed: ${detail}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI API returned ${response.status}: ${errorText}`);
    return fail(`AI API returned ${response.status}: ${errorText}`);
  }

  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API response: ${response.status}`);

  let json: unknown;
  try {
    json = await response.json();
  } catch /* c8 ignore start - defensive: response.json() failure on a 2xx */ {
    logger?.error('AI API returned invalid JSON response');
    return fail('AI API returned invalid JSON response');
  } /* c8 ignore stop */

  /* c8 ignore next 5 - defensive: provider returning non-object JSON on a 2xx */
  if (!isJsonObject(json)) {
    logger?.error('AI API returned non-object JSON response');
    return fail('AI API returned non-object JSON response');
  }
  return succeed(json);
}

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

/**
 * Makes an HTTP GET request and returns the parsed JSON, or a failure.
 * @internal
 */
async function fetchGetJson(
  url: string,
  headers: Record<string, string>,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API request: GET ${url}`);

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', headers, signal });
  } catch (err: unknown) {
    /* c8 ignore next 1 - defensive: fetch errors are always Error instances in practice */
    const detail = err instanceof Error ? err.message : String(err);
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI API request failed: ${detail}`);
    return fail(`AI API request failed: ${detail}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI API returned ${response.status}: ${errorText}`);
    return fail(`AI API returned ${response.status}: ${errorText}`);
  }

  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API response: ${response.status}`);

  let json: unknown;
  try {
    json = await response.json();
  } catch /* c8 ignore start - defensive: response.json() failure on a 2xx */ {
    logger?.error('AI API returned invalid JSON response');
    return fail('AI API returned invalid JSON response');
  } /* c8 ignore stop */

  /* c8 ignore next 5 - defensive: provider returning non-object JSON on a 2xx */
  if (!isJsonObject(json)) {
    logger?.error('AI API returned non-object JSON response');
    return fail('AI API returned non-object JSON response');
  }
  return succeed(json);
}

// ============================================================================
// Response validators (non-strict — extra API fields preserved for debugging)
// ============================================================================

// ---- OpenAI Chat Completions format ----

/** @internal */
interface IOpenAiMessage {
  content: string;
}
/** @internal */
interface IOpenAiChoice {
  message: IOpenAiMessage;
  finish_reason: string;
}
/** @internal */
interface IOpenAiResponse {
  choices: IOpenAiChoice[];
}

const openAiMessage: Validator<IOpenAiMessage> = Validators.object<IOpenAiMessage>({
  content: Validators.string
});
const openAiChoice: Validator<IOpenAiChoice> = Validators.object<IOpenAiChoice>({
  message: openAiMessage,
  finish_reason: Validators.string
});
const openAiResponse: Validator<IOpenAiResponse> = Validators.object<IOpenAiResponse>({
  choices: Validators.arrayOf(openAiChoice).withConstraint((arr) => arr.length > 0)
});

// ---- OpenAI/xAI Responses API format ----

/** @internal */
interface IResponsesApiOutputText {
  type: 'output_text';
  text: string;
}
/** @internal */
interface IResponsesApiMessage {
  type: 'message';
  role: string;
  content: IResponsesApiOutputText[];
}
/** @internal */
interface IResponsesApiResponse {
  output: Array<Record<string, unknown>>;
  status: string;
}

const responsesApiOutputText: Validator<IResponsesApiOutputText> = Validators.object<IResponsesApiOutputText>(
  {
    type: Validators.literal('output_text'),
    text: Validators.string
  }
);
const responsesApiMessage: Validator<IResponsesApiMessage> = Validators.object<IResponsesApiMessage>({
  type: Validators.literal('message'),
  role: Validators.string,
  content: Validators.arrayOf(responsesApiOutputText).withConstraint((arr) => arr.length > 0)
});
const responsesApiOutputItem: Validator<Record<string, unknown>> = Validators.isA(
  'object',
  (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
);
const responsesApiResponse: Validator<IResponsesApiResponse> = Validators.object<IResponsesApiResponse>({
  output: Validators.arrayOf(responsesApiOutputItem).withConstraint((arr) => arr.length > 0),
  status: Validators.string
});

// ---- Gemini format ----

/** @internal */
interface IGeminiPart {
  text: string;
}
/** @internal */
interface IGeminiContent {
  parts: IGeminiPart[];
}
/** @internal */
interface IGeminiCandidate {
  content: IGeminiContent;
  finishReason: string;
}
/** @internal */
interface IGeminiResponse {
  candidates: IGeminiCandidate[];
}

const geminiPart: Validator<IGeminiPart> = Validators.object<IGeminiPart>({
  text: Validators.string
});
const geminiContent: Validator<IGeminiContent> = Validators.object<IGeminiContent>({
  parts: Validators.arrayOf(geminiPart).withConstraint((arr) => arr.length > 0)
});
const geminiCandidate: Validator<IGeminiCandidate> = Validators.object<IGeminiCandidate>({
  content: geminiContent,
  finishReason: Validators.string
});
const geminiResponse: Validator<IGeminiResponse> = Validators.object<IGeminiResponse>({
  candidates: Validators.arrayOf(geminiCandidate).withConstraint((arr) => arr.length > 0)
});

// ============================================================================
// OpenAI-compatible client (Chat Completions — no tools)
// ============================================================================

/**
 * Calls an OpenAI-compatible chat completion endpoint.
 * Works for xAI Grok, OpenAI, Groq, and Mistral.
 * @internal
 */
async function callOpenAiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  head?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt.system, buildOpenAiChatUserContent(prompt), {
    head
  });
  const effort = resolvedThinking?.openAiEffort ?? resolvedThinking?.xaiEffort;
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    ...(effort === undefined || effort === 'none' ? { temperature } : {}),
    ...(effort !== undefined && config.model !== 'grok-4' ? { reasoning_effort: effort } : {})
  };
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }

  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);

  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI completion: model=${config.model}`);
  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return openAiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `OpenAI API response: ${msg}`)
    .onSuccess((response) => {
      const choice = response.choices[0];
      return succeed({
        content: choice.message.content,
        truncated: choice.finish_reason === 'length'
      });
    });
}

// ============================================================================
// OpenAI/xAI Responses API (with tools)
// ============================================================================

/**
 * Extracts text content from a Responses API output array.
 * Finds the first message-type output item and concatenates its text content blocks.
 * @internal
 */
function extractResponsesApiText(output: Array<Record<string, unknown>>): Result<string> {
  for (const item of output) {
    if (item.type === 'message') {
      const messageResult = responsesApiMessage.validate(item as JsonObject);
      if (messageResult.isSuccess()) {
        return succeed(messageResult.value.content.map((c) => c.text).join(''));
      }
    }
  }
  return fail('Responses API output contained no message with text content');
}

/**
 * Calls the xAI/OpenAI Responses API with server-side tools.
 * Used when tools are configured for an openai-format provider.
 * @internal
 */
async function callOpenAiResponsesCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  tools: ReadonlyArray<AiServerToolConfig>,
  head?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/responses`;
  const input = buildMessages(prompt.system, buildOpenAiResponsesUserContent(prompt), {
    head
  });
  const effort = resolvedThinking?.openAiEffort ?? resolvedThinking?.xaiEffort;
  const body: Record<string, unknown> = {
    model: config.model,
    input,
    tools: toResponsesApiTools(tools),
    ...(effort === undefined || effort === 'none' ? { temperature } : {}),
    ...(effort !== undefined && config.model !== 'grok-4' ? { reasoning: { effort } } : {})
  };
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }

  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);

  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI Responses API: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`);
  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return responsesApiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Responses API response: ${msg}`)
    .onSuccess((response) => {
      return extractResponsesApiText(response.output).onSuccess((text) =>
        succeed({
          content: text,
          truncated: response.status === 'incomplete'
        })
      );
    });
}

// ============================================================================
// Anthropic adapter
// ============================================================================

/**
 * Extracts text content from Anthropic response content blocks.
 * When tools are used, the content array contains mixed block types
 * (text, server_tool_use, web_search_tool_result). We extract and
 * concatenate only the text blocks.
 * @internal
 */
function extractAnthropicText(content: unknown[]): Result<string> {
  const textParts: string[] = [];
  for (const block of content) {
    if (typeof block === 'object' && block !== null && 'type' in block) {
      const typed = block as Record<string, unknown>;
      if (typed.type === 'text' && typeof typed.text === 'string') {
        textParts.push(typed.text);
      }
    }
  }
  if (textParts.length === 0) {
    return fail('Anthropic response contained no text content blocks');
  }
  return succeed(textParts.join(''));
}

/** Calls the Anthropic Messages API with optional tool support. @internal */
async function callAnthropicCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  head?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  tools?: ReadonlyArray<AiServerToolConfig>,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/messages`;
  const messages = buildAnthropicMessages(prompt, { head });
  const body: Record<string, unknown> = {
    model: config.model,
    system: prompt.system,
    messages,
    max_tokens: 4096,
    ...(resolvedThinking?.anthropicEffort === undefined ? { temperature } : {})
  };

  const effort = resolvedThinking?.anthropicEffort;
  if (effort !== undefined) {
    body.thinking = { type: 'enabled', budget_tokens: anthropicEffortToBudgetTokens(effort) };
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }

  if (tools && tools.length > 0) {
    body.tools = toAnthropicTools(tools);
    /* c8 ignore next 3 - optional logger diagnostic output */
    logger?.info(`Anthropic completion: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`);
  } else {
    /* c8 ignore next 1 - optional logger */
    logger?.info(`Anthropic completion: model=${config.model}`);
  }

  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };

  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const rawContent = (jsonResult.value as Record<string, unknown>).content;
  const stopReason = (jsonResult.value as Record<string, unknown>).stop_reason;
  if (!Array.isArray(rawContent)) {
    return fail('Anthropic API response: content is not an array');
  }
  if (typeof stopReason !== 'string') {
    return fail('Anthropic API response: stop_reason is missing or not a string');
  }
  return extractAnthropicText(rawContent).onSuccess((text) =>
    succeed({
      content: text,
      truncated: stopReason === 'max_tokens'
    })
  );
}

// ============================================================================
// Google Gemini adapter
// ============================================================================

/**
 * Calls the Google Gemini generateContent API.
 * When tools are configured, includes Google Search grounding.
 * @internal
 */
async function callGeminiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  head?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  tools?: ReadonlyArray<AiServerToolConfig>,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;
  const contents = buildGeminiContents(prompt, { head });

  const generationConfig: Record<string, unknown> = { temperature };
  if (resolvedThinking?.geminiThinkingBudget !== undefined) {
    generationConfig.thinkingConfig = { thinkingBudget: resolvedThinking.geminiThinkingBudget };
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(generationConfig, resolvedThinking.otherParams);
  }
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents,
    generationConfig
  };

  if (tools && tools.length > 0) {
    body.tools = toGeminiTools(tools);
    /* c8 ignore next 1 - optional logger */
    logger?.info(`Gemini completion: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`);
  } else {
    /* c8 ignore next 1 - optional logger */
    logger?.info(`Gemini completion: model=${config.model}`);
  }

  const headers: Record<string, string> = {
    'x-goog-api-key': config.apiKey
  };

  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return geminiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Gemini API response: ${msg}`)
    .onSuccess((response) => {
      const candidate = response.candidates[0];
      return succeed({
        content: candidate.content.parts[0].text,
        truncated: candidate.finishReason === 'MAX_TOKENS'
      });
    });
}

// ============================================================================
// Provider dispatcher
// ============================================================================

/**
 * Calls the appropriate chat completion API for a given provider. Routes by
 * `apiFormat`: `'openai'` (xAI/OpenAI/Groq/Mistral — switches to Responses API
 * when tools are set), `'anthropic'`, or `'gemini'`.
 * @public
 */
export async function callProviderCompletion(
  params: IProviderCompletionParams
): Promise<Result<IAiCompletionResponse>> {
  const {
    descriptor,
    apiKey,
    system,
    messages,
    temperature,
    modelOverride,
    tier,
    logger,
    tools,
    signal,
    endpoint,
    thinking
  } = params;

  const splitResult = splitChatRequest(system, messages);
  if (splitResult.isFailure()) {
    return fail(splitResult.message);
  }
  const { prompt, head } = splitResult.value;

  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }
  if (prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  const hasTools = tools !== undefined && tools.length > 0;
  const discriminator = providerDiscriminatorForId(descriptor.id);
  // The quality tier is the only completion-model selector; thinking and tools
  // are orthogonal request params/capabilities and never pick a model.
  const modelContext: ModelSpecKey | undefined = tier;

  const modelResult = resolveProviderModel(descriptor, modelOverride, modelContext);
  if (modelResult.isFailure()) {
    return fail(modelResult.message);
  }
  const model = modelResult.value;

  let resolvedThinking: IResolvedThinkingConfig | undefined;
  if (thinking !== undefined) {
    if (discriminator !== undefined) {
      const mergeResult = mergeThinkingConfig(thinking, model, discriminator);
      /* c8 ignore next 3 - mergeThinkingConfig always succeeds; defensive guard */
      if (mergeResult.isFailure()) {
        return fail(mergeResult.message);
      }
      resolvedThinking = mergeResult.value;
      const conflictResult = checkTemperatureConflict(resolvedThinking, discriminator, temperature);
      if (conflictResult.isFailure()) {
        return fail(conflictResult.message);
      }
    }
  }

  const effectiveTemperature = temperature ?? 0.7;
  const config: IAiApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model
  };
  /* c8 ignore next 8 - optional logger diagnostic output */
  if (logger) {
    const toolTypes = hasTools ? tools.map((t) => t.type).join(',') : 'none';
    const supported = descriptor.supportedTools.length > 0 ? descriptor.supportedTools.join(',') : 'none';
    logger.info(
      `AI completion: provider=${descriptor.id}, format=${descriptor.apiFormat}, model=${config.model}, ` +
        `tools=${toolTypes}, supported=${supported}`
    );
  }

  switch (descriptor.apiFormat) {
    case 'openai':
      if (hasTools) {
        return callOpenAiResponsesCompletion(
          config,
          prompt,
          tools,
          head,
          effectiveTemperature,
          logger,
          signal,
          resolvedThinking
        );
      }
      return callOpenAiCompletion(
        config,
        prompt,
        head,
        effectiveTemperature,
        logger,
        signal,
        resolvedThinking
      );
    case 'anthropic':
      return callAnthropicCompletion(
        config,
        prompt,
        head,
        effectiveTemperature,
        logger,
        tools,
        signal,
        resolvedThinking
      );
    case 'gemini':
      return callGeminiCompletion(
        config,
        prompt,
        head,
        effectiveTemperature,
        logger,
        tools,
        signal,
        resolvedThinking
      );
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
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
  content: IGeminiImageOutContent;
  finishReason?: string;
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
  parts: Validators.arrayOf(geminiImageOutPart).withConstraint((arr) => arr.length > 0)
});
const geminiImageOutCandidate: Validator<IGeminiImageOutCandidate> =
  Validators.object<IGeminiImageOutCandidate>({
    content: geminiImageOutContent,
    finishReason: Validators.string.optional()
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

// ---- Proxied list-models response ----

/**
 * Wire shape for proxy list-models responses. `capabilities` arrives as an
 * array (Sets don't survive JSON), then gets reassembled into a `Set` in
 * {@link callProxiedListModels}.
 * @internal
 */
interface IProxiedListModelsEntry {
  id: string;
  capabilities: AiModelCapability[];
  displayName?: string;
}
/** @internal */
interface IProxiedListModelsBody {
  models: IProxiedListModelsEntry[];
}

const proxiedListModelsEntry: Validator<IProxiedListModelsEntry> = Validators.object<IProxiedListModelsEntry>(
  {
    id: Validators.string,
    capabilities: Validators.arrayOf(Validators.enumeratedValue<AiModelCapability>(allModelCapabilities)),
    displayName: Validators.string.optional()
  }
);
const proxiedListModelsResponse: Validator<IProxiedListModelsBody> =
  Validators.object<IProxiedListModelsBody>({
    models: Validators.arrayOf(proxiedListModelsEntry)
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
  return fetched.onSuccess((json) =>
    openAiImageResponse
      .validate(json)
      .withErrorFormat((msg) => `xAI images API response: ${msg}`)
      .onSuccess((response) =>
        succeed({
          images: response.data.map((item) => ({
            mimeType: capability.defaultOutputMimeType ?? 'image/jpeg',
            base64: item.b64_json
          }))
        })
      )
  );
}

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
  const headers: Record<string, string> = {
    'x-goog-api-key': config.apiKey
  };

  /* c8 ignore next 1 - optional logger */
  logger?.info(`Gemini image-out: model=${config.model}, refs=${refs.length}`);
  return (await fetchJson(url, headers, body, logger, signal)).onSuccess((json) =>
    geminiImageOutResponse
      .validate(json)
      .withErrorFormat((msg) => `Gemini image API response: ${msg}`)
      .onSuccess((response) => {
        const images: IAiGeneratedImage[] = [];
        for (const candidate of response.candidates) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              images.push({
                mimeType: part.inlineData.mimeType,
                base64: part.inlineData.data
              });
            }
          }
        }
        if (images.length === 0) {
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
        return editsResult.onSuccess((json) =>
          openAiImageResponse
            .validate(json)
            .withErrorFormat((msg) => `xAI images API response: ${msg}`)
            .onSuccess((response) =>
              succeed({
                images: response.data.map((item) => ({
                  mimeType: capability.defaultOutputMimeType ?? 'image/jpeg',
                  base64: item.b64_json
                }))
              })
            )
        );
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
// List models — request types
// ============================================================================

/**
 * Parameters for a list-models request.
 * @public
 */
export interface IProviderListModelsParams {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** Optional capability filter; when set, only models declaring this capability are returned. */
  readonly capability?: AiModelCapability;
  /** Optional capability config override (defaults to {@link DEFAULT_MODEL_CAPABILITY_CONFIG}). */
  readonly capabilityConfig?: IAiModelCapabilityConfig;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Optional abort signal for cancelling the in-flight request. */
  readonly signal?: AbortSignal;
  /** Optional override of the descriptor's base URL; per-format `/models` route is appended unchanged. */
  readonly endpoint?: string;
}

// ============================================================================
// List models — response validators
// ============================================================================

// ---- OpenAI / xAI / Groq / Mistral list format ----

/** @internal */
interface IOpenAiListEntry {
  id: string;
}
/** @internal */
interface IOpenAiListResponse {
  data: IOpenAiListEntry[];
}

const openAiListEntry: Validator<IOpenAiListEntry> = Validators.object<IOpenAiListEntry>({
  id: Validators.string
});
const openAiListResponse: Validator<IOpenAiListResponse> = Validators.object<IOpenAiListResponse>({
  data: Validators.arrayOf(openAiListEntry)
});

// ---- Anthropic list format ----

/** @internal */
interface IAnthropicListEntry {
  id: string;
  display_name?: string;
}
/** @internal */
interface IAnthropicListResponse {
  data: IAnthropicListEntry[];
}

const anthropicListEntry: Validator<IAnthropicListEntry> = Validators.object<IAnthropicListEntry>({
  id: Validators.string,
  display_name: Validators.string.optional()
});
const anthropicListResponse: Validator<IAnthropicListResponse> = Validators.object<IAnthropicListResponse>({
  data: Validators.arrayOf(anthropicListEntry)
});

// ---- Gemini list format ----

/** @internal */
interface IGeminiListEntry {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}
/** @internal */
interface IGeminiListResponse {
  models: IGeminiListEntry[];
}

const geminiListEntry: Validator<IGeminiListEntry> = Validators.object<IGeminiListEntry>({
  name: Validators.string,
  displayName: Validators.string.optional(),
  supportedGenerationMethods: Validators.arrayOf(Validators.string).optional()
});
const geminiListResponse: Validator<IGeminiListResponse> = Validators.object<IGeminiListResponse>({
  models: Validators.arrayOf(geminiListEntry)
});

// ============================================================================
// List models — capability resolution
// ============================================================================

/**
 * Translates Gemini's `supportedGenerationMethods` strings into our abstract
 * capability vocabulary. Methods without a mapping are ignored.
 * @internal
 */
function geminiMethodsToCapabilities(methods: ReadonlyArray<string>): ReadonlyArray<AiModelCapability> {
  const out: AiModelCapability[] = [];
  for (const m of methods) {
    if (m === 'generateContent') {
      out.push('chat');
    } else if (m === 'predict') {
      out.push('image-generation');
    }
  }
  return out;
}

/**
 * Strips the `models/` prefix Gemini includes on listed model names.
 * @internal
 */
function geminiBareId(name: string): string {
  /* c8 ignore next 1 - defensive: Gemini API always returns names prefixed with 'models/' */
  return name.startsWith('models/') ? name.substring('models/'.length) : name;
}

/**
 * Applies a capability config to a model id. Walks per-provider rules then
 * global rules; unions all matching rules' capabilities. Returns the union
 * and the first matching `displayName` (if any).
 * @internal
 */
function applyCapabilityConfig(
  config: IAiModelCapabilityConfig,
  providerId: string,
  modelId: string
): { capabilities: AiModelCapability[]; displayName: string | undefined } {
  const caps = new Set<AiModelCapability>();
  let displayName: string | undefined;

  const rulesets: ReadonlyArray<ReadonlyArray<IAiModelCapabilityRule>> = [
    config.perProvider?.[providerId as keyof typeof config.perProvider] ?? [],
    config.global ?? []
  ];

  for (const rules of rulesets) {
    for (const rule of rules) {
      rule.idPattern.lastIndex = 0;
      if (rule.idPattern.test(modelId)) {
        for (const cap of rule.capabilities) {
          caps.add(cap);
        }
        if (displayName === undefined && rule.displayName !== undefined) {
          displayName = typeof rule.displayName === 'function' ? rule.displayName(modelId) : rule.displayName;
        }
      }
    }
  }
  return { capabilities: Array.from(caps), displayName };
}

/**
 * Combines provider-native capability info (when supplied) and config-derived
 * capability info into a final {@link IAiModelInfo}.
 * @internal
 */
function buildModelInfo(
  providerId: string,
  id: string,
  nativeCapabilities: ReadonlyArray<AiModelCapability>,
  nativeDisplayName: string | undefined,
  config: IAiModelCapabilityConfig
): IAiModelInfo {
  const fromConfig = applyCapabilityConfig(config, providerId, id);
  const all = new Set<AiModelCapability>([...nativeCapabilities, ...fromConfig.capabilities]);
  return {
    id,
    capabilities: all,
    ...(nativeDisplayName !== undefined
      ? { displayName: nativeDisplayName }
      : fromConfig.displayName !== undefined
      ? { displayName: fromConfig.displayName }
      : {})
  };
}

// ============================================================================
// List models — adapters
// ============================================================================

/**
 * Calls the OpenAI-style `GET /models` endpoint. Used by openai, xai-grok,
 * groq, and mistral. Provider supplies no capability info — capabilities are
 * derived entirely from the config.
 * @internal
 */
async function callOpenAiListModels(
  config: IAiApiConfig,
  providerId: string,
  capabilityConfig: IAiModelCapabilityConfig,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const url = `${config.baseUrl}/models`;
  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);
  /* c8 ignore next 1 - optional logger */
  logger?.info(`List models: provider=${providerId}, format=openai`);
  const jsonResult = await fetchGetJson(url, headers, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return openAiListResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `OpenAI models API response: ${msg}`)
    .onSuccess((response) => {
      const models = response.data.map((entry) =>
        buildModelInfo(providerId, entry.id, [], undefined, capabilityConfig)
      );
      return succeed(models);
    });
}

/**
 * Calls the Anthropic `GET /models` endpoint. Provider supplies a
 * `display_name` but no native capability info.
 * @internal
 */
async function callAnthropicListModels(
  config: IAiApiConfig,
  providerId: string,
  capabilityConfig: IAiModelCapabilityConfig,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const url = `${config.baseUrl}/models`;
  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
  /* c8 ignore next 1 - optional logger */
  logger?.info(`List models: provider=${providerId}, format=anthropic`);
  const jsonResult = await fetchGetJson(url, headers, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return anthropicListResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Anthropic models API response: ${msg}`)
    .onSuccess((response) => {
      const models = response.data.map((entry) =>
        buildModelInfo(providerId, entry.id, [], entry.display_name, capabilityConfig)
      );
      return succeed(models);
    });
}

/**
 * Calls the Gemini `GET /models` endpoint. Provider supplies both a
 * `displayName` and `supportedGenerationMethods` — translated to native
 * capabilities and unioned with config-derived capabilities.
 * @internal
 */
async function callGeminiListModels(
  config: IAiApiConfig,
  providerId: string,
  capabilityConfig: IAiModelCapabilityConfig,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const url = `${config.baseUrl}/models`;
  const headers: Record<string, string> = {
    'x-goog-api-key': config.apiKey
  };
  /* c8 ignore next 1 - optional logger */
  logger?.info(`List models: provider=${providerId}, format=gemini`);
  const jsonResult = await fetchGetJson(url, headers, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return geminiListResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Gemini models API response: ${msg}`)
    .onSuccess((response) => {
      const models = response.models.map((entry) => {
        const id = geminiBareId(entry.name);
        const native = entry.supportedGenerationMethods
          ? geminiMethodsToCapabilities(entry.supportedGenerationMethods)
          : [];
        return buildModelInfo(providerId, id, native, entry.displayName, capabilityConfig);
      });
      return succeed(models);
    });
}

// ============================================================================
// List models — dispatcher
// ============================================================================

/**
 * Lists models available from a provider, routing by `descriptor.apiFormat`.
 * Capabilities are resolved from native provider info and a configurable rule set.
 * @param params - Request parameters (descriptor, API key, optional capability filter)
 * @public
 */
export async function callProviderListModels(
  params: IProviderListModelsParams
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const { descriptor, apiKey, capability, capabilityConfig, logger, signal, endpoint } = params;

  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }

  const config: IAiApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model: '' // unused by listing
  };
  const effectiveConfig = capabilityConfig ?? DEFAULT_MODEL_CAPABILITY_CONFIG;

  let listResult: Result<ReadonlyArray<IAiModelInfo>>;
  switch (descriptor.apiFormat) {
    case 'openai':
      listResult = await callOpenAiListModels(config, descriptor.id, effectiveConfig, logger, signal);
      break;
    case 'anthropic':
      listResult = await callAnthropicListModels(config, descriptor.id, effectiveConfig, logger, signal);
      break;
    case 'gemini':
      listResult = await callGeminiListModels(config, descriptor.id, effectiveConfig, logger, signal);
      break;
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
  }

  if (listResult.isFailure()) {
    return listResult;
  }
  if (capability === undefined) {
    return listResult;
  }
  return succeed(listResult.value.filter((m) => m.capabilities.has(capability)));
}

// ============================================================================
// Proxied list models
// ============================================================================

/**
 * Calls the model-listing endpoint on a proxy server. Endpoint:
 * `POST ${proxyUrl}/api/ai/list-models`. Capability config is not forwarded;
 * `capabilities` is serialized as a string array. Error body `{error: string}`
 * is surfaced as `proxy: ${error}`.
 * @public
 */
export async function callProxiedListModels(
  proxyUrl: string,
  params: IProviderListModelsParams
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const { descriptor, apiKey, capability, logger, signal } = params;

  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey
  };
  if (capability !== undefined) {
    body.capability = capability;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI list-models proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/list-models`;
  const jsonResult = await fetchJson(url, {}, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const response = jsonResult.value as Record<string, unknown>;
  if (typeof response.error === 'string') {
    return fail(`proxy: ${response.error}`);
  }

  return proxiedListModelsResponse
    .validate(response)
    .withErrorFormat((msg) => `proxy returned invalid response: ${msg}`)
    .onSuccess((parsed) => {
      const models: IAiModelInfo[] = parsed.models.map((m) => ({
        id: m.id,
        capabilities: new Set<AiModelCapability>(m.capabilities),
        ...(m.displayName !== undefined ? { displayName: m.displayName } : {})
      }));
      return succeed(models);
    });
}

// ============================================================================
// Proxied completion (routes through a backend server)
// ============================================================================

/**
 * Calls the AI completion endpoint on a proxy server instead of calling the
 * provider API directly from the browser. The proxy handles provider dispatch,
 * CORS, and API key forwarding. The request body serializes the unified
 * {@link AiAssist.IChatRequest} shape (`system?` + `messages`). Enforces the same
 * non-empty / trailing-user-turn and image-input invariants as the direct path.
 * @param proxyUrl - Base URL of the proxy server
 * @param params - Same parameters as {@link callProviderCompletion}
 * @public
 */
export async function callProxiedCompletion(
  proxyUrl: string,
  params: IProviderCompletionParams
): Promise<Result<IAiCompletionResponse>> {
  const {
    descriptor,
    apiKey,
    system,
    messages,
    temperature,
    modelOverride,
    logger,
    tools,
    signal,
    thinking
  } = params;

  const splitResult = splitChatRequest(system, messages);
  if (splitResult.isFailure()) {
    return fail(splitResult.message);
  }
  if (splitResult.value.prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey,
    messages: normalizeOutboundMessages(splitResult.value),
    temperature: temperature ?? 0.7
  };
  if (system !== undefined) {
    body.system = system;
  }
  if (modelOverride !== undefined) {
    body.modelOverride = modelOverride;
  }
  if (tools && tools.length > 0) {
    body.tools = tools;
  }
  if (thinking !== undefined) {
    body.thinking = thinking;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);
  const url = `${proxyUrl}/api/ai/completion`;
  const jsonResult = await fetchJson(url, {}, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const response = jsonResult.value as Record<string, unknown>;
  if (typeof response.error === 'string') {
    return fail(`proxy: ${response.error}`);
  }

  if (typeof response.content !== 'string') {
    return fail('proxy returned invalid response: missing content');
  }

  return succeed({
    content: response.content,
    truncated: response.truncated === true
  });
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
