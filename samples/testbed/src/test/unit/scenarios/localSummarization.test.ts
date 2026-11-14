/**
 * Unit tests for the `localSummarization` scenario.
 *
 * Both facades are mocked at module load time (hoisted by `@rushstack/hoist-jest-mock`). The
 * `summarize` and `loadPipeline` exports become `jest.fn()` stubs. No model download or ONNX
 * inference occurs during these tests.
 *
 * @packageDocumentation
 */

// jest.mock must precede all imports (hoist-jest-mock rule).
jest.mock('@fgv/ts-extras-transformers');
jest.mock('@fgv/ts-web-extras-transformers');

import '@fgv/ts-utils-jest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { fail, succeed } from '@fgv/ts-utils';
import * as transformers from '@fgv/ts-extras-transformers';
import * as webTransformers from '@fgv/ts-web-extras-transformers';
import type { SummarizationPipeline, SummarizationOutput } from '@fgv/ts-extras-transformers';
import type { IScenarioContext } from '../../../shell';

import {
  summarizeTranscript,
  MODEL_ID,
  SAMPLE_TRANSCRIPT,
  localSummarizationScenario
} from '../../../scenarios/localSummarization';
import type { SummarizeFn } from '../../../scenarios/localSummarization';

// ---------------------------------------------------------------------------
// Convenience accessors for mocked functions
// ---------------------------------------------------------------------------

// Node facade (backs the CLI path via dynamic import).
const mockSummarize = jest.mocked(transformers.summarize);
const mockLoadPipeline = jest.mocked(transformers.loadPipeline);

// Browser facade (backs the web component + web.initialize).
const mockWebSummarize = jest.mocked(webTransformers.summarize);
const mockWebLoadPipeline = jest.mocked(webTransformers.loadPipeline);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dummy pipeline reference (no-op; summarize is mocked). */
const DUMMY_SUMMARIZER = {} as SummarizationPipeline;

/** Minimal `IScenarioContext` for web/CLI impl tests. */
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

// ---------------------------------------------------------------------------
// summarizeTranscript (adapter — facade injected)
// ---------------------------------------------------------------------------

describe('summarizeTranscript', () => {
  const mockSummarizeFn: SummarizeFn = jest.fn();

  beforeEach(() => {
    (mockSummarizeFn as jest.Mock).mockReset();
  });

  test('calls summarizeFn with the given options', async () => {
    const output: SummarizationOutput = [{ summary_text: 'a short summary' }];
    (mockSummarizeFn as jest.Mock).mockResolvedValue(succeed(output));

    await summarizeTranscript(DUMMY_SUMMARIZER, 'a transcript', mockSummarizeFn, { min_length: 25 });

    expect(mockSummarizeFn).toHaveBeenCalledWith(DUMMY_SUMMARIZER, 'a transcript', { min_length: 25 });
  });

  test('returns the summary text and the compaction ratio', async () => {
    const transcript = '0123456789'; // 10 chars
    const output: SummarizationOutput = [{ summary_text: '01234' }]; // 5 chars → 50%
    (mockSummarizeFn as jest.Mock).mockResolvedValue(succeed(output));

    expect(await summarizeTranscript(DUMMY_SUMMARIZER, transcript, mockSummarizeFn)).toSucceedAndSatisfy(
      (result) => {
        expect(result.summary).toBe('01234');
        expect(result.ratio).toBe(50);
      }
    );
  });

  test('propagates summarize failure as Result.fail', async () => {
    (mockSummarizeFn as jest.Mock).mockResolvedValue(fail('inference error'));

    expect(await summarizeTranscript(DUMMY_SUMMARIZER, 'text', mockSummarizeFn)).toFailWith(
      /inference error/i
    );
  });

  test('fails when the summarizer returns no output', async () => {
    const emptyOutput: SummarizationOutput = [];
    (mockSummarizeFn as jest.Mock).mockResolvedValue(succeed(emptyOutput));

    expect(await summarizeTranscript(DUMMY_SUMMARIZER, 'text', mockSummarizeFn)).toFailWith(/no output/i);
  });
});

// ---------------------------------------------------------------------------
// LocalSummarizationComponent (web component tests via @testing-library/react)
// NOTE: These tests must come before initialize() is called so _cachedSummarizer
// is undefined for the uncached-path test.
// ---------------------------------------------------------------------------

describe('LocalSummarizationComponent', () => {
  beforeEach(() => {
    mockWebLoadPipeline.mockReset();
    mockWebSummarize.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  test('shows loading state on initial render before pipeline resolves', async () => {
    let resolvePipeline!: (v: unknown) => void;
    mockWebLoadPipeline.mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolvePipeline = resolve;
      }) as ReturnType<typeof mockWebLoadPipeline>
    );

    render(React.createElement(localSummarizationScenario.web!.component, { context: makeScenarioCtx() }));

    expect(screen.getByTestId('summarization-loading')).not.toBeNull();

    // Resolve to avoid open handles
    resolvePipeline(succeed(DUMMY_SUMMARIZER));
    await waitFor(() => screen.getByTestId('summarization-scenario'));
  });

  test('unmount guard: component unmounted before pipeline resolves does not set state', async () => {
    let resolvePipeline!: (v: unknown) => void;
    mockWebLoadPipeline.mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolvePipeline = resolve;
      }) as ReturnType<typeof mockWebLoadPipeline>
    );

    const { unmount } = render(
      React.createElement(localSummarizationScenario.web!.component, { context: makeScenarioCtx() })
    );

    unmount();

    resolvePipeline(succeed(DUMMY_SUMMARIZER));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Passes if no "can't perform state update on unmounted component" error fires.
  });

  test('uncached path: calls loadPipeline and renders scenario UI after success', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));

    render(React.createElement(localSummarizationScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('summarization-scenario'));
    expect(mockWebLoadPipeline).toHaveBeenCalledWith('summarization', MODEL_ID);
    expect(screen.getByTestId('summarization-transcript').textContent).toBe(SAMPLE_TRANSCRIPT);
    expect(screen.getByTestId('summarization-run-btn')).not.toBeNull();
  });

  test('regression: stores the callable pipeline without invoking it (functional-updater guard)', async () => {
    // The real SummarizationPipeline is a callable object. `setSummarizer` must use the
    // updater form (`() => pipeline`); otherwise React invokes the pipeline as a functional
    // state updater (passing the previous state) instead of storing it.
    const callableSummarizer = jest.fn(() => {
      throw new Error('pipeline must not be invoked as a state updater');
    }) as unknown as SummarizationPipeline;
    mockWebLoadPipeline.mockResolvedValue(succeed(callableSummarizer));
    mockWebSummarize.mockResolvedValue(succeed([{ summary_text: 'summary' }]));

    render(React.createElement(localSummarizationScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('summarization-scenario'));
    expect(callableSummarizer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('summarization-run-btn'));
    await waitFor(() => expect(mockWebSummarize).toHaveBeenCalled());
    expect(mockWebSummarize.mock.calls[0][0]).toBe(callableSummarizer);
  });

  test('shows non-loading state (summarizer=null) when loadPipeline fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('model not found'));

    const ctx = makeScenarioCtx();
    render(React.createElement(localSummarizationScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('summarization-scenario'));
    expect(
      (ctx.logger.error as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('model not found')
      )
    ).toBe(true);
    expect((screen.getByTestId('summarization-run-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('handleSummarize: returns early when summarizer is null (loadPipeline failed)', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('no model'));

    render(React.createElement(localSummarizationScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('summarization-scenario'));
    fireEvent.click(screen.getByTestId('summarization-run-btn'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId('summarization-result')).toBeNull();
  });

  test('shows the summary and ratio after a successful run', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    mockWebSummarize.mockResolvedValue(succeed([{ summary_text: 'a concise summary' }]));

    const ctx = makeScenarioCtx();
    render(React.createElement(localSummarizationScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('summarization-scenario'));
    fireEvent.click(screen.getByTestId('summarization-run-btn'));

    await waitFor(() => screen.getByTestId('summarization-result'));
    expect(screen.getByTestId('summarization-summary').textContent).toContain('a concise summary');
    expect(
      (ctx.logger.info as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('Summarization complete')
      )
    ).toBe(true);
  });

  test('shows error when summarizeTranscript fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    mockWebSummarize.mockResolvedValue(fail('summarize failed during run'));

    const ctx = makeScenarioCtx();
    render(React.createElement(localSummarizationScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('summarization-scenario'));
    fireEvent.click(screen.getByTestId('summarization-run-btn'));

    await waitFor(() => screen.getByTestId('summarization-result'));
    expect(screen.getByTestId('summarization-error')).not.toBeNull();
    expect(
      (ctx.logger.error as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('Summarization failed')
      )
    ).toBe(true);
  });

  test('cached path: after initialize(), component does not call loadPipeline again', async () => {
    // Populate _cachedSummarizer by calling initialize()
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    await localSummarizationScenario.web!.initialize!(makeScenarioCtx());

    // Reset so we can detect any spurious call
    mockWebLoadPipeline.mockReset();
    mockWebSummarize.mockResolvedValue(succeed([{ summary_text: 'summary' }]));

    render(React.createElement(localSummarizationScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('summarization-scenario'));
    expect(mockWebLoadPipeline).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// web impl: initialize()
// ---------------------------------------------------------------------------

describe('web impl: initialize()', () => {
  beforeEach(() => {
    mockWebLoadPipeline.mockReset();
  });

  test('initialize succeeds when loadPipeline succeeds', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    const ctx = makeScenarioCtx();
    const result = await localSummarizationScenario.web!.initialize!(ctx);
    expect(result).toSucceedWith(true);
  });

  test('initialize fails when loadPipeline fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('network error'));
    const ctx = makeScenarioCtx();
    const result = await localSummarizationScenario.web!.initialize!(ctx);
    expect(result).toFailWith(/network error/i);
  });
});

// ---------------------------------------------------------------------------
// CLI impl: run()
// ---------------------------------------------------------------------------

describe('cli impl: run()', () => {
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
    const emptyOutput: SummarizationOutput = [];
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_SUMMARIZER));
    mockSummarize.mockResolvedValue(succeed(emptyOutput));

    const result = await localSummarizationScenario.cli!.run(makeScenarioCtx());
    expect(result).toFailWith(/no output/i);
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata
// ---------------------------------------------------------------------------

describe('localSummarizationScenario (IScenario shape)', () => {
  test('has the expected id and category', () => {
    expect(localSummarizationScenario.id).toBe('local-summarization');
    expect(localSummarizationScenario.category).toBe('ai');
  });

  test('has the expected tags', () => {
    expect(localSummarizationScenario.tags).toContain('local-ai');
    expect(localSummarizationScenario.tags).toContain('summarization');
    expect(localSummarizationScenario.tags).toContain('transformers');
  });

  test('has a web impl with a component and an initialize fn', () => {
    expect(localSummarizationScenario.web).toBeDefined();
    expect(localSummarizationScenario.web!.component).toBeDefined();
    expect(typeof localSummarizationScenario.web!.initialize).toBe('function');
  });

  test('has a cli impl with a run fn', () => {
    expect(localSummarizationScenario.cli).toBeDefined();
    expect(typeof localSummarizationScenario.cli!.run).toBe('function');
  });

  test('MODEL_ID is the expected distilbart hub id', () => {
    expect(MODEL_ID).toBe('Xenova/distilbart-cnn-6-6');
  });

  test('SAMPLE_TRANSCRIPT is non-empty', () => {
    expect(SAMPLE_TRANSCRIPT.length).toBeGreaterThan(0);
  });
});
