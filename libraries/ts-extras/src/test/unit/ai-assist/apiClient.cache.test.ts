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
 * Tests for `IProviderCompletionParams.cache` — the C3 (emit) slice of
 * `ai-assist-prompt-caching`. Verifies the actual wire request bodies: Anthropic
 * `system` string becomes content blocks carrying `cache_control`, OpenAI Chat
 * Completions and Responses `system`/leading message become content parts
 * carrying `prompt_cache_breakpoint`, and `cacheKey` becomes `prompt_cache_key`.
 *
 * Per `TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is
 * never called" / `CODING_STANDARDS.md`'s caller-enumeration rule, these assert
 * the request body a mocked `fetch` actually receives — a response-side test
 * cannot see whether the blocks split correctly or concatenate back to the
 * original `system` string.
 */

/* eslint-disable @typescript-eslint/naming-convention -- wire field names are snake_case */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
import {
  anthropicResponse,
  makeDescriptor,
  mockFetchResponse,
  openAiResponse,
  responsesApiResponse
} from './apiClientFixtures';

const SYSTEM = 'ABCDEFGHIJKLMNOPQRST'; // length 20
const USER = 'What is the weather?';

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

describe('IProviderCompletionParams.cache', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Anthropic Messages', () => {
    const descriptor = makeDescriptor({ apiFormat: 'anthropic' });

    test('is byte-identical to a request predating cache support when cache is omitted', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }]
      });

      expect(result).toSucceed();
      expect(lastRequestBody().system).toBe(SYSTEM);
    });

    test('splits system into content blocks, with cache_control on each breakpoint-ending block', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15] }
      });

      expect(result).toSucceed();
      const system = lastRequestBody().system;
      expect(system).toEqual([
        { type: 'text', text: SYSTEM.slice(0, 8), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: SYSTEM.slice(8, 15), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: SYSTEM.slice(15) }
      ]);
    });

    test('the content blocks concatenate back to the original system string exactly', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [3, 11, 17] }
      });

      const system = lastRequestBody().system as Array<{ text: string }>;
      expect(system.map((block) => block.text).join('')).toBe(SYSTEM);
    });

    test('a single breakpoint produces exactly one cache_control block and one plain tail block', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [10] }
      });

      const system = lastRequestBody().system as Array<Record<string, unknown>>;
      expect(system).toHaveLength(2);
      expect(system[0].cache_control).toEqual({ type: 'ephemeral' });
      expect(system[1].cache_control).toBeUndefined();
    });

    test('fails loudly on a non-ascending offset rather than sending an invalid request', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [10, 5] }
      });

      expect(result).toFailWith(/strictly ascending/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('fails loudly on an out-of-range offset rather than clamping it', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [SYSTEM.length + 5] }
      });

      expect(result).toFailWith(/integer strictly between/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('ignores cacheKey — Anthropic has no cache-routing-key concept', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { cacheKey: 'tenant-1' }
      });

      const body = lastRequestBody();
      expect(body.system).toBe(SYSTEM);
      expect('prompt_cache_key' in body).toBe(false);
    });
  });

  describe('OpenAI Chat Completions', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai', id: 'openai' });

    test('is byte-identical to a request predating cache support when cache is omitted', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }]
      });

      const messages = lastRequestBody().messages as Array<Record<string, unknown>>;
      expect(messages[0]).toEqual({ role: 'system', content: SYSTEM });
    });

    test('splits the leading system message into text parts carrying prompt_cache_breakpoint', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15] }
      });

      const messages = lastRequestBody().messages as Array<{ role: string; content: unknown }>;
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toEqual([
        { type: 'text', text: SYSTEM.slice(0, 8), prompt_cache_breakpoint: { mode: 'explicit' } },
        { type: 'text', text: SYSTEM.slice(8, 15), prompt_cache_breakpoint: { mode: 'explicit' } },
        { type: 'text', text: SYSTEM.slice(15) }
      ]);
    });

    test('never sends prompt_cache_options — implicit caching stays the provider default', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8] }
      });

      expect('prompt_cache_options' in lastRequestBody()).toBe(false);
    });

    test('sends prompt_cache_key when cacheKey is supplied', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { cacheKey: 'tenant-1' }
      });

      expect(lastRequestBody().prompt_cache_key).toBe('tenant-1');
    });

    test('omits prompt_cache_key when cache is omitted', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }]
      });

      expect('prompt_cache_key' in lastRequestBody()).toBe(false);
    });

    test('fails loudly on an invalid breakpoint plan', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [0] }
      });

      expect(result).toFailWith(/integer strictly between/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('OpenAI / xAI Responses API', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai', id: 'openai', supportedTools: ['web_search'] });

    test('is byte-identical to a request predating cache support when cache is omitted', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }]
      });

      const input = lastRequestBody().input as Array<Record<string, unknown>>;
      expect(input[0]).toEqual({ role: 'system', content: SYSTEM });
    });

    test('splits the leading system item into input_text parts carrying prompt_cache_breakpoint', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { systemBreakpoints: [12] }
      });

      const input = lastRequestBody().input as Array<{ role: string; content: unknown }>;
      expect(input[0].content).toEqual([
        { type: 'input_text', text: SYSTEM.slice(0, 12), prompt_cache_breakpoint: { mode: 'explicit' } },
        { type: 'input_text', text: SYSTEM.slice(12) }
      ]);
    });

    test('sends prompt_cache_key when cacheKey is supplied', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { cacheKey: 'tenant-9' }
      });

      expect(lastRequestBody().prompt_cache_key).toBe('tenant-9');
    });

    test('fails loudly on an invalid breakpoint plan', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { systemBreakpoints: [SYSTEM.length] }
      });

      expect(result).toFailWith(/integer strictly between/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('cache gating on the shared apiFormat: openai dispatch', () => {
    // Supports neither breakpoints nor a routing key — the request must be byte-identical to one
    // built with no `cache` at all. `makeDescriptor`'s default id is 'xai-grok', which now DOES
    // carry a routing key, so an unconfirmed descriptor has to be named explicitly.
    const unconfirmedDescriptor = makeDescriptor({ apiFormat: 'openai', id: 'groq' });
    const xaiDescriptor = makeDescriptor({ apiFormat: 'openai' });

    test('Chat Completions: a supplied cache is silently dropped for an unconfirmed descriptor', async () => {
      mockFetchResponse(openAiResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: unconfirmedDescriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15], cacheKey: 'tenant-1' }
      });

      expect(result).toSucceed();
      const body = lastRequestBody();
      const messages = body.messages as Array<Record<string, unknown>>;
      expect(messages[0]).toEqual({ role: 'system', content: SYSTEM });
      expect('prompt_cache_key' in body).toBe(false);

      // Headers matter as much as the body: a routing gate keyed off `apiFormat` rather than
      // `id` would leak the key to every openai-compatible descriptor through the header, and a
      // body-only assertion cannot see that. Compare against a real no-cache request rather than
      // a hand-listed header set, so this cannot drift as auth headers change.
      const withCacheHeaders = lastRequestHeaders();
      mockFetchResponse(openAiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor: unconfirmedDescriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }]
      });
      expect(withCacheHeaders).toEqual(lastRequestHeaders());
      expect(body).toEqual(lastRequestBody());
    });

    test('xAI Chat Completions: carries cacheKey as the x-grok-conv-id header, not a body field', async () => {
      mockFetchResponse(openAiResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: xaiDescriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15], cacheKey: 'tenant-1' }
      });

      expect(result).toSucceed();
      // The routing key rides in the header xAI documents for this route...
      expect(lastRequestHeaders()['x-grok-conv-id']).toBe('tenant-1');
      const body = lastRequestBody();
      // ...and NOT in the body, where it would be an unrecognized field.
      expect('prompt_cache_key' in body).toBe(false);
      // Breakpoints remain withheld — xAI has no prompt_cache_breakpoint support, and the
      // system message must be the plain string it was before this feature existed.
      const messages = body.messages as Array<Record<string, unknown>>;
      expect(messages[0]).toEqual({ role: 'system', content: SYSTEM });
    });

    test('xAI Responses: carries cacheKey as prompt_cache_key, with no breakpoints', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({ apiFormat: 'openai', supportedTools: ['web_search'] }),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { systemBreakpoints: [8], cacheKey: 'tenant-9' }
      });

      expect(result).toSucceed();
      const body = lastRequestBody();
      // The Responses route takes the key in the body on every provider that supports it.
      expect(body.prompt_cache_key).toBe('tenant-9');
      expect('x-grok-conv-id' in lastRequestHeaders()).toBe(false);
      const input = body.input as Array<Record<string, unknown>>;
      expect(input[0]).toEqual({ role: 'system', content: SYSTEM });
    });

    test('xAI: a cache carrying only breakpoints changes nothing on the wire', async () => {
      mockFetchResponse(openAiResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: xaiDescriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [8, 15] }
      });

      expect(result).toSucceed();
      const body = lastRequestBody();
      expect('prompt_cache_key' in body).toBe(false);
      expect('x-grok-conv-id' in lastRequestHeaders()).toBe(false);
      expect((body.messages as Array<Record<string, unknown>>)[0]).toEqual({
        role: 'system',
        content: SYSTEM
      });
    });

    test('OpenAI Chat Completions: carries cacheKey in the body, never as a header', async () => {
      mockFetchResponse(openAiResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({ apiFormat: 'openai', id: 'openai' }),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { cacheKey: 'tenant-2' }
      });

      expect(result).toSucceed();
      expect(lastRequestBody().prompt_cache_key).toBe('tenant-2');
      expect('x-grok-conv-id' in lastRequestHeaders()).toBe(false);
    });

    test('Responses API: a supplied cache is silently dropped for an unconfirmed descriptor', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({ apiFormat: 'openai', id: 'groq', supportedTools: ['web_search'] }),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }],
        cache: { systemBreakpoints: [8], cacheKey: 'tenant-1' }
      });

      expect(result).toSucceed();
      const body = lastRequestBody();
      const input = body.input as Array<Record<string, unknown>>;
      expect(input[0]).toEqual({ role: 'system', content: SYSTEM });
      expect('prompt_cache_key' in body).toBe(false);

      // Same byte-identical comparison as the Chat Completions case above.
      const withCacheHeaders = lastRequestHeaders();
      mockFetchResponse(responsesApiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({ apiFormat: 'openai', id: 'groq', supportedTools: ['web_search'] }),
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        tools: [{ type: 'web_search' }]
      });
      expect(withCacheHeaders).toEqual(lastRequestHeaders());
      expect(body).toEqual(lastRequestBody());
    });

    test('an invalid breakpoint plan on an unconfirmed descriptor is silently dropped rather than validated', async () => {
      // Gating happens before validation runs (the gated `cache` reaching the builder is
      // `undefined`), so a plan that would fail AiAssist.validateCacheBreakpoints on 'openai'
      // simply never reaches validation on a descriptor that never receives `cache` at all.
      mockFetchResponse(openAiResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor: unconfirmedDescriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [0] }
      });

      expect(result).toSucceed();
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Gemini generateContent', () => {
    test('ignores cache — no breakpoint mechanism, systemInstruction is unaffected', async () => {
      const descriptor = makeDescriptor({ apiFormat: 'gemini' });
      mockFetchResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: SYSTEM,
        messages: [{ role: 'user', content: USER }],
        cache: { systemBreakpoints: [5], cacheKey: 'tenant-1' }
      });

      expect(result).toSucceed();
      expect(lastRequestBody().systemInstruction).toEqual({ parts: [{ text: SYSTEM }] });
    });
  });
});
