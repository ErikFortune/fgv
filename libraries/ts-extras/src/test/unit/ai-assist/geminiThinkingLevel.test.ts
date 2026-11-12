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
 * Request-body tests, against the shipped registry, for Gemini's `thinkingLevel` wire: which models
 * are sent a level, what each generic effort becomes there, the explicit `thinkingLevel` block, and
 * the `@google-gemini:pro` rotation to `gemini-4-argon`. Models with no level declaration keep the
 * `thinkingBudget` wire exactly.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { callGeminiStream } from '../../../packlets/ai-assist/streamingAdapters/gemini';

const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');
const geminiOk = { candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }] };

function gemini(): AiAssist.IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor('google-gemini').orThrow();
}

function mockJson(): void {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(geminiOk),
    text: jest.fn().mockResolvedValue(JSON.stringify(geminiOk))
  });
}

function mockSse(): void {
  const encoder = new TextEncoder();
  const chunk = `data: ${JSON.stringify(geminiOk)}\n\n`;
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          controller.enqueue(encoder.encode(chunk));
          controller.close();
        }
      }),
      text: jest.fn().mockResolvedValue(''),
      headers: new Map([['content-type', 'text/event-stream']])
    })
  );
}

interface ISent {
  readonly url: string;
  readonly thinkingConfig: unknown;
}

function sent(): ISent {
  const call = (global.fetch as jest.Mock).mock.calls[0];
  const body = JSON.parse(call[1].body) as { generationConfig: { thinkingConfig?: unknown } };
  return { url: call[0] as string, thinkingConfig: body.generationConfig.thinkingConfig };
}

async function complete(
  model: string | undefined,
  thinking: AiAssist.IThinkingConfig,
  descriptor: AiAssist.IAiProviderDescriptor = gemini(),
  tier?: 'advanced' | 'frontier'
): Promise<ReturnType<typeof AiAssist.callProviderCompletion>> {
  mockJson();
  return AiAssist.callProviderCompletion({
    descriptor,
    apiKey: 'k',
    ...prompt.toRequest(),
    ...(model !== undefined ? { modelOverride: model } : {}),
    ...(tier !== undefined ? { tier } : {}),
    thinking
  });
}

async function stream(
  model: string,
  thinking: AiAssist.IThinkingConfig
): Promise<ReturnType<typeof AiAssist.callProviderCompletionStream>> {
  mockSse();
  return AiAssist.callProviderCompletionStream({
    descriptor: gemini(),
    apiKey: 'k',
    ...prompt.toRequest(),
    modelOverride: model,
    thinking
  });
}

describe('Gemini thinkingLevel', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('resolveGeminiThinkingLevels', () => {
    test.each([
      ['gemini-4-argon', ['low', 'medium', 'high']],
      ['gemini-4-carbon', ['low', 'medium', 'high']],
      ['gemini-3.6-flash', ['minimal', 'low', 'medium', 'high']],
      ['gemini-3.5-flash-lite', ['minimal', 'low', 'medium', 'high']],
      // dash-bounded: a dated snapshot of a listed id is matched
      ['gemini-3.5-flash-lite-20261201', ['minimal', 'low', 'medium', 'high']]
    ])('%s accepts %p', (model, levels) => {
      expect(AiAssist.resolveGeminiThinkingLevels(gemini(), model)).toEqual(levels);
    });

    test.each(['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-4-argonite'])(
      '%s has no level declaration (budget wire)',
      (model) => {
        expect(AiAssist.resolveGeminiThinkingLevels(gemini(), model)).toBeUndefined();
      }
    );

    test('the longest matching prefix wins, whatever the declaration order', () => {
      const descriptor: AiAssist.IAiProviderDescriptor = {
        ...gemini(),
        geminiThinkingLevels: [
          { modelPrefix: 'gemini-x', levels: ['low', 'high'] },
          { modelPrefix: 'gemini-x-lite', levels: ['minimal', 'high'] }
        ]
      };
      expect(AiAssist.resolveGeminiThinkingLevels(descriptor, 'gemini-x-lite-1')).toEqual([
        'minimal',
        'high'
      ]);
      expect(AiAssist.resolveGeminiThinkingLevels(descriptor, 'gemini-x-1')).toEqual(['low', 'high']);
    });

    test('a descriptor with no table has no level models', () => {
      expect(
        AiAssist.resolveGeminiThinkingLevels(AiAssist.getProviderDescriptor('openai').orThrow(), 'gpt-6-luna')
      ).toBeUndefined();
    });
  });

  describe('generic effort on a level model', () => {
    // "minimal ... Matches the "no thinking" setting for most queries" — the closest a level model
    // with a minimal level comes to off.
    test.each([
      ['gemini-3.5-flash-lite', 'none', 'minimal'],
      ['@google-gemini:flash-lite', 'none', 'minimal'],
      ['gemini-3.5-flash-lite', 'low', 'low'],
      ['gemini-3.5-flash-lite', 'medium', 'medium'],
      ['gemini-3.5-flash-lite', 'high', 'high'],
      ['gemini-3.6-flash', 'none', 'minimal'],
      ['gemini-4-argon', 'low', 'low'],
      ['gemini-4-argon', 'medium', 'medium'],
      ['gemini-4-argon', 'high', 'high'],
      ['gemini-4-carbon', 'high', 'high'],
      // Gemini 4 cannot turn thinking off: 'none' degrades to its lowest level
      ['gemini-4-argon', 'none', 'low'],
      ['@google-gemini:pro', 'none', 'low']
    ] as const)('%s effort %s sends thinkingLevel %s and no budget', async (model, effort, level) => {
      expect(await complete(model, { effort })).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: level });
    });

    test('the streaming path sends the same level', async () => {
      expect(await stream('gemini-3.5-flash-lite', { effort: 'none' })).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'minimal' });
      (global.fetch as jest.Mock).mockClear();
      expect(await stream('gemini-4-argon', { effort: 'high' })).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'high' });
    });

    test.each(['gemini-4-argon', 'gemini-4-carbon', '@google-gemini:pro'])(
      "%s refuses effort 'none' with onUnsupported 'fail', naming its lowest level",
      async (model) => {
        expect(await complete(model, { effort: 'none', onUnsupported: 'fail' })).toFailWith(
          /thinking effort 'none' is not supported by gemini-4-(argon|carbon).*lowest thinking level is 'low'/
        );
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    test("gemini-3.5-flash-lite accepts effort 'none' with onUnsupported 'fail' (minimal)", async () => {
      expect(await complete('gemini-3.5-flash-lite', { effort: 'none', onUnsupported: 'fail' })).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'minimal' });
    });

    describe('a level model with no minimal level that is not thinking-required', () => {
      const descriptor: AiAssist.IAiProviderDescriptor = {
        ...gemini(),
        thinkingRequiredModelPrefixes: [],
        geminiThinkingLevels: [{ modelPrefix: 'gemini-test', levels: ['low', 'high'] }]
      };

      test("refuses 'none' rather than sending a level that thinks", async () => {
        expect(await complete('gemini-test', { effort: 'none' }, descriptor)).toFailWith(
          /thinking effort 'none' is not supported by gemini-test: it has no thinking-off level; its lowest thinking level is 'low'/
        );
        expect(global.fetch).not.toHaveBeenCalled();
      });

      test('refuses an effort it does not list, naming the levels it accepts', async () => {
        expect(await complete('gemini-test', { effort: 'medium' }, descriptor)).toFailWith(
          /thinking effort 'medium' is not supported by gemini-test: its thinking levels are low, high/
        );
        expect(global.fetch).not.toHaveBeenCalled();
      });

      test("an explicit block that sets the level stands the 'none' refusal aside", async () => {
        expect(
          await complete(
            'gemini-test',
            { effort: 'none', providers: [{ provider: 'google', config: { thinkingLevel: 'high' } }] },
            descriptor
          )
        ).toSucceed();
        expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'high' });
      });
    });
  });

  describe('models with no level declaration keep the budget wire', () => {
    test.each([
      ['gemini-3.8-flash', 'none', 0],
      ['gemini-3.8-flash', 'low', 1024],
      ['gemini-3.8-flash', 'high', 8192],
      ['gemini-3.1-pro-preview', 'medium', 4096],
      // thinking-required budget models degrade 'none' to the low budget
      ['gemini-3.1-pro-preview', 'none', 1024],
      ['gemini-2.5-pro', 'none', 1024],
      ['gemini-3-pro-preview', 'none', 1024]
    ] as const)('%s effort %s sends thinkingBudget %d', async (model, effort, budget) => {
      expect(await complete(model, { effort })).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingBudget: budget });
    });

    // The Pro family cannot run with thinking off and rejects thinkingBudget 0, so a generic 'none'
    // never sends 0 there.
    test.each(['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-3-pro-preview'])(
      "%s refuses 'none' with onUnsupported 'fail' instead of sending budget 0",
      async (model) => {
        expect(await complete(model, { effort: 'none', onUnsupported: 'fail' })).toFailWith(
          /thinking effort 'none' is not supported by .*cannot run with thinking off/
        );
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );
  });

  describe('explicit thinkingLevel in a google block', () => {
    test.each([
      ['gemini-4-argon', 'low'],
      ['gemini-4-argon', 'high'],
      ['gemini-3.5-flash-lite', 'minimal']
    ] as const)('%s sends thinkingLevel %s verbatim', async (model, level) => {
      expect(
        await complete(model, { providers: [{ provider: 'google', config: { thinkingLevel: level } }] })
      ).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: level });
    });

    test('a level the model does not list is refused before the wire', async () => {
      expect(
        await complete('gemini-4-argon', {
          providers: [{ provider: 'google', config: { thinkingLevel: 'minimal' } }]
        })
      ).toFailWith(
        /thinkingLevel 'minimal' is not supported by gemini-4-argon: its thinking levels are low, medium, high/
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('an unknown level value is refused before the wire', async () => {
      expect(
        await complete('gemini-3.8-flash', {
          providers: [
            {
              provider: 'google',
              config: { thinkingLevel: 'max' as unknown as AiAssist.GeminiThinkingLevel }
            }
          ]
        })
      ).toFailWith(/thinkingLevel.*max/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('thinkingLevel and thinkingBudget together are refused before the wire', async () => {
      expect(
        await complete('gemini-4-argon', {
          providers: [{ provider: 'google', config: { thinkingLevel: 'high', thinkingBudget: 2048 } }]
        })
      ).toFailWith(/thinkingLevel and thinkingBudget cannot be sent together/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('on a model with no level declaration the level is sent verbatim, replacing the generic budget', async () => {
      expect(
        await complete('gemini-3.8-flash', {
          effort: 'high',
          providers: [{ provider: 'google', config: { thinkingLevel: 'low' } }]
        })
      ).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'low' });
    });

    test('an explicit budget replaces the generic level (later tier wins)', async () => {
      expect(
        await complete('gemini-4-argon', {
          effort: 'high',
          providers: [{ provider: 'google', config: { thinkingBudget: 2048 } }]
        })
      ).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingBudget: 2048 });
    });

    test('a model-specific block outranks a provider-generic one', async () => {
      expect(
        await complete('gemini-4-argon', {
          providers: [
            { provider: 'google', models: ['gemini-4-argon'], config: { thinkingLevel: 'medium' } },
            { provider: 'google', config: { thinkingBudget: 2048 } }
          ]
        })
      ).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'medium' });
    });

    test('a block that sets neither leaves the generic level alone', async () => {
      expect(
        await complete('gemini-4-argon', {
          effort: 'medium',
          providers: [{ provider: 'google', config: { includeThoughts: true } }]
        })
      ).toSucceed();
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'medium' });
    });
  });

  describe('a caller-built resolved config carrying both fields', () => {
    test('the streaming adapter refuses it before the wire', async () => {
      mockSse();
      expect(
        await callGeminiStream(
          {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-4-argon',
            apiKey: 'k'
          },
          prompt,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          { geminiThinkingLevel: 'high', geminiThinkingBudget: 1024 }
        )
      ).toFailWith(/thinkingLevel and thinkingBudget cannot be sent together/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('converter', () => {
    test.each(['minimal', 'low', 'medium', 'high'])('accepts %s', (level) => {
      expect(AiAssist.geminiThinkingLevel.convert(level)).toSucceedWith(
        level as AiAssist.GeminiThinkingLevel
      );
    });

    test.each(['max', 'none', '', 3])('rejects %p', (value) => {
      expect(AiAssist.geminiThinkingLevel.convert(value)).toFail();
    });
  });

  describe('@google-gemini:pro rotation', () => {
    test('the advanced tier and the frontier cascade reach gemini-4-argon', async () => {
      expect(AiAssist.resolveProviderModel(gemini(), '@google-gemini:pro')).toSucceedWith('gemini-4-argon');
      expect(AiAssist.resolveProviderModel(gemini(), undefined, 'advanced')).toSucceedWith('gemini-4-argon');
      expect(AiAssist.resolveProviderModel(gemini(), undefined, 'frontier')).toSucceedWith('gemini-4-argon');
      expect(await complete(undefined, { effort: 'medium' }, gemini(), 'advanced')).toSucceed();
      expect(sent().url).toContain('/models/gemini-4-argon:generateContent');
      expect(sent().thinkingConfig).toEqual({ thinkingLevel: 'medium' });
    });

    test('gemini-4-argon records 32,768, the per-request non-streaming output cap', () => {
      expect(AiAssist.resolveMaxOutputTokens(gemini(), '@google-gemini:pro')).toBe(32768);
      expect(AiAssist.resolveMaxOutputTokens(gemini(), 'gemini-4-argon')).toBe(32768);
    });

    test('gemini-4-argon is thinking-required; gemini-3.5-flash-lite no longer is', () => {
      expect(AiAssist.isThinkingRequiredModel(gemini(), 'gemini-4-argon')).toBe(true);
      expect(AiAssist.isThinkingRequiredModel(gemini(), 'gemini-4-carbon')).toBe(true);
      expect(AiAssist.isThinkingRequiredModel(gemini(), 'gemini-3.5-flash-lite')).toBe(false);
    });

    test('gemini-4-argon uses the generateContent responseSchema structured output', () => {
      expect(AiAssist.resolveStructuredOutputCapability(gemini(), 'gemini-4-argon')?.format).toBe(
        'gemini-response-schema'
      );
    });

    test('model listing detects gemini-4 ids as chat, tools, vision and thinking', () => {
      const rules = AiAssist.DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider?.['google-gemini'] ?? [];
      const caps = new Set<string>();
      for (const rule of rules) {
        if (rule.idPattern.test('gemini-4-argon')) {
          rule.capabilities.forEach((c) => caps.add(c));
        }
      }
      expect([...caps].sort()).toEqual(['chat', 'thinking', 'tools', 'vision']);
    });
  });
});
