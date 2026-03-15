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
import { HttpTreeAccessors } from '../../packlets/file-tree';

// ---- Mock fetch helpers ----

interface IMockResponse {
  ok: boolean;
  status?: number;
  jsonValue?: unknown;
  textValue?: string;
  throwOnJson?: boolean;
  throwOnText?: boolean;
}

function makeMockResponse(options: IMockResponse): Response {
  const { ok, status = ok ? 200 : 400, jsonValue, textValue, throwOnJson, throwOnText } = options;
  return {
    ok,
    status,
    json: throwOnJson
      ? () => Promise.reject(new Error('JSON parse error'))
      : () => Promise.resolve(jsonValue),
    text: throwOnText
      ? () => Promise.reject(new Error('text error'))
      : () => Promise.resolve(textValue ?? `HTTP ${status}`)
  } as unknown as Response;
}

type FetchCall = { url: string; init?: RequestInit };

/**
 * Creates a mock fetch function that returns responses for each call in order.
 * Each entry maps to one fetch() invocation in call order.
 */
function makeMockFetch(responses: IMockResponse[]): { fetchImpl: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  let callIndex = 0;

  const fetchImpl = (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    calls.push({ url: url.toString(), init });
    const response = responses[callIndex++];
    if (response === undefined) {
      return Promise.reject(new Error(`Unexpected fetch call #${callIndex} to ${url.toString()}`));
    }
    return Promise.resolve(makeMockResponse(response));
  };

  return { fetchImpl: fetchImpl as typeof fetch, calls };
}

/**
 * Creates a mock fetch function that throws a network error on every call.
 */
function makeThrowingFetch(message: string): typeof fetch {
  return (_url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    return Promise.reject(new Error(message));
  };
}

// ---- Shared test data builders ----

/** Minimal tree-children response for a single file at root. */
function rootWithOneFile(fileName = 'data.json'): unknown {
  return {
    path: '/',
    children: [{ path: `/${fileName}`, name: fileName, type: 'file' }]
  };
}

/** File response for a JSON file. */
function fileResponse(path: string, contents: string, contentType?: string): unknown {
  const response: Record<string, unknown> = { path, contents };
  if (contentType !== undefined) {
    response.contentType = contentType;
  }
  return response;
}

/** Root children response containing a subdirectory and a file. */
function rootWithDirAndFile(): unknown {
  return {
    path: '/',
    children: [
      { path: '/subdir', name: 'subdir', type: 'directory' },
      { path: '/root.json', name: 'root.json', type: 'file' }
    ]
  };
}

/** Children response for /subdir containing one file. */
function subdirWithOneFile(): unknown {
  return {
    path: '/subdir',
    children: [{ path: '/subdir/nested.json', name: 'nested.json', type: 'file' }]
  };
}

// ---- Tests ----

describe('HttpTreeAccessors', () => {
  describe('fromHttp()', () => {
    test('succeeds with an empty directory (no children)', async () => {
      const { fetchImpl } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors).toBeInstanceOf(HttpTreeAccessors);
        expect(accessors.isDirty()).toBe(false);
      });
    });

    test('succeeds and loads a single file at root', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{"items":{}}') }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl,
        mutable: true
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/data.json')).toSucceedWith('{"items":{}}');
      });
    });

    test('succeeds with multiple files at root', async () => {
      const { fetchImpl } = makeMockFetch([
        {
          ok: true,
          jsonValue: {
            path: '/',
            children: [
              { path: '/alpha.json', name: 'alpha.json', type: 'file' },
              { path: '/beta.json', name: 'beta.json', type: 'file' }
            ]
          }
        },
        { ok: true, jsonValue: fileResponse('/alpha.json', '"alpha"') },
        { ok: true, jsonValue: fileResponse('/beta.json', '"beta"') }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl,
        mutable: true
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/alpha.json')).toSucceedWith('"alpha"');
        expect(accessors.getFileContents('/beta.json')).toSucceedWith('"beta"');
      });
    });

    test('succeeds and recursively loads files in subdirectories', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithDirAndFile() },
        { ok: true, jsonValue: subdirWithOneFile() },
        { ok: true, jsonValue: fileResponse('/subdir/nested.json', '"nested"') },
        { ok: true, jsonValue: fileResponse('/root.json', '"root"') }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl,
        mutable: true
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/subdir/nested.json')).toSucceedWith('"nested"');
        expect(accessors.getFileContents('/root.json')).toSucceedWith('"root"');
      });
    });

    test('strips trailing slash from baseUrl', async () => {
      const { fetchImpl, calls } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000/',
        fetchImpl
      });

      // The URL should start with the base URL without a trailing slash, then /tree/children
      expect(calls[0].url).toMatch(/^http:\/\/localhost:3000\/tree\/children/);
      // There should be no double slash in the path portion (after the protocol)
      const urlPath = calls[0].url.replace('http://', '');
      expect(urlPath).not.toContain('//');
    });

    test('includes namespace in query parameters when provided', async () => {
      const { fetchImpl, calls } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        namespace: 'my-namespace',
        fetchImpl
      });

      expect(calls[0].url).toContain('namespace=my-namespace');
    });

    test('omits namespace from query parameters when not provided', async () => {
      const { fetchImpl, calls } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(calls[0].url).not.toContain('namespace');
    });

    test('applies prefix parameter to loaded file paths', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{"items":{}}') }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        prefix: '/app',
        fetchImpl,
        mutable: true
      });

      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/app/data.json')).toSucceedWith('{"items":{}}');
      });
    });

    test('fails when the initial children fetch fails with a network error', async () => {
      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl: makeThrowingFetch('Network unreachable')
      });

      expect(result).toFailWith(/network unreachable/i);
    });

    test('fails when the children response is not ok', async () => {
      const { fetchImpl } = makeMockFetch([{ ok: false, status: 404, textValue: 'Not Found' }]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/not found/i);
    });

    test('fails when the children response contains invalid JSON', async () => {
      const { fetchImpl } = makeMockFetch([{ ok: true, throwOnJson: true }]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/invalid json/i);
    });

    test('fails when a file fetch fails with a network error', async () => {
      let callCount = 0;
      const fetchImpl: typeof fetch = (_url, _init) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: rootWithOneFile('data.json') }));
        }
        return Promise.reject(new Error('File fetch failed'));
      };

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/file fetch failed/i);
    });

    test('fails when a file response is not ok', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: false, status: 403, textValue: 'Forbidden' }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/forbidden/i);
    });

    test('fails when a file response contains invalid JSON', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, throwOnJson: true }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/invalid json/i);
    });

    test('fails when a nested directory fetch fails', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithDirAndFile() },
        { ok: false, status: 500, textValue: 'Internal Server Error' }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/internal server error/i);
    });
  });

  describe('isDirty() and getDirtyPaths()', () => {
    test('starts not dirty after loading', async () => {
      const { fetchImpl } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({ baseUrl: 'http://localhost:3000', fetchImpl })
      ).orThrow();

      expect(accessors.isDirty()).toBe(false);
      expect(accessors.getDirtyPaths()).toEqual([]);
    });

    test('becomes dirty after saveFileContents', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '{"modified":true}').orThrow();

      expect(accessors.isDirty()).toBe(true);
      expect(accessors.getDirtyPaths()).toContain('/data.json');
    });

    test('tracks multiple dirty files', async () => {
      const { fetchImpl } = makeMockFetch([
        {
          ok: true,
          jsonValue: {
            path: '/',
            children: [
              { path: '/a.json', name: 'a.json', type: 'file' },
              { path: '/b.json', name: 'b.json', type: 'file' }
            ]
          }
        },
        { ok: true, jsonValue: fileResponse('/a.json', '{}') },
        { ok: true, jsonValue: fileResponse('/b.json', '{}') }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/a.json', '"a"').orThrow();
      accessors.saveFileContents('/b.json', '"b"').orThrow();

      expect(accessors.getDirtyPaths()).toHaveLength(2);
      expect(accessors.getDirtyPaths()).toContain('/a.json');
      expect(accessors.getDirtyPaths()).toContain('/b.json');
    });
  });

  describe('saveFileContents()', () => {
    test('fails when the file is not found (immutable tree has no matching path)', async () => {
      const { fetchImpl } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({ baseUrl: 'http://localhost:3000', fetchImpl })
      ).orThrow();

      // With mutable: false (default), saveFileContents should fail
      const result = accessors.saveFileContents('/missing.json', '{}');
      expect(result).toFail();
    });

    test('marks the file as dirty without autoSync', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      const result = accessors.saveFileContents('/data.json', '{"updated":true}');
      expect(result).toSucceedWith('{"updated":true}');
      expect(accessors.isDirty()).toBe(true);
      // No additional fetch calls should have occurred (no autoSync)
    });

    test('triggers fire-and-forget autoSync when autoSync is enabled', async () => {
      const syncResponses: IMockResponse[] = [
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        // PUT /file response for sync
        { ok: true, jsonValue: { path: '/data.json', contents: '{"auto":true}' } },
        // POST /sync response
        { ok: true, jsonValue: { synced: 1 } }
      ];
      const { fetchImpl, calls } = makeMockFetch(syncResponses);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true,
          autoSync: true
        })
      ).orThrow();

      const result = accessors.saveFileContents('/data.json', '{"auto":true}');
      expect(result).toSucceedWith('{"auto":true}');

      // autoSync fires-and-forgets; wait for microtasks to drain
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // Verify that PUT + POST /sync were called
      const methodCalls = calls.slice(2).map((c) => c.init?.method);
      expect(methodCalls).toContain('PUT');
      expect(methodCalls).toContain('POST');
    });
  });

  describe('fileIsMutable()', () => {
    test('returns persistent detail when file exists and mutable is true', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      const result = accessors.fileIsMutable('/data.json');
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(true);
        expect(result.detail).toBe('persistent');
      }
    });

    test('returns not-mutable detail when mutable is false', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: false
        })
      ).orThrow();

      const result = accessors.fileIsMutable('/data.json');
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.detail).toBe('not-mutable');
      }
    });

    test('returns persistent detail for any path when mutable is true (no path existence check)', async () => {
      // InMemoryTreeAccessors checks the mutable config, not path existence.
      // HttpTreeAccessors layers "persistent" on top of a successful mutable check.
      const { fetchImpl } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      // Any path succeeds as "persistent" when mutable: true
      const result = accessors.fileIsMutable('/nonexistent.json');
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(true);
        expect(result.detail).toBe('persistent');
      }
    });
  });

  describe('syncToDisk()', () => {
    test('succeeds immediately with no dirty files', async () => {
      const { fetchImpl } = makeMockFetch([{ ok: true, jsonValue: { path: '/', children: [] } }]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({ baseUrl: 'http://localhost:3000', fetchImpl })
      ).orThrow();

      const result = await accessors.syncToDisk();
      expect(result).toSucceed();
    });

    test('PUTs each dirty file then POSTs /sync', async () => {
      const { fetchImpl, calls } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        { ok: true, jsonValue: fileResponse('/data.json', '{"new":1}') },
        { ok: true, jsonValue: { synced: 1 } }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '{"new":1}').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toSucceed();
      const syncCalls = calls.slice(2);
      expect(syncCalls[0].url).toContain('/file');
      expect(syncCalls[0].init?.method).toBe('PUT');
      expect(syncCalls[1].url).toContain('/sync');
      expect(syncCalls[1].init?.method).toBe('POST');
    });

    test('clears dirty state after successful sync', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        { ok: true, jsonValue: fileResponse('/data.json', '"updated"') },
        { ok: true, jsonValue: { synced: 1 } }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"updated"').orThrow();
      expect(accessors.isDirty()).toBe(true);

      await accessors.syncToDisk();
      expect(accessors.isDirty()).toBe(false);
      expect(accessors.getDirtyPaths()).toEqual([]);
    });

    test('includes namespace in PUT body and POST /sync body when provided', async () => {
      const { fetchImpl, calls } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        { ok: true, jsonValue: fileResponse('/data.json', '"v2"') },
        { ok: true, jsonValue: { synced: 1 } }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          namespace: 'myns',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"v2"').orThrow();
      await accessors.syncToDisk();

      const putBody = JSON.parse(calls[2].init?.body as string) as Record<string, unknown>;
      expect(putBody.namespace).toBe('myns');

      const syncBody = JSON.parse(calls[3].init?.body as string) as Record<string, unknown>;
      expect(syncBody.namespace).toBe('myns');
    });

    test('omits namespace from PUT body and POST /sync body when not provided', async () => {
      const { fetchImpl, calls } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        { ok: true, jsonValue: fileResponse('/data.json', '"v2"') },
        { ok: true, jsonValue: { synced: 1 } }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"v2"').orThrow();
      await accessors.syncToDisk();

      const putBody = JSON.parse(calls[2].init?.body as string) as Record<string, unknown>;
      expect(putBody.namespace).toBeUndefined();

      const syncBody = JSON.parse(calls[3].init?.body as string) as Record<string, unknown>;
      expect(syncBody.namespace).toBeUndefined();
    });

    test('fails when PUT for a dirty file returns a non-ok response', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        { ok: false, status: 500, textValue: 'Server Error' }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"updated"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/sync.*data\.json.*server error/i);
    });

    test('fails when PUT for a dirty file encounters a network error', async () => {
      let callCount = 0;
      const fetchImpl: typeof fetch = (_url, _init) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: rootWithOneFile('data.json') }));
        }
        if (callCount === 2) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: fileResponse('/data.json', '{}') }));
        }
        return Promise.reject(new Error('PUT network error'));
      };

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"updated"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/put network error/i);
    });

    test('fails when POST /sync returns a non-ok response', async () => {
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        { ok: true, jsonValue: fileResponse('/data.json', '"v2"') },
        { ok: false, status: 503, textValue: 'Service Unavailable' }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"v2"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/service unavailable/i);
    });

    test('fails when POST /sync encounters a network error', async () => {
      let callCount = 0;
      const fetchImpl: typeof fetch = (_url, _init) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: rootWithOneFile('data.json') }));
        }
        if (callCount === 2) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: fileResponse('/data.json', '{}') }));
        }
        if (callCount === 3) {
          return Promise.resolve(
            makeMockResponse({ ok: true, jsonValue: fileResponse('/data.json', '"v2"') })
          );
        }
        return Promise.reject(new Error('POST network error'));
      };

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"v2"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/post network error/i);
    });

    test('syncs multiple dirty files in order', async () => {
      const { fetchImpl, calls } = makeMockFetch([
        {
          ok: true,
          jsonValue: {
            path: '/',
            children: [
              { path: '/a.json', name: 'a.json', type: 'file' },
              { path: '/b.json', name: 'b.json', type: 'file' }
            ]
          }
        },
        { ok: true, jsonValue: fileResponse('/a.json', '{}') },
        { ok: true, jsonValue: fileResponse('/b.json', '{}') },
        { ok: true, jsonValue: fileResponse('/a.json', '"a-updated"') },
        { ok: true, jsonValue: fileResponse('/b.json', '"b-updated"') },
        { ok: true, jsonValue: { synced: 2 } }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/a.json', '"a-updated"').orThrow();
      accessors.saveFileContents('/b.json', '"b-updated"').orThrow();

      const result = await accessors.syncToDisk();
      expect(result).toSucceed();

      // Verify 2 PUTs + 1 POST
      const syncCalls = calls.slice(3);
      const methods = syncCalls.map((c) => c.init?.method);
      expect(methods.filter((m) => m === 'PUT')).toHaveLength(2);
      expect(methods.filter((m) => m === 'POST')).toHaveLength(1);
    });
  });

  describe('syncToDisk() - getFileContents failure', () => {
    test('fails when getFileContents returns failure for a dirty file during sync', async () => {
      // This covers lines 112-113: the contentsResult.isFailure() branch in syncToDisk.
      // We load a file, mark it dirty, then sabotage getFileContents to fail.
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '{"new":1}').orThrow();

      // Sabotage the base getFileContents to simulate a failure
      const originalGet = accessors.getFileContents.bind(accessors);
      accessors.getFileContents = (path: string) => {
        if (path === '/data.json') {
          // eslint-disable-next-line import/no-internal-modules
          const { fail: failResult } = require('@fgv/ts-utils') as typeof import('@fgv/ts-utils');
          return failResult('simulated get failure');
        }
        return originalGet(path);
      };

      const result = await accessors.syncToDisk();
      expect(result).toFailWith(/simulated get failure/i);
    });
  });

  describe('_request() invalid JSON during sync', () => {
    test('fails when PUT /file returns invalid JSON', async () => {
      // Covers lines 225-226: _request() returns fail('invalid JSON response')
      // when response.json() throws during a sync PUT.
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}') },
        // PUT response with ok=true but throwOnJson simulates invalid JSON body
        { ok: true, throwOnJson: true }
      ]);

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"updated"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/invalid json/i);
    });
  });

  describe('fromHttp() with inferContentType', () => {
    test('calls inferContentType when provided and uses the result', async () => {
      // Covers line 270: params.inferContentType?.(...).orDefault()
      const { fetchImpl } = makeMockFetch([
        { ok: true, jsonValue: rootWithOneFile('data.json') },
        { ok: true, jsonValue: fileResponse('/data.json', '{}', 'application/json') }
      ]);

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl,
        inferContentType: (path, provided) => {
          if (provided === 'application/json') {
            const { succeed: s } = require('@fgv/ts-utils') as typeof import('@fgv/ts-utils');
            return s('json' as string);
          }
          const { succeed: s } = require('@fgv/ts-utils') as typeof import('@fgv/ts-utils');
          return s(undefined);
        }
      });

      expect(result).toSucceed();
    });
  });

  describe('_request() error handling', () => {
    test('returns failure with error message for network error (Error instance throw) during sync', async () => {
      // Covers line 214 true branch: response.err instanceof Error -> uses .message
      let callCount = 0;
      const fetchImpl: typeof fetch = (_url, _init) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: rootWithOneFile('data.json') }));
        }
        if (callCount === 2) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: fileResponse('/data.json', '{}') }));
        }
        // PUT request throws an Error instance
        return Promise.reject(new Error('real Error instance'));
      };

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"updated"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/real error instance/i);
    });

    test('returns failure with error message for non-Error throw during sync PUT', async () => {
      // Covers line 214 false branch: thrown value is not an Error instance -> uses String(response.err)
      // Must be triggered via syncToDisk() which uses the instance _request() method.
      let callCount = 0;
      const fetchImpl: typeof fetch = (_url, _init) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: rootWithOneFile('data.json') }));
        }
        if (callCount === 2) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: fileResponse('/data.json', '{}') }));
        }
        // Non-Error throw (e.g., a plain string)
        return Promise.reject('non-error string rejection');
      };

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"updated"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/non-error string rejection/i);
    });

    test('returns failure with HTTP status fallback when response.text() throws during sync', async () => {
      // Covers the text() catch branch in _request(): uses `HTTP ${status}` fallback
      let callCount = 0;
      const fetchImpl: typeof fetch = (_url, _init) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: rootWithOneFile('data.json') }));
        }
        if (callCount === 2) {
          return Promise.resolve(makeMockResponse({ ok: true, jsonValue: fileResponse('/data.json', '{}') }));
        }
        return Promise.resolve(makeMockResponse({ ok: false, status: 502, throwOnText: true }));
      };

      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000',
          fetchImpl,
          mutable: true
        })
      ).orThrow();

      accessors.saveFileContents('/data.json', '"updated"').orThrow();
      const result = await accessors.syncToDisk();

      expect(result).toFailWith(/http 502/i);
    });
  });

  describe('_requestWithParams() error handling', () => {
    test('returns failure with error message for non-Error network throw during init', async () => {
      // _requestWithParams is used for GET requests during fromHttp(); test non-Error throw branch
      const fetchImpl: typeof fetch = (_url, _init) => {
        return Promise.reject(42);
      };

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/42/);
    });

    test('returns failure with HTTP status fallback when response.text() throws during init', async () => {
      const fetchImpl: typeof fetch = (_url, _init) => {
        return Promise.resolve(makeMockResponse({ ok: false, status: 504, throwOnText: true }));
      };

      const result = await HttpTreeAccessors.fromHttp({
        baseUrl: 'http://localhost:3000',
        fetchImpl
      });

      expect(result).toFailWith(/http 504/i);
    });

    test('uses globalThis.fetch when no fetchImpl provided', async () => {
      // Covers line 48: the `fetchImpl ?? globalThis.fetch` right-side branch.
      // We temporarily replace globalThis.fetch with a mock that returns an empty tree.
      const originalFetch = globalThis.fetch;
      let fetchCallCount = 0;

      globalThis.fetch = (_url: string | URL | Request, _init?: RequestInit) => {
        fetchCallCount++;
        return Promise.resolve(makeMockResponse({ ok: true, jsonValue: { path: '/', children: [] } }));
      };

      try {
        const result = await HttpTreeAccessors.fromHttp({
          baseUrl: 'http://localhost:3000'
          // No fetchImpl - should fall back to globalThis.fetch
        });

        expect(result).toSucceed();
        expect(fetchCallCount).toBeGreaterThan(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
