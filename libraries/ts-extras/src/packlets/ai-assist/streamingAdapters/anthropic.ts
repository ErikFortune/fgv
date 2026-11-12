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

import { type AnthropicThinkingOffType } from '../anthropicThinkingOff';
import { fail, type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';
import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';

import { buildAnthropicMessages, buildAnthropicSystem } from '../chatRequestBuilders';
import { type IAiCacheRequest } from '../cacheRequest';
import { anthropicAuthHeaders } from '../endpoint';
import {
  AiPrompt,
  DEFAULT_ANTHROPIC_MAX_TOKENS,
  type AiToolConfig,
  type IAiStreamEvent,
  type IChatMessage
} from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { toAnthropicTools } from '../toolFormats';
import { anthropicEffortToBudgetTokens, type IResolvedThinkingConfig } from '../thinkingOptionsResolver';
import { normalizeAnthropicUsage } from '../usageNormalization';
import {
  IStreamApiConfig,
  MALFORMED_TOOL_USE_WARN_TAG,
  UNRECOGNIZED_EVENT_WARN_TAG,
  formatUnrecognizedEventPayloadPreview,
  jsonObjectValidator,
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
  /** The `content_block_start` object as streamed; the accumulated fields are laid over it. */
  readonly block: JsonObject;
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
  /** The `content_block_start` object as streamed; the accumulated fields are laid over it. */
  readonly block: JsonObject;
  text: string;
  /**
   * The citations a server tool's results put on this text, in `citations_delta` order. Absent
   * when none arrived; replayed with the text, since dropping them edits the assistant turn.
   */
  citations?: JsonObject[];
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
 * An accumulated `server_tool_use` block (a provider-run tool such as `web_search`). `block` is the
 * `content_block_start` object exactly as streamed; `argsBuffer` is the concatenation of its
 * `input_json_delta` chunks, which replaces `block.input` when the turn is replayed.
 * @internal
 */
export interface IAccumulatedServerToolUseBlock {
  readonly type: 'server_tool_use';
  readonly block: JsonObject;
  argsBuffer: string;
}

/**
 * An accumulated server-tool result block (`web_search_tool_result`). It arrives complete in its
 * `content_block_start` event and is replayed exactly as streamed.
 * @internal
 */
export interface IAccumulatedServerToolResultBlock {
  readonly type: 'server_tool_result';
  readonly block: JsonObject;
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
  | IAccumulatedToolUseBlock
  | IAccumulatedServerToolUseBlock
  | IAccumulatedServerToolResultBlock;

/**
 * A `content_block` object from a `content_block_start` event: the raw JSON object, with the
 * fields the translator reads typed.
 * @internal
 */
type AnthropicContentBlock = JsonObject & {
  readonly type?: string;
  readonly name?: string;
  readonly id?: string;
  readonly data?: string;
};

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
  readonly content_block: AnthropicContentBlock;
}

/**
 * Payload of a `content_block_delta` SSE event. Various delta types are
 * discriminated on `delta.type`:
 * - `text_delta`: text content
 * - `input_json_delta`: tool argument accumulation
 * - `thinking_delta`: thinking text accumulation
 * - `signature_delta`: thinking signature accumulation (MUST be appended, not overwritten)
 * - `citations_delta`: one citation appended to a text block
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
    readonly citation?: JsonObject;
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
 * Payload of a `message_delta` SSE event carrying the final stop reason and,
 * on the terminal `message_delta`, the completed output-token count.
 * @internal
 */
interface IAnthropicMessageDeltaPayload {
  readonly delta: { readonly stop_reason?: string };
  readonly usage?: JsonObject;
}

/**
 * Payload of a `message_start` SSE event. Carries the initial `usage` block —
 * `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` —
 * which does not repeat on later events.
 * @internal
 */
interface IAnthropicMessageStartPayload {
  readonly message: { readonly usage?: JsonObject };
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

/** The typed fields checked, and the block kept as the JSON object it arrived as. */
const anthropicContentBlock: Validator<AnthropicContentBlock> = Validators.isA<AnthropicContentBlock>(
  'Anthropic content block',
  (v): v is AnthropicContentBlock => isJsonObject(v) && anthropicContentBlockInner.validate(v).isSuccess()
);

const anthropicContentBlockStartPayload: Validator<IAnthropicContentBlockStartPayload> =
  Validators.object<IAnthropicContentBlockStartPayload>(
    {
      index: Validators.number.optional(),
      content_block: anthropicContentBlock
    },
    { options: { optionalFields: ['index'] } }
  );

const anthropicContentBlockDeltaInner: Validator<{
  type?: string;
  text?: string;
  partial_json?: string;
  thinking?: string;
  signature?: string;
  citation?: JsonObject;
}> = Validators.object<{
  type?: string;
  text?: string;
  partial_json?: string;
  thinking?: string;
  signature?: string;
  citation?: JsonObject;
}>({
  type: Validators.string.optional(),
  text: Validators.string.optional(),
  partial_json: Validators.string.optional(),
  thinking: Validators.string.optional(),
  signature: Validators.string.optional(),
  citation: jsonObjectValidator.optional()
});

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
    delta: anthropicMessageDeltaInner,
    usage: jsonObjectValidator.optional()
  });

const anthropicMessageStartPayload: Validator<IAnthropicMessageStartPayload> =
  Validators.object<IAnthropicMessageStartPayload>({
    message: Validators.object<{ usage?: JsonObject }>({ usage: jsonObjectValidator.optional() })
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
  'message_start',
  'content_block_start',
  'content_block_delta',
  'content_block_stop',
  'message_delta',
  'message_stop',
  'error',
  // ---- lifecycle / heartbeats: intentionally silent ----
  'ping'
]);

/**
 * Translates an Anthropic Messages API SSE stream into unified events.
 *
 * Maintains an ordered accumulation buffer (keyed by SSE `index`) of the content blocks a
 * client-tool continuation sends back: `thinking` and `text` (their `content_block_start` objects
 * with the accumulated `thinking` / `signature`, or `text` / `citations`, laid over them),
 * `redacted_thinking`, client `tool_use`, and `web_search`'s `server_tool_use` and
 * `web_search_tool_result` (as streamed, with the server tool's input taken from its deltas). Any
 * other block type is not buffered and so not replayed, with a one-time warning per type; the
 * continuation builder also skips an empty `text` block and re-serializes client `tool_use` input.
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
  // Anthropic splits the usage block across two events: `message_start` carries
  // input/cache tokens (once, not repeated), `message_delta` carries the final
  // output-token count. Merged here so `done` can normalize a single object.
  let usageRaw: JsonObject | undefined;
  // Track unrecognized event names we have already warned about, so a hot stream of
  // an unknown event type produces exactly one log line per name per stream.
  const warnedEvents = new Set<string>();
  // Block types that are not buffered for a continuation, warned about once each per stream.
  const warnedBlockTypes = new Set<string>();

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const eventName = message.event;

      if (eventName === 'message_start') {
        const payload = validateEventPayload(parseSseEventJson(message.data), anthropicMessageStartPayload);
        if (payload?.message.usage !== undefined) {
          usageRaw = { ...usageRaw, ...payload.message.usage };
        }
      } else if (eventName === 'content_block_start') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          anthropicContentBlockStartPayload
        );
        /* c8 ignore next 1 - defensive: payload null branch unreachable after validation */
        if (!payload) continue;
        const { index: rawIndex, content_block: block } = payload;
        const index = rawIndex ?? 0;

        if (block.type === 'thinking') {
          accumulationBuffer.set(index, { type: 'thinking', block, thinking: '', signature: '' });
        } else if (block.type === 'redacted_thinking') {
          accumulationBuffer.set(index, {
            type: 'redacted_thinking',
            /* c8 ignore next 1 - defensive: Anthropic always provides data for redacted_thinking */
            data: block.data ?? ''
          });
        } else if (block.type === 'text') {
          accumulationBuffer.set(index, { type: 'text', block, text: '' });
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
          // Only the web_search pair is buffered: its result block is the one this adapter
          // recognizes, and a server_tool_use replayed without its result would be rejected.
          accumulationBuffer.set(index, { type: 'server_tool_use', block, argsBuffer: '' });
          yield { type: 'tool-event', toolType: 'web_search', phase: 'started' };
        } else if (block.type === 'web_search_tool_result') {
          accumulationBuffer.set(index, { type: 'server_tool_result', block });
          yield { type: 'tool-event', toolType: 'web_search', phase: 'completed' };
        } else {
          // Any other block is not buffered, so a client-tool continuation will not send it back;
          // say so once per block type, since that edits the turn the API returned.
          const kind =
            block.type === 'server_tool_use' ? `server_tool_use (${String(block.name)})` : String(block.type);
          if (!warnedBlockTypes.has(kind)) {
            warnedBlockTypes.add(kind);
            logger?.warn(
              `${UNRECOGNIZED_EVENT_WARN_TAG} Anthropic streaming adapter: content block ${kind} at index ` +
                `${index} is not replayed in a client-tool continuation`
            );
          }
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
          if (block?.type === 'tool_use' || block?.type === 'server_tool_use') {
            block.argsBuffer += delta.partial_json;
          }
        } else if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string') {
          /* c8 ignore next 1 - defensive: delta arrives only after block_start sets buffer entry */
          if (block?.type === 'thinking') {
            block.thinking += delta.thinking;
          }
        } else if (delta.type === 'citations_delta' && delta.citation !== undefined) {
          if (block?.type === 'text') {
            block.citations = [...(block.citations ?? []), delta.citation];
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
        if (payload?.usage !== undefined) {
          usageRaw = { ...usageRaw, ...payload.usage };
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
    const usage = normalizeAnthropicUsage(usageRaw);
    yield { type: 'done', truncated, fullText, ...(usage !== undefined ? { usage } : {}) };
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
  continuationMessages?: ReadonlyArray<JsonObject>,
  useAdaptiveThinking: boolean = false,
  maxTokens?: number,
  cache?: IAiCacheRequest,
  temperatureAcceptedWithThinking?: number,
  thinkingOffType: AnthropicThinkingOffType = 'disabled'
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/messages`;
  const messages = buildAnthropicMessages(prompt, {
    head: messagesBefore,
    rawTail: continuationMessages
  });
  const systemResult = buildAnthropicSystem(prompt.system, cache);
  if (systemResult.isFailure()) {
    return fail(systemResult.message);
  }
  const body: Record<string, unknown> = {
    model: config.model,
    system: systemResult.value,
    messages,
    // Anthropic's Messages API requires max_tokens on every request — see
    // AiAssist.DEFAULT_ANTHROPIC_MAX_TOKENS for why only this provider defaults it.
    max_tokens: maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
    stream: true
  };
  // Temperature is sent only when explicitly provided. With thinking active it conflicts — the
  // completion/streaming paths validate this upstream, and the effort gate here is the safety net for
  // the (unguarded) client-tool path — except for `temperatureAcceptedWithThinking`, the default a
  // model that restricts sampling parameters accepts with or without thinking.
  if (
    temperature !== undefined &&
    (resolvedThinking?.anthropicEffort === undefined || temperature === temperatureAcceptedWithThinking)
  ) {
    body.temperature = temperature;
  }
  if (resolvedThinking?.anthropicEffort !== undefined) {
    if (useAdaptiveThinking) {
      // Claude 5 family: adaptive thinking — no budget_tokens; effort moves to the
      // top-level output_config block. See AiAssist.isAdaptiveThinkingModel.
      body.thinking = { type: 'adaptive' };
      body.output_config = { effort: resolvedThinking.anthropicEffort };
    } else {
      body.thinking = {
        type: 'enabled',
        budget_tokens: anthropicEffortToBudgetTokens(resolvedThinking.anthropicEffort)
      };
    }
  } else if (resolvedThinking?.anthropicThinkingDisabled === true && useAdaptiveThinking) {
    // Adaptive models think by default, so omitting `thinking` would not turn it off. The off value
    // is per model (resolveAnthropicThinkingOffType), and a generic 'none' sends no effort beside it:
    // this branch runs only when anthropicEffort is unset (an 'other' block's otherParams, merged
    // below, can still add one), which also keeps between_tools clear of its 400 at
    // effort xhigh and max. A model on thinkingRequiredModelPrefixes never gets here: a generic
    // 'none' is degraded or refused when it is resolved, and executeClientToolTurn refuses a caller-built flag
    // for it before dispatch.
    body.thinking = { type: thinkingOffType };
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(body, resolvedThinking.otherParams);
  }
  if (tools && tools.length > 0) {
    // Defence in depth: `executeClientToolTurn` pre-flights every client tool with this same table
    // and target, so through it this cannot fail; it guards any other caller of this adapter.
    const toolsResult = toAnthropicTools(tools, config);
    if (toolsResult.isFailure()) {
      return fail(`Anthropic streaming: ${toolsResult.message}`);
    }
    body.tools = toolsResult.value;
  }
  const headers: Record<string, string> = anthropicAuthHeaders(config.apiKey);
  /* c8 ignore next 4 - optional logger diagnostic output */
  if (logger) {
    const toolTypes = tools && tools.length > 0 ? tools.map((t) => t.type).join(',') : 'none';
    logger.info(`Anthropic streaming: model=${config.model}, tools=${toolTypes}`);
  }
  const buffer = accumulationBuffer ?? new Map<number, IAccumulatedBlock>();
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateAnthropicStream(response, buffer, logger)));
}
