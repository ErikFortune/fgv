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
 * Tests for the Anthropic adaptive-thinking wire shape on the client-tool
 * (`executeClientToolTurn`) path — split out of `clientToolContinuationBuilder.test.ts`
 * to keep that file under the repo's max-lines lint threshold.
 *
 * The Claude 5 family (`claude-sonnet-5`, `claude-opus-5`, `claude-fable-5`, including
 * dated snapshots) rejects the legacy `thinking.type: 'enabled'` shape with an HTTP 400 and
 * requires `thinking.type: 'adaptive'` + top-level `output_config.effort`; older models keep
 * the legacy `thinking.type: 'enabled'` + `budget_tokens` shape. See `AiAssist.isAdaptiveThinkingModel`.
 */

import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import { executeClientToolTurn } from '../../../packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiClientTool, IAiProviderDescriptor, IAiStreamEvent } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AiPrompt } from '../../../packlets/ai-assist/model';

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

async function collect(iter: AsyncIterable<IAiStreamEvent>): Promise<IAiStreamEvent[]> {
  const out: IAiStreamEvent[] = [];
  for await (const event of iter) {
    out.push(event);
  }
  return out;
}

describe('executeClientToolTurn — Anthropic adaptive thinking wire shape', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function captureBody(params: {
    readonly descriptor: IAiProviderDescriptor;
    readonly model: string;
  }): Promise<Record<string, unknown> | undefined> {
    let capturedBody: Record<string, unknown> | undefined;
    const encoder = new TextEncoder();
    (global.fetch as jest.Mock).mockImplementation((...args: unknown[]) => {
      const init = args[1] as RequestInit;
      capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;
      const body = new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          controller.enqueue(encoder.encode('event: message_stop\ndata: {}\n\n'));
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
      model: params.model,
      resolvedThinking: { anthropicEffort: 'medium' }
    });
    expect(result).toSucceed();
    if (result.isFailure()) return undefined;
    await collect(result.value.events);
    return capturedBody;
  }

  test('Claude 5 id sends the adaptive shape (thinking.type: adaptive + output_config.effort, no budget_tokens)', async () => {
    const descriptor: IAiProviderDescriptor = {
      ...makeAnthropicDescriptor(),
      adaptiveThinkingModelPrefixes: ['claude-sonnet-5']
    };
    const body = await captureBody({ descriptor, model: 'claude-sonnet-5' });

    expect(body?.thinking).toEqual({ type: 'adaptive' });
    expect(body?.output_config).toEqual({ effort: 'medium' });
    expect((body?.thinking as Record<string, unknown> | undefined)?.budget_tokens).toBeUndefined();
  });

  test('a dated Claude 5 snapshot id (dash-bounded prefix match) also sends the adaptive shape', async () => {
    const descriptor: IAiProviderDescriptor = {
      ...makeAnthropicDescriptor(),
      adaptiveThinkingModelPrefixes: ['claude-opus-5']
    };
    const body = await captureBody({ descriptor, model: 'claude-opus-5-20260115' });

    expect(body?.thinking).toEqual({ type: 'adaptive' });
    expect(body?.output_config).toEqual({ effort: 'medium' });
  });

  test('a 4.x id keeps the legacy shape unchanged (thinking.type: enabled + budget_tokens, no output_config)', async () => {
    const descriptor: IAiProviderDescriptor = {
      ...makeAnthropicDescriptor(),
      adaptiveThinkingModelPrefixes: ['claude-sonnet-5']
    };
    const body = await captureBody({ descriptor, model: 'claude-sonnet-4-6' });

    expect(body?.thinking).toEqual({ type: 'enabled', budget_tokens: 8192 });
    expect(body?.output_config).toBeUndefined();
  });
});
