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

const testPrompt = new AiAssist.AiPrompt('Generate a recipe', 'You are a helpful assistant');

function makeDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4-1-fast',
    ...overrides
  };
}

function mockFetchResponse(body: unknown, status: number = 200): void {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

function mockFetchError(error: Error): void {
  (global.fetch as jest.Mock).mockRejectedValue(error);
}

function mockFetchHttpError(status: number, errorText: string): void {
  const response = {
    ok: false,
    status,
    text: jest.fn().mockResolvedValue(errorText)
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

// ============================================================================
// OpenAI response helpers
// ============================================================================

function openAiResponse(content: string, finishReason: string = 'stop'): unknown {
  return {
    choices: [
      {
        message: { content },
        finish_reason: finishReason
      }
    ]
  };
}

// ============================================================================
// Anthropic response helpers
// ============================================================================

function anthropicResponse(text: string, stopReason: string = 'end_turn'): unknown {
  return {
    content: [{ text }],
    stop_reason: stopReason
  };
}

// ============================================================================
// Gemini response helpers
// ============================================================================

function geminiResponse(text: string, finishReason: string = 'STOP'): unknown {
  return {
    candidates: [
      {
        content: {
          parts: [{ text }]
        },
        finishReason
      }
    ]
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('callProviderCompletion', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ==========================================================================
  // Common error paths
  // ==========================================================================

  describe('common validation', () => {
    test('fails when descriptor has no baseUrl', async () => {
      const descriptor = makeDescriptor({ baseUrl: '' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/no API endpoint/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/ECONNREFUSED/);
    });

    test('handles non-Error fetch rejection', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('network down');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/network down/);
    });

    test('fails when API returns non-200 status', async () => {
      mockFetchHttpError(429, 'Rate limit exceeded');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/429/);
    });

    test('fails when API returns invalid JSON', async () => {
      const response = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'))
      };
      (global.fetch as jest.Mock).mockResolvedValue(response);
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/invalid JSON/i);
    });

    test('fails when API returns non-object JSON', async () => {
      mockFetchResponse('just a string');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/non-object JSON/i);
    });

    test('uses modelOverride when provided', async () => {
      mockFetchResponse(openAiResponse('hello'));
      const descriptor = makeDescriptor();

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        modelOverride: 'custom-model'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('custom-model');
    });
  });

  // ==========================================================================
  // OpenAI-compatible (xAI, OpenAI, Groq, Mistral)
  // ==========================================================================

  describe('openai format', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai' });

    test('returns completion content on success', async () => {
      mockFetchResponse(openAiResponse('Here is a recipe for chocolate truffles'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Here is a recipe for chocolate truffles');
        expect(response.truncated).toBe(false);
      });
    });

    test('detects truncation via finish_reason=length', async () => {
      mockFetchResponse(openAiResponse('partial...', 'length'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(true);
      });
    });

    test('sends correct request structure', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        temperature: 0.5
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/chat/completions');
      // eslint-disable-next-line dot-notation
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer test-key');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('grok-4-1-fast');
      expect(body.temperature).toBe(0.5);
      expect(body.messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Generate a recipe' }
      ]);
    });

    test('includes additional messages', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        additionalMessages: [
          { role: 'assistant', content: 'first attempt' },
          { role: 'user', content: 'try again' }
        ]
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages).toHaveLength(4);
      expect(body.messages[2]).toEqual({ role: 'assistant', content: 'first attempt' });
      expect(body.messages[3]).toEqual({ role: 'user', content: 'try again' });
    });

    test('fails when response has invalid structure', async () => {
      mockFetchResponse({ choices: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/OpenAI API response/i);
    });
  });

  // ==========================================================================
  // Anthropic
  // ==========================================================================

  describe('anthropic format', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-5-20250929'
    });

    test('returns completion content on success', async () => {
      mockFetchResponse(anthropicResponse('Claude says hello'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Claude says hello');
        expect(response.truncated).toBe(false);
      });
    });

    test('detects truncation via stop_reason=max_tokens', async () => {
      mockFetchResponse(anthropicResponse('partial...', 'max_tokens'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(true);
      });
    });

    test('sends correct request structure', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.anthropic.com/v1/messages');
      expect(fetchCall[1].headers['x-api-key']).toBe('test-key');
      expect(fetchCall[1].headers['anthropic-version']).toBe('2023-06-01');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.system).toBe('You are a helpful assistant');
      expect(body.messages[0]).toEqual({ role: 'user', content: 'Generate a recipe' });
      expect(body.max_tokens).toBe(4096);
    });

    test('filters system role from additional messages', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        additionalMessages: [
          { role: 'assistant', content: 'first attempt' },
          { role: 'system', content: 'should be skipped' },
          { role: 'user', content: 'try again' }
        ]
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      // user + assistant + user (system filtered out)
      expect(body.messages).toHaveLength(3);
      expect(body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user']);
    });

    test('fails when response has invalid structure', async () => {
      mockFetchResponse({ content: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/Anthropic API response/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('Connection timeout'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/Connection timeout/);
    });
  });

  // ==========================================================================
  // Google Gemini
  // ==========================================================================

  describe('gemini format', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash'
    });

    test('returns completion content on success', async () => {
      mockFetchResponse(geminiResponse('Gemini says hello'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Gemini says hello');
        expect(response.truncated).toBe(false);
      });
    });

    test('detects truncation via finishReason=MAX_TOKENS', async () => {
      mockFetchResponse(geminiResponse('partial...', 'MAX_TOKENS'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(true);
      });
    });

    test('sends correct request structure', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
      );
      expect(fetchCall[1].headers['x-goog-api-key']).toBe('test-key');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.systemInstruction).toEqual({ parts: [{ text: 'You are a helpful assistant' }] });
      expect(body.contents[0]).toEqual({ role: 'user', parts: [{ text: 'Generate a recipe' }] });
      expect(body.generationConfig.temperature).toBe(0.7);
    });

    test('maps assistant role to model and filters system', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        additionalMessages: [
          { role: 'assistant', content: 'first attempt' },
          { role: 'system', content: 'should be skipped' },
          { role: 'user', content: 'try again' }
        ]
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      // user + model + user (system filtered, assistant mapped to model)
      expect(body.contents).toHaveLength(3);
      expect(body.contents[1]).toEqual({ role: 'model', parts: [{ text: 'first attempt' }] });
      expect(body.contents[2]).toEqual({ role: 'user', parts: [{ text: 'try again' }] });
    });

    test('fails when response has invalid structure', async () => {
      mockFetchResponse({ candidates: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/Gemini API response/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('DNS resolution failed'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/DNS resolution failed/);
    });
  });
});
