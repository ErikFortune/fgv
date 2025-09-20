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
import { InMemoryTreeAccessors, IInMemoryFile } from '../../../packlets/file-tree';

describe('InMemoryTreeAccessors', () => {
  describe('create static method', () => {
    test('creates from empty file array', () => {
      const result = InMemoryTreeAccessors.create([]);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors).toBeInstanceOf(InMemoryTreeAccessors);
      });
    });

    test('creates from single file', () => {
      const files: IInMemoryFile[] = [{ path: '/test.json', contents: '{"key": "value"}' }];

      const result = InMemoryTreeAccessors.create(files);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/test.json')).toSucceedWith('{"key": "value"}');
      });
    });

    test('creates from multiple files', () => {
      const files: IInMemoryFile[] = [
        { path: '/file1.json', contents: '{"a": 1}' },
        { path: '/dir/file2.json', contents: '{"b": 2}' },
        { path: '/dir/subdir/file3.json', contents: '{"c": 3}' }
      ];

      const result = InMemoryTreeAccessors.create(files);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/file1.json')).toSucceedWith('{"a": 1}');
        expect(accessors.getFileContents('/dir/file2.json')).toSucceedWith('{"b": 2}');
        expect(accessors.getFileContents('/dir/subdir/file3.json')).toSucceedWith('{"c": 3}');
      });
    });

    test('creates with prefix', () => {
      const files: IInMemoryFile[] = [{ path: '/test.json', contents: '{"key": "value"}' }];

      const result = InMemoryTreeAccessors.create(files, '/prefix');
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/prefix/test.json')).toSucceedWith('{"key": "value"}');
      });
    });

    test('normalizes file paths', () => {
      const files: IInMemoryFile[] = [
        { path: 'test.json', contents: '{"key": "value"}' }, // No leading slash
        { path: '//double//slash.json', contents: '{"key2": "value2"}' } // Multiple slashes
      ];

      const result = InMemoryTreeAccessors.create(files);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/test.json')).toSucceedWith('{"key": "value"}');
        expect(accessors.getFileContents('/double/slash.json')).toSucceedWith('{"key2": "value2"}');
      });
    });

    test('fails with duplicate file paths', () => {
      const files: IInMemoryFile[] = [
        { path: '/test.json', contents: '{"first": 1}' },
        { path: '/test.json', contents: '{"second": 2}' }
      ];

      const result = InMemoryTreeAccessors.create(files);
      expect(result).toFailWith(/already exists/i);
    });
  });

  describe('getFileContents method', () => {
    let accessors: InMemoryTreeAccessors;

    beforeEach(() => {
      const files: IInMemoryFile[] = [
        { path: '/file1.json', contents: '{"a": 1}' },
        { path: '/dir/file2.json', contents: '{"b": 2}' },
        { path: '/dir/subdir/file3.txt', contents: 'plain text content' }
      ];
      accessors = InMemoryTreeAccessors.create(files).orThrow();
    });

    test('retrieves existing file contents', () => {
      expect(accessors.getFileContents('/file1.json')).toSucceedWith('{"a": 1}');
      expect(accessors.getFileContents('/dir/file2.json')).toSucceedWith('{"b": 2}');
      expect(accessors.getFileContents('/dir/subdir/file3.txt')).toSucceedWith('plain text content');
    });

    test('fails for non-existent files', () => {
      expect(accessors.getFileContents('/missing.json')).toFailWith(/not found/i);
      expect(accessors.getFileContents('/dir/missing.json')).toFailWith(/not found/i);
    });

    test('fails for directories', () => {
      expect(accessors.getFileContents('/dir')).toFailWith(/not a file/i);
      expect(accessors.getFileContents('/dir/subdir')).toFailWith(/not a file/i);
    });

    test('handles root path', () => {
      expect(accessors.getFileContents('/')).toFailWith(/not a file/i);
    });
  });

  describe('getChildren method', () => {
    let accessors: InMemoryTreeAccessors;

    beforeEach(() => {
      const files: IInMemoryFile[] = [
        { path: '/file1.json', contents: '{"a": 1}' },
        { path: '/file2.txt', contents: 'text' },
        { path: '/dir1/file3.json', contents: '{"b": 2}' },
        { path: '/dir1/file4.txt', contents: 'more text' },
        { path: '/dir1/subdir/file5.json', contents: '{"c": 3}' },
        { path: '/dir2/file6.json', contents: '{"d": 4}' }
      ];
      accessors = InMemoryTreeAccessors.create(files).orThrow();
    });

    test('gets children of root directory', () => {
      const result = accessors.getChildren('/');
      expect(result).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(4); // file1.json, file2.txt, dir1, dir2

        const names = children.map((child) => child.name).sort();
        expect(names).toEqual(['dir1', 'dir2', 'file1.json', 'file2.txt']);

        const files = children.filter((child) => child.type === 'file');
        const dirs = children.filter((child) => child.type === 'directory');
        expect(files).toHaveLength(2);
        expect(dirs).toHaveLength(2);
      });
    });

    test('gets children of subdirectory', () => {
      const result = accessors.getChildren('/dir1');
      expect(result).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(3); // file3.json, file4.txt, subdir

        const names = children.map((child) => child.name).sort();
        expect(names).toEqual(['file3.json', 'file4.txt', 'subdir']);
      });
    });

    test('gets children of nested subdirectory', () => {
      const result = accessors.getChildren('/dir1/subdir');
      expect(result).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(1); // file5.json
        expect(children[0].name).toBe('file5.json');
        expect(children[0].type).toBe('file');
      });
    });

    test('gets children of empty directory', () => {
      // Create an empty directory by having a file in a subdirectory
      const files: IInMemoryFile[] = [{ path: '/emptydir/subdir/file.json', contents: '{}' }];
      const emptyAccessors = InMemoryTreeAccessors.create(files).orThrow();

      const result = emptyAccessors.getChildren('/emptydir');
      expect(result).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(1); // Only subdir
        expect(children[0].name).toBe('subdir');
        expect(children[0].type).toBe('directory');
      });
    });

    test('fails for non-existent directories', () => {
      expect(accessors.getChildren('/missing')).toFailWith(/not found/i);
      expect(accessors.getChildren('/dir1/missing')).toFailWith(/not found/i);
    });

    test('fails for files', () => {
      expect(accessors.getChildren('/file1.json')).toFailWith(/not a directory/i);
      expect(accessors.getChildren('/dir1/file3.json')).toFailWith(/not a directory/i);
    });
  });

  describe('getItem method', () => {
    let accessors: InMemoryTreeAccessors;

    beforeEach(() => {
      const files: IInMemoryFile[] = [
        { path: '/file1.json', contents: '{"a": 1}' },
        { path: '/dir/file2.json', contents: '{"b": 2}' }
      ];
      accessors = InMemoryTreeAccessors.create(files).orThrow();
    });

    test('gets file items', () => {
      expect(accessors.getItem('/file1.json')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('file');
        expect(item.name).toBe('file1.json');
        expect(item.absolutePath).toBe('/file1.json');
      });
    });

    test('gets directory items', () => {
      expect(accessors.getItem('/dir')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
        expect(item.name).toBe('dir');
        expect(item.absolutePath).toBe('/dir');
      });
    });

    test('gets root directory', () => {
      expect(accessors.getItem('/')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
        expect(item.name).toBe('');
        expect(item.absolutePath).toBe('/');
      });
    });

    test('fails for non-existent items', () => {
      expect(accessors.getItem('/missing')).toFailWith(/not found/i);
      expect(accessors.getItem('/dir/missing')).toFailWith(/not found/i);
    });
  });

  describe('path helper methods', () => {
    let accessors: InMemoryTreeAccessors;

    beforeEach(() => {
      const files: IInMemoryFile[] = [{ path: '/test.json', contents: '{}' }];
      accessors = InMemoryTreeAccessors.create(files).orThrow();
    });

    test('getBaseName extracts base name', () => {
      expect(accessors.getBaseName('/path/to/file.json')).toBe('file.json');
      expect(accessors.getBaseName('/file.txt')).toBe('file.txt');
      expect(accessors.getBaseName('/path/to/file')).toBe('file');
      expect(accessors.getBaseName('/')).toBe('');
    });

    test('getBaseName with suffix extracts base name without suffix', () => {
      expect(accessors.getBaseName('/path/to/file.json', '.json')).toBe('file');
      expect(accessors.getBaseName('/file.txt', '.txt')).toBe('file');
      expect(accessors.getBaseName('/path/to/file.json', '.txt')).toBe('file.json');
    });

    test('getExtension extracts file extension', () => {
      expect(accessors.getExtension('/path/to/file.json')).toBe('.json');
      expect(accessors.getExtension('/file.txt')).toBe('.txt');
      expect(accessors.getExtension('/path/to/file')).toBe('');
      expect(accessors.getExtension('/')).toBe('');
    });

    test('resolveAbsolutePath resolves paths', () => {
      expect(accessors.resolveAbsolutePath('path/to/file')).toBe('/path/to/file');
      expect(accessors.resolveAbsolutePath('/path/to/file')).toBe('/path/to/file');
      expect(accessors.resolveAbsolutePath('file1', 'file2')).toBe('/file1/file2');
    });

    test('joinPaths joins paths', () => {
      expect(accessors.joinPaths('path', 'to', 'file')).toBe('path/to/file');
      expect(accessors.joinPaths('/root', 'sub')).toBe('/root/sub');
    });
  });

  describe('edge cases and error handling', () => {
    test('handles files with empty contents', () => {
      const files: IInMemoryFile[] = [{ path: '/empty.json', contents: '' }];

      const result = InMemoryTreeAccessors.create(files);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/empty.json')).toSucceedWith('');
      });
    });

    test('handles very deep directory structures', () => {
      const files: IInMemoryFile[] = [{ path: '/a/b/c/d/e/f/g/deep.json', contents: '{"deep": true}' }];

      const result = InMemoryTreeAccessors.create(files);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/a/b/c/d/e/f/g/deep.json')).toSucceedWith('{"deep": true}');
        expect(accessors.getItem('/a')).toSucceed();
        expect(accessors.getItem('/a/b/c')).toSucceed();
        expect(accessors.getItem('/a/b/c/d/e/f/g')).toSucceed();
      });
    });

    test('handles special characters in paths', () => {
      const files: IInMemoryFile[] = [
        { path: '/special chars & symbols.json', contents: '{}' },
        { path: '/unicode-测试.json', contents: '{}' }
      ];

      const result = InMemoryTreeAccessors.create(files);
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/special chars & symbols.json')).toSucceedWith('{}');
        expect(accessors.getFileContents('/unicode-测试.json')).toSucceedWith('{}');
      });
    });

    test('handles prefix with trailing slashes', () => {
      const files: IInMemoryFile[] = [{ path: '/test.json', contents: '{}' }];

      const result = InMemoryTreeAccessors.create(files, '/prefix/');
      expect(result).toSucceedAndSatisfy((accessors) => {
        expect(accessors.getFileContents('/prefix/test.json')).toSucceedWith('{}');
      });
    });
  });
});
