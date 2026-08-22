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
 * Tests for the Anthropic streaming adapter’s C2 client-tool extensions:
 * thinking / redacted_thinking / tool_use block accumulation.
 *
 * @remarks
 * Shared SSE builders and descriptors live in `streamingAdaptersFixtures.ts`;
 * the OpenAI Responses, Gemini, and cross-provider continuation halves live in
 * the sibling `streamingAdapters.*.test.ts` files.
 */

import '@fgv/ts-utils-jest';

import { Logging } from '@fgv/ts-utils';
import { AiAssist } from '../../..';
import type { JsonArray, JsonObject } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedBlock } from '../../../packlets/ai-assist/streamingAdapters/anthropic';
import {
  TEST_PROMPT,
  anthropicRedactedThinkingSse,
  anthropicThinkingSse,
  anthropicToolUseSse,
  collect,
  makeAnthropicDescriptor,
  mockSseResponse
} from './streamingAdaptersFixtures';

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
