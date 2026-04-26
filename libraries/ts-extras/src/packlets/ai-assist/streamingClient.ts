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
 * Streaming chat completion client. Mirrors `apiClient.ts` for the
 * non-streaming path, with format-specific SSE adapters that translate
 * provider-native streaming events into the unified
 * {@link IAiStreamEvent} vocabulary.
 *
 * @packageDocumentation
 */

import { fail, type Logging, Result, succeed } from '@fgv/ts-utils';

import {
  buildAnthropicMessages,
  buildGeminiContents,
  buildMessages,
  buildOpenAiChatUserContent,
  buildOpenAiResponsesUserContent
} from './chatRequestBuilders';
import {
  AiPrompt,
  type AiServerToolConfig,
  type IAiProviderDescriptor,
  type IAiStreamEvent,
  type IChatMessage,
  type ModelSpec,
  resolveModel
} from './model';
import { parseSseEventJson, readSseEvents } from './sseParser';
import { toAnthropicTools, toGeminiTools, toResponsesApiTools } from './toolFormats';

// ============================================================================
// Public types
// ============================================================================

/**
 * Parameters for a streaming completion request. Structurally identical to
 * the non-streaming `IProviderCompletionParams`; kept as its own interface
 * so callers can be explicit about which path they're invoking.
 *
 * @public
 */
export interface IProviderCompletionStreamParams {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** The structured prompt to send */
  readonly prompt: AiPrompt;
  /**
   * Prior conversation history to insert between the system prompt and the
   * prompt's user message. The new user turn (carried by `prompt.user`) is
   * always sent last, so the wire shape becomes
   * `[system, ...messagesBefore, user=prompt.user]`.
   */
  readonly messagesBefore?: ReadonlyArray<IChatMessage>;
  /** Sampling temperature (default: 0.7) */
  readonly temperature?: number;
  /** Optional model override — string or context-aware map. */
  readonly modelOverride?: ModelSpec;
  /** Optional logger for request/response observability. */
  readonly logger?: Logging.ILogger;
  /** Server-side tools to include in the request. */
  readonly tools?: ReadonlyArray<AiServerToolConfig>;
  /** Optional abort signal for cancelling the in-flight stream. */
  readonly signal?: AbortSignal;
}

// ============================================================================
// Internal types
// ============================================================================

interface IStreamApiConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
}

// ============================================================================
// Connection helper
// ============================================================================

/**
 * Opens an SSE-style POST connection. Returns the underlying Response on a
 * 2xx; failures (network, non-2xx, missing body) surface as Result.fail
 * carrying the body text.
 *
 * @internal
 */
async function openSseConnection(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<Response>> {
  /* c8 ignore next 1 - optional logger */
  logger?.detail(`AI streaming request: POST ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...headers
      },
      body: JSON.stringify(body),
      signal
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI streaming request failed: ${detail}`);
    return fail(`AI streaming request failed: ${detail}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    /* c8 ignore next 1 - optional logger */
    logger?.error(`AI streaming API returned ${response.status}: ${errorText}`);
    return fail(`AI streaming API returned ${response.status}: ${errorText}`);
  }
  if (!response.body) {
    return fail('AI streaming API returned an empty body');
  }
  return succeed(response);
}

// ============================================================================
// Format adapters: OpenAI Chat Completions
// ============================================================================

/**
 * Translates an OpenAI Chat Completions SSE stream into unified events.
 *
 * @internal
 */
async function* translateOpenAiChatStream(response: Response): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let receivedDone = false;

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const json = parseSseEventJson(message.data);
      if (json === undefined) {
        // [DONE] sentinel or unparseable; skip
        continue;
      }
      const choice = (json as { choices?: Array<Record<string, unknown>> }).choices?.[0];
      if (!choice) {
        continue;
      }
      const delta = (choice.delta as { content?: string } | undefined)?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        fullText += delta;
        yield { type: 'text-delta', delta };
      }
      const finish = choice.finish_reason as string | null | undefined;
      if (typeof finish === 'string' && finish.length > 0) {
        truncated = finish === 'length';
        receivedDone = true;
      }
    }
  } catch (err: unknown) {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  }

  if (receivedDone) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'OpenAI stream ended without a finish_reason' };
  }
}

// ============================================================================
// Format adapters: OpenAI / xAI Responses API
// ============================================================================

/**
 * Translates an OpenAI Responses API SSE stream into unified events. This
 * path is chosen when tools are present (web_search progress events come
 * from the Responses API).
 *
 * @internal
 */
async function* translateOpenAiResponsesStream(response: Response): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let completed = false;

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const eventName = message.event;
      if (eventName === 'response.output_text.delta') {
        const json = parseSseEventJson(message.data) as { delta?: string } | undefined;
        const delta = json?.delta;
        if (typeof delta === 'string' && delta.length > 0) {
          fullText += delta;
          yield { type: 'text-delta', delta };
        }
      } else if (eventName === 'response.web_search_call.in_progress') {
        yield { type: 'tool-event', toolType: 'web_search', phase: 'started' };
      } else if (eventName === 'response.web_search_call.completed') {
        yield { type: 'tool-event', toolType: 'web_search', phase: 'completed' };
      } else if (eventName === 'response.completed') {
        const json = parseSseEventJson(message.data) as { response?: { status?: string } } | undefined;
        truncated = json?.response?.status === 'incomplete';
        completed = true;
      } else if (eventName === 'response.failed' || eventName === 'error') {
        const json = parseSseEventJson(message.data) as
          | { error?: { message?: string }; message?: string }
          | undefined;
        const errMsg = json?.error?.message ?? json?.message ?? 'Responses API stream failed';
        yield { type: 'error', message: errMsg };
        return;
      }
    }
  } catch (err: unknown) {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  }

  if (completed) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'Responses API stream ended without a completed event' };
  }
}

// ============================================================================
// Format adapters: Anthropic
// ============================================================================

/**
 * Translates an Anthropic Messages API SSE stream into unified events.
 * Surfaces server_tool_use / web_search_tool_result content blocks as
 * tool-event markers.
 *
 * @internal
 */
async function* translateAnthropicStream(response: Response): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let stopped = false;

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const eventName = message.event;
      if (eventName === 'content_block_start') {
        const json = parseSseEventJson(message.data) as
          | { content_block?: { type?: string; name?: string } }
          | undefined;
        const block = json?.content_block;
        if (block?.type === 'server_tool_use' && block.name === 'web_search') {
          yield { type: 'tool-event', toolType: 'web_search', phase: 'started' };
        } else if (block?.type === 'web_search_tool_result') {
          yield { type: 'tool-event', toolType: 'web_search', phase: 'completed' };
        }
      } else if (eventName === 'content_block_delta') {
        const json = parseSseEventJson(message.data) as
          | { delta?: { type?: string; text?: string } }
          | undefined;
        if (json?.delta?.type === 'text_delta' && typeof json.delta.text === 'string') {
          const delta = json.delta.text;
          if (delta.length > 0) {
            fullText += delta;
            yield { type: 'text-delta', delta };
          }
        }
      } else if (eventName === 'message_delta') {
        const json = parseSseEventJson(message.data) as { delta?: { stop_reason?: string } } | undefined;
        if (json?.delta?.stop_reason === 'max_tokens') {
          truncated = true;
        }
      } else if (eventName === 'message_stop') {
        stopped = true;
      } else if (eventName === 'error') {
        const json = parseSseEventJson(message.data) as { error?: { message?: string } } | undefined;
        yield {
          type: 'error',
          message: json?.error?.message ?? 'Anthropic stream returned an error event'
        };
        return;
      }
    }
  } catch (err: unknown) {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  }

  if (stopped) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'Anthropic stream ended without a message_stop event' };
  }
}

// ============================================================================
// Format adapters: Gemini
// ============================================================================

/**
 * Translates a Gemini streamGenerateContent SSE stream into unified events.
 * Gemini emits no explicit tool-progress events even when google_search is
 * enabled — grounding metadata arrives attached to text chunks.
 *
 * @internal
 */
async function* translateGeminiStream(response: Response): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let receivedFinishReason = false;

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const json = parseSseEventJson(message.data);
      if (json === undefined) {
        continue;
      }
      const candidate = (json as { candidates?: Array<Record<string, unknown>> }).candidates?.[0];
      if (!candidate) {
        continue;
      }
      const parts = (candidate.content as { parts?: Array<{ text?: string }> } | undefined)?.parts;
      if (parts) {
        for (const part of parts) {
          if (typeof part.text === 'string' && part.text.length > 0) {
            fullText += part.text;
            yield { type: 'text-delta', delta: part.text };
          }
        }
      }
      const finishReason = candidate.finishReason as string | undefined;
      if (typeof finishReason === 'string' && finishReason.length > 0) {
        truncated = finishReason === 'MAX_TOKENS';
        receivedFinishReason = true;
      }
    }
  } catch (err: unknown) {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  }

  if (receivedFinishReason) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'Gemini stream ended without a finishReason' };
  }
}

// ============================================================================
// Per-format request callers
// ============================================================================

async function callOpenAiChatStream(
  config: IStreamApiConfig,
  prompt: AiPrompt,
  messagesBefore: ReadonlyArray<IChatMessage> | undefined,
  temperature: number,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt.system, buildOpenAiChatUserContent(prompt), {
    head: messagesBefore
  });
  const body = { model: config.model, messages, temperature, stream: true };
  const headers: Record<string, string> = { Authorization: `Bearer ${config.apiKey}` };
  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI streaming completion: model=${config.model}`);
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateOpenAiChatStream(response)));
}

async function callOpenAiResponsesStream(
  config: IStreamApiConfig,
  prompt: AiPrompt,
  tools: ReadonlyArray<AiServerToolConfig>,
  messagesBefore: ReadonlyArray<IChatMessage> | undefined,
  temperature: number,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/responses`;
  const input = buildMessages(prompt.system, buildOpenAiResponsesUserContent(prompt), {
    head: messagesBefore
  });
  const body: Record<string, unknown> = {
    model: config.model,
    input,
    tools: toResponsesApiTools(tools),
    temperature,
    stream: true
  };
  const headers: Record<string, string> = { Authorization: `Bearer ${config.apiKey}` };
  /* c8 ignore next 1 - optional logger */
  logger?.info(
    `OpenAI Responses streaming: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`
  );
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateOpenAiResponsesStream(response)));
}

async function callAnthropicStream(
  config: IStreamApiConfig,
  prompt: AiPrompt,
  messagesBefore: ReadonlyArray<IChatMessage> | undefined,
  temperature: number,
  tools: ReadonlyArray<AiServerToolConfig> | undefined,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/messages`;
  const messages = buildAnthropicMessages(prompt, { head: messagesBefore });
  const body: Record<string, unknown> = {
    model: config.model,
    system: prompt.system,
    messages,
    max_tokens: 4096,
    temperature,
    stream: true
  };
  if (tools && tools.length > 0) {
    body.tools = toAnthropicTools(tools);
  }
  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
  /* c8 ignore next 3 - optional logger diagnostic output */
  if (logger) {
    const toolTypes = tools && tools.length > 0 ? tools.map((t) => t.type).join(',') : 'none';
    logger.info(`Anthropic streaming: model=${config.model}, tools=${toolTypes}`);
  }
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateAnthropicStream(response)));
}

async function callGeminiStream(
  config: IStreamApiConfig,
  prompt: AiPrompt,
  messagesBefore: ReadonlyArray<IChatMessage> | undefined,
  temperature: number,
  tools: ReadonlyArray<AiServerToolConfig> | undefined,
  logger?: Logging.ILogger,
  signal?: AbortSignal
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/models/${config.model}:streamGenerateContent?alt=sse`;
  const contents = buildGeminiContents(prompt, { head: messagesBefore });
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents,
    generationConfig: { temperature }
  };
  if (tools && tools.length > 0) {
    body.tools = toGeminiTools(tools);
  }
  const headers: Record<string, string> = { 'x-goog-api-key': config.apiKey };
  /* c8 ignore next 3 - optional logger diagnostic output */
  if (logger) {
    const toolTypes = tools && tools.length > 0 ? tools.map((t) => t.type).join(',') : 'none';
    logger.info(`Gemini streaming: model=${config.model}, tools=${toolTypes}`);
  }
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateGeminiStream(response)));
}

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Calls the appropriate streaming chat completion API for a given provider.
 *
 * @remarks
 * Pre-flight rejection: when `descriptor.streamingCorsRestricted === true`
 * and the call isn't being routed through a proxy, this returns
 * `Result.fail` before fetch is invoked. Callers should route through
 * {@link callProxiedCompletionStream} or surface the failure to the user.
 *
 * Connection-time failures (auth, network, non-2xx) surface as the outer
 * `Result.fail`. Once iteration begins, errors mid-stream surface as a
 * terminal error event ({@link IAiStreamError}) followed by the iterable
 * ending. The final successful event is {@link IAiStreamDone}.
 *
 * @param params - Request parameters including descriptor, API key, prompt, and optional tools
 * @returns A streaming iterable of unified events, or a Result.fail
 * @public
 */
export async function callProviderCompletionStream(
  params: IProviderCompletionStreamParams
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const {
    descriptor,
    apiKey,
    prompt,
    messagesBefore,
    temperature = 0.7,
    modelOverride,
    logger,
    tools,
    signal
  } = params;

  if (!descriptor.baseUrl) {
    return fail(`provider "${descriptor.id}" has no API endpoint configured`);
  }
  if (descriptor.streamingCorsRestricted) {
    return fail(`provider "${descriptor.id}" requires a proxy for streaming; none is configured`);
  }
  if (prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  const hasTools = tools !== undefined && tools.length > 0;
  const modelContext = hasTools ? 'tools' : undefined;

  const config: IStreamApiConfig = {
    baseUrl: descriptor.baseUrl,
    apiKey,
    model: resolveModel(modelOverride ?? descriptor.defaultModel, modelContext)
  };

  switch (descriptor.apiFormat) {
    case 'openai':
      if (hasTools) {
        return callOpenAiResponsesStream(config, prompt, tools, messagesBefore, temperature, logger, signal);
      }
      return callOpenAiChatStream(config, prompt, messagesBefore, temperature, logger, signal);
    case 'anthropic':
      return callAnthropicStream(config, prompt, messagesBefore, temperature, tools, logger, signal);
    case 'gemini':
      return callGeminiStream(config, prompt, messagesBefore, temperature, tools, logger, signal);
    /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
  }
}

// ============================================================================
// Proxied streaming
// ============================================================================

/**
 * Calls the streaming chat endpoint on a proxy server instead of calling
 * the provider directly from the browser.
 *
 * @remarks
 * Proxy contract:
 * - Endpoint: `POST ${proxyUrl}/api/ai/completion-stream`
 * - Request body: same JSON as `/api/ai/completion` plus `"stream": true`
 * - Response: `Content-Type: text/event-stream`; body is the unified
 *   {@link IAiStreamEvent} JSON-serialized one event per SSE `data:` line
 *   (no `event:` line needed since the type discriminator is in the JSON).
 * - Error response (when the proxy can't even start): JSON `{error: string}`
 *   with a non-2xx status, surfaced as `proxy: ${error}`.
 *
 * The proxy server is responsible for opening the upstream SSE connection,
 * translating provider-native events to the unified vocabulary, and
 * forwarding events as they arrive (no buffering). The library does not
 * ship a proxy implementation.
 *
 * @public
 */
export async function callProxiedCompletionStream(
  proxyUrl: string,
  params: IProviderCompletionStreamParams
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const { descriptor, apiKey, prompt, messagesBefore, temperature, modelOverride, logger, tools, signal } =
    params;

  const promptBody: Record<string, unknown> = { system: prompt.system, user: prompt.user };
  if (prompt.attachments.length > 0) {
    promptBody.attachments = prompt.attachments;
  }
  const body: Record<string, unknown> = {
    providerId: descriptor.id,
    apiKey,
    prompt: promptBody,
    temperature: temperature ?? 0.7,
    stream: true
  };
  if (messagesBefore && messagesBefore.length > 0) {
    body.messagesBefore = messagesBefore;
  }
  if (modelOverride !== undefined) {
    body.modelOverride = modelOverride;
  }
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  /* c8 ignore next 1 - optional logger */
  logger?.info(`AI streaming proxy request: provider=${descriptor.id}, proxy=${proxyUrl}`);

  const url = `${proxyUrl}/api/ai/completion-stream`;
  const conn = await openSseConnection(url, {}, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateProxyStream(response)));
}

/**
 * Translates a proxied SSE stream back into {@link IAiStreamEvent} objects.
 * The proxy is required to emit one JSON-serialized unified event per
 * `data:` line (no provider-native shapes survive across the contract).
 *
 * @internal
 */
async function* translateProxyStream(response: Response): AsyncGenerator<IAiStreamEvent> {
  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const json = parseSseEventJson(message.data);
      if (json === undefined) {
        continue;
      }
      const event = json as { type?: string };
      if (
        event.type === 'text-delta' ||
        event.type === 'tool-event' ||
        event.type === 'done' ||
        event.type === 'error'
      ) {
        yield event as IAiStreamEvent;
        if (event.type === 'done' || event.type === 'error') {
          return;
        }
      }
    }
  } catch (err: unknown) {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}
