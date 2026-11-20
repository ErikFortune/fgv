/**
 * Unit tests for the `localEmbeddingSearch` scenario.
 *
 * Both facades are mocked at module load time (hoisted by `@rushstack/hoist-jest-mock`).
 * The `embed` and `loadPipeline` exports become `jest.fn()` stubs. No model download
 * or ONNX inference occurs during these tests.
 *
 * Tensor shape: `embed` with `{ pooling: 'mean', normalize: true }` on a single string
 * produces a `[1, D]` Tensor. `tolist()` on that returns `[[...D floats...]]`. The mock
 * Tensor returned here has a `tolist()` that returns this nested shape.
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
import type { FeatureExtractionPipeline, Tensor } from '@fgv/ts-extras-transformers';
import type { IScenarioContext } from '../../../shell';

// ---------------------------------------------------------------------------
// Subject under test (imported after mocks are registered)
// ---------------------------------------------------------------------------

import {
  cosineSimilarity,
  rankBySimilarity,
  embedText,
  searchCorpus,
  MODEL_ID,
  CORPUS_TEXTS,
  localEmbeddingSearchScenario
} from '../../../scenarios/localEmbeddingSearch';
import type { EmbedFn, ICorpusEntry } from '../../../scenarios/localEmbeddingSearch';

// ---------------------------------------------------------------------------
// Convenience accessors for mocked functions
// ---------------------------------------------------------------------------

// Node facade (backs the CLI path via dynamic import).
const mockEmbed = jest.mocked(transformers.embed);
const mockLoadPipeline = jest.mocked(transformers.loadPipeline);

// Browser facade (backs the web component + web.initialize).
const mockWebEmbed = jest.mocked(webTransformers.embed);
const mockWebLoadPipeline = jest.mocked(webTransformers.loadPipeline);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dummy pipeline reference (no-op; embed is mocked). */
const DUMMY_EXTRACTOR = {} as FeatureExtractionPipeline;

/**
 * Produce a mock `Tensor` whose `tolist()` returns `[[...vec...]]` — the shape
 * emitted by `embed(text, { pooling: 'mean', normalize: true })` for a single string.
 */
function makeMockTensor(vec: number[]): Tensor {
  // tolist() on a pooled single-string embedding returns number[][] ([[...vec...]]).
  return {
    tolist: (): number[][] => [vec]
  } as unknown as Tensor;
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

/**
 * A normalized 3-D unit vector pointing along axis 0.
 * Two equal vectors → cosine = 1.0; orthogonal vectors → cosine = 0.
 */
const VEC_A: number[] = [1, 0, 0];
const VEC_B: number[] = [0, 1, 0];
const VEC_C: number[] = [0.707, 0.707, 0]; // ~45° from A and B

// ---------------------------------------------------------------------------
// cosineSimilarity (pure math — no facade)
// ---------------------------------------------------------------------------

describe('cosineSimilarity', () => {
  test('returns 1.0 for identical unit vectors', () => {
    expect(cosineSimilarity(VEC_A, VEC_A)).toSucceedWith(1);
  });

  test('returns 0 for orthogonal unit vectors', () => {
    expect(cosineSimilarity(VEC_A, VEC_B)).toSucceedAndSatisfy((score) => {
      expect(score).toBeCloseTo(0);
    });
  });

  test('returns approximately 0.707 for 45-degree vectors', () => {
    expect(cosineSimilarity(VEC_A, VEC_C)).toSucceedAndSatisfy((score) => {
      expect(score).toBeCloseTo(0.707, 2);
    });
  });

  test('fails for vectors of different dimensions', () => {
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toFailWith(/dimension mismatch/i);
  });

  test('fails for zero-length vectors', () => {
    expect(cosineSimilarity([], [])).toFailWith(/zero-length/i);
  });

  test('fails when a vector has zero magnitude', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 0, 0])).toFailWith(/zero magnitude/i);
  });

  test('symmetric: sim(a, b) === sim(b, a)', () => {
    const ab = cosineSimilarity(VEC_A, VEC_C).orThrow();
    const ba = cosineSimilarity(VEC_C, VEC_A).orThrow();
    expect(ab).toBeCloseTo(ba);
  });
});

// ---------------------------------------------------------------------------
// rankBySimilarity (pure — no facade)
// ---------------------------------------------------------------------------

describe('rankBySimilarity', () => {
  const corpus: ICorpusEntry[] = [
    { text: 'alpha', vec: VEC_A },
    { text: 'beta', vec: VEC_B },
    { text: 'gamma', vec: VEC_C }
  ];

  test('returns corpus entries sorted by descending similarity', () => {
    // Query is VEC_A: similarity to alpha=1, gamma≈0.707, beta=0.
    expect(rankBySimilarity(VEC_A, corpus)).toSucceedAndSatisfy((results) => {
      expect(results[0]!.text).toBe('alpha');
      expect(results[0]!.score).toBeCloseTo(1);
      expect(results[1]!.text).toBe('gamma');
      expect(results[2]!.text).toBe('beta');
    });
  });

  test('returns empty array for empty corpus', () => {
    expect(rankBySimilarity(VEC_A, [])).toSucceedAndSatisfy((results) => {
      expect(results).toHaveLength(0);
    });
  });

  test('fails when corpus entry has dimension mismatch', () => {
    const badCorpus: ICorpusEntry[] = [{ text: 'bad', vec: [1, 0] }];
    expect(rankBySimilarity(VEC_A, badCorpus)).toFailWith(/dimension mismatch/i);
  });

  test('propagates dimension-mismatch error with corpus entry text', () => {
    const badCorpus: ICorpusEntry[] = [{ text: 'the-bad-entry', vec: [1, 0] }];
    expect(rankBySimilarity(VEC_A, badCorpus)).toFailWith(/the-bad-entry/i);
  });
});

// ---------------------------------------------------------------------------
// embedText (adapter — facade injected)
// ---------------------------------------------------------------------------

describe('embedText', () => {
  const mockEmbedFn: EmbedFn = jest.fn();

  beforeEach(() => {
    (mockEmbedFn as jest.Mock).mockReset();
  });

  test('calls embedFn with mean pooling and normalization options', async () => {
    const tensor = makeMockTensor(VEC_A);
    (mockEmbedFn as jest.Mock).mockResolvedValue(succeed(tensor));

    await embedText(DUMMY_EXTRACTOR, 'hello world', mockEmbedFn);

    expect(mockEmbedFn).toHaveBeenCalledWith(DUMMY_EXTRACTOR, 'hello world', {
      pooling: 'mean',
      normalize: true
    });
  });

  test('returns the number[] row from tolist()[0]', async () => {
    const tensor = makeMockTensor(VEC_A);
    (mockEmbedFn as jest.Mock).mockResolvedValue(succeed(tensor));

    expect(await embedText(DUMMY_EXTRACTOR, 'hello', mockEmbedFn)).toSucceedAndSatisfy((vec) => {
      expect(vec).toEqual(VEC_A);
    });
  });

  test('propagates embed failure as Result.fail', async () => {
    (mockEmbedFn as jest.Mock).mockResolvedValue(fail('inference error'));

    expect(await embedText(DUMMY_EXTRACTOR, 'hello', mockEmbedFn)).toFailWith(/inference error/i);
  });
});

// ---------------------------------------------------------------------------
// searchCorpus (integration-level, mocked embed)
// ---------------------------------------------------------------------------

describe('searchCorpus', () => {
  beforeEach(() => {
    mockEmbed.mockReset();
  });

  test('ranks corpus entries by similarity to the query', async () => {
    // Query → VEC_A; corpus items get sequentially increasing vectors.
    // Call order: 1 query + CORPUS_TEXTS.length corpus calls.
    // Query is first.
    let callCount = 0;
    mockEmbed.mockImplementation(async () => {
      const idx = callCount++;
      // query → VEC_A; all corpus items → VEC_B (for simplicity)
      const vec = idx === 0 ? VEC_A : VEC_B;
      return succeed(makeMockTensor(vec));
    });

    const result = await searchCorpus(DUMMY_EXTRACTOR, mockEmbed, 'test query');
    expect(result).toSucceedAndSatisfy((ranked) => {
      expect(ranked.length).toBe(CORPUS_TEXTS.length);
      // All corpus entries should have equal similarity (all VEC_B vs query VEC_A ≈ 0).
      expect(ranked[0]!.score).toBeCloseTo(0);
    });
  });

  test('fails when query embedding fails', async () => {
    mockEmbed.mockResolvedValue(fail('model not loaded'));

    const result = await searchCorpus(DUMMY_EXTRACTOR, mockEmbed, 'query');
    expect(result).toFailWith(/model not loaded/i);
  });

  test('fails when a corpus embedding fails', async () => {
    // First call (query) succeeds; second call (first corpus entry) fails.
    mockEmbed
      .mockResolvedValueOnce(succeed(makeMockTensor(VEC_A)))
      .mockResolvedValue(fail('corpus embed error'));

    const result = await searchCorpus(DUMMY_EXTRACTOR, mockEmbed, 'query');
    expect(result).toFailWith(/corpus embed error/i);
  });
});

// ---------------------------------------------------------------------------
// LocalEmbeddingSearchComponent (web component tests via @testing-library/react)
// NOTE: These tests must come before initialize() is called so _cachedExtractor
// is undefined for the uncached-path test.
// ---------------------------------------------------------------------------

describe('LocalEmbeddingSearchComponent', () => {
  beforeEach(() => {
    mockWebLoadPipeline.mockReset();
    mockWebEmbed.mockReset();
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

    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: makeScenarioCtx() }));

    expect(screen.getByTestId('embedding-loading')).not.toBeNull();

    // Resolve to avoid open handles
    resolvePipeline(succeed(DUMMY_EXTRACTOR));
    await waitFor(() => screen.getByTestId('embedding-scenario'));
  });

  test('unmount guard: component unmounted before pipeline resolves does not set state', async () => {
    let resolvePipeline!: (v: unknown) => void;
    mockWebLoadPipeline.mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolvePipeline = resolve;
      }) as ReturnType<typeof mockWebLoadPipeline>
    );

    const { unmount } = render(
      React.createElement(localEmbeddingSearchScenario.web!.component, { context: makeScenarioCtx() })
    );

    unmount();

    resolvePipeline(succeed(DUMMY_EXTRACTOR));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Passes if no "can't perform state update on unmounted component" error fires.
  });

  test('uncached path: calls loadPipeline and renders scenario UI after success', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));

    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));
    expect(mockWebLoadPipeline).toHaveBeenCalledWith('feature-extraction', MODEL_ID);
    expect(screen.getByTestId('embedding-search-btn')).not.toBeNull();
  });

  test('regression: stores the callable pipeline without invoking it (functional-updater guard)', async () => {
    // The real FeatureExtractionPipeline is a callable object. `setExtractor` must use the
    // updater form (`() => pipeline`); otherwise React invokes the pipeline as a functional
    // state updater (passing the previous state) — which in the browser ran the tokenizer with
    // a null input ("text may not be null or undefined") and left the wrong value in state.
    const callableExtractor = jest.fn(() => {
      throw new Error('pipeline must not be invoked as a state updater');
    }) as unknown as FeatureExtractionPipeline;
    mockWebLoadPipeline.mockResolvedValue(succeed(callableExtractor));
    mockWebEmbed.mockResolvedValue(succeed(makeMockTensor(VEC_A)));

    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));
    // The component stores the pipeline and only hands it to `embed` — it never calls it itself.
    expect(callableExtractor).not.toHaveBeenCalled();

    // And the stored value is the pipeline: a search passes it straight through to `embed`.
    fireEvent.change(screen.getByTestId('embedding-query'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByTestId('embedding-search-btn'));
    await waitFor(() => expect(mockWebEmbed).toHaveBeenCalled());
    expect(mockWebEmbed.mock.calls[0][0]).toBe(callableExtractor);
  });

  test('shows non-loading state (extractor=null) when loadPipeline fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('model not found'));

    const ctx = makeScenarioCtx();
    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));
    expect(
      (ctx.logger.error as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('model not found')
      )
    ).toBe(true);
    expect((screen.getByTestId('embedding-search-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  test('handleSearch: returns early when extractor is null (loadPipeline failed)', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('no model'));

    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));

    const input = screen.getByTestId('embedding-query') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(screen.getByTestId('embedding-search-btn'));

    // No results div — handleSearch returned early due to extractor === null
    expect(screen.queryByTestId('embedding-results')).toBeNull();
  });

  test('handleSearch: returns early when query is empty', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));
    mockWebEmbed.mockResolvedValue(succeed(makeMockTensor(VEC_A)));

    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));

    // Do NOT type anything
    fireEvent.click(screen.getByTestId('embedding-search-btn'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId('embedding-results')).toBeNull();
  });

  test('shows ranked results after a successful search', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));
    // All embeds return VEC_A so every corpus entry gets similarity 1.0.
    mockWebEmbed.mockResolvedValue(succeed(makeMockTensor(VEC_A)));

    const ctx = makeScenarioCtx();
    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));

    const input = screen.getByTestId('embedding-query') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'machine learning' } });
    fireEvent.click(screen.getByTestId('embedding-search-btn'));

    await waitFor(() => screen.getByTestId('embedding-results'));
    expect(screen.getByTestId('embedding-ranked-list')).not.toBeNull();
    expect(screen.getByTestId('embedding-result-0')).not.toBeNull();
    expect(
      (ctx.logger.info as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('Search complete')
      )
    ).toBe(true);
  });

  test('shows error when searchCorpus fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));
    mockWebEmbed.mockResolvedValue(fail('embed failed during search'));

    const ctx = makeScenarioCtx();
    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: ctx }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));

    const input = screen.getByTestId('embedding-query') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'failing query' } });
    fireEvent.click(screen.getByTestId('embedding-search-btn'));

    await waitFor(() => screen.getByTestId('embedding-results'));
    expect(screen.getByTestId('embedding-error')).not.toBeNull();
    expect(
      (ctx.logger.error as jest.Mock).mock.calls.some((c: unknown[]) =>
        String(c[0]).includes('Search failed')
      )
    ).toBe(true);
  });

  test('cached path: after initialize(), component does not call loadPipeline again', async () => {
    // Populate _cachedExtractor by calling initialize()
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));
    await localEmbeddingSearchScenario.web!.initialize!(makeScenarioCtx());

    // Reset so we can detect any spurious call
    mockWebLoadPipeline.mockReset();
    mockWebEmbed.mockResolvedValue(succeed(makeMockTensor(VEC_A)));

    render(React.createElement(localEmbeddingSearchScenario.web!.component, { context: makeScenarioCtx() }));

    await waitFor(() => screen.getByTestId('embedding-scenario'));
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
    mockWebLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));
    const ctx = makeScenarioCtx();
    const result = await localEmbeddingSearchScenario.web!.initialize!(ctx);
    expect(result).toSucceedWith(true);
  });

  test('initialize fails when loadPipeline fails', async () => {
    mockWebLoadPipeline.mockResolvedValue(fail('network error'));
    const ctx = makeScenarioCtx();
    const result = await localEmbeddingSearchScenario.web!.initialize!(ctx);
    expect(result).toFailWith(/network error/i);
  });
});

// ---------------------------------------------------------------------------
// CLI impl: run()
// ---------------------------------------------------------------------------

describe('cli impl: run()', () => {
  beforeEach(() => {
    mockLoadPipeline.mockReset();
    mockEmbed.mockReset();
  });

  test('run succeeds and returns a ranked summary', async () => {
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));
    mockEmbed.mockResolvedValue(succeed(makeMockTensor(VEC_A)));

    const ctx = makeScenarioCtx();
    const result = await localEmbeddingSearchScenario.cli!.run(ctx);
    expect(result).toSucceedAndSatisfy((summary: string) => {
      expect(summary).toMatch(/B-4a local-embedding-search demo/i);
      expect(summary).toMatch(/Top results/i);
    });
  });

  test('run fails when loadPipeline fails', async () => {
    mockLoadPipeline.mockResolvedValue(fail('load failed'));

    const ctx = makeScenarioCtx();
    const result = await localEmbeddingSearchScenario.cli!.run(ctx);
    expect(result).toFailWith(/load failed/i);
  });

  test('run fails when embed fails', async () => {
    mockLoadPipeline.mockResolvedValue(succeed(DUMMY_EXTRACTOR));
    mockEmbed.mockResolvedValue(fail('inference error'));

    const ctx = makeScenarioCtx();
    const result = await localEmbeddingSearchScenario.cli!.run(ctx);
    expect(result).toFailWith(/inference error/i);
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata
// ---------------------------------------------------------------------------

describe('localEmbeddingSearchScenario (IScenario shape)', () => {
  test('has the expected id', () => {
    expect(localEmbeddingSearchScenario.id).toBe('local-embedding-search');
  });

  test('has category "ai"', () => {
    expect(localEmbeddingSearchScenario.category).toBe('ai');
  });

  test('has the expected tags', () => {
    expect(localEmbeddingSearchScenario.tags).toContain('local-ai');
    expect(localEmbeddingSearchScenario.tags).toContain('embeddings');
    expect(localEmbeddingSearchScenario.tags).toContain('semantic-search');
  });

  test('has a web impl with a component and an initialize fn', () => {
    expect(localEmbeddingSearchScenario.web).toBeDefined();
    expect(localEmbeddingSearchScenario.web!.component).toBeDefined();
    expect(typeof localEmbeddingSearchScenario.web!.initialize).toBe('function');
  });

  test('has a cli impl with a run fn', () => {
    expect(localEmbeddingSearchScenario.cli).toBeDefined();
    expect(typeof localEmbeddingSearchScenario.cli!.run).toBe('function');
  });

  test('MODEL_ID is the expected MiniLM hub id', () => {
    expect(MODEL_ID).toBe('Xenova/all-MiniLM-L6-v2');
  });

  test('CORPUS_TEXTS is non-empty', () => {
    expect(CORPUS_TEXTS.length).toBeGreaterThan(0);
  });
});
