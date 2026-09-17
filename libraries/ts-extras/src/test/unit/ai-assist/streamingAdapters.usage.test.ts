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
 * Tests for `IAiStreamDone.usage` across the four streaming adapters — the
 * streaming half of C1 of `ai-assist-prompt-caching`. OQ-5 keeps streaming in
 * scope in the same slice as the non-streaming adapters (see design §12).
 */

/* eslint-disable @typescript-eslint/naming-convention -- wire field names are snake_case */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
import {
  TEST_PROMPT,
  collect,
  makeAnthropicDescriptor,
  makeGeminiDescriptor,
  makeOpenAiResponsesDescriptor,
  mockSseResponse
} from './streamingAdaptersFixtures';

describe('streaming adapters — IAiStreamDone.usage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('Anthropic: merges message_start (reads/writes) with message_delta (final output_tokens)', async () => {
    const events = [
      `event: message_start\ndata: ${JSON.stringify({
        message: { usage: { input_tokens: 100, cache_read_input_tokens: 40, cache_creation_input_tokens: 5 } }
      })}\n\n`,
      `event: content_block_start\ndata: ${JSON.stringify({ content_block: { type: 'text' } })}\n\n`,
      `event: content_block_delta\ndata: ${JSON.stringify({
        delta: { type: 'text_delta', text: 'hi' }
      })}\n\n`,
      `event: message_delta\ndata: ${JSON.stringify({
        delta: { stop_reason: 'end_turn' },
        usage: { output_tokens: 20 }
      })}\n\n`,
      `event: message_stop\ndata: ${JSON.stringify({})}\n\n`
    ];
    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const collected = await collect(result.value);
    const done = collected.find((e) => e.type === 'done');
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect(done.usage).toEqual({
      reports: 'reads-and-writes',
      uncachedInputTokens: 100,
      cachedInputTokens: 40,
      cacheWriteTokens: 5,
      outputTokens: 20,
      totalInputTokens: 140,
      raw: {
        input_tokens: 100,
        cache_read_input_tokens: 40,
        cache_creation_input_tokens: 5,
        output_tokens: 20
      }
    });
  });

  test('Anthropic: usage is absent when message_start and message_delta carry none, and a malformed message_start is skipped', async () => {
    const events = [
      // Malformed: missing the required `message` key entirely, so validation fails and
      // the accumulator is left untouched — the branch a well-formed `{ message: {} }` can't reach.
      'event: message_start\ndata: {}\n\n',
      `event: content_block_start\ndata: ${JSON.stringify({ content_block: { type: 'text' } })}\n\n`,
      `event: content_block_delta\ndata: ${JSON.stringify({
        delta: { type: 'text_delta', text: 'hi' }
      })}\n\n`,
      // Also malformed (missing the required `delta` key) — exercises the same
      // validation-failure branch on the message_delta usage check.
      'event: message_delta\ndata: {}\n\n',
      `event: message_stop\ndata: ${JSON.stringify({})}\n\n`
    ];
    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const collected = await collect(result.value);
    const done = collected.find((e) => e.type === 'done');
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect(done.usage).toBeUndefined();
  });

  test('OpenAI Chat Completions: requests stream_options.include_usage and normalizes the terminal usage-only chunk', async () => {
    const events = [
      // Malformed: missing the required `choices` key entirely, so validation fails and the
      // accumulator is left untouched.
      'data: {}\n\n',
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'hi' } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })}\n\n`,
      `data: ${JSON.stringify({
        choices: [],
        usage: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 40 } }
      })}\n\n`,
      'data: [DONE]\n\n'
    ];
    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const collected = await collect(result.value);
    const done = collected.find((e) => e.type === 'done');
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect(done.usage).toEqual({
      reports: 'reads',
      uncachedInputTokens: 60,
      cachedInputTokens: 40,
      outputTokens: 20,
      totalInputTokens: 100,
      raw: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 40 } }
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse((fetchCall[1] as RequestInit).body as string) as Record<string, unknown>;
    expect(body.stream_options).toEqual({ include_usage: true });
  });

  test('OpenAI Responses: cache_write_tokens present reports reads-and-writes', async () => {
    const events = [
      `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: 'hi' })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({
        response: {
          status: 'completed',
          usage: {
            input_tokens: 100,
            output_tokens: 20,
            input_tokens_details: { cached_tokens: 40, cache_write_tokens: 5 }
          }
        }
      })}\n\n`
    ];
    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools: [{ type: 'web_search' }]
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const collected = await collect(result.value);
    const done = collected.find((e) => e.type === 'done');
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect(done.usage).toEqual({
      reports: 'reads-and-writes',
      uncachedInputTokens: 60,
      cachedInputTokens: 40,
      cacheWriteTokens: 5,
      outputTokens: 20,
      totalInputTokens: 100,
      raw: {
        input_tokens: 100,
        output_tokens: 20,
        input_tokens_details: { cached_tokens: 40, cache_write_tokens: 5 }
      }
    });
  });

  test('OpenAI Responses (xAI-shaped): cache_write_tokens absent reports reads only', async () => {
    const events = [
      `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: 'hi' })}\n\n`,
      `event: response.completed\ndata: ${JSON.stringify({
        response: {
          status: 'completed',
          usage: { input_tokens: 100, output_tokens: 20, input_tokens_details: { cached_tokens: 40 } }
        }
      })}\n\n`
    ];
    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeOpenAiResponsesDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest(),
      tools: [{ type: 'web_search' }]
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const collected = await collect(result.value);
    const done = collected.find((e) => e.type === 'done');
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect(done.usage?.reports).toBe('reads');
    expect(done.usage?.cacheWriteTokens).toBeUndefined();
  });

  test('Gemini: normalizes the last usageMetadata chunk, subtracting cachedContentTokenCount', async () => {
    const events = [
      // Malformed: missing the required `candidates` key entirely, so validation fails and
      // the accumulator is left untouched.
      'data: {}\n\n',
      // Valid, but carries no usageMetadata at all — the chunk still updates text/finishReason
      // state without touching the usage accumulator.
      `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'hi' }] } }] })}\n\n`,
      `data: ${JSON.stringify({
        candidates: [{ finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, cachedContentTokenCount: 40 }
      })}\n\n`
    ];
    mockSseResponse(events);

    const result = await AiAssist.callProviderCompletionStream({
      descriptor: makeGeminiDescriptor(),
      apiKey: 'sk',
      ...TEST_PROMPT.toRequest()
    });

    expect(result).toSucceed();
    if (!result.isSuccess()) return;
    const collected = await collect(result.value);
    const done = collected.find((e) => e.type === 'done');
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') return;
    expect(done.usage).toEqual({
      reports: 'reads',
      uncachedInputTokens: 60,
      cachedInputTokens: 40,
      outputTokens: 20,
      totalInputTokens: 100,
      raw: { promptTokenCount: 100, candidatesTokenCount: 20, cachedContentTokenCount: 40 }
    });
  });
});
