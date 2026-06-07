// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Tests for callProviderEmbedding and callProxiedEmbedding — OpenAI and Gemini
 * adapters, the dispatcher, and the proxy leg. Mock fetch, per-format fixtures,
 * no live calls.
 */

import '@fgv/ts-utils-jest';

import { Logging } from '@fgv/ts-utils';
import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

// ============================================================================
// Mock helpers
// ============================================================================

function mockFetchResponse(body: unknown, status: number = 200): void {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

function mockFetchError(error: Error): void {
  (global.fetch as jest.Mock).mockRejectedValue(error);
}

function mockFetchHttpError(status: number, errorText: string): void {
  const response = {
    ok: false,
    status,
    text: jest.fn().mockResolvedValue(errorText)
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

function lastRequestBody(): Record<string, unknown> {
  return JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
}

function lastRequestUrl(): string {
  return (global.fetch as jest.Mock).mock.calls[0][0];
}

function lastRequestHeaders(): Record<string, string> {
  return (global.fetch as jest.Mock).mock.calls[0][1].headers;
}

// ============================================================================
// Fixtures
// ============================================================================

/** OpenAI `/v1/embeddings` response body. */
function openAiEmbeddingBody(
  vectors: number[][],
  opts: { model?: string; usage?: { prompt_tokens?: number; total_tokens?: number }; shuffle?: boolean } = {}
): unknown {
  const data = vectors.map((embedding, index) => ({ object: 'embedding', index, embedding }));
  if (opts.shuffle) {
    data.reverse();
  }
  return {
    object: 'list',
    data,
    ...(opts.model !== undefined ? { model: opts.model } : {}),
    ...(opts.usage !== undefined ? { usage: opts.usage } : {})
  };
}

function openAiDescriptor(): IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor('openai').orThrow();
}

function geminiDescriptor(): IAiProviderDescriptor {
  return AiAssist.getProviderDescriptor('google-gemini').orThrow();
}

/** Gemini `:batchEmbedContents` response body. */
function geminiEmbeddingBody(vectors: number[][]): unknown {
  return { embeddings: vectors.map((values) => ({ values })) };
}

// ============================================================================
// callProviderEmbedding — OpenAI format
// ============================================================================

describe('callProviderEmbedding', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('OpenAI-format adapter', () => {
    test('embeds a single string input', async () => {
      mockFetchResponse(
        openAiEmbeddingBody([[0.1, 0.2, 0.3]], { usage: { prompt_tokens: 4, total_tokens: 4 } })
      );

      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'hello world' }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.vectors).toEqual([[0.1, 0.2, 0.3]]);
        expect(embedding.model).toBe('text-embedding-3-small');
        expect(embedding.dimensions).toBe(3);
        expect(embedding.usage).toEqual({ promptTokens: 4, totalTokens: 4 });
      });

      // Single string is sent as a one-element batch.
      expect(lastRequestUrl()).toBe('https://api.openai.com/v1/embeddings');
      expect(lastRequestBody().input).toEqual(['hello world']);
      expect(lastRequestHeaders().Authorization).toBe('Bearer sk-test');
    });

    test('embeds a batch, aligning vectors to request order even when data is out of order', async () => {
      // shuffle reverses the data array; the adapter must re-sort by `index`.
      // The response also reports its own model id, which the result echoes.
      mockFetchResponse(
        openAiEmbeddingBody(
          [
            [1, 1],
            [2, 2],
            [3, 3]
          ],
          { shuffle: true, model: 'text-embedding-3-small' }
        )
      );

      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: ['a', 'b', 'c'] }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.vectors).toEqual([
          [1, 1],
          [2, 2],
          [3, 3]
        ]);
        expect(embedding.dimensions).toBe(2);
        expect(embedding.model).toBe('text-embedding-3-small');
        // No usage reported → omitted.
        expect(embedding.usage).toBeUndefined();
      });
      expect(lastRequestBody().input).toEqual(['a', 'b', 'c']);
    });

    test('falls back to the resolved model id when the response omits model', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.5]]));

      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        modelOverride: 'text-embedding-3-large',
        params: { input: 'x' }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.model).toBe('text-embedding-3-large');
      });
    });

    test('always sends encoding_format=float', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1]]));

      await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });

      expect(lastRequestBody().encoding_format).toBe('float');
    });

    test('reports partial usage when only total_tokens is present', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1]], { usage: { total_tokens: 7 } }));

      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.usage).toEqual({ totalTokens: 7 });
      });
    });

    test('reports partial usage when only prompt_tokens is present', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1]], { usage: { prompt_tokens: 5 } }));

      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.usage).toEqual({ promptTokens: 5 });
      });
    });

    test('omits usage when the usage object carries no token counts', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1]], { usage: {} }));

      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.usage).toBeUndefined();
      });
    });
  });

  describe('dimensions knob (request-body assertions)', () => {
    test('sends dimensions on the wire for a dimensions-capable model', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1, 0.2]]));

      await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        modelOverride: 'text-embedding-3-small',
        params: { input: 'x', dimensions: 256 }
      });

      expect(lastRequestBody().dimensions).toBe(256);
      // taskType is never part of the OpenAI wire shape.
      expect(lastRequestBody().taskType).toBeUndefined();
    });

    test('omits dimensions (no-op) and logs a note for a model that does not support it', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1]]));
      const logger = new Logging.InMemoryLogger('all');

      await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        // ada-002 hits the catch-all capability (no supportsDimensions).
        modelOverride: 'text-embedding-ada-002',
        params: { input: 'x', dimensions: 256 },
        logger
      });

      expect(lastRequestBody().dimensions).toBeUndefined();
      expect(logger.logged.some((m) => /ignores dimensions/.test(m))).toBe(true);
    });
  });

  describe('taskType knob (request-body assertions)', () => {
    test('never sends taskType on the OpenAI wire and logs a no-op note', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1]]));
      const logger = new Logging.InMemoryLogger('all');

      await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x', taskType: 'retrieval-query' },
        logger
      });

      expect(lastRequestBody().taskType).toBeUndefined();
      expect(lastRequestBody().task_type).toBeUndefined();
      expect(logger.logged.some((m) => /ignores taskType/.test(m))).toBe(true);
    });

    test('does not log a no-op note when no unsupported knobs are supplied', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1]]));
      const logger = new Logging.InMemoryLogger('all');

      await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' },
        logger
      });

      expect(logger.logged.some((m) => /ignores/.test(m))).toBe(false);
    });
  });

  describe('self-hosted (endpoint override, keyless)', () => {
    test('routes ollama through the resolved endpoint with no auth header', async () => {
      mockFetchResponse(openAiEmbeddingBody([[0.1, 0.2]]));

      const result = await AiAssist.callProviderEmbedding({
        descriptor: AiAssist.getProviderDescriptor('ollama').orThrow(),
        apiKey: '',
        modelOverride: 'nomic-embed-text',
        params: { input: 'x' },
        endpoint: 'http://localhost:11434/v1'
      });

      expect(result).toSucceed();
      expect(lastRequestUrl()).toBe('http://localhost:11434/v1/embeddings');
      expect(lastRequestHeaders().Authorization).toBeUndefined();
    });
  });

  describe('up-front rejections', () => {
    test('fails when the provider declares no embedding capability', async () => {
      const result = await AiAssist.callProviderEmbedding({
        descriptor: AiAssist.getProviderDescriptor('xai-grok').orThrow(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/does not support embeddings/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('fails when no embedding model resolves (self-hosted with no override)', async () => {
      const result = await AiAssist.callProviderEmbedding({
        descriptor: AiAssist.getProviderDescriptor('openai-compat').orThrow(),
        apiKey: '',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/no embedding model resolved/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('fails fast when the batch exceeds the model maximum (no auto-chunking)', async () => {
      const inputs: string[] = [];
      for (let i = 0; i < 2049; i++) {
        inputs.push(`item-${i}`);
      }
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        modelOverride: 'text-embedding-3-small',
        params: { input: inputs }
      });
      expect(result).toFailWith(/batch of 2049 exceeds .* maximum of 2048/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('fails when no capability matches the resolved model', async () => {
      // Declares an embedding capability, but only for a specific prefix that
      // the resolved model does not match (no catch-all entry).
      const descriptor: IAiProviderDescriptor = {
        ...openAiDescriptor(),
        defaultModel: { base: 'gpt-4o', embedding: 'some-unlisted-model' },
        embedding: [{ modelPrefix: 'text-embedding-3', format: 'openai-embeddings' }]
      };
      const result = await AiAssist.callProviderEmbedding({
        descriptor,
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/does not support embeddings for model "some-unlisted-model"/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('fails when the endpoint override is malformed', async () => {
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' },
        endpoint: 'not a url'
      });
      expect(result).toFail();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('empty input short-circuit', () => {
    test('returns an empty result with no wire call', async () => {
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: [] }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.vectors).toEqual([]);
        expect(embedding.dimensions).toBe(0);
        expect(embedding.model).toBe('text-embedding-3-small');
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('error paths', () => {
    test('surfaces an HTTP error', async () => {
      mockFetchHttpError(429, 'rate limited');
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/429.*rate limited/i);
    });

    test('surfaces a network error', async () => {
      mockFetchError(new Error('boom'));
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/boom/i);
    });

    test('fails when the response is missing the data array', async () => {
      mockFetchResponse({ object: 'list', model: 'text-embedding-3-small' });
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/OpenAI embeddings API response/i);
    });

    test('fails when the response data array is empty', async () => {
      mockFetchResponse({ object: 'list', data: [] });
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/OpenAI embeddings API response/i);
    });

    test('fails when the embedding count does not match the input count', async () => {
      // Two inputs, but the server returns only one embedding.
      mockFetchResponse(openAiEmbeddingBody([[0.1]]));
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: ['a', 'b'] }
      });
      expect(result).toFailWith(/expected 2 embedding\(s\), got 1/i);
    });

    test('fails when the response indices have a gap or duplicate', async () => {
      // Two inputs, two embeddings, but indices are {0, 2} — index 1 is missing.
      mockFetchResponse({
        object: 'list',
        data: [
          { object: 'embedding', index: 0, embedding: [0.1] },
          { object: 'embedding', index: 2, embedding: [0.2] }
        ]
      });
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: ['a', 'b'] }
      });
      expect(result).toFailWith(/malformed embedding indices .*position 1/i);
    });

    test('fails when vectors have inconsistent dimensionality', async () => {
      mockFetchResponse({
        object: 'list',
        data: [
          { object: 'embedding', index: 0, embedding: [0.1, 0.2] },
          { object: 'embedding', index: 1, embedding: [0.3] }
        ]
      });
      const result = await AiAssist.callProviderEmbedding({
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: ['a', 'b'] }
      });
      expect(result).toFailWith(/inconsistent vector dimensionality .*vector 1 has length 1, expected 2/i);
    });
  });

  describe('Gemini-format adapter', () => {
    test('embeds a batch via batchEmbedContents with qualified model + parts', async () => {
      mockFetchResponse(
        geminiEmbeddingBody([
          [0.1, 0.2, 0.3],
          [0.4, 0.5, 0.6]
        ])
      );

      const result = await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: ['a', 'b'] }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.vectors).toEqual([
          [0.1, 0.2, 0.3],
          [0.4, 0.5, 0.6]
        ]);
        expect(embedding.model).toBe('gemini-embedding-001');
        expect(embedding.dimensions).toBe(3);
        // Gemini does not report token usage for embeddings.
        expect(embedding.usage).toBeUndefined();
      });

      expect(lastRequestUrl()).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents'
      );
      expect(lastRequestHeaders()['x-goog-api-key']).toBe('gk-test');
      const body = lastRequestBody();
      const requests = body.requests as Array<Record<string, unknown>>;
      expect(requests).toHaveLength(2);
      expect(requests[0]).toMatchObject({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: 'a' }] }
      });
      expect(requests[1].content).toEqual({ parts: [{ text: 'b' }] });
    });

    test('maps taskType to SCREAMING_SNAKE on the wire (request-body assertion)', async () => {
      mockFetchResponse(geminiEmbeddingBody([[0.1]]));

      await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: 'q', taskType: 'retrieval-query' }
      });

      const requests = lastRequestBody().requests as Array<Record<string, unknown>>;
      expect(requests[0].taskType).toBe('RETRIEVAL_QUERY');
    });

    test('maps a hyphenated taskType (code-retrieval-query) correctly', async () => {
      mockFetchResponse(geminiEmbeddingBody([[0.1]]));

      await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: 'q', taskType: 'code-retrieval-query' }
      });

      const requests = lastRequestBody().requests as Array<Record<string, unknown>>;
      expect(requests[0].taskType).toBe('CODE_RETRIEVAL_QUERY');
    });

    test('sends outputDimensionality and reports the reduced length', async () => {
      // Reduced-dimension response (MRL truncation to 2).
      mockFetchResponse(geminiEmbeddingBody([[0.1, 0.2]]));

      const result = await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: 'q', dimensions: 2 }
      });

      const requests = lastRequestBody().requests as Array<Record<string, unknown>>;
      expect(requests[0].outputDimensionality).toBe(2);
      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.dimensions).toBe(2);
      });
    });

    test('omits taskType and outputDimensionality when not supplied', async () => {
      mockFetchResponse(geminiEmbeddingBody([[0.1]]));

      await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: 'q' }
      });

      const requests = lastRequestBody().requests as Array<Record<string, unknown>>;
      expect(requests[0].taskType).toBeUndefined();
      expect(requests[0].outputDimensionality).toBeUndefined();
    });

    test('does not double-prefix an already-qualified model id', async () => {
      mockFetchResponse(geminiEmbeddingBody([[0.1]]));

      await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        modelOverride: 'models/gemini-embedding-001',
        params: { input: 'q' }
      });

      expect(lastRequestUrl()).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents'
      );
      const requests = lastRequestBody().requests as Array<Record<string, unknown>>;
      expect(requests[0].model).toBe('models/gemini-embedding-001');
    });

    test('fails when the response is missing the embeddings array', async () => {
      mockFetchResponse({ notEmbeddings: [] });
      const result = await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: 'q' }
      });
      expect(result).toFailWith(/Gemini embeddings API response/i);
    });

    test('fails when the response embeddings array is empty', async () => {
      // Mirrors the OpenAI empty-data case: the non-empty validator constraint
      // rejects a zero-length batch up front (symmetric with the OpenAI adapter).
      mockFetchResponse({ embeddings: [] });
      const result = await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: 'q' }
      });
      expect(result).toFailWith(/Gemini embeddings API response/i);
    });

    test('surfaces an HTTP error from the Gemini endpoint', async () => {
      mockFetchHttpError(503, 'unavailable');
      const result = await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: 'q' }
      });
      expect(result).toFailWith(/503.*unavailable/i);
    });

    test('fails when the embedding count does not match the input count', async () => {
      // Two inputs, but the server returns only one embedding. Gemini aligns by
      // request order with no index field, so a short batch must be rejected.
      mockFetchResponse(geminiEmbeddingBody([[0.1]]));
      const result = await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: ['a', 'b'] }
      });
      expect(result).toFailWith(/expected 2 embedding\(s\), got 1/i);
    });

    test('fails when vectors have inconsistent dimensionality', async () => {
      mockFetchResponse(geminiEmbeddingBody([[0.1, 0.2], [0.3]]));
      const result = await AiAssist.callProviderEmbedding({
        descriptor: geminiDescriptor(),
        apiKey: 'gk-test',
        params: { input: ['a', 'b'] }
      });
      expect(result).toFailWith(/inconsistent vector dimensionality .*vector 1 has length 1, expected 2/i);
    });
  });

  describe('callProxiedEmbedding', () => {
    test('posts to the proxy embedding endpoint and returns the validated result', async () => {
      mockFetchResponse({
        vectors: [[0.1, 0.2]],
        model: 'text-embedding-3-small',
        dimensions: 2,
        usage: { promptTokens: 3, totalTokens: 3 }
      });

      const result = await AiAssist.callProxiedEmbedding('http://localhost:3001', {
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        modelOverride: 'text-embedding-3-small',
        params: { input: 'x' }
      });

      expect(result).toSucceedAndSatisfy((embedding) => {
        expect(embedding.vectors).toEqual([[0.1, 0.2]]);
        expect(embedding.dimensions).toBe(2);
        expect(embedding.usage).toEqual({ promptTokens: 3, totalTokens: 3 });
      });

      expect(lastRequestUrl()).toBe('http://localhost:3001/api/ai/embedding');
      expect(lastRequestBody()).toMatchObject({
        providerId: 'openai',
        apiKey: 'sk-test',
        modelOverride: 'text-embedding-3-small',
        params: { input: 'x' }
      });
    });

    test('omits modelOverride from the proxy body when not supplied', async () => {
      mockFetchResponse({ vectors: [[0.1]], model: 'm', dimensions: 1 });

      await AiAssist.callProxiedEmbedding('http://localhost:3001', {
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });

      expect(lastRequestBody().modelOverride).toBeUndefined();
    });

    test('surfaces a proxy error body', async () => {
      mockFetchResponse({ error: 'provider exploded' });
      const result = await AiAssist.callProxiedEmbedding('http://localhost:3001', {
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/proxy: provider exploded/i);
    });

    test('fails when the proxy returns an invalid response shape', async () => {
      mockFetchResponse({ vectors: 'not-an-array', model: 'm', dimensions: 1 });
      const result = await AiAssist.callProxiedEmbedding('http://localhost:3001', {
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/proxy returned invalid response/i);
    });

    test('surfaces an HTTP error from the proxy', async () => {
      mockFetchHttpError(502, 'bad gateway');
      const result = await AiAssist.callProxiedEmbedding('http://localhost:3001', {
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/502.*bad gateway/i);
    });

    test('surfaces a network error from the proxy', async () => {
      mockFetchError(new Error('connection refused'));
      const result = await AiAssist.callProxiedEmbedding('http://localhost:3001', {
        descriptor: openAiDescriptor(),
        apiKey: 'sk-test',
        params: { input: 'x' }
      });
      expect(result).toFailWith(/connection refused/i);
    });
  });
});
