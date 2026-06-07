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

import { Conversion, Converters as BaseConverters, fail, succeed } from '@fgv/ts-utils';
import type { Converter, Result } from '@fgv/ts-utils';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

interface IShape {
  name: string;
  value: number;
}

const shapeConverter = BaseConverters.object<IShape>({
  name: BaseConverters.string,
  value: BaseConverters.number
});

function makeDescriptor(): IAiProviderDescriptor {
  return {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4-1-fast',
    supportedTools: ['web_search'],
    corsRestricted: true,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional'
  };
}

function mockOpenAiContent(content: string): void {
  const body = {
    choices: [{ message: { content }, finish_reason: 'stop' }]
  };
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  });
}

function lastRequestBody(): { messages: Array<{ role: string; content: string }> } {
  const fetchMock = global.fetch as jest.Mock;
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('generateJsonCompletion', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns the validated value, raw text, and underlying response on success', async () => {
    mockOpenAiContent('{"name":"x","value":1}');
    const result = await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('Generate a thing', 'You are a helpful assistant').toRequest(),
      converter: shapeConverter
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.value).toEqual({ name: 'x', value: 1 });
      expect(r.raw).toBe('{"name":"x","value":1}');
      expect(r.response.content).toBe('{"name":"x","value":1}');
      expect(r.response.truncated).toBe(false);
    });
  });

  test('tolerates fences and prose in the model output by default', async () => {
    mockOpenAiContent('Sure! Here\'s the JSON:\n```json\n{"name":"x","value":1}\n```\nThanks!');
    const result = await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('Generate a thing', 'You are a helpful assistant').toRequest(),
      converter: shapeConverter
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.value).toEqual({ name: 'x', value: 1 });
    });
  });

  test('appends the smart prompt hint to the system message by default', async () => {
    mockOpenAiContent('{"name":"x","value":1}');
    await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', 'system base').toRequest(),
      converter: shapeConverter
    });
    const body = lastRequestBody();
    const system = body.messages.find((m) => m.role === 'system');
    expect(system).toBeDefined();
    expect(system!.content).toContain('system base');
    expect(system!.content).toContain(AiAssist.SMART_JSON_PROMPT_HINT);
  });

  test("does not modify the system prompt when promptHint is 'none'", async () => {
    mockOpenAiContent('{"name":"x","value":1}');
    await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', 'system base').toRequest(),
      converter: shapeConverter,
      promptHint: 'none'
    });
    const body = lastRequestBody();
    const system = body.messages.find((m) => m.role === 'system');
    expect(system!.content).toBe('system base');
  });

  test('appends a custom string prompt hint when supplied', async () => {
    mockOpenAiContent('{"name":"x","value":1}');
    await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', 'system base').toRequest(),
      converter: shapeConverter,
      promptHint: 'JSON only please.'
    });
    const body = lastRequestBody();
    const system = body.messages.find((m) => m.role === 'system');
    expect(system!.content).toContain('system base');
    expect(system!.content).toContain('JSON only please.');
  });

  test('uses the smart hint as the entire system prompt when none was provided', async () => {
    mockOpenAiContent('{"name":"x","value":1}');
    await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', '').toRequest(),
      converter: shapeConverter
    });
    const body = lastRequestBody();
    const system = body.messages.find((m) => m.role === 'system');
    expect(system!.content).toBe(AiAssist.SMART_JSON_PROMPT_HINT);
  });

  test('honors a caller-supplied jsonConverter override', async () => {
    mockOpenAiContent('Custom payload');

    let called = 0;
    const customPipeline: Converter<IShape> = new Conversion.BaseConverter<IShape>(
      (from: unknown): Result<IShape> => {
        called++;
        if (from === 'Custom payload') {
          return succeed({ name: 'custom', value: 99 });
        }
        return fail('unexpected payload');
      }
    );

    const result = await AiAssist.generateJsonCompletion<IShape>({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', 'system base').toRequest(),
      jsonConverter: customPipeline
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.value).toEqual({ name: 'custom', value: 99 });
      expect(r.raw).toBe('Custom payload');
    });
    expect(called).toBe(1);
  });

  test('fails when neither converter nor jsonConverter is supplied', async () => {
    const result = await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', 'system base').toRequest()
    });
    expect(result).toFailWith(/converter or jsonConverter must be provided/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('propagates upstream completion failures', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('boom')
    });
    const result = await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', 'system base').toRequest(),
      converter: shapeConverter
    });
    expect(result).toFailWith(/AI API returned 500/);
  });

  test('decorates downstream conversion failures with a generateJsonCompletion prefix', async () => {
    mockOpenAiContent('not json at all');
    const result = await AiAssist.generateJsonCompletion({
      descriptor: makeDescriptor(),
      apiKey: 'k',
      ...new AiAssist.AiPrompt('user request', 'system base').toRequest(),
      converter: shapeConverter
    });
    expect(result).toFailWith(/^generateJsonCompletion:/);
  });
});
