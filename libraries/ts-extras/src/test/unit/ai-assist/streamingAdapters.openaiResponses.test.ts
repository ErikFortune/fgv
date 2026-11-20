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
 * Tests for the OpenAI Responses API streaming adapter’s C2 client-tool
 * extensions: function_call accumulation across item_id / call_id correlation.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedFunctionCall } from '../../../packlets/ai-assist/streamingAdapters/openaiResponses';
import {
  TEST_PROMPT,
  collect,
  makeOpenAiResponsesDescriptor,
  mockSseResponse,
  responsesApiFunctionCallSse
} from './streamingAdaptersFixtures';

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
