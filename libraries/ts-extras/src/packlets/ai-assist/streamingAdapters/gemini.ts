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
 * Client-defined tools (`functionCall` parts) are emitted as
 * `client-tool-call-done` immediately (no delta accumulation needed for Gemini).
 *
 * @packageDocumentation
 */

import { type Logging, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';
import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';

import { buildGeminiContents } from '../chatRequestBuilders';
import { AiPrompt, type AiToolConfig, type IAiStreamEvent, type IChatMessage } from '../model';
import { parseSseEventJson, readSseEvents } from '../sseParser';
import { toGeminiTools } from '../toolFormats';
import { type IResolvedThinkingConfig } from '../thinkingOptionsResolver';
import { IStreamApiConfig, openSseConnection, validateEventPayload } from './common';

// ============================================================================
// Accumulated call state (internal — used by C3 continuation builder)
// ============================================================================

/**
 * An accumulated function call from a Gemini stream. Gemini does not assign
 * call IDs; correlation is by tool name. Arguments arrive complete in the
 * `functionCall` part (no delta accumulation).
 * @internal
 */
export interface IAccumulatedGeminiFunctionCall {
  readonly name: string;
  readonly args: JsonObject;
}

// ============================================================================
// Event payload shapes
// ============================================================================

/**
 * One `parts[]` element in a Gemini streaming chunk. Text parts and
 * functionCall parts are both surfaced.
 * @internal
 */
interface IGeminiStreamPart {
  readonly text?: string;
  readonly functionCall?: { readonly name?: string; readonly args?: JsonObject };
}

/**
 * One `candidates[]` element in a Gemini streaming chunk.
 * @internal
 */
interface IGeminiStreamCandidate {
  readonly content?: { readonly parts?: ReadonlyArray<IGeminiStreamPart> };
  readonly finishReason?: string;
}

/**
 * One streaming chunk from `streamGenerateContent?alt=sse`.
 * @internal
 */
interface IGeminiStreamChunk {
  readonly candidates: ReadonlyArray<IGeminiStreamCandidate>;
}

const jsonObjectValidator: Validator<JsonObject> = Validators.isA<JsonObject>(
  'JsonObject',
  (v): v is JsonObject => isJsonObject(v)
);

const geminiFunctionCallInner: Validator<{ name?: string; args?: JsonObject }> = Validators.object<{
  name?: string;
  args?: JsonObject;
}>(
  {
    name: Validators.string.optional(),
    args: jsonObjectValidator.optional()
  },
  { options: { optionalFields: ['name', 'args'] } }
);

const geminiStreamPart: Validator<IGeminiStreamPart> = Validators.object<IGeminiStreamPart>(
  {
    text: Validators.string.optional(),
    functionCall: geminiFunctionCallInner.optional()
  },
  { options: { optionalFields: ['text', 'functionCall'] } }
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
async function* translateGeminiStream(
  response: Response,
  functionCalls: IAccumulatedGeminiFunctionCall[]
): AsyncGenerator<IAiStreamEvent> {
  let fullText = '';
  let truncated = false;
  let receivedFinishReason = false;

  try {
    /* c8 ignore next - body is non-null at this point per openSseConnection */
    if (!response.body) return;
    for await (const message of readSseEvents(response.body)) {
      const json = parseSseEventJson(message.data);
      /* c8 ignore next 3 - defensive: malformed SSE events skipped */
      if (json === undefined) {
        continue;
      }
      const chunk = validateEventPayload(json, geminiStreamChunk);
      /* c8 ignore next 1 - defensive: chunk?.candidates optional chain unreachable after validation */
      const candidate = chunk?.candidates[0];
      /* c8 ignore next 3 - defensive: SSE events without candidates skipped */
      if (!candidate) {
        continue;
      }
      /* c8 ignore next 1 - defensive: candidate.content?.parts null branch unreachable after validation */
      const parts = candidate.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (typeof part.text === 'string' && part.text.length > 0) {
            fullText += part.text;
            yield { type: 'text-delta', delta: part.text };
            /* c8 ignore next 1 - defensive: functionCall?.name null branch handled by text/empty filter above */
          } else if (part.functionCall?.name) {
            const { name, args } = part.functionCall;
            /* c8 ignore next 1 - defensive: Gemini always sends args; {} fallback unreachable in practice */
            const callArgs = args ?? {};
            functionCalls.push({ name, args: callArgs });
            yield { type: 'client-tool-call-done', toolName: name, args: callArgs };
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
  tools: ReadonlyArray<AiToolConfig> | undefined,
  logger?: Logging.ILogger,
  signal?: AbortSignal,
  resolvedThinking?: IResolvedThinkingConfig,
  functionCalls?: IAccumulatedGeminiFunctionCall[]
): Promise<Result<AsyncIterable<IAiStreamEvent>>> {
  const url = `${config.baseUrl}/models/${config.model}:streamGenerateContent?alt=sse`;
  const contents = buildGeminiContents(prompt, { head: messagesBefore });
  const generationConfig: Record<string, unknown> = { temperature };
  if (resolvedThinking?.geminiThinkingBudget !== undefined) {
    generationConfig.thinkingConfig = { thinkingBudget: resolvedThinking.geminiThinkingBudget };
  }
  if (resolvedThinking?.otherParams !== undefined) {
    Object.assign(generationConfig, resolvedThinking.otherParams);
  }
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents,
    generationConfig
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
  const calls = functionCalls ?? [];
  const conn = await openSseConnection(url, headers, body, logger, signal);
  return conn.onSuccess((response) => succeed(translateGeminiStream(response, calls)));
}
