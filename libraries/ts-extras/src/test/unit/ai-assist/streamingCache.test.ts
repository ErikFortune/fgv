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
 * Tests for `cache?: IAiCacheRequest` on the streaming request paths —
 * `callProviderCompletionStream`, `executeClientToolTurn`, and
 * `callProxiedCompletionStream` — the `ai-assist-streaming-cache` stream.
 *
 * @remarks
 * Sibling to `apiClient.cache.test.ts` (the non-streaming path). Per
 * `TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is
 * never called", every test here asserts the actual outbound request body a
 * mocked `fetch` receives — never merely that the call succeeded. A dropped
 * `cache` parameter still returns 200, so a success-only assertion would pass
 * against every broken version of this change; that is the #679 lesson this
 * stream exists to apply here.
 */

/* eslint-disable @typescript-eslint/naming-convention -- wire field names are snake_case */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiClientTool, IAiProviderDescriptor, IAiStreamEvent } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
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

function mockSseResponse(chunks: ReadonlyArray<string>): void {
  const response = {
    ok: true,
    status: 200,
    body: makeReadable(chunks),
    text: jest.fn().mockResolvedValue(''),
    headers: new Map([['content-type', 'text/event-stream']])
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

function lastRequestBody(): Record<string, unknown> {
  const calls = (global.fetch as jest.Mock).mock.calls;
  const init = calls[calls.length - 1][1] as RequestInit;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

function lastRequestHeaders(): Record<string, string> {
  const calls = (global.fetch as jest.Mock).mock.calls;
  const init = calls[calls.length - 1][1] as RequestInit;
  return (init.headers ?? {}) as Record<string, string>;
}

async function drain(iter: AsyncIterable<IAiStreamEvent>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _event of iter) {
    // discard — these tests only care about the outbound request body
  }
}

const SYSTEM = 'ABCDEFGHIJKLMNOPQRST'; // length 20
const USER = 'What is the weather?';

const anthropicDoneSse: ReadonlyArray<string> = [`event: message_stop\ndata: {}\n\n`];
const openAiChatDoneSse: ReadonlyArray<string> = [
  `data: ${JSON.stringify({ choices: [{ delta: { content: 'hi' }, finish_reason: 'stop' }] })}\n\n`
];
const responsesDoneSse: ReadonlyArray<string> = [
  `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`
];
const geminiDoneSse: ReadonlyArray<string> = [
  `data: ${JSON.stringify({
    candidates: [{ content: { parts: [{ text: 'hi' }] }, finishReason: 'STOP' }]
  })}\n\n`
];

function makeAnthropicDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    buttonLabel: 'AI Assist | Anthropic',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: true,
    ...overrides
  };
}

function makeOpenAiDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
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
    ...overrides
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
    acceptsImageInput: true
  };
}

// ============================================================================
// callProviderCompletionStream
// ============================================================================

describe('callProviderCompletionStream cache', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Anthropic streaming', () => {
    test('is byte-identical to a request predating cache support when cache is omitted', async () => {
      // Catches: routing prompt.system through buildAnthropicSystem unconditionally, which would
      // wrap the plain string in a one-element parts array even with no cache.
      mockSseResponse(anthropicDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }]
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      expect(lastRequestBody().system).toBe(SYSTEM);
    });

    test('splits system into content blocks with cache_control on each breakpoint', async () => {
      // Catches: streamingClient never threading `cache` to callAnthropicStream at all (the
      // gap this stream fixes) — without this, the request body carries the plain string.
      mockSseResponse(anthropicDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15] }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      expect(lastRequestBody().system).toEqual([
        { type: 'text', text: SYSTEM.slice(0, 8), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: SYSTEM.slice(8, 15), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: SYSTEM.slice(15) }
      ]);
    });

    test('fails the request loudly on an invalid breakpoint plan, without ever calling fetch', async () => {
      // Catches: validating once and reusing across calls, or silently clamping an
      // out-of-range offset instead of failing the round.
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [SYSTEM.length + 1] }
      });
      expect(result).toFailWith(/integer strictly between/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('OpenAI Chat Completions streaming', () => {
    test('is byte-identical to a request predating cache support when cache is omitted', async () => {
      mockSseResponse(openAiChatDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }]
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      const messages = lastRequestBody().messages as Array<Record<string, unknown>>;
      expect(messages[0]).toEqual({ role: 'system', content: SYSTEM });
    });

    test('splits the leading system message into parts carrying prompt_cache_breakpoint', async () => {
      // Catches: callOpenAiChatStream still calling buildMessages(prompt.system, ...) with the
      // plain string instead of routing through buildOpenAiChatSystemContent(prompt.system, cache).
      mockSseResponse(openAiChatDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15] }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      const messages = lastRequestBody().messages as Array<{ role: string; content: unknown }>;
      expect(messages[0].content).toEqual([
        { type: 'text', text: SYSTEM.slice(0, 8), prompt_cache_breakpoint: { mode: 'explicit' } },
        { type: 'text', text: SYSTEM.slice(8, 15), prompt_cache_breakpoint: { mode: 'explicit' } },
        { type: 'text', text: SYSTEM.slice(15) }
      ]);
    });

    test('sends prompt_cache_key as a body field for OpenAI', async () => {
      mockSseResponse(openAiChatDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { cacheKey: 'tenant-1' }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      expect(lastRequestBody().prompt_cache_key).toBe('tenant-1');
      expect('x-grok-conv-id' in lastRequestHeaders()).toBe(false);
    });

    test('xAI: cacheKey rides the x-grok-conv-id header, never the body; breakpoints stay withheld', async () => {
      // Catches: gating breakpoints and the routing key together, which withholds routing from
      // the provider (xAI) whose caching depends on it most — see streamUsageCapability.ts.
      mockSseResponse(openAiChatDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor({ id: 'xai-grok' }),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8], cacheKey: 'tenant-1' }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      expect(lastRequestHeaders()['x-grok-conv-id']).toBe('tenant-1');
      const body = lastRequestBody();
      expect('prompt_cache_key' in body).toBe(false);
      expect((body.messages as Array<Record<string, unknown>>)[0]).toEqual({
        role: 'system',
        content: SYSTEM
      });
    });

    test('fails the request loudly on an invalid breakpoint plan, without ever calling fetch', async () => {
      // Catches: callOpenAiChatStream building the system content before validation would run,
      // or swallowing buildOpenAiChatSystemContent's failure instead of propagating it.
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [0] }
      });
      expect(result).toFailWith(/integer strictly between/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('an unconfirmed descriptor gets a byte-identical body and headers, cache silently dropped', async () => {
      // Catches: gating keyed off apiFormat rather than descriptor.id, which would leak
      // breakpoints/cacheKey to every openai-compatible descriptor (Groq, Mistral, Ollama, ...).
      mockSseResponse(openAiChatDoneSse);
      const descriptor = makeOpenAiDescriptor({ id: 'groq' });

      const withCache = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15], cacheKey: 'tenant-1' }
      });
      expect(withCache).toSucceed();
      if (withCache.isFailure()) return;
      await drain(withCache.value);
      const withCacheBody = lastRequestBody();
      const withCacheHeaders = lastRequestHeaders();

      mockSseResponse(openAiChatDoneSse);
      const withoutCache = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }]
      });
      expect(withoutCache).toSucceed();
      if (withoutCache.isFailure()) return;
      await drain(withoutCache.value);

      expect(withCacheBody).toEqual(lastRequestBody());
      expect(withCacheHeaders).toEqual(lastRequestHeaders());
    });
  });

  describe('OpenAI / xAI Responses API streaming (tools present)', () => {
    test('is byte-identical to a request predating cache support when cache is omitted', async () => {
      mockSseResponse(responsesDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }]
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      const input = lastRequestBody().input as Array<Record<string, unknown>>;
      expect(input[0]).toEqual({ role: 'system', content: SYSTEM });
    });

    test('splits the leading system item into input_text parts carrying prompt_cache_breakpoint', async () => {
      // Catches: callOpenAiResponsesStream still building `input` from the plain
      // prompt.system string instead of buildOpenAiResponsesSystemContent(prompt.system, cache).
      mockSseResponse(responsesDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { systemBreakpoints: [12] }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      const input = lastRequestBody().input as Array<{ role: string; content: unknown }>;
      expect(input[0].content).toEqual([
        { type: 'input_text', text: SYSTEM.slice(0, 12), prompt_cache_breakpoint: { mode: 'explicit' } },
        { type: 'input_text', text: SYSTEM.slice(12) }
      ]);
    });

    test('sends prompt_cache_key as a body field (no header variant on Responses)', async () => {
      mockSseResponse(responsesDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor({ id: 'xai-grok' }),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { cacheKey: 'tenant-9' }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      expect(lastRequestBody().prompt_cache_key).toBe('tenant-9');
      expect('x-grok-conv-id' in lastRequestHeaders()).toBe(false);
    });

    test('an unconfirmed descriptor gets a byte-identical body, cache silently dropped', async () => {
      mockSseResponse(responsesDoneSse);
      const descriptor = makeOpenAiDescriptor({ id: 'groq' });
      const result = await AiAssist.callProviderCompletionStream({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { systemBreakpoints: [8], cacheKey: 'tenant-1' }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      const body = lastRequestBody();
      expect('prompt_cache_key' in body).toBe(false);
      const input = body.input as Array<Record<string, unknown>>;
      expect(input[0]).toEqual({ role: 'system', content: SYSTEM });
    });

    test('fails the request loudly on an invalid breakpoint plan, without ever calling fetch', async () => {
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { systemBreakpoints: [10, 5] }
      });
      expect(result).toFailWith(/strictly ascending/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Gemini streaming', () => {
    test('ignores cache entirely — no breakpoint mechanism, systemInstruction is unaffected', async () => {
      mockSseResponse(geminiDoneSse);
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: makeGeminiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [5], cacheKey: 'tenant-1' }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value);
      expect(lastRequestBody().systemInstruction).toEqual({ parts: [{ text: SYSTEM }] });
    });
  });
});

// ============================================================================
// executeClientToolTurn
// ============================================================================

describe('executeClientToolTurn cache', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const noClientTools: ReadonlyArray<IAiClientTool> = [];

  describe('Anthropic', () => {
    test('splits system into cache_control content blocks', async () => {
      // Catches: IExecuteClientToolTurnParams never carrying `cache` at all (the gap this
      // stream fixes for the tool-turn entry point specifically).
      mockSseResponse(anthropicDoneSse);
      const result = AiAssist.executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        clientTools: noClientTools,
        cache: { systemBreakpoints: [8, 15] }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value.events);
      const turn = await result.value.nextTurn;
      expect(turn).toSucceed();
      expect(lastRequestBody().system).toEqual([
        { type: 'text', text: SYSTEM.slice(0, 8), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: SYSTEM.slice(8, 15), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: SYSTEM.slice(15) }
      ]);
    });
  });

  describe('OpenAI (always routes through the Responses API)', () => {
    test('splits system into input_text parts and sends prompt_cache_key', async () => {
      mockSseResponse(responsesDoneSse);
      const result = AiAssist.executeClientToolTurn({
        descriptor: makeOpenAiDescriptor(),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        clientTools: noClientTools,
        cache: { systemBreakpoints: [10], cacheKey: 'tenant-4' }
      });
      expect(result).toSucceed();
      if (result.isFailure()) return;
      await drain(result.value.events);
      const turn = await result.value.nextTurn;
      expect(turn).toSucceed();
      const body = lastRequestBody();
      expect(body.prompt_cache_key).toBe('tenant-4');
      const input = body.input as Array<{ role: string; content: unknown }>;
      expect(input[0].content).toEqual([
        { type: 'input_text', text: SYSTEM.slice(0, 10), prompt_cache_breakpoint: { mode: 'explicit' } },
        { type: 'input_text', text: SYSTEM.slice(10) }
      ]);
    });

    test('an unconfirmed descriptor gets a byte-identical body, cache silently dropped', async () => {
      mockSseResponse(responsesDoneSse);
      const descriptor = makeOpenAiDescriptor({ id: 'groq' });

      const withCache = AiAssist.executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        clientTools: noClientTools,
        cache: { systemBreakpoints: [8], cacheKey: 'tenant-1' }
      });
      expect(withCache).toSucceed();
      if (withCache.isFailure()) return;
      await drain(withCache.value.events);
      await withCache.value.nextTurn;
      const withCacheBody = lastRequestBody();

      mockSseResponse(responsesDoneSse);
      const withoutCache = AiAssist.executeClientToolTurn({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        clientTools: noClientTools
      });
      expect(withoutCache).toSucceed();
      if (withoutCache.isFailure()) return;
      await drain(withoutCache.value.events);
      await withoutCache.value.nextTurn;

      expect(withCacheBody).toEqual(lastRequestBody());
    });
  });

  describe('multi-round validation (the point of this stream)', () => {
    test("each round validates cache against that round's own system, not a cached first-round result", async () => {
      // Catches: validating the plan once (e.g. against the first round's system) and reusing
      // that verdict on later rounds, instead of re-validating per call with that call's own
      // `system`. Round 1's system is long enough for the breakpoint; round 2's is not.
      const round1System = 'A'.repeat(20);
      const round2System = 'B'.repeat(10);
      const cache = { systemBreakpoints: [15] };

      mockSseResponse(anthropicDoneSse);
      const round1 = AiAssist.executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        system: round1System,
        messages: [{ role: 'user', content: USER }],
        clientTools: noClientTools,
        cache
      });
      expect(round1).toSucceed();
      if (round1.isFailure()) return;
      await drain(round1.value.events);
      expect(await round1.value.nextTurn).toSucceed();
      expect(lastRequestBody().system).toEqual([
        { type: 'text', text: round1System.slice(0, 15), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: round1System.slice(15) }
      ]);

      (global.fetch as jest.Mock).mockClear();
      const round2 = AiAssist.executeClientToolTurn({
        descriptor: makeAnthropicDescriptor(),
        apiKey: 'test-key',
        system: round2System,
        messages: [{ role: 'user', content: USER }],
        clientTools: noClientTools,
        cache
      });
      expect(round2).toSucceed();
      if (round2.isFailure()) return;
      await drain(round2.value.events);
      const round2Result = await round2.value.nextTurn;
      expect(round2Result).toFailWith(/integer strictly between/i);
      // The round-2 failure happens before any wire call for round 2 — proving the plan was
      // re-validated against round 2's own (shorter) system rather than reusing round 1's verdict.
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// callProxiedCompletionStream
// ============================================================================

describe('callProxiedCompletionStream cache', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('forwards cache as a plain body field, exactly as callProxiedCompletion does', async () => {
    // Catches: the streaming proxy silently dropping `cache` rather than making an explicit
    // decision about it (the #679 precedent this stream's brief calls out).
    mockSseResponse([`data: ${JSON.stringify({ type: 'done', truncated: false, fullText: '' })}\n\n`]);
    const result = await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      system: SYSTEM,
      messages: [{ role: 'user', content: USER }],
      cache: { systemBreakpoints: [8], cacheKey: 'tenant-7' }
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;
    await drain(result.value);
    expect(lastRequestBody().cache).toEqual({ systemBreakpoints: [8], cacheKey: 'tenant-7' });
  });

  test('omits cache from the body when none is supplied', async () => {
    mockSseResponse([`data: ${JSON.stringify({ type: 'done', truncated: false, fullText: '' })}\n\n`]);
    const result = await AiAssist.callProxiedCompletionStream('http://proxy.local:3001', {
      descriptor: makeAnthropicDescriptor(),
      apiKey: 'sk',
      system: SYSTEM,
      messages: [{ role: 'user', content: USER }]
    });
    expect(result).toSucceed();
    if (result.isFailure()) return;
    await drain(result.value);
    expect('cache' in lastRequestBody()).toBe(false);
  });
});
