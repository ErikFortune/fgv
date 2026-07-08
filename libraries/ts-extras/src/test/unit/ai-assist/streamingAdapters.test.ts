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
 * Tests for C2 streaming adapter extensions:
 * - Anthropic: thinking/redacted_thinking/tool_use block accumulation
 * - OpenAI Responses: function_call accumulation
 * - Gemini: functionCall part emission
 */

import '@fgv/ts-utils-jest';

import { Logging } from '@fgv/ts-utils';
import { AiAssist } from '../../..';
import type { JsonArray, JsonObject } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedBlock } from '../../../packlets/ai-assist/streamingAdapters/anthropic';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedFunctionCall } from '../../../packlets/ai-assist/streamingAdapters/openaiResponses';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedGeminiFunctionCall } from '../../../packlets/ai-assist/streamingAdapters/gemini';
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

function mockSseResponse(chunks: ReadonlyArray<string>, status: number = 200): void {
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

async function collect(iter: AsyncIterable<AiAssist.IAiStreamEvent>): Promise<AiAssist.IAiStreamEvent[]> {
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
function mockSseResponseCapturingBody(chunks: ReadonlyArray<string>): {
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
function anthropicToolUseSse(parts: {
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
function anthropicThinkingSse(parts: {
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
function anthropicRedactedThinkingSse(parts: {
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
function responsesApiFunctionCallSse(parts: {
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
function geminiFunctionCallSse(parts: {
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

function makeAnthropicDescriptor(): IAiProviderDescriptor {
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

function makeOpenAiResponsesDescriptor(): IAiProviderDescriptor {
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

function makeGeminiDescriptor(): IAiProviderDescriptor {
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

const TEST_PROMPT = new AiAssist.AiPrompt('hello', 'system');

// ============================================================================
// Tests — Anthropic streaming adapter (C2)
// ============================================================================

describe('Anthropic streaming adapter — C2 client tool extensions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('emits client-tool-call-start then client-tool-call-done for a tool_use block', async () => {
    const sseChunks = anthropicToolUseSse({
      toolId: 'tool_abc123',
      toolName: 'get_weather',
      argChunks: ['{"loc', 'ation": "Seattle"}']
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const start = events.find((e) => e.type === 'client-tool-call-start') as
      | AiAssist.IAiStreamToolUseStart
      | undefined;
    expect(start).toBeDefined();
    expect(start?.toolName).toBe('get_weather');
    expect(start?.callId).toBe('tool_abc123');

    const done = events.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done).toBeDefined();
    expect(done?.toolName).toBe('get_weather');
    expect(done?.callId).toBe('tool_abc123');
    expect(done?.args).toEqual({ location: 'Seattle' });

    expect(events[events.length - 1].type).toBe('done');
  });

  test('accumulates input_json_delta chunks before emitting client-tool-call-done', async () => {
    // args arrive across three separate chunks
    const sseChunks = anthropicToolUseSse({
      toolId: 'tool_xyz',
      toolName: 'search',
      argChunks: ['{"q', 'uer', 'y": "pasta"}']
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const done = events.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done?.args).toEqual({ query: 'pasta' });
  });

  test('handles multiple parallel tool_use blocks at different SSE indices', async () => {
    const events: string[] = [];

    // Two tool_use blocks at indices 0 and 1, interleaved
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        index: 0,
        content_block: { type: 'tool_use', id: 'call_1', name: 'tool_a' }
      })}\n\n`
    );
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        index: 1,
        content_block: { type: 'tool_use', id: 'call_2', name: 'tool_b' }
      })}\n\n`
    );
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{"x":1}' }
      })}\n\n`
    );
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 1,
        delta: { type: 'input_json_delta', partial_json: '{"y":2}' }
      })}\n\n`
    );
    events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`);
    events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: 1 })}\n\n`);
    events.push(`event: message_stop\ndata: ${JSON.stringify({})}\n\n`);

    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const emitted = await collect(result.value);

    const starts = emitted.filter(
      (e) => e.type === 'client-tool-call-start'
    ) as AiAssist.IAiStreamToolUseStart[];
    expect(starts).toHaveLength(2);
    expect(starts.map((s) => s.toolName).sort()).toEqual(['tool_a', 'tool_b']);

    const dones = emitted.filter(
      (e) => e.type === 'client-tool-call-done'
    ) as AiAssist.IAiStreamToolUseDelta[];
    expect(dones).toHaveLength(2);

    const doneA = dones.find((d) => d.toolName === 'tool_a');
    expect(doneA?.args).toEqual({ x: 1 });
    const doneB = dones.find((d) => d.toolName === 'tool_b');
    expect(doneB?.args).toEqual({ y: 2 });
  });

  test('accumulates thinking_delta chunks into the thinking block', async () => {
    const sseChunks = anthropicThinkingSse({
      thinkingChunks: ['Let me thi', 'nk about this...'],
      signatureChunks: ['sig=='],
      textDeltas: ['The answer is 42.']
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    // Text delta from the text block should be present
    const textDelta = events.find((e) => e.type === 'text-delta') as AiAssist.IAiStreamTextDelta | undefined;
    expect(textDelta?.delta).toBe('The answer is 42.');

    // Done event should include the accumulated text
    const done = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(done.type).toBe('done');
    expect(done.fullText).toBe('The answer is 42.');
  });

  test('accumulates signature_delta deltas by concatenation, not overwrite (E5 regression)', async () => {
    // The signature arrives across THREE separate delta events.
    // If the code did block.signature = delta.signature (overwrite) instead of +=,
    // the accumulated block would only contain the last chunk.
    // This test passes an accumulation buffer in, then reads it back to verify the full signature.
    const accBuffer = new Map<number, IAccumulatedBlock>();

    const sseChunks = anthropicThinkingSse({
      thinkingChunks: ['thought'],
      signatureChunks: ['PART_A_', 'PART_B_', 'PART_C'],
      textDeltas: ['ok']
    });
    mockSseResponse(sseChunks);

    // We call the high-level API but we can't pass accumulationBuffer directly through it.
    // Instead, use a separate approach: call via the low-level adapter function.
    // Since the buffer is internal, we test correctness via the adapter directly.

    const { callAnthropicStream } = await import('../../../packlets/ai-assist/streamingAdapters/anthropic');

    const streamConfig = {
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: 'sk-test'
    };

    const streamResult = await callAnthropicStream(
      streamConfig,
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      accBuffer
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    // Verify the thinking block in the accumulation buffer has the CONCATENATED signature
    const thinkingBlock = accBuffer.get(0);
    expect(thinkingBlock?.type).toBe('thinking');
    if (thinkingBlock?.type === 'thinking') {
      expect(thinkingBlock.thinking).toBe('thought');
      // If signature were overwritten each time, we'd get 'PART_C' only.
      // Correct append behaviour yields the full concatenation.
      expect(thinkingBlock.signature).toBe('PART_A_PART_B_PART_C');
    }
  });

  test('passes redacted_thinking block through to the accumulation buffer unchanged', async () => {
    const accBuffer = new Map<number, IAccumulatedBlock>();
    const opaqueData = 'REDACTED_BASE64_DATA_OPAQUE_BLOB';

    const sseChunks = anthropicRedactedThinkingSse({
      data: opaqueData,
      textDeltas: ['Answer here.']
    });
    mockSseResponse(sseChunks);

    const { callAnthropicStream } = await import('../../../packlets/ai-assist/streamingAdapters/anthropic');

    const streamConfig = {
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: 'sk-test'
    };

    const streamResult = await callAnthropicStream(
      streamConfig,
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      accBuffer
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    const redactedBlock = accBuffer.get(0);
    expect(redactedBlock?.type).toBe('redacted_thinking');
    if (redactedBlock?.type === 'redacted_thinking') {
      expect(redactedBlock.data).toBe(opaqueData);
    }
  });

  test('preserves interleaved thinking + tool_use at correct buffer indices', async () => {
    const accBuffer = new Map<number, IAccumulatedBlock>();
    const events: string[] = [];

    // index 0: thinking block
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        index: 0,
        content_block: { type: 'thinking' }
      })}\n\n`
    );
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 0,
        delta: { type: 'thinking_delta', thinking: 'I should call the tool.' }
      })}\n\n`
    );
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 0,
        delta: { type: 'signature_delta', signature: 'SIG123' }
      })}\n\n`
    );
    events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`);

    // index 1: tool_use block
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        index: 1,
        content_block: { type: 'tool_use', id: 'call_99', name: 'do_thing' }
      })}\n\n`
    );
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 1,
        delta: { type: 'input_json_delta', partial_json: '{"k":"v"}' }
      })}\n\n`
    );
    events.push(`event: content_block_stop\ndata: ${JSON.stringify({ index: 1 })}\n\n`);
    events.push(`event: message_stop\ndata: ${JSON.stringify({})}\n\n`);

    mockSseResponse(events);

    const { callAnthropicStream } = await import('../../../packlets/ai-assist/streamingAdapters/anthropic');

    const streamConfig = {
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: 'sk-test'
    };

    const streamResult = await callAnthropicStream(
      streamConfig,
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      accBuffer
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    const emitted = await collect(streamResult.value);

    // Buffer must contain both blocks at their respective indices
    expect(accBuffer.size).toBe(2);
    const thinkBlock = accBuffer.get(0);
    expect(thinkBlock?.type).toBe('thinking');
    if (thinkBlock?.type === 'thinking') {
      expect(thinkBlock.thinking).toBe('I should call the tool.');
      expect(thinkBlock.signature).toBe('SIG123');
    }

    const toolBlock = accBuffer.get(1);
    expect(toolBlock?.type).toBe('tool_use');
    if (toolBlock?.type === 'tool_use') {
      expect(toolBlock.name).toBe('do_thing');
      expect(toolBlock.id).toBe('call_99');
      expect(toolBlock.argsBuffer).toBe('{"k":"v"}');
    }

    // client-tool-call-start and done should both appear in the event stream
    const start = emitted.find((e) => e.type === 'client-tool-call-start') as
      | AiAssist.IAiStreamToolUseStart
      | undefined;
    expect(start?.toolName).toBe('do_thing');

    const done = emitted.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done?.args).toEqual({ k: 'v' });
  });

  test('emits done event and text delta alongside tool_use block', async () => {
    const sseChunks = anthropicToolUseSse({
      toolId: 'call_text',
      toolName: 'fetch_data',
      argChunks: ['{"url":"http://example.com"}'],
      textDeltas: ['Here is the result.'],
      toolIndex: 0,
      textIndex: 1
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const types = events.map((e) => e.type);
    expect(types).toContain('client-tool-call-start');
    expect(types).toContain('client-tool-call-done');
    expect(types).toContain('text-delta');
    expect(types[types.length - 1]).toBe('done');
  });

  // --------------------------------------------------------------------------
  // Orphaned tool_use block: a tool_use content_block_start missing a usable id
  // and/or name must NOT be silently dropped. The id is the sole correlation key
  // for the follow-up tool_result; a silent drop (and the subsequent silent
  // ignore of its input_json_delta chunks) is the path that leaves the harness
  // without a clean id and corrupts the continuation. The adapter must surface it
  // loudly (logger.warn with the stable MALFORMED_TOOL_USE_WARN_TAG prefix) and
  // issue no client tool call for the block.
  // --------------------------------------------------------------------------

  async function runOrphanedToolUse(
    contentBlock: JsonObject,
    logger?: Logging.InMemoryLogger
  ): Promise<{ emitted: AiAssist.IAiStreamEvent[]; accBuffer: Map<number, IAccumulatedBlock> }> {
    const accBuffer = new Map<number, IAccumulatedBlock>();
    mockSseResponse([
      `event: content_block_start\ndata: ${JSON.stringify({ index: 0, content_block: contentBlock })}\n\n`,
      // A delta for the orphaned index must be harmlessly ignored (no buffer entry to attach to).
      `event: content_block_delta\ndata: ${JSON.stringify({
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{"q":"v"}' }
      })}\n\n`,
      `event: content_block_stop\ndata: ${JSON.stringify({ index: 0 })}\n\n`,
      `event: message_stop\ndata: ${JSON.stringify({})}\n\n`
    ]);
    const { callAnthropicStream } = await import('../../../packlets/ai-assist/streamingAdapters/anthropic');
    const streamResult = await callAnthropicStream(
      { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022', apiKey: 'sk-test' },
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      logger,
      undefined,
      undefined,
      accBuffer
    );
    expect(streamResult).toSucceed();
    const emitted = streamResult.isSuccess() ? await collect(streamResult.value) : [];
    // The orphaned block issues no tool call and leaves no buffer entry.
    expect(emitted.some((e) => e.type === 'client-tool-call-start')).toBe(false);
    expect(emitted.some((e) => e.type === 'client-tool-call-done')).toBe(false);
    expect(accBuffer.size).toBe(0);
    return { emitted, accBuffer };
  }

  test('surfaces (not drops) a tool_use content_block_start missing its name', async () => {
    const logger = new Logging.InMemoryLogger('all');
    await runOrphanedToolUse({ type: 'tool_use', id: 'toolu_x' }, logger);
    const warned = logger.logged.find((m) => m.includes('ai-assist:malformed-tool-use'));
    expect(warned).toBeDefined();
    expect(warned).toMatch(/missing a usable id and\/or name/i);
  });

  test('surfaces (not drops) a tool_use content_block_start missing its id', async () => {
    const logger = new Logging.InMemoryLogger('all');
    await runOrphanedToolUse({ type: 'tool_use', name: 'do_thing' }, logger);
    expect(logger.logged.some((m) => m.includes('ai-assist:malformed-tool-use'))).toBe(true);
  });

  test('surfaces (not drops) a tool_use content_block_start with an empty-string id', async () => {
    // Empty string is a *bad* id, not a present one. Guards the contract against a
    // future refactor to `id !== undefined` that would reintroduce the malformed-id bug.
    const logger = new Logging.InMemoryLogger('all');
    await runOrphanedToolUse({ type: 'tool_use', id: '', name: 'do_thing' }, logger);
    expect(logger.logged.some((m) => m.includes('ai-assist:malformed-tool-use'))).toBe(true);
  });

  test('orphaned tool_use block is handled without a logger (no throw, no tool call)', async () => {
    // No logger supplied — covers the logger?. undefined branch; must not throw.
    await runOrphanedToolUse({ type: 'tool_use', id: 'toolu_x' });
  });

  test('appends continuationMessages as rawTail after the prompt user message (C4)', async () => {
    // Verify that continuation messages (complex JsonObject[] with thinking blocks) are
    // appended to the messages array AFTER the user message, not before. This is the C4
    // addition that enables the multi-turn continuation scenario.
    const continuationMessages: ReadonlyArray<JsonObject> = [
      {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'thought', signature: 'sig' },
          { type: 'tool_use', id: 'call_1', name: 'recall_memory', input: { key: 'display-mode' } }
        ] as JsonArray
      },
      {
        role: 'user',
        content: [
          // eslint-disable-next-line @typescript-eslint/naming-convention
          { type: 'tool_result', tool_use_id: 'call_1', content: 'dark mode' }
        ] as JsonArray
      }
    ];

    let capturedBody: Record<string, unknown> | undefined;
    const encoder = new TextEncoder();
    (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
      const init = args[1] as RequestInit;
      capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;
      const body = new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          // Minimal valid Anthropic SSE stream.
          controller.enqueue(
            encoder.encode(
              'event: content_block_start\ndata: ' +
                JSON.stringify({ index: 0, content_block: { type: 'text' } }) +
                '\n\n'
            )
          );
          controller.enqueue(
            encoder.encode(
              'event: content_block_delta\ndata: ' +
                JSON.stringify({
                  index: 0,
                  delta: { type: 'text_delta', text: 'follow-up answer' }
                }) +
                '\n\n'
            )
          );
          controller.enqueue(
            encoder.encode('event: content_block_stop\ndata: ' + JSON.stringify({ index: 0 }) + '\n\n')
          );
          controller.enqueue(encoder.encode('event: message_stop\ndata: ' + JSON.stringify({}) + '\n\n'));
          controller.close();
        }
      });
      return Promise.resolve({
        ok: true,
        status: 200,
        body,
        text: jest.fn().mockResolvedValue(''),
        headers: new Map([['content-type', 'text/event-stream']])
      });
    });

    const { callAnthropicStream } = await import('../../../packlets/ai-assist/streamingAdapters/anthropic');

    const streamConfig = {
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-7-sonnet-20250219',
      apiKey: 'sk-test'
    };

    const streamResult = await callAnthropicStream(
      streamConfig,
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      continuationMessages
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    // Verify the continuation messages appear AFTER the user message in the request body.
    expect(capturedBody).toBeDefined();
    const messages = capturedBody?.messages as Array<{ role: string; content: unknown }>;
    expect(messages).toBeDefined();

    // messages should be: [{ role: 'user', content: 'hello' }, ...continuationMessages]
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
    expect(messages[2].role).toBe('user');
    expect(messages).toHaveLength(3);
  });
});

// ============================================================================
// Tests — OpenAI Responses API streaming adapter (C2)
// ============================================================================

describe('OpenAI Responses API streaming adapter — C2 client tool extensions', () => {
  const originalFetch = global.fetch;
  const tools: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('emits client-tool-call-start then client-tool-call-done for a function_call', async () => {
    const sseChunks = responsesApiFunctionCallSse({
      callId: 'fc_123',
      name: 'get_weather',
      argChunks: ['{"city":', '"Portland"}'],
      fullArgs: '{"city":"Portland"}'
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const start = events.find((e) => e.type === 'client-tool-call-start') as
      | AiAssist.IAiStreamToolUseStart
      | undefined;
    expect(start?.toolName).toBe('get_weather');
    expect(start?.callId).toBe('fc_123');

    const done = events.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done?.toolName).toBe('get_weather');
    expect(done?.callId).toBe('fc_123');
    expect(done?.args).toEqual({ city: 'Portland' });

    expect(events[events.length - 1].type).toBe('done');
  });

  test('accumulates function_call_arguments.delta chunks before emitting done', async () => {
    const sseChunks = responsesApiFunctionCallSse({
      callId: 'fc_456',
      name: 'search',
      argChunks: ['{"q', '":"rust', ' lang"}'],
      fullArgs: '{"q":"rust lang"}'
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const done = events.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done?.args).toEqual({ q: 'rust lang' });
  });

  test('handles multiple parallel function_calls by call_id', async () => {
    const events: string[] = [];

    // Two function_call output items
    events.push(
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'function_call', id: 'fc_A', call_id: 'fc_A', name: 'tool_a' }
      })}\n\n`
    );
    events.push(
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'function_call', id: 'fc_B', call_id: 'fc_B', name: 'tool_b' }
      })}\n\n`
    );

    // Args deltas for fc_A — keyed by item_id (matches the live wire shape).
    events.push(
      `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
        item_id: 'fc_A',
        delta: '{"p":1}'
      })}\n\n`
    );

    // Args deltas for fc_B
    events.push(
      `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
        item_id: 'fc_B',
        delta: '{"q":2}'
      })}\n\n`
    );

    // Done for fc_A
    events.push(
      `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
        item_id: 'fc_A',
        arguments: '{"p":1}'
      })}\n\n`
    );

    // Done for fc_B
    events.push(
      `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
        item_id: 'fc_B',
        arguments: '{"q":2}'
      })}\n\n`
    );

    events.push(
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    );

    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const emitted = await collect(result.value);

    const starts = emitted.filter(
      (e) => e.type === 'client-tool-call-start'
    ) as AiAssist.IAiStreamToolUseStart[];
    expect(starts).toHaveLength(2);
    expect(starts.map((s) => s.toolName).sort()).toEqual(['tool_a', 'tool_b']);

    const dones = emitted.filter(
      (e) => e.type === 'client-tool-call-done'
    ) as AiAssist.IAiStreamToolUseDelta[];
    expect(dones).toHaveLength(2);

    const doneA = dones.find((d) => d.toolName === 'tool_a');
    expect(doneA?.args).toEqual({ p: 1 });
    const doneB = dones.find((d) => d.toolName === 'tool_b');
    expect(doneB?.args).toEqual({ q: 2 });
  });

  test('function_call accumulation buffer is accessible via low-level callOpenAiResponsesStream', async () => {
    const callMap = new Map<string, IAccumulatedFunctionCall>();
    const sseChunks = responsesApiFunctionCallSse({
      callId: 'fc_buf',
      name: 'buffered_tool',
      argChunks: ['{"a":', '"b"}'],
      fullArgs: '{"a":"b"}'
    });
    mockSseResponse(sseChunks);

    const { callOpenAiResponsesStream } = await import(
      '../../../packlets/ai-assist/streamingAdapters/openaiResponses'
    );

    const streamConfig = {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      apiKey: 'sk-test'
    };

    const webSearchTools: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];
    const streamResult = await callOpenAiResponsesStream(
      streamConfig,
      TEST_PROMPT,
      webSearchTools,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      callMap
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    // The function call should be recorded in the passed-in map
    const entry = callMap.get('fc_buf');
    expect(entry).toBeDefined();
    expect(entry?.name).toBe('buffered_tool');
    // argsBuffer reflects the canonical .done arguments, not merely the concatenated deltas
    expect(entry?.argsBuffer).toBe('{"a":"b"}');
  });

  test('.done event canonical arguments override partial/empty delta buffer in argsBuffer', async () => {
    // Scenario: no delta events arrive (or deltas are empty) but the .done event carries the
    // full argument string. The continuation builder must use the .done-supplied arguments,
    // not the (empty) accumulated delta buffer.
    const callMap = new Map<string, IAccumulatedFunctionCall>();

    // Construct an SSE stream with NO delta chunks but a full .done arguments payload.
    const sseChunks: string[] = [
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'function_call', id: 'fc_nodelta', call_id: 'fc_nodelta', name: 'nodelta_tool' }
      })}\n\n`,
      // No function_call_arguments.delta events — provider delivered nothing before .done.
      // .done is keyed by item_id, matching the live wire shape.
      `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
        item_id: 'fc_nodelta',
        arguments: '{"answer":42}'
      })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const { callOpenAiResponsesStream } = await import(
      '../../../packlets/ai-assist/streamingAdapters/openaiResponses'
    );

    const streamConfig = {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      apiKey: 'sk-test'
    };

    const streamResult = await callOpenAiResponsesStream(
      streamConfig,
      TEST_PROMPT,
      [{ type: 'web_search' }],
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      callMap
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    const emitted = await collect(streamResult.value);

    // The client-tool-call-done event must carry the .done-supplied args, not empty object
    const done = emitted.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done?.toolName).toBe('nodelta_tool');
    expect(done?.args).toEqual({ answer: 42 });

    // The continuation builder entry must also reflect the .done arguments
    const entry = callMap.get('fc_nodelta');
    expect(entry).toBeDefined();
    expect(entry?.argsBuffer).toBe('{"answer":42}');
  });

  test('surfaces incompleteReason on the done event when status is incomplete', async () => {
    const sseChunks: string[] = [
      `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: 'partial' })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({
        response: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }
      })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const done = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(done.type).toBe('done');
    expect(done.truncated).toBe(true);
    expect(done.incompleteReason).toBe('max_output_tokens');
  });

  test('leaves incompleteReason undefined on a normally completed response', async () => {
    const sseChunks: string[] = [
      `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: 'all done' })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const done = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(done.type).toBe('done');
    expect(done.truncated).toBe(false);
    expect(done.incompleteReason).toBeUndefined();
  });

  test('does not leak incompleteReason when status is not incomplete but details are present', async () => {
    // Defensive: a provider should never send incomplete_details on a completed payload,
    // but if it does, the reason must not leak through (contract: meaningful only when truncated).
    const sseChunks: string[] = [
      `event: response.completed\ndata: ${JSON.stringify({
        response: { status: 'completed', incomplete_details: { reason: 'max_output_tokens' } }
      })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const done = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(done.type).toBe('done');
    expect(done.truncated).toBe(false);
    expect(done.incompleteReason).toBeUndefined();
  });

  test('clears a stale incompleteReason if a later completed event reports not-incomplete', async () => {
    // Defensive: the Responses API sends exactly one completed event, but if a duplicate
    // arrived (first incomplete, then completed), truncated and incompleteReason must move
    // together so the done event never reports truncated:false with a stale reason.
    const sseChunks: string[] = [
      `event: response.completed\ndata: ${JSON.stringify({
        response: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }
      })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const done = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(done.type).toBe('done');
    expect(done.truncated).toBe(false);
    expect(done.incompleteReason).toBeUndefined();
  });

  test('leaves incompleteReason undefined when status is incomplete but no details are present', async () => {
    const sseChunks: string[] = [
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'incomplete' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const done = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(done.type).toBe('done');
    expect(done.truncated).toBe(true);
    expect(done.incompleteReason).toBeUndefined();
  });

  // ========================================================================
  // Reasoning-model wire-shape tests
  // ========================================================================
  //
  // Live OpenAI / xAI captures (2026-06) showed reasoning-capable models emit
  // a leading reasoning output_item.{added,done} pair before the function_call
  // item, AND the subsequent function_call_arguments.{delta,done} events are
  // keyed by `item_id` (the fc_*/output-item id) rather than `call_id` (the
  // call_*/continuation id). The adapter must:
  //   1. Skip reasoning items without yielding events for them (reasoning
  //      content is discarded by design — separate `ai-assist-thinking-events`
  //      follow-up stream owns surfacing reasoning to callers).
  //   2. Correlate item_id → call_id via the function_call output_item.added
  //      event so the arg-accumulation handlers can resolve the call.
  //
  // These tests assert the actual IAiStreamEvent sequence produced from
  // realistic SSE fixtures that mirror live captures — per the L37 reference
  // observation, tests must verify emitted events from real wire shapes,
  // not call success.

  test('reasoning models: skips leading reasoning items and correctly correlates item_id → call_id for function calls', async () => {
    // Mirrors the live OpenAI gpt-5.1 capture: reasoning item added+done, then
    // function_call output_item.added with item.id !== item.call_id, then
    // arguments.{delta,done} events carrying only item_id.
    const reasoningItemId = 'rs_0bc550c3652817eb006a2258f29810819b8547b089f4772919';
    const fcItemId = 'fc_0352bf740c76b6d0006a22591d70c0819b8124c7544b233685';
    const fcCallId = 'call_m3NwZgvp5ZHRgtV3EHYHqIJX';
    const sseChunks: string[] = [
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'reasoning', id: reasoningItemId, content: [], summary: [] }
      })}\n\n`,
      `event: response.output_item.done\ndata: ${JSON.stringify({
        item: { type: 'reasoning', id: reasoningItemId, content: [], summary: [] }
      })}\n\n`,
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: {
          type: 'function_call',
          id: fcItemId,
          call_id: fcCallId,
          name: 'recall_memory',
          status: 'in_progress',
          arguments: ''
        }
      })}\n\n`,
      `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
        item_id: fcItemId,
        delta: '{"key":'
      })}\n\n`,
      `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
        item_id: fcItemId,
        delta: '"display-mode"}'
      })}\n\n`,
      `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
        item_id: fcItemId,
        arguments: '{"key":"display-mode"}'
      })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    // No events should fire for the reasoning item (discarded by design).
    const start = events.find((e) => e.type === 'client-tool-call-start') as
      | AiAssist.IAiStreamToolUseStart
      | undefined;
    expect(start?.toolName).toBe('recall_memory');
    // client-tool-call-start carries the call_id (continuation id), NOT the item_id.
    expect(start?.callId).toBe(fcCallId);

    const done = events.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done?.toolName).toBe('recall_memory');
    // Critical: done.callId is the call_* id even though the delta/done SSE events
    // carry only item_id — adapter correlates them.
    expect(done?.callId).toBe(fcCallId);
    expect(done?.args).toEqual({ key: 'display-mode' });

    const doneEvent = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(doneEvent.type).toBe('done');
    expect(doneEvent.truncated).toBe(false);
  });

  test('reasoning models: text-delta events still fire when the model produces a final answer', async () => {
    // Mirrors the simple gpt-5.1 capture: reasoning item, then a message item with text deltas.
    const sseChunks: string[] = [
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'reasoning', id: 'rs_1', content: [], summary: [] }
      })}\n\n`,
      `event: response.output_item.done\ndata: ${JSON.stringify({
        item: { type: 'reasoning', id: 'rs_1', content: [], summary: [] }
      })}\n\n`,
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'message', id: 'msg_1', role: 'assistant', status: 'in_progress' }
      })}\n\n`,
      `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: 'Hi' })}\n\n`,
      `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: ' there.' })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const textDeltas = events.filter((e) => e.type === 'text-delta');
    expect(textDeltas).toHaveLength(2);
    expect((textDeltas[0] as AiAssist.IAiStreamTextDelta).delta).toBe('Hi');
    expect((textDeltas[1] as AiAssist.IAiStreamTextDelta).delta).toBe(' there.');

    const doneEvent = events[events.length - 1] as AiAssist.IAiStreamDone;
    expect(doneEvent.fullText).toBe('Hi there.');
  });

  test('reasoning models: reasoning_summary_* events from xAI/grok are ignored without disrupting downstream function-call flow', async () => {
    // Mirrors the live xAI grok-4.3 capture: reasoning_summary text streams while the
    // reasoning item is open, then a function_call follows.
    const reasoningId = 'rs_82d9f851-a8e0-4054-b2b0-4ceb5e1d077e';
    const fcItemId = 'fc_82d9f851-a8e0-4054-b2b0-4ceb5e1d077e_0';
    const fcCallId = 'call-f3e96b46-b07a-484e-b1c6-426e37271e79-0';
    const sseChunks: string[] = [
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: { type: 'reasoning', id: reasoningId, summary: [], status: 'in_progress' }
      })}\n\n`,
      `event: response.reasoning_summary_part.added\ndata: ${JSON.stringify({
        item_id: reasoningId,
        part: { type: 'summary_text', text: '' }
      })}\n\n`,
      `event: response.reasoning_summary_text.delta\ndata: ${JSON.stringify({
        item_id: reasoningId,
        delta: 'Thinking about preferences...'
      })}\n\n`,
      `event: response.reasoning_summary_text.done\ndata: ${JSON.stringify({
        item_id: reasoningId,
        text: 'Thinking about preferences...'
      })}\n\n`,
      `event: response.reasoning_summary_part.done\ndata: ${JSON.stringify({
        item_id: reasoningId
      })}\n\n`,
      `event: response.output_item.done\ndata: ${JSON.stringify({
        item: { type: 'reasoning', id: reasoningId, status: 'completed' }
      })}\n\n`,
      `event: response.output_item.added\ndata: ${JSON.stringify({
        item: {
          type: 'function_call',
          id: fcItemId,
          call_id: fcCallId,
          name: 'recall_memory',
          status: 'in_progress',
          arguments: ''
        }
      })}\n\n`,
      `event: response.function_call_arguments.delta\ndata: ${JSON.stringify({
        item_id: fcItemId,
        delta: '{"key":"display-mode"}'
      })}\n\n`,
      `event: response.function_call_arguments.done\ndata: ${JSON.stringify({
        item_id: fcItemId,
        arguments: '{"key":"display-mode"}'
      })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
    ];
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    // No text-delta events for reasoning summary content (reasoning is discarded).
    expect(events.some((e) => e.type === 'text-delta')).toBe(false);

    // Function-call flow still surfaces correctly after the reasoning items.
    const done = events.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done?.toolName).toBe('recall_memory');
    expect(done?.callId).toBe(fcCallId);
    expect(done?.args).toEqual({ key: 'display-mode' });
  });
});

// ============================================================================
// Tests — Gemini streaming adapter (C2)
// ============================================================================

describe('Gemini streaming adapter — C2 client tool extensions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('emits client-tool-call-done immediately for a functionCall part (no accumulation)', async () => {
    const sseChunks = geminiFunctionCallSse({
      calls: [{ name: 'get_weather', args: { location: 'Seattle' } }]
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeGeminiDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    // Gemini does NOT emit client-tool-call-start — only client-tool-call-done
    const starts = events.filter((e) => e.type === 'client-tool-call-start');
    expect(starts).toHaveLength(0);

    const done = events.find((e) => e.type === 'client-tool-call-done') as
      | AiAssist.IAiStreamToolUseDelta
      | undefined;
    expect(done).toBeDefined();
    expect(done?.toolName).toBe('get_weather');
    expect(done?.args).toEqual({ location: 'Seattle' });

    expect(events[events.length - 1].type).toBe('done');
  });

  test('emits multiple client-tool-call-done events for multiple functionCall parts in one chunk', async () => {
    const sseChunks = geminiFunctionCallSse({
      calls: [
        { name: 'tool_a', args: { x: 1 } },
        { name: 'tool_b', args: { y: 2 } }
      ]
    });
    mockSseResponse(sseChunks);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeGeminiDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const events = await collect(result.value);

    const dones = events.filter(
      (e) => e.type === 'client-tool-call-done'
    ) as AiAssist.IAiStreamToolUseDelta[];
    expect(dones).toHaveLength(2);
    expect(dones.map((d) => d.toolName).sort()).toEqual(['tool_a', 'tool_b']);
    expect(dones.find((d) => d.toolName === 'tool_a')?.args).toEqual({ x: 1 });
    expect(dones.find((d) => d.toolName === 'tool_b')?.args).toEqual({ y: 2 });
  });

  // Runs a Gemini stream over the given functionCall parts and returns the
  // populated accumulation buffer. Shared by the accumulation assertions below.
  async function accumulateGeminiCalls(
    calls: ReadonlyArray<{ name: string; args: Record<string, unknown>; thoughtSignature?: string }>
  ): Promise<IAccumulatedGeminiFunctionCall[]> {
    const { callGeminiStream } = await import('../../../packlets/ai-assist/streamingAdapters/gemini');
    mockSseResponse(geminiFunctionCallSse({ calls }));
    const functionCalls: IAccumulatedGeminiFunctionCall[] = [];
    const streamResult = await callGeminiStream(
      {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-1.5-pro',
        apiKey: 'sk-test'
      },
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      functionCalls
    );
    expect(streamResult).toSucceed();
    if (streamResult.isSuccess()) await collect(streamResult.value);
    return functionCalls;
  }
  test('functionCall accumulation buffer populated via callGeminiStream', async () => {
    const functionCalls = await accumulateGeminiCalls([{ name: 'do_thing', args: { param: 'value' } }]);
    expect(functionCalls).toHaveLength(1);
    expect(functionCalls[0].name).toBe('do_thing');
    expect(functionCalls[0].args).toEqual({ param: 'value' });
  });
  test('captures the part-level thoughtSignature onto the accumulated call when present', async () => {
    const functionCalls = await accumulateGeminiCalls([
      { name: 'do_thing', args: { param: 'value' }, thoughtSignature: 'sig-abc123' }
    ]);
    expect(functionCalls).toHaveLength(1);
    expect(functionCalls[0].thoughtSignature).toBe('sig-abc123');
  });
  test('leaves thoughtSignature undefined on the accumulated call when absent (thinking disabled)', async () => {
    const functionCalls = await accumulateGeminiCalls([{ name: 'do_thing', args: { param: 'value' } }]);
    expect(functionCalls).toHaveLength(1);
    expect(functionCalls[0].thoughtSignature).toBeUndefined();
  });
});

// ============================================================================
// Tests — cross-provider client-tool continuation wire forwarding
//
// Verifies that `continuationMessages` (the prior turn's reconstructed
// assistant turn + tool outputs) reach the request body for OpenAI Responses,
// Gemini, and (by `apiFormat: 'openai'` routing) xAI — paralleling the
// Anthropic C4 coverage above. The load-bearing assertions check the actual
// request body shape, not just that the call succeeds.
// ============================================================================

describe('cross-provider client-tool continuation wire forwarding', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // OpenAI Responses input completion stream: a text delta + completed event.
  const openAiDoneSse: ReadonlyArray<string> = [
    `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: 'ok' })}\n\n`,
    `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
  ];

  test('OpenAI Responses: appends function_call + function_call_output items after the user message', async () => {
    const continuationMessages: ReadonlyArray<JsonObject> = [
      {
        type: 'function_call',
        id: 'fc_1',
        name: 'recall_memory',
        arguments: '{"key":"display-mode"}'
      },
      { type: 'function_call_output', call_id: 'fc_1', output: 'dark mode' }
    ];

    const bodyCapture = mockSseResponseCapturingBody(openAiDoneSse);
    const { callOpenAiResponsesStream } = await import(
      '../../../packlets/ai-assist/streamingAdapters/openaiResponses'
    );

    const streamConfig = {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      apiKey: 'sk-test'
    };

    const streamResult = await callOpenAiResponsesStream(
      streamConfig,
      TEST_PROMPT,
      [{ type: 'web_search' }],
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      continuationMessages
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    const input = bodyCapture.getBody()?.input as Array<Record<string, unknown>>;
    expect(input).toBeDefined();
    // input: [{ role: 'system' }, { role: 'user' }, function_call, function_call_output]
    expect(input).toHaveLength(4);
    expect(input[1].role).toBe('user');
    expect(input[2]).toEqual({
      type: 'function_call',
      id: 'fc_1',
      name: 'recall_memory',
      arguments: '{"key":"display-mode"}'
    });
    expect(input[3]).toEqual({
      type: 'function_call_output',
      call_id: 'fc_1',
      output: 'dark mode'
    });
  });

  test('OpenAI Responses: skips malformed (non-object) continuation items', async () => {
    const continuationMessages: ReadonlyArray<JsonObject> = [
      { type: 'function_call', id: 'fc_ok', name: 't', arguments: '{}' },
      // Malformed: not a JSON object — must be skipped, not transmitted.
      'not-an-object' as unknown as JsonObject
    ];

    const bodyCapture = mockSseResponseCapturingBody(openAiDoneSse);
    const { callOpenAiResponsesStream } = await import(
      '../../../packlets/ai-assist/streamingAdapters/openaiResponses'
    );

    const streamResult = await callOpenAiResponsesStream(
      { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', apiKey: 'sk-test' },
      TEST_PROMPT,
      [{ type: 'web_search' }],
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      continuationMessages
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    const input = bodyCapture.getBody()?.input as Array<Record<string, unknown>>;
    // [system, user, fc_ok] — the malformed entry is dropped.
    expect(input).toHaveLength(3);
    expect(input[2].id).toBe('fc_ok');
  });

  test('Gemini: appends model functionCall + user functionResponse turns after the user message', async () => {
    const continuationMessages: ReadonlyArray<JsonObject> = [
      {
        role: 'model',
        parts: [{ functionCall: { name: 'recall_memory', args: { key: 'display-mode' } } }] as JsonArray
      },
      {
        role: 'user',
        parts: [
          { functionResponse: { name: 'recall_memory', response: { content: 'dark mode' } } }
        ] as JsonArray
      }
    ];

    const bodyCapture = mockSseResponseCapturingBody(
      geminiFunctionCallSse({ calls: [], textDeltas: ['ok'] })
    );
    const { callGeminiStream } = await import('../../../packlets/ai-assist/streamingAdapters/gemini');

    const streamResult = await callGeminiStream(
      {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-1.5-pro',
        apiKey: 'sk-test'
      },
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      continuationMessages
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    const contents = bodyCapture.getBody()?.contents as Array<Record<string, unknown>>;
    expect(contents).toBeDefined();
    // contents: [{ role: 'user' }, model functionCall turn, user functionResponse turn]
    expect(contents).toHaveLength(3);
    expect(contents[0].role).toBe('user');
    expect(contents[1].role).toBe('model');
    expect(contents[1].parts).toEqual([
      { functionCall: { name: 'recall_memory', args: { key: 'display-mode' } } }
    ]);
    expect(contents[2].role).toBe('user');
    expect(contents[2].parts).toEqual([
      { functionResponse: { name: 'recall_memory', response: { content: 'dark mode' } } }
    ]);
  });

  test('Gemini: skips malformed continuation items (invalid role)', async () => {
    const continuationMessages: ReadonlyArray<JsonObject> = [
      {
        role: 'model',
        parts: [{ functionCall: { name: 't', args: {} } }] as JsonArray
      },
      // Malformed: 'assistant' is not a valid Gemini role (only 'user' / 'model').
      { role: 'assistant', parts: [] as JsonArray } as unknown as JsonObject
    ];

    const bodyCapture = mockSseResponseCapturingBody(
      geminiFunctionCallSse({ calls: [], textDeltas: ['ok'] })
    );
    const { callGeminiStream } = await import('../../../packlets/ai-assist/streamingAdapters/gemini');

    const streamResult = await callGeminiStream(
      {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-1.5-pro',
        apiKey: 'sk-test'
      },
      TEST_PROMPT,
      undefined,
      0.5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      continuationMessages
    );

    expect(streamResult).toSucceed();
    if (!streamResult.isSuccess()) return;
    await collect(streamResult.value);

    const contents = bodyCapture.getBody()?.contents as Array<Record<string, unknown>>;
    // [user, model] — the invalid-role entry is dropped.
    expect(contents).toHaveLength(2);
    expect(contents[1].role).toBe('model');
  });

  test('xAI (apiFormat openai) forwards continuationMessages through executeClientToolTurn into the request body', async () => {
    // xAI routes through the OpenAI Responses adapter via apiFormat: 'openai',
    // so it inherits the continuation forwarding once executeClientToolTurn's
    // openai switch arm passes continuationMessages through. This test verifies
    // that inheritance end-to-end (not just that the adapter accepts the param).
    const continuationMessages: ReadonlyArray<JsonObject> = [
      { type: 'function_call', id: 'fc_x', name: 'recall_memory', arguments: '{"key":"k"}' },
      { type: 'function_call_output', call_id: 'fc_x', output: 'v' }
    ];

    const bodyCapture = mockSseResponseCapturingBody(openAiDoneSse);

    const xaiDescriptor: IAiProviderDescriptor = {
      id: 'xai-grok',
      label: 'xAI',
      buttonLabel: 'AI Assist | xAI',
      needsSecret: true,
      apiFormat: 'openai',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: 'grok-3',
      supportedTools: ['web_search'],
      corsRestricted: false,
      streamingCorsRestricted: false,
      acceptsImageInput: true,
      thinkingMode: 'optional'
    };

    const turnResult = AiAssist.executeClientToolTurn({
      descriptor: xaiDescriptor,
      apiKey: 'sk-test',
      ...TEST_PROMPT.toRequest(),
      tools: [{ type: 'web_search' }],
      clientTools: [],
      continuationMessages
    });

    expect(turnResult).toSucceed();
    if (!turnResult.isSuccess()) return;
    await collect(turnResult.value.events);
    await turnResult.value.nextTurn;

    const input = bodyCapture.getBody()?.input as Array<Record<string, unknown>>;
    expect(input).toBeDefined();
    expect(input[input.length - 2]).toEqual({
      type: 'function_call',
      id: 'fc_x',
      name: 'recall_memory',
      arguments: '{"key":"k"}'
    });
    expect(input[input.length - 1]).toEqual({
      type: 'function_call_output',
      call_id: 'fc_x',
      output: 'v'
    });
  });
});

// ============================================================================
// Tests — chatRequestBuilders rawTail short-circuit (no options supplied)
//
// Exercises the `options === undefined` branch of the `options?.rawTail`
// optional chain in buildMessages / buildGeminiContents — the path where no
// continuation messages (and no head/tail) are woven around the user message.
// ============================================================================

describe('chatRequestBuilders — builders called without options', () => {
  test('buildMessages emits only system + user when no options are supplied', async () => {
    const { buildMessages } = await import('../../../packlets/ai-assist/chatRequestBuilders');
    const messages = buildMessages('system prompt', 'user text');
    expect(messages).toEqual([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'user text' }
    ]);
  });

  test('buildGeminiContents emits only the user turn when no options are supplied', async () => {
    const { buildGeminiContents } = await import('../../../packlets/ai-assist/chatRequestBuilders');
    const contents = buildGeminiContents(TEST_PROMPT);
    expect(contents).toEqual([{ role: 'user', parts: [{ text: 'hello' }] }]);
  });

  test('buildAnthropicMessages emits only the user turn when no options are supplied', async () => {
    const { buildAnthropicMessages } = await import('../../../packlets/ai-assist/chatRequestBuilders');
    const messages = buildAnthropicMessages(TEST_PROMPT);
    expect(messages).toEqual([{ role: 'user', content: 'hello' }]);
  });
});
