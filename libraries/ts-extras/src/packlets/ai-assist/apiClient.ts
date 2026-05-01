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
 *
 * Supports OpenAI-compatible providers (xAI, OpenAI, Groq, Mistral) directly,
 * plus adapters for Anthropic and Google Gemini.
 *
 * When server-side tools (e.g. web_search) are configured, providers that support
 * them will include tool configuration in the request and handle tool-augmented
 * responses.
 *
 * @packageDocumentation
 */

import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';
import { fail, type Logging, mapResults, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import {
  AiPrompt,
  type AiModelCapability,
  type AiServerToolConfig,
  type IAiCompletionResponse,
  type IAiGeneratedImage,
  type IAiImageAttachment,
  type IAiImageGenerationOptions,
  type IAiImageGenerationParams,
  type IAiImageGenerationResponse,
  type IAiModelCapabilityConfig,
  type IAiModelCapabilityRule,
  type IAiModelInfo,
  type IAiProviderDescriptor,
  type IChatMessage,
  type ModelSpec,
  resolveModel
} from './model';
import {
  buildAnthropicMessages,
  buildGeminiContents,
  buildMessages,
  buildOpenAiChatUserContent,
  buildOpenAiResponsesUserContent
} from './chatRequestBuilders';
import { DEFAULT_MODEL_CAPABILITY_CONFIG, resolveImageCapability, supportsImageGeneration } from './registry';
import { toAnthropicTools, toGeminiTools, toResponsesApiTools } from './toolFormats';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal API configuration built from a provider descriptor.
 * @internal
 */
interface IAiApiConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
}

/**
 * Parameters for a provider completion request.
 * @public
 */
export interface IProviderCompletionParams {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** The structured prompt to send */
  readonly prompt: AiPrompt;
  /**
   * Additional messages to append after system+user (e.g. for correction retries).
   * These are appended in order after the initial system and user messages.
   */
  readonly additionalMessages?: ReadonlyArray<IChatMessage>;
  /** Sampling temperature (default: 0.7) */
  readonly temperature?: number;
  /** Optional model override — string or context-aware map (uses descriptor.defaultModel otherwise) */
  readonly modelOverride?: ModelSpec;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Server-side tools to include in the request. Overrides settings-level tool config when provided. */
  readonly tools?: ReadonlyArray<AiServerToolConfig>;
  /** Optional abort signal for cancelling the in-flight request. */
  readonly signal?: AbortSignal;
  /**
   * Optional override of the descriptor's default base URL. When set, the
   * dispatcher uses this URL (scheme + host + optional port + optional path
   * prefix) and appends the descriptor's per-route suffix (e.g.
   * `/chat/completions`) the same way it composes against the default.
   *
   * Must be a well-formed `http`/`https` URL string. Used to dispatch the same
   * provider descriptor against a self-hosted or local endpoint (e.g.
   * `http://localhost:11434/v1` for Ollama, or LAN-hosted OpenAI-compatible
   * servers).
   *
   * Setting `endpoint` does not change the auth shape: providers with
   * `needsSecret === true` still require an API key.
   */
  readonly endpoint?: string;
}

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Resolves the effective base URL for a request, validating the optional
 * `endpoint` override when present. Returns the validated URL with any
 * trailing slash stripped so per-route suffix concatenation produces the
 * same shape as the default-baseUrl path.
 * @internal
 */
function resolveEffectiveBaseUrl(descriptor: IAiProviderDescriptor, endpoint?: string): Result<string> {
  if (endpoint === undefined) {
    if (!descriptor.baseUrl) {
      return fail(`provider "${descriptor.id}" has no API endpoint configured`);
    }
    return succeed(descriptor.baseUrl);
  }
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    return fail(`provider "${descriptor.id}": endpoint must be a non-empty http(s) URL`);
  }
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    return fail(`provider "${descriptor.id}": endpoint is not a valid URL: ${endpoint}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return fail(`provider "${descriptor.id}": endpoint must use http or https: ${endpoint}`);
  }
  return succeed(endpoint.replace(/\/+$/, ''));
}

/**
 * Makes an HTTP request and returns the parsed JSON, or a failure.
 * @internal
 */
async function fetchJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI API request: POST ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body),
      signal
    });
  } catch (err: unknown) {
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
  } catch {
    /* c8 ignore next 1 - optional logger */
    logger?.error('AI API returned invalid JSON response');
    return fail('AI API returned invalid JSON response');
  }

  if (!isJsonObject(json)) {
    /* c8 ignore next 1 - optional logger */
    logger?.error('AI API returned non-object JSON response');
    return fail('AI API returned non-object JSON response');
  }
  return succeed(json);
}

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
  } catch {
    /* c8 ignore next 1 - optional logger */
    logger?.error('AI API returned invalid JSON response');
    return fail('AI API returned invalid JSON response');
  }

  if (!isJsonObject(json)) {
    /* c8 ignore next 1 - optional logger */
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
  } catch {
    /* c8 ignore next 1 - optional logger */
    logger?.error('AI API returned invalid JSON response');
    return fail('AI API returned invalid JSON response');
  }

  if (!isJsonObject(json)) {
    /* c8 ignore next 1 - optional logger */
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

// ---- Anthropic format ----

/** @internal */
interface IAnthropicContentBlock {
  text: string;
}
/** @internal */
interface IAnthropicResponse {
  content: IAnthropicContentBlock[];
  stop_reason: string;
}

const anthropicContentBlock: Validator<IAnthropicContentBlock> = Validators.object<IAnthropicContentBlock>({
  text: Validators.string
});
const anthropicResponse: Validator<IAnthropicResponse> = Validators.object<IAnthropicResponse>({
  content: Validators.arrayOf(anthropicContentBlock).withConstraint((arr) => arr.length > 0),
  stop_reason: Validators.string
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
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt.system, buildOpenAiChatUserContent(prompt), {
    tail: additionalMessages
  });
  const body = { model: config.model, messages, temperature };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`
  };

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
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/responses`;
  const input = buildMessages(prompt.system, buildOpenAiResponsesUserContent(prompt), {
    tail: additionalMessages
  });
  const body: Record<string, unknown> = {
    model: config.model,
    input,
    tools: toResponsesApiTools(tools),
    temperature
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`
  };

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

/**
 * Calls the Anthropic Messages API.
 * When tools are configured, includes them in the request and handles
 * mixed content block responses.
 * @internal
 */
async function callAnthropicCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  tools?: ReadonlyArray<AiServerToolConfig>,
  signal?: AbortSignal
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/messages`;

  // Anthropic uses system as a top-level field, not in messages
  const messages = buildAnthropicMessages(prompt, { tail: additionalMessages });

  const body: Record<string, unknown> = {
    model: config.model,
    system: prompt.system,
    messages,
    max_tokens: 4096,
    temperature
  };

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

  // When tools are used, the response content is a mixed array of block types.
  // We need to extract text from all text blocks.
  if (tools && tools.length > 0) {
    const rawContent = (jsonResult.value as Record<string, unknown>).content;
    const stopReason = (jsonResult.value as Record<string, unknown>).stop_reason;
    if (!Array.isArray(rawContent)) {
      return fail('Anthropic API response: content is not an array');
    }
    return extractAnthropicText(rawContent).onSuccess((text) =>
      succeed({
        content: text,
        truncated: stopReason === 'max_tokens'
      })
    );
  }

  return anthropicResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Anthropic API response: ${msg}`)
    .onSuccess((response) => {
      return succeed({
        content: response.content[0].text,
        truncated: response.stop_reason === 'max_tokens'
      });
    });
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
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7,
  logger?: Logging.ILogger,
  tools?: ReadonlyArray<AiServerToolConfig>,
  signal?: AbortSignal
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;

  // Gemini uses 'contents' with 'parts', and 'model' role instead of 'assistant'
  const contents = buildGeminiContents(prompt, { tail: additionalMessages });

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents,
    generationConfig: { temperature }
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
 * Calls the appropriate chat completion API for a given provider.
 *
 * Routes based on the provider descriptor's `apiFormat` field:
 * - `'openai'` for xAI, OpenAI, Groq, Mistral
 * - `'anthropic'` for Anthropic Claude
 * - `'gemini'` for Google Gemini
 *
 * When tools are provided and the provider supports them:
 * - OpenAI-format providers switch to the Responses API
 * - Anthropic includes tools in the Messages API request
 * - Gemini includes Google Search grounding
 *
 * @param params - Request parameters including descriptor, API key, prompt, and optional tools
 * @returns The completion response with content and truncation status, or a failure
 * @public
 */
export async function callProviderCompletion(
  params: IProviderCompletionParams
): Promise<Result<IAiCompletionResponse>> {
  const {
    descriptor,
    apiKey,
    prompt,
    additionalMessages,
    temperature = 0.7,
    modelOverride,
    logger,
    tools,
    signal,
    endpoint
  } = params;

  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }
  if (prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  const hasTools = tools !== undefined && tools.length > 0;
  const modelContext = hasTools ? 'tools' : undefined;

  const config: IAiApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model: resolveModel(modelOverride ?? descriptor.defaultModel, modelContext)
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
          additionalMessages,
          temperature,
          logger,
          signal
        );
      }
      return callOpenAiCompletion(config, prompt, additionalMessages, temperature, logger, signal);
    case 'anthropic':
      return callAnthropicCompletion(config, prompt, additionalMessages, temperature, logger, tools, signal);
    case 'gemini':
      return callGeminiCompletion(config, prompt, additionalMessages, temperature, logger, tools, signal);
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

// ---- Gemini Imagen format ----

/** @internal */
interface IImagenPrediction {
  bytesBase64Encoded: string;
  mimeType?: string;
}
/** @internal */
interface IImagenResponse {
  predictions: IImagenPrediction[];
}

const imagenPrediction: Validator<IImagenPrediction> = Validators.object<IImagenPrediction>({
  bytesBase64Encoded: Validators.string,
  mimeType: Validators.string.optional()
});
const imagenResponse: Validator<IImagenResponse> = Validators.object<IImagenResponse>({
  predictions: Validators.arrayOf(imagenPrediction).withConstraint((arr) => arr.length > 0)
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
    capabilities: Validators.arrayOf(
      Validators.enumeratedValue<AiModelCapability>(['chat', 'tools', 'vision', 'image-generation'])
    ),
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

/**
 * Calls the OpenAI Images API. Used for both `openai-images` and `xai-images`
 * formats — the request shape is the same; the only difference is whether the
 * `size` field is honored (OpenAI: yes, xAI: ignored at the provider).
 *
 * When `request.referenceImages` is non-empty, routes to `/images/edits`
 * (multipart) instead of `/images/generations` (JSON). Per-model edit support
 * is not validated here (e.g. dall-e-3 does not support edits) — the
 * provider's 400 surfaces through the failure path.
 *
 * @internal
 */
async function callOpenAiImageGeneration(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  defaultMimeType: string,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiImageGenerationResponse>> {
  const opts: IAiImageGenerationOptions = request.options ?? {};
  const refs = request.referenceImages ?? [];
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`
  };
  const n = opts.count ?? 1;

  const fetched =
    refs.length > 0
      ? await callOpenAiImagesEdits(config, request, headers, n, refs, logger, signal)
      : await callOpenAiImagesGenerations(config, request, headers, n, logger, signal);

  return fetched.onSuccess((json) =>
    openAiImageResponse
      .validate(json)
      .withErrorFormat((msg) => `OpenAI images API response: ${msg}`)
      .onSuccess((response) =>
        succeed({
          images: response.data.map((item) => ({
            mimeType: defaultMimeType,
            base64: item.b64_json,
            ...(item.revised_prompt !== undefined ? { revisedPrompt: item.revised_prompt } : {})
          }))
        })
      )
  );
}

/**
 * Builds and posts the JSON `/images/generations` request (no refs).
 * @internal
 */
function callOpenAiImagesGenerations(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  headers: Record<string, string>,
  n: number,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  const opts: IAiImageGenerationOptions = request.options ?? {};
  const body: Record<string, unknown> = {
    model: config.model,
    prompt: request.prompt,
    n,
    response_format: 'b64_json'
  };
  if (opts.size !== undefined) {
    body.size = opts.size;
  }
  if (opts.quality !== undefined) {
    body.quality = opts.quality;
  }
  if (opts.seed !== undefined) {
    body.seed = opts.seed;
  }
  /* c8 ignore next 1 - optional logger */
  logger?.info(`Image generation: model=${config.model}, n=${n}`);
  return fetchJson(`${config.baseUrl}/images/generations`, headers, body, logger, signal);
}

/**
 * Builds and posts the multipart `/images/edits` request (with refs).
 * @internal
 */
async function callOpenAiImagesEdits(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  headers: Record<string, string>,
  n: number,
  refs: ReadonlyArray<IAiImageAttachment>,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<JsonObject>> {
  const blobsResult = mapResults(
    refs.map((ref, i) => attachmentToBlob(ref).withErrorFormat((msg) => `reference image ${i}: ${msg}`))
  );
  /* c8 ignore next 3 - decode failure unreachable via Node's Buffer.from (silently strips invalid input) */
  if (blobsResult.isFailure()) {
    return fail(blobsResult.message);
  }

  const opts: IAiImageGenerationOptions = request.options ?? {};
  const form = new FormData();
  form.append('model', config.model);
  form.append('prompt', request.prompt);
  form.append('n', String(n));
  form.append('response_format', 'b64_json');
  if (opts.size !== undefined) {
    form.append('size', opts.size);
  }
  if (opts.quality !== undefined) {
    form.append('quality', opts.quality);
  }
  if (opts.seed !== undefined) {
    form.append('seed', String(opts.seed));
  }
  blobsResult.value.forEach((blob, i) => {
    form.append('image[]', blob, `ref-${i}.${extensionForMimeType(refs[i].mimeType)}`);
  });
  /* c8 ignore next 1 - optional logger */
  logger?.info(`Image edit: model=${config.model}, n=${n}, refs=${refs.length}`);
  return fetchMultipart(`${config.baseUrl}/images/edits`, headers, form, logger, signal);
}

/**
 * Calls Gemini's chat-style `:generateContent` endpoint for image output
 * (Gemini 2.5 Flash Image / "Nano Banana"). Accepts reference images, which
 * are passed as `inlineData` parts alongside the text prompt.
 *
 * @internal
 */
async function callGeminiImageOutGeneration(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiImageGenerationResponse>> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;
  const refs = request.referenceImages ?? [];
  const parts: Array<Record<string, unknown>> = [{ text: request.prompt }];
  for (const ref of refs) {
    parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.base64 } });
  }
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }]
  };
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

/**
 * Calls the Gemini Imagen `:predict` endpoint.
 * @internal
 */
async function callImagenGeneration(
  config: IAiApiConfig,
  request: IAiImageGenerationParams,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<IAiImageGenerationResponse>> {
  const url = `${config.baseUrl}/models/${config.model}:predict`;
  const opts: IAiImageGenerationOptions = request.options ?? {};
  const parameters: Record<string, unknown> = {
    sampleCount: opts.count ?? 1
  };
  if (opts.imagen?.aspectRatio !== undefined) {
    parameters.aspectRatio = opts.imagen.aspectRatio;
  }
  if (opts.imagen?.negativePrompt !== undefined) {
    parameters.negativePrompt = opts.imagen.negativePrompt;
  }
  if (opts.seed !== undefined) {
    parameters.seed = opts.seed;
  }

  const body: Record<string, unknown> = {
    instances: [{ prompt: request.prompt }],
    parameters
  };

  const headers: Record<string, string> = {
    'x-goog-api-key': config.apiKey
  };

  /* c8 ignore next 1 - optional logger */
  logger?.info(`Imagen generation: model=${config.model}, n=${parameters.sampleCount}`);
  const jsonResult = await fetchJson(url, headers, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return imagenResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Imagen API response: ${msg}`)
    .onSuccess((response) => {
      const images: IAiGeneratedImage[] = response.predictions.map((p) => ({
        mimeType: p.mimeType ?? 'image/png',
        base64: p.bytesBase64Encoded
      }));
      return succeed({ images });
    });
}

// ============================================================================
// Image generation — dispatcher
// ============================================================================

/**
 * Calls the appropriate image-generation API for a given provider.
 *
 * Resolves a {@link IAiImageModelCapability} from
 * {@link IAiProviderDescriptor.imageGeneration} for the requested model and
 * routes by its `format`:
 * - `'openai-images'` for OpenAI (DALL-E, gpt-image-1)
 * - `'xai-images'` for xAI Grok image models
 * - `'gemini-imagen'` for Google Imagen `:predict`
 * - `'gemini-image-out'` for Gemini chat-style image output (Nano Banana)
 *
 * Image-model selection reuses the existing `'image'` {@link ModelSpecKey}.
 * When `request.referenceImages` is non-empty, the call is rejected up front
 * unless the resolved capability declares `acceptsImageReferenceInput`.
 *
 * @param params - Request parameters including descriptor, API key, and prompt
 * @returns The generated images, or a failure
 * @public
 */
export async function callProviderImageGeneration(
  params: IProviderImageGenerationParams
): Promise<Result<IAiImageGenerationResponse>> {
  const { descriptor, apiKey, params: request, modelOverride, logger, signal } = params;

  if (!supportsImageGeneration(descriptor)) {
    return fail(`provider "${descriptor.id}" does not support image generation`);
  }
  if (!descriptor.baseUrl) {
    return fail(`provider "${descriptor.id}" has no API endpoint configured`);
  }

  const model = resolveModel(modelOverride ?? descriptor.defaultModel, 'image');
  const capability = resolveImageCapability(descriptor, model);
  if (capability === undefined) {
    return fail(`provider "${descriptor.id}" does not support image generation for model "${model}"`);
  }
  if ((request.referenceImages?.length ?? 0) > 0 && !capability.acceptsImageReferenceInput) {
    return fail(`model "${model}" does not support reference images`);
  }

  const config: IAiApiConfig = {
    baseUrl: descriptor.baseUrl,
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
      return callOpenAiImageGeneration(config, request, 'image/png', logger, signal);
    case 'xai-images':
      return callOpenAiImageGeneration(config, request, 'image/jpeg', logger, signal);
    case 'gemini-imagen':
      return callImagenGeneration(config, request, logger, signal);
    case 'gemini-image-out':
      return callGeminiImageOutGeneration(config, request, logger, signal);
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
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`
  };
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
 * Lists models available from a provider, with capabilities resolved from
 * native provider info (where supplied) and a configurable rule set.
 *
 * Routes based on `descriptor.apiFormat` — listing reuses the existing
 * format dispatch and does not require a separate descriptor field.
 *
 * @param params - Request parameters including descriptor, API key, and optional capability filter
 * @returns The resolved model list, or a failure
 * @public
 */
export async function callProviderListModels(
  params: IProviderListModelsParams
): Promise<Result<ReadonlyArray<IAiModelInfo>>> {
  const { descriptor, apiKey, capability, capabilityConfig, logger, signal } = params;

  if (!descriptor.baseUrl) {
    return fail(`provider "${descriptor.id}" has no API endpoint configured`);
  }

  const config: IAiApiConfig = {
    baseUrl: descriptor.baseUrl,
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
 * Calls the model-listing endpoint on a proxy server.
 *
 * @remarks
 * Proxy contract:
 * - Endpoint: `POST ${proxyUrl}/api/ai/list-models`
 * - Request body: `{providerId, apiKey, capability?}`. Capability config is
 *   not forwarded — the proxy applies its own (typically the same default
 *   the library ships).
 * - Success response body: an `IAiModelInfo[]` (under key `models`) where
 *   `capabilities` is serialized as a string array (not Set, which doesn't
 *   round-trip through JSON).
 * - Error response body: `{error: string}`, surfaced as `proxy: ${error}`.
 *
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
 * Calls the AI completion endpoint on a proxy server instead of calling
 * the provider API directly from the browser.
 *
 * The proxy server handles provider dispatch, CORS, and API key forwarding.
 * The request shape mirrors {@link IProviderCompletionParams} but is serialized
 * as JSON for the proxy endpoint.
 *
 * @param proxyUrl - Base URL of the proxy server (e.g. `http://localhost:3001`)
 * @param params - Same parameters as {@link callProviderCompletion}
 * @returns The completion response, or a failure
 * @public
 */
export async function callProxiedCompletion(
  proxyUrl: string,
  params: IProviderCompletionParams
): Promise<Result<IAiCompletionResponse>> {
  const {
    descriptor,
    apiKey,
    prompt,
    additionalMessages,
    temperature,
    modelOverride,
    logger,
    tools,
    signal
  } = params;

  const promptBody: Record<string, unknown> = { system: prompt.system, user: prompt.user };
  if (prompt.attachments.length > 0) {
    promptBody.attachments = prompt.attachments;
  }
  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey,
    prompt: promptBody,
    temperature: temperature ?? 0.7
  };
  if (additionalMessages && additionalMessages.length > 0) {
    body.additionalMessages = additionalMessages;
  }
  if (modelOverride !== undefined) {
    body.modelOverride = modelOverride;
  }
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/completion`;
  const jsonResult = await fetchJson(url, {}, body, logger, signal);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  // Check for error response from proxy
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
 *
 * @remarks
 * The proxy contract:
 * - Endpoint: `POST ${proxyUrl}/api/ai/image-generation`
 * - Request body: `{providerId, apiKey, params, modelOverride?}`
 * - Success response body: an {@link IAiImageGenerationResponse}
 * - Error response body: `{error: string}` (surfaced as `proxy: ${error}`)
 *
 * The proxy server is responsible for descriptor lookup, model resolution,
 * provider dispatch, and response normalization. When `params.referenceImages`
 * is present, the proxy is also responsible for repackaging it into the
 * upstream wire format (e.g. multipart/form-data for OpenAI `/images/edits`,
 * `inlineData` parts for Gemini `:generateContent`).
 *
 * @param proxyUrl - Base URL of the proxy server (e.g. `http://localhost:3001`)
 * @param params - Same parameters as {@link callProviderImageGeneration}
 * @returns The generated images, or a failure
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
