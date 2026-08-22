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

import '@fgv/ts-utils-jest';
import { Logging, type Result, fail, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import {
  PROBE_SCHEMA,
  type IProbeOutcome,
  type IProbeSpec,
  type ProbeComplete,
  runProbe,
  summarize
} from '../../../scenarios/structuredOutput/probe';
import {
  anthropicStructuredOutputScenario,
  geminiStructuredOutputScenario,
  openaiStructuredOutputScenario,
  xaiStructuredOutputScenario
} from '../../../scenarios/structuredOutput';
import type { ISecretSpec, IScenario, IScenarioContext } from '../../../shell';

const openai = AiAssist.getProviderDescriptor('openai').shouldNotFail('openai descriptor');

/** A valid reply matching {@link PROBE_SCHEMA}, with the requested enforcement. */
function validReply(
  enforcement: AiAssist.StructuredOutputEnforcement
): Result<AiAssist.IAiCompletionResponse> {
  return succeed({
    content: JSON.stringify({ city: 'Paris', countryCode: 'FR', populationMillions: 2.1 }),
    truncated: false,
    structuredOutput: enforcement
  });
}

const BASE_SPEC: IProbeSpec = {
  label: 'test probe',
  descriptor: openai,
  apiKey: 'test-key',
  request: { mode: 'schema', schema: PROBE_SCHEMA, onUnsupported: 'fail' },
  expect: 'schema'
};

/**
 * Builds a fully-shaped `IScenarioContext`; the default `resolveSecret` fails every
 * spec, which is the keyless STOP-FLAG shape. Mirrors `modelTiers.test.ts`'s helper.
 */
function makeContext(
  resolveSecret: IScenarioContext['resolveSecret'] = jest.fn(async (spec: ISecretSpec) =>
    fail<string>(`${spec.id} not set`)
  )
): IScenarioContext {
  return {
    logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() }),
    keyStore: undefined,
    resolveSecret,
    dataTree: {} as IScenarioContext['dataTree']
  };
}

// ---------------------------------------------------------------------------
// runProbe
// ---------------------------------------------------------------------------

describe('runProbe', () => {
  test('reports skipped and never calls complete when no API key resolved', async () => {
    const complete = jest.fn<ReturnType<ProbeComplete>, Parameters<ProbeComplete>>();
    const outcome = await runProbe(
      { ...BASE_SPEC, apiKey: undefined },
      new Logging.InMemoryLogger(),
      complete
    );
    expect(outcome).toEqual<IProbeOutcome>({
      label: 'test probe',
      verdict: 'skipped',
      detail: 'no API key resolved'
    });
    expect(complete).not.toHaveBeenCalled();
  });

  test('reports fail with the call-failure detail when complete fails', async () => {
    const complete: ProbeComplete = async () => fail('AI API returned 500: boom');
    const outcome = await runProbe(BASE_SPEC, new Logging.InMemoryLogger(), complete);
    expect(outcome.verdict).toBe('fail');
    expect(outcome.detail).toMatch(/call failed/i);
    expect(outcome.detail).toMatch(/boom/);
  });

  test('reports fail naming both enforcements when the reply reports a different one than expected', async () => {
    const complete: ProbeComplete = async () => validReply('json-mode');
    const outcome = await runProbe(BASE_SPEC, new Logging.InMemoryLogger(), complete);
    expect(outcome.verdict).toBe('fail');
    expect(outcome.detail).toMatch(/reported 'json-mode'/);
    expect(outcome.detail).toMatch(/expected 'schema'/);
  });

  test('reports fail saying the constraint did not reach the wire when content is not valid JSON', async () => {
    const complete: ProbeComplete = async () =>
      succeed({ content: 'not json at all', truncated: false, structuredOutput: 'schema' });
    const outcome = await runProbe(BASE_SPEC, new Logging.InMemoryLogger(), complete);
    expect(outcome.verdict).toBe('fail');
    expect(outcome.detail).toMatch(/did not parse as JSON/i);
    expect(outcome.detail).toMatch(/did not reach the wire/i);
  });

  test.each([
    [
      'an extra property the schema forbids',
      { city: 'Paris', countryCode: 'FR', populationMillions: 2.1, funFact: 'nope' }
    ],
    ['the wrong type for a field', { city: 'Paris', countryCode: 'FR', populationMillions: '2.1' }]
  ])('reports fail saying the reply does not match the schema when %s', async (description, badBody) => {
    const complete: ProbeComplete = async () =>
      succeed({ content: JSON.stringify(badBody), truncated: false, structuredOutput: 'schema' });
    const outcome = await runProbe(BASE_SPEC, new Logging.InMemoryLogger(), complete);
    expect(outcome.verdict).toBe('fail');
    expect(outcome.detail).toMatch(/does not match the schema that was sent/i);
  });

  test('reports pass when the reply reports the expected enforcement and validates', async () => {
    const complete: ProbeComplete = async () => validReply('schema');
    const outcome = await runProbe(BASE_SPEC, new Logging.InMemoryLogger(), complete);
    expect(outcome).toEqual<IProbeOutcome>({
      label: 'test probe',
      verdict: 'pass',
      detail: 'enforcement=schema'
    });
  });

  test('forwards tools, modelOverride, and structuredOutput verbatim into the completion params', async () => {
    const tools: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];
    const spec: IProbeSpec = { ...BASE_SPEC, tools, modelOverride: 'gpt-5.6-terra' };
    let seen: AiAssist.IProviderCompletionParams | undefined;
    const complete: ProbeComplete = async (params) => {
      seen = params;
      return validReply('schema');
    };
    await runProbe(spec, new Logging.InMemoryLogger(), complete);
    expect(seen?.tools).toBe(tools);
    expect(seen?.modelOverride).toBe('gpt-5.6-terra');
    expect(seen?.structuredOutput).toBe(spec.request);
    expect(seen?.apiKey).toBe('test-key');
    expect(seen?.descriptor).toBe(openai);
  });

  test('omits tools and modelOverride from the completion params when the spec omits them', async () => {
    let seen: AiAssist.IProviderCompletionParams | undefined;
    const complete: ProbeComplete = async (params) => {
      seen = params;
      return validReply('schema');
    };
    await runProbe(BASE_SPEC, new Logging.InMemoryLogger(), complete);
    expect(seen).toBeDefined();
    expect('tools' in (seen as AiAssist.IProviderCompletionParams)).toBe(false);
    expect('modelOverride' in (seen as AiAssist.IProviderCompletionParams)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// summarize
// ---------------------------------------------------------------------------

describe('summarize', () => {
  const pass = (label: string): IProbeOutcome => ({ label, verdict: 'pass', detail: 'enforcement=schema' });
  const failed = (label: string): IProbeOutcome => ({ label, verdict: 'fail', detail: 'boom' });
  const skipped = (label: string): IProbeOutcome => ({
    label,
    verdict: 'skipped',
    detail: 'no API key resolved'
  });

  test('succeeds and names the counts when every probe passed', () => {
    expect(summarize([pass('a'), pass('b')])).toSucceedAndSatisfy((message: string) => {
      expect(message).toMatch(/2 passed, 0 skipped/);
      expect(message).toMatch(/PASS/);
    });
  });

  test('fails and lists every failed probe when any probe failed', () => {
    expect(summarize([pass('a'), failed('b'), failed('c')])).toFailWith(/2 of 3 probes failed/i);
    expect(summarize([pass('a'), failed('b'), failed('c')])).toFailWith(/FAIL\s+b/);
    expect(summarize([pass('a'), failed('b'), failed('c')])).toFailWith(/FAIL\s+c/);
  });

  test('fails when every probe was skipped — a green run for no calls is the gate that stopped gating', () => {
    expect(summarize([skipped('a'), skipped('b')])).toFailWith(/no probe ran/i);
    expect(summarize([skipped('a'), skipped('b')])).toFailWith(/every provider was skipped/i);
  });

  test('succeeds on a mix of pass and skipped, naming both counts', () => {
    expect(summarize([pass('a'), skipped('b'), skipped('c')])).toSucceedAndSatisfy((message: string) => {
      expect(message).toMatch(/1 passed, 2 skipped/);
    });
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata + keyless cli.run (STOP-FLAG: no probe ran)
// ---------------------------------------------------------------------------

describe('structured-output scenarios', () => {
  const scenariosById: ReadonlyArray<[string, IScenario, string]> = [
    ['openai-structured-output', openaiStructuredOutputScenario, 'OPENAI_API_KEY'],
    ['anthropic-structured-output', anthropicStructuredOutputScenario, 'ANTHROPIC_API_KEY'],
    ['google-gemini-structured-output', geminiStructuredOutputScenario, 'GOOGLE_GEMINI_API_KEY'],
    ['xai-grok-structured-output', xaiStructuredOutputScenario, 'XAI_API_KEY']
  ];

  test.each(scenariosById)('%s declares its id, required secret, and tags', (id, scenario, envVarName) => {
    expect(scenario.id).toBe(id);
    expect(scenario.category).toBe('ai');
    expect(scenario.tags).toContain('structured-output');
    expect(scenario.tags).toContain('live-api');
    expect(scenario.requiredSecrets?.length).toBeGreaterThan(0);
    expect(scenario.requiredSecrets?.map((s) => s.envVarName)).toContain(envVarName);
    expect(scenario.cli).toBeDefined();
    expect(scenario.cli?.webRunnable).toBe(true);
  });

  test('openai cli.run without a resolvable API key fails with the no-probe-ran message', async () => {
    if (!openaiStructuredOutputScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    const result = await openaiStructuredOutputScenario.cli.run(makeContext());
    expect(result).toFailWith(/no probe ran — every provider was skipped for want of an API key/i);
    expect(result).toFailWith(/SKIPPED\s+openai schema \(chat completions\)/);
    expect(result).toFailWith(/SKIPPED\s+openai json-object/);
  });

  test('anthropic cli.run without a resolvable API key fails with the no-probe-ran message', async () => {
    if (!anthropicStructuredOutputScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    const result = await anthropicStructuredOutputScenario.cli.run(makeContext());
    expect(result).toFailWith(/no probe ran — every provider was skipped for want of an API key/i);
    expect(result).toFailWith(/SKIPPED\s+anthropic tool-forced/);
  });

  test('gemini cli.run without a resolvable API key fails with the no-probe-ran message', async () => {
    if (!geminiStructuredOutputScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    const result = await geminiStructuredOutputScenario.cli.run(makeContext());
    expect(result).toFailWith(/no probe ran — every provider was skipped for want of an API key/i);
  });

  test('xai cli.run without a resolvable API key fails with the no-probe-ran message', async () => {
    if (!xaiStructuredOutputScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    const result = await xaiStructuredOutputScenario.cli.run(makeContext());
    expect(result).toFailWith(/no probe ran — every provider was skipped for want of an API key/i);
  });
});
