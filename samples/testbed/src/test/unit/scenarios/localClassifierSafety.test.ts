/**
 * Unit tests for the `localClassifierSafety` scenario.
 *
 * `@fgv/ts-extras-transformers` is mocked at module load time (the `jest.mock` call
 * precedes all imports per `@rushstack/hoist-jest-mock`). The `classify` and
 * `loadPipeline` exports become `jest.fn()` stubs controlled via `jest.mocked()`.
 * No model download occurs during tests.
 *
 * @packageDocumentation
 */

// jest.mock must precede all imports (hoist-jest-mock rule). Both facades are mocked:
// the Node facade backs the CLI path (loaded via dynamic import in `cli.run`), the
// browser facade backs the web component + `web.initialize`.
jest.mock('@fgv/ts-extras-transformers');
jest.mock('@fgv/ts-web-extras-transformers');

import '@fgv/ts-utils-jest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { fail, succeed } from '@fgv/ts-utils';
import * as transformers from '@fgv/ts-extras-transformers';
import * as webTransformers from '@fgv/ts-web-extras-transformers';
import type { TextClassificationOutput, TextClassificationPipeline } from '@fgv/ts-extras-transformers';
import type { ISafeguardFinding, IScreenerContext, IPromptSlot, SlotName } from '@fgv/ts-prompt-assist';
import type { IScenarioContext } from '../../../shell';

// ---------------------------------------------------------------------------
// Subject under test (imported after mock is registered)
// ---------------------------------------------------------------------------

import {
  interpretLabel,
  interpretClassification,
  createClassifierScreener,
  DEFAULT_TOXIC_BERT_THRESHOLDS,
  buildPromptLibrary,
  MODEL_ID,
  SCENARIO_SCOPE,
  SCENARIO_PROMPT_ID,
  USER_TEXT_SLOT,
  localClassifierSafetyScenario
} from '../../../scenarios/localClassifierSafety';
import type { ClassifierThresholdMap } from '../../../scenarios/localClassifierSafety';

// ---------------------------------------------------------------------------
// Convenience accessors for the mocked functions
// ---------------------------------------------------------------------------

// Node facade (drives the CLI path via dynamic import; also injected as the
// screener's `classify` in the facade-agnostic core tests — its concrete origin
// is irrelevant there, it is just a correctly-typed stub).
const mockClassify = jest.mocked(transformers.classify);
const mockLoadPipeline = jest.mocked(transformers.loadPipeline);

// Browser facade (drives the web component + web.initialize).
const mockWebClassify = jest.mocked(webTransformers.classify);
const mockWebLoadPipeline = jest.mocked(webTransformers.loadPipeline);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal canned output arrays used across multiple test cases.
 * Scores are chosen to exercise each threshold band.
 */
const CLEAN_OUTPUT: TextClassificationOutput = [
  { label: 'toxic', score: 0.02 },
  { label: 'severe_toxic', score: 0.01 },
  { label: 'obscene', score: 0.01 },
  { label: 'threat', score: 0.01 },
  { label: 'insult', score: 0.02 },
  { label: 'identity_hate', score: 0.01 }
];

const SINGLE_LABEL_TOXIC: TextClassificationOutput = [
  { label: 'toxic', score: 0.91 }, // above 0.8 reject threshold
  { label: 'severe_toxic', score: 0.01 },
  { label: 'obscene', score: 0.01 },
  { label: 'threat', score: 0.01 },
  { label: 'insult', score: 0.02 },
  { label: 'identity_hate', score: 0.01 }
];

const WARN_ONLY_OUTPUT: TextClassificationOutput = [
  { label: 'toxic', score: 0.65 }, // above 0.5 warn, below 0.8 reject
  { label: 'severe_toxic', score: 0.01 },
  { label: 'obscene', score: 0.01 },
  { label: 'threat', score: 0.01 },
  { label: 'insult', score: 0.02 },
  { label: 'identity_hate', score: 0.01 }
];

const MULTI_LABEL_TOXIC: TextClassificationOutput = [
  { label: 'toxic', score: 0.91 }, // reject
  { label: 'severe_toxic', score: 0.01 },
  { label: 'obscene', score: 0.01 },
  { label: 'threat', score: 0.61 }, // also above reject (0.5)
  { label: 'insult', score: 0.02 },
  { label: 'identity_hate', score: 0.01 }
];

/** A dummy pipeline reference (no-op; classify is mocked). */
const DUMMY_PIPELINE = {} as TextClassificationPipeline;

/** Minimal `IScreenerContext` for the screener tests. */
function makeCtx(value: string, slotName: string = 'user_text'): IScreenerContext {
  return {
    slot: {
      name: slotName as unknown as IPromptSlot['name'],
      description: 'test slot'
    } as IPromptSlot,
    source: 'user',
    promptId: 'test-prompt' as unknown as IScreenerContext['promptId'],
    value
  };
}

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
// LocalClassifierSafetyComponent (web component tests)
// NOTE: This describe block must come FIRST so that _cachedPipeline is still
// undefined when the uncached-path tests run. The cached-path test calls
// web.initialize() to populate _cachedPipeline, and then any subsequent render
// reuses it without calling loadPipeline again.
// ---------------------------------------------------------------------------

describe('LocalClassifierSafetyComponent', () => {
  beforeEach(() => {
    mockWebLoadPipeline.mockReset();
    mockWebClassify.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  test('shows loading state on initial render before pipeline resolves', async () => {
    // Hold the pipeline promise open so we see the loading state
    let resolvePipeline!: (v: unknown) => void;
    mockWebLoadPipeline.mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolvePipeline = resolve;
      }) as ReturnType<typeof mockWebLoadPipeline>
    );

    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: makeScenarioCtx() }));

    expect(screen.getByTestId('classifier-loading')).not.toBeNull();

    // Resolve to avoid open handles
    resolvePipeline(succeed(DUMMY_PIPELINE));
    await waitFor(() => screen.getByTestId('classifier-scenario'));
  });

  test('unmount guard: component unmounted before pipeline resolves does not set state', async () => {
    // Hold the pipeline promise pending so we can unmount first
    let resolvePipeline!: (v: unknown) => void;
    mockWebLoadPipeline.mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolvePipeline = resolve;
      }) as ReturnType<typeof mockWebLoadPipeline>
    );

    const { unmount } = render(
      React.createElement(localClassifierSafetyScenario.web!.component, { context: makeScenarioCtx() })
    );

    // Unmount while the pipeline promise is still pending
    unmount();

    // Now resolve — the !mounted guard prevents any setState from running
    resolvePipeline(succeed(DUMMY_PIPELINE));
    // Give the microtask queue a tick to flush
    await new Promise((resolve) => setTimeout(resolve, 0));
    // No assertion needed — the test passes if no "can't perform state update on unmounted" error fires
  });

  test('uncached path: calls loadPipeline and renders the scenario UI after success', async () => {
    // _cachedPipeline is undefined here (first component test before initialize)
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));

    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));
    expect(mockWebLoadPipeline).toHaveBeenCalledWith('text-classification', MODEL_ID);
    expect(screen.getByTestId('classifier-run-btn')).not.toBeNull();
  });

  test('shows non-loading state (lib=null) when loadPipeline fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('model not found'));

    const ctx = makeScenarioCtx();
    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));
    expect(
      (ctx.logger.error as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('model not found')
      )
    ).toBe(true);
    // Button should be disabled because lib === null
    expect((screen.getByTestId('classifier-run-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('handleScreen: returns early when lib is null (loadPipeline failed)', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('no model'));

    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));

    const input = screen.getByTestId('classifier-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByTestId('classifier-run-btn'));

    // No result div — handleScreen returned early
    expect(screen.queryByTestId('classifier-result')).toBeNull();
  });

  test('handleScreen: returns early when input is empty', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    mockWebClassify.mockResolvedValue(succeed(CLEAN_OUTPUT));

    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));

    // Do NOT type anything — input is empty
    fireEvent.click(screen.getByTestId('classifier-run-btn'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId('classifier-result')).toBeNull();
  });

  test('shows clean verdict after a successful resolve with no findings', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    mockWebClassify.mockResolvedValue(succeed(CLEAN_OUTPUT));

    const ctx = makeScenarioCtx();
    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));

    const input = screen.getByTestId('classifier-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'hello world' } });
    fireEvent.click(screen.getByTestId('classifier-run-btn'));

    await waitFor(() => screen.getByTestId('classifier-result'));
    expect(screen.getByTestId('classifier-allowed')).not.toBeNull();
    expect(screen.getByTestId('classifier-verdict-clean')).not.toBeNull();
    expect(
      (ctx.logger.info as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('passed all checks')
      )
    ).toBe(true);
  });

  test('shows findings list after a successful resolve with warn findings', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    mockWebClassify.mockResolvedValue(succeed(WARN_ONLY_OUTPUT));

    const ctx = makeScenarioCtx();
    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));

    const input = screen.getByTestId('classifier-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'mildly bad text' } });
    fireEvent.click(screen.getByTestId('classifier-run-btn'));

    await waitFor(() => screen.getByTestId('classifier-result'));
    expect(screen.getByTestId('classifier-allowed')).not.toBeNull();
    expect(screen.getByTestId('classifier-findings')).not.toBeNull();
    expect(
      (ctx.logger.warn as jest.Mock).mock.calls.some((c: unknown[]) => String(c[0]).includes('Warnings'))
    ).toBe(true);
  });

  test('shows error div when resolve fails (reject disposition)', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    mockWebClassify.mockResolvedValue(succeed(SINGLE_LABEL_TOXIC));

    const ctx = makeScenarioCtx();
    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));

    const input = screen.getByTestId('classifier-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'toxic text' } });
    fireEvent.click(screen.getByTestId('classifier-run-btn'));

    await waitFor(() => screen.getByTestId('classifier-result'));
    expect(screen.getByTestId('classifier-error')).not.toBeNull();
    expect(
      (ctx.logger.warn as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('Resolve failed')
      )
    ).toBe(true);
  });

  test('cached path: after initialize(), component does not call loadPipeline again', async () => {
    // Populate _cachedPipeline by calling initialize()
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    await localClassifierSafetyScenario.web!.initialize!(makeScenarioCtx());

    // Reset so we can detect if it's called again
    mockWebLoadPipeline.mockReset();
    mockWebClassify.mockResolvedValue(succeed(CLEAN_OUTPUT));

    render(React.createElement(localClassifierSafetyScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('classifier-scenario'));
    expect(mockWebLoadPipeline).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// interpretLabel
// ---------------------------------------------------------------------------

describe('interpretLabel', () => {
  const thresholds: ClassifierThresholdMap = DEFAULT_TOXIC_BERT_THRESHOLDS;

  test('returns allow for a label not in the threshold map', () => {
    expect(interpretLabel('unknown_label', 0.99, thresholds)).toBe('allow');
  });

  test('returns allow when score is below both thresholds', () => {
    expect(interpretLabel('toxic', 0.1, thresholds)).toBe('allow');
  });

  test('returns warn when score is at-or-above warn but below reject', () => {
    // toxic: warn=0.5, reject=0.8
    expect(interpretLabel('toxic', 0.5, thresholds)).toBe('warn');
    expect(interpretLabel('toxic', 0.79, thresholds)).toBe('warn');
  });

  test('returns reject when score is at-or-above reject', () => {
    // toxic: reject=0.8
    expect(interpretLabel('toxic', 0.8, thresholds)).toBe('reject');
    expect(interpretLabel('toxic', 0.99, thresholds)).toBe('reject');
  });

  test('returns allow for threshold with only warn defined and score below warn', () => {
    const custom: ClassifierThresholdMap = { my_label: { warn: 0.5 } };
    expect(interpretLabel('my_label', 0.3, custom)).toBe('allow');
  });

  test('returns warn for threshold with only warn defined and score at-or-above warn', () => {
    const custom: ClassifierThresholdMap = { my_label: { warn: 0.5 } };
    expect(interpretLabel('my_label', 0.6, custom)).toBe('warn');
  });

  test('returns allow for threshold with only reject defined and score below reject', () => {
    const custom: ClassifierThresholdMap = { my_label: { reject: 0.8 } };
    expect(interpretLabel('my_label', 0.5, custom)).toBe('allow');
  });

  test('returns reject for threshold with only reject defined and score at-or-above reject', () => {
    const custom: ClassifierThresholdMap = { my_label: { reject: 0.8 } };
    expect(interpretLabel('my_label', 0.9, custom)).toBe('reject');
  });

  test('returns allow for an entry with no thresholds defined', () => {
    const custom: ClassifierThresholdMap = { my_label: {} };
    expect(interpretLabel('my_label', 0.99, custom)).toBe('allow');
  });

  test('handles exact boundary: score === reject threshold triggers reject', () => {
    expect(interpretLabel('threat', 0.5, thresholds)).toBe('reject');
  });

  test('handles exact boundary: score === warn threshold triggers warn', () => {
    expect(interpretLabel('threat', 0.2, thresholds)).toBe('warn');
  });
});

// ---------------------------------------------------------------------------
// interpretClassification
// ---------------------------------------------------------------------------

describe('interpretClassification', () => {
  const thresholds: ClassifierThresholdMap = DEFAULT_TOXIC_BERT_THRESHOLDS;
  const SLOT: SlotName = 'user_text' as unknown as SlotName;
  const SCREENER: string = 'test-screener';

  test('returns empty array for a clean output', () => {
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification(
      CLEAN_OUTPUT,
      thresholds,
      SLOT,
      SCREENER
    );
    expect(result).toHaveLength(0);
  });

  test('returns empty array for an empty TextClassificationOutput', () => {
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification([], thresholds, SLOT, SCREENER);
    expect(result).toHaveLength(0);
  });

  test('returns one reject finding for a single above-reject-threshold label', () => {
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification(
      SINGLE_LABEL_TOXIC,
      thresholds,
      SLOT,
      SCREENER
    );
    expect(result).toHaveLength(1);
    const finding: ISafeguardFinding = result[0] as ISafeguardFinding;
    expect(finding.disposition).toBe('reject');
    expect(finding.kind).toBe('classifier-verdict');
    expect(finding.slot).toBe(SLOT);
    expect(finding.screener).toBe(SCREENER);
    expect(finding.detail).toMatch(/toxic/i);
    expect(finding.metadata).toBeDefined();
    expect((finding.metadata as Record<string, unknown>).scores).toBeDefined();
  });

  test('returns one warn finding when only a warn-band label triggers', () => {
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification(
      WARN_ONLY_OUTPUT,
      thresholds,
      SLOT,
      SCREENER
    );
    expect(result).toHaveLength(1);
    const finding: ISafeguardFinding = result[0] as ISafeguardFinding;
    expect(finding.disposition).toBe('warn');
    expect(finding.kind).toBe('classifier-verdict');
  });

  test('returns one reject finding even when multiple labels breach the reject band', () => {
    // MULTI_LABEL_TOXIC: toxic=0.91 (reject) AND threat=0.61 (above 0.5 reject)
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification(
      MULTI_LABEL_TOXIC,
      thresholds,
      SLOT,
      SCREENER
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.disposition).toBe('reject');
    // Both labels should appear in the detail string
    expect(result[0]!.detail).toMatch(/toxic/i);
    expect(result[0]!.detail).toMatch(/threat/i);
  });

  test('reject takes priority over warn when both bands breach', () => {
    const mixed: TextClassificationOutput = [
      { label: 'toxic', score: 0.91 }, // reject
      { label: 'insult', score: 0.65 } // warn
    ];
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification(
      mixed,
      thresholds,
      SLOT,
      SCREENER
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.disposition).toBe('reject');
  });

  test('per-label scores are in metadata', () => {
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification(
      SINGLE_LABEL_TOXIC,
      thresholds,
      SLOT,
      SCREENER
    );
    const scores: Record<string, number> = (result[0]!.metadata as Record<string, unknown>).scores as Record<
      string,
      number
    >;
    expect(scores.toxic).toBeCloseTo(0.91);
    expect(scores.threat).toBeCloseTo(0.01);
  });

  test('uses the provided slot name in the finding', () => {
    const customSlot: SlotName = 'my_custom_slot' as unknown as SlotName;
    const result: ReadonlyArray<ISafeguardFinding> = interpretClassification(
      SINGLE_LABEL_TOXIC,
      thresholds,
      customSlot,
      SCREENER
    );
    expect(result[0]!.slot).toBe('my_custom_slot');
  });
});

// ---------------------------------------------------------------------------
// createClassifierScreener
// ---------------------------------------------------------------------------

describe('createClassifierScreener', () => {
  beforeEach(() => {
    mockClassify.mockReset();
  });

  test('default name is "local-classifier-screener"', () => {
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS
    });
    expect(screener.name).toBe('local-classifier-screener');
  });

  test('uses the provided name', () => {
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS,
      name: 'my-screener'
    });
    expect(screener.name).toBe('my-screener');
  });

  test('calls classify with top_k: null', async () => {
    mockClassify.mockResolvedValue(succeed(CLEAN_OUTPUT));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS
    });
    await screener.screen(makeCtx('hello'));
    expect(mockClassify).toHaveBeenCalledWith(DUMMY_PIPELINE, 'hello', { top_k: null });
  });

  test('returns empty findings for clean text', async () => {
    mockClassify.mockResolvedValue(succeed(CLEAN_OUTPUT));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS
    });
    const result = await screener.screen(makeCtx('hello'));
    expect(result).toSucceedAndSatisfy((findings) => {
      expect(findings).toHaveLength(0);
    });
  });

  test('returns a reject finding for toxic text', async () => {
    mockClassify.mockResolvedValue(succeed(SINGLE_LABEL_TOXIC));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS
    });
    const result = await screener.screen(makeCtx('bad text'));
    expect(result).toSucceedAndSatisfy((findings) => {
      expect(findings).toHaveLength(1);
      expect(findings[0]!.disposition).toBe('reject');
      expect(findings[0]!.kind).toBe('classifier-verdict');
    });
  });

  test('returns a warn finding for text in the warn band', async () => {
    mockClassify.mockResolvedValue(succeed(WARN_ONLY_OUTPUT));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS
    });
    const result = await screener.screen(makeCtx('mildly bad text'));
    expect(result).toSucceedAndSatisfy((findings) => {
      expect(findings).toHaveLength(1);
      expect(findings[0]!.disposition).toBe('warn');
    });
  });

  test('propagates classify failure as Result.fail (operational failure)', async () => {
    mockClassify.mockResolvedValue(fail('model inference error'));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS,
      name: 'test-screener'
    });
    const result = await screener.screen(makeCtx('some text'));
    expect(result).toFailWith(/test-screener.*model inference error/i);
  });

  test('handles empty TextClassificationOutput gracefully', async () => {
    mockClassify.mockResolvedValue(succeed([]));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS
    });
    const result = await screener.screen(makeCtx('empty model output'));
    expect(result).toSucceedAndSatisfy((findings) => {
      expect(findings).toHaveLength(0);
    });
  });

  test('multi-label: returns one reject finding', async () => {
    mockClassify.mockResolvedValue(succeed(MULTI_LABEL_TOXIC));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS
    });
    const result = await screener.screen(makeCtx('very bad text'));
    expect(result).toSucceedAndSatisfy((findings) => {
      expect(findings).toHaveLength(1);
      expect(findings[0]!.disposition).toBe('reject');
    });
  });

  test('finding carries the screener name', async () => {
    mockClassify.mockResolvedValue(succeed(SINGLE_LABEL_TOXIC));
    const screener = createClassifierScreener({
      pipeline: DUMMY_PIPELINE,
      classify: mockClassify,
      thresholds: DEFAULT_TOXIC_BERT_THRESHOLDS,
      name: 'named-screener'
    });
    const result = await screener.screen(makeCtx('bad'));
    expect(result).toSucceedAndSatisfy((findings) => {
      expect(findings[0]!.screener).toBe('named-screener');
    });
  });
});

// ---------------------------------------------------------------------------
// buildPromptLibrary + full resolve path (integration-level, mocked classify)
// ---------------------------------------------------------------------------

describe('buildPromptLibrary + PromptLibrary.resolve (mocked classify)', () => {
  beforeEach(() => {
    mockClassify.mockReset();
  });

  test('builds a PromptLibrary successfully', async () => {
    const result = await buildPromptLibrary(DUMMY_PIPELINE, mockClassify, DEFAULT_TOXIC_BERT_THRESHOLDS);
    expect(result).toSucceed();
  });

  test('resolve succeeds for clean text', async () => {
    mockClassify.mockResolvedValue(succeed(CLEAN_OUTPUT));
    const lib = (
      await buildPromptLibrary(DUMMY_PIPELINE, mockClassify, DEFAULT_TOXIC_BERT_THRESHOLDS)
    ).orThrow();
    const result = await lib.resolve({
      id: SCENARIO_PROMPT_ID,
      chain: [SCENARIO_SCOPE],
      qualifiers: {},
      substitutions: { [USER_TEXT_SLOT]: 'Hello world' }
    });
    expect(result).toSucceedAndSatisfy((resolved) => {
      expect(resolved.body).toBe('Hello world');
      expect(resolved.trace.safeguardFindings).toHaveLength(0);
    });
  });

  test('resolve surfaces warn findings in trace.safeguardFindings', async () => {
    mockClassify.mockResolvedValue(succeed(WARN_ONLY_OUTPUT));
    const lib = (
      await buildPromptLibrary(DUMMY_PIPELINE, mockClassify, DEFAULT_TOXIC_BERT_THRESHOLDS)
    ).orThrow();
    const result = await lib.resolve({
      id: SCENARIO_PROMPT_ID,
      chain: [SCENARIO_SCOPE],
      qualifiers: {},
      substitutions: { [USER_TEXT_SLOT]: 'mildly bad' }
    });
    expect(result).toSucceedAndSatisfy((resolved) => {
      expect(resolved.trace.safeguardFindings).toHaveLength(1);
      expect(resolved.trace.safeguardFindings[0]!.disposition).toBe('warn');
    });
  });

  test('resolve fails with a reject finding for toxic text', async () => {
    mockClassify.mockResolvedValue(succeed(SINGLE_LABEL_TOXIC));
    const lib = (
      await buildPromptLibrary(DUMMY_PIPELINE, mockClassify, DEFAULT_TOXIC_BERT_THRESHOLDS)
    ).orThrow();
    const result = await lib.resolve({
      id: SCENARIO_PROMPT_ID,
      chain: [SCENARIO_SCOPE],
      qualifiers: {},
      substitutions: { [USER_TEXT_SLOT]: 'bad text' }
    });
    expect(result).toFailWith(/reject/i);
  });

  test('resolve fails when classify returns an error', async () => {
    mockClassify.mockResolvedValue(fail('inference error'));
    const lib = (
      await buildPromptLibrary(DUMMY_PIPELINE, mockClassify, DEFAULT_TOXIC_BERT_THRESHOLDS)
    ).orThrow();
    const result = await lib.resolve({
      id: SCENARIO_PROMPT_ID,
      chain: [SCENARIO_SCOPE],
      qualifiers: {},
      substitutions: { [USER_TEXT_SLOT]: 'any text' }
    });
    expect(result).toFailWith(/inference error/i);
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata / exported constants
// ---------------------------------------------------------------------------

describe('scenario constants', () => {
  test('MODEL_ID is the expected Xenova/toxic-bert hub id', () => {
    expect(MODEL_ID).toBe('Xenova/toxic-bert');
  });

  test('slot / scope / prompt ids are non-empty', () => {
    expect(String(SCENARIO_SCOPE).length).toBeGreaterThan(0);
    expect(String(SCENARIO_PROMPT_ID).length).toBeGreaterThan(0);
    expect(String(USER_TEXT_SLOT).length).toBeGreaterThan(0);
  });

  test('DEFAULT_TOXIC_BERT_THRESHOLDS covers all expected labels', () => {
    const labels: string[] = Object.keys(DEFAULT_TOXIC_BERT_THRESHOLDS);
    expect(labels).toContain('toxic');
    expect(labels).toContain('severe_toxic');
    expect(labels).toContain('obscene');
    expect(labels).toContain('threat');
    expect(labels).toContain('insult');
    expect(labels).toContain('identity_hate');
  });
});

// ---------------------------------------------------------------------------
// IScenario shape (imported from the registry to confirm registration)
// ---------------------------------------------------------------------------

describe('localClassifierSafetyScenario (IScenario shape)', () => {
  test('has the expected id', () => {
    expect(localClassifierSafetyScenario.id).toBe('local-classifier-safety');
  });

  test('has category "ai"', () => {
    expect(localClassifierSafetyScenario.category).toBe('ai');
  });

  test('has the expected tags', () => {
    expect(localClassifierSafetyScenario.tags).toContain('local-ai');
    expect(localClassifierSafetyScenario.tags).toContain('classification');
    expect(localClassifierSafetyScenario.tags).toContain('ts-prompt-assist');
    expect(localClassifierSafetyScenario.tags).toContain('safety');
  });

  test('has a web impl with a component and an initialize fn', () => {
    expect(localClassifierSafetyScenario.web).toBeDefined();
    expect(localClassifierSafetyScenario.web!.component).toBeDefined();
    expect(typeof localClassifierSafetyScenario.web!.initialize).toBe('function');
  });

  test('has a cli impl with a run fn', () => {
    expect(localClassifierSafetyScenario.cli).toBeDefined();
    expect(typeof localClassifierSafetyScenario.cli!.run).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// web impl: initialize() with mocked loadPipeline
// ---------------------------------------------------------------------------

describe('web impl: initialize()', () => {
  beforeEach(() => {
    mockWebLoadPipeline.mockReset();
    mockWebClassify.mockReset();
  });

  test('initialize succeeds when loadPipeline succeeds', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    const ctx: IScenarioContext = makeScenarioCtx();
    const result = await localClassifierSafetyScenario.web!.initialize!(ctx);
    expect(result).toSucceedWith(true);
  });

  test('initialize fails when loadPipeline fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('network error'));
    const ctx: IScenarioContext = makeScenarioCtx();
    const result = await localClassifierSafetyScenario.web!.initialize!(ctx);
    expect(result).toFailWith(/network error/i);
  });
});

// ---------------------------------------------------------------------------
// CLI impl: run() with mocked loadPipeline + classify
// ---------------------------------------------------------------------------

describe('cli impl: run()', () => {
  beforeEach(() => {
    mockLoadPipeline.mockReset();
    mockClassify.mockReset();
  });

  test('run succeeds when all inputs are clean', async () => {
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    // All inputs clean
    mockClassify.mockResolvedValue(succeed(CLEAN_OUTPUT));
    const ctx: IScenarioContext = makeScenarioCtx();
    const result = await localClassifierSafetyScenario.cli!.run(ctx);
    expect(result).toSucceedAndSatisfy((summary: string) => {
      expect(summary).toMatch(/B-3 local-classifier-safety demo/i);
      expect(summary).toMatch(/CLEAN/i);
    });
  });

  test('run includes REJECTED line when classify returns toxic', async () => {
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_PIPELINE));
    // First call clean, remainder toxic to demonstrate mixed output
    mockClassify
      .mockResolvedValueOnce(succeed(CLEAN_OUTPUT))
      .mockResolvedValueOnce(succeed(CLEAN_OUTPUT))
      .mockResolvedValueOnce(succeed(WARN_ONLY_OUTPUT))
      .mockResolvedValue(succeed(SINGLE_LABEL_TOXIC));
    const ctx: IScenarioContext = makeScenarioCtx();
    const result = await localClassifierSafetyScenario.cli!.run(ctx);
    expect(result).toSucceedAndSatisfy((summary: string) => {
      expect(summary).toMatch(/REJECTED/i);
    });
  });

  test('run fails when loadPipeline fails', async () => {
    mockLoadPipeline.mockResolvedValue(fail('load failed'));
    const ctx: IScenarioContext = makeScenarioCtx();
    const result = await localClassifierSafetyScenario.cli!.run(ctx);
    expect(result).toFailWith(/load failed/i);
  });
});
