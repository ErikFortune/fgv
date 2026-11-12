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
 * Request-body tests, against the shipped registry, for two OpenAI-format rules:
 * - a caller-built `resolvedThinking` whose effort is `'none'` is refused on a model listed in
 *   `thinkingRequiredModelPrefixes` (the provider rejects it), and still sent everywhere else;
 * - `gpt-6-luna` and `gpt-6-sol` (the older Sol, not `gpt-6.1-sol`) are not on
 *   `samplingParamsRejectedModelPrefixes`: they take a non-default temperature with effort `'none'`;
 * - `gpt-6-luna` is on `samplingParamsRejectedWithThinkingModelPrefixes`: while it reasons (any
 *   effort but `'none'`, or no effort, since it defaults to `medium`) it takes only the accepted
 *   default `1`, and any other value is refused before the wire on the completion, streaming and
 *   client-tool paths alike;
 * - `gpt-6-sol` is on neither list, so a temperature beside any effort but `'none'` is the
 *   thinking/temperature conflict, `1` included, on all three paths;
 * - each client-tool thinking-off refusal applies only on the wire format whose adapter reads it.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';

const prompt = new AiAssist.AiPrompt('Say ok', 'You are terse');

function getDescriptor(id: AiAssist.AiProviderId): AiAssist.IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor(id).orThrow();
}

function mockSse(): void {
  const encoder = new TextEncoder();
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
          controller.enqueue(encoder.encode('event: response.completed\ndata: {}\n\n'));
          controller.close();
        }
      }),
      text: jest.fn().mockResolvedValue(''),
      headers: new Map([['content-type', 'text/event-stream']])
    })
  );
}

const openAiOk = { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] };

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

async function drain(iter: AsyncIterable<AiAssist.IAiStreamEvent>): Promise<number> {
  let count = 0;
  for await (const event of iter) {
    count += event.type.length > 0 ? 1 : 0;
  }
  return count;
}

describe("executeClientToolTurn: caller-built OpenAI-format effort 'none'", () => {
  const originalFetch = global.fetch;
  const openai = getDescriptor('openai');
  const xai = getDescriptor('xai-grok');

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test.each(['gpt-6.1-sol', '@openai:flagship', 'gpt-6-astra', '@openai:pro'])(
    "refuses openAiEffort 'none' on %s before the wire",
    (model) => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model,
        resolvedThinking: { openAiEffort: 'none' }
      });
      expect(result).toFailWith(
        /executeClientToolTurn: gpt-6[.0-9a-z-]+ cannot run with thinking off: set openAiEffort to an effort other than 'none'/
      );
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  // The guard reads the same field the adapter sends (`openAiEffort ?? xaiEffort`), from the
  // descriptor's own list, so an xAI thinking-required model is refused the same way.
  test("refuses xaiEffort 'none' on grok-4.7 before the wire", () => {
    mockSse();
    const result = AiAssist.executeClientToolTurn({
      descriptor: xai,
      apiKey: 'k',
      ...prompt.toRequest(),
      clientTools: [],
      model: 'grok-4.7',
      resolvedThinking: { xaiEffort: 'none' }
    });
    expect(result).toFailWith(
      /executeClientToolTurn: grok-4\.7 cannot run with thinking off: set xaiEffort to an effort other than 'none'/
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test.each(['gpt-6-luna', 'gpt-6-sol'])(
    "sends openAiEffort 'none' to %s, which accepts it",
    async (model) => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model,
        resolvedThinking: { openAiEffort: 'none' }
      });
      await drain(result.orThrow().events);
      expect(sentBody()).toMatchObject({ model, reasoning: { effort: 'none' } });
    }
  );

  test('sends a non-none effort to a thinking-required model', async () => {
    mockSse();
    const result = AiAssist.executeClientToolTurn({
      descriptor: openai,
      apiKey: 'k',
      ...prompt.toRequest(),
      clientTools: [],
      model: 'gpt-6.1-sol',
      resolvedThinking: { openAiEffort: 'low' }
    });
    await drain(result.orThrow().events);
    expect(sentBody()).toMatchObject({ model: 'gpt-6.1-sol', reasoning: { effort: 'low' } });
  });

  // The converse: the Anthropic thinking-off flag is read only by the Anthropic adapter, so on an
  // OpenAI-format descriptor it is ignored rather than refused, even on a thinking-required model.
  test('ignores anthropicThinkingDisabled on an OpenAI-format descriptor', async () => {
    mockSse();
    const result = AiAssist.executeClientToolTurn({
      descriptor: openai,
      apiKey: 'k',
      ...prompt.toRequest(),
      clientTools: [],
      model: 'gpt-6.1-sol',
      resolvedThinking: { anthropicThinkingDisabled: true, openAiEffort: 'low' }
    });
    await drain(result.orThrow().events);
    expect(sentBody()).toMatchObject({ model: 'gpt-6.1-sol', reasoning: { effort: 'low' } });
  });

  test('still refuses anthropicThinkingDisabled on a thinking-required Anthropic model', () => {
    mockSse();
    expect(
      AiAssist.executeClientToolTurn({
        descriptor: getDescriptor('anthropic'),
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: '@anthropic:opus',
        resolvedThinking: { anthropicThinkingDisabled: true }
      })
    ).toFailWith(
      /executeClientToolTurn: claude-[a-z0-9-]+ cannot run with thinking off: drop anthropicThinkingDisabled/
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // An Anthropic-format adapter never reads openAiEffort, so the field is ignored there rather
  // than refused: the guard keys on the wire the descriptor speaks, not on the provider.
  test('ignores openAiEffort on an Anthropic-format descriptor', async () => {
    mockSse();
    const result = AiAssist.executeClientToolTurn({
      descriptor: getDescriptor('anthropic'),
      apiKey: 'k',
      ...prompt.toRequest(),
      clientTools: [],
      model: '@anthropic:opus',
      resolvedThinking: { openAiEffort: 'none', anthropicEffort: 'low' }
    });
    await drain(result.orThrow().events);
    expect(sentBody()).toMatchObject({ output_config: { effort: 'low' } });
  });
});

describe('gpt-6-luna and gpt-6-sol temperature with effort none, and gpt-6-sol beside an effort', () => {
  const originalFetch = global.fetch;
  const openai = getDescriptor('openai');

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // The documented case these two models support: a non-default temperature with effort 'none'.
  // Listing either on samplingParamsRejectedModelPrefixes would refuse this before the wire.
  test.each(['gpt-6-luna', '@openai:mini', 'gpt-6-sol'])(
    "sends temperature 0.3 with effort 'none' to %s",
    async (model) => {
      mockJson(openAiOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 0.3,
          thinking: { effort: 'none' }
        })
      ).toSucceed();
      expect(sentBody()).toMatchObject({ temperature: 0.3, reasoning_effort: 'none' });
    }
  );

  // gpt-6-sol is on neither list, so no accepted temperature applies to it, and 1 beside an effort
  // is the conflict like any other value — on all three paths, refused rather than silently dropped.
  const besideEffort: ReadonlyArray<[string, number]> = [
    ['gpt-6-sol', 1],
    ['gpt-6-sol', 0.3]
  ];
  const conflict = /thinking mode is not compatible with temperature on provider openai/;

  test.each(besideEffort)(
    'callProviderCompletion refuses %s with temperature %s beside effort low',
    async (model, temperature) => {
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature,
          thinking: { effort: 'low' }
        })
      ).toFailWith(conflict);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  test.each(besideEffort)(
    'callProviderCompletionStream refuses %s with temperature %s beside effort low',
    async (model, temperature) => {
      expect(
        await AiAssist.callProviderCompletionStream({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature,
          thinking: { effort: 'low' }
        })
      ).toFailWith(conflict);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  test.each(besideEffort)(
    'executeClientToolTurn refuses %s with temperature %s beside a caller-built effort low',
    (model, temperature) => {
      mockSse();
      expect(
        AiAssist.executeClientToolTurn({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model,
          temperature,
          resolvedThinking: { openAiEffort: 'low' }
        })
      ).toFailWith(conflict);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  test("executeClientToolTurn sends temperature 0.3 with a caller-built effort 'none' to gpt-6-luna", async () => {
    mockSse();
    const result = AiAssist.executeClientToolTurn({
      descriptor: openai,
      apiKey: 'k',
      ...prompt.toRequest(),
      clientTools: [],
      model: 'gpt-6-luna',
      temperature: 0.3,
      resolvedThinking: { openAiEffort: 'none' }
    });
    await drain(result.orThrow().events);
    expect(sentBody()).toMatchObject({ temperature: 0.3, reasoning: { effort: 'none' } });
  });
});

describe('gpt-6-luna restricts temperature only while reasoning', () => {
  const originalFetch = global.fetch;
  const openai = getDescriptor('openai');
  const whileReasoning =
    /gpt-6-luna does not accept a non-default temperature \(0\.3\) while reasoning: remove temperature, send 1, or set effort 'none'/;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('the descriptor lists gpt-6-luna on the while-reasoning list only', () => {
    expect(AiAssist.rejectsSamplingParamsWithThinking(openai, 'gpt-6-luna')).toBe(true);
    expect(AiAssist.rejectsSamplingParams(openai, 'gpt-6-luna')).toBe(false);
    expect(AiAssist.rejectsSamplingParamsWithThinking(openai, 'gpt-6-sol')).toBe(false);
    expect(AiAssist.rejectsSamplingParamsWithThinking(openai, 'gpt-6-lunar')).toBe(false);
    expect(AiAssist.rejectsSamplingParamsWithThinking(getDescriptor('anthropic'), 'gpt-6-luna')).toBe(false);
  });

  describe('callProviderCompletion', () => {
    test.each(['gpt-6-luna', '@openai:mini'])('sends temperature 1 beside effort low to %s', async (model) => {
      mockJson(openAiOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: model,
          temperature: 1,
          thinking: { effort: 'low' }
        })
      ).toSucceed();
      expect(sentBody()).toMatchObject({ model: 'gpt-6-luna', temperature: 1, reasoning_effort: 'low' });
    });

    test('sends temperature 1 with no effort (the default, medium)', async () => {
      mockJson(openAiOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'gpt-6-luna',
          temperature: 1
        })
      ).toSucceed();
      expect(sentBody()).toMatchObject({ temperature: 1 });
      expect(sentBody().reasoning_effort).toBeUndefined();
    });

    test.each([
      ['beside effort low', { effort: 'low' }],
      ['with no effort (the default, medium)', undefined]
    ] as ReadonlyArray<[string, AiAssist.IThinkingConfig | undefined]>)(
      'refuses temperature 0.3 %s before the wire',
      async (__label, thinking) => {
        expect(
          await AiAssist.callProviderCompletion({
            descriptor: openai,
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: 'gpt-6-luna',
            temperature: 0.3,
            thinking
          })
        ).toFailWith(whileReasoning);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );
  });

  describe('callProviderCompletionStream', () => {
    test("sends temperature 0.3 with effort 'none'", async () => {
      mockSse();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: 'gpt-6-luna',
        temperature: 0.3,
        thinking: { effort: 'none' }
      });
      await drain(result.orThrow());
      expect(sentBody()).toMatchObject({ temperature: 0.3, reasoning_effort: 'none' });
    });

    test('sends temperature 1 beside effort low', async () => {
      mockSse();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: 'gpt-6-luna',
        temperature: 1,
        thinking: { effort: 'low' }
      });
      await drain(result.orThrow());
      expect(sentBody()).toMatchObject({ temperature: 1, reasoning_effort: 'low' });
    });

    test.each([
      ['beside effort low', { effort: 'low' }],
      ['with no effort (the default, medium)', undefined]
    ] as ReadonlyArray<[string, AiAssist.IThinkingConfig | undefined]>)(
      'refuses temperature 0.3 %s before the wire',
      async (__label, thinking) => {
        expect(
          await AiAssist.callProviderCompletionStream({
            descriptor: openai,
            apiKey: 'k',
            ...prompt.toRequest(),
            modelOverride: 'gpt-6-luna',
            temperature: 0.3,
            thinking
          })
        ).toFailWith(whileReasoning);
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );
  });

  describe('executeClientToolTurn', () => {
    test('sends temperature 1 beside a caller-built effort low', async () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: 'gpt-6-luna',
        temperature: 1,
        resolvedThinking: { openAiEffort: 'low' }
      });
      await drain(result.orThrow().events);
      expect(sentBody()).toMatchObject({ temperature: 1, reasoning: { effort: 'low' } });
    });

    test.each([
      ['beside a caller-built effort low', { openAiEffort: 'low' }],
      ['with no resolved thinking (the default, medium)', undefined]
    ] as ReadonlyArray<[string, AiAssist.IResolvedThinkingConfig | undefined]>)(
      'refuses temperature 0.3 %s before the wire',
      (__label, resolvedThinking) => {
        mockSse();
        expect(
          AiAssist.executeClientToolTurn({
            descriptor: openai,
            apiKey: 'k',
            ...prompt.toRequest(),
            clientTools: [],
            model: 'gpt-6-luna',
            temperature: 0.3,
            resolvedThinking
          })
        ).toFailWith(
          /executeClientToolTurn: gpt-6-luna does not accept a non-default temperature \(0\.3\) while reasoning/
        );
        expect(global.fetch).not.toHaveBeenCalled();
      }
    );
  });

  // A verbatim 'other' block is merged last and wins on the wire, so its effort decides whether luna
  // reasons — in both directions.
  const otherOff: AiAssist.IThinkingConfig = {
    providers: [{ provider: 'other', models: ['gpt-6-luna'], config: { reasoning_effort: 'none' } }]
  };
  const otherOnOverNone: AiAssist.IThinkingConfig = {
    effort: 'none',
    providers: [{ provider: 'other', models: ['gpt-6-luna'], config: { reasoning_effort: 'low' } }]
  };

  describe("an 'other' block's effort decides", () => {
    test("callProviderCompletion sends 0.3 beside an 'other' reasoning_effort 'none'", async () => {
      mockJson(openAiOk);
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'gpt-6-luna',
          temperature: 0.3,
          thinking: otherOff
        })
      ).toSucceed();
      expect(sentBody()).toMatchObject({ temperature: 0.3, reasoning_effort: 'none' });
    });

    test("callProviderCompletion refuses 0.3 when an 'other' reasoning_effort low overrides a generic 'none'", async () => {
      expect(
        await AiAssist.callProviderCompletion({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'gpt-6-luna',
          temperature: 0.3,
          thinking: otherOnOverNone
        })
      ).toFailWith(whileReasoning);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("callProviderCompletionStream sends 0.3 beside an 'other' reasoning_effort 'none'", async () => {
      mockSse();
      const result = await AiAssist.callProviderCompletionStream({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        modelOverride: 'gpt-6-luna',
        temperature: 0.3,
        thinking: otherOff
      });
      await drain(result.orThrow());
      expect(sentBody()).toMatchObject({ temperature: 0.3, reasoning_effort: 'none' });
    });

    test("callProviderCompletionStream refuses 0.3 when an 'other' reasoning_effort low overrides a generic 'none'", async () => {
      expect(
        await AiAssist.callProviderCompletionStream({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          modelOverride: 'gpt-6-luna',
          temperature: 0.3,
          thinking: otherOnOverNone
        })
      ).toFailWith(whileReasoning);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test("executeClientToolTurn sends 0.3 beside an otherParams reasoning.effort 'none'", async () => {
      mockSse();
      const result = AiAssist.executeClientToolTurn({
        descriptor: openai,
        apiKey: 'k',
        ...prompt.toRequest(),
        clientTools: [],
        model: 'gpt-6-luna',
        temperature: 0.3,
        resolvedThinking: { otherParams: { reasoning: { effort: 'none' } } }
      });
      await drain(result.orThrow().events);
      expect(sentBody()).toMatchObject({ temperature: 0.3, reasoning: { effort: 'none' } });
    });

    test("executeClientToolTurn refuses 0.3 when otherParams reasoning.effort low overrides openAiEffort 'none'", () => {
      mockSse();
      expect(
        AiAssist.executeClientToolTurn({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model: 'gpt-6-luna',
          temperature: 0.3,
          resolvedThinking: { openAiEffort: 'none', otherParams: { reasoning: { effort: 'low' } } }
        })
      ).toFailWith(/executeClientToolTurn: gpt-6-luna does not accept a non-default temperature \(0\.3\) while reasoning/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // Only the fields the OpenAI-format adapter reads count: another wire's thinking-off field, or an
  // xaiEffort the adapter never sends beside an openAiEffort, leaves luna reasoning.
  test.each([
    ['anthropicThinkingDisabled', { anthropicThinkingDisabled: true }],
    ['geminiThinkingBudget 0', { geminiThinkingBudget: 0 }],
    ["openAiEffort low beside xaiEffort 'none'", { openAiEffort: 'low', xaiEffort: 'none' }]
  ] as ReadonlyArray<[string, AiAssist.IResolvedThinkingConfig]>)(
    'executeClientToolTurn refuses 0.3 with a caller-built %s on the OpenAI wire',
    (__label, resolvedThinking) => {
      mockSse();
      expect(
        AiAssist.executeClientToolTurn({
          descriptor: openai,
          apiKey: 'k',
          ...prompt.toRequest(),
          clientTools: [],
          model: 'gpt-6-luna',
          temperature: 0.3,
          resolvedThinking
        })
      ).toFailWith(/executeClientToolTurn: gpt-6-luna does not accept a non-default temperature \(0\.3\) while reasoning/);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );
});
