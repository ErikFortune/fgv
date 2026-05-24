/**
 * B-4a scenario: local embedding-based semantic search.
 *
 * Demonstrates a `FeatureExtractionPipeline` (model `Xenova/all-MiniLM-L6-v2`)
 * producing sentence vectors → cosine-similarity nearest-neighbour ranking over a
 * small in-scenario corpus. No remote API is required.
 *
 * ## Architecture
 *
 * Mirrors the B-3 dual-target split exactly:
 *
 * - `similarity.ts` — pure ranking math (no facade dependency; trivially unit-tested).
 * - `embedAdapter.ts` — thin `embedText` adapter that injects `embed` from the active
 *   facade, extracts a `number[]` from the returned Tensor. Facade-agnostic via
 *   injection and type-only imports.
 * - `index.tsx` (this file) — web React component (browser facade) + CLI `run()`
 *   (Node facade via `webpackIgnore` dynamic import).
 *
 * @packageDocumentation
 */

import React, { useState, useCallback } from 'react';
import { fail, succeed, mapResults } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
// Browser facade — WASM ONNX, no node-native deps.
import { loadPipeline, embed } from '@fgv/ts-web-extras-transformers';
import type { FeatureExtractionPipeline } from '@fgv/ts-web-extras-transformers';

import type { IScenario, IScenarioContext, IWebScenarioImpl, ICliScenarioImpl } from '../../shell';
import { embedText } from './embedAdapter';
import { rankBySimilarity } from './similarity';
import type { EmbedFn } from './embedAdapter';
import type { ICorpusEntry, IRankedResult } from './similarity';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** HuggingFace Hub model id for the transformers.js-compatible ONNX export. */
const MODEL_ID: string = 'Xenova/all-MiniLM-L6-v2';

/**
 * Fixed in-scenario corpus. Small enough to embed in a few seconds on CPU;
 * diverse enough to demonstrate meaningful similarity differences.
 */
const CORPUS_TEXTS: readonly string[] = [
  'The quick brown fox jumps over the lazy dog.',
  'Machine learning models learn patterns from training data.',
  'Paris is the capital city of France.',
  'Neural networks are composed of layers of artificial neurons.',
  'The Eiffel Tower is located in Paris.',
  'A dog is a domesticated mammal often kept as a pet.',
  'Gradient descent optimizes model parameters by minimizing a loss function.',
  'London is the capital of England and the United Kingdom.',
  'Cats and dogs are popular household pets around the world.',
  'Transformers revolutionized natural language processing in 2017.'
];

// ---------------------------------------------------------------------------
// Module-level pipeline cache (same pattern as B-3)
// ---------------------------------------------------------------------------

let _cachedExtractor: FeatureExtractionPipeline | undefined;

// ---------------------------------------------------------------------------
// Shared embedding logic
// ---------------------------------------------------------------------------

/**
 * Embed all corpus texts and the query, then rank. Returns a `Result` so the
 * calling code (web or CLI) stays in the Result-chain idiom.
 */
async function searchCorpus(
  extractor: FeatureExtractionPipeline,
  embedFn: EmbedFn,
  query: string
): Promise<Result<readonly IRankedResult[]>> {
  return (await embedText(extractor, query, embedFn))
    .withErrorFormat((message) => `query embedding failed: ${message}`)
    .thenOnSuccess(async (queryVec) => {
      // Embed all corpus texts concurrently (small fixed corpus).
      const corpusEmbedResults = await Promise.all(
        CORPUS_TEXTS.map((text) => embedText(extractor, text, embedFn))
      );
      return mapResults(corpusEmbedResults)
        .withErrorFormat((message) => `corpus embedding failed: ${message}`)
        .onSuccess((vecs) => {
          const corpus: ICorpusEntry[] = CORPUS_TEXTS.map((text, i) => ({ text, vec: vecs[i]! }));
          return rankBySimilarity(queryVec, corpus);
        });
    });
}

// ---------------------------------------------------------------------------
// Web component
// ---------------------------------------------------------------------------

interface ISearchState {
  readonly query: string;
  readonly results: readonly IRankedResult[];
  readonly error?: string;
}

/**
 * Web component for the local-embedding-search scenario.
 *
 * Accepts a user query string, embeds it and the corpus via the cached
 * `FeatureExtractionPipeline`, then displays corpus entries ranked by
 * cosine-similarity score.
 */
function LocalEmbeddingSearchComponent({
  context
}: {
  readonly context: IScenarioContext;
}): React.ReactElement {
  const [extractor, setExtractor] = React.useState<FeatureExtractionPipeline | null>(null);
  const [queryText, setQueryText] = useState('');
  const [searchState, setSearchState] = useState<ISearchState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the pipeline on mount (reuse cached instance when initialize() ran first).
  React.useEffect(() => {
    let mounted: boolean = true;
    const pipePromise: Promise<Result<FeatureExtractionPipeline>> =
      _cachedExtractor !== undefined
        ? Promise.resolve(succeed(_cachedExtractor))
        : loadPipeline('feature-extraction', MODEL_ID);

    pipePromise
      .then((pipeResult) => {
        if (!mounted) {
          return;
        }
        if (pipeResult.isFailure()) {
          context.logger.error(`Failed to load model: ${pipeResult.message}`);
          setIsLoading(false);
          return;
        }
        context.logger.info(`Model ${MODEL_ID} loaded.`);
        setExtractor(pipeResult.value);
        setIsLoading(false);
      })
      /* c8 ignore next 5 - catch only fires if the then-chain throws synchronously (not from a rejected promise); not reachable in tests */
      .catch((err: unknown) => {
        if (mounted) {
          context.logger.error(`Unexpected error loading model: ${String(err)}`);
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async () => {
    if (extractor === null || queryText.trim() === '') {
      return;
    }

    (await searchCorpus(extractor, embed, queryText))
      .onSuccess((results) => {
        setSearchState({ query: queryText, results });
        /* c8 ignore next 1 - the 'none' fallback is unreachable: a successful ranking over the non-empty CORPUS_TEXTS always has a top entry */
        context.logger.info(`Search complete. Top result: "${results[0]?.text ?? 'none'}"`);
        return succeed(results);
      })
      .onFailure((message) => {
        setSearchState({ query: queryText, results: [], error: message });
        context.logger.error(`Search failed: ${message}`);
        return fail(message);
      });
  }, [extractor, queryText, context.logger]);

  if (isLoading) {
    return (
      <div data-testid="embedding-loading">
        <p>Loading model {MODEL_ID}…</p>
      </div>
    );
  }

  return (
    <div data-testid="embedding-scenario">
      <div data-testid="embedding-input-area">
        <label htmlFor="embedding-query">Search query:</label>
        <input
          id="embedding-query"
          data-testid="embedding-query"
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
        <button data-testid="embedding-search-btn" onClick={handleSearch} disabled={extractor === null}>
          Search
        </button>
      </div>
      {searchState !== null && (
        <div data-testid="embedding-results">
          {searchState.error !== undefined ? (
            <div data-testid="embedding-error">{searchState.error}</div>
          ) : (
            <ol data-testid="embedding-ranked-list">
              {searchState.results.map((r, i) => (
                <li key={i} data-testid={`embedding-result-${i}`}>
                  <span data-testid={`embedding-score-${i}`}>{r.score.toFixed(4)}</span>
                  {' — '}
                  <span data-testid={`embedding-text-${i}`}>{r.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Web impl (IWebScenarioImpl)
// ---------------------------------------------------------------------------

const webImpl: IWebScenarioImpl = {
  component: LocalEmbeddingSearchComponent,

  async initialize(context: IScenarioContext): Promise<Result<boolean>> {
    context.logger.info(`Loading model ${MODEL_ID}…`);
    const result = await loadPipeline('feature-extraction', MODEL_ID);
    if (result.isFailure()) {
      context.logger.error(`Model load failed: ${result.message}`);
      return fail(`model load failed: ${result.message}`);
    }
    _cachedExtractor = result.value;
    context.logger.info(`Model ${MODEL_ID} ready.`);
    return succeed(true);
  }
};

// ---------------------------------------------------------------------------
// CLI implementation (ICliScenarioImpl)
// ---------------------------------------------------------------------------

/** Fixed demo query for the CLI demonstration. */
const CLI_DEMO_QUERY: string = 'capital cities in Europe';

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    context.logger.info(`Loading model ${MODEL_ID} for CLI demo…`);
    // Load the Node facade lazily so webpack never includes node-native ONNX deps
    // in the browser bundle. The `webpackIgnore` magic comment is load-bearing.
    const nodeFacade = await import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers');
    const pipeResult = await nodeFacade.loadPipeline('feature-extraction', MODEL_ID);
    if (pipeResult.isFailure()) {
      return fail(pipeResult.message);
    }

    const rankResult = await searchCorpus(pipeResult.value, nodeFacade.embed, CLI_DEMO_QUERY);
    if (rankResult.isFailure()) {
      return fail(rankResult.message);
    }

    const lines = rankResult.value.slice(0, 5).map((r, i) => `  ${i + 1}. [${r.score.toFixed(4)}] ${r.text}`);

    return succeed(
      `B-4a local-embedding-search demo\nQuery: "${CLI_DEMO_QUERY}"\nTop results:\n${lines.join('\n')}`
    );
  }
};

// ---------------------------------------------------------------------------
// Scenario export
// ---------------------------------------------------------------------------

/**
 * `localEmbeddingSearch` scenario: sentence embedding + cosine-similarity ranking
 * over a fixed corpus using a local `Xenova/all-MiniLM-L6-v2` pipeline.
 *
 * @public
 */
export const localEmbeddingSearchScenario: IScenario = {
  id: 'local-embedding-search',
  title: 'Local Embedding Search',
  description:
    'Demonstrates a local `Xenova/all-MiniLM-L6-v2` feature-extraction pipeline ' +
    'producing sentence vectors → cosine-similarity nearest-neighbour ranking over a ' +
    'small fixed corpus. No remote API required.',
  category: 'ai',
  tags: ['local-ai', 'embeddings', 'semantic-search'],
  web: webImpl,
  cli: cliImpl
};

// Re-export internals for tests (same pattern as B-3).
export { embedText, rankBySimilarity, searchCorpus, MODEL_ID, CORPUS_TEXTS };
export { cosineSimilarity } from './similarity';
export type { EmbedFn, ICorpusEntry, IRankedResult };
