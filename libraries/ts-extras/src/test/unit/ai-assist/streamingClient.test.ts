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

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
// ============================================================================

function makeDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
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
    thinkingMode: 'optional',
    ...overrides
  };
}

const TEST_PROMPT = new AiAssist.AiPrompt('hello', 'system');

/**
 * Builds a ReadableStream<Uint8Array> that yields the given chunks. Used to
 * mock SSE response bodies for the per-format adapters.
 */
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

function mockSseHttpError(status: number, errorText: string): void {
  const response = {
    ok: false,
    status,
    body: null,
    text: jest.fn().mockResolvedValue(errorText)
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

function mockFetchError(error: Error): void {
  (global.fetch as jest.Mock).mockRejectedValue(error);
}

async function collect(iter: AsyncIterable<AiAssist.IAiStreamEvent>): Promise<AiAssist.IAiStreamEvent[]> {
  const out: AiAssist.IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}

// ============================================================================
// SSE bodies per format
// ============================================================================

function openAiChatSse(deltas: ReadonlyArray<string>, finishReason: string = 'stop'): string[] {
  const events: string[] = [];
  for (const delta of deltas) {
    events.push(
      `data: ${JSON.stringify({ choices: [{ delta: { content: delta }, finish_reason: null }] })}\n\n`
    );
  }
  events.push(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finishReason }] })}\n\n`);
  events.push(`data: [DONE]\n\n`);
  return events;
}

function responsesApiSse(parts: {
  textDeltas?: ReadonlyArray<string>;
  searchProgress?: boolean;
  truncated?: boolean;
  errorMessage?: string;
}): string[] {
  const events: string[] = [];
  if (parts.searchProgress) {
    events.push(
      `event: response.web_search_call.in_progress\ndata: ${JSON.stringify({})}\n\n`,
      `event: response.web_search_call.completed\ndata: ${JSON.stringify({})}\n\n`
    );
  }
  for (const delta of parts.textDeltas ?? []) {
    events.push(`event: response.output_text.delta\ndata: ${JSON.stringify({ delta })}\n\n`);
  }
  if (parts.errorMessage !== undefined) {
    events.push(
      `event: response.failed\ndata: ${JSON.stringify({ error: { message: parts.errorMessage } })}\n\n`
    );
  } else {
    events.push(
      `event: response.completed\ndata: ${JSON.stringify({
        response: { status: parts.truncated ? 'incomplete' : 'completed' }
      })}\n\n`
    );
  }
  return events;
}

function anthropicSse(parts: {
  textDeltas?: ReadonlyArray<string>;
  searchToolUse?: boolean;
  truncated?: boolean;
  errorMessage?: string;
}): string[] {
  const events: string[] = [];
  if (parts.searchToolUse) {
    events.push(
      `event: content_block_start\ndata: ${JSON.stringify({
        content_block: { type: 'server_tool_use', name: 'web_search' }
      })}\n\n`,
      `event: content_block_start\ndata: ${JSON.stringify({
        content_block: { type: 'web_search_tool_result' }
      })}\n\n`
    );
  }
  events.push(
    `event: content_block_start\ndata: ${JSON.stringify({
      content_block: { type: 'text' }
    })}\n\n`
  );
  for (const delta of parts.textDeltas ?? []) {
    events.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        delta: { type: 'text_delta', text: delta }
      })}\n\n`
    );
  }
  if (parts.errorMessage !== undefined) {
    events.push(`event: error\ndata: ${JSON.stringify({ error: { message: parts.errorMessage } })}\n\n`);
    return events;
  }
  if (parts.truncated) {
    events.push(
      `event: message_delta\ndata: ${JSON.stringify({
        delta: { stop_reason: 'max_tokens' }
      })}\n\n`
    );
  }
  events.push(`event: message_stop\ndata: ${JSON.stringify({})}\n\n`);
  return events;
}

function geminiSse(deltas: ReadonlyArray<string>, finishReason: string = 'STOP'): string[] {
  const events: string[] = [];
  for (let i = 0; i < deltas.length; i++) {
    const isLast = i === deltas.length - 1;
    const candidate: Record<string, unknown> = {
      content: { parts: [{ text: deltas[i] }] }
    };
    if (isLast) {
      candidate.finishReason = finishReason;
    }
    events.push(`data: ${JSON.stringify({ candidates: [candidate] })}\n\n`);
  }
  return events;
}

// ============================================================================
// Tests
// ============================================================================

describe('callProviderCompletionStream', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('common validation', () => {
    test('fails when descriptor has no baseUrl', async () => {
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ baseUrl: '' }),
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      expect(result).toFailWith(/no API endpoint/i);
    });

    test('rejects up front when streamingCorsRestricted', async () => {
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ streamingCorsRestricted: true }),
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      expect(result).toFailWith(/requires a proxy for streaming/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects up front when attachments present and provider does not accept image input', async () => {
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ acceptsImageInput: false }),
        apiKey: 'sk',
        prompt: new AiAssist.AiPrompt('describe', 'sys', [{ mimeType: 'image/png', base64: 'AA' }])
      });
      expect(result).toFailWith(/does not accept image input/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('surfaces fetch network errors as Result.fail', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      expect(result).toFailWith(/ECONNREFUSED/);
    });

    test('surfaces non-2xx as Result.fail with status and body', async () => {
      mockSseHttpError(401, 'Unauthorized');
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'bad',
        prompt: TEST_PROMPT
      });
      expect(result).toFailWith(/401.*Unauthorized/);
    });

    test('forwards abort signal to fetch', async () => {
      mockSseResponse(openAiChatSse(['x']));
      const controller = new AbortController();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        signal: controller.signal
      });
      expect(result).toSucceed();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].signal).toBe(controller.signal);
    });

    test('uses modelOverride when supplied', async () => {
      mockSseResponse(openAiChatSse(['x']));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        modelOverride: 'gpt-5'
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('gpt-5');
      expect(body.stream).toBe(true);
    });

    test('forwards explicit temperature to request body', async () => {
      mockSseResponse(openAiChatSse(['x']));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        temperature: 0.3
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.temperature).toBe(0.3);
    });
  });

  describe('endpoint override', () => {
    test('substitutes endpoint for descriptor.baseUrl when streaming', async () => {
      mockSseResponse(openAiChatSse(['hi']));
      const descriptor = AiAssist.getProviderDescriptor('ollama').orThrow();

      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: '',
        prompt: TEST_PROMPT,
        endpoint: 'http://localhost:11434/v1',
        modelOverride: 'llama3.2'
      });

      expect(result).toSucceed();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:11434/v1/chat/completions');
    });

    test('honors endpoint when descriptor.baseUrl is empty (openai-compat)', async () => {
      mockSseResponse(openAiChatSse(['hi']));
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: '',
        prompt: TEST_PROMPT,
        endpoint: 'http://192.168.1.42:1234/v1',
        modelOverride: 'qwen2.5-coder'
      });

      expect(result).toSucceed();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://192.168.1.42:1234/v1/chat/completions');
    });

    test('rejects a malformed endpoint URL up front', async () => {
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        endpoint: 'not a url'
      });

      expect(result).toFailWith(/endpoint is not a valid URL/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects an endpoint with a query string', async () => {
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        endpoint: 'http://localhost:11434/v1?token=secret'
      });

      expect(result).toFailWith(/must not include a query string or fragment/i);
      if (result.isFailure()) {
        expect(result.message).not.toMatch(/secret/);
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('omits the Authorization header when apiKey is empty', async () => {
      mockSseResponse(openAiChatSse(['hi']));
      const descriptor = AiAssist.getProviderDescriptor('ollama').orThrow();

      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: '',
        prompt: TEST_PROMPT,
        endpoint: 'http://localhost:11434/v1',
        modelOverride: 'llama3.2'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      // eslint-disable-next-line dot-notation
      expect(fetchCall[1].headers['Authorization']).toBeUndefined();
    });

    test('fails up front when neither defaultModel nor modelOverride yields a model', async () => {
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: '',
        prompt: TEST_PROMPT,
        endpoint: 'http://10.0.0.5:8080/v1'
      });

      expect(result).toFailWith(/no model resolved/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('openai chat completions stream', () => {
    test('translates text deltas and emits done', async () => {
      mockSseResponse(openAiChatSse(['Hello, ', 'world!']));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      expect(result).toSucceed();
      if (!result.isSuccess()) return;
      const events = await collect(result.value);
      expect(events).toEqual([
        { type: 'text-delta', delta: 'Hello, ' },
        { type: 'text-delta', delta: 'world!' },
        { type: 'done', truncated: false, fullText: 'Hello, world!' }
      ]);
    });

    test('marks truncated when finish_reason is length', async () => {
      mockSseResponse(openAiChatSse(['cut'], 'length'));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const done = events.find((e) => e.type === 'done') as AiAssist.IAiStreamDone | undefined;
      expect(done?.truncated).toBe(true);
    });

    test('handles deltas that span SSE chunk boundaries', async () => {
      // Splitting one logical event across two read() returns
      const fullEvent = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'hi' }, finish_reason: null }]
      })}\n\n`;
      const mid = Math.floor(fullEvent.length / 2);
      mockSseResponse([fullEvent.slice(0, mid), fullEvent.slice(mid), ...openAiChatSse(['!'])]);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const text = events
        .filter((e) => e.type === 'text-delta')
        .map((e) => (e as AiAssist.IAiStreamTextDelta).delta)
        .join('');
      expect(text).toBe('hi!');
    });

    test('emits error when stream ends without a finish_reason', async () => {
      // No final event with finish_reason; just a content delta and EOF.
      mockSseResponse([
        `data: ${JSON.stringify({ choices: [{ delta: { content: 'half' }, finish_reason: null }] })}\n\n`
      ]);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const last = events[events.length - 1];
      expect(last.type).toBe('error');
    });

    test('places messagesBefore between system and the new user message', async () => {
      mockSseResponse(openAiChatSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor(),
        apiKey: 'sk',
        prompt: new AiAssist.AiPrompt('how about pasta?', 'You are a helpful assistant.'),
        messagesBefore: [
          { role: 'user', content: 'hi' },
          { role: 'assistant', content: 'hello' }
        ]
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'how about pasta?' }
      ]);
    });

    test('includes reasoning_effort and omits temperature when thinking effort provided (OpenAI chat stream)', async () => {
      mockSseResponse(openAiChatSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ id: 'openai' }),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: { effort: 'high' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBe('high');
      expect(body.temperature).toBeUndefined();
    });

    test('sends xAI effort as reasoning_effort and omits temperature (xAI openai-format stream)', async () => {
      mockSseResponse(openAiChatSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ id: 'xai-grok' }),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: { effort: 'low' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBe('low');
      expect(body.temperature).toBeUndefined();
    });

    test('merges other-block params into OpenAI chat stream body', async () => {
      mockSseResponse(openAiChatSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ id: 'openai' }),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: {
          providers: [
            {
              provider: 'other',
              models: ['gpt-4o'],
              config: { custom_param: 'xyz' }
            }
          ]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.custom_param).toBe('xyz');
    });
  });

  describe('openai responses API stream (with tools)', () => {
    const descriptor = makeDescriptor();
    const tools: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];

    test('emits text deltas, tool events, and done', async () => {
      mockSseResponse(responsesApiSse({ searchProgress: true, textDeltas: ['Looking at... ', 'recipes.'] }));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        tools
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const types = events.map((e) => e.type);
      expect(types).toEqual(['tool-event', 'tool-event', 'text-delta', 'text-delta', 'done']);
      const phases = events
        .filter((e) => e.type === 'tool-event')
        .map((e) => (e as AiAssist.IAiStreamToolEvent).phase);
      expect(phases).toEqual(['started', 'completed']);
      const done = events[events.length - 1] as AiAssist.IAiStreamDone;
      expect(done.fullText).toBe('Looking at... recipes.');
    });

    test('marks truncated for incomplete status', async () => {
      mockSseResponse(responsesApiSse({ textDeltas: ['cut'], truncated: true }));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        tools
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const done = events[events.length - 1] as AiAssist.IAiStreamDone;
      expect(done.truncated).toBe(true);
    });

    test('emits a terminal error event on response.failed', async () => {
      mockSseResponse(responsesApiSse({ errorMessage: 'rate limited' }));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        tools
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      expect(events[events.length - 1]).toEqual({ type: 'error', message: 'rate limited' });
    });

    test('emits error when stream ends without completed event', async () => {
      mockSseResponse([`event: response.output_text.delta\ndata: ${JSON.stringify({ delta: 'x' })}\n\n`]);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        tools
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      expect(events[events.length - 1].type).toBe('error');
    });

    test('includes reasoning field and omits temperature when thinking provided (Responses API stream)', async () => {
      mockSseResponse(responsesApiSse({ textDeltas: ['ok'] }));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ id: 'openai' }),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        tools,
        thinking: { effort: 'medium' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning).toEqual({ effort: 'medium' });
      expect(body.temperature).toBeUndefined();
    });

    test('merges other-block params into Responses API stream body', async () => {
      mockSseResponse(responsesApiSse({ textDeltas: ['ok'] }));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({ id: 'openai' }),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        tools,
        thinking: {
          providers: [
            {
              provider: 'other',
              models: ['gpt-4o'],
              config: { extra_responses_param: 42 }
            }
          ]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.extra_responses_param).toBe(42);
    });
  });

  describe('anthropic stream', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-5'
    });

    test('translates text deltas and emits done', async () => {
      mockSseResponse(anthropicSse({ textDeltas: ['Hi', ' there'] }));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const text = events
        .filter((e) => e.type === 'text-delta')
        .map((e) => (e as AiAssist.IAiStreamTextDelta).delta)
        .join('');
      expect(text).toBe('Hi there');
      expect(events[events.length - 1].type).toBe('done');
    });

    test('surfaces server_tool_use as tool-event', async () => {
      mockSseResponse(anthropicSse({ searchToolUse: true, textDeltas: ['done'] }));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        tools: [{ type: 'web_search' }]
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const phases = events
        .filter((e) => e.type === 'tool-event')
        .map((e) => (e as AiAssist.IAiStreamToolEvent).phase);
      expect(phases).toEqual(['started', 'completed']);
    });

    test('marks truncated when stop_reason is max_tokens', async () => {
      mockSseResponse(anthropicSse({ textDeltas: ['cut'], truncated: true }));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const done = events[events.length - 1] as AiAssist.IAiStreamDone;
      expect(done.truncated).toBe(true);
    });

    test('emits a terminal error event on error event', async () => {
      mockSseResponse(anthropicSse({ errorMessage: 'overloaded' }));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      expect(events[events.length - 1]).toEqual({ type: 'error', message: 'overloaded' });
    });

    test('uses x-api-key auth header', async () => {
      mockSseResponse(anthropicSse({ textDeltas: ['ok'] }));
      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['x-api-key']).toBe('sk');
    });

    test('emits error when stream ends without message_stop', async () => {
      mockSseResponse([
        `event: content_block_start\ndata: ${JSON.stringify({ content_block: { type: 'text' } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({
          delta: { type: 'text_delta', text: 'half' }
        })}\n\n`
      ]);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      expect(events[events.length - 1].type).toBe('error');
    });

    test('places messagesBefore before the new user message and filters system roles', async () => {
      mockSseResponse(anthropicSse({ textDeltas: ['ok'] }));
      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: new AiAssist.AiPrompt('how about pasta?', 'You are a helpful assistant.'),
        messagesBefore: [
          { role: 'user', content: 'hi' },
          { role: 'assistant', content: 'hello' },
          { role: 'system', content: 'should be filtered' }
        ]
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.system).toBe('You are a helpful assistant.');
      expect(body.messages).toEqual([
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'how about pasta?' }
      ]);
    });

    test('includes thinking wire fields when thinking effort provided', async () => {
      mockSseResponse(anthropicSse({ textDeltas: ['ok'] }));
      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: { effort: 'high' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.thinking).toEqual({ type: 'enabled' });
      expect(body.output_config).toEqual({ effort: 'high' });
      expect(body.temperature).toBeUndefined();
    });

    test('merges other-block params into Anthropic body', async () => {
      mockSseResponse(anthropicSse({ textDeltas: ['ok'] }));
      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: {
          providers: [
            {
              provider: 'other',
              models: ['claude-sonnet-4-5'],
              config: { anthropic_extra_param: 'value' }
            }
          ]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.anthropic_extra_param).toBe('value');
    });

    test('fails when thinking and temperature conflict on Anthropic', async () => {
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: { effort: 'high' },
        temperature: 0.7
      });
      expect(result).toFailWith(/thinking mode is not compatible with temperature on provider anthropic/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('gemini stream', () => {
    const descriptor = makeDescriptor({
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash',
      id: 'google-gemini'
    });

    test('translates text deltas and emits done', async () => {
      mockSseResponse(geminiSse(['Hello, ', 'world!']));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const text = events
        .filter((e) => e.type === 'text-delta')
        .map((e) => (e as AiAssist.IAiStreamTextDelta).delta)
        .join('');
      expect(text).toBe('Hello, world!');
      expect(events[events.length - 1].type).toBe('done');
    });

    test('marks truncated for MAX_TOKENS finishReason', async () => {
      mockSseResponse(geminiSse(['cut'], 'MAX_TOKENS'));
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      const done = events[events.length - 1] as AiAssist.IAiStreamDone;
      expect(done.truncated).toBe(true);
    });

    test('uses streamGenerateContent endpoint with alt=sse', async () => {
      mockSseResponse(geminiSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain(':streamGenerateContent?alt=sse');
    });

    test('emits error when stream ends without finishReason', async () => {
      // Send a chunk with text but no finishReason
      mockSseResponse([
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'half' }] } }] })}\n\n`
      ]);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT
      });
      if (!result.isSuccess()) throw new Error('expected success');
      const events = await collect(result.value);
      expect(events[events.length - 1].type).toBe('error');
    });

    test('includes thinkingConfig in generationConfig when thinking effort provided', async () => {
      mockSseResponse(geminiSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: { effort: 'medium' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 4096 });
    });

    test('merges other-block params into generationConfig', async () => {
      mockSseResponse(geminiSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor: makeDescriptor({
          apiFormat: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          defaultModel: 'gemini-2.5-flash',
          id: 'google-gemini'
        }),
        apiKey: 'sk',
        prompt: TEST_PROMPT,
        thinking: {
          providers: [
            {
              provider: 'other',
              models: ['gemini-2.5-flash'],
              config: { extra_thinking_param: true }
            }
          ]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig.extra_thinking_param).toBe(true);
    });

    test('places messagesBefore before the new user turn and maps assistant->model', async () => {
      mockSseResponse(geminiSse(['ok']));
      await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'sk',
        prompt: new AiAssist.AiPrompt('how about pasta?', 'You are a helpful assistant.'),
        messagesBefore: [
          { role: 'user', content: 'hi' },
          { role: 'assistant', content: 'hello' }
        ]
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.systemInstruction).toEqual({ parts: [{ text: 'You are a helpful assistant.' }] });
      expect(body.contents).toEqual([
        { role: 'user', parts: [{ text: 'hi' }] },
        { role: 'model', parts: [{ text: 'hello' }] },
        { role: 'user', parts: [{ text: 'how about pasta?' }] }
      ]);
    });
  });
});

describe('callProxiedCompletionStream', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('translates pre-serialized unified events from the proxy', async () => {
    mockSseResponse([
      `data: ${JSON.stringify({ type: 'text-delta', delta: 'Hi' })}\n\n`,
      `data: ${JSON.stringify({ type: 'text-delta', delta: ' there' })}\n\n`,
      `data: ${JSON.stringify({ type: 'done', truncated: false, fullText: 'Hi there' })}\n\n`
    ]);
    const result = await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT
    });
    if (!result.isSuccess()) throw new Error('expected success');
    const events = await collect(result.value);
    expect(events).toEqual([
      { type: 'text-delta', delta: 'Hi' },
      { type: 'text-delta', delta: ' there' },
      { type: 'done', truncated: false, fullText: 'Hi there' }
    ]);
  });

  test('hits the documented proxy endpoint and includes stream:true', async () => {
    mockSseResponse([`data: ${JSON.stringify({ type: 'done', truncated: false, fullText: '' })}\n\n`]);
    await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT
    });
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('http://proxy.local:3001/api/ai/completion-stream');
    const body = JSON.parse(fetchCall[1].body);
    expect(body).toMatchObject({ providerId: 'openai', apiKey: 'sk', stream: true });
  });

  test('forwards attachments, messagesBefore, modelOverride, and tools', async () => {
    mockSseResponse([`data: ${JSON.stringify({ type: 'done', truncated: false, fullText: '' })}\n\n`]);
    await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: new AiAssist.AiPrompt('q', 's', [{ mimeType: 'image/png', base64: 'A' }]),
      messagesBefore: [{ role: 'assistant', content: 'prior' }],
      modelOverride: 'custom',
      tools: [{ type: 'web_search' }]
    });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.prompt.attachments).toHaveLength(1);
    expect(body.messagesBefore).toHaveLength(1);
    expect(body.modelOverride).toBe('custom');
    expect(body.tools).toEqual([{ type: 'web_search' }]);
  });

  test('forwards abort signal', async () => {
    mockSseResponse([`data: ${JSON.stringify({ type: 'done', truncated: false, fullText: '' })}\n\n`]);
    const controller = new AbortController();
    await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      signal: controller.signal
    });
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].signal).toBe(controller.signal);
  });

  test('surfaces non-2xx as Result.fail', async () => {
    mockSseHttpError(503, 'proxy upstream down');
    const result = await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT
    });
    expect(result).toFailWith(/503/);
  });

  test('terminates iteration on a done event', async () => {
    mockSseResponse([
      `data: ${JSON.stringify({ type: 'text-delta', delta: 'a' })}\n\n`,
      `data: ${JSON.stringify({ type: 'done', truncated: false, fullText: 'a' })}\n\n`,
      // Anything after done should be ignored:
      `data: ${JSON.stringify({ type: 'text-delta', delta: 'b' })}\n\n`
    ]);
    const result = await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT
    });
    if (!result.isSuccess()) throw new Error('expected success');
    const events = await collect(result.value);
    expect(events.map((e) => e.type)).toEqual(['text-delta', 'done']);
  });

  test('terminates iteration on an error event', async () => {
    mockSseResponse([
      `data: ${JSON.stringify({ type: 'error', message: 'bad' })}\n\n`,
      `data: ${JSON.stringify({ type: 'text-delta', delta: 'too late' })}\n\n`
    ]);
    const result = await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT
    });
    if (!result.isSuccess()) throw new Error('expected success');
    const events = await collect(result.value);
    expect(events).toEqual([{ type: 'error', message: 'bad' }]);
  });

  test('skips events with unknown type', async () => {
    mockSseResponse([
      `data: ${JSON.stringify({ type: 'text-delta', delta: 'x' })}\n\n`,
      `data: ${JSON.stringify({ type: 'unknown-future-event' })}\n\n`,
      `data: ${JSON.stringify({ type: 'done', truncated: false, fullText: 'x' })}\n\n`
    ]);
    const result = await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT
    });
    if (!result.isSuccess()) throw new Error('expected success');
    const events = await collect(result.value);
    expect(events.map((e) => e.type)).toEqual(['text-delta', 'done']);
  });

  test('forwards thinking field in proxy stream body when thinking is provided', async () => {
    mockSseResponse([`data: ${JSON.stringify({ type: 'done', truncated: false, fullText: '' })}\n\n`]);
    const thinking: AiAssist.IThinkingConfig = { effort: 'high' };
    await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'sk',
      prompt: TEST_PROMPT,
      thinking
    });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.thinking).toEqual({ effort: 'high' });
  });
});
