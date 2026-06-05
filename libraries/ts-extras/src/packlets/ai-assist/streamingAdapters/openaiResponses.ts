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
 *
 * The live OpenAI / xAI Responses API emits these events keyed by `item_id` (the
 * `fc_*` output-item id), NOT by `call_id` (the `call_*` id used in continuation
 * input items). The adapter correlates `item_id` → `call_id` via the
 * `response.output_item.added` event that introduced the function_call item.
 *
 * @internal
 */
interface IResponsesFunctionCallArgsDeltaPayload {
  readonly item_id: string;
  readonly delta: string;
}

/**
 * Payload of a `response.function_call_arguments.done` SSE event.
 *
 * Keyed by `item_id` like the delta event — see {@link IResponsesFunctionCallArgsDeltaPayload}.
 *
 * @internal
 */
interface IResponsesFunctionCallArgsDonePayload {
  readonly item_id: string;
  readonly arguments: string;
}

/**
 * Payload of a `response.completed` SSE event.
 * @internal
 */
interface IResponsesCompletedPayload {
  readonly response: {
    readonly status?: string;
    readonly incomplete_details?: { readonly reason?: string };
  };
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
  Validators.object<IResponsesFunctionCallArgsDeltaPayload>({
    item_id: Validators.string,
    delta: Validators.string
  });

const responsesFunctionCallArgsDonePayload: Validator<IResponsesFunctionCallArgsDonePayload> =
  Validators.object<IResponsesFunctionCallArgsDonePayload>({
    item_id: Validators.string,
    arguments: Validators.string
  });

const responsesIncompleteDetails: Validator<{ reason?: string }> = Validators.object<{ reason?: string }>(
  { reason: Validators.string.optional() },
  { options: { optionalFields: ['reason'] } }
);

const responsesCompletedPayload: Validator<IResponsesCompletedPayload> =
  Validators.object<IResponsesCompletedPayload>({
    response: Validators.object<{ status?: string; incomplete_details?: { reason?: string } }>(
      {
        status: Validators.string.optional(),
        incomplete_details: responsesIncompleteDetails.optional()
      },
      { options: { optionalFields: ['status', 'incomplete_details'] } }
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
 * Recognized OpenAI / xAI Responses API SSE event names. An event in this set is either
 * handled below or intentionally ignored (lifecycle / reasoning content discarded by design /
 * server-tool channels not yet surfaced). Any event whose name is NOT in this set surfaces
 * a one-time `logger.warn` per stream — making provider drift (new event types from a model
 * update) visible empirically instead of silently no-op'd.
 *
 * Source: official `@anthropic-ai` SDK source `responses.ts` event-type literal-string sweep
 * plus the xAI Responses superset. Add to this set when a new event type is observed and
 * confirmed safe to ignore.
 *
 * @internal
 */
const RECOGNIZED_OPENAI_RESPONSES_EVENTS: ReadonlySet<string> = new Set<string>([
  // ---- handled by the translator ----
  'response.output_text.delta',
  'response.web_search_call.in_progress',
  'response.web_search_call.completed',
  'response.output_item.added',
  'response.function_call_arguments.delta',
  'response.function_call_arguments.done',
  'response.completed',
  'response.failed',
  'error',
  // ---- lifecycle events: intentionally silent ----
  'response.created',
  'response.in_progress',
  'response.queued',
  'response.incomplete',
  // ---- text content lifecycle: handled implicitly via delta accumulation ----
  'response.output_text.done',
  'response.output_text.annotation.added',
  'response.content_part.added',
  'response.content_part.done',
  'response.output_item.done',
  // ---- reasoning content: discarded by design (see ai-assist-thinking-events follow-on) ----
  'response.reasoning_summary_part.added',
  'response.reasoning_summary_part.done',
  'response.reasoning_summary_text.delta',
  'response.reasoning_summary_text.done',
  'response.reasoning_text.delta',
  'response.reasoning_text.done',
  // ---- refusals: caller currently sees these via the model's final text ----
  'response.refusal.delta',
  'response.refusal.done',
  // ---- server-tool channels not surfaced as tool-event yet ----
  'response.web_search_call.searching',
  'response.file_search_call.in_progress',
  'response.file_search_call.searching',
  'response.file_search_call.completed',
  'response.code_interpreter_call.in_progress',
  'response.code_interpreter_call.interpreting',
  'response.code_interpreter_call.completed',
  'response.code_interpreter_call_code.delta',
  'response.code_interpreter_call_code.done',
  'response.image_generation_call.in_progress',
  'response.image_generation_call.generating',
  'response.image_generation_call.completed',
  'response.image_generation_call.partial_image',
  'response.mcp_call.in_progress',
  'response.mcp_call.completed',
  'response.mcp_call.failed',
  'response.mcp_call_arguments.delta',
  'response.mcp_call_arguments.done',
  'response.mcp_list_tools.in_progress',
  'response.mcp_list_tools.completed',
  'response.mcp_list_tools.failed',
  'response.custom_tool_call_input.delta',
  'response.custom_tool_call_input.done',
  // ---- audio (not used in chat/tool flows here) ----
  'response.audio.delta',
  'response.audio.done',
  'response.audio.transcript.delta',
  'response.audio.transcript.done'
]);

/**
 * Translates an OpenAI Responses API SSE stream into unified events.
 *
 * Maintains a per-call-ID accumulation map for client-defined function calls.
 * The map is exposed via the passed-in `functionCallMap` parameter for the
 * C3 continuation builder to read after the stream completes.
 *
 * Unrecognized event names are reported once per stream via `logger?.warn` —
 * see {@link RECOGNIZED_OPENAI_RESPONSES_EVENTS}.
 *
 * @internal
 */
async function* translateOpenAiResponsesStream(
  response: Response,
  functionCallMap: Map<string, IAccumulatedFunctionCall>,
  logger?: Logging.ILogger
): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let completed = false;
  let incompleteReason: string | undefined;
  // OpenAI / xAI Responses API emits function_call_arguments.{delta,done} events keyed by
  // `item_id` (the fc_* output-item id). The harness and continuation builder key by
  // `call_id` (the call_* id). This map correlates the two — populated when the
  // function_call item is announced in `response.output_item.added`.
  const itemIdToCallId = new Map<string, string>();
  // Track unrecognized event names we have already warned about, so a hot stream of
  // an unknown event type produces exactly one log line per name per stream.
  const warnedEvents = new Set<string>();

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
          // Reasoning models (and the standard flow) reference this function_call in subsequent
          // arguments.{delta,done} events by `item_id`, never by `call_id`. Record the mapping
          // so the arg-accumulation handlers can resolve the call.
          if (item.id) {
            itemIdToCallId.set(item.id, item.call_id);
          }
          yield { type: 'client-tool-call-start', toolName: item.name, callId: item.call_id };
        }
      } else if (eventName === 'response.function_call_arguments.delta') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          responsesFunctionCallArgsDeltaPayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        const itemId = payload?.item_id;
        if (itemId !== undefined) {
          const callId = itemIdToCallId.get(itemId);
          /* c8 ignore next 1 - defensive: orphan delta (no preceding output_item.added) is a protocol violation */
          const call = callId !== undefined ? functionCallMap.get(callId) : undefined;
          /* c8 ignore next 1 - defensive: call always present and delta always string in valid stream */
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
        const itemId = payload?.item_id;
        if (itemId !== undefined) {
          const callId = itemIdToCallId.get(itemId);
          /* c8 ignore next 1 - defensive: orphan done (no preceding output_item.added) is a protocol violation */
          const call = callId !== undefined ? functionCallMap.get(callId) : undefined;
          if (call && callId !== undefined) {
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
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        if (payload) {
          truncated = payload.response.status === 'incomplete';
          // Per IAiStreamDone.incompleteReason's contract, the reason is meaningful only
          // when the response was truncated. Move both fields together on every completed
          // event so a stray incomplete_details on a non-incomplete payload never leaks
          // through, and a later (defensive) completed event can't leave a stale reason.
          incompleteReason = truncated ? payload.response.incomplete_details?.reason : undefined;
        }
        completed = true;
        /* c8 ignore next 1 - defensive: eventName === 'error' alternative not exercised in tests */
      } else if (eventName === 'response.failed' || eventName === 'error') {
        const payload = validateEventPayload(parseSseEventJson(message.data), responsesErrorPayload);
        /* c8 ignore next 1 - defensive: payload?.error and payload?.message null branches unreachable */
        const errMsg = payload?.error?.message ?? payload?.message ?? 'Responses API stream failed';
        yield { type: 'error', message: errMsg };
        return;
      } else if (
        typeof eventName === 'string' &&
        !RECOGNIZED_OPENAI_RESPONSES_EVENTS.has(eventName) &&
        !warnedEvents.has(eventName)
      ) {
        // Empirical drift instrument: an unrecognized SSE event from the Responses API
        // surfaces as a one-time warning per stream. If a provider adds a new event type
        // (or changes an existing event's name), the warning fires the first time the
        // event arrives. Update RECOGNIZED_OPENAI_RESPONSES_EVENTS once the new event is
        // either handled or confirmed safe to ignore.
        warnedEvents.add(eventName);
        logger?.warn(
          `OpenAI Responses adapter: unrecognized SSE event '${eventName}'. ` +
            `This may indicate provider drift — if the new event carries data the adapter ` +
            `should surface, add a handler; otherwise add the name to ` +
            `RECOGNIZED_OPENAI_RESPONSES_EVENTS.`
        );
      }
    }
  } catch (err: unknown) /* c8 ignore start - defensive: stream errors are always Error instances */ {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  } /* c8 ignore stop */

  if (completed) {
    yield { type: 'done', truncated, fullText, incompleteReason };
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
  functionCallMap?: Map<string, IAccumulatedFunctionCall>,
  continuationMessages?: ReadonlyArray<JsonObject>
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/responses`;
  const input = buildMessages(prompt.system, buildOpenAiResponsesUserContent(prompt), {
    head: messagesBefore,
    rawTail: continuationMessages
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
  return conn.onSuccess((response) => succeed(translateOpenAiResponsesStream(response, callMap, logger)));
}
