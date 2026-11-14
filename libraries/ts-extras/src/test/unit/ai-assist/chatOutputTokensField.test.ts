/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Request-body tests, against the shipped registry: the Chat Completions output-token field each
 * OpenAI-format provider is sent, on the completion and the streaming paths.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';

const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');

function mockJson(): void {
  const response = { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] };
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response))
  });
}

function mockSse(): void {
  const encoder = new TextEncoder();
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }),
      text: jest.fn().mockResolvedValue(''),
      headers: new Map([['content-type', 'text/event-stream']])
    })
  );
}

function sentBody(): Record<string, unknown> {
  return JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body) as Record<string, unknown>;
}

async function drain(iter: AsyncIterable<AiAssist.IAiStreamEvent>): Promise<number> {
  let count = 0;
  for await (const event of iter) {
    count += event.type.length > 0 ? 1 : 0;
  }
  return count;
}

// Groq and xAI: "Deprecated in favor of max_completion_tokens" in each API reference (fetched
// 2026-11-11). Mistral and Ollama document only max_tokens; openai-compat is any server.
const cases: ReadonlyArray<[AiAssist.AiProviderId, string, string]> = [
  ['openai', 'gpt-6-luna', 'max_completion_tokens'],
  ['groq', 'openai/gpt-oss-120b', 'max_completion_tokens'],
  ['xai-grok', 'grok-4.3', 'max_completion_tokens'],
  ['mistral', 'mistral-large-4', 'max_tokens'],
  ['ollama', 'llama3', 'max_tokens'],
  ['openai-compat', 'local-model', 'max_tokens']
];

function descriptorFor(id: AiAssist.AiProviderId): AiAssist.IAiProviderDescriptor {
  const descriptor = AiAssist.getProviderDescriptor(id).orThrow();
  // openai-compat ships with no base URL: the caller supplies its server's. xAI's browser CORS
  // restriction routes streaming through a proxy, which says nothing about the body sent.
  return {
    ...descriptor,
    baseUrl: descriptor.baseUrl === '' ? 'http://localhost:8000/v1' : descriptor.baseUrl,
    streamingCorsRestricted: false
  };
}

describe('Chat Completions output-token field, per registered provider', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test.each(cases)('callProviderCompletion sends %s (%s) maxTokens as %s', async (id, model, field) => {
    mockJson();
    expect(
      await AiAssist.callProviderCompletion({
        descriptor: descriptorFor(id),
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: model,
        maxTokens: 512
      })
    ).toSucceed();
    const other = field === 'max_tokens' ? 'max_completion_tokens' : 'max_tokens';
    expect(sentBody()[field]).toBe(512);
    expect(sentBody()[other]).toBeUndefined();
  });

  test.each(cases)('callProviderCompletionStream sends %s (%s) maxTokens as %s', async (id, model, field) => {
    mockSse();
    const result = await AiAssist.callProviderCompletionStream({
      descriptor: descriptorFor(id),
      apiKey: 'k',
      ...prompt.toRequest(),
      modelOverride: model,
      maxTokens: 512
    });
    await drain(result.orThrow());
    const other = field === 'max_tokens' ? 'max_completion_tokens' : 'max_tokens';
    expect(sentBody()[field]).toBe(512);
    expect(sentBody()[other]).toBeUndefined();
  });
});
