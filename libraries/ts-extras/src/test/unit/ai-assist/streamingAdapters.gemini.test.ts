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
 * Tests for the Gemini streaming adapter’s C2 client-tool extensions:
 * functionCall part emission and thoughtSignature carriage.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAccumulatedGeminiFunctionCall } from '../../../packlets/ai-assist/streamingAdapters/gemini';
import {
  TEST_PROMPT,
  collect,
  geminiFunctionCallSse,
  makeGeminiDescriptor,
  mockSseResponse
} from './streamingAdaptersFixtures';

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
