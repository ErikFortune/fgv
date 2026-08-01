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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { succeed } from '@fgv/ts-utils';
import {
  FileItem,
  FsFileTreeAccessors,
  IFileTreeAccessors,
  IFileTreeFileItem,
  IMutableBinaryFileTreeFileItem,
  InMemoryTreeAccessors,
  isBinaryAccessors,
  isBinaryFileItem,
  isMutableBinaryAccessors,
  isMutableBinaryFileItem
} from '../../../packlets/file-tree';

/**
 * Minimal accessors that implement only the required read surface — no mutation and no
 * binary capability. Used to exercise the "capability absent" branches of `FileItem`.
 */
const nonBinaryAccessors: IFileTreeAccessors = {
  resolveAbsolutePath: (...paths: string[]) => paths.join('/'),
  getExtension: () => '.txt',
  getBaseName: () => 'a.txt',
  joinPaths: (...paths: string[]) => paths.join('/'),
  getItem: () => ({} as never),
  getFileContents: () => succeed(''),
  getFileContentType: () => succeed(undefined),
  getChildren: () => ({} as never)
};

/**
 * A file item that implements only the required read surface — no mutation and no
 * binary capability. Spread into richer literals to exercise the guards' clauses.
 */
const plainFileItem: IFileTreeFileItem = {
  type: 'file',
  absolutePath: '/a.txt',
  name: 'a.txt',
  baseName: 'a',
  extension: '.txt',
  contentType: undefined,
  getContents: () => ({} as never),
  getRawContents: () => succeed('')
};

/**
 * Bytes that are NOT valid UTF-8 — a lone continuation byte followed by a truncated
 * two-byte sequence. A lenient decode replaces each with U+FFFD; a strict decode throws.
 */
const MALFORMED_UTF8: Uint8Array = new Uint8Array([0x41, 0x80, 0xc3, 0x42]);

/** A small PNG-like byte payload with a NUL and high bytes. */
const BINARY_PAYLOAD: Uint8Array = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x1a, 0x0a, 0xff]);

describe('FileTree binary capability', () => {
  describe('isBinaryAccessors', () => {
    it('returns true for FsFileTreeAccessors', () => {
      expect(isBinaryAccessors(new FsFileTreeAccessors())).toBe(true);
    });

    it('returns true for InMemoryTreeAccessors', () => {
      expect(isBinaryAccessors(InMemoryTreeAccessors.create([]).orThrow())).toBe(true);
    });

    it('returns false for accessors that do not implement getFileBytes', () => {
      expect(isBinaryAccessors(nonBinaryAccessors)).toBe(false);
    });
  });

  describe('isMutableBinaryAccessors', () => {
    it('returns true for FsFileTreeAccessors, which persists bytes verbatim', () => {
      expect(isMutableBinaryAccessors(new FsFileTreeAccessors())).toBe(true);
    });

    it('returns false for InMemoryTreeAccessors, which is byte-readable but not byte-writable', () => {
      const accessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
      expect(isMutableBinaryAccessors(accessors)).toBe(false);
      expect(isBinaryAccessors(accessors)).toBe(true);
    });

    it('returns false for byte-readable accessors that do not support mutation at all', () => {
      const readOnlyBinary: IFileTreeAccessors = {
        ...nonBinaryAccessors,
        getFileBytes: () => succeed(new Uint8Array())
      } as IFileTreeAccessors;
      expect(isBinaryAccessors(readOnlyBinary)).toBe(true);
      expect(isMutableBinaryAccessors(readOnlyBinary)).toBe(false);
    });

    it('returns false for accessors with no binary capability at all', () => {
      expect(isMutableBinaryAccessors(nonBinaryAccessors)).toBe(false);
    });
  });

  describe('isBinaryFileItem', () => {
    it('returns true for a FileItem', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.txt', contents: 'hi' }]).orThrow();
      expect(isBinaryFileItem(accessors.getItem('/a.txt').orThrow())).toBe(true);
    });

    it('returns false for a directory item', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/d/a.txt', contents: 'hi' }]).orThrow();
      expect(isBinaryFileItem(accessors.getItem('/d').orThrow())).toBe(false);
    });

    it('returns false for a file item that does not implement getRawBytes', () => {
      expect(isBinaryFileItem(plainFileItem)).toBe(false);
      expect(isMutableBinaryFileItem(plainFileItem)).toBe(false);
    });
  });

  describe('isMutableBinaryFileItem', () => {
    it('returns false for a byte-readable item that does not support mutation', () => {
      const item = { ...plainFileItem, getRawBytes: () => succeed(new Uint8Array()) };
      expect(isBinaryFileItem(item)).toBe(true);
      expect(isMutableBinaryFileItem(item)).toBe(false);
    });

    it('returns false for a byte-readable, mutable item that lacks setRawBytes', () => {
      const item = {
        ...plainFileItem,
        getRawBytes: () => succeed(new Uint8Array()),
        getIsMutable: () => ({} as never),
        setContents: () => ({} as never),
        setRawContents: () => ({} as never),
        delete: () => ({} as never)
      };
      expect(isBinaryFileItem(item)).toBe(true);
      expect(isMutableBinaryFileItem(item)).toBe(false);
    });
  });

  describe('InMemoryTreeAccessors', () => {
    it('reads text contents as their UTF-8 bytes', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.txt', contents: 'héllo' }]).orThrow();
      expect(accessors.getFileBytes('/a.txt')).toSucceedWith(new TextEncoder().encode('héllo'));
    });

    it('reads bytes seeded as a Uint8Array verbatim', () => {
      const accessors = InMemoryTreeAccessors.create([
        { path: '/img.png', contents: BINARY_PAYLOAD }
      ]).orThrow();
      expect(accessors.getFileBytes('/img.png')).toSucceedWith(BINARY_PAYLOAD);
    });

    it('reads non-string, non-byte contents as the UTF-8 bytes of their JSON form', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.json', contents: { k: 1 } }]).orThrow();
      expect(accessors.getFileBytes('/a.json')).toSucceedWith(new TextEncoder().encode('{"k":1}'));
    });

    it('decodes Uint8Array contents as UTF-8 for text reads', () => {
      const accessors = InMemoryTreeAccessors.create([
        { path: '/a.txt', contents: new TextEncoder().encode('héllo') }
      ]).orThrow();
      expect(accessors.getFileContents('/a.txt')).toSucceedWith('héllo');
    });

    it('fails to read bytes for a missing path', () => {
      const accessors = InMemoryTreeAccessors.create([]).orThrow();
      expect(accessors.getFileBytes('/nope.txt')).toFailWith(/not found/i);
    });

    it('fails to read bytes for a directory', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/d/a.txt', contents: 'hi' }]).orThrow();
      expect(accessors.getFileBytes('/d')).toFailWith(/not a file/i);
    });
  });

  describe('FsFileTreeAccessors', () => {
    let tempDir: string;
    let accessors: FsFileTreeAccessors;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'binary-fs-test-'));
      accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('reads a file as raw bytes without decoding', () => {
      fs.writeFileSync(path.join(tempDir, 'img.png'), BINARY_PAYLOAD);
      expect(accessors.getFileBytes('img.png')).toSucceedWith(BINARY_PAYLOAD);
    });

    it('returns a standalone Uint8Array rather than a pooled Node Buffer view', () => {
      fs.writeFileSync(path.join(tempDir, 'small.bin'), BINARY_PAYLOAD);
      expect(accessors.getFileBytes('small.bin')).toSucceedAndSatisfy((bytes) => {
        expect(bytes.byteOffset).toBe(0);
        expect(bytes.buffer.byteLength).toBe(bytes.byteLength);
        expect(Buffer.isBuffer(bytes)).toBe(false);
      });
    });

    it('preserves malformed UTF-8 that a text read would replace with U+FFFD', () => {
      fs.writeFileSync(path.join(tempDir, 'bad.txt'), MALFORMED_UTF8);

      expect(accessors.getFileContents('bad.txt')).toSucceedAndSatisfy((text) => {
        expect(text).toContain('�');
      });

      expect(accessors.getFileBytes('bad.txt')).toSucceedAndSatisfy((bytes) => {
        expect(bytes).toEqual(MALFORMED_UTF8);
        // The documented strict-decode recipe reports the corruption instead of hiding it.
        expect(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes)).toThrow();
      });
    });

    it('fails to read bytes for a missing file', () => {
      expect(accessors.getFileBytes('missing.bin')).toFailWith(/ENOENT/i);
    });

    it('round-trips bytes through saveFileBytes', () => {
      expect(accessors.saveFileBytes('out.bin', BINARY_PAYLOAD)).toSucceedWith(BINARY_PAYLOAD);
      expect(fs.readFileSync(path.join(tempDir, 'out.bin'))).toEqual(Buffer.from(BINARY_PAYLOAD));
      expect(accessors.getFileBytes('out.bin')).toSucceedWith(BINARY_PAYLOAD);
    });

    it('refuses to write bytes when mutability is disabled', () => {
      const readOnly = new FsFileTreeAccessors({ prefix: tempDir, mutable: false });
      expect(readOnly.saveFileBytes('out.bin', BINARY_PAYLOAD)).toFailWith(/mutability is disabled/i);
      expect(fs.existsSync(path.join(tempDir, 'out.bin'))).toBe(false);
    });

    it('fails to write bytes into a directory that does not exist', () => {
      expect(accessors.saveFileBytes('missing/out.bin', BINARY_PAYLOAD)).toFailWith(/ENOENT/i);
    });
  });

  describe('FileItem', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'binary-item-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('reads and writes bytes through byte-native accessors', () => {
      fs.writeFileSync(path.join(tempDir, 'img.png'), BINARY_PAYLOAD);
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const item = accessors.getItem('img.png').orThrow();

      expect(isBinaryFileItem(item)).toBe(true);
      expect(isMutableBinaryFileItem(item)).toBe(true);

      if (isMutableBinaryFileItem(item)) {
        expect(item.getRawBytes()).toSucceedWith(BINARY_PAYLOAD);
        expect(item.setRawBytes(MALFORMED_UTF8)).toSucceedWith(MALFORMED_UTF8);
        expect(item.getRawBytes()).toSucceedWith(MALFORMED_UTF8);
      }
    });

    it('reads bytes from an in-memory tree', () => {
      const accessors = InMemoryTreeAccessors.create([
        { path: '/img.png', contents: BINARY_PAYLOAD }
      ]).orThrow();
      const item = accessors.getItem('/img.png').orThrow();
      expect(isBinaryFileItem(item)).toBe(true);
      if (isBinaryFileItem(item)) {
        expect(item.getRawBytes()).toSucceedWith(BINARY_PAYLOAD);
      }
    });

    it('reports a byte write against non-byte-writable accessors as a failure', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.txt', contents: 'hi' }], {
        mutable: true
      }).orThrow();
      const item = accessors.getItem('/a.txt').orThrow();
      expect(isMutableBinaryFileItem(item)).toBe(true);
      expect((item as IMutableBinaryFileTreeFileItem).setRawBytes(BINARY_PAYLOAD)).toFailWith(
        /raw byte writes not supported/i
      );
    });

    it('reports byte access against accessors with no binary capability as a failure', () => {
      const item = FileItem.create('/a.txt', nonBinaryAccessors).orThrow();
      expect(item.getRawBytes()).toFailWith(/raw byte access not supported/i);
      expect(item.setRawBytes(BINARY_PAYLOAD)).toFailWith(/raw byte writes not supported/i);
    });
  });
});
