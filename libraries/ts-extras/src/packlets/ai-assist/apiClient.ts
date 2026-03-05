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
import { fail, type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import {
  AiPrompt,
  type AiServerToolConfig,
  type IAiCompletionResponse,
  type IAiProviderDescriptor,
  type IChatMessage,
  type ModelSpec,
  resolveModel
} from './model';
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
}

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Builds the messages array from prompt + optional correction messages.
 * @internal
 */
function buildMessages(
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  return messages;
}

/**
 * Makes an HTTP request and returns the parsed JSON, or a failure.
 * @internal
 */
async function fetchJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  logger?: Logging.ILogger
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
      body: JSON.stringify(body)
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

const responsesApiOutputText: Validator<IResponsesApiOutputText> = Validators.object<IResponsesApiOutputText>({
  type: Validators.literal('output_text'),
  text: Validators.string
});
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
  logger?: Logging.ILogger
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt, additionalMessages);
  const body = { model: config.model, messages, temperature };

  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI completion: model=${config.model}`);
  const jsonResult = await fetchJson(url, { Authorization: `Bearer ${config.apiKey}` }, body, logger);
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
  logger?: Logging.ILogger
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/responses`;
  const input = buildMessages(prompt, additionalMessages);
  const body: Record<string, unknown> = {
    model: config.model,
    input,
    tools: toResponsesApiTools(tools),
    temperature
  };

  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI Responses API: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`);
  const jsonResult = await fetchJson(url, { Authorization: `Bearer ${config.apiKey}` }, body, logger);
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
  tools?: ReadonlyArray<AiServerToolConfig>
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/messages`;

  // Anthropic uses system as a top-level field, not in messages
  const messages: Array<{ role: string; content: string }> = [{ role: 'user', content: prompt.user }];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      // Anthropic doesn't have a system role in messages
      if (msg.role !== 'system') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

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
    logger?.info(
      `Anthropic completion: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`
    );
  } else {
    /* c8 ignore next 1 - optional logger */
    logger?.info(`Anthropic completion: model=${config.model}`);
  }

  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };

  const jsonResult = await fetchJson(url, headers, body, logger);
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
  tools?: ReadonlyArray<AiServerToolConfig>
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;

  // Gemini uses 'contents' with 'parts', and 'model' role instead of 'assistant'
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
    { role: 'user', parts: [{ text: prompt.user }] }
  ];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }]
        });
      }
    }
  }

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

  const jsonResult = await fetchJson(url, headers, body, logger);
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
    tools
  } = params;

  if (!descriptor.baseUrl) {
    return fail(`provider "${descriptor.id}" has no API endpoint configured`);
  }

  const hasTools = tools !== undefined && tools.length > 0;
  const modelContext = hasTools ? 'tools' : undefined;

  const config: IAiApiConfig = {
    baseUrl: descriptor.baseUrl,
    apiKey,
    model: resolveModel(modelOverride ?? descriptor.defaultModel, modelContext)
  };
  /* c8 ignore next 3 - optional logger diagnostic output */
  logger?.info(
    `AI completion: provider=${descriptor.id}, format=${descriptor.apiFormat}${hasTools ? ', tools=' + tools.map((t) => t.type).join(',') : ''}`
  );

  switch (descriptor.apiFormat) {
    case 'openai':
      if (hasTools) {
        return callOpenAiResponsesCompletion(config, prompt, tools, additionalMessages, temperature, logger);
      }
      return callOpenAiCompletion(config, prompt, additionalMessages, temperature, logger);
    case 'anthropic':
      return callAnthropicCompletion(config, prompt, additionalMessages, temperature, logger, tools);
    case 'gemini':
      return callGeminiCompletion(config, prompt, additionalMessages, temperature, logger, tools);
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
  }
}
