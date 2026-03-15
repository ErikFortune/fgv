/*
 * Copyright (c) 2025 Erik Fortune
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
import { FsFileTreeAccessors, isMutableAccessors, isMutableFileItem } from '../../../packlets/file-tree';

describe('FsFileTreeAccessors', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mutable-fs-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('isMutableAccessors', () => {
    it('returns true for FsFileTreeAccessors with mutable: true', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(isMutableAccessors(accessors)).toBe(true);
    });

    it('returns true for FsFileTreeAccessors with mutable: false', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: false });
      expect(isMutableAccessors(accessors)).toBe(true);
    });
  });

  describe('fileIsMutable', () => {
    it('returns not-mutable when mutable is false', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: false });
      expect(accessors.fileIsMutable('test.json')).toFailWithDetail(/mutability is disabled/i, 'not-mutable');
    });

    it('returns not-mutable when mutable is undefined', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir });
      expect(accessors.fileIsMutable('test.json')).toFailWithDetail(/mutability is disabled/i, 'not-mutable');
    });

    it('returns path-excluded when path does not match filter', () => {
      const accessors = new FsFileTreeAccessors({
        prefix: tempDir,
        mutable: { include: ['/allowed'] }
      });
      expect(accessors.fileIsMutable('test.json')).toFailWithDetail(/path is excluded/i, 'path-excluded');
    });

    it('returns persistent when file can be saved', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.fileIsMutable('test.json')).toSucceedWithDetail(true, 'persistent');
    });

    it('returns persistent for existing writable file', () => {
      const filePath = path.join(tempDir, 'existing.json');
      fs.writeFileSync(filePath, '{}');
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.fileIsMutable('existing.json')).toSucceedWithDetail(true, 'persistent');
    });

    it('returns permission-denied for read-only file', () => {
      const filePath = path.join(tempDir, 'readonly.json');
      fs.writeFileSync(filePath, '{}');
      fs.chmodSync(filePath, 0o444);
      try {
        const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
        expect(accessors.fileIsMutable('readonly.json')).toFailWithDetail(
          /permission denied/i,
          'permission-denied'
        );
      } finally {
        fs.chmodSync(filePath, 0o644);
      }
    });
  });

  describe('saveFileContents', () => {
    it('saves file contents successfully', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.saveFileContents('test.json', '{"key": "value"}')).toSucceedWith('{"key": "value"}');

      const filePath = path.join(tempDir, 'test.json');
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('{"key": "value"}');
    });

    it('overwrites existing file', () => {
      const filePath = path.join(tempDir, 'existing.json');
      fs.writeFileSync(filePath, '{"old": "data"}');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.saveFileContents('existing.json', '{"new": "data"}')).toSucceedWith('{"new": "data"}');
      expect(fs.readFileSync(filePath, 'utf8')).toBe('{"new": "data"}');
    });

    it('fails when mutability is disabled', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: false });
      expect(accessors.saveFileContents('test.json', '{}')).toFailWith(/mutability is disabled/i);
    });

    it('fails when path is excluded by filter', () => {
      const accessors = new FsFileTreeAccessors({
        prefix: tempDir,
        mutable: { exclude: [/\.json$/] }
      });
      expect(accessors.saveFileContents('test.json', '{}')).toFailWith(/path is excluded/i);
    });

    it('succeeds when path matches include filter', () => {
      const accessors = new FsFileTreeAccessors({
        prefix: tempDir,
        mutable: { include: [/\.json$/] }
      });
      expect(accessors.saveFileContents('test.json', '{}')).toSucceed();
    });
  });

  describe('deleteFile', () => {
    it('deletes an existing file successfully', () => {
      const filePath = path.join(tempDir, 'to-delete.json');
      fs.writeFileSync(filePath, '{"delete": "me"}');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteFile('to-delete.json')).toSucceedWith(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('file is no longer readable after deletion', () => {
      const filePath = path.join(tempDir, 'to-delete.json');
      fs.writeFileSync(filePath, '{}');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteFile('to-delete.json')).toSucceedWith(true);
      expect(accessors.getFileContents('to-delete.json')).toFail();
    });

    it('fails when file does not exist', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteFile('nonexistent.json')).toFail();
    });

    it('fails when mutability is disabled', () => {
      const filePath = path.join(tempDir, 'test.json');
      fs.writeFileSync(filePath, '{}');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: false });
      expect(accessors.deleteFile('test.json')).toFailWith(/mutability is disabled/i);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('fails when path is excluded by filter', () => {
      const filePath = path.join(tempDir, 'excluded.json');
      fs.writeFileSync(filePath, '{}');

      const accessors = new FsFileTreeAccessors({
        prefix: tempDir,
        mutable: { exclude: [/\.json$/] }
      });
      expect(accessors.deleteFile('excluded.json')).toFailWith(/path is excluded/i);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('fails when target is a directory', () => {
      const dirPath = path.join(tempDir, 'subdir');
      fs.mkdirSync(dirPath);

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteFile('subdir')).toFailWith(/not a file/i);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('succeeds when path matches include filter', () => {
      const filePath = path.join(tempDir, 'included.json');
      fs.writeFileSync(filePath, '{}');

      const accessors = new FsFileTreeAccessors({
        prefix: tempDir,
        mutable: { include: [/\.json$/] }
      });
      expect(accessors.deleteFile('included.json')).toSucceedWith(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });

  describe('deleteDirectory', () => {
    it('deletes an empty directory', () => {
      const dirPath = path.join(tempDir, 'emptydir');
      fs.mkdirSync(dirPath);

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteDirectory('emptydir')).toSucceedWith(true);
      expect(fs.existsSync(dirPath)).toBe(false);
    });

    it('fails on non-empty directory', () => {
      const dirPath = path.join(tempDir, 'nonempty');
      fs.mkdirSync(dirPath);
      fs.writeFileSync(path.join(dirPath, 'file.txt'), 'content');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteDirectory('nonempty')).toFail();
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('fails for non-existent directory', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteDirectory('nonexistent')).toFail();
    });

    it('fails when mutability is disabled', () => {
      const dirPath = path.join(tempDir, 'immutable-dir');
      fs.mkdirSync(dirPath);

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: false });
      expect(accessors.deleteDirectory('immutable-dir')).toFailWith(/mutability is disabled/i);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('fails when path is excluded by filter', () => {
      const dirPath = path.join(tempDir, 'excluded');
      fs.mkdirSync(dirPath);

      const accessors = new FsFileTreeAccessors({
        prefix: tempDir,
        mutable: { exclude: [/excluded/] }
      });
      expect(accessors.deleteDirectory('excluded')).toFailWith(/path is excluded/i);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('fails when target is a file', () => {
      const filePath = path.join(tempDir, 'afile.txt');
      fs.writeFileSync(filePath, 'content');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.deleteDirectory('afile.txt')).toFailWith(/not a directory/i);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('integration with FileItem', () => {
    it('FileItem.getIsMutable returns correct result for mutable accessors', () => {
      const filePath = path.join(tempDir, 'test.json');
      fs.writeFileSync(filePath, '{"initial": "data"}');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.getItem('test.json')).toSucceedAndSatisfy((item) => {
        expect(isMutableFileItem(item)).toBe(true);
        if (isMutableFileItem(item)) {
          expect(item.getIsMutable()).toSucceedWithDetail(true, 'persistent');
        }
      });
    });

    it('FileItem.setContents saves JSON data', () => {
      const filePath = path.join(tempDir, 'test.json');
      fs.writeFileSync(filePath, '{"initial": "data"}');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const itemResult = accessors.getItem('test.json');
      expect(itemResult.isSuccess()).toBe(true);

      const item = itemResult.value!;
      if (isMutableFileItem(item)) {
        const saveResult = item.setContents({ updated: 'value' });
        expect(saveResult.isSuccess()).toBe(true);

        const contents = fs.readFileSync(filePath, 'utf8');
        expect(JSON.parse(contents)).toEqual({ updated: 'value' });
      }
    });

    it('FileItem.delete removes file from disk', () => {
      const filePath = path.join(tempDir, 'deletable.json');
      fs.writeFileSync(filePath, '{"will": "delete"}');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      expect(accessors.getItem('deletable.json')).toSucceedAndSatisfy((item) => {
        expect(isMutableFileItem(item)).toBe(true);
        if (isMutableFileItem(item)) {
          expect(item.delete()).toSucceedWith(true);
          expect(fs.existsSync(filePath)).toBe(false);
        }
      });
    });

    it('FileItem.setRawContents saves raw string', () => {
      const filePath = path.join(tempDir, 'test.txt');
      fs.writeFileSync(filePath, 'initial content');

      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const itemResult = accessors.getItem('test.txt');
      expect(itemResult.isSuccess()).toBe(true);

      const item = itemResult.value!;
      if (isMutableFileItem(item)) {
        const saveResult = item.setRawContents('updated content');
        expect(saveResult.isSuccess()).toBe(true);

        const contents = fs.readFileSync(filePath, 'utf8');
        expect(contents).toBe('updated content');
      }
    });
  });
});
