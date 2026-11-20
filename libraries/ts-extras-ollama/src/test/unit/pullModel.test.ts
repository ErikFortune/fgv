import '@fgv/ts-utils-jest';
import { type IOllamaClient, type IOllamaPullProgress, createOllamaClient, pullModel } from '../../index';

/** The actual `/api/pull` wire chunk shape — layer fields absent on non-transfer phases. */
interface IPullChunk {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

/**
 * Builds a structural mock of the upstream `AbortableAsyncIterator` returned by `client.pull`.
 * `abort()` flips an internal flag that the generator checks before each chunk — so an abort
 * triggered mid-stream surfaces as a throw on the next iteration, matching the real lib.
 */
function makePullIterator(
  chunks: ReadonlyArray<IPullChunk>,
  opts?: { readonly throwMidStream?: boolean }
): { abort: jest.Mock } & AsyncIterable<IPullChunk> {
  let aborted = false;
  return {
    abort: jest.fn(() => {
      aborted = true;
    }),
    async *[Symbol.asyncIterator](): AsyncGenerator<IPullChunk> {
      for (const chunk of chunks) {
        if (aborted) {
          throw new Error('The operation was aborted');
        }
        yield chunk;
        if (opts?.throwMidStream) {
          throw new Error('stream broke mid-pull');
        }
      }
    }
  };
}

function mockPullClient(pull: unknown): IOllamaClient {
  return { pull } as unknown as IOllamaClient;
}

const happyChunks: ReadonlyArray<IPullChunk> = [
  { status: 'pulling manifest' },
  { status: 'pulling sha256:abc', digest: 'sha256:abc', total: 1000, completed: 1000 },
  { status: 'success' }
];

describe('pullModel (layer 1 — structural client mock)', () => {
  test('drives the stream, maps each chunk, and resolves with finalStatus + chunkCount', async () => {
    const pull = jest.fn().mockResolvedValue(makePullIterator(happyChunks));
    const client = mockPullClient(pull);
    const seen: IOllamaPullProgress[] = [];

    expect(await pullModel(client, { model: 'llama3.1:8b', onProgress: (p) => seen.push(p) })).toSucceedWith({
      model: 'llama3.1:8b',
      finalStatus: 'success',
      chunkCount: 3
    });
    expect(pull).toHaveBeenCalledWith({ model: 'llama3.1:8b', stream: true });
    expect(seen).toHaveLength(3);
    // Manifest phase: no layer fields.
    expect(seen[0]).toEqual({
      status: 'pulling manifest',
      digest: undefined,
      total: undefined,
      completed: undefined
    });
    // Transfer phase: layer fields present and mapped 1:1.
    expect(seen[1]).toEqual({
      status: 'pulling sha256:abc',
      digest: 'sha256:abc',
      total: 1000,
      completed: 1000
    });
    expect(seen[2].status).toBe('success');
  });

  test('forwards insecure and works without an onProgress callback', async () => {
    const pull = jest.fn().mockResolvedValue(makePullIterator(happyChunks));
    const client = mockPullClient(pull);

    expect(await pullModel(client, { model: 'llama3.1:8b', insecure: true })).toSucceedWith({
      model: 'llama3.1:8b',
      finalStatus: 'success',
      chunkCount: 3
    });
    expect(pull).toHaveBeenCalledWith({ model: 'llama3.1:8b', stream: true, insecure: true });
  });

  test('fails when the stream errors mid-pull', async () => {
    const pull = jest.fn().mockResolvedValue(makePullIterator(happyChunks, { throwMidStream: true }));
    const client = mockPullClient(pull);

    expect(await pullModel(client, { model: 'llama3.1:8b' })).toFailWith(/stream broke mid-pull/);
  });

  test('fails when onProgress throws', async () => {
    const pull = jest.fn().mockResolvedValue(makePullIterator(happyChunks));
    const client = mockPullClient(pull);

    expect(
      await pullModel(client, {
        model: 'llama3.1:8b',
        onProgress: () => {
          throw new Error('consumer blew up');
        }
      })
    ).toFailWith(/consumer blew up/);
  });

  test('an already-aborted signal cancels the pull on the first iteration', async () => {
    // The signal is aborted before the loop begins, so the iterator's abort fires up front; the
    // throw surfaces on the first iteration attempt (the mock checks the flag before the first yield).
    const iterator = makePullIterator(happyChunks);
    const pull = jest.fn().mockResolvedValue(iterator);
    const client = mockPullClient(pull);
    const controller = new AbortController();
    controller.abort();

    expect(await pullModel(client, { model: 'llama3.1:8b', signal: controller.signal })).toFailWith(/abort/i);
    expect(iterator.abort).toHaveBeenCalledTimes(1);
  });

  test('a mid-stream abort cancels the pull, removes the listener, and surfaces as failure', async () => {
    const iterator = makePullIterator(happyChunks);
    const pull = jest.fn().mockResolvedValue(iterator);
    const client = mockPullClient(pull);
    const controller = new AbortController();
    const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');
    const seen: IOllamaPullProgress[] = [];

    const result = await pullModel(client, {
      model: 'llama3.1:8b',
      signal: controller.signal,
      onProgress: (p) => {
        seen.push(p);
        if (seen.length === 1) {
          controller.abort();
        }
      }
    });
    expect(result).toFailWith(/abort/i);
    expect(iterator.abort).toHaveBeenCalled();
    expect(seen).toHaveLength(1);
    // The `finally` cleanup runs on the failure path too — no listener leak after an abort.
    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  test('removes the abort listener after a normal completion', async () => {
    const pull = jest.fn().mockResolvedValue(makePullIterator(happyChunks));
    const client = mockPullClient(pull);
    const controller = new AbortController();
    const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');

    expect(await pullModel(client, { model: 'llama3.1:8b', signal: controller.signal })).toSucceed();
    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});

/**
 * Layer 2 — a real client built with a mock `fetch` whose body is a `ReadableStream` of
 * newline-delimited JSON. This exercises the `ollama` lib's actual JSON-lines stream parsing
 * flowing through `pullModel`'s loop — the framing that layer 1 stubs over.
 */
function ndjsonResponse(lines: ReadonlyArray<string>): Response {
  const bytes = new TextEncoder().encode(lines.join('\n') + '\n');
  // Split the payload mid-stream (likely mid-line) into two reads to exercise buffer reassembly.
  const mid = Math.floor(bytes.length / 2);
  const parts = [bytes.slice(0, mid), bytes.slice(mid)];
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < parts.length) {
        controller.enqueue(parts[i++]);
      } else {
        controller.close();
      }
    }
  });
  return new Response(stream, { status: 200 });
}

describe('pullModel (layer 2 — fetch-level JSON-lines integration)', () => {
  test('parses a real newline-delimited /api/pull stream through the ollama lib', async () => {
    const lines = [
      JSON.stringify({ status: 'pulling manifest' }),
      JSON.stringify({ status: 'pulling sha256:abc', digest: 'sha256:abc', total: 1000, completed: 1000 }),
      JSON.stringify({ status: 'verifying sha256 digest' }),
      JSON.stringify({ status: 'writing manifest' }),
      JSON.stringify({ status: 'success' })
    ];
    const fetchMock = jest.fn().mockResolvedValue(ndjsonResponse(lines));
    const client = createOllamaClient({ fetch: fetchMock as unknown as typeof fetch }).orThrow();
    const seen: IOllamaPullProgress[] = [];

    expect(
      await pullModel(client, { model: 'llama3.1:8b', onProgress: (p) => seen.push(p) })
    ).toSucceedAndSatisfy((r) => {
      expect(r.finalStatus).toBe('success');
      expect(r.chunkCount).toBe(5);
    });
    expect(seen.map((s) => s.status)).toEqual([
      'pulling manifest',
      'pulling sha256:abc',
      'verifying sha256 digest',
      'writing manifest',
      'success'
    ]);
    expect(seen[1]).toEqual({
      status: 'pulling sha256:abc',
      digest: 'sha256:abc',
      total: 1000,
      completed: 1000
    });
    expect(seen[0].digest).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toEqual(expect.stringContaining('/api/pull'));
  });
});
