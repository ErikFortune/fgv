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

// The requests the model-tier canary's live seam sends, run through the real
// `callProviderCompletion` against a stubbed global `fetch`. jsdom provides no `fetch`, so this file
// installs a jest mock in its place for the duration of the file and removes it afterwards.

import '@fgv/ts-utils-jest';
import { Logging, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import { isLocalRefusal } from '../../../scenarios/modelTiers/canary';
import {
  anthropicModelTiersScenario,
  buildCanaryCompletionParams,
  geminiModelTiersScenario,
  openaiModelTiersScenario,
  rawNoneBlock
} from '../../../scenarios/modelTiers';
import type { IScenario, IScenarioContext } from '../../../shell';

const openai = AiAssist.getProviderDescriptor('openai').shouldNotFail('openai descriptor');
const anthropic = AiAssist.getProviderDescriptor('anthropic').shouldNotFail('anthropic descriptor');
const gemini = AiAssist.getProviderDescriptor('google-gemini').shouldNotFail('google-gemini descriptor');
const xai = AiAssist.getProviderDescriptor('xai-grok').shouldNotFail('xai-grok descriptor');
const groq = AiAssist.getProviderDescriptor('groq').shouldNotFail('groq descriptor');

/** A request the stubbed `fetch` received: the URL and the parsed JSON body. */
interface ISentRequest {
  readonly url: string;
  readonly body: Record<string, unknown>;
}

/** A provider stand-in: given a request, the HTTP status and JSON body to answer with. */
type FakeProvider = (request: ISentRequest) => { status: number; json: unknown };

/** The stand-in `fetch`; installed on `globalThis` for this file only (jsdom has none). */
const fetchMock: jest.Mock = jest.fn();

beforeAll(() => {
  Object.defineProperty(globalThis, 'fetch', { value: fetchMock, configurable: true, writable: true });
});

afterAll(() => {
  delete (globalThis as { fetch?: unknown }).fetch;
});

/** The parts of `Response` the ai-assist HTTP layer reads. */
function fakeResponse(status: number, json: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(json),
    json: async () => json
  } as unknown as Response;
}

/** Answers every `fetch` with `provider`, recording every request it receives. */
function stubFetch(provider: FakeProvider): ISentRequest[] {
  const sent: ISentRequest[] = [];
  fetchMock.mockImplementation(async (input: unknown, init?: { body?: unknown }) => {
    const request: ISentRequest = {
      url: String(input),
      body: JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
    };
    sent.push(request);
    const answer = provider(request);
    return fakeResponse(answer.status, answer.json);
  });
  return sent;
}

/** A keyed scenario context: every secret resolves to a dummy key, so the live seam is wired. */
function keyedContext(): IScenarioContext {
  return {
    logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() }),
    keyStore: undefined,
    resolveSecret: async () => succeed('test-key'),
    dataTree: {} as IScenarioContext['dataTree']
  };
}

async function runScenario(scenario: IScenario): Promise<ReturnType<NonNullable<IScenario['cli']>['run']>> {
  if (!scenario.cli) {
    throw new Error('expected a CLI implementation');
  }
  return scenario.cli.run(keyedContext());
}

afterEach(() => {
  fetchMock.mockReset();
});

// ---------------------------------------------------------------------------
// rawNoneBlock / buildCanaryCompletionParams
// ---------------------------------------------------------------------------

describe('rawNoneBlock', () => {
  test.each([
    [openai, { provider: 'openai', config: { effort: 'none' } }],
    [xai, { provider: 'xai', config: { effort: 'none' } }],
    [gemini, { provider: 'google', config: { thinkingBudget: 0 } }],
    [
      anthropic,
      { provider: 'other', models: ['claude-sonnet-5-5'], config: { thinking: { type: 'disabled' } } }
    ]
  ])("sends %s's own thinking-off value", (descriptor, expected) => {
    expect(rawNoneBlock(descriptor, 'claude-sonnet-5-5')).toSucceedWith(
      expected as AiAssist.IThinkingProviderConfig
    );
  });

  test('fails for a provider with no off value, rather than sending no thinking config', () => {
    expect(rawNoneBlock(groq, 'x')).toFailWith(/groq: no raw 'none' block for this provider/);
  });
});

describe('buildCanaryCompletionParams', () => {
  test('a plain base-tier request sends the tiny prompt and no tier', () => {
    expect(buildCanaryCompletionParams(anthropic, 'k', 'base')).toSucceedWith({
      descriptor: anthropic,
      apiKey: 'k',
      messages: [{ role: 'user', content: 'Reply with the single word: pong.' }],
      tier: undefined
    });
  });

  test('passes every option it is given through', () => {
    const structuredOutput: AiAssist.StructuredOutputRequest = { mode: 'json-object' };
    expect(
      buildCanaryCompletionParams(anthropic, 'k', 'advanced', {
        modelOverride: '@anthropic:haiku',
        effort: 'none',
        onUnsupported: 'fail',
        structuredOutput,
        temperature: 0.3,
        maxTokens: 128000
      })
    ).toSucceedAndSatisfy((params) => {
      expect(params.tier).toBe('advanced');
      expect(params.modelOverride).toBe('@anthropic:haiku');
      expect(params.thinking).toEqual({ effort: 'none', onUnsupported: 'fail' });
      expect(params.structuredOutput).toBe(structuredOutput);
      expect(params.temperature).toBe(0.3);
      expect(params.maxTokens).toBe(128000);
    });
  });

  test('an effort without onUnsupported sends only the effort', () => {
    expect(buildCanaryCompletionParams(openai, 'k', 'base', { effort: 'low' })).toSucceedAndSatisfy(
      (params) => {
        expect(params.thinking).toEqual({ effort: 'low' });
      }
    );
  });

  test("a raw 'none' sends the provider block for the model the request reaches", () => {
    expect(
      buildCanaryCompletionParams(anthropic, 'k', 'base', {
        modelOverride: '@anthropic:fable',
        rawNone: true
      })
    ).toSucceedAndSatisfy((params) => {
      expect(params.thinking).toEqual({
        providers: [
          { provider: 'other', models: ['claude-fable-5-2'], config: { thinking: { type: 'disabled' } } }
        ]
      });
    });
  });

  test('a raw temperature goes in an other block for the model the request reaches, not as temperature', () => {
    expect(buildCanaryCompletionParams(openai, 'k', 'advanced', { rawTemperature: 1 })).toSucceedAndSatisfy(
      (params) => {
        expect(params.temperature).toBeUndefined();
        expect(params.thinking).toEqual({
          providers: [{ provider: 'other', models: ['gpt-6.1-sol'], config: { temperature: 1 } }]
        });
      }
    );
    expect(
      buildCanaryCompletionParams(openai, 'k', 'base', { rawTemperature: 1, effort: 'low' })
    ).toSucceedAndSatisfy((params) => {
      expect(params.thinking).toEqual({
        effort: 'low',
        providers: [{ provider: 'other', models: ['gpt-6-luna'], config: { temperature: 1 } }]
      });
    });
  });

  test.each(['advanced' as const, 'frontier' as const])(
    'a raw temperature 1 reaches the wire on openai %s, past the local gate',
    async (tier) => {
      const sent = stubFetch(() => ({
        status: 200,
        json: { choices: [{ message: { role: 'assistant', content: 'pong' }, finish_reason: 'stop' }] }
      }));
      const params = buildCanaryCompletionParams(openai, 'k', tier, { rawTemperature: 1 }).orThrow();
      expect(await AiAssist.callProviderCompletion(params)).toSucceed();
      expect(sent).toHaveLength(1);
      expect(sent[0].body.temperature).toBe(1);
    }
  );

  test('a raw temperature fails for an unresolvable model', () => {
    expect(
      buildCanaryCompletionParams(openai, 'k', 'base', { modelOverride: '@openai:nope', rawTemperature: 1 })
    ).toFail();
  });

  test("a raw 'none' fails for an unresolvable model or a provider with no off value", () => {
    expect(
      buildCanaryCompletionParams(anthropic, 'k', 'base', { modelOverride: '@anthropic:nope', rawNone: true })
    ).toFail();
    expect(buildCanaryCompletionParams(groq, 'k', 'base', { rawNone: true })).toFailWith(
      /no raw 'none' block/
    );
  });
});

// ---------------------------------------------------------------------------
// Refused-locally requests never reach fetch
// ---------------------------------------------------------------------------

describe('a refused-locally request is refused before fetch', () => {
  test.each([
    ['anthropic', anthropic, 'base' as const, { temperature: 0.3 }],
    ['anthropic', anthropic, 'base' as const, { modelOverride: '@anthropic:haiku', temperature: 0.3 }],
    [
      'anthropic',
      anthropic,
      'advanced' as const,
      { effort: 'none' as const, onUnsupported: 'fail' as const }
    ],
    [
      'anthropic',
      anthropic,
      'base' as const,
      { modelOverride: '@anthropic:fable', effort: 'none' as const, onUnsupported: 'fail' as const }
    ],
    ['openai', openai, 'advanced' as const, { temperature: 0.3 }],
    ['openai', openai, 'frontier' as const, { temperature: 0.3 }],
    ['gemini', gemini, 'advanced' as const, { effort: 'none' as const, onUnsupported: 'fail' as const }],
    ['gemini', gemini, 'advanced' as const, { thinkingLevel: 'minimal' as const }]
  ])('%s %s %j', async (__, descriptor, tier, options) => {
    const sent = stubFetch(() => ({ status: 200, json: {} }));
    const params = buildCanaryCompletionParams(descriptor, 'k', tier, options).orThrow();
    const result = await AiAssist.callProviderCompletion(params);
    expect(result).toFail();
    expect(sent).toHaveLength(0);
    expect(isLocalRefusal(result.isFailure() ? result.message : '')).toBe(true);
  });
});

describe('max-output requests carry the recorded limit on the wire', () => {
  // gemini-4-argon records 32,768: a single non-streaming generateContent request returns at most that.
  test.each([
    ['base' as const, 'gemini-3.8-flash', 65536],
    ['advanced' as const, 'gemini-4-argon', 32768],
    ['frontier' as const, 'gemini-4-argon', 32768]
  ])('gemini %s (%s) sends generationConfig.maxOutputTokens %d', async (tier, concrete, expected) => {
    const sent = stubFetch(() => ({
      status: 200,
      json: { candidates: [{ content: { parts: [{ text: 'pong' }] }, finishReason: 'STOP' }] }
    }));
    const limit = AiAssist.resolveMaxOutputTokens(gemini, undefined, tier === 'base' ? undefined : tier);
    expect(limit).toBe(expected);
    const params = buildCanaryCompletionParams(gemini, 'k', tier, { maxTokens: limit }).orThrow();
    expect(await AiAssist.callProviderCompletion(params)).toSucceed();
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toContain(concrete);
    expect((sent[0].body.generationConfig as { maxOutputTokens?: number }).maxOutputTokens).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Keyed dry runs: the real scenarios, through the real library, against a fake provider
// ---------------------------------------------------------------------------

/** Ids the fake Anthropic rejects `thinking: {type: 'disabled'}` for (Anthropic's thinking page). */
const ANTHROPIC_REJECTS_DISABLED: ReadonlyArray<string> = [
  'claude-sonnet-5-5',
  'claude-opus-5-5',
  'claude-fable-5-2'
];

/** Ids the fake Anthropic accepts `thinking: {type: 'between_tools'}` for (live, 2026-11-09). */
const ANTHROPIC_ACCEPTS_BETWEEN_TOOLS: ReadonlyArray<string> = ['claude-sonnet-5-5'];

/** Answers like Anthropic's Messages API, applying the documented rejections the probes exercise. */
const fakeAnthropic: FakeProvider = ({ body }) => {
  const thinking = body.thinking as { type?: string } | undefined;
  if (thinking?.type === 'between_tools') {
    const effort = (body.output_config as { effort?: string } | undefined)?.effort;
    if (
      !ANTHROPIC_ACCEPTS_BETWEEN_TOOLS.includes(String(body.model)) ||
      effort === 'xhigh' ||
      effort === 'max'
    ) {
      return {
        status: 400,
        json: { error: { message: 'thinking.type between_tools is not supported here' } }
      };
    }
  }
  if (thinking?.type === 'disabled' && ANTHROPIC_REJECTS_DISABLED.includes(String(body.model))) {
    // The wording Anthropic's errors page documents for this 400.
    return {
      status: 400,
      json: {
        error: {
          message:
            'To turn thinking off on this model, send "thinking": {"type": "between_tools"} instead of "disabled".'
        }
      }
    };
  }
  if (body.temperature !== undefined && body.temperature !== 1) {
    return { status: 400, json: { error: { message: 'non-default temperature' } } };
  }
  const toolChoice = body.tool_choice as { name?: string } | undefined;
  const content =
    toolChoice?.name !== undefined
      ? [{ type: 'tool_use', id: 't1', name: toolChoice.name, input: { answer: 'pong' } }]
      : [{ type: 'text', text: '{"answer":"pong"}' }];
  return { status: 200, json: { content, stop_reason: 'end_turn' } };
};

/** Answers like OpenAI chat completions and image generation, with GPT-6's temperature rule. */
const fakeOpenAi: FakeProvider = ({ url, body }) => {
  if (url.endsWith('/images/generations')) {
    return { status: 200, json: { data: [{ b64_json: 'aGVsbG8=' }] } };
  }
  const effort = body.reasoning_effort;
  if (effort === 'none' && ['gpt-6.1-sol', 'gpt-6-astra'].includes(String(body.model))) {
    return { status: 400, json: { error: { message: "'reasoning_effort' does not support 'none'" } } };
  }
  // sol, astra and luna take their default, 1, at any effort (live, 2026-11-10 and 2026-11-11); a
  // non-default value needs effort 'none', which sol and astra lack. The text is luna's live 400.
  if (body.temperature !== undefined && effort !== 'none' && body.temperature !== 1) {
    return {
      status: 400,
      json: {
        error: {
          message:
            `Unsupported value: 'temperature' does not support ${String(body.temperature)} with this model. ` +
            'Only the default (1) value is supported.'
        }
      }
    };
  }
  return {
    status: 200,
    json: { choices: [{ message: { role: 'assistant', content: 'pong' }, finish_reason: 'stop' }] }
  };
};

describe('anthropic-model-tiers, keyed, against a fake Anthropic', () => {
  test('every new row lands on its stated outcome, and refused rows send nothing', async () => {
    const sent = stubFetch(fakeAnthropic);
    const result = await runScenario(anthropicModelTiersScenario);
    expect(result).toSucceedAndSatisfy((report: string) => {
      // haiku 'none' sends disabled and sonnet 'none' sends between_tools; both answer. The
      // thinking-required models degrade to 'low' and answer.
      expect(report).toMatch(
        /\[PASS\] @anthropic:haiku effort=none\s+claude-haiku-5-5\s+\(sent with thinking off\)/
      );
      expect(report).toMatch(
        /\[PASS\] base effort=none\s+claude-sonnet-5-5\s+\(sent with thinking off \(between_tools\)\)/
      );
      expect(report).toMatch(
        /\[PASS\] advanced effort=none\s+claude-opus-5-5\s+\(degraded to 'low' \(thinking-required\)\)/
      );
      expect(report).toMatch(/\[PASS\] @anthropic:fable effort=low\s+claude-fable-5-2/);
      // 'fail' answers on sonnet (between_tools) and refuses locally on the thinking-required models.
      // Raw disabled is the provider's 400 on all four; its own text is shown after the stated reason.
      expect(report).toMatch(/\[PASS\] base none\+fail\s+claude-sonnet-5-5\n/);
      expect(report).toMatch(
        /\[EXPECTED-REJECT\] base none raw\s+claude-sonnet-5-5\s+\(the provider still rejects disabled; this model's off value is between_tools: AI API returned 400: .*between_tools/
      );
      for (const label of ['advanced', 'frontier', '@anthropic:fable']) {
        expect(report).toContain(`[REFUSED-LOCALLY] ${label} none+fail `);
        expect(report).toContain(`[EXPECTED-REJECT] ${label} none raw `);
      }
      expect(report).toMatch(/\[PASS\] @anthropic:haiku none\+fail\s+claude-haiku-5-5/);
      expect(report).not.toMatch(/@anthropic:haiku none raw/);
      // Temperature: 1 answers with and without 'low'; 0.3 is refused locally everywhere.
      expect(report).toMatch(/\[PASS\] @anthropic:haiku temp=1\s/);
      expect(report).toMatch(/\[PASS\] base temp=1\+effort=low\s/);
      expect(report).toMatch(/\[REFUSED-LOCALLY\] @anthropic:haiku temp=0\.3\s/);
      expect(report).toMatch(/\[REFUSED-LOCALLY\] base temp=0\.3\s/);
      // Max output at the recorded limit answers.
      expect(report).toMatch(/\[PASS\] @anthropic:fable max=128000\s+claude-fable-5-2/);
      expect(report).toMatch(/LIVE-VERIFIED/);
    });

    // What the wire actually carried.
    const bodies = sent.map((s) => s.body);
    expect(bodies.some((b) => b.temperature === 0.3)).toBe(false);
    expect(bodies.filter((b) => b.temperature === 1)).toHaveLength(10);
    const haikuDisabled = bodies.filter(
      (b) => b.model === 'claude-haiku-5-5' && (b.thinking as { type?: string })?.type === 'disabled'
    );
    // haiku effort=none and haiku none+fail — both send thinking disabled.
    expect(haikuDisabled).toHaveLength(2);
    // sonnet effort=none and none+fail go out as between_tools, with no effort beside it.
    const sonnetOff = bodies.filter(
      (b) => b.model === 'claude-sonnet-5-5' && (b.thinking as { type?: string })?.type === 'between_tools'
    );
    expect(sonnetOff).toHaveLength(2);
    for (const b of sonnetOff) {
      expect(b.output_config).toBeUndefined();
    }
    // opus effort=none goes out as adaptive 'low'.
    expect(bodies).toContainEqual(
      expect.objectContaining({
        model: 'claude-opus-5-5',
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low' }
      })
    );
    expect(bodies.filter((b) => b.max_tokens === 128000)).toHaveLength(5);
  });
});

describe('openai-model-tiers, keyed, against a fake OpenAI', () => {
  test('temperature rows land on their stated outcomes, and refused rows send nothing', async () => {
    const sent = stubFetch(fakeOpenAi);
    const result = await runScenario(openaiModelTiersScenario);
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PASS\] base temp=0\.3\+effort=none\s+gpt-6-luna/);
      expect(report).toMatch(/\[REFUSED-LOCALLY\] base temp=0\.3\s+gpt-6-luna/);
      expect(report).toMatch(/\[PASS\] base temp=1\s+gpt-6-luna/);
      expect(report).toMatch(/\[PASS\] base temp=1\+effort=low\s+gpt-6-luna/);
      expect(report).toMatch(/\[REFUSED-LOCALLY\] base temp=0\.3\+effort=low\s+gpt-6-luna/);
      // The raw row reaches the provider past the local gate, and its 400 is the expected one.
      expect(report).toMatch(
        /\[EXPECTED-REJECT\] base temp=0\.3\+effort=low raw\s+gpt-6-luna\s+\(.*Only the default \(1\) value is supported/
      );
      expect(report).toMatch(/\[REFUSED-LOCALLY\] advanced temp=0\.3\s+gpt-6\.1-sol/);
      expect(report).toMatch(/\[REFUSED-LOCALLY\] frontier temp=0\.3\s+gpt-6-astra/);
      // The default, 1, is sent through the library and answers, with and without an effort.
      expect(report).toMatch(/\[PASS\] advanced temp=1\s+gpt-6\.1-sol/);
      expect(report).toMatch(/\[PASS\] frontier temp=1\s+gpt-6-astra/);
      expect(report).toMatch(/\[PASS\] advanced temp=1\+effort=low\s+gpt-6\.1-sol/);
      expect(report).toMatch(/\[PASS\] frontier temp=1\+effort=low\s+gpt-6-astra/);
      expect(report).not.toMatch(/\[OBSERVED\]/);
      expect(report).not.toMatch(/(advanced|frontier) temp=[0-9.]+(\+effort=low)? raw/);
      expect(report).toMatch(/\[PASS\] frontier max=128000\s+gpt-6-astra/);
      expect(report).toMatch(/LIVE-VERIFIED/);
    });
    const bodies = sent.map((s) => s.body);
    // luna carries 0.3 only with reasoning_effort 'none' through the library, 1 alone and beside 'low', and
    // 0.3 beside 'low' only on the raw row, past the library's gate; sol and astra carry 1, as the
    // temperature parameter, alone and beside reasoning_effort 'low'. Nothing carries 0.3 to sol or
    // astra, and nothing carries 0.3 to luna without an effort.
    expect(
      bodies
        .filter((b) => b.temperature !== undefined)
        .map((b) => [b.model, b.temperature, b.reasoning_effort])
    ).toEqual([
      ['gpt-6-luna', 0.3, 'none'],
      ['gpt-6-luna', 1, undefined],
      ['gpt-6-luna', 1, 'low'],
      ['gpt-6-luna', 0.3, 'low'],
      ['gpt-6.1-sol', 1, undefined],
      ['gpt-6-astra', 1, undefined],
      ['gpt-6.1-sol', 1, 'low'],
      ['gpt-6-astra', 1, 'low']
    ]);
    expect(bodies.filter((b) => b.max_completion_tokens === 128000)).toHaveLength(3);
  });
});

/**
 * Answers like Gemini generateContent: text, image parts for the image model, and the rejections
 * of each model's raw off value: budget 0 on a budget-wire Pro model, and a level a level model does
 * not list (Gemini 4's 'minimal'). gemini-3.8-flash accepts budget 0, as it does live.
 */
const fakeGemini: FakeProvider = ({ url, body }) => {
  if (url.includes('nano-banana')) {
    return {
      status: 200,
      json: {
        candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'aGVsbG8=' } }] } }]
      }
    };
  }
  const config = body.generationConfig as
    | { thinkingConfig?: { thinkingBudget?: number; thinkingLevel?: string } }
    | undefined;
  if (config?.thinkingConfig?.thinkingBudget === 0 && url.includes('pro')) {
    return {
      status: 400,
      json: { error: { message: 'Budget 0 is invalid. This model only works in thinking mode.' } }
    };
  }
  if (config?.thinkingConfig?.thinkingLevel === 'minimal' && url.includes('gemini-4')) {
    return {
      status: 400,
      json: { error: { message: 'Thinking level MINIMAL is not supported for this model.' } }
    };
  }
  return {
    status: 200,
    json: { candidates: [{ content: { parts: [{ text: 'pong' }] }, finishReason: 'STOP' }] }
  };
};

describe('google-gemini-model-tiers, keyed, against a fake Gemini', () => {
  test('thinking rows send the declared wire, and max-output rows the recorded limit', async () => {
    const sent = stubFetch(fakeGemini);
    const result = await runScenario(geminiModelTiersScenario);
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PASS\] @google-gemini:flash-lite max=65536\s+gemini-3\.5-flash-lite/);
      expect(report).toMatch(/\[EXPECTED-REJECT\] advanced none raw\s+gemini-4-argon\s+\(.*Thinking level/);
      expect(report).toMatch(/\[REFUSED-LOCALLY\] advanced none\+fail\s+gemini-4-argon/);
      expect(report).toMatch(
        /\[PASS\] advanced effort=none\s+gemini-4-argon\s+\(degraded to thinkingLevel 'low' \(thinking-required\)\)/
      );
      expect(report).toMatch(
        /\[PASS\] advanced level=low\s+gemini-4-argon\s+\(thinkingLevel 'low' accepted\)/
      );
      expect(report).toMatch(
        /\[PASS\] @google-gemini:flash-lite effort=none\s+gemini-3\.5-flash-lite\s+\(sent as thinkingLevel 'minimal'\)/
      );
      expect(report).toMatch(/\[PASS\] @google-gemini:flash-lite none\+fail\s+gemini-3\.5-flash-lite/);
      expect(report).toMatch(/\[PASS\] @google-gemini:flash-lite level=minimal\s+gemini-3\.5-flash-lite/);
      // gemini-3.8-flash turns thinking off with budget 0 (live, 2026-11-10): 'none' is sent as
      // budget 0 and answers, and onUnsupported 'fail' has nothing to refuse.
      expect(report).toMatch(/\[PASS\] base effort=none\s+gemini-3\.8-flash\s+\(sent with thinking off\)/);
      expect(report).toMatch(/\[PASS\] base none\+fail\s+gemini-3\.8-flash/);
      expect(report).not.toMatch(/base none raw|base level=/);
      expect(report).toMatch(/\[PASS\] image\s+gemini-nano-banana-2\.1/);
      expect(report).toMatch(/LIVE-VERIFIED/);
    });
    const thinkingConfigs = sent
      .map((s) => ({
        model: s.url.match(/models\/([^:]+)/)?.[1],
        thinking: (s.body.generationConfig as { thinkingConfig?: Record<string, unknown> } | undefined)
          ?.thinkingConfig
      }))
      .filter((s) => s.thinking !== undefined);
    // Budget 0 goes only to gemini-3.8-flash (effort=none and none+fail); no level model is ever
    // sent a budget, and no budget model a level.
    expect(thinkingConfigs.filter((s) => s.thinking?.thinkingBudget === 0).map((s) => s.model)).toEqual([
      'gemini-3.8-flash',
      'gemini-3.8-flash'
    ]);
    expect(
      thinkingConfigs.filter((s) => s.thinking?.thinkingBudget !== undefined).map((s) => s.model)
    ).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.8-flash']);
    expect(
      thinkingConfigs
        .filter((s) => s.thinking?.thinkingLevel !== undefined)
        .map((s) => [s.model, s.thinking?.thinkingLevel])
    ).toEqual([
      // advanced: effort none (degraded), low, high; then frontier (same id by cascade)
      ['gemini-4-argon', 'low'],
      ['gemini-4-argon', 'low'],
      ['gemini-4-argon', 'high'],
      ['gemini-4-argon', 'low'],
      ['gemini-4-argon', 'low'],
      ['gemini-4-argon', 'high'],
      // flash-lite: effort none, low, high
      ['gemini-3.5-flash-lite', 'minimal'],
      ['gemini-3.5-flash-lite', 'low'],
      ['gemini-3.5-flash-lite', 'high'],
      // strict none: argon refuses locally and sends its raw minimal row (advanced, frontier);
      // flash-lite's none+fail is sent as minimal
      ['gemini-4-argon', 'minimal'],
      ['gemini-4-argon', 'minimal'],
      ['gemini-3.5-flash-lite', 'minimal'],
      // explicit-level rows: each target's lowest declared level
      ['gemini-4-argon', 'low'],
      ['gemini-4-argon', 'low'],
      ['gemini-3.5-flash-lite', 'minimal']
    ]);
    const capped = sent
      .map((s) => [
        s.url.match(/models\/([^:]+)/)?.[1],
        (s.body.generationConfig as { maxOutputTokens?: number } | undefined)?.maxOutputTokens
      ])
      .filter(([, max]) => max !== undefined);
    expect(capped).toEqual([
      ['gemini-3.8-flash', 65536],
      ['gemini-4-argon', 32768],
      ['gemini-4-argon', 32768],
      ['gemini-3.5-flash-lite', 65536]
    ]);
  });
});
