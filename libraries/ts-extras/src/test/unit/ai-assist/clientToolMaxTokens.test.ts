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
 * Tests for `maxTokens` threading on the client-tool (`executeClientToolTurn`)
 * path — split into its own file (rather than added to
 * `clientToolContinuationBuilder.test.ts`) to keep that file under the repo's
 * max-lines lint threshold, mirroring `clientToolAdaptiveThinking.test.ts`.
 */

import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import { executeClientToolTurn } from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiClientTool, IAiProviderDescriptor, IAiStreamEvent } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AiPrompt, DEFAULT_ANTHROPIC_MAX_TOKENS } from '../../../packlets/ai-assist/model';

const testPrompt = new AiPrompt('hello', 'system');

function makeAnthropicDescriptor(): IAiProviderDescriptor {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    buttonLabel: 'Anthropic',
    needsSecret: true,
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'optional'
  };
}

function makeOpenAiDescriptor(): IAiProviderDescriptor {
  return {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported'
  };
}

function makeGeminiDescriptor(): IAiProviderDescriptor {
  return {
    id: 'google-gemini',
    label: 'Gemini',
    buttonLabel: 'Gemini',
    needsSecret: true,
    apiFormat: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    supportedTools: ['web_search'],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'optional'
  };
}

async function collect(iter: AsyncIterable<IAiStreamEvent>): Promise<IAiStreamEvent[]> {
  const out: IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}

/** Terminal SSE line that satisfies each per-format adapter's "stream completed" condition. */
const terminalSseLineByFormat: Record<'anthropic' | 'openai' | 'gemini', string> = {
  anthropic: 'event: message_stop\ndata: {}\n\n',
  openai: `event: response.completed\ndata: ${JSON.stringify({ response: { status: 'completed' } })}\n\n`,
  gemini: `data: ${JSON.stringify({
    candidates: [{ content: { parts: [{ text: '' }] }, finishReason: 'STOP' }]
  })}\n\n`
};

describe('executeClientToolTurn — maxTokens threading', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function captureBody(params: {
    readonly descriptor: IAiProviderDescriptor;
    readonly format: 'anthropic' | 'openai' | 'gemini';
    readonly maxTokens?: number;
  }): Promise<Record<string, unknown> | undefined> {
    let capturedBody: Record<string, unknown> | undefined;
    const encoder = new TextEncoder();
    (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
      const init = args[1] as RequestInit;
      capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;
      const body = new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          controller.enqueue(encoder.encode(terminalSseLineByFormat[params.format]));
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

    const result = executeClientToolTurn({
      descriptor: params.descriptor,
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      clientTools: [] as IAiClientTool[],
      model: params.descriptor.defaultModel as string,
      ...(params.maxTokens !== undefined ? { maxTokens: params.maxTokens } : {})
    });
    expect(result).toSucceed();
    if (result.isFailure()) return undefined;
    await collect(result.value.events);
    return capturedBody;
  }

  describe('Anthropic', () => {
    test('defaults max_tokens to DEFAULT_ANTHROPIC_MAX_TOKENS when maxTokens is not provided', async () => {
      const body = await captureBody({ descriptor: makeAnthropicDescriptor(), format: 'anthropic' });
      expect(body?.max_tokens).toBe(DEFAULT_ANTHROPIC_MAX_TOKENS);
    });

    test('overrides max_tokens with the caller-supplied maxTokens', async () => {
      const body = await captureBody({
        descriptor: makeAnthropicDescriptor(),
        format: 'anthropic',
        maxTokens: 16000
      });
      expect(body?.max_tokens).toBe(16000);
    });
  });

  describe('OpenAI (client-tool turns always route through the Responses API)', () => {
    test('omits max_output_tokens when maxTokens is not provided', async () => {
      const body = await captureBody({ descriptor: makeOpenAiDescriptor(), format: 'openai' });
      expect(body?.max_output_tokens).toBeUndefined();
    });

    test('sends maxTokens as max_output_tokens', async () => {
      const body = await captureBody({
        descriptor: makeOpenAiDescriptor(),
        format: 'openai',
        maxTokens: 9000
      });
      expect(body?.max_output_tokens).toBe(9000);
      expect(body?.max_completion_tokens).toBeUndefined();
      expect(body?.max_tokens).toBeUndefined();
    });
  });

  describe('Gemini', () => {
    test('omits generationConfig.maxOutputTokens when maxTokens is not provided', async () => {
      const body = await captureBody({ descriptor: makeGeminiDescriptor(), format: 'gemini' });
      expect(
        (body?.generationConfig as Record<string, unknown> | undefined)?.maxOutputTokens
      ).toBeUndefined();
    });

    test('sends maxTokens as generationConfig.maxOutputTokens', async () => {
      const body = await captureBody({
        descriptor: makeGeminiDescriptor(),
        format: 'gemini',
        maxTokens: 12000
      });
      expect((body?.generationConfig as Record<string, unknown> | undefined)?.maxOutputTokens).toBe(12000);
    });
  });
});
