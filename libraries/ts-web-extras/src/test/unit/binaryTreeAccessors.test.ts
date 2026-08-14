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
import { FileTree } from '@fgv/ts-json-base';
import {
  FileSystemAccessTreeAccessors,
  HttpTreeAccessors,
  LocalStorageTreeAccessors
} from '../../packlets/file-tree';
import { createMockDirectoryHandle } from '../utils/fileSystemAccessMocks';

const CORPUS_TEXT: string = 'agent corpus — built-in, with a non-ASCII em dash';

/**
 * Minimal in-memory `Storage` stand-in for `LocalStorageTreeAccessors`.
 */
function createStorage(seed: Record<string, string>): Storage {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    get length(): number {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string): void => {
      map.delete(key);
    },
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    }
  } as Storage;
}

/**
 * Stands in for the storage REST API that `HttpTreeAccessors.fromHttp` reads from.
 * Serves one file at `/corpus.md` from a fixed base URL.
 */
function createCorpusFetch(contents: string): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes('/tree/children')
      ? { path: '/', children: [{ path: '/corpus.md', name: 'corpus.md', type: 'file' }] }
      : { path: '/corpus.md', contents };
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => body,
      text: async () => JSON.stringify(body)
    } as Response;
  }) as unknown as typeof fetch;
}

describe('ts-web-extras tree accessors binary capability', () => {
  describe('HttpTreeAccessors', () => {
    it('exposes a byte read for a hosted read-only corpus', async () => {
      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'https://corpus.example/api',
          fetchImpl: createCorpusFetch(CORPUS_TEXT)
        })
      ).orThrow();

      expect(FileTree.isBinaryAccessors(accessors)).toBe(true);
      expect(accessors.getFileBytes('/corpus.md')).toSucceedWith(new TextEncoder().encode(CORPUS_TEXT));
    });

    it('does not advertise a byte-write capability, since the transport carries text', async () => {
      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'https://corpus.example/api',
          fetchImpl: createCorpusFetch(CORPUS_TEXT)
        })
      ).orThrow();

      expect(FileTree.isMutableBinaryAccessors(accessors)).toBe(false);
    });

    it('exposes the byte read on file items too', async () => {
      const accessors = (
        await HttpTreeAccessors.fromHttp({
          baseUrl: 'https://corpus.example/api',
          fetchImpl: createCorpusFetch(CORPUS_TEXT)
        })
      ).orThrow();

      const item = accessors.getItem('/corpus.md').orThrow();
      expect(FileTree.isBinaryFileItem(item)).toBe(true);
      if (FileTree.isBinaryFileItem(item)) {
        expect(item.getRawBytes()).toSucceedWith(new TextEncoder().encode(CORPUS_TEXT));
      }
    });
  });

  describe('LocalStorageTreeAccessors', () => {
    it('exposes a byte read but no byte write', () => {
      const storage = createStorage({
        'data-key': JSON.stringify({ notes: CORPUS_TEXT })
      });
      const accessors = LocalStorageTreeAccessors.fromStorage({
        storage,
        pathToKeyMap: { '/data': 'data-key' }
      }).orThrow();

      expect(FileTree.isBinaryAccessors(accessors)).toBe(true);
      expect(FileTree.isMutableBinaryAccessors(accessors)).toBe(false);
      expect(accessors.getFileBytes('/data/notes.yaml')).toSucceedWith(new TextEncoder().encode(CORPUS_TEXT));
    });
  });
});

describe('ts-web-extras tree accessors strict-text capability', () => {
  // All three of this packlet's accessors inherit `getFileTextStrict` from the
  // in-memory base and all three hold only already-decoded strings, so all three
  // refuse every file — structurally, from the per-file custody rule, rather than
  // from a hand-written per-adapter special case. That refusal is the point: over
  // HTTP the "bytes" are a re-encode of a JSON string field, so a strict decode
  // that succeeded would be a check that cannot fail.

  it('HttpTreeAccessors implements the capability but refuses every file', async () => {
    const accessors = (
      await HttpTreeAccessors.fromHttp({
        baseUrl: 'https://corpus.example/api',
        fetchImpl: createCorpusFetch(CORPUS_TEXT)
      })
    ).orThrow();

    expect(FileTree.isStrictTextAccessors(accessors)).toBe(true);
    expect(accessors.getFileTextStrict('/corpus.md')).toFailWith(/already-decoded text/i);
  });

  it('HttpTreeAccessors refuses through the file-item surface too', async () => {
    const accessors = (
      await HttpTreeAccessors.fromHttp({
        baseUrl: 'https://corpus.example/api',
        fetchImpl: createCorpusFetch(CORPUS_TEXT)
      })
    ).orThrow();

    const item = accessors.getItem('/corpus.md').orThrow();
    expect(FileTree.isStrictTextFileItem(item)).toBe(true);
    if (FileTree.isStrictTextFileItem(item)) {
      expect(item.getTextStrict()).toFailWith(/already-decoded text/i);
    }
  });

  it('FileSystemAccessTreeAccessors refuses too, since it seeds from a lenient file.text()', async () => {
    const dirHandle = createMockDirectoryHandle('/', {
      'notes.md': { content: CORPUS_TEXT, type: 'text/markdown' }
    });
    const accessors = (await FileSystemAccessTreeAccessors.fromDirectoryHandle(dirHandle)).orThrow();

    expect(FileTree.isStrictTextAccessors(accessors)).toBe(true);
    expect(accessors.getFileTextStrict('/notes.md')).toFailWith(/already-decoded text/i);
  });

  it('LocalStorageTreeAccessors refuses for the same reason', () => {
    const storage = createStorage({ 'data-key': JSON.stringify({ notes: CORPUS_TEXT }) });
    const accessors = LocalStorageTreeAccessors.fromStorage({
      storage,
      pathToKeyMap: { '/data': 'data-key' }
    }).orThrow();

    expect(FileTree.isStrictTextAccessors(accessors)).toBe(true);
    expect(accessors.getFileTextStrict('/data/notes.yaml')).toFailWith(/already-decoded text/i);
  });
});

describe('HttpTreeAccessors byte-faithful transport (contentEncoding: base64)', () => {
  /** Bytes that are not valid UTF-8 — the case the whole feature exists for. */
  const MALFORMED_UTF8: Uint8Array = new Uint8Array([0x41, 0x80, 0xc3, 0x42]);

  function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const b of bytes) {
      binary += String.fromCharCode(b);
    }
    return btoa(binary);
  }

  /**
   * A storage API that honours `?encoding=base64` and reports what it sent.
   * `capturedEncoding` records what the client actually asked for.
   */
  function createByteFetch(
    bytes: Uint8Array,
    options: { readonly honourEncoding?: boolean } = {}
  ): { fetchImpl: typeof fetch; capturedEncoding: () => string | null } {
    let captured: string | null = null;
    const honour = options.honourEncoding ?? true;
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      let body: unknown;
      if (url.pathname.includes('/tree/children')) {
        body = { path: '/', children: [{ path: '/corpus.md', name: 'corpus.md', type: 'file' }] };
      } else {
        captured = url.searchParams.get('encoding');
        body =
          honour && captured === 'base64'
            ? { path: '/corpus.md', contents: toBase64(bytes), encoding: 'base64' }
            : // The text-only server: ignores the parameter, answers UTF-8, says so.
              { path: '/corpus.md', contents: new TextDecoder().decode(bytes), encoding: 'utf8' };
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => body,
        text: async () => JSON.stringify(body)
      } as Response;
    }) as unknown as typeof fetch;
    return { fetchImpl, capturedEncoding: () => captured };
  }

  it('requests base64 and seeds the tree with the origin bytes verbatim', async () => {
    const { fetchImpl, capturedEncoding } = createByteFetch(MALFORMED_UTF8);
    const accessors = (
      await HttpTreeAccessors.fromHttp({
        baseUrl: 'https://corpus.example/api',
        fetchImpl,
        contentEncoding: 'base64'
      })
    ).orThrow();

    expect(capturedEncoding()).toBe('base64');
    expect(accessors.getFileBytes('/corpus.md')).toSucceedWith(MALFORMED_UTF8);
  });

  it('makes the strict-text capability decidable — the point of the whole exercise', async () => {
    const { fetchImpl } = createByteFetch(MALFORMED_UTF8);
    const accessors = (
      await HttpTreeAccessors.fromHttp({
        baseUrl: 'https://corpus.example/api',
        fetchImpl,
        contentEncoding: 'base64'
      })
    ).orThrow();

    // Under the default transport this refuses for want of custody. With the bytes
    // in hand it reaches a verdict instead — and the verdict is that they are bad.
    expect(accessors.getFileTextStrict('/corpus.md')).toFail();
  });

  it('decodes strictly and succeeds for well-formed bytes', async () => {
    const valid = new TextEncoder().encode(CORPUS_TEXT);
    const { fetchImpl } = createByteFetch(valid);
    const accessors = (
      await HttpTreeAccessors.fromHttp({
        baseUrl: 'https://corpus.example/api',
        fetchImpl,
        contentEncoding: 'base64'
      })
    ).orThrow();

    expect(accessors.getFileTextStrict('/corpus.md')).toSucceedWith(CORPUS_TEXT);
    expect(accessors.getFileContents('/corpus.md')).toSucceedWith(CORPUS_TEXT);
  });

  it('degrades rather than corrupting when the server ignores the parameter', async () => {
    // The load-bearing safety property: the client branches on the RESPONSE's
    // encoding, never on its own request. A client that base64-decoded because it
    // had asked would mangle every file this server returns.
    const valid = new TextEncoder().encode(CORPUS_TEXT);
    const { fetchImpl } = createByteFetch(valid, { honourEncoding: false });
    const accessors = (
      await HttpTreeAccessors.fromHttp({
        baseUrl: 'https://corpus.example/api',
        fetchImpl,
        contentEncoding: 'base64'
      })
    ).orThrow();

    expect(accessors.getFileContents('/corpus.md')).toSucceedWith(CORPUS_TEXT);
    // Text-only server → no custody → the honest refusal, not a false verdict.
    expect(accessors.getFileTextStrict('/corpus.md')).toFailWith(/already-decoded text/i);
  });

  it('defaults to utf8, leaving existing deployments byte-identical', async () => {
    const { fetchImpl, capturedEncoding } = createByteFetch(new TextEncoder().encode(CORPUS_TEXT));
    const accessors = (
      await HttpTreeAccessors.fromHttp({ baseUrl: 'https://corpus.example/api', fetchImpl })
    ).orThrow();

    expect(capturedEncoding()).toBeNull();
    expect(accessors.getFileContents('/corpus.md')).toSucceedWith(CORPUS_TEXT);
    expect(accessors.getFileTextStrict('/corpus.md')).toFailWith(/already-decoded text/i);
  });

  it('fails loudly on malformed base64 rather than seeding garbage', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const body = url.pathname.includes('/tree/children')
        ? { path: '/', children: [{ path: '/corpus.md', name: 'corpus.md', type: 'file' }] }
        : { path: '/corpus.md', contents: 'not!valid!base64!', encoding: 'base64' };
      return { ok: true, status: 200, statusText: 'OK', json: async () => body } as Response;
    }) as unknown as typeof fetch;

    expect(
      await HttpTreeAccessors.fromHttp({
        baseUrl: 'https://corpus.example/api',
        fetchImpl,
        contentEncoding: 'base64'
      })
    ).toFailWith(/malformed base64/i);
  });
});
