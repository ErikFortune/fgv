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
 * Streaming adapter for the Anthropic Messages API. Handles server tool
 * use (e.g. `web_search`) as unified `tool-event` markers and client-defined
 * tool calls (type `tool_use`) with B4 thinking-block accumulation.
 *
 * The ordered accumulation buffer preserves all content blocks from the
 * assistant turn in their original stream positions. The C3 continuation
 * builder reads this buffer to reconstruct the assistant turn for the
 * follow-up request.
 *
 * @packageDocumentation
 */

import { type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';
import { type JsonObject } from '@fgv/ts-json-base';

import { buildAnthropicMessages } from '../chatRequestBuilders';
import { AiPrompt, type AiToolConfig, type IAiStreamEvent, type IChatMessage } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { toAnthropicTools } from '../toolFormats';
import { anthropicEffortToBudgetTokens, type IResolvedThinkingConfig } from '../thinkingOptionsResolver';
import {
  IStreamApiConfig,
  MALFORMED_TOOL_USE_WARN_TAG,
  UNRECOGNIZED_EVENT_WARN_TAG,
  formatUnrecognizedEventPayloadPreview,
  openSseConnection,
  validateEventPayload
} from './common';

// ============================================================================
// Accumulated block types (internal — used by C3 continuation builder)
// ============================================================================

/**
 * An accumulated `thinking` block from the assistant turn. The `thinking` text
 * and `signature` are both concatenated across their respective delta events.
 * The full block is passed to the C3 continuation builder for round-trip preservation.
 * @internal
 */
export interface IAccumulatedThinkingBlock {
  readonly type: 'thinking';
  thinking: string;
  signature: string;
}

/**
 * An accumulated `redacted_thinking` block from the assistant turn. The `data`
 * field is opaque and arrives complete in the `content_block_start` event — no
 * delta events follow. Passed through unmodified to the C3 continuation builder.
 * @internal
 */
export interface IAccumulatedRedactedThinkingBlock {
  readonly type: 'redacted_thinking';
  readonly data: string;
}

/**
 * An accumulated `text` block from the assistant turn.
 * @internal
 */
export interface IAccumulatedTextBlock {
  readonly type: 'text';
  text: string;
}

/**
 * An accumulated `tool_use` block from the assistant turn (client-defined tool call).
 * The `argsBuffer` is the concatenation of all `input_json_delta` chunks.
 * @internal
 */
export interface IAccumulatedToolUseBlock {
  readonly type: 'tool_use';
  readonly id: string;
  readonly name: string;
  argsBuffer: string;
}

/**
 * Discriminated union of all accumulated Anthropic content block types.
 * The ordered accumulation buffer is a `Map<number, IAccumulatedBlock>` keyed
 * by the SSE `index` field from `content_block_start` events.
 * @internal
 */
export type IAccumulatedBlock =
  | IAccumulatedThinkingBlock
  | IAccumulatedRedactedThinkingBlock
  | IAccumulatedTextBlock
  | IAccumulatedToolUseBlock;

// ============================================================================
// Event payload shapes
// ============================================================================

/**
 * Payload of a `content_block_start` SSE event with the `index` field.
 * The `index` field is optional for backward compatibility with providers that
 * omit it; absent index defaults to 0 in the stream translator.
 * @internal
 */
interface IAnthropicContentBlockStartPayload {
  readonly index?: number;
  readonly content_block: {
    readonly type?: string;
    readonly name?: string;
    readonly id?: string;
    readonly data?: string;
  };
}

/**
 * Payload of a `content_block_delta` SSE event. Various delta types are
 * discriminated on `delta.type`:
 * - `text_delta`: text content
 * - `input_json_delta`: tool argument accumulation
 * - `thinking_delta`: thinking text accumulation
 * - `signature_delta`: thinking signature accumulation (MUST be appended, not overwritten)
 *
 * The `index` field is optional; absent index defaults to 0 in the stream translator.
 * @internal
 */
interface IAnthropicContentBlockDeltaPayload {
  readonly index?: number;
  readonly delta: {
    readonly type?: string;
    readonly text?: string;
    readonly partial_json?: string;
    readonly thinking?: string;
    readonly signature?: string;
  };
}

/**
 * Payload of a `content_block_stop` SSE event.
 * The `index` field is optional; absent index defaults to 0 in the stream translator.
 * @internal
 */
interface IAnthropicContentBlockStopPayload {
  readonly index?: number;
}

/**
 * Payload of a `message_delta` SSE event carrying the final stop reason.
 * @internal
 */
interface IAnthropicMessageDeltaPayload {
  readonly delta: { readonly stop_reason?: string };
}

/**
 * Payload of an `error` SSE event.
 * @internal
 */
interface IAnthropicErrorPayload {
  readonly error?: { readonly message?: string };
}

const anthropicContentBlockInner: Validator<{
  type?: string;
  name?: string;
  id?: string;
  data?: string;
}> = Validators.object<{ type?: string; name?: string; id?: string; data?: string }>(
  {
    type: Validators.string.optional(),
    name: Validators.string.optional(),
    id: Validators.string.optional(),
    data: Validators.string.optional()
  },
  { options: { optionalFields: ['type', 'name', 'id', 'data'] } }
);

const anthropicContentBlockStartPayload: Validator<IAnthropicContentBlockStartPayload> =
  Validators.object<IAnthropicContentBlockStartPayload>(
    {
      index: Validators.number.optional(),
      content_block: anthropicContentBlockInner
    },
    { options: { optionalFields: ['index'] } }
  );

const anthropicContentBlockDeltaInner: Validator<{
  type?: string;
  text?: string;
  partial_json?: string;
  thinking?: string;
  signature?: string;
}> = Validators.object<{
  type?: string;
  text?: string;
  partial_json?: string;
  thinking?: string;
  signature?: string;
}>(
  {
    type: Validators.string.optional(),
    text: Validators.string.optional(),
    partial_json: Validators.string.optional(),
    thinking: Validators.string.optional(),
    signature: Validators.string.optional()
  },
  { options: { optionalFields: ['type', 'text', 'partial_json', 'thinking', 'signature'] } }
);

const anthropicContentBlockDeltaPayload: Validator<IAnthropicContentBlockDeltaPayload> =
  Validators.object<IAnthropicContentBlockDeltaPayload>(
    {
      index: Validators.number.optional(),
      delta: anthropicContentBlockDeltaInner
    },
    { options: { optionalFields: ['index'] } }
  );

const anthropicContentBlockStopPayload: Validator<IAnthropicContentBlockStopPayload> =
  Validators.object<IAnthropicContentBlockStopPayload>(
    { index: Validators.number.optional() },
    { options: { optionalFields: ['index'] } }
  );

const anthropicMessageDeltaInner: Validator<{ stop_reason?: string }> = Validators.object<{
  stop_reason?: string;
}>({ stop_reason: Validators.string.optional() }, { options: { optionalFields: ['stop_reason'] } });

const anthropicMessageDeltaPayload: Validator<IAnthropicMessageDeltaPayload> =
  Validators.object<IAnthropicMessageDeltaPayload>({
    delta: anthropicMessageDeltaInner
  });

const anthropicErrorInner: Validator<{ message?: string }> = Validators.object<{ message?: string }>(
  { message: Validators.string.optional() },
  { options: { optionalFields: ['message'] } }
);

const anthropicErrorPayload: Validator<IAnthropicErrorPayload> = Validators.object<IAnthropicErrorPayload>(
  { error: anthropicErrorInner.optional() },
  { options: { optionalFields: ['error'] } }
);

// ============================================================================
// Stream translator
// ============================================================================

/**
 * Recognized Anthropic Messages API SSE event names. Anything not in this set surfaces a
 * one-time `logger.warn` per stream — same rationale as the OpenAI Responses adapter's
 * `RECOGNIZED_OPENAI_RESPONSES_EVENTS` allowlist in `openaiResponses.ts`. Add to this set
 * when a new event type is observed and confirmed safe to ignore.
 *
 * @internal
 */
const RECOGNIZED_ANTHROPIC_EVENTS: ReadonlySet<string> = new Set<string>([
  // ---- handled by the translator ----
  'content_block_start',
  'content_block_delta',
  'content_block_stop',
  'message_delta',
  'message_stop',
  'error',
  // ---- lifecycle / heartbeats: intentionally silent ----
  'message_start',
  'ping'
]);

/**
 * Translates an Anthropic Messages API SSE stream into unified events.
 *
 * Maintains an ordered accumulation buffer (keyed by SSE `index`) for all
 * content blocks: `thinking`, `redacted_thinking`, `text`, and `tool_use`.
 * The buffer is available on the returned generator via `.accumulationBuffer`.
 *
 * Unrecognized event names are reported once per stream via `logger?.warn` —
 * see {@link RECOGNIZED_ANTHROPIC_EVENTS}.
 *
 * @internal
 */
async function* translateAnthropicStream(
  response: Response,
  accumulationBuffer: Map<number, IAccumulatedBlock>,
  logger?: Logging.ILogger
): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let stopped = false;
  // Track unrecognized event names we have already warned about, so a hot stream of
  // an unknown event type produces exactly one log line per name per stream.
  const warnedEvents = new Set<string>();

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const eventName = message.event;

      if (eventName === 'content_block_start') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          anthropicContentBlockStartPayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        if (!payload) continue;
        const { index: rawIndex, content_block: block } = payload;
        const index = rawIndex ?? 0;

        if (block.type === 'thinking') {
          accumulationBuffer.set(index, { type: 'thinking', thinking: '', signature: '' });
        } else if (block.type === 'redacted_thinking') {
          accumulationBuffer.set(index, {
            type: 'redacted_thinking',
            /* c8 ignore next 1 - defensive: Anthropic always provides data for redacted_thinking */
            data: block.data ?? ''
          });
        } else if (block.type === 'text') {
          accumulationBuffer.set(index, { type: 'text', text: '' });
        } else if (block.type === 'tool_use') {
          // A tool_use block_start MUST carry a non-empty id and name: the id is the
          // sole correlation key for the follow-up tool_result, and dropping the block
          // silently (then ignoring its input_json_delta chunks at the delta handler
          // below) is exactly how an orphaned block leaves the harness without a clean
          // id and corrupts the continuation. Surface it loudly instead of dropping it.
          if (block.id && block.name) {
            accumulationBuffer.set(index, {
              type: 'tool_use',
              id: block.id,
              name: block.name,
              argsBuffer: ''
            });
            yield { type: 'client-tool-call-start', toolName: block.name, callId: block.id };
          } else {
            logger?.warn(
              `${MALFORMED_TOOL_USE_WARN_TAG} Anthropic streaming adapter: tool_use content_block_start ` +
                `at index ${index} is missing a usable id and/or name ` +
                `(id=${JSON.stringify(block.id)}, name=${JSON.stringify(block.name)}). ` +
                `No client tool call will be issued for this block; its argument deltas are dropped. ` +
                `This usually indicates provider drift or a truncated stream.`
            );
          }
        } else if (block.type === 'server_tool_use' && block.name === 'web_search') {
          yield { type: 'tool-event', toolType: 'web_search', phase: 'started' };
        } else if (block.type === 'web_search_tool_result') {
          yield { type: 'tool-event', toolType: 'web_search', phase: 'completed' };
        }
      } else if (eventName === 'content_block_delta') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          anthropicContentBlockDeltaPayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        if (!payload) continue;
        const { index: rawDeltaIndex, delta } = payload;
        const index = rawDeltaIndex ?? 0;
        const block = accumulationBuffer.get(index);

        if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          /* c8 ignore next 1 - defensive: delta arrives only after block_start sets buffer entry */
          if (block?.type === 'text') {
            block.text += delta.text;
          }
          if (delta.text.length > 0) {
            fullText += delta.text;
            yield { type: 'text-delta', delta: delta.text };
          }
        } else if (delta.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
          /* c8 ignore next 1 - defensive: delta arrives only after block_start sets buffer entry */
          if (block?.type === 'tool_use') {
            block.argsBuffer += delta.partial_json;
          }
        } else if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string') {
          /* c8 ignore next 1 - defensive: delta arrives only after block_start sets buffer entry */
          if (block?.type === 'thinking') {
            block.thinking += delta.thinking;
          }
        } else if (delta.type === 'signature_delta' && typeof delta.signature === 'string') {
          // CRITICAL (E5): signature must be APPENDED, not overwritten.
          // The signature is base64 arriving in multiple chunks.
          // Overwriting produces a truncated signature that Anthropic rejects with HTTP 400.
          /* c8 ignore next 1 - defensive: delta arrives only after block_start sets buffer entry */
          if (block?.type === 'thinking') {
            block.signature += delta.signature;
          }
        }
      } else if (eventName === 'content_block_stop') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          anthropicContentBlockStopPayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        if (!payload) continue;
        /* c8 ignore next 1 - defensive: payload.index ?? 0 null branch is unreachable */
        const block = accumulationBuffer.get(payload.index ?? 0);
        /* c8 ignore next 1 - defensive: block always exists when block_stop follows block_start */
        if (block?.type === 'tool_use') {
          let args: JsonObject;
          try {
            /* c8 ignore next 1 - defensive: argsBuffer || '{}' empty-string branch unreachable in tests */
            const parsed = JSON.parse(block.argsBuffer || '{}') as unknown;
            /* c8 ignore start - defensive: non-object/malformed parse defaults to empty object */
            args =
              parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
                ? (parsed as JsonObject)
                : {};
          } catch {
            args = {};
          }
          /* c8 ignore stop */
          yield { type: 'client-tool-call-done', toolName: block.name, callId: block.id, args };
        }
      } else if (eventName === 'message_delta') {
        const payload = validateEventPayload(parseSseEventJson(message.data), anthropicMessageDeltaPayload);
        /* c8 ignore next 1 - defensive: payload?.delta null branch unreachable after validation */
        if (payload?.delta.stop_reason === 'max_tokens') {
          truncated = true;
        }
      } else if (eventName === 'message_stop') {
        stopped = true;
      } else if (eventName === 'error') {
        const payload = validateEventPayload(parseSseEventJson(message.data), anthropicErrorPayload);
        yield {
          type: 'error',
          /* c8 ignore next 1 - defensive: payload?.error null branch unreachable after validation */
          message: payload?.error?.message ?? 'Anthropic stream returned an error event'
        };
        return;
      } else if (
        typeof eventName === 'string' &&
        !RECOGNIZED_ANTHROPIC_EVENTS.has(eventName) &&
        !warnedEvents.has(eventName)
      ) {
        // Empirical drift instrument: an unrecognized Anthropic event surfaces as a one-time
        // warning per stream. Update RECOGNIZED_ANTHROPIC_EVENTS once the new event is either
        // handled or confirmed safe to ignore.
        warnedEvents.add(eventName);
        logger?.warn(
          `${UNRECOGNIZED_EVENT_WARN_TAG} Anthropic streaming adapter: unrecognized SSE event ` +
            `'${eventName}'. ` +
            `payload preview: ${formatUnrecognizedEventPayloadPreview(message.data)}. ` +
            `This may indicate provider drift — if the new event carries data the adapter ` +
            `should surface, add a handler; otherwise add the name to ` +
            `RECOGNIZED_ANTHROPIC_EVENTS.`
        );
      }
    }
  } catch (err: unknown) /* c8 ignore start - defensive: stream errors are always Error instances */ {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  } /* c8 ignore stop */

  if (stopped) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'Anthropic stream ended without a message_stop event' };
  }
}

// ============================================================================
// Per-format request caller
// ============================================================================

/**
 * Issues a streaming Anthropic Messages request and returns the
 * unified-event iterable on success.
 *
 * @internal
 */
export async function callAnthropicStream(
  config: IStreamApiConfig,
  prompt: AiPrompt,
  messagesBefore: ReadonlyArray<IChatMessage> | undefined,
  temperature: number | undefined,
  tools: ReadonlyArray<AiToolConfig> | undefined,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig,
  accumulationBuffer?: Map<number, IAccumulatedBlock>,
  continuationMessages?: ReadonlyArray<JsonObject>
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/messages`;
  const messages = buildAnthropicMessages(prompt, {
    head: messagesBefore,
    rawTail: continuationMessages
  });
  const body: Record<string, unknown> = {
    model: config.model,
    system: prompt.system,
    messages,
    max_tokens: 4096,
    stream: true
  };
  // Temperature is sent only when explicitly provided (Claude-5 rejects any temperature). When
  // thinking is active it is also rejected — the completion/streaming paths validate this upstream,
  // and the effort gate here is the safety net for the (unguarded) client-tool path.
  if (resolvedThinking?.anthropicEffort === undefined) {
    if (temperature !== undefined) {
      body.temperature = temperature;
    }
  }
  if (resolvedThinking?.anthropicEffort !== undefined) {
    body.thinking = {
      type: 'enabled',
      budget_tokens: anthropicEffortToBudgetTokens(resolvedThinking.anthropicEffort)
    };
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }
  if (tools && tools.length > 0) {
    body.tools = toAnthropicTools(tools);
  }
  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
  /* c8 ignore next 4 - optional logger diagnostic output */
  if (logger) {
    const toolTypes = tools && tools.length > 0 ? tools.map((t) => t.type).join(',') : 'none';
    logger.info(`Anthropic streaming: model=${config.model}, tools=${toolTypes}`);
  }
  const buffer = accumulationBuffer ?? new Map<number, IAccumulatedBlock>();
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateAnthropicStream(response, buffer, logger)));
}
