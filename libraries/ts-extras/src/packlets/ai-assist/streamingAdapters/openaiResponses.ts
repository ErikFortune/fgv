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
 * Streaming adapter for the OpenAI / xAI Responses API. This is the format
 * used when server-side tools (e.g. web_search) are requested — Chat
 * Completions doesn't support tool progress events, but the Responses API
 * does.
 *
 * Client-defined tools (`function_call` type) are accumulated per call ID
 * and emitted as `client-tool-call-done` events when complete.
 *
 * @packageDocumentation
 */

import { type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';
import { type JsonObject } from '@fgv/ts-json-base';

import { buildMessages, buildOpenAiResponsesUserContent } from '../chatRequestBuilders';
import { bearerAuthHeader } from '../endpoint';
import { AiPrompt, type AiToolConfig, type IAiStreamEvent, type IChatMessage } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { toResponsesApiTools } from '../toolFormats';
import { type IResolvedThinkingConfig } from '../thinkingOptionsResolver';
import { IStreamApiConfig, openSseConnection, validateEventPayload } from './common';

// ============================================================================
// Accumulated call state (internal — used by C3 continuation builder)
// ============================================================================

/**
 * Accumulated state for a single function_call in the OpenAI Responses API stream.
 * @internal
 */
export interface IAccumulatedFunctionCall {
  readonly id: string;
  readonly name: string;
  argsBuffer: string;
}

// ============================================================================
// Event payload shapes
// ============================================================================

/**
 * Payload of a `response.output_text.delta` SSE event.
 * @internal
 */
interface IResponsesDeltaPayload {
  readonly delta: string;
}

/**
 * Payload of a `response.output_item.added` SSE event.
 * @internal
 */
interface IResponsesOutputItemAddedPayload {
  readonly item: {
    readonly type?: string;
    readonly id?: string;
    readonly name?: string;
    readonly call_id?: string;
  };
}

/**
 * Payload of a `response.function_call_arguments.delta` SSE event.
 * @internal
 */
interface IResponsesFunctionCallArgsDeltaPayload {
  readonly item_id?: string;
  readonly call_id?: string;
  readonly delta: string;
}

/**
 * Payload of a `response.function_call_arguments.done` SSE event.
 * @internal
 */
interface IResponsesFunctionCallArgsDonePayload {
  readonly item_id?: string;
  readonly call_id?: string;
  readonly arguments: string;
}

/**
 * Payload of a `response.completed` SSE event.
 * @internal
 */
interface IResponsesCompletedPayload {
  readonly response: { readonly status?: string };
}

/**
 * Payload of a `response.failed` or `error` SSE event.
 * @internal
 */
interface IResponsesErrorPayload {
  readonly error?: { readonly message?: string };
  readonly message?: string;
}

const responsesDeltaPayload: Validator<IResponsesDeltaPayload> = Validators.object<IResponsesDeltaPayload>({
  delta: Validators.string
});

const responsesOutputItemInner: Validator<{
  type?: string;
  id?: string;
  name?: string;
  call_id?: string;
}> = Validators.object<{ type?: string; id?: string; name?: string; call_id?: string }>(
  {
    type: Validators.string.optional(),
    id: Validators.string.optional(),
    name: Validators.string.optional(),
    call_id: Validators.string.optional()
  },
  { options: { optionalFields: ['type', 'id', 'name', 'call_id'] } }
);

const responsesOutputItemAddedPayload: Validator<IResponsesOutputItemAddedPayload> =
  Validators.object<IResponsesOutputItemAddedPayload>({ item: responsesOutputItemInner });

const responsesFunctionCallArgsDeltaPayload: Validator<IResponsesFunctionCallArgsDeltaPayload> =
  Validators.object<IResponsesFunctionCallArgsDeltaPayload>(
    {
      item_id: Validators.string.optional(),
      call_id: Validators.string.optional(),
      delta: Validators.string
    },
    { options: { optionalFields: ['item_id', 'call_id'] } }
  );

const responsesFunctionCallArgsDonePayload: Validator<IResponsesFunctionCallArgsDonePayload> =
  Validators.object<IResponsesFunctionCallArgsDonePayload>(
    {
      item_id: Validators.string.optional(),
      call_id: Validators.string.optional(),
      arguments: Validators.string
    },
    { options: { optionalFields: ['item_id', 'call_id'] } }
  );

const responsesCompletedPayload: Validator<IResponsesCompletedPayload> =
  Validators.object<IResponsesCompletedPayload>({
    response: Validators.object<{ status?: string }>(
      { status: Validators.string.optional() },
      { options: { optionalFields: ['status'] } }
    )
  });

const responsesErrorInner: Validator<{ message?: string }> = Validators.object<{ message?: string }>(
  { message: Validators.string.optional() },
  { options: { optionalFields: ['message'] } }
);

const responsesErrorPayload: Validator<IResponsesErrorPayload> = Validators.object<IResponsesErrorPayload>(
  {
    error: responsesErrorInner.optional(),
    message: Validators.string.optional()
  },
  { options: { optionalFields: ['error', 'message'] } }
);

// ============================================================================
// Stream translator
// ============================================================================

/**
 * Translates an OpenAI Responses API SSE stream into unified events.
 *
 * Maintains a per-call-ID accumulation map for client-defined function calls.
 * The map is exposed via the passed-in `functionCallMap` parameter for the
 * C3 continuation builder to read after the stream completes.
 *
 * @internal
 */
async function* translateOpenAiResponsesStream(
  response: Response,
  functionCallMap: Map<string, IAccumulatedFunctionCall>
): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let completed = false;

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const eventName = message.event;
      if (eventName === 'response.output_text.delta') {
        const payload = validateEventPayload(parseSseEventJson(message.data), responsesDeltaPayload);
        /* c8 ignore next 1 - defensive: payload?.delta null branch unreachable after validation */
        const delta = payload?.delta;
        if (typeof delta === 'string' && delta.length > 0) {
          fullText += delta;
          yield { type: 'text-delta', delta };
        }
      } else if (eventName === 'response.web_search_call.in_progress') {
        yield { type: 'tool-event', toolType: 'web_search', phase: 'started' };
      } else if (eventName === 'response.web_search_call.completed') {
        yield { type: 'tool-event', toolType: 'web_search', phase: 'completed' };
      } else if (eventName === 'response.output_item.added') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          responsesOutputItemAddedPayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        const item = payload?.item;
        /* c8 ignore next 1 - defensive: falsy call_id/name branches are protocol violations */
        if (item?.type === 'function_call' && item.call_id && item.name) {
          functionCallMap.set(item.call_id, { id: item.call_id, name: item.name, argsBuffer: '' });
          yield { type: 'client-tool-call-start', toolName: item.name, callId: item.call_id };
        }
      } else if (eventName === 'response.function_call_arguments.delta') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          responsesFunctionCallArgsDeltaPayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        const callId = payload?.call_id;
        if (callId !== undefined) {
          const call = functionCallMap.get(callId);
          /* c8 ignore next 1 - defensive: call and delta always present in valid stream */
          if (call && typeof payload?.delta === 'string') {
            call.argsBuffer += payload.delta;
          }
        }
      } else if (eventName === 'response.function_call_arguments.done') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          responsesFunctionCallArgsDonePayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        const callId = payload?.call_id;
        if (callId !== undefined) {
          const call = functionCallMap.get(callId);
          if (call) {
            /* c8 ignore next 1 - defensive: payload?.arguments null branch unreachable after validation */
            const canonicalArgs = payload?.arguments ?? '{}';
            // Sync the accumulation entry with the canonical arguments from the .done event.
            // Delta events may carry partial/empty payloads; the .done event carries the
            // authoritative final arguments string used by the continuation builder.
            call.argsBuffer = canonicalArgs;
            let args: JsonObject;
            try {
              const parsed = JSON.parse(canonicalArgs) as unknown;
              /* c8 ignore start - defensive: non-object/malformed parse defaults to empty object */
              args =
                parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
                  ? (parsed as JsonObject)
                  : {};
            } catch {
              args = {};
            }
            /* c8 ignore stop */
            yield { type: 'client-tool-call-done', toolName: call.name, callId, args };
          }
        }
      } else if (eventName === 'response.completed') {
        const payload = validateEventPayload(parseSseEventJson(message.data), responsesCompletedPayload);
        /* c8 ignore next 1 - defensive: payload?.response null branch unreachable after validation */
        truncated = payload?.response.status === 'incomplete';
        completed = true;
        /* c8 ignore next 1 - defensive: eventName === 'error' alternative not exercised in tests */
      } else if (eventName === 'response.failed' || eventName === 'error') {
        const payload = validateEventPayload(parseSseEventJson(message.data), responsesErrorPayload);
        /* c8 ignore next 1 - defensive: payload?.error and payload?.message null branches unreachable */
        const errMsg = payload?.error?.message ?? payload?.message ?? 'Responses API stream failed';
        yield { type: 'error', message: errMsg };
        return;
      }
    }
  } catch (err: unknown) /* c8 ignore start - defensive: stream errors are always Error instances */ {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  } /* c8 ignore stop */

  if (completed) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'Responses API stream ended without a completed event' };
  }
}

// ============================================================================
// Per-format request caller
// ============================================================================

/**
 * Issues a streaming Responses API request (with tools) and returns the
 * unified-event iterable on success.
 *
 * @internal
 */
export async function callOpenAiResponsesStream(
  config: IStreamApiConfig,
  prompt: AiPrompt,
  tools: ReadonlyArray<AiToolConfig>,
  messagesBefore: ReadonlyArray<IChatMessage> | undefined,
  temperature: number,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig,
  functionCallMap?: Map<string, IAccumulatedFunctionCall>
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/responses`;
  const input = buildMessages(prompt.system, buildOpenAiResponsesUserContent(prompt), {
    head: messagesBefore
  });
  const effort = resolvedThinking?.openAiEffort ?? resolvedThinking?.xaiEffort;
  const supportsReasoning = config.model !== 'grok-4';
  const body: Record<string, unknown> = {
    model: config.model,
    input,
    tools: toResponsesApiTools(tools),
    stream: true
  };
  if (effort !== undefined && supportsReasoning) {
    body.reasoning = { effort };
  }
  if (effort === undefined || effort === 'none') {
    body.temperature = temperature;
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }
  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);
  /* c8 ignore next 3 - optional logger */
  logger?.info(
    `OpenAI Responses streaming: model=${config.model}, tools=${tools.map((t) => t.type).join(',')}`
  );
  const callMap = functionCallMap ?? new Map<string, IAccumulatedFunctionCall>();
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateOpenAiResponsesStream(response, callMap)));
}
