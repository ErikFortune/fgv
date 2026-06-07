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
 * Unit tests for the `cross-provider-embedding-search` scenario.
 *
 * The deterministic CI gate. These tests mock the global `fetch` and drive the **real**
 * `AiAssist.callProviderEmbedding` primitive + its OpenAI / Gemini adapters over a faked
 * network — so they assert the actual outgoing request body (the load-bearing class: that the
 * Gemini `taskType` asymmetry and `dimensions` reach the wire, and that the OpenAI no-op path
 * omits `taskType`). The live run against real provider APIs is env-gated in the scenario.
 *
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';
import { Logging, type Result, fail, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import {
  CORPUS_DOCUMENTS,
  DOCUMENT_TASK_TYPE,
  EXPECTED_TOP_INDEX,
  QUERY_TASK_TYPE,
  QUERY_TEXT,
  formatEmbeddingReport,
  parseEmbeddingScenarioConfig,
  runEmbeddingSearch
} from '../../../scenarios/crossProviderEmbeddingSearch/search';
import type {
  EmbedFn,
  IEmbeddingScenarioConfig,
  IEmbeddingSearchOutcome
} from '../../../scenarios/crossProviderEmbeddingSearch/search';
import { crossProviderEmbeddingSearchScenario } from '../../../scenarios/crossProviderEmbeddingSearch';
import type { IScenarioContext } from '../../../shell';

// ===========================================================================
// fetch mock helpers (mirrors libraries/ts-extras embeddingClient.test.ts)
// ===========================================================================

function okResponse(body: unknown): unknown {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  };
}

function httpErrorResponse(status: number, errorText: string): unknown {
  return { ok: false, status, text: jest.fn().mockResolvedValue(errorText) };
}

/** Queue the query response then the document response (the scenario's two-call order). */
function mockTwoFetches(queryBody: unknown, docBody: unknown): void {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce(okResponse(queryBody))
    .mockResolvedValueOnce(okResponse(docBody));
}

function callOf(i: number): [string, { method: string; headers: Record<string, string>; body: string }] {
  return (global.fetch as jest.Mock).mock.calls[i];
}
function bodyOf(i: number): Record<string, unknown> {
  return JSON.parse(callOf(i)[1].body);
}
function urlOf(i: number): string {
  return callOf(i)[0];
}
function headersOf(i: number): Record<string, string> {
  return callOf(i)[1].headers;
}

// ===========================================================================
// Fixtures
// ===========================================================================

/** A query vector identical to document[0], orthogonal to the rest → document[0] ranks #1. */
const QUERY_VEC: number[] = [1, 0, 0];
const DOC_VECS: number[][] = [
  [1, 0, 0], // document 0 — same direction as the query → top rank
  [0, 1, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 0, 1]
];

function openAiBody(vectors: number[][]): unknown {
  return {
    object: 'list',
    data: vectors.map((embedding, index) => ({ object: 'embedding', index, embedding })),
    model: 'text-embedding-3-small',
    usage: { prompt_tokens: 8, total_tokens: 8 }
  };
}

function geminiBody(vectors: number[][]): unknown {
  return { embeddings: vectors.map((values) => ({ values })) };
}

function openAiConfig(overrides: Partial<IEmbeddingScenarioConfig> = {}): IEmbeddingScenarioConfig {
  return {
    providerLabel: 'openai',
    descriptor: AiAssist.getProviderDescriptor('openai').orThrow(),
    apiKey: 'sk-test',
    model: 'text-embedding-3-small',
    ...overrides
  };
}

function geminiConfig(overrides: Partial<IEmbeddingScenarioConfig> = {}): IEmbeddingScenarioConfig {
  return {
    providerLabel: 'gemini',
    descriptor: AiAssist.getProviderDescriptor('google-gemini').orThrow(),
    apiKey: 'gemini-test',
    model: 'gemini-embedding-001',
    ...overrides
  };
}

// ===========================================================================
// parseEmbeddingScenarioConfig
// ===========================================================================

describe('parseEmbeddingScenarioConfig', () => {
  test('defaults to OpenAI with the default embedding model when EMBED_PROVIDER is unset', () => {
    expect(parseEmbeddingScenarioConfig({ OPENAI_API_KEY: 'sk-x' })).toSucceedAndSatisfy((config) => {
      expect(config.providerLabel).toBe('openai');
      expect(config.descriptor.id).toBe('openai');
      expect(config.apiKey).toBe('sk-x');
      expect(config.model).toBe('text-embedding-3-small');
      expect(config.dimensions).toBeUndefined();
      expect(config.endpoint).toBeUndefined();
    });
  });

  test('resolves Gemini and accepts either GEMINI_API_KEY or GOOGLE_API_KEY', () => {
    expect(
      parseEmbeddingScenarioConfig({ EMBED_PROVIDER: 'gemini', GEMINI_API_KEY: 'g1' })
    ).toSucceedAndSatisfy((config) => {
      expect(config.descriptor.id).toBe('google-gemini');
      expect(config.apiKey).toBe('g1');
      expect(config.model).toBe('gemini-embedding-001');
    });
    expect(
      parseEmbeddingScenarioConfig({ EMBED_PROVIDER: 'google-gemini', GOOGLE_API_KEY: 'g2' })
    ).toSucceedAndSatisfy((config) => {
      expect(config.apiKey).toBe('g2');
    });
  });

  test('resolves Mistral via MISTRAL_API_KEY', () => {
    expect(
      parseEmbeddingScenarioConfig({ EMBED_PROVIDER: 'mistral', MISTRAL_API_KEY: 'm1' })
    ).toSucceedAndSatisfy((config) => {
      expect(config.descriptor.id).toBe('mistral');
      expect(config.apiKey).toBe('m1');
      expect(config.model).toBe('mistral-embed');
    });
  });

  test('keyless self-hosted (ollama) needs EMBED_MODEL but no key', () => {
    expect(
      parseEmbeddingScenarioConfig({
        EMBED_PROVIDER: 'ollama',
        EMBED_MODEL: 'nomic-embed-text',
        EMBED_ENDPOINT: 'http://localhost:11434/v1'
      })
    ).toSucceedAndSatisfy((config) => {
      expect(config.descriptor.id).toBe('ollama');
      expect(config.apiKey).toBe('');
      expect(config.model).toBe('nomic-embed-text');
      expect(config.endpoint).toBe('http://localhost:11434/v1');
    });
  });

  test('fails for a self-hosted provider with no EMBED_MODEL (no default embedding model)', () => {
    expect(parseEmbeddingScenarioConfig({ EMBED_PROVIDER: 'openai-compat' })).toFailWith(
      /no embedding model resolved.*EMBED_MODEL/i
    );
  });

  test('parses EMBED_DIMENSIONS as a positive integer', () => {
    expect(
      parseEmbeddingScenarioConfig({ OPENAI_API_KEY: 'sk', EMBED_DIMENSIONS: '512' })
    ).toSucceedAndSatisfy((config) => {
      expect(config.dimensions).toBe(512);
    });
  });

  test('rejects a non-positive-integer EMBED_DIMENSIONS', () => {
    expect(parseEmbeddingScenarioConfig({ OPENAI_API_KEY: 'sk', EMBED_DIMENSIONS: '0' })).toFailWith(
      /EMBED_DIMENSIONS must be a positive integer/
    );
    expect(parseEmbeddingScenarioConfig({ OPENAI_API_KEY: 'sk', EMBED_DIMENSIONS: 'abc' })).toFailWith(
      /EMBED_DIMENSIONS must be a positive integer/
    );
  });

  test('treats a blank EMBED_DIMENSIONS / EMBED_MODEL as absent', () => {
    expect(
      parseEmbeddingScenarioConfig({ OPENAI_API_KEY: 'sk', EMBED_DIMENSIONS: '   ', EMBED_MODEL: '  ' })
    ).toSucceedAndSatisfy((config) => {
      expect(config.dimensions).toBeUndefined();
      expect(config.model).toBe('text-embedding-3-small');
    });
  });

  test('fails for an unknown EMBED_PROVIDER with the supported list', () => {
    expect(parseEmbeddingScenarioConfig({ EMBED_PROVIDER: 'cohere' })).toFailWith(
      /unknown EMBED_PROVIDER "cohere".*openai.*gemini/i
    );
  });

  test('fails with the OPENAI_API_KEY diagnostic when the key is missing', () => {
    expect(parseEmbeddingScenarioConfig({})).toFailWith(/OPENAI_API_KEY is not set/);
  });

  test('fails with the Gemini diagnostic when neither Gemini key is set', () => {
    expect(parseEmbeddingScenarioConfig({ EMBED_PROVIDER: 'gemini' })).toFailWith(
      /Neither GEMINI_API_KEY nor GOOGLE_API_KEY/
    );
  });

  test('fails with the Mistral diagnostic when the key is missing', () => {
    expect(parseEmbeddingScenarioConfig({ EMBED_PROVIDER: 'mistral' })).toFailWith(
      /MISTRAL_API_KEY is not set/
    );
  });
});

// ===========================================================================
// runEmbeddingSearch — real primitive over mocked fetch
// ===========================================================================

describe('runEmbeddingSearch (real callProviderEmbedding + mocked fetch)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('OpenAI-shaped wire path', () => {
    test('sends two well-formed requests and ranks the matching document first', async () => {
      mockTwoFetches(openAiBody([QUERY_VEC]), openAiBody(DOC_VECS));

      const outcome = await runEmbeddingSearch(openAiConfig());
      expect(outcome).toSucceedAndSatisfy((value: IEmbeddingSearchOutcome) => {
        expect(value.queryDimensions).toBe(3);
        expect(value.documentDimensions).toBe(3);
        expect(value.documentCount).toBe(CORPUS_DOCUMENTS.length);
        expect(value.capabilitySupportsDimensions).toBe(true);
        expect(value.capabilitySupportsTaskType).toBe(false);
        expect(value.ranked[0]!.text).toBe(CORPUS_DOCUMENTS[EXPECTED_TOP_INDEX]);
        expect(value.queryUsage).toEqual({ promptTokens: 8, totalTokens: 8 });
      });

      // Query call: single-element batch, encoding_format float, NO taskType (no-op path).
      expect(urlOf(0)).toMatch(/\/embeddings$/);
      expect(headersOf(0).Authorization).toBe('Bearer sk-test');
      const queryBody = bodyOf(0);
      expect(queryBody.input).toEqual([QUERY_TEXT]);
      expect(queryBody.model).toBe('text-embedding-3-small');
      expect(queryBody.encoding_format).toBe('float');
      expect(queryBody.taskType).toBeUndefined();
      expect(queryBody.dimensions).toBeUndefined();

      // Document call: the full corpus batched in one request, aligned by index.
      const docBody = bodyOf(1);
      expect(docBody.input).toEqual(CORPUS_DOCUMENTS);
      expect(docBody.taskType).toBeUndefined();
    });

    test('sends dimensions when requested and reports it honored', async () => {
      const q4 = [[1, 0, 0, 0]];
      const d4 = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
        [0, 1, 0, 0]
      ];
      mockTwoFetches(openAiBody(q4), openAiBody(d4));

      const outcome = await runEmbeddingSearch(openAiConfig({ dimensions: 4 }));
      expect(outcome).toSucceedAndSatisfy((value: IEmbeddingSearchOutcome) => {
        expect(value.requestedDimensions).toBe(4);
        expect(value.documentDimensions).toBe(4);
      });
      expect(bodyOf(0).dimensions).toBe(4);
      expect(bodyOf(1).dimensions).toBe(4);
    });

    test('fails (with context) when the query call returns an HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(httpErrorResponse(401, 'bad key'));
      expect(await runEmbeddingSearch(openAiConfig())).toFailWith(/query embedding failed.*401.*bad key/);
    });

    test('fails (with context) when the document call returns an HTTP error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okResponse(openAiBody([QUERY_VEC])))
        .mockResolvedValueOnce(httpErrorResponse(500, 'server boom'));
      expect(await runEmbeddingSearch(openAiConfig())).toFailWith(
        /document embedding failed.*500.*server boom/
      );
    });

    test('routes through an endpoint override (self-hosted base URL)', async () => {
      mockTwoFetches(openAiBody([QUERY_VEC]), openAiBody(DOC_VECS));
      expect(await runEmbeddingSearch(openAiConfig({ endpoint: 'http://localhost:11434/v1' }))).toSucceed();
      expect(urlOf(0)).toBe('http://localhost:11434/v1/embeddings');
    });

    test('fails ranking when the query and document dimensions disagree', async () => {
      // Query is 2-D, documents are 3-D → cosine similarity rejects the mismatch.
      mockTwoFetches(openAiBody([[1, 0]]), openAiBody(DOC_VECS));
      expect(await runEmbeddingSearch(openAiConfig())).toFailWith(/ranking failed.*dimension mismatch/i);
    });
  });

  describe('Gemini wire path (the highest-risk batchEmbedContents + taskType asymmetry)', () => {
    test('drives the asymmetric taskType end-to-end and ranks sanely', async () => {
      mockTwoFetches(geminiBody([QUERY_VEC]), geminiBody(DOC_VECS));

      const outcome = await runEmbeddingSearch(geminiConfig());
      expect(outcome).toSucceedAndSatisfy((value: IEmbeddingSearchOutcome) => {
        expect(value.documentDimensions).toBe(3);
        expect(value.documentCount).toBe(CORPUS_DOCUMENTS.length);
        expect(value.capabilitySupportsTaskType).toBe(true);
        expect(value.capabilitySupportsDimensions).toBe(true);
        expect(value.ranked[0]!.text).toBe(CORPUS_DOCUMENTS[EXPECTED_TOP_INDEX]);
        // Gemini does not report token usage for embeddings.
        expect(value.queryUsage).toBeUndefined();
      });

      // Query call: batchEmbedContents route, x-goog-api-key auth, RETRIEVAL_QUERY task type.
      expect(urlOf(0)).toMatch(/\/models\/gemini-embedding-001:batchEmbedContents$/);
      expect(headersOf(0)['x-goog-api-key']).toBe('gemini-test');
      const queryReqs = bodyOf(0).requests as Array<Record<string, unknown>>;
      expect(queryReqs).toHaveLength(1);
      expect(queryReqs[0]!.taskType).toBe('RETRIEVAL_QUERY');
      expect(queryReqs[0]!.model).toBe('models/gemini-embedding-001');
      expect(queryReqs[0]!.content).toEqual({ parts: [{ text: QUERY_TEXT }] });

      // Document call: one request per document, all RETRIEVAL_DOCUMENT, aligned by order.
      const docReqs = bodyOf(1).requests as Array<Record<string, unknown>>;
      expect(docReqs).toHaveLength(CORPUS_DOCUMENTS.length);
      for (let i = 0; i < docReqs.length; i++) {
        expect(docReqs[i]!.taskType).toBe('RETRIEVAL_DOCUMENT');
        expect(docReqs[i]!.content).toEqual({ parts: [{ text: CORPUS_DOCUMENTS[i] }] });
      }
    });

    test('sends outputDimensionality when dimensions are requested', async () => {
      const q4 = [[1, 0, 0, 0]];
      const d4 = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
        [0, 1, 0, 0]
      ];
      mockTwoFetches(geminiBody(q4), geminiBody(d4));

      expect(await runEmbeddingSearch(geminiConfig({ dimensions: 4 }))).toSucceedAndSatisfy(
        (value: IEmbeddingSearchOutcome) => {
          expect(value.documentDimensions).toBe(4);
        }
      );
      const queryReqs = bodyOf(0).requests as Array<Record<string, unknown>>;
      expect(queryReqs[0]!.outputDimensionality).toBe(4);
    });

    test('detects batch misalignment when Gemini returns fewer vectors than documents', async () => {
      // Gemini's adapter does not enforce the batch count; the scenario does.
      mockTwoFetches(geminiBody([QUERY_VEC]), geminiBody(DOC_VECS.slice(0, 3)));
      expect(await runEmbeddingSearch(geminiConfig())).toFailWith(
        /batch misalignment.*requested 5.*received 3/
      );
    });
  });

  test('threads a logger through to the primitive (no-op-knob note path)', async () => {
    mockTwoFetches(openAiBody([QUERY_VEC]), openAiBody(DOC_VECS));
    const logger = new Logging.InMemoryLogger();
    const infoSpy = jest.spyOn(logger, 'info');
    expect(await runEmbeddingSearch(openAiConfig(), undefined, logger)).toSucceed();
    // The primitive logs that OpenAI ignores the supplied taskType.
    expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/ignores taskType/i));
  });
});

// ===========================================================================
// runEmbeddingSearch — injected stub (defensive branches not reachable via the real primitive)
// ===========================================================================

describe('runEmbeddingSearch (injected EmbedFn — defensive branches)', () => {
  test('fails when the provider declares no embedding capability for the model', async () => {
    const config: IEmbeddingScenarioConfig = {
      providerLabel: 'anthropic',
      descriptor: AiAssist.getProviderDescriptor('anthropic').orThrow(),
      apiKey: 'k',
      model: 'claude-sonnet-4-5'
    };
    const neverCalled: EmbedFn = jest.fn();
    expect(await runEmbeddingSearch(config, neverCalled)).toFailWith(/no embedding capability/i);
    expect(neverCalled).not.toHaveBeenCalled();
  });

  test('fails when the query call yields no vector', async () => {
    const stub: EmbedFn = async (params) => {
      const input = params.params.input;
      return typeof input === 'string'
        ? succeed({ vectors: [], model: 'm', dimensions: 0 })
        : succeed({ vectors: input.map(() => [1, 0, 0]), model: 'm', dimensions: 3 });
    };
    expect(await runEmbeddingSearch(openAiConfig(), stub)).toFailWith(/query embedding returned no vector/);
  });

  test('propagates a query-side failure from the injected embed function', async () => {
    const stub: EmbedFn = async (): Promise<Result<AiAssist.IAiEmbeddingResult>> => fail('transport down');
    expect(await runEmbeddingSearch(openAiConfig(), stub)).toFailWith(
      /query embedding failed.*transport down/
    );
  });
});

// ===========================================================================
// formatEmbeddingReport (pure)
// ===========================================================================

describe('formatEmbeddingReport', () => {
  function baseOutcome(overrides: Partial<IEmbeddingSearchOutcome> = {}): IEmbeddingSearchOutcome {
    return {
      providerLabel: 'openai',
      model: 'text-embedding-3-small',
      queryDimensions: 3,
      documentDimensions: 3,
      documentCount: CORPUS_DOCUMENTS.length,
      capabilitySupportsDimensions: true,
      capabilitySupportsTaskType: false,
      ranked: CORPUS_DOCUMENTS.map((text, i) => ({
        text,
        score: i === EXPECTED_TOP_INDEX ? 1 : 0
      })),
      ...overrides
    };
  }

  test('PASS when vectors are usable, batch aligns, and the expected document ranks #1', () => {
    const report = formatEmbeddingReport(baseOutcome());
    expect(report.pass).toBe(true);
    expect(report.text).toMatch(/cross-provider-embedding-search \(openai\): PASS/);
    expect(report.text).toMatch(/\[PASS\] Both vectors usable/);
    expect(report.text).toMatch(/\[PASS\] Batch alignment/);
    expect(report.text).toMatch(/\[PASS\] Ranking sanity/);
    // No dimension requested → the dimensions gate is SKIP.
    expect(report.text).toMatch(/\[SKIP\] dimensions honored — no dimension requested/);
    expect(report.text).toMatch(/ignores \(no-op\) taskType/);
    expect(report.text).toMatch(/not reported by provider/);
  });

  test('FAIL when the expected document does not rank first', () => {
    const ranked = [
      { text: CORPUS_DOCUMENTS[1]!, score: 0.9 },
      { text: CORPUS_DOCUMENTS[EXPECTED_TOP_INDEX]!, score: 0.1 }
    ];
    const report = formatEmbeddingReport(baseOutcome({ ranked }));
    expect(report.pass).toBe(false);
    expect(report.text).toMatch(/\[FAIL\] Ranking sanity/);
  });

  test('FAIL when query and document dimensions differ (vectors not usable)', () => {
    const report = formatEmbeddingReport(baseOutcome({ queryDimensions: 2 }));
    expect(report.pass).toBe(false);
    expect(report.text).toMatch(/\[FAIL\] Both vectors usable/);
  });

  test('FAIL when batch alignment is off', () => {
    const report = formatEmbeddingReport(baseOutcome({ documentCount: 3 }));
    expect(report.pass).toBe(false);
    expect(report.text).toMatch(/\[FAIL\] Batch alignment/);
  });

  test('PASS with the dimensions gate when requested + honored', () => {
    const report = formatEmbeddingReport(
      baseOutcome({ requestedDimensions: 3, queryDimensions: 3, documentDimensions: 3 })
    );
    expect(report.pass).toBe(true);
    expect(report.text).toMatch(/\[PASS\] dimensions honored — requested 3d, returned 3d/);
  });

  test('FAIL when a requested dimension is not honored', () => {
    const report = formatEmbeddingReport(
      baseOutcome({ requestedDimensions: 512, queryDimensions: 3, documentDimensions: 3 })
    );
    expect(report.pass).toBe(false);
    expect(report.text).toMatch(/\[FAIL\] dimensions honored — requested 512d, returned 3d/);
  });

  test('SKIP the dimensions gate when requested but the model does not support it', () => {
    const report = formatEmbeddingReport(
      baseOutcome({ requestedDimensions: 512, capabilitySupportsDimensions: false })
    );
    // SKIP does not fail the run.
    expect(report.pass).toBe(true);
    expect(report.text).toMatch(/\[SKIP\] dimensions honored — model does not support dimensions/);
  });

  test('reports taskType honored and token usage when present', () => {
    const report = formatEmbeddingReport(
      baseOutcome({
        providerLabel: 'gemini',
        capabilitySupportsTaskType: true,
        queryUsage: { totalTokens: 12 }
      })
    );
    expect(report.text).toMatch(/HONORS taskType/);
    expect(report.text).toMatch(/Query token usage: \{"totalTokens":12\}/);
    expect(report.text).toContain(`query="${QUERY_TASK_TYPE}"`);
    expect(report.text).toContain(`documents="${DOCUMENT_TASK_TYPE}"`);
  });

  test('handles an empty ranking (top "(none)") without throwing', () => {
    const report = formatEmbeddingReport(baseOutcome({ ranked: [], documentCount: 0 }));
    expect(report.pass).toBe(false);
    expect(report.text).toMatch(/top="\(none\)"/);
  });
});

// ===========================================================================
// Scenario metadata + cli.run
// ===========================================================================

describe('crossProviderEmbeddingSearchScenario', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  function makeContext(): IScenarioContext {
    return {
      logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() })
    } as unknown as IScenarioContext;
  }

  test('is a CLI-only ai scenario with the expected id and tags', () => {
    expect(crossProviderEmbeddingSearchScenario.id).toBe('cross-provider-embedding-search');
    expect(crossProviderEmbeddingSearchScenario.category).toBe('ai');
    expect(crossProviderEmbeddingSearchScenario.cli).toBeDefined();
    expect(crossProviderEmbeddingSearchScenario.web).toBeUndefined();
    expect(crossProviderEmbeddingSearchScenario.tags).toContain('embeddings');
    expect(crossProviderEmbeddingSearchScenario.tags).toContain('cross-provider');
    expect(crossProviderEmbeddingSearchScenario.requiredSecrets?.map((s) => s.envVarName)).toEqual([
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'MISTRAL_API_KEY'
    ]);
  });

  test('cli.run fails with the live-gate-PENDING diagnostic when no key is in the environment', async () => {
    const saved = { openai: process.env.OPENAI_API_KEY, provider: process.env.EMBED_PROVIDER };
    delete process.env.OPENAI_API_KEY;
    delete process.env.EMBED_PROVIDER;
    try {
      expect(await crossProviderEmbeddingSearchScenario.cli!.run(makeContext())).toFailWith(
        /OPENAI_API_KEY is not set/
      );
    } finally {
      if (saved.openai !== undefined) {
        process.env.OPENAI_API_KEY = saved.openai;
      }
      if (saved.provider !== undefined) {
        process.env.EMBED_PROVIDER = saved.provider;
      }
    }
  });

  test('cli.run succeeds end-to-end against a mocked OpenAI fetch', async () => {
    const saved = { openai: process.env.OPENAI_API_KEY, provider: process.env.EMBED_PROVIDER };
    process.env.OPENAI_API_KEY = 'sk-test';
    delete process.env.EMBED_PROVIDER;
    global.fetch = jest.fn();
    mockTwoFetches(openAiBody([QUERY_VEC]), openAiBody(DOC_VECS));
    try {
      expect(await crossProviderEmbeddingSearchScenario.cli!.run(makeContext())).toSucceedAndSatisfy(
        (summary: string) => {
          expect(summary).toMatch(/cross-provider-embedding-search \(openai\): PASS/);
        }
      );
    } finally {
      if (saved.openai !== undefined) {
        process.env.OPENAI_API_KEY = saved.openai;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
      if (saved.provider !== undefined) {
        process.env.EMBED_PROVIDER = saved.provider;
      }
    }
  });

  test('cli.run honors EMBED_DIMENSIONS and EMBED_ENDPOINT (logged config)', async () => {
    const saved = {
      openai: process.env.OPENAI_API_KEY,
      dims: process.env.EMBED_DIMENSIONS,
      endpoint: process.env.EMBED_ENDPOINT
    };
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.EMBED_DIMENSIONS = '4';
    process.env.EMBED_ENDPOINT = 'http://localhost:11434/v1';
    global.fetch = jest.fn();
    const q4 = [[1, 0, 0, 0]];
    const d4 = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 1, 0, 0]
    ];
    mockTwoFetches(openAiBody(q4), openAiBody(d4));
    try {
      expect(await crossProviderEmbeddingSearchScenario.cli!.run(makeContext())).toSucceedAndSatisfy(
        (summary: string) => {
          expect(summary).toMatch(/dimensions honored — requested 4d, returned 4d/);
        }
      );
      expect(urlOf(0)).toBe('http://localhost:11434/v1/embeddings');
    } finally {
      const restore = (
        key: 'OPENAI_API_KEY' | 'EMBED_DIMENSIONS' | 'EMBED_ENDPOINT',
        v: string | undefined
      ): void => {
        if (v !== undefined) {
          process.env[key] = v;
        } else {
          delete process.env[key];
        }
      };
      restore('OPENAI_API_KEY', saved.openai);
      restore('EMBED_DIMENSIONS', saved.dims);
      restore('EMBED_ENDPOINT', saved.endpoint);
    }
  });

  test('cli.run surfaces a wire failure as a CLI failure', async () => {
    const saved = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test';
    global.fetch = jest.fn().mockResolvedValueOnce(httpErrorResponse(429, 'rate limited'));
    try {
      expect(await crossProviderEmbeddingSearchScenario.cli!.run(makeContext())).toFailWith(
        /query embedding failed.*429.*rate limited/
      );
    } finally {
      if (saved !== undefined) {
        process.env.OPENAI_API_KEY = saved;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  });

  test('cli.run surfaces a non-passing report (mis-ranked vectors) as a CLI failure', async () => {
    const saved = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test';
    global.fetch = jest.fn();
    // Query matches document 1 instead of the expected document 0 → ranking-sanity gate FAILs.
    const misranked: number[][] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 0],
      [0, 0, 1]
    ];
    mockTwoFetches(openAiBody([[0, 1, 0]]), openAiBody(misranked));
    try {
      expect(await crossProviderEmbeddingSearchScenario.cli!.run(makeContext())).toFailWith(
        /cross-provider-embedding-search \(openai\): FAIL[\s\S]*Ranking sanity/
      );
    } finally {
      if (saved !== undefined) {
        process.env.OPENAI_API_KEY = saved;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  });
});
