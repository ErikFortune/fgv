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
  createZipFromFiles,
  createZipFromTextFiles,
  IZipFile,
  ZipFileItem,
  ZipFileTreeAccessors
} from '../../packlets/zip-file-tree';

/** A byte payload that is not valid UTF-8 — a PNG-like header with a NUL and high bytes. */
const BINARY_PAYLOAD: Uint8Array = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x1a, 0x0a, 0xff]);

function buildArchive(files: ReadonlyArray<IZipFile>): ZipFileTreeAccessors {
  return createZipFromFiles(files)
    .onSuccess((zipped) => ZipFileTreeAccessors.fromBuffer(zipped))
    .orThrow();
}

describe('ZIP binary capability', () => {
  describe('createZipFromFiles', () => {
    it('stores Uint8Array contents verbatim', () => {
      const accessors = buildArchive([{ path: 'img.png', contents: BINARY_PAYLOAD }]);
      expect(accessors.getFileBytes('/img.png')).toSucceedWith(BINARY_PAYLOAD);
    });

    it('encodes string contents as UTF-8', () => {
      const accessors = buildArchive([{ path: 'a.txt', contents: 'héllo' }]);
      expect(accessors.getFileBytes('/a.txt')).toSucceedWith(new TextEncoder().encode('héllo'));
      expect(accessors.getFileContents('/a.txt')).toSucceedWith('héllo');
    });

    it('mixes text and byte entries in one archive', () => {
      const accessors = buildArchive([
        { path: '/nested/a.txt', contents: 'text' },
        { path: '/nested/img.png', contents: BINARY_PAYLOAD }
      ]);
      expect(accessors.getFileContents('/nested/a.txt')).toSucceedWith('text');
      expect(accessors.getFileBytes('/nested/img.png')).toSucceedWith(BINARY_PAYLOAD);
    });

    it('produces the same archive as createZipFromTextFiles for text-only input', () => {
      const files = [{ path: 'a.txt', contents: 'hello' }];
      expect(createZipFromFiles(files)).toSucceedAndSatisfy((bytes) => {
        expect(createZipFromTextFiles(files)).toSucceedWith(bytes);
      });
    });
  });

  describe('ZipFileTreeAccessors', () => {
    it('advertises the binary read capability but not the byte-write capability', () => {
      const accessors = buildArchive([{ path: 'a.txt', contents: 'hello' }]);
      expect(FileTree.isBinaryAccessors(accessors)).toBe(true);
      expect(FileTree.isMutableBinaryAccessors(accessors)).toBe(false);
    });

    it('fails to read bytes for a missing entry', () => {
      const accessors = buildArchive([{ path: 'a.txt', contents: 'hello' }]);
      expect(accessors.getFileBytes('/missing.txt')).toFailWith(/not found/i);
    });

    it('fails to read bytes for a directory', () => {
      const accessors = buildArchive([{ path: '/nested/a.txt', contents: 'hello' }]);
      expect(accessors.getFileBytes('/nested')).toFailWith(/not a file/i);
      expect(accessors.getFileContents('/nested')).toFailWith(/not a file/i);
    });

    it('preserves bytes that a lenient UTF-8 decode would corrupt', () => {
      const accessors = buildArchive([{ path: 'img.png', contents: BINARY_PAYLOAD }]);

      expect(accessors.getFileContents('/img.png')).toSucceedAndSatisfy((text) => {
        expect(text).toContain('�');
      });
      expect(accessors.getFileBytes('/img.png')).toSucceedAndSatisfy((bytes) => {
        expect(bytes).toEqual(BINARY_PAYLOAD);
        expect(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes)).toThrow();
      });
    });
  });

  describe('ZipFileItem', () => {
    it('advertises the binary read capability but not the byte-write capability', () => {
      const accessors = buildArchive([{ path: 'img.png', contents: BINARY_PAYLOAD }]);
      const item = accessors.getItem('/img.png').orThrow();

      expect(FileTree.isBinaryFileItem(item)).toBe(true);
      expect(FileTree.isMutableBinaryFileItem(item)).toBe(false);

      if (FileTree.isBinaryFileItem(item)) {
        expect(item.getRawBytes()).toSucceedWith(BINARY_PAYLOAD);
      }
    });

    it('decodes text lazily and caches the result across reads', () => {
      const accessors = buildArchive([{ path: 'a.txt', contents: 'hello' }]);
      const item = accessors.getItem('/a.txt').orThrow();

      if (item.type === 'file') {
        expect(item.getRawContents()).toSucceedWith('hello');
        expect(item.getRawContents()).toSucceedWith('hello');
      }
    });

    it('still accepts already-decoded text in its constructor', () => {
      // Back-compat: the constructor took `contents: string` before the binary
      // capability landed, and existing callers must keep working.
      const accessors = buildArchive([{ path: 'a.txt', contents: 'seed' }]);
      const item = new ZipFileItem('a.txt', 'héllo', accessors);

      expect(item.getRawContents()).toSucceedWith('héllo');
      expect(item.getRawBytes()).toSucceedWith(new TextEncoder().encode('héllo'));
    });
  });
});
