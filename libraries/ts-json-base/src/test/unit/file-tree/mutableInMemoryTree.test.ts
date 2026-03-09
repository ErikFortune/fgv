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
import { InMemoryTreeAccessors, isMutableAccessors } from '../../../packlets/file-tree';

describe('InMemoryTreeAccessors', () => {
  const testFiles = [
    { path: '/data/file1.json', contents: { key: 'value1' } },
    { path: '/data/file2.json', contents: { key: 'value2' } },
    { path: '/other/file3.txt', contents: 'text content' }
  ];

  describe('create', () => {
    it('creates accessors with files', () => {
      expect(InMemoryTreeAccessors.create(testFiles, { mutable: true })).toSucceed();
    });

    it('creates accessors with prefix string', () => {
      expect(InMemoryTreeAccessors.create(testFiles, '/prefix')).toSucceed();
    });

    it('creates accessors with params object', () => {
      expect(InMemoryTreeAccessors.create(testFiles, { prefix: '/prefix', mutable: true })).toSucceed();
    });

    it('fails when file path conflicts with existing directory during construction', () => {
      const conflictingFiles = [
        { path: '/data/file.json', contents: {} },
        { path: '/data', contents: 'conflict' } // /data is already a directory
      ];
      expect(InMemoryTreeAccessors.create(conflictingFiles, { mutable: true })).toFail();
    });

    it('fails when directory path conflicts with existing file during construction', () => {
      const conflictingFiles = [
        { path: '/file.json', contents: {} },
        { path: '/file.json/nested.json', contents: {} } // /file.json is already a file
      ];
      expect(InMemoryTreeAccessors.create(conflictingFiles, { mutable: true })).toFail();
    });

    it('fails with invalid root path during construction', () => {
      const invalidFiles = [{ path: '/', contents: {} }];
      expect(InMemoryTreeAccessors.create(invalidFiles, { mutable: true })).toFail();
    });

    it('fails with duplicate file paths during construction', () => {
      const duplicateFiles = [
        { path: '/data/file.json', contents: { first: true } },
        { path: '/data/file.json', contents: { second: true } }
      ];
      expect(InMemoryTreeAccessors.create(duplicateFiles, { mutable: true })).toFail();
    });
  });

  describe('isMutableAccessors', () => {
    it('returns true for InMemoryTreeAccessors with mutable: true', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      expect(isMutableAccessors(accessors)).toBe(true);
    });
  });

  describe('fileIsMutable', () => {
    it('returns not-mutable when mutable is false', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: false }).orThrow();
      const result = accessors.fileIsMutable('/data/file1.json');
      expect(result.isFailure()).toBe(true);
      expect(result.detail).toBe('not-mutable');
    });

    it('returns not-mutable when mutable is undefined', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles).orThrow();
      const result = accessors.fileIsMutable('/data/file1.json');
      expect(result.isFailure()).toBe(true);
      expect(result.detail).toBe('not-mutable');
    });

    it('returns path-excluded when path does not match filter', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, {
        mutable: { include: ['/allowed'] }
      }).orThrow();
      const result = accessors.fileIsMutable('/data/file1.json');
      expect(result.isFailure()).toBe(true);
      expect(result.detail).toBe('path-excluded');
    });

    it('returns transient when file can be saved', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const result = accessors.fileIsMutable('/data/file1.json');
      expect(result.isSuccess()).toBe(true);
      expect(result.detail).toBe('transient');
    });

    it('returns transient for new file path', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const result = accessors.fileIsMutable('/new/file.json');
      expect(result.isSuccess()).toBe(true);
      expect(result.detail).toBe('transient');
    });
  });

  describe('saveFileContents', () => {
    it('updates existing file contents', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();

      const saveResult = accessors.saveFileContents('/data/file1.json', '{"updated": "data"}');
      expect(saveResult.isSuccess()).toBe(true);

      const getResult = accessors.getFileContents('/data/file1.json');
      expect(getResult.isSuccess()).toBe(true);
      expect(getResult.value).toBe('{"updated": "data"}');
    });

    it('creates new file', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();

      const saveResult = accessors.saveFileContents('/new/file.json', '{"new": "file"}');
      expect(saveResult.isSuccess()).toBe(true);

      const getResult = accessors.getFileContents('/new/file.json');
      expect(getResult.isSuccess()).toBe(true);
      expect(getResult.value).toBe('{"new": "file"}');
    });

    it('creates nested directories for new file', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();

      const saveResult = accessors.saveFileContents('/deep/nested/path/file.json', '{}');
      expect(saveResult.isSuccess()).toBe(true);

      const getResult = accessors.getFileContents('/deep/nested/path/file.json');
      expect(getResult.isSuccess()).toBe(true);
    });

    it('fails when mutability is disabled', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: false }).orThrow();
      const result = accessors.saveFileContents('/data/file1.json', '{}');
      expect(result.isFailure()).toBe(true);
      expect(result.message).toContain('mutability is disabled');
    });

    it('fails when path is excluded by filter', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, {
        mutable: { exclude: [/\.json$/] }
      }).orThrow();
      const result = accessors.saveFileContents('/data/file1.json', '{}');
      expect(result.isFailure()).toBe(true);
      expect(result.message).toContain('path is excluded');
    });

    it('succeeds when path matches include filter', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, {
        mutable: { include: [/\.json$/] }
      }).orThrow();
      const result = accessors.saveFileContents('/data/file1.json', '{"filtered": true}');
      expect(result.isSuccess()).toBe(true);
    });

    it('fails for invalid path', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const result = accessors.saveFileContents('/', '{}');
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('getFileContents', () => {
    it('returns contents of existing file', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const result = accessors.getFileContents('/data/file1.json');
      expect(result.isSuccess()).toBe(true);
      expect(JSON.parse(result.value!)).toEqual({ key: 'value1' });
    });

    it('returns string contents without JSON stringification', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const result = accessors.getFileContents('/other/file3.txt');
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toBe('text content');
    });

    it('fails for non-existent file', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const result = accessors.getFileContents('/nonexistent.json');
      expect(result.isFailure()).toBe(true);
      expect(result.message).toContain('not found');
    });

    it('fails for directory path', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const result = accessors.getFileContents('/data');
      expect(result.isFailure()).toBe(true);
      expect(result.message).toContain('not a file');
    });
  });

  describe('edge cases', () => {
    it('fails when trying to add file where directory exists', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      // /data is a directory, trying to save a file at /data should fail
      const result = accessors.saveFileContents('/data', '{}');
      expect(result.isFailure()).toBe(true);
    });

    it('fails when trying to create directory where file exists', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      // /data/file1.json is a file, trying to create /data/file1.json/subfile.json should fail
      const result = accessors.saveFileContents('/data/file1.json/subfile.json', '{}');
      expect(result.isFailure()).toBe(true);
    });

    it('handles root prefix correctly', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { prefix: '/', mutable: true }).orThrow();
      const result = accessors.fileIsMutable('/data/file1.json');
      expect(result.isSuccess()).toBe(true);
    });

    it('handles prefix with trailing slash', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, {
        prefix: '/prefix/',
        mutable: true
      }).orThrow();
      const result = accessors.fileIsMutable('/prefix/data/file1.json');
      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('integration with FileItem', () => {
    it('FileItem.getIsMutable returns transient for mutable in-memory accessors', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const itemResult = accessors.getItem('/data/file1.json');
      expect(itemResult.isSuccess()).toBe(true);

      const item = itemResult.value!;
      expect(item.type).toBe('file');
      if (item.type === 'file') {
        expect(item.getIsMutable()).toSucceedWithDetail(true, 'transient');
      }
    });

    it('FileItem.setContents saves JSON data', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const itemResult = accessors.getItem('/data/file1.json');
      expect(itemResult.isSuccess()).toBe(true);

      const item = itemResult.value!;
      if (item.type === 'file' && item.setContents) {
        const saveResult = item.setContents({ updated: 'value' });
        expect(saveResult.isSuccess()).toBe(true);

        const contentsResult = accessors.getFileContents('/data/file1.json');
        expect(contentsResult.isSuccess()).toBe(true);
        expect(JSON.parse(contentsResult.value!)).toEqual({ updated: 'value' });
      }
    });

    it('FileItem.setRawContents saves raw string', () => {
      const accessors = InMemoryTreeAccessors.create(testFiles, { mutable: true }).orThrow();
      const itemResult = accessors.getItem('/other/file3.txt');
      expect(itemResult.isSuccess()).toBe(true);

      const item = itemResult.value!;
      if (item.type === 'file' && item.setRawContents) {
        const saveResult = item.setRawContents('updated content');
        expect(saveResult.isSuccess()).toBe(true);

        const contentsResult = accessors.getFileContents('/other/file3.txt');
        expect(contentsResult.isSuccess()).toBe(true);
        expect(contentsResult.value).toBe('updated content');
      }
    });
  });
});
