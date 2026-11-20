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
 * Against the shipped registry: a caller-built Gemini `resolvedThinking` on the client-tool path is
 * refused before streaming when the provider would reject it, an explicit `thinkingLevel` is refused
 * on a model that takes budgets only, and a dash-bounded variant of a level model takes its own,
 * longer rule.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';

const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');
const geminiOk = { candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }] };

function gemini(): AiAssist.IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor('google-gemini').orThrow();
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

function mockJson(): void {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(geminiOk),
    text: jest.fn().mockResolvedValue(JSON.stringify(geminiOk))
  });
}

function sentThinkingConfig(): unknown {
  const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body) as {
    generationConfig: { thinkingConfig?: unknown };
  };
  return body.generationConfig.thinkingConfig;
}

function turn(
  model: string,
  resolvedThinking: AiAssist.IResolvedThinkingConfig
): ReturnType<typeof AiAssist.executeClientToolTurn> {
  mockSse();
  return AiAssist.executeClientToolTurn({
    descriptor: gemini(),
    apiKey: 'k',
    ...prompt.toRequest(),
    model,
    clientTools: [],
    resolvedThinking
  });
}

async function drain(result: ReturnType<typeof AiAssist.executeClientToolTurn>): Promise<void> {
  for await (const event of result.orThrow().events) {
    expect(event.type).not.toBe('error');
  }
}

describe('Gemini caller guards', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('executeClientToolTurn refuses a caller-built Gemini thinking config the provider rejects', () => {
    test.each([
      ['gemini-4-argon', { geminiThinkingBudget: 0 }, /gemini-4-argon cannot run with thinking off/],
      ['@google-gemini:pro', { geminiThinkingBudget: 0 }, /gemini-4-argon cannot run with thinking off/],
      [
        'gemini-3.1-pro-preview',
        { geminiThinkingBudget: 0 },
        /gemini-3\.1-pro-preview cannot run with thinking off/
      ],
      [
        'gemini-4-argon',
        { geminiThinkingLevel: 'minimal' as const },
        /thinkingLevel 'minimal' is not supported by gemini-4-argon: its thinking levels are low, medium, high/
      ],
      [
        '@google-gemini:pro',
        { geminiThinkingLevel: 'minimal' as const },
        /thinkingLevel 'minimal' is not supported by gemini-4-argon/
      ],
      [
        'gemini-2.5-pro',
        { geminiThinkingLevel: 'low' as const },
        /thinkingLevel 'low' is not supported by gemini-2\.5-pro: the model takes thinkingBudget only/
      ],
      [
        'gemini-4-argon',
        { geminiThinkingLevel: 'low' as const, geminiThinkingBudget: 0 },
        /thinkingLevel and thinkingBudget cannot be sent together/
      ]
    ])('%s %j is a Failure before streaming', (model, resolvedThinking, message) => {
      expect(turn(model, resolvedThinking)).toFailWith(message);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test.each([
      ['gemini-4-argon', { geminiThinkingLevel: 'low' as const }, { thinkingLevel: 'low' }],
      ['gemini-3.5-flash-lite', { geminiThinkingLevel: 'minimal' as const }, { thinkingLevel: 'minimal' }],
      // budget 0 turns gemini-3.8-flash's thinking off; it is not thinking-required
      ['gemini-3.8-flash', { geminiThinkingBudget: 0 }, { thinkingBudget: 0 }],
      ['gemini-3.1-pro-preview', { geminiThinkingBudget: 1024 }, { thinkingBudget: 1024 }],
      // no level declaration and not budget-only: an explicit level is sent verbatim
      ['gemini-3.8-flash', { geminiThinkingLevel: 'low' as const }, { thinkingLevel: 'low' }]
    ])('%s %j is sent as %j', async (model, resolvedThinking, wire) => {
      const result = turn(model, resolvedThinking);
      expect(result).toSucceed();
      await drain(result);
      expect(sentThinkingConfig()).toEqual(wire);
    });

    test('a turn with no resolvedThinking sends no thinking config', async () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: gemini(),
        apiKey: 'k',
        ...prompt.toRequest(),
        model: 'gemini-4-argon',
        clientTools: []
      });
      expect(result).toSucceed();
      await drain(result);
      expect(sentThinkingConfig()).toBeUndefined();
    });
  });

  describe('an explicit thinkingLevel on a model that takes budgets only', () => {
    test.each(['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'])(
      '%s refuses it before the wire',
      async (model) => {
        mockJson();
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: gemini(),
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            thinking: { providers: [{ provider: 'google', config: { thinkingLevel: 'low' } }] }
          })
        ).toFailWith(/the model takes thinkingBudget only/);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );
  });

  describe('a dash-bounded variant takes its own, longer level rule', () => {
    test.each([
      ['gemini-3.1-flash-lite', ['minimal', 'low', 'medium', 'high']],
      // a -preview of a listed id takes that id's rule
      ['gemini-3.1-flash-lite-preview', ['minimal', 'low', 'medium', 'high']],
      // the image sibling has its own, narrower level set, not the shorter flash-lite rule
      ['gemini-3.1-flash-lite-image', ['minimal', 'high']],
      ['gemini-3-flash-preview', ['minimal', 'low', 'medium', 'high']]
    ])('%s accepts %p', (model, levels) => {
      expect(AiAssist.resolveGeminiThinkingLevels(gemini(), model)).toEqual(levels);
    });

    test.each([
      ['gemini-3.1-flash-lite', 'none', { thinkingLevel: 'minimal' }],
      ['gemini-3-flash-preview', 'none', { thinkingLevel: 'minimal' }],
      ['gemini-3.1-flash-lite-image', 'high', { thinkingLevel: 'high' }]
    ] as const)('%s effort %s sends %j', async (model, effort, wire) => {
      mockJson();
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: gemini(),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          thinking: { effort }
        })
      ).toSucceed();
      expect(sentThinkingConfig()).toEqual(wire);
    });

    test("gemini-3.1-flash-lite-image refuses effort 'low', which only the shorter rule lists", async () => {
      mockJson();
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: gemini(),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'gemini-3.1-flash-lite-image',
          thinking: { effort: 'low' }
        })
      ).toFailWith(/its thinking levels are minimal, high/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
