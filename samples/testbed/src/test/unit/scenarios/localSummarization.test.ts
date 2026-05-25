/**
 * Unit tests for the `localSummarization` CLI scenario.
 *
 * The Node facade (`@fgv/ts-extras-transformers`) is mocked at module load (hoisted). The scenario
 * loads it via a `webpackIgnore` dynamic import, which resolves to this automock — so the real
 * model is never downloaded; we assert wiring + Result behaviour with canned outputs.
 *
 * @packageDocumentation
 */

// jest.mock must precede all imports (hoist-jest-mock rule).
jest.mock('@fgv/ts-extras-transformers');

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';
import * as transformers from '@fgv/ts-extras-transformers';
import type { SummarizationPipeline, SummarizationOutput } from '@fgv/ts-extras-transformers';
import type { IScenarioContext } from '../../../shell';

import { localSummarizationScenario } from '../../../scenarios/localSummarization';

// Node facade accessors (the CLI scenario reaches these via its dynamic import).
const mockLoadPipeline = jest.mocked(transformers.loadPipeline);
const mockSummarize = jest.mocked(transformers.summarize);

/** Dummy pipeline reference (no-op; summarize is mocked). */
const DUMMY_SUMMARIZER = {} as SummarizationPipeline;

/** Minimal `IScenarioContext` for the CLI run test. */
function makeScenarioCtx(): IScenarioContext {
  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    } as unknown as IScenarioContext['logger'],
    keyStore: undefined,
    resolveSecret: jest.fn(),
    dataTree: {} as IScenarioContext['dataTree']
  };
}

describe('localSummarization cli impl: run()', () => {
  beforeEach(() => {
    mockLoadPipeline.mockReset();
    mockSummarize.mockReset();
  });

  test('run succeeds and returns the summary + compaction note', async () => {
    const output: SummarizationOutput = [
      { summary_text: 'Checkout retries now back off; idempotency key prevents duplicate charges.' }
    ];
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    mockSummarize.mockResolvedValue(succeed(output));

    const result = await localSummarizationScenario.cli!.run(makeScenarioCtx());
    expect(result).toSucceedAndSatisfy((summary: string) => {
      expect(summary).toMatch(/local-summarization demo/i);
      expect(summary).toContain('idempotency key prevents duplicate charges');
      expect(summary).toMatch(/escalate long\/complex docs to cloud/i);
    });
  });

  test('run fails when loadPipeline fails', async () => {
    mockLoadPipeline.mockResolvedValue(fail('model not found'));

    const result = await localSummarizationScenario.cli!.run(makeScenarioCtx());
    expect(result).toFailWith(/model not found/i);
  });

  test('run fails when summarize fails', async () => {
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    mockSummarize.mockResolvedValue(fail('inference session error'));

    const result = await localSummarizationScenario.cli!.run(makeScenarioCtx());
    expect(result).toFailWith(/inference session error/i);
  });

  test('run fails when the summarizer returns no output', async () => {
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    mockSummarize.mockResolvedValue(succeed([] as SummarizationOutput));

    const result = await localSummarizationScenario.cli!.run(makeScenarioCtx());
    expect(result).toFailWith(/no output/i);
  });
});

describe('localSummarizationScenario (IScenario shape)', () => {
  test('has the expected id and category', () => {
    expect(localSummarizationScenario.id).toBe('local-summarization');
    expect(localSummarizationScenario.category).toBe('ai');
  });

  test('is CLI-only (a cli impl, no web impl)', () => {
    expect(localSummarizationScenario.cli).toBeDefined();
    expect(localSummarizationScenario.web).toBeUndefined();
  });
});
