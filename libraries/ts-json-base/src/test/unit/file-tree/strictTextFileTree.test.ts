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
  InMemoryTreeAccessors,
  isStrictTextAccessors,
  isStrictTextFileItem
} from '../../../packlets/file-tree';

/**
 * Bytes that are NOT valid UTF-8 — a lone continuation byte followed by a truncated
 * two-byte sequence. A lenient decode replaces each with U+FFFD; a strict decode fails.
 */
const MALFORMED_UTF8: Uint8Array = new Uint8Array([0x41, 0x80, 0xc3, 0x42]);

/** Well-formed UTF-8 with a multi-byte code point, to prove strict is not merely stricter. */
const VALID_UTF8: Uint8Array = new TextEncoder().encode('héllo — ok');

/**
 * Minimal accessors implementing only the required read surface: no binary capability
 * and no strict-text capability. Used for the "capability absent" branches.
 */
const plainAccessors: IFileTreeAccessors = {
  resolveAbsolutePath: (...paths: string[]) => paths.join('/'),
  getExtension: () => '.txt',
  getBaseName: () => 'a.txt',
  joinPaths: (...paths: string[]) => paths.join('/'),
  getItem: () => ({} as never),
  getFileContents: () => succeed(''),
  getFileContentType: () => succeed(undefined),
  getChildren: () => ({} as never)
};

/** A file item implementing only the required read surface. */
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

describe('FileTree strict-text capability', () => {
  describe('isStrictTextAccessors', () => {
    it('returns true for FsFileTreeAccessors, which reads real bytes from disk', () => {
      expect(isStrictTextAccessors(new FsFileTreeAccessors())).toBe(true);
    });

    it('returns true for InMemoryTreeAccessors, which implements the capability per file', () => {
      // The store implements strict decoding; whether any *particular* file can be
      // judged depends on how that file was seeded. That split is the whole point:
      // the accessor guard answers "is the capability implemented", not "will this
      // path succeed".
      expect(isStrictTextAccessors(InMemoryTreeAccessors.create([]).orThrow())).toBe(true);
    });

    it('returns false for accessors that do not implement getFileTextStrict', () => {
      expect(isStrictTextAccessors(plainAccessors)).toBe(false);
    });
  });

  describe('isStrictTextFileItem', () => {
    it('returns true for a FileItem', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.txt', contents: 'hi' }]).orThrow();
      expect(isStrictTextFileItem(accessors.getItem('/a.txt').orThrow())).toBe(true);
    });

    it('returns false for a directory item', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/d/a.txt', contents: 'hi' }]).orThrow();
      expect(isStrictTextFileItem(accessors.getItem('/d').orThrow())).toBe(false);
    });

    it('returns false for a file item that does not implement getTextStrict', () => {
      expect(isStrictTextFileItem(plainFileItem)).toBe(false);
    });
  });

  describe('FsFileTreeAccessors', () => {
    let tempDir: string;
    let accessors: FsFileTreeAccessors;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-fs-test-'));
      accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('decodes well-formed UTF-8, including multi-byte code points', () => {
      fs.writeFileSync(path.join(tempDir, 'good.txt'), VALID_UTF8);
      expect(accessors.getFileTextStrict('good.txt')).toSucceedWith('héllo — ok');
    });

    it('fails loudly on malformed UTF-8 that a lenient read silently repairs', () => {
      fs.writeFileSync(path.join(tempDir, 'bad.txt'), MALFORMED_UTF8);

      // The lenient read is the status quo: it succeeds and hands back substituted text,
      // so a caller cannot tell corruption from content.
      expect(accessors.getFileContents('bad.txt')).toSucceedAndSatisfy((text) => {
        expect(text).toContain('�');
      });

      expect(accessors.getFileTextStrict('bad.txt')).toFail();
    });

    it('fails for a missing file', () => {
      expect(accessors.getFileTextStrict('missing.txt')).toFailWith(/ENOENT/i);
    });
  });

  describe('InMemoryTreeAccessors', () => {
    it('decodes byte-seeded contents strictly', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/good.txt', contents: VALID_UTF8 }]).orThrow();
      expect(accessors.getFileTextStrict('/good.txt')).toSucceedWith('héllo — ok');
    });

    it('fails loudly on byte-seeded contents that are not valid UTF-8', () => {
      const accessors = InMemoryTreeAccessors.create([
        { path: '/bad.txt', contents: MALFORMED_UTF8 }
      ]).orThrow();
      expect(accessors.getFileContents('/bad.txt')).toSucceedAndSatisfy((text) => {
        expect(text).toContain('�');
      });
      expect(accessors.getFileTextStrict('/bad.txt')).toFail();
    });

    it('refuses a string-seeded file rather than reporting a success it cannot stand behind', () => {
      // A string reached this store already decoded. Re-encoding it would produce
      // well-formed UTF-8 whose corruption (if any) is baked in and undetectable, so a
      // "success" here would be a green light from a check that cannot fail.
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.txt', contents: 'h�llo' }]).orThrow();
      expect(accessors.getFileTextStrict('/a.txt')).toFailWith(/already-decoded text/i);
    });

    it('refuses a JSON-seeded file for the same reason', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/a.json', contents: { k: 1 } }]).orThrow();
      expect(accessors.getFileTextStrict('/a.json')).toFailWith(/already-decoded text/i);
    });

    it('fails for a missing path', () => {
      const accessors = InMemoryTreeAccessors.create([]).orThrow();
      expect(accessors.getFileTextStrict('/nope.txt')).toFailWith(/not found/i);
    });

    it('fails for a directory', () => {
      const accessors = InMemoryTreeAccessors.create([{ path: '/d/a.txt', contents: 'hi' }]).orThrow();
      expect(accessors.getFileTextStrict('/d')).toFailWith(/not a file/i);
    });
  });

  describe('FileItem', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-item-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('delegates a strict read to byte-native accessors', () => {
      fs.writeFileSync(path.join(tempDir, 'good.txt'), VALID_UTF8);
      const accessors = new FsFileTreeAccessors({ prefix: tempDir });
      const item = accessors.getItem('good.txt').orThrow();

      expect(isStrictTextFileItem(item)).toBe(true);
      if (isStrictTextFileItem(item)) {
        expect(item.getTextStrict()).toSucceedWith('héllo — ok');
      }
    });

    it('reports malformed bytes as a failure through the item surface', () => {
      fs.writeFileSync(path.join(tempDir, 'bad.txt'), MALFORMED_UTF8);
      const item = new FsFileTreeAccessors({ prefix: tempDir }).getItem('bad.txt').orThrow();
      expect(isStrictTextFileItem(item)).toBe(true);
      if (isStrictTextFileItem(item)) {
        expect(item.getTextStrict()).toFail();
      }
    });

    it('reports a strict read against accessors with no strict capability as a failure', () => {
      // The item guard narrows the type only — `FileItem` implements `getTextStrict`
      // unconditionally and delegates, so the absent capability surfaces as a Failure
      // rather than as a missing method. Use `isStrictTextAccessors` when the check
      // itself must guarantee success.
      const item = FileItem.create('/a.txt', plainAccessors).orThrow();
      expect(isStrictTextFileItem(item)).toBe(true);
      expect(item.getTextStrict()).toFailWith(/strict UTF-8 decoding is not supported/i);
    });
  });
});
