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
 * Streaming adapter for OpenAI Chat Completions (also used for Groq, Mistral,
 * and other Chat-Completions-compatible providers when no tools are
 * requested).
 *
 * @packageDocumentation
 */

import { type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import { buildMessages, buildOpenAiChatUserContent } from '../chatRequestBuilders';
import { bearerAuthHeader } from '../endpoint';
import { AiPrompt, type IAiStreamEvent, type IChatMessage } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { IStreamApiConfig, openSseConnection, validateEventPayload } from './common';

// ============================================================================
// Event payload shapes
// ============================================================================

/**
 * The shape of `choices[0]` in an OpenAI Chat Completions streaming chunk.
 * Both `delta.content` and `finish_reason` are optional — content arrives in
 * intermediate chunks, finish_reason in the terminal chunk. The wire sends
 * `finish_reason: null` (literal null, not absent) on intermediate chunks,
 * so the validator must accept null alongside string.
 *
 * @internal
 */
interface IOpenAiChatStreamChoice {
  readonly delta?: { readonly content?: string };
  // eslint-disable-next-line @rushstack/no-new-null
  readonly finish_reason?: string | null;
}

/**
 * One streaming chunk from the OpenAI Chat Completions endpoint. Always has
 * a `choices` array with one element in the streaming mode.
 *
 * @internal
 */
interface IOpenAiChatStreamChunk {
  readonly choices: ReadonlyArray<IOpenAiChatStreamChoice>;
}

// eslint-disable-next-line @rushstack/no-new-null
const stringOrNull: Validator<string | null> = Validators.isA<string | null>(
  'string-or-null',
  // eslint-disable-next-line @rushstack/no-new-null
  (v: unknown): v is string | null => typeof v === 'string' || v === null
);

const openAiChatStreamChoice: Validator<IOpenAiChatStreamChoice> = Validators.object<IOpenAiChatStreamChoice>(
  {
    delta: Validators.object<{ content?: string }>(
      { content: Validators.string },
      { options: { optionalFields: ['content'] } }
    ).optional(),
    finish_reason: stringOrNull.optional()
  },
  { options: { optionalFields: ['delta', 'finish_reason'] } }
);

const openAiChatStreamChunk: Validator<IOpenAiChatStreamChunk> = Validators.object<IOpenAiChatStreamChunk>({
  choices: Validators.arrayOf(openAiChatStreamChoice)
});

// ============================================================================
// Stream translator
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
      const chunk = validateEventPayload(json, openAiChatStreamChunk);
      /* c8 ignore next 1 - defensive: chunk?.choices null branch unreachable after validation */
      const choice = chunk?.choices[0];
      if (!choice) {
        /* c8 ignore start - defensive: SSE events without choices are skipped */ continue;
      } /* c8 ignore stop */
      /* c8 ignore next 1 - defensive: choice.delta?.content null branch unreachable after validation */
      const delta = choice.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        fullText += delta;
        yield { type: 'text-delta', delta };
      }
      const finish = choice.finish_reason;
      if (typeof finish === 'string' && finish.length > 0) {
        truncated = finish === 'length';
        receivedDone = true;
      }
    }
  } catch (err: unknown) /* c8 ignore start - defensive: stream errors are always Error instances */ {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  } /* c8 ignore stop */

  if (receivedDone) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'OpenAI stream ended without a finish_reason' };
  }
}

// ============================================================================
// Per-format request caller
// ============================================================================

/**
 * Issues a streaming Chat Completions request and returns the unified-event
 * iterable on success.
 *
 * @internal
 */
export async function callOpenAiChatStream(
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
  const headers: Record<string, string> = bearerAuthHeader(config.apiKey);
  /* c8 ignore next 1 - optional logger */
  logger?.info(`OpenAI streaming completion: model=${config.model}`);
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateOpenAiChatStream(response)));
}
