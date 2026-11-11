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
 *   `samplingParamsRejectedModelPrefixes`: they take a non-default temperature with effort `'none'`,
 *   so a temperature beside any other effort is the thinking/temperature conflict, `1` included —
 *   refused before the wire on the completion, streaming and client-tool paths alike;
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

describe('gpt-6-luna and gpt-6-sol temperature beside an effort', () => {
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

  // Not listed, so no accepted temperature is declared for them, and 1 beside an effort is the
  // conflict like any other value — on all three paths, refused rather than silently dropped.
  // Whether the provider takes 1 there is the testbed's OBSERVED row.
  const besideEffort: ReadonlyArray<[string, number]> = [
    ['gpt-6-luna', 1],
    ['gpt-6-luna', 0.3],
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
