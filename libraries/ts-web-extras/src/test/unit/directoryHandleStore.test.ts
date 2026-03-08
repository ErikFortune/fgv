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
import {
  DirectoryHandleStore,
  DEFAULT_DIRECTORY_HANDLE_DB,
  DEFAULT_DIRECTORY_HANDLE_STORE
} from '../../packlets/file-tree/directoryHandleStore';
import type { FileSystemDirectoryHandle } from '../../packlets/file-api-types';

import { get, set, del, keys, createStore } from 'idb-keyval';

const mockGet = jest.mocked(get);
const mockSet = jest.mocked(set);
const mockDel = jest.mocked(del);
const mockKeys = jest.mocked(keys);
const mockCreateStore = jest.mocked(createStore);

function makeMockHandle(name: string): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name,
    isSameEntry: jest.fn(),
    queryPermission: jest.fn(),
    requestPermission: jest.fn(),
    getDirectoryHandle: jest.fn(),
    getFileHandle: jest.fn(),
    removeEntry: jest.fn(),
    resolve: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    [Symbol.asyncIterator]: jest.fn()
  } as FileSystemDirectoryHandle;
}

describe('DirectoryHandleStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constants', () => {
    test('DEFAULT_DIRECTORY_HANDLE_DB has expected value', () => {
      expect(DEFAULT_DIRECTORY_HANDLE_DB).toBe('chocolate-lab-storage');
    });

    test('DEFAULT_DIRECTORY_HANDLE_STORE has expected value', () => {
      expect(DEFAULT_DIRECTORY_HANDLE_STORE).toBe('directory-handles');
    });
  });

  describe('constructor', () => {
    test('uses default db and store names', () => {
      new DirectoryHandleStore();
      expect(mockCreateStore).toHaveBeenCalledWith(
        DEFAULT_DIRECTORY_HANDLE_DB,
        DEFAULT_DIRECTORY_HANDLE_STORE
      );
    });

    test('uses custom db and store names', () => {
      new DirectoryHandleStore('custom-db', 'custom-store');
      expect(mockCreateStore).toHaveBeenCalledWith('custom-db', 'custom-store');
    });
  });

  describe('save', () => {
    test('saves a handle successfully', async () => {
      mockSet.mockResolvedValue(undefined);
      const store = new DirectoryHandleStore();
      const handle = makeMockHandle('my-dir');

      const result = await store.save('my-dir', handle);

      expect(result).toSucceed();
      expect(mockSet).toHaveBeenCalledWith('my-dir', handle, expect.anything());
    });

    test('returns failure when set throws', async () => {
      mockSet.mockRejectedValue(new Error('IndexedDB unavailable'));
      const store = new DirectoryHandleStore();
      const handle = makeMockHandle('my-dir');

      const result = await store.save('my-dir', handle);

      expect(result).toFailWith(/IndexedDB unavailable/);
    });
  });

  describe('load', () => {
    test('returns the handle when found', async () => {
      const handle = makeMockHandle('my-dir');
      mockGet.mockResolvedValue(handle);
      const store = new DirectoryHandleStore();

      const result = await store.load('my-dir');

      expect(result).toSucceedWith(handle);
      expect(mockGet).toHaveBeenCalledWith('my-dir', expect.anything());
    });

    test('returns undefined when not found', async () => {
      mockGet.mockResolvedValue(undefined);
      const store = new DirectoryHandleStore();

      const result = await store.load('missing');

      expect(result).toSucceedWith(undefined);
    });

    test('returns failure when get throws', async () => {
      mockGet.mockRejectedValue(new Error('read error'));
      const store = new DirectoryHandleStore();

      const result = await store.load('my-dir');

      expect(result).toFailWith(/read error/);
    });
  });

  describe('remove', () => {
    test('removes a handle successfully', async () => {
      mockDel.mockResolvedValue(undefined);
      const store = new DirectoryHandleStore();

      const result = await store.remove('my-dir');

      expect(result).toSucceed();
      expect(mockDel).toHaveBeenCalledWith('my-dir', expect.anything());
    });

    test('returns failure when del throws', async () => {
      mockDel.mockRejectedValue(new Error('delete error'));
      const store = new DirectoryHandleStore();

      const result = await store.remove('my-dir');

      expect(result).toFailWith(/delete error/);
    });
  });

  describe('getAllLabels', () => {
    test('returns all keys', async () => {
      mockKeys.mockResolvedValue(['dir-a', 'dir-b']);
      const store = new DirectoryHandleStore();

      const result = await store.getAllLabels();

      expect(result).toSucceedWith(['dir-a', 'dir-b']);
      expect(mockKeys).toHaveBeenCalledWith(expect.anything());
    });

    test('returns empty array when no keys', async () => {
      mockKeys.mockResolvedValue([]);
      const store = new DirectoryHandleStore();

      const result = await store.getAllLabels();

      expect(result).toSucceedWith([]);
    });

    test('returns failure when keys throws', async () => {
      mockKeys.mockRejectedValue(new Error('keys error'));
      const store = new DirectoryHandleStore();

      const result = await store.getAllLabels();

      expect(result).toFailWith(/keys error/);
    });
  });

  describe('getAll', () => {
    test('returns all label/handle pairs', async () => {
      const handleA = makeMockHandle('dir-a');
      const handleB = makeMockHandle('dir-b');
      mockKeys.mockResolvedValue(['dir-a', 'dir-b']);
      mockGet.mockResolvedValueOnce(handleA).mockResolvedValueOnce(handleB);
      const store = new DirectoryHandleStore();

      const result = await store.getAll();

      expect(result).toSucceedAndSatisfy((entries) => {
        expect(entries).toHaveLength(2);
        expect(entries[0]).toEqual({ label: 'dir-a', handle: handleA });
        expect(entries[1]).toEqual({ label: 'dir-b', handle: handleB });
      });
    });

    test('returns empty array when no handles stored', async () => {
      mockKeys.mockResolvedValue([]);
      const store = new DirectoryHandleStore();

      const result = await store.getAll();

      expect(result).toSucceedWith([]);
    });

    test('skips entries where handle is undefined', async () => {
      const handleA = makeMockHandle('dir-a');
      mockKeys.mockResolvedValue(['dir-a', 'dir-b']);
      mockGet.mockResolvedValueOnce(handleA).mockResolvedValueOnce(undefined);
      const store = new DirectoryHandleStore();

      const result = await store.getAll();

      expect(result).toSucceedAndSatisfy((entries) => {
        expect(entries).toHaveLength(1);
        expect(entries[0]).toEqual({ label: 'dir-a', handle: handleA });
      });
    });

    test('returns failure when getAllLabels fails', async () => {
      mockKeys.mockRejectedValue(new Error('keys error'));
      const store = new DirectoryHandleStore();

      const result = await store.getAll();

      expect(result).toFailWith(/keys error/);
    });

    test('returns failure when load fails for a key', async () => {
      mockKeys.mockResolvedValue(['dir-a']);
      mockGet.mockRejectedValue(new Error('load error'));
      const store = new DirectoryHandleStore();

      const result = await store.getAll();

      expect(result).toFailWith(/load error/);
    });
  });
});
