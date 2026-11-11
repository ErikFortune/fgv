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
 * - a generic effort 'none' turns thinking off on every Anthropic model: the model's declared off
 *   value (`disabled`, or `between_tools` on claude-sonnet-5-5) where it thinks by default, no
 *   thinking field on an older model, and 'low' (or a refusal) where the model cannot turn thinking
 *   off;
 * - Gemini flash-lite sends 'none' as its 'minimal' level and gemini-3.8-flash as budget 0;
 * - a `temperature` aimed at a model that rejects sampling parameters is refused before the wire.
 */

import '@fgv/ts-utils-jest';

import { JsonSchema } from '@fgv/ts-json-base';

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

    // "disabled" column of the per-model table: "Thinking off" (Sonnet 5, Opus 4.8, Opus 4.7),
    // "Thinking off at `high` effort or below" (Opus 5, Haiku 5.5). A 'none' sends no effort, so the
    // model's default applies.
    test.each([
      'claude-sonnet-5',
      'claude-opus-5',
      'claude-haiku-5-5',
      '@anthropic:haiku',
      'claude-opus-4-8',
      'claude-opus-4-7'
    ])('%s sends thinking disabled and no effort', async (model) => {
      const body = await sendNone(model);
      expect(body.thinking).toEqual({ type: 'disabled' });
      expect(body.output_config).toBeUndefined();
    });

    // "disabled" column: "400 error". 'none' degrades to the least thinking the model accepts.
    // claude-sonnet-5-5 400s on 'disabled' with "To turn thinking off on this model, send
    // "thinking": {"type": "between_tools"} instead" (live, 2026-11-09). A 'none' sends no effort,
    // so between_tools' 400 at effort xhigh and max cannot be reached.
    test.each(['claude-sonnet-5-5', '@anthropic:sonnet'])(
      '%s sends thinking between_tools and no effort',
      async (model) => {
        const body = await sendNone(model);
        expect(body.thinking).toEqual({ type: 'between_tools' });
        expect(body.output_config).toBeUndefined();
      }
    );

    test("claude-sonnet-5-5 with onUnsupported 'fail' sends between_tools", async () => {
      const body = await sendNone('claude-sonnet-5-5', 'fail');
      expect(body.thinking).toEqual({ type: 'between_tools' });
      expect(body.output_config).toBeUndefined();
    });

    test('claude-sonnet-5-5 keeps its structured-output format beside between_tools, with no effort', async () => {
      mockJson({ content: [{ type: 'text', text: '{"a":1}' }], stop_reason: 'end_turn' });
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'claude-sonnet-5-5',
          thinking: { effort: 'none' },
          structuredOutput: {
            mode: 'schema',
            schema: JsonSchema.object({ a: JsonSchema.number() }),
            onUnsupported: 'fail'
          }
        })
      ).toSucceed();
      const body = sentBody();
      expect(body.thinking).toEqual({ type: 'between_tools' });
      expect(body.output_config).toBeDefined();
      expect((body.output_config as Record<string, unknown>).effort).toBeUndefined();
    });

    test.each([
      'claude-opus-5-5',
      'claude-fable-5',
      'claude-fable-5-1',
      'claude-mythos-5',
      'claude-mythos-5-1',
      '@anthropic:opus',
      '@anthropic:fable'
    ])('%s cannot turn thinking off: none is sent as adaptive low', async (model) => {
      const body = await sendNone(model);
      expect(body.thinking).toEqual({ type: 'adaptive' });
      expect(body.output_config).toEqual({ effort: 'low' });
    });

    test.each(['claude-opus-5-5', 'claude-mythos-5'])(
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
    test.each(['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'])(
      '%s sends no thinking field',
      async (model) => {
        const body = await sendNone(model);
        expect(body.thinking).toBeUndefined();
        expect(body.output_config).toBeUndefined();
      }
    );

    test('claude-mythos-preview keeps the budget shape and cannot turn thinking off', async () => {
      // Table row: "Adaptive thinking | Adaptive thinking | Extended thinking | 400 error | 400 error".
      const body = await sendNone('claude-mythos-preview');
      expect(body.thinking).toMatchObject({ type: 'enabled' });
      expect(body.output_config).toBeUndefined();
    });

    test.each(['claude-opus-4-8', 'claude-opus-4-7'])(
      '%s takes the adaptive shape for an effort (a budget 400s)',
      async (model) => {
        mockJson(anthropicOk);
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: anthropic,
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            thinking: { effort: 'low' }
          })
        ).toSucceed();
        expect(sentBody()).toMatchObject({
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' }
        });
        expect(JSON.stringify(sentBody())).not.toContain('budget_tokens');
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

    // claude-mythos-preview is thinking-required but keeps the budget shape: the flag would send no
    // thinking field and the model would think, so it is refused too.
    test.each([
      '@anthropic:opus',
      'claude-opus-5-5',
      'claude-fable-5-1',
      'claude-mythos-5',
      'claude-mythos-preview'
    ])('executeClientToolTurn refuses a caller-built thinking-off flag on %s', (model) => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model,
        resolvedThinking: { anthropicThinkingDisabled: true }
      });
      expect(result).toFailWith(/executeClientToolTurn: claude-[a-z0-9-]+ cannot run with thinking off/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('executeClientToolTurn lets an effort beside the flag through on a thinking-required model', async () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: '@anthropic:opus',
        resolvedThinking: { anthropicThinkingDisabled: true, anthropicEffort: 'low' }
      });
      await drain(result.orThrow().events);
      expect(sentBody()).toMatchObject({ thinking: { type: 'adaptive' }, output_config: { effort: 'low' } });
    });

    test('callProviderCompletionStream sends thinking between_tools to claude-sonnet-5-5', async () => {
      mockSse();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: '@anthropic:sonnet',
        thinking: { effort: 'none', onUnsupported: 'fail' }
      });
      await drain(result.orThrow());
      expect(sentBody().thinking).toEqual({ type: 'between_tools' });
      expect(sentBody().output_config).toBeUndefined();
    });

    test('executeClientToolTurn sends thinking between_tools for the flag on claude-sonnet-5-5', async () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: '@anthropic:sonnet',
        resolvedThinking: { anthropicThinkingDisabled: true }
      });
      await drain(result.orThrow().events);
      expect(sentBody().thinking).toEqual({ type: 'between_tools' });
      expect(sentBody().output_config).toBeUndefined();
    });

    test('executeClientToolTurn sends no thinking field for the flag on a non-adaptive model', async () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: 'claude-haiku-4-5-20251001',
        resolvedThinking: { anthropicThinkingDisabled: true }
      });
      await drain(result.orThrow().events);
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

  describe("Gemini effort 'none' on flash-lite and flash", () => {
    const gemini = getDescriptor('google-gemini');
    const geminiOk = { candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }] };

    // gemini-3.5-flash-lite 400s on thinkingBudget 0 ("Request contains an invalid argument.", live
    // 2026-11-09). It is a level model whose lowest level is 'minimal', so 'none' is sent as that
    // level, with or without onUnsupported 'fail'.
    test.each([
      ['gemini-3.5-flash-lite', undefined],
      ['@google-gemini:flash-lite', undefined],
      ['gemini-3.5-flash-lite', 'fail' as const]
    ])('%s sends none as thinkingLevel minimal (onUnsupported %s)', async (model, onUnsupported) => {
      mockJson(geminiOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: gemini,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          thinking: { effort: 'none', ...(onUnsupported !== undefined ? { onUnsupported } : {}) }
        })
      ).toSucceed();
      expect(sentBody()).toMatchObject({
        generationConfig: { thinkingConfig: { thinkingLevel: 'minimal' } }
      });
    });

    // gemini-3.8-flash turns thinking off with a budget of 0: a live budget-0 request returned
    // usageMetadata with no thoughtsTokenCount (2026-11-10). So 'none' sends budget 0, and
    // onUnsupported 'fail' has nothing to refuse.
    test.each([
      ['gemini-3.8-flash', undefined],
      ['@google-gemini:flash', undefined],
      ['gemini-3.8-flash', 'fail' as const],
      ['@google-gemini:flash', 'fail' as const]
    ])('%s sends none as budget 0 (onUnsupported %s)', async (model, onUnsupported) => {
      mockJson(geminiOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: gemini,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          thinking: { effort: 'none', ...(onUnsupported !== undefined ? { onUnsupported } : {}) }
        })
      ).toSucceed();
      expect(sentBody()).toMatchObject({ generationConfig: { thinkingConfig: { thinkingBudget: 0 } } });
    });
  });

  describe('resolveAnthropicThinkingOffType', () => {
    const anthropic = getDescriptor('anthropic');

    test.each([
      ['claude-sonnet-5-5', 'between_tools'],
      ['claude-sonnet-5-5-20261101', 'between_tools'],
      ['claude-sonnet-5', 'disabled'],
      ['claude-sonnet-5-50', 'disabled'],
      ['claude-haiku-5-5', 'disabled'],
      ['claude-opus-5', 'disabled']
    ] as const)('%s turns thinking off with %s', (model, expected) => {
      expect(AiAssist.resolveAnthropicThinkingOffType(anthropic, model)).toBe(expected);
    });

    test('a descriptor with no rules uses disabled', () => {
      expect(AiAssist.resolveAnthropicThinkingOffType(getDescriptor('openai'), 'claude-sonnet-5-5')).toBe(
        'disabled'
      );
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
      ['anthropic', 'claude-mythos-preview']
    ] as ReadonlyArray<[AiAssist.AiProviderId, string]>)(
      '%s %s refuses a non-default temperature before the wire',
      async (id, model) => {
        // A valid reply is mocked so a missing guard shows as a failed assertion, not a crash.
        mockJson(id === 'anthropic' ? anthropicOk : openAiOk);
        const result = await AiAssist.callProviderCompletion({
          descriptor: getDescriptor(id),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 0.3
        });
        expect(result).toFailWith(
          /does not accept a non-default temperature \(0\.3\): remove temperature, or send 1/
        );
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    // OpenAI's sol and astra reject only non-default values too: the live default, 1, was accepted
    // on both (2026-11-10), so any other value is refused before the wire with the same wording.
    test.each([
      ['@openai:flagship', /^gpt-6\.1-sol does not accept a non-default temperature/],
      ['gpt-6.1-sol', /^gpt-6\.1-sol does not accept a non-default temperature/],
      ['@openai:pro', /^gpt-6-astra does not accept a non-default temperature/],
      ['gpt-6-astra', /^gpt-6-astra does not accept a non-default temperature/]
    ] as ReadonlyArray<[string, RegExp]>)('openai %s refuses temperature 0.3', async (model, refusal) => {
      mockJson(openAiOk);
      const result = await AiAssist.callProviderCompletion({
        descriptor: getDescriptor('openai'),
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: model,
        temperature: 0.3
      });
      expect(result).toFailWith(refusal);
      expect(result).toFailWith(/\(0\.3\): remove temperature, or send 1$/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test.each(['@openai:flagship', 'gpt-6.1-sol', '@openai:pro', 'gpt-6-astra'])(
      'openai %s sends temperature 1 on the completion path',
      async (model) => {
        mockJson(openAiOk);
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: getDescriptor('openai'),
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            temperature: 1
          })
        ).toSucceed();
        expect(sentBody().temperature).toBe(1);
      }
    );

    test.each(['gpt-6.1-sol', 'gpt-6-astra'])(
      'openai %s sends temperature 1 on the streaming path',
      async (model) => {
        mockSse();
        const result = await AiAssist.callProviderCompletionStream({
          descriptor: getDescriptor('openai'),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1
        });
        await drain(result.orThrow());
        expect(sentBody().temperature).toBe(1);
      }
    );

    test.each(['gpt-6.1-sol', 'gpt-6-astra'])(
      'openai %s sends temperature 1 on the client-tool path',
      async (model) => {
        mockSse();
        const result = AiAssist.executeClientToolTurn({
          descriptor: getDescriptor('openai'),
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model,
          temperature: 1
        });
        await drain(result.orThrow().events);
        expect(sentBody().temperature).toBe(1);
      }
    );

    test('a descriptor that declares no accepted temperature refuses every value on a listed model', async () => {
      const strict: AiAssist.IAiProviderDescriptor = {
        ...getDescriptor('openai'),
        samplingParamsAcceptedTemperature: undefined
      };
      for (const temperature of [0.3, 1]) {
        const result = await AiAssist.callProviderCompletion({
          descriptor: strict,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'gpt-6.1-sol',
          temperature
        });
        expect(result).toFailWith(
          /gpt-6\.1-sol does not accept temperature on any request: remove temperature/
        );
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // Anthropic rejects only non-default values on the pinned API version; its default, 1, is sent.
    test.each(['claude-haiku-5-5', 'claude-sonnet-5-5', '@anthropic:opus'])(
      'anthropic %s sends temperature 1 on the completion path',
      async (model) => {
        mockJson(anthropicOk);
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: getDescriptor('anthropic'),
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            temperature: 1
          })
        ).toSucceed();
        expect(sentBody().temperature).toBe(1);
      }
    );

    test.each(['claude-haiku-5-5', 'claude-sonnet-5-5'])(
      'anthropic %s sends temperature 1 on the streaming path',
      async (model) => {
        mockSse();
        const result = await AiAssist.callProviderCompletionStream({
          descriptor: getDescriptor('anthropic'),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1
        });
        await drain(result.orThrow());
        expect(sentBody().temperature).toBe(1);
      }
    );

    test.each(['claude-haiku-5-5', 'claude-sonnet-5-5'])(
      'anthropic %s sends temperature 1 on the client-tool path',
      async (model) => {
        mockSse();
        const result = AiAssist.executeClientToolTurn({
          descriptor: getDescriptor('anthropic'),
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model,
          temperature: 1
        });
        await drain(result.orThrow().events);
        expect(sentBody().temperature).toBe(1);
      }
    );

    test.each([
      ['anthropic', 'claude-haiku-4-5-20251001', anthropicOk],
      ['anthropic', 'claude-sonnet-4-6', anthropicOk],
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
      expect(result).toFailWith(/claude-haiku-5-5 does not accept a non-default temperature/);
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
      expect(result).toFailWith(
        /executeClientToolTurn: claude-haiku-5-5 does not accept a non-default temperature/
      );
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

  describe('the accepted default temperature alongside thinking', () => {
    const anthropic = getDescriptor('anthropic');

    // "non-default … values return a 400 error on every request, regardless of whether thinking is
    // used": the default is accepted with thinking on too, on the models that restrict sampling.
    test.each(['claude-haiku-5-5', 'claude-sonnet-5-5', '@anthropic:opus'])(
      'completion: %s sends temperature 1 with effort low',
      async (model) => {
        mockJson(anthropicOk);
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: anthropic,
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            temperature: 1,
            thinking: { effort: 'low' }
          })
        ).toSucceed();
        expect(sentBody()).toMatchObject({
          temperature: 1,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'low' }
        });
      }
    );

    test.each(['claude-haiku-5-5', 'claude-sonnet-5-5'])(
      'streaming: %s sends temperature 1 with effort low',
      async (model) => {
        mockSse();
        const result = await AiAssist.callProviderCompletionStream({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1,
          thinking: { effort: 'low' }
        });
        await drain(result.orThrow());
        expect(sentBody()).toMatchObject({ temperature: 1, output_config: { effort: 'low' } });
      }
    );

    test.each(['claude-haiku-5-5', 'claude-sonnet-5-5'])(
      'client-tool: %s sends temperature 1 with a resolved effort',
      async (model) => {
        mockSse();
        const result = AiAssist.executeClientToolTurn({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model,
          temperature: 1,
          resolvedThinking: { anthropicEffort: 'low' }
        });
        await drain(result.orThrow().events);
        expect(sentBody()).toMatchObject({ temperature: 1, output_config: { effort: 'low' } });
      }
    );

    // The same exemption, read from the OpenAI descriptor: sol and astra take their default, 1,
    // with a reasoning effort as well as without (live, 2026-11-10, at the default effort).
    test.each(['gpt-6.1-sol', 'gpt-6-astra'])(
      'completion: openai %s sends temperature 1 with effort low',
      async (model) => {
        mockJson(openAiOk);
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: getDescriptor('openai'),
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: model,
            temperature: 1,
            thinking: { effort: 'low' }
          })
        ).toSucceed();
        expect(sentBody()).toMatchObject({ model, temperature: 1, reasoning_effort: 'low' });
      }
    );

    test.each(['gpt-6.1-sol', 'gpt-6-astra'])(
      'streaming: openai %s sends temperature 1 with effort low',
      async (model) => {
        mockSse();
        const result = await AiAssist.callProviderCompletionStream({
          descriptor: getDescriptor('openai'),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1,
          thinking: { effort: 'low' }
        });
        await drain(result.orThrow());
        expect(sentBody()).toMatchObject({ model, temperature: 1, reasoning_effort: 'low' });
      }
    );

    // With tools, OpenAI streaming routes through the Responses adapter, which drops temperature
    // beside an effort unless it is the accepted default.
    test.each(['gpt-6.1-sol', 'gpt-6-astra'])(
      'streaming with tools: openai %s sends temperature 1 with effort low',
      async (model) => {
        mockSse();
        const result = await AiAssist.callProviderCompletionStream({
          descriptor: getDescriptor('openai'),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          tools: [{ type: 'web_search' }],
          temperature: 1,
          thinking: { effort: 'low' }
        });
        await drain(result.orThrow());
        expect((global.fetch as jest.Mock).mock.calls[0][0]).toMatch(/\/responses$/);
        expect(sentBody()).toMatchObject({ model, temperature: 1, reasoning: { effort: 'low' } });
      }
    );

    test.each(['gpt-6.1-sol', 'gpt-6-astra'])(
      'client-tool: openai %s sends temperature 1 with a resolved effort',
      async (model) => {
        mockSse();
        const result = AiAssist.executeClientToolTurn({
          descriptor: getDescriptor('openai'),
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model,
          temperature: 1,
          resolvedThinking: { openAiEffort: 'low' }
        });
        await drain(result.orThrow().events);
        expect(sentBody()).toMatchObject({ model, temperature: 1, reasoning: { effort: 'low' } });
      }
    );

    // Beside an effort, a non-default temperature on a model that restricts it is refused with the
    // model's own message: "disable thinking" would be wrong advice for a model whose rule applies
    // with or without thinking (and several of them cannot turn thinking off at all).
    const RESTRICTED: ReadonlyArray<[AiAssist.AiProviderId, string, RegExp]> = [
      ['anthropic', 'claude-haiku-5-5', /claude-haiku-5-5 does not accept a non-default temperature/],
      ['anthropic', 'claude-opus-5-5', /claude-opus-5-5 does not accept a non-default temperature/],
      ['openai', 'gpt-6.1-sol', /gpt-6\.1-sol does not accept a non-default temperature/],
      ['openai', 'gpt-6-astra', /gpt-6-astra does not accept a non-default temperature/]
    ];
    const SEND_DEFAULT = /\(0\.3\): remove temperature, or send 1$/;

    test.each(RESTRICTED)(
      'completion: %s %s refuses 0.3 with effort low, naming the default',
      async (id, model, refusal) => {
        const result = await AiAssist.callProviderCompletion({
          descriptor: getDescriptor(id),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 0.3,
          thinking: { effort: 'low' }
        });
        expect(result).toFailWith(refusal);
        expect(result).toFailWith(SEND_DEFAULT);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    test.each(RESTRICTED)(
      'streaming: %s %s refuses 0.3 with effort low, naming the default',
      async (id, model, refusal) => {
        const result = await AiAssist.callProviderCompletionStream({
          descriptor: getDescriptor(id),
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 0.3,
          thinking: { effort: 'low' }
        });
        expect(result).toFailWith(refusal);
        expect(result).toFailWith(SEND_DEFAULT);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    test.each(RESTRICTED)(
      'client-tool: %s %s refuses 0.3 with a resolved effort, naming the default',
      (id, model, refusal) => {
        const result = AiAssist.executeClientToolTurn({
          descriptor: getDescriptor(id),
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model,
          temperature: 0.3,
          resolvedThinking: id === 'openai' ? { openAiEffort: 'low' } : { anthropicEffort: 'low' }
        });
        expect(result).toFailWith(refusal);
        expect(result).toFailWith(SEND_DEFAULT);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    // A model on neither rejected list keeps the thinking/temperature conflict, for 1 as for any value.
    test('client-tool: openai gpt-6-sol refuses temperature 1 beside a resolved effort', () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: getDescriptor('openai'),
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: 'gpt-6-sol',
        temperature: 1,
        resolvedThinking: { openAiEffort: 'low' }
      });
      expect(result).toFailWith(/thinking mode is not compatible with temperature/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // Older models keep the thinking/temperature conflict: they accept temperature only with thinking off.
    test.each(['claude-haiku-4-5-20251001', 'claude-opus-4-6'])(
      'completion and streaming: %s refuses temperature 1 with effort low',
      async (model) => {
        mockJson(anthropicOk);
        const completion = await AiAssist.callProviderCompletion({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1,
          thinking: { effort: 'low' }
        });
        expect(completion).toFailWith(/thinking mode is not compatible with temperature/);
        const stream = await AiAssist.callProviderCompletionStream({
          descriptor: anthropic,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1,
          thinking: { effort: 'low' }
        });
        expect(stream).toFailWith(/thinking mode is not compatible with temperature/);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );

    test('client-tool: claude-haiku-4-5 refuses temperature 1 beside a resolved effort', () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: anthropic,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: 'claude-haiku-4-5-20251001',
        temperature: 1,
        resolvedThinking: { anthropicEffort: 'low' }
      });
      expect(result).toFailWith(/thinking mode is not compatible with temperature/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
