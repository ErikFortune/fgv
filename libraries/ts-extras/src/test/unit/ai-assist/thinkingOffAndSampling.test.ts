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
 * Request-body tests, against the shipped registry, for two per-model rules:
 * - a generic effort 'none' turns thinking off on every Anthropic model: a disabled thinking value
 *   where the model thinks by default and accepts it, no thinking field on an older model, and
 *   'low' (or a refusal) where the model cannot turn thinking off;
 * - a `temperature` aimed at a model that rejects sampling parameters is refused before the wire.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';

const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');

function getDescriptor(id: AiAssist.AiProviderId): AiAssist.IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor(id).orThrow();
}

const anthropicOk = { content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' };
const openAiOk = { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] };

function mockJson(response: unknown): void {
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
          controller.enqueue(encoder.encode('event: message_stop\ndata: {}\n\n'));
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

describe('per-model thinking-off and sampling-parameter rules', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Anthropic effort 'none' (non-streaming completion)", () => {
    const anthropic = getDescriptor('anthropic');

    async function sendNone(model: string, onUnsupported?: 'fail'): Promise<Record<string, unknown>> {
      mockJson(anthropicOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          thinking: { effort: 'none', onUnsupported }
        })
      ).toSucceed();
      return sentBody();
    }

    // "disabled" column of the per-model table: "Thinking off" (Sonnet 5), "Thinking off at `high`
    // effort or below" (Opus 5, Haiku 5.5). A 'none' sends no effort, so the model's default applies.
    test.each(['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-5-5', '@anthropic:haiku'])(
      '%s sends thinking disabled and no effort',
      async (model) => {
        const body = await sendNone(model);
        expect(body.thinking).toEqual({ type: 'disabled' });
        expect(body.output_config).toBeUndefined();
      }
    );

    // "disabled" column: "400 error". 'none' degrades to the least thinking the model accepts.
    test.each([
      'claude-opus-5-5',
      'claude-sonnet-5-5',
      'claude-fable-5',
      'claude-fable-5-1',
      'claude-mythos-5',
      'claude-mythos-5-1',
      '@anthropic:sonnet',
      '@anthropic:opus',
      '@anthropic:fable'
    ])('%s cannot turn thinking off: none is sent as adaptive low', async (model) => {
      const body = await sendNone(model);
      expect(body.thinking).toEqual({ type: 'adaptive' });
      expect(body.output_config).toEqual({ effort: 'low' });
    });

    test.each(['claude-sonnet-5-5', 'claude-mythos-5'])(
      "%s with onUnsupported 'fail' is refused before the wire",
      async (model) => {
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: anthropic,
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            thinking: { effort: 'none', onUnsupported: 'fail' }
          })
        ).toFailWith(/cannot run with thinking off/);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    // "No `thinking` field: Thinking off" — omission is already off on the older models.
    test.each(['claude-haiku-4-5-20251001', 'claude-opus-4-8', 'claude-sonnet-4-6'])(
      '%s sends no thinking field',
      async (model) => {
        const body = await sendNone(model);
        expect(body.thinking).toBeUndefined();
        expect(body.output_config).toBeUndefined();
      }
    );

    test('a typed anthropic block with an effort outranks the generic none', async () => {
      mockJson(anthropicOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'claude-haiku-5-5',
          thinking: { effort: 'none', providers: [{ provider: 'anthropic', config: { effort: 'high' } }] }
        })
      ).toSucceed();
      expect(sentBody()).toMatchObject({ thinking: { type: 'adaptive' }, output_config: { effort: 'high' } });
    });
  });

  describe("Anthropic effort 'none' on the streaming and client-tool paths", () => {
    const anthropic = getDescriptor('anthropic');

    test('callProviderCompletionStream sends thinking disabled to claude-haiku-5-5', async () => {
      mockSse();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: '@anthropic:haiku',
        thinking: { effort: 'none' }
      });
      expect(result).toSucceedAndSatisfy(() => undefined);
      await drain(result.orThrow());
      expect(sentBody().thinking).toEqual({ type: 'disabled' });
    });

    test('callProviderCompletionStream sends no thinking field to claude-haiku-4-5', async () => {
      mockSse();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: 'claude-haiku-4-5-20251001',
        thinking: { effort: 'none' }
      });
      await drain(result.orThrow());
      expect(sentBody().thinking).toBeUndefined();
    });

    test('executeClientToolTurn sends thinking disabled for a resolved none on claude-sonnet-5', async () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: 'claude-sonnet-5',
        resolvedThinking: { anthropicThinkingDisabled: true }
      });
      await drain(result.orThrow().events);
      expect(sentBody().thinking).toEqual({ type: 'disabled' });
    });
  });

  describe('models that reject sampling parameters', () => {
    // From the thinking page's sampling-parameter list, plus OpenAI's two models with no 'none'.
    test.each([
      ['anthropic', '@anthropic:haiku'],
      ['anthropic', 'claude-haiku-5-5'],
      ['anthropic', '@anthropic:sonnet'],
      ['anthropic', 'claude-sonnet-5'],
      ['anthropic', '@anthropic:opus'],
      ['anthropic', 'claude-opus-5'],
      ['anthropic', 'claude-fable-5-1'],
      ['anthropic', 'claude-mythos-5'],
      ['anthropic', 'claude-opus-4-8'],
      ['anthropic', 'claude-opus-4-7'],
      ['openai', '@openai:flagship'],
      ['openai', 'gpt-6-astra']
    ] as ReadonlyArray<[AiAssist.AiProviderId, string]>)(
      '%s %s refuses temperature before the wire',
      async (id, model) => {
        // A valid reply is mocked so a missing guard shows as a failed assertion, not a crash.
        mockJson(id === 'anthropic' ? anthropicOk : openAiOk);
        const result = await AiAssist.callProviderCompletion({
          descriptor: getDescriptor(id),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 0.2
        });
        expect(result).toFailWith(/does not accept temperature on any request: remove temperature/);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    test.each([
      ['anthropic', 'claude-haiku-4-5-20251001', anthropicOk],
      ['anthropic', 'claude-sonnet-4-6', anthropicOk],
      ['openai', 'gpt-6-luna', openAiOk],
      ['openai', 'gpt-6-sol', openAiOk]
    ] as ReadonlyArray<[AiAssist.AiProviderId, string, unknown]>)(
      '%s %s still sends temperature',
      async (id, model, response) => {
        mockJson(response);
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: getDescriptor(id),
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            temperature: 0.2
          })
        ).toSucceed();
        expect(sentBody().temperature).toBe(0.2);
      }
    );

    test('the streaming path refuses temperature on @anthropic:haiku', async () => {
      mockSse();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: getDescriptor('anthropic'),
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: '@anthropic:haiku',
        temperature: 0.2
      });
      expect(result).toFailWith(/claude-haiku-5-5 does not accept temperature/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('the client-tool path refuses temperature on @anthropic:haiku', () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: getDescriptor('anthropic'),
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: '@anthropic:haiku',
        temperature: 0.2
      });
      expect(result).toFailWith(/executeClientToolTurn: claude-haiku-5-5 does not accept temperature/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejectsSamplingParams matches dash-bounded ids only', () => {
      const anthropic = getDescriptor('anthropic');
      expect(AiAssist.rejectsSamplingParams(anthropic, 'claude-opus-5-5')).toBe(true);
      expect(AiAssist.rejectsSamplingParams(anthropic, 'claude-opus-50')).toBe(false);
      expect(AiAssist.rejectsSamplingParams(anthropic, 'claude-haiku-4-5')).toBe(false);
      expect(AiAssist.rejectsSamplingParams(getDescriptor('groq'), 'openai/gpt-oss-120b')).toBe(false);
    });
  });
});
