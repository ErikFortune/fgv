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
