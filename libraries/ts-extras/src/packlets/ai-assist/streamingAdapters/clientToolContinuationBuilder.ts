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
 * Per-provider continuation message builders and the `executeClientToolTurn`
 * helper for orchestrating a single client-tool round-trip.
 *
 * Each provider requires a different wire format for the follow-up request:
 * - **Anthropic**: assistant turn reconstructed from the ordered accumulation
 *   buffer (thinking / redacted_thinking / text / tool_use in original stream
 *   order) + user turn with `tool_result` blocks. When thinking is active, the
 *   follow-up request must NOT set `tool_choice: { type: 'any' }` or
 *   `tool_choice: { type: 'tool', ... }` (E3 / §5.4 of b4-spike-findings).
 * - **OpenAI / xAI Responses API**: `function_call` input items +
 *   `function_call_output` input items.
 * - **Gemini**: model turn with `functionCall` parts + user turn with
 *   `functionResponse` parts (correlation by tool name).
 *
 * @packageDocumentation
 */

import { captureAsyncResult, fail, type Logging, Result, succeed } from '@fgv/ts-utils';
import { type JsonArray, type JsonObject } from '@fgv/ts-json-base';

import {
  type AiServerToolConfig,
  type AiToolConfig,
  type IAiClientTool,
  type IAiClientToolContinuation,
  type IAiClientToolTurnResult,
  type IAiStreamEvent,
  type IChatRequest,
  type IAiProviderDescriptor,
  resolveProviderModel
} from '../model';
import { type IResolvedThinkingConfig } from '../thinkingOptionsResolver';
import { splitChatRequest } from '../chatRequestBuilders';
import { resolveEffectiveBaseUrl } from '../endpoint';
import { type IAccumulatedBlock } from './anthropic';
import { type IAccumulatedFunctionCall } from './openaiResponses';
import { type IAccumulatedGeminiFunctionCall } from './gemini';
import { callAnthropicStream } from './anthropic';
import { callOpenAiResponsesStream } from './openaiResponses';
import { callGeminiStream } from './gemini';
import { type IStreamApiConfig } from './common';

// ============================================================================
// Tool-result accumulation (internal)
// ============================================================================

/**
 * Accumulated result for a single tool call, collected during stream iteration.
 * @internal
 */
interface IToolCallResult {
  readonly toolName: string;
  readonly callId?: string;
  readonly args: JsonObject;
  readonly result: string;
  readonly isError: boolean;
}

// ============================================================================
// Anthropic continuation builder
// ============================================================================

/**
 * Returns `true` when `id` is a usable correlation id — present and non-empty.
 *
 * `??` is NOT sufficient for this check: an empty string is a *bad* id (a
 * `tool_use_id: ''` is rejected by Anthropic as a "malformed identifier") but
 * `'' ?? fallback` yields `''`, silently passing the empty id through. Every id
 * correlation in this module must use this predicate, never `??`.
 *
 * @internal
 */
function isUsableId(id: string | undefined): id is string {
  return id !== undefined && id.length > 0;
}

/**
 * Builds the Anthropic follow-up messages for a client-tool round-trip.
 *
 * Reconstructs the assistant turn from the ordered accumulation buffer
 * (all block types in original stream order) and appends a user turn
 * with `tool_result` blocks for each executed tool call.
 *
 * **Single source of truth for the id (id-correlation fix).** Each
 * `tool_result.tool_use_id` is drawn from — and validated against — the set of
 * assistant `tool_use.id`s actually present in the accumulation buffer. The id
 * is NEVER derived from the tool name: a tool name can never match a `toolu_*`
 * id, so a name fallback produces exactly the "malformed identifier" the
 * provider rejects. If any tool result cannot be correlated to a buffered
 * `tool_use` block with a non-empty id, the build fails loud (naming the tool)
 * rather than emitting a malformed continuation.
 *
 * **Constraint (E3):** The returned continuation does NOT include a forced
 * `tool_choice` field. When thinking is active, Anthropic rejects
 * `tool_choice: { type: 'any' }` and `tool_choice: { type: 'tool', ... }`
 * with an HTTP 400 error. Only `tool_choice: { type: 'auto' }` (the default,
 * i.e. omitted) is compatible with extended thinking.
 *
 * @internal
 */
export function buildAnthropicContinuation(
  accBuffer: Map<number, IAccumulatedBlock>,
  toolResults: IToolCallResult[],
  logger?: Logging.ILogger
): Result<IAiClientToolContinuation> {
  // Reconstruct the assistant turn from the ordered accumulation buffer.
  // Sort by buffer key (SSE index) to restore original stream order.
  const sortedKeys = Array.from(accBuffer.keys()).sort((a, b) => a - b);
  const assistantContent: JsonArray = [];
  // The set of assistant tool_use ids — the single source of truth every
  // tool_result.tool_use_id must be drawn from.
  const bufferedToolUseIds = new Set<string>();

  for (const key of sortedKeys) {
    const block = accBuffer.get(key);
    /* c8 ignore next 1 - defensive: key always exists in map since we iterate its keys */
    if (!block) continue;
    if (block.type === 'thinking') {
      assistantContent.push({
        type: 'thinking',
        thinking: block.thinking,
        signature: block.signature
      });
    } else if (block.type === 'redacted_thinking') {
      assistantContent.push({
        type: 'redacted_thinking',
        data: block.data
      });
    } else if (block.type === 'text') {
      if (block.text.length > 0) {
        assistantContent.push({ type: 'text', text: block.text });
      }
    } else if (block.type === 'tool_use') {
      // A buffered tool_use with an empty id can never be referenced by a valid
      // tool_result; emitting it would corrupt the assistant turn. Fail loud.
      if (!isUsableId(block.id)) {
        return fail(
          `Anthropic continuation: buffered tool_use block for tool '${block.name}' has an empty id; ` +
            `cannot build a valid continuation`
        );
      }
      let parsedInput: JsonObject;
      try {
        /* c8 ignore next 1 - defensive: argsBuffer is JSON-parsed in the adapter before emitting client-tool-call-done */
        parsedInput = JSON.parse(block.argsBuffer || '{}') as JsonObject;
        /* c8 ignore start - defensive: malformed argsBuffer defaults to empty object */
      } catch {
        parsedInput = {};
      }
      /* c8 ignore stop */
      bufferedToolUseIds.add(block.id);
      assistantContent.push({
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: parsedInput
      });
    }
  }

  // Build user turn with tool_result blocks for each tool call. Correlate each
  // result to a buffered tool_use id — the SAME id that keys the assistant
  // tool_use block — and fail loud on a missing / empty / mismatched id. A
  // missing callId is a bug to surface, not paper over with a name fallback.
  const userContent: JsonArray = [];
  for (const r of toolResults) {
    if (!isUsableId(r.callId)) {
      return fail(
        `Anthropic continuation: tool '${r.toolName}' result has no call id (missing or empty); ` +
          `cannot correlate it to an assistant tool_use block`
      );
    }
    if (!bufferedToolUseIds.has(r.callId)) {
      return fail(
        `Anthropic continuation: tool '${r.toolName}' call id '${r.callId}' does not match any ` +
          `buffered assistant tool_use block id`
      );
    }
    const block: JsonObject = {
      type: 'tool_result',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tool_use_id: r.callId,
      content: r.result
    };
    userContent.push(r.isError ? { ...block, is_error: true } : block);
  }

  // Decisive diagnostic: the tool_use.id ↔ tool_result.tool_use_id pairing for
  // the outgoing continuation. A failing turn is field-confirmable by capturing
  // this line (the pairing is by construction matched here — divergence fails
  // loud above, before reaching this point).
  if (logger) {
    const pairing = toolResults.map((r) => `${r.toolName}:${r.callId}`).join(', ');
    logger.detail(`ai-assist:anthropic-continuation tool_use.id↔tool_result.tool_use_id [${pairing}]`);
  }

  const assistantMessage: JsonObject = {
    role: 'assistant',
    content: assistantContent
  };
  const userMessage: JsonObject = {
    role: 'user',
    content: userContent
  };

  return succeed({
    messages: [assistantMessage, userMessage],
    toolCallsSummary: toolResults.map((r) => ({
      toolName: r.toolName,
      callId: r.callId,
      args: r.args,
      result: r.result,
      isError: r.isError
    }))
  });
}

// ============================================================================
// OpenAI / xAI Responses API continuation builder
// ============================================================================

/**
 * Builds the OpenAI / xAI Responses API follow-up input items for a
 * client-tool round-trip.
 *
 * Emits `function_call` items (the model's call) followed by
 * `function_call_output` items (the harness execution result), one pair
 * per executed tool call.
 *
 * **Single source of truth for the id (id-correlation fix).** Each
 * `function_call_output.call_id` is drawn from — and validated against — the
 * set of `function_call.call_id`s in the accumulation map. It is NEVER derived
 * from the tool name (the OpenAI parity of the Anthropic `tool_use_id` fix). A
 * missing / empty / unmatched call id fails the build loud rather than emitting
 * a continuation the provider would reject.
 *
 * @internal
 */
export function buildOpenAiContinuation(
  calls: Map<string, IAccumulatedFunctionCall>,
  toolResults: IToolCallResult[],
  logger?: Logging.ILogger
): Result<IAiClientToolContinuation> {
  const items: JsonObject[] = [];

  // Emit function_call items for each call (model's side). Per the Responses API spec
  // (ResponseFunctionToolCall), `call_id` is the required correlation field — it must
  // match the matching function_call_output's `call_id` below. The optional `id` field
  // is the output-item id (`fc_*`) used to reference the streamed item; we omit it
  // because it is not load-bearing for input items.
  const bufferedCallIds = new Set<string>();
  for (const [callId, call] of calls) {
    bufferedCallIds.add(callId);
    items.push({
      type: 'function_call',
      call_id: callId,
      name: call.name,
      arguments: call.argsBuffer
    });
  }

  // Emit function_call_output items (harness execution results). Correlate each
  // to a buffered function_call call_id — never the tool name — and fail loud on
  // a missing / empty / mismatched id.
  for (const r of toolResults) {
    if (!isUsableId(r.callId)) {
      return fail(
        `OpenAI continuation: tool '${r.toolName}' result has no call id (missing or empty); ` +
          `cannot correlate it to a function_call item`
      );
    }
    if (!bufferedCallIds.has(r.callId)) {
      return fail(
        `OpenAI continuation: tool '${r.toolName}' call id '${r.callId}' does not match any ` +
          `accumulated function_call call_id`
      );
    }
    items.push({
      type: 'function_call_output',
      call_id: r.callId,
      output: r.result
    });
  }

  // Decisive diagnostic: the function_call.call_id ↔ function_call_output.call_id
  // pairing for the outgoing continuation (matched by construction here).
  if (logger) {
    const pairing = toolResults.map((r) => `${r.toolName}:${r.callId}`).join(', ');
    logger.detail(`ai-assist:openai-continuation function_call.call_id↔output.call_id [${pairing}]`);
  }

  return succeed({
    messages: items,
    toolCallsSummary: toolResults.map((r) => ({
      toolName: r.toolName,
      callId: r.callId,
      args: r.args,
      result: r.result,
      isError: r.isError
    }))
  });
}

// ============================================================================
// Gemini continuation builder
// ============================================================================

/**
 * Builds the Gemini follow-up contents for a client-tool round-trip.
 *
 * Emits a model turn with `functionCall` parts (one per tool call) and a
 * user turn with `functionResponse` parts (correlation by tool name, since
 * Gemini does not assign call IDs).
 *
 * @internal
 */
export function buildGeminiContinuation(
  calls: IAccumulatedGeminiFunctionCall[],
  toolResults: IToolCallResult[]
): IAiClientToolContinuation {
  // Model turn: functionCall parts for each call.
  const modelParts: JsonArray = calls.map(
    (call): JsonObject => ({
      functionCall: {
        name: call.name,
        args: call.args
      }
    })
  );

  // User turn: functionResponse parts for each executed result.
  // Correlation is by name since Gemini has no call IDs.
  const userParts: JsonArray = toolResults.map(
    (r): JsonObject => ({
      functionResponse: {
        name: r.toolName,
        response: {
          content: r.result,
          ...(r.isError ? { error: true } : {})
        }
      }
    })
  );

  const modelMessage: JsonObject = {
    role: 'model',
    parts: modelParts
  };
  const userMessage: JsonObject = {
    role: 'user',
    parts: userParts
  };

  return {
    messages: [modelMessage, userMessage],
    toolCallsSummary: toolResults.map((r) => ({
      toolName: r.toolName,
      callId: r.callId,
      args: r.args,
      result: r.result,
      isError: r.isError
    }))
  };
}

// ============================================================================
// executeClientToolTurn parameters
// ============================================================================

/**
 * Parameters for {@link AiAssist.executeClientToolTurn}.
 *
 * @remarks
 * Carries the unified {@link AiAssist.IChatRequest} shape (`system?` + ordered
 * `messages`): the last message is the current user turn and the preceding
 * messages are history, linearized before the current turn — identically to the
 * completion and streaming paths. {@link IExecuteClientToolTurnParams.continuationMessages}
 * remains a distinct post-current-turn axis (see below).
 *
 * @public
 */
export interface IExecuteClientToolTurnParams extends IChatRequest {
  /** The provider descriptor for routing (Anthropic / OpenAI / Gemini). */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication. */
  readonly apiKey: string;
  /**
   * The cumulative provider-native wire tail from the previous turn's
   * {@link AiAssist.IAiClientToolContinuation.messages}. Supply this as-is
   * each round — `messages` is already cumulative, so **replace** rather
   * than manually concatenate:
   *
   * ```ts
   * tail = outcome.continuation.messages; // replace — already cumulative
   * ```
   *
   * On the first turn this should be `undefined` (or omitted).
   *
   * Each provider applies its own shape guard to the supplied wire objects:
   * - Anthropic: projects each entry to `{ role, content }` (sufficient for
   *   thinking blocks and `tool_result` arrays).
   * - OpenAI / xAI Responses: passes each item verbatim (`function_call` /
   *   `function_call_output` items carry distinct fields per `type`); only
   *   guards that each entry is a JSON object.
   * - Gemini: projects each entry to `{ role, parts }`.
   *
   * Entries that fail their provider's shape check are silently skipped.
   * Do NOT place these objects in the `messages` parameter — the
   * normalized-message path strips provider-native fields.
   */
  readonly continuationMessages?: ReadonlyArray<JsonObject>;
  /** Temperature (default: 0.7). */
  readonly temperature?: number;
  /** Server-side tools to include. */
  readonly tools?: ReadonlyArray<AiServerToolConfig>;
  /** Client-defined tools available for the model to call. */
  readonly clientTools: ReadonlyArray<IAiClientTool>;
  /** Optional abort signal. */
  readonly signal?: AbortSignal;
  /**
   * Optional override of the descriptor's default base URL. Same semantics as
   * the non-streaming completion path and `callProviderCompletionStream`: a
   * well-formed `http`/`https` URL is substituted for `descriptor.baseUrl`
   * when composing the per-format request, with the per-format suffix appended
   * unchanged. Validated at the dispatcher; auth shape is unaffected. Use this
   * to point a client-tool turn at a local / LAN OpenAI-compatible server
   * (Ollama, LM Studio, llama.cpp).
   */
  readonly endpoint?: string;
  /** Optional logger for diagnostics. */
  readonly logger?: Logging.ILogger;
  /** Optional resolved thinking config (pre-resolved by the caller). */
  readonly resolvedThinking?: IResolvedThinkingConfig;
  /** Resolved model string (pre-resolved by the caller). When omitted, uses the descriptor's default model. */
  readonly model?: string;
}

/**
 * Return value of {@link AiAssist.executeClientToolTurn}.
 * @public
 */
export interface IExecuteClientToolTurnResult {
  /**
   * The unified-event iterable. Callers iterate this to drive the streaming UI.
   * The iterable forwards `text-delta`, `tool-event`, `client-tool-call-start`,
   * `client-tool-call-done`, and `client-tool-result` events through.
   */
  readonly events: AsyncIterable<IAiStreamEvent>;
  /**
   * Resolves when the stream terminates. On success, carries the
   * {@link AiAssist.IAiClientToolTurnResult} with the optional continuation for the
   * next round. On failure, carries the error message.
   */
  readonly nextTurn: Promise<Result<IAiClientToolTurnResult>>;
}

// ============================================================================
// executeClientToolTurn
// ============================================================================

/**
 * Orchestrates a single client-tool streaming turn for any supported provider.
 *
 * Starts a streaming request, iterates the underlying provider stream, and:
 * - Forwards `text-delta`, `tool-event`, `client-tool-call-start`, and
 *   `client-tool-call-done` events through to the consumer.
 * - For each `client-tool-call-done` event: validates the raw args against the
 *   tool's `parametersSchema`, invokes `execute(typedArgs)`, and emits a
 *   `client-tool-result` event.
 * - After stream completion: builds the per-provider continuation (or
 *   `{ continuation: undefined }` when no tool calls occurred) and resolves
 *   `nextTurn`.
 *
 * **Anthropic constraint (E3):** The continuation for Anthropic does not set
 * a forced `tool_choice`. Only `tool_choice: 'auto'` (the default, i.e.
 * omitted) is compatible with extended thinking.
 *
 * @param params - Turn parameters
 * @returns `{ events, nextTurn }` — stream iterable + completion promise
 * @public
 */
export function executeClientToolTurn(
  params: IExecuteClientToolTurnParams
): Result<IExecuteClientToolTurnResult> {
  const {
    descriptor,
    apiKey,
    system,
    messages,
    continuationMessages,
    temperature,
    tools,
    clientTools,
    signal,
    logger,
    resolvedThinking,
    model,
    endpoint
  } = params;

  const splitResult = splitChatRequest(system, messages);
  if (splitResult.isFailure()) {
    return fail(splitResult.message);
  }
  const { prompt, head } = splitResult.value;
  if (prompt.attachments.length > 0 && !descriptor.acceptsImageInput) {
    return fail(`provider "${descriptor.id}" does not accept image input`);
  }

  // Build a lookup map of client tools by name for fast access.
  // Fail fast on duplicate names — silently overwriting would cause one tool
  // to shadow another with no observable signal.
  const toolsByName = new Map<string, IAiClientTool>();
  for (const tool of clientTools) {
    if (toolsByName.has(tool.config.name)) {
      return fail(`executeClientToolTurn: duplicate client tool name '${tool.config.name}'`);
    }
    toolsByName.set(tool.config.name, tool);
  }

  // Merge server tools and client tool configs into a single array for the provider.
  // This is the fix for P1-1: client tools were never sent to the provider because
  // the adapters only received `tools` (server tools). Both must coexist per design §2.5.
  const effectiveTools: ReadonlyArray<AiToolConfig> | undefined =
    clientTools.length > 0 ? [...(tools ?? []), ...clientTools.map((t) => t.config)] : tools;

  const effectiveTemperature = temperature ?? 0.7;
  const modelResult = resolveProviderModel(descriptor, model);
  if (modelResult.isFailure()) {
    return fail(modelResult.message);
  }
  const resolvedModel = modelResult.value;
  const baseUrlResult = resolveEffectiveBaseUrl(descriptor, endpoint);
  if (baseUrlResult.isFailure()) {
    return fail(baseUrlResult.message);
  }
  const config: IStreamApiConfig = {
    baseUrl: baseUrlResult.value,
    apiKey,
    model: resolvedModel
  };

  // Accumulation buffers — populated by the adapter, read by the builder.
  const anthropicBuffer = new Map<number, IAccumulatedBlock>();
  const openAiCallMap = new Map<string, IAccumulatedFunctionCall>();
  const geminiCalls: IAccumulatedGeminiFunctionCall[] = [];

  // Collected tool results, populated as each client-tool-call-done is processed.
  const toolResults: IToolCallResult[] = [];

  // Stream start: open the underlying adapter stream.
  const streamPromise: Promise<Result<AsyncIterable<IAiStreamEvent>>> = (() => {
    switch (descriptor.apiFormat) {
      case 'anthropic':
        return callAnthropicStream(
          config,
          prompt,
          head,
          effectiveTemperature,
          effectiveTools,
          logger,
          signal,
          resolvedThinking,
          anthropicBuffer,
          continuationMessages
        );
      case 'openai':
        return callOpenAiResponsesStream(
          config,
          prompt,
          /* c8 ignore next 1 - defensive: openai path requires tools; empty array fallback unreachable in practice */
          effectiveTools ?? [],
          head,
          effectiveTemperature,
          logger,
          signal,
          resolvedThinking,
          openAiCallMap,
          continuationMessages
        );
      case 'gemini':
        return callGeminiStream(
          config,
          prompt,
          head,
          effectiveTemperature,
          effectiveTools,
          logger,
          signal,
          resolvedThinking,
          geminiCalls,
          continuationMessages
        );
      /* c8 ignore next 4 - defensive coding: exhaustive switch guaranteed by TypeScript */
      default: {
        const _exhaustive: never = descriptor.apiFormat;
        return Promise.resolve(fail(`unsupported API format: ${String(_exhaustive)}`));
      }
    }
  })();

  // Resolve controls for `nextTurn`.
  let resolveNextTurn!: (result: Result<IAiClientToolTurnResult>) => void;
  const nextTurn = new Promise<Result<IAiClientToolTurnResult>>((resolve) => {
    resolveNextTurn = resolve;
  });

  // The unified-event generator: opens the stream, proxies events, executes tools.
  async function* eventGenerator(): AsyncGenerator<IAiStreamEvent> {
    const streamResult = await streamPromise;
    if (streamResult.isFailure()) {
      resolveNextTurn(fail(streamResult.message));
      yield { type: 'error', message: streamResult.message };
      return;
    }

    let truncated = false;
    let fullText = '';
    let streamError: string | undefined;

    for await (const event of streamResult.value) {
      if (event.type === 'done') {
        truncated = event.truncated;
        fullText = event.fullText;
        yield event;
        continue;
      }

      if (event.type === 'error') {
        streamError = event.message;
        yield event;
        continue;
      }

      if (event.type === 'text-delta') {
        yield event;
        continue;
      }

      if (event.type === 'tool-event') {
        yield event;
        continue;
      }

      if (event.type === 'client-tool-call-start') {
        yield event;
        continue;
      }

      if (event.type === 'client-tool-call-done') {
        yield event;

        const { toolName, callId, args } = event;
        const tool = toolsByName.get(toolName);

        if (!tool) {
          const errMsg = `model called unknown tool: ${toolName}`;
          const resultEvent: IAiStreamEvent = {
            type: 'client-tool-result',
            toolName,
            callId,
            result: errMsg,
            isError: true
          };
          yield resultEvent;
          toolResults.push({ toolName, callId, args, result: errMsg, isError: true });
          resolveNextTurn(fail(errMsg));
          return;
        }

        const validationResult = tool.config.parametersSchema.validate(args);
        if (validationResult.isFailure()) {
          const errMsg = `${toolName} (callId=${callId}): ${validationResult.message}`;
          const resultEvent: IAiStreamEvent = {
            type: 'client-tool-result',
            toolName,
            callId,
            result: errMsg,
            isError: true
          };
          yield resultEvent;
          toolResults.push({ toolName, callId, args, result: errMsg, isError: true });
          continue;
        }

        const executeResult = await captureAsyncResult(async () => tool.execute(validationResult.value));
        const executionResult: Result<unknown> = executeResult.isSuccess()
          ? executeResult.value
          : executeResult;

        if (executionResult.isFailure()) {
          const errMsg = `${toolName} (callId=${callId}): ${executionResult.message}`;
          const resultEvent: IAiStreamEvent = {
            type: 'client-tool-result',
            toolName,
            callId,
            result: errMsg,
            isError: true
          };
          yield resultEvent;
          toolResults.push({ toolName, callId, args, result: errMsg, isError: true });
          continue;
        }

        // JSON.stringify can throw (circular references) or return undefined
        // (e.g. for a bare `undefined` value, or a value of type `function`).
        // Either outcome violates the client-tool-result event contract, so
        // emit an isError result with diagnostic context instead.
        let resultStr: string;
        try {
          const stringified = JSON.stringify(executionResult.value);
          if (stringified === undefined) {
            const errMsg = `${toolName} (callId=${callId}): tool returned a non-serializable value (JSON.stringify produced undefined)`;
            const resultEvent: IAiStreamEvent = {
              type: 'client-tool-result',
              toolName,
              callId,
              result: errMsg,
              isError: true
            };
            yield resultEvent;
            toolResults.push({ toolName, callId, args, result: errMsg, isError: true });
            continue;
          }
          resultStr = stringified;
        } catch (e) {
          const errMsg = `${toolName} (callId=${callId}): failed to serialize tool result: ${
            (e as Error).message
          }`;
          const resultEvent: IAiStreamEvent = {
            type: 'client-tool-result',
            toolName,
            callId,
            result: errMsg,
            isError: true
          };
          yield resultEvent;
          toolResults.push({ toolName, callId, args, result: errMsg, isError: true });
          continue;
        }
        const resultEvent: IAiStreamEvent = {
          type: 'client-tool-result',
          toolName,
          callId,
          result: resultStr,
          isError: false
        };
        yield resultEvent;
        toolResults.push({ toolName, callId, args, result: resultStr, isError: false });
        continue;
      }

      // client-tool-result events are emitted by this layer, not the adapters — no passthrough needed.
    }

    // Stream has ended. Build the continuation.
    if (streamError !== undefined) {
      resolveNextTurn(fail(streamError));
      return;
    }

    if (toolResults.length === 0) {
      resolveNextTurn(succeed({ continuation: undefined, truncated, fullText }));
      return;
    }

    let continuationResult: Result<IAiClientToolContinuation>;
    switch (descriptor.apiFormat) {
      case 'anthropic':
        continuationResult = buildAnthropicContinuation(anthropicBuffer, toolResults, logger);
        break;
      case 'openai':
        continuationResult = buildOpenAiContinuation(openAiCallMap, toolResults, logger);
        break;
      case 'gemini':
        // Gemini correlates by tool name by design (no call ids) — its builder
        // cannot mis-key and stays non-fallible.
        continuationResult = succeed(buildGeminiContinuation(geminiCalls, toolResults));
        break;
      /* c8 ignore next 5 - defensive coding: exhaustive switch guaranteed by TypeScript */
      default: {
        const _exhaustive: never = descriptor.apiFormat;
        resolveNextTurn(fail(`unsupported API format: ${String(_exhaustive)}`));
        return;
      }
    }

    // A bad id-correlation fails loud here rather than emitting a malformed
    // continuation the provider would reject as a "malformed identifier". Mirror
    // the stream-open-failure path above: surface an `error` event so a consumer
    // iterating `events` sees the failure inline, not only via `nextTurn`.
    if (continuationResult.isFailure()) {
      resolveNextTurn(fail(continuationResult.message));
      yield { type: 'error', message: continuationResult.message };
      return;
    }
    let continuation = continuationResult.value;

    // Prepend inbound continuationMessages so the returned continuation is cumulative.
    // A consumer that does `tail = outcome.continuation.messages` (replace) is then
    // correct for all N rounds — messages always contains the full wire tail from
    // round 1 through the current round. toolCallsSummary stays per-round (this
    // round's calls only); messages is the accumulated tail to re-send.
    if (continuationMessages && continuationMessages.length > 0) {
      continuation = { ...continuation, messages: [...continuationMessages, ...continuation.messages] };
    }

    resolveNextTurn(succeed({ continuation, truncated, fullText }));
  }

  return succeed({
    events: { [Symbol.asyncIterator]: () => eventGenerator() },
    nextTurn
  });
}
