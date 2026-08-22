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
 * Cross-provider client-tool continuation wire forwarding, plus the
 * `chatRequestBuilders` no-options short circuit.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
import type { JsonArray, JsonObject } from '@fgv/ts-json-base';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';
import {
  TEST_PROMPT,
  collect,
  geminiFunctionCallSse,
  mockSseResponseCapturingBody
} from './streamingAdaptersFixtures';

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
