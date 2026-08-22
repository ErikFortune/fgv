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
 * Shared fixtures for the `streamingAdapters.*.test.ts` family — SSE stream
 * builders, `global.fetch` mocks, provider descriptors, and the common prompt.
 *
 * @remarks
 * Extracted when `streamingAdapters.test.ts` reached the 2000-line `max-lines`
 * cap. The builders encode each provider's wire shape, so they belong in one
 * place regardless of which adapter's tests consume them.
 */

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers (mirrors streamingClient.test.ts patterns)
// ============================================================================

function makeReadable(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    }
  });
}

export function mockSseResponse(chunks: ReadonlyArray<string>, status: number = 200): void {
  const body = makeReadable(chunks);
  const response = {
    ok: status >= 200 && status < 300,
    status,
    body,
    text: jest.fn().mockResolvedValue(''),
    headers: new Map([['content-type', 'text/event-stream']])
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

export async function collect(
  iter: AsyncIterable<AiAssist.IAiStreamEvent>
): Promise<AiAssist.IAiStreamEvent[]> {
  const out: AiAssist.IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}

/**
 * Mocks `global.fetch` to serve the supplied SSE chunks while capturing the
 * request body of the outbound call. Returns an accessor for the parsed body
 * so tests can assert on the constructed request shape.
 */
export function mockSseResponseCapturingBody(chunks: ReadonlyArray<string>): {
  getBody: () => Record<string, unknown> | undefined;
} {
  let capturedBody: Record<string, unknown> | undefined;
  (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
    const init = args[1] as RequestInit;
    capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;
    return Promise.resolve({
      ok: true,
      status: 200,
      body: makeReadable(chunks),
      text: jest.fn().mockResolvedValue(''),
      headers: new Map([['content-type', 'text/event-stream']])
    });
  });
  return { getBody: () => capturedBody };
}

// ============================================================================
// SSE body builders
// ============================================================================

/**
 * Builds an Anthropic SSE stream with a single tool_use block and optional text.
 */
export function anthropicToolUseSse(parts: {
  toolId: string;
  toolName: string;
  argChunks: ReadonlyArray<string>;
  textDeltas?: ReadonlyArray<string>;
  toolIndex?: number;
  textIndex?: number;
}): string[] {
  const { toolId, toolName, argChunks, textDeltas = [], toolIndex = 0, textIndex = 1 } = parts;
  const events: string[] = [];

  // tool_use block start
  events.push(
    `event: content_block_start\ndata: ${JSON.stringify({
      index: toolIndex,
      content_block: { type: 'tool_use', id: toolId, name: toolName }
    })}\n\n`
  );

  // tool args deltas
  for (const chunk of argChunks) {
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: toolIndex,
        delta: { type: 'input_json_delta', partial_json: chunk }
      })}\n\n`
    );
  }

  // tool_use block stop
  events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: toolIndex })}\n\n`);

  // optional text block
  if (textDeltas.length > 0) {
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        index: textIndex,
        content_block: { type: 'text' }
      })}\n\n`
    );
    for (const delta of textDeltas) {
      events.push(
        `event: content_block_delta\ndata: ${JSON.stringify({
          index: textIndex,
          delta: { type: 'text_delta', text: delta }
        })}\n\n`
      );
    }
    events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: textIndex })}\n\n`);
  }

  events.push(`event: message_stop\ndata: ${JSON.stringify({})}\n\n`);
  return events;
}

/**
 * Builds an Anthropic SSE stream with a thinking block.
 */
export function anthropicThinkingSse(parts: {
  thinkingChunks: ReadonlyArray<string>;
  signatureChunks: ReadonlyArray<string>;
  textDeltas?: ReadonlyArray<string>;
  thinkingIndex?: number;
  textIndex?: number;
}): string[] {
  const { thinkingChunks, signatureChunks, textDeltas = [], thinkingIndex = 0, textIndex = 1 } = parts;
  const events: string[] = [];

  // thinking block start
  events.push(
    `event: content_block_start\ndata: ${JSON.stringify({
      index: thinkingIndex,
      content_block: { type: 'thinking' }
    })}\n\n`
  );

  // thinking deltas
  for (const chunk of thinkingChunks) {
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: thinkingIndex,
        delta: { type: 'thinking_delta', thinking: chunk }
      })}\n\n`
    );
  }

  // signature deltas (CRITICAL E5: must be appended)
  for (const sig of signatureChunks) {
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: thinkingIndex,
        delta: { type: 'signature_delta', signature: sig }
      })}\n\n`
    );
  }

  events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: thinkingIndex })}\n\n`);

  // optional text block
  if (textDeltas.length > 0) {
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        index: textIndex,
        content_block: { type: 'text' }
      })}\n\n`
    );
    for (const delta of textDeltas) {
      events.push(
        `event: content_block_delta\ndata: ${JSON.stringify({
          index: textIndex,
          delta: { type: 'text_delta', text: delta }
        })}\n\n`
      );
    }
    events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: textIndex })}\n\n`);
  }

  events.push(`event: message_stop\ndata: ${JSON.stringify({})}\n\n`);
  return events;
}

/**
 * Builds an Anthropic SSE stream with a redacted_thinking block.
 */
export function anthropicRedactedThinkingSse(parts: {
  data: string;
  textDeltas?: ReadonlyArray<string>;
  redactedIndex?: number;
  textIndex?: number;
}): string[] {
  const { data, textDeltas = [], redactedIndex = 0, textIndex = 1 } = parts;
  const events: string[] = [];

  events.push(
    `event: content_block_start\ndata: ${JSON.stringify({
      index: redactedIndex,
      content_block: { type: 'redacted_thinking', data }
    })}\n\n`
  );
  events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: redactedIndex })}\n\n`);

  if (textDeltas.length > 0) {
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        index: textIndex,
        content_block: { type: 'text' }
      })}\n\n`
    );
    for (const delta of textDeltas) {
      events.push(
        `event: content_block_delta\ndata: ${JSON.stringify({
          index: textIndex,
          delta: { type: 'text_delta', text: delta }
        })}\n\n`
      );
    }
    events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: textIndex })}\n\n`);
  }

  events.push(`event: message_stop\ndata: ${JSON.stringify({})}\n\n`);
  return events;
}

/**
 * Builds an OpenAI Responses API SSE stream with a function_call item.
 *
 * Wire-shape note: the live Responses API uses two distinct identifiers per
 * function_call — the output-item id (`fc_*`, surfaced as `item.id` and the
 * `item_id` on subsequent argument events) and the call id (`call_*`, surfaced
 * as `item.call_id` and used in continuation input items). The
 * `function_call_arguments.{delta,done}` events carry **only** `item_id`; the
 * adapter must correlate `item_id` → `call_id` via the earlier
 * `response.output_item.added` event. The fixture mirrors that — if the test
 * caller does not supply an explicit `itemId`, it defaults to the `callId`
 * so the existing C2 tests keep their original ids.
 */
export function responsesApiFunctionCallSse(parts: {
  callId: string;
  name: string;
  argChunks: ReadonlyArray<string>;
  fullArgs?: string;
  textDeltas?: ReadonlyArray<string>;
  itemId?: string;
}): string[] {
  const { callId, name, argChunks, fullArgs, textDeltas = [], itemId = callId } = parts;
  const concatenated = argChunks.join('');
  const events: string[] = [];

  // function_call output item added: item.id is the item_id (fc_*); item.call_id is the call_id (call_*).
  events.push(
    `event: response.output_item.added\ndata: ${JSON.stringify({
      item: { type: 'function_call', id: itemId, call_id: callId, name }
    })}\n\n`
  );

  // arg delta events — keyed by item_id (the live wire shape).
  for (const chunk of argChunks) {
    events.push(
      `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
        item_id: itemId,
        delta: chunk
      })}\n\n`
    );
  }

  // args done event — keyed by item_id.
  events.push(
    `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
      item_id: itemId,
      arguments: fullArgs ?? concatenated
    })}\n\n`
  );

  // optional text deltas
  for (const delta of textDeltas) {
    events.push(`event: response.output_text.delta\ndata: ${JSON.stringify({ delta })}\n\n`);
  }

  events.push(
    `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
  );
  return events;
}

/**
 * Builds a Gemini SSE stream with functionCall parts.
 */
export function geminiFunctionCallSse(parts: {
  calls: ReadonlyArray<{ name: string; args: Record<string, unknown>; thoughtSignature?: string }>;
  textDeltas?: ReadonlyArray<string>;
  finishReason?: string;
}): string[] {
  const { calls, textDeltas = [], finishReason = 'STOP' } = parts;
  const events: string[] = [];

  // Build a single chunk with all functionCall parts (and optional text parts).
  // When a call carries a thoughtSignature, attach it as a part-level sibling of
  // functionCall (mirroring Gemini's thinking-enabled wire shape).
  const candidateParts: unknown[] = [];
  for (const call of calls) {
    candidateParts.push({
      functionCall: { name: call.name, args: call.args },
      ...(call.thoughtSignature !== undefined ? { thoughtSignature: call.thoughtSignature } : {})
    });
  }
  for (const delta of textDeltas) {
    candidateParts.push({ text: delta });
  }

  events.push(
    `data: ${JSON.stringify({
      candidates: [{ content: { parts: candidateParts }, finishReason }]
    })}\n\n`
  );
  return events;
}

// ============================================================================
// Provider descriptors for each format
// ============================================================================

export function makeAnthropicDescriptor(): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    buttonLabel: 'AI Assist | Anthropic',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional'
  };
}

export function makeOpenAiResponsesDescriptor(): IAiProviderDescriptor {
  return {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'AI Assist | OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional'
  };
}

export function makeGeminiDescriptor(): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Gemini',
    buttonLabel: 'AI Assist | Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-pro',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    thinkingMode: 'optional'
  };
}

export const TEST_PROMPT: AiAssist.AiPrompt = new AiAssist.AiPrompt('hello', 'system');
