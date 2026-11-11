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
 * Request-body tests, against the shipped registry, for claude-fable-5-2 and claude-mythos-5-2: the
 * `@anthropic:fable` alias target, and every per-model declaration the two ids must be covered by.
 * Both share Claude Fable 5.1's request surface (always-on adaptive thinking, no forced tool_choice,
 * no non-default sampling parameters, 128K max output).
 */

import '@fgv/ts-utils-jest';

import { JsonSchema } from '@fgv/ts-json-base';

import { AiAssist } from '../../..';

const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');
const fooSchema = JsonSchema.object({ foo: JsonSchema.string() });
const anthropic = AiAssist.getProviderDescriptor('anthropic').orThrow();

const IDS_52: ReadonlyArray<string> = ['claude-fable-5-2', 'claude-mythos-5-2'];

/** A thinking-model reply: an empty-text thinking block (the default display) then the answer. */
const thinkingThenText = {
  content: [
    { type: 'thinking', thinking: '', signature: 'sig' },
    { type: 'text', text: '{"foo":"bar"}' }
  ],
  stop_reason: 'end_turn'
};

function mockJson(response: unknown): void {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response))
  });
}

function sentBody(): Record<string, unknown> {
  return JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body) as Record<string, unknown>;
}

describe('Claude Fable 5.2 and Claude Mythos 5.2', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('@anthropic:fable resolves to claude-fable-5-2 and is sent as that id', async () => {
    expect(AiAssist.resolveProviderModel(anthropic, '@anthropic:fable', undefined)).toSucceedWith(
      'claude-fable-5-2'
    );
    mockJson(thinkingThenText);
    expect(
      await AiAssist.callProviderCompletion({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: '@anthropic:fable'
      })
    ).toSucceed();
    expect(sentBody().model).toBe('claude-fable-5-2');
  });

  describe.each(['@anthropic:fable', ...IDS_52])('%s', (model) => {
    test('structured output uses output_config.format with no tool_choice', async () => {
      mockJson(thinkingThenText);
      const result = await AiAssist.callProviderCompletion({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: model,
        structuredOutput: { mode: 'schema', schema: fooSchema, onUnsupported: 'fail' }
      });
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.structuredOutput).toBe('schema');
        expect(r.content).toBe('{"foo":"bar"}');
      });
      const body = sentBody();
      expect(body.output_config).toEqual({ format: { type: 'json_schema', schema: fooSchema.toJson() } });
      expect('tool_choice' in body).toBe(false);
      expect('tools' in body).toBe(false);
    });

    test("effort 'none' is sent as adaptive 'low'", async () => {
      mockJson(thinkingThenText);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          thinking: { effort: 'none' }
        })
      ).toSucceed();
      const body = sentBody();
      expect(body.thinking).toEqual({ type: 'adaptive' });
      expect(body.output_config).toEqual({ effort: 'low' });
    });

    test("effort 'none' with onUnsupported 'fail' is refused before the wire", async () => {
      mockJson(thinkingThenText);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          thinking: { effort: 'none', onUnsupported: 'fail' }
        })
      ).toFail();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('a non-default temperature is refused before the wire', async () => {
      mockJson(thinkingThenText);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 0.3
        })
      ).toFailWith(/does not accept a non-default temperature \(0\.3\): remove temperature, or send 1/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('the default temperature, 1, is still sent', async () => {
      mockJson(thinkingThenText);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1
        })
      ).toSucceed();
      expect(sentBody().temperature).toBe(1);
    });

    test('resolveMaxOutputTokens returns 128000', () => {
      expect(AiAssist.resolveMaxOutputTokens(anthropic, model)).toBe(128000);
    });
  });

  // These take a resolved model id, not an alias.
  test.each(IDS_52)('%s is an adaptive, thinking-required model', (model) => {
    expect(AiAssist.isAdaptiveThinkingModel(anthropic, model)).toBe(true);
    expect(AiAssist.isThinkingRequiredModel(anthropic, model)).toBe(true);
  });

  async function listedCapabilities(ids: ReadonlyArray<string>): Promise<Map<string, string[]>> {
    mockJson({ data: ids.map((id) => ({ id })) });
    const listed = await AiAssist.callProviderListModels({ descriptor: anthropic, apiKey: 'k' });
    return new Map(listed.orThrow().map((m) => [m.id, [...m.capabilities].sort()]));
  }

  test('model listing tags both 5.2 ids as chat, tools, vision and thinking', async () => {
    const byId = await listedCapabilities(IDS_52);
    for (const id of IDS_52) {
      expect(byId.get(id)).toEqual(['chat', 'thinking', 'tools', 'vision']);
    }
  });

  // The Mythos rules are per point release, so they must not reach another id that merely starts
  // with the same characters (a dated claude-mythos-5 snapshot, say).
  test.each(['claude-mythos-5-20260601', 'claude-mythos-5-10'])(
    'model listing does not stretch the Mythos rules to %s',
    async (id) => {
      const byId = await listedCapabilities([id]);
      expect(byId.get(id)).toEqual(['chat', 'tools', 'vision']);
    }
  );

  test('the thinking-model name union names both 5.2 ids', () => {
    const names: ReadonlyArray<AiAssist.AnthropicThinkingModelNames> = [
      'claude-fable-5-2',
      'claude-mythos-5-2'
    ];
    expect(names).toHaveLength(2);
  });
});
