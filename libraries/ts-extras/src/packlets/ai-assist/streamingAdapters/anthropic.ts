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
 * Streaming adapter for the Anthropic Messages API. Surfaces server tool
 * use (e.g. `web_search`) as unified `tool-event` markers based on the
 * `content_block_start` / `content_block_stop` lifecycle.
 *
 * @packageDocumentation
 */

import { type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import { buildAnthropicMessages } from '../chatRequestBuilders';
import { AiPrompt, type AiServerToolConfig, type IAiStreamEvent, type IChatMessage } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { toAnthropicTools } from '../toolFormats';
import { type IResolvedThinkingConfig } from '../thinkingOptionsResolver';
import { IStreamApiConfig, openSseConnection, validateEventPayload } from './common';

// ============================================================================
// Event payload shapes
// ============================================================================

/**
 * Payload of a `content_block_start` SSE event. The `type` discriminator
 * tells us whether the block is text, a server-tool invocation, or a
 * tool result.
 *
 * @internal
 */
interface IAnthropicContentBlockStartPayload {
  readonly content_block: { readonly type?: string; readonly name?: string };
}

/**
 * Payload of a `content_block_delta` SSE event. The inner `delta.type`
 * discriminator is `text_delta` for the text we care about; other values
 * (e.g. `input_json_delta` for tool args) are ignored.
 *
 * @internal
 */
interface IAnthropicContentBlockDeltaPayload {
  readonly delta: { readonly type?: string; readonly text?: string };
}

/**
 * Payload of a `message_delta` SSE event carrying the final stop reason.
 *
 * @internal
 */
interface IAnthropicMessageDeltaPayload {
  readonly delta: { readonly stop_reason?: string };
}

/**
 * Payload of an `error` SSE event.
 *
 * @internal
 */
interface IAnthropicErrorPayload {
  readonly error?: { readonly message?: string };
}

const anthropicContentBlockInner: Validator<{ type?: string; name?: string }> = Validators.object<{
  type?: string;
  name?: string;
}>(
  {
    type: Validators.string.optional(),
    name: Validators.string.optional()
  },
  { options: { optionalFields: ['type', 'name'] } }
);

const anthropicContentBlockStartPayload: Validator<IAnthropicContentBlockStartPayload> =
  Validators.object<IAnthropicContentBlockStartPayload>({
    content_block: anthropicContentBlockInner
  });

const anthropicContentBlockDeltaInner: Validator<{ type?: string; text?: string }> = Validators.object<{
  type?: string;
  text?: string;
}>(
  {
    type: Validators.string.optional(),
    text: Validators.string.optional()
  },
  { options: { optionalFields: ['type', 'text'] } }
);

const anthropicContentBlockDeltaPayload: Validator<IAnthropicContentBlockDeltaPayload> =
  Validators.object<IAnthropicContentBlockDeltaPayload>({
    delta: anthropicContentBlockDeltaInner
  });

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
 * Translates an Anthropic Messages API SSE stream into unified events.
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
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          anthropicContentBlockStartPayload
        );
        /* c8 ignore next 6 - defensive: block?.type optional chaining null branches are unreachable */
        const block = payload?.content_block;
        if (block?.type === 'server_tool_use' && block.name === 'web_search') {
          yield { type: 'tool-event', toolType: 'web_search', phase: 'started' };
        } else if (block?.type === 'web_search_tool_result') {
          yield { type: 'tool-event', toolType: 'web_search', phase: 'completed' };
        }
      } else if (eventName === 'content_block_delta') {
        const payload = validateEventPayload(
          parseSseEventJson(message.data),
          anthropicContentBlockDeltaPayload
        );
        /* c8 ignore next 1 - defensive: payload?.delta.type null branch unreachable after validation */
        if (payload?.delta.type === 'text_delta' && typeof payload.delta.text === 'string') {
          const delta = payload.delta.text;
          if (delta.length > 0) {
            fullText += delta;
            yield { type: 'text-delta', delta };
          }
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
  temperature: number,
  tools: ReadonlyArray<AiServerToolConfig> | undefined,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/messages`;
  const messages = buildAnthropicMessages(prompt, { head: messagesBefore });
  // When thinking is active, temperature is rejected by Anthropic (validated upstream).
  const body: Record<string, unknown> = {
    model: config.model,
    system: prompt.system,
    messages,
    max_tokens: 4096,
    ...(resolvedThinking?.anthropicEffort === undefined ? { temperature } : {}),
    stream: true
  };
  if (resolvedThinking?.anthropicEffort !== undefined) {
    body.thinking = { type: 'enabled' };
    body.output_config = { effort: resolvedThinking.anthropicEffort };
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
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateAnthropicStream(response)));
}
