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
 * Streaming adapter for Gemini's `streamGenerateContent` endpoint. Gemini
 * emits no explicit tool-progress events even when `google_search` is
 * enabled — grounding metadata arrives attached to text chunks — so this
 * adapter never yields `tool-event`s.
 *
 * @packageDocumentation
 */

import { type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import { buildGeminiContents } from '../chatRequestBuilders';
import { AiPrompt, type AiServerToolConfig, type IAiStreamEvent, type IChatMessage } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { toGeminiTools } from '../toolFormats';
import { IStreamApiConfig, openSseConnection, validateEventPayload } from './common';

// ============================================================================
// Event payload shapes
// ============================================================================

/**
 * One `parts[]` element in a Gemini streaming chunk. Only `text` parts are
 * surfaced — non-text parts (e.g. function calls, inline data) are ignored.
 *
 * @internal
 */
interface IGeminiStreamPart {
  readonly text?: string;
}

/**
 * One `candidates[]` element in a Gemini streaming chunk. Both `content` and
 * `finishReason` are optional — text arrives in intermediate chunks,
 * finishReason in the terminal chunk.
 *
 * @internal
 */
interface IGeminiStreamCandidate {
  readonly content?: { readonly parts?: ReadonlyArray<IGeminiStreamPart> };
  readonly finishReason?: string;
}

/**
 * One streaming chunk from `streamGenerateContent?alt=sse`.
 *
 * @internal
 */
interface IGeminiStreamChunk {
  readonly candidates: ReadonlyArray<IGeminiStreamCandidate>;
}

const geminiStreamPart: Validator<IGeminiStreamPart> = Validators.object<IGeminiStreamPart>(
  { text: Validators.string.optional() },
  { options: { optionalFields: ['text'] } }
);

const geminiStreamContent: Validator<{ parts?: ReadonlyArray<IGeminiStreamPart> }> = Validators.object<{
  parts?: ReadonlyArray<IGeminiStreamPart>;
}>({ parts: Validators.arrayOf(geminiStreamPart).optional() }, { options: { optionalFields: ['parts'] } });

const geminiStreamCandidate: Validator<IGeminiStreamCandidate> = Validators.object<IGeminiStreamCandidate>(
  {
    content: geminiStreamContent.optional(),
    finishReason: Validators.string.optional()
  },
  { options: { optionalFields: ['content', 'finishReason'] } }
);

const geminiStreamChunk: Validator<IGeminiStreamChunk> = Validators.object<IGeminiStreamChunk>({
  candidates: Validators.arrayOf(geminiStreamCandidate)
});

// ============================================================================
// Stream translator
// ============================================================================

/**
 * Translates a Gemini streamGenerateContent SSE stream into unified events.
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
        /* c8 ignore start - defensive: malformed SSE events skipped */ continue;
      } /* c8 ignore stop */
      const chunk = validateEventPayload(json, geminiStreamChunk);
      /* c8 ignore next 1 - defensive: chunk?.candidates null branch unreachable after validation */
      const candidate = chunk?.candidates[0];
      if (!candidate) {
        /* c8 ignore start - defensive: SSE events without candidates skipped */ continue;
      } /* c8 ignore stop */
      /* c8 ignore next 1 - defensive: candidate.content?.parts null branch unreachable after validation */
      const parts = candidate.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (typeof part.text === 'string' && part.text.length > 0) {
            fullText += part.text;
            yield { type: 'text-delta', delta: part.text };
          }
        }
      }
      const finishReason = candidate.finishReason;
      if (typeof finishReason === 'string' && finishReason.length > 0) {
        truncated = finishReason === 'MAX_TOKENS';
        receivedFinishReason = true;
      }
    }
  } catch (err: unknown) /* c8 ignore start - defensive: stream errors are always Error instances */ {
    yield { type: 'error', message: err instanceof Error ? err.message : String(err) };
    return;
  } /* c8 ignore stop */

  if (receivedFinishReason) {
    yield { type: 'done', truncated, fullText };
  } else {
    yield { type: 'error', message: 'Gemini stream ended without a finishReason' };
  }
}

// ============================================================================
// Per-format request caller
// ============================================================================

/**
 * Issues a streaming Gemini request and returns the unified-event iterable
 * on success.
 *
 * @internal
 */
export async function callGeminiStream(
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
  /* c8 ignore next 3 - tools branch not exercised in streaming tests */
  if (tools && tools.length > 0) {
    body.tools = toGeminiTools(tools);
  }
  const headers: Record<string, string> = { 'x-goog-api-key': config.apiKey };
  /* c8 ignore next 4 - optional logger diagnostic output */
  if (logger) {
    const toolTypes = tools && tools.length > 0 ? tools.map((t) => t.type).join(',') : 'none';
    logger.info(`Gemini streaming: model=${config.model}, tools=${toolTypes}`);
  }
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateGeminiStream(response)));
}
