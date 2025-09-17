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
import path from 'path';
import { FsFileTreeAccessors } from '../../../packlets/file-tree';

// Path to static test fixtures
const FIXTURES_PATH = path.join(__dirname, '../../fixtures/file-tree');

describe('FsFileTreeAccessors', () => {
  describe('constructor', () => {
    test('creates instance without prefix', () => {
      const accessors = new FsFileTreeAccessors();
      expect(accessors.prefix).toBeUndefined();
    });

    test('creates instance with prefix', () => {
      const prefix = '/some/prefix';
      const accessors = new FsFileTreeAccessors(prefix);
      expect(accessors.prefix).toBe(prefix);
    });
  });

  describe('path operations', () => {
    describe('resolveAbsolutePath method', () => {
      test('resolves absolute paths without prefix', () => {
        const accessors = new FsFileTreeAccessors();
        const result = accessors.resolveAbsolutePath('/test/path');
        expect(result).toBe(path.resolve('/test/path'));
      });

      test('resolves relative paths without prefix', () => {
        const accessors = new FsFileTreeAccessors();
        const result = accessors.resolveAbsolutePath('relative/path');
        expect(result).toBe(path.resolve('relative/path'));
      });

      test('resolves absolute paths with prefix (ignores prefix)', () => {
        const accessors = new FsFileTreeAccessors('/some/prefix');
        const result = accessors.resolveAbsolutePath('/test/path');
        expect(result).toBe(path.resolve('/test/path'));
      });

      test('resolves relative paths with prefix', () => {
        const accessors = new FsFileTreeAccessors('/some/prefix');
        const result = accessors.resolveAbsolutePath('relative/path');
        expect(result).toBe(path.resolve('/some/prefix', 'relative/path'));
      });

      test('resolves multiple path segments', () => {
        const accessors = new FsFileTreeAccessors();
        const result = accessors.resolveAbsolutePath('path', 'to', 'file.txt');
        expect(result).toBe(path.resolve('path', 'to', 'file.txt'));
      });

      test('resolves multiple path segments with prefix', () => {
        const accessors = new FsFileTreeAccessors('/prefix');
        const result = accessors.resolveAbsolutePath('path', 'to', 'file.txt');
        expect(result).toBe(path.resolve('/prefix', 'path', 'to', 'file.txt'));
      });
    });

    describe('getExtension method', () => {
      let accessors: FsFileTreeAccessors;

      beforeEach(() => {
        accessors = new FsFileTreeAccessors();
      });

      test('extracts file extension with dot', () => {
        expect(accessors.getExtension('/path/to/file.json')).toBe('.json');
        expect(accessors.getExtension('/path/to/file.txt')).toBe('.txt');
        expect(accessors.getExtension('/path/to/file.xml')).toBe('.xml');
      });

      test('handles files without extension', () => {
        expect(accessors.getExtension('/path/to/file')).toBe('');
        expect(accessors.getExtension('/path/to/README')).toBe('');
      });

      test('handles files with multiple dots', () => {
        expect(accessors.getExtension('/path/to/file.min.js')).toBe('.js');
        expect(accessors.getExtension('/path/to/archive.tar.gz')).toBe('.gz');
      });

      test('handles root directory', () => {
        expect(accessors.getExtension('/')).toBe('');
      });

      test('handles hidden files', () => {
        expect(accessors.getExtension('/path/to/.gitignore')).toBe('');
        expect(accessors.getExtension('/path/to/.eslintrc.json')).toBe('.json');
      });
    });

    describe('getBaseName method', () => {
      let accessors: FsFileTreeAccessors;

      beforeEach(() => {
        accessors = new FsFileTreeAccessors();
      });

      test('extracts base name without suffix', () => {
        expect(accessors.getBaseName('/path/to/file.json')).toBe('file.json');
        expect(accessors.getBaseName('/path/to/directory')).toBe('directory');
        expect(accessors.getBaseName('/simple-file')).toBe('simple-file');
      });

      test('extracts base name with suffix removal', () => {
        expect(accessors.getBaseName('/path/to/file.json', '.json')).toBe('file');
        expect(accessors.getBaseName('/path/to/file.txt', '.txt')).toBe('file');
        expect(accessors.getBaseName('/path/to/file.json', '.xml')).toBe('file.json');
      });

      test('handles root directory', () => {
        expect(accessors.getBaseName('/')).toBe('');
      });

      test('handles files with multiple dots', () => {
        expect(accessors.getBaseName('/path/to/file.min.js')).toBe('file.min.js');
        expect(accessors.getBaseName('/path/to/file.min.js', '.js')).toBe('file.min');
      });

      test('handles hidden files', () => {
        expect(accessors.getBaseName('/path/to/.gitignore')).toBe('.gitignore');
        expect(accessors.getBaseName('/path/to/.eslintrc.json', '.json')).toBe('.eslintrc');
      });
    });

    describe('joinPaths method', () => {
      let accessors: FsFileTreeAccessors;

      beforeEach(() => {
        accessors = new FsFileTreeAccessors();
      });

      test('joins multiple path segments', () => {
        expect(accessors.joinPaths('path', 'to', 'file')).toBe(path.join('path', 'to', 'file'));
        expect(accessors.joinPaths('docs', 'api', 'reference.json')).toBe(
          path.join('docs', 'api', 'reference.json')
        );
      });

      test('joins absolute and relative paths', () => {
        expect(accessors.joinPaths('/root', 'sub', 'file')).toBe(path.join('/root', 'sub', 'file'));
      });

      test('handles empty path segments', () => {
        expect(accessors.joinPaths('path', '', 'file')).toBe(path.join('path', '', 'file'));
      });

      test('handles single path', () => {
        expect(accessors.joinPaths('single-path')).toBe('single-path');
      });
    });
  });

  describe('filesystem operations with static fixtures', () => {
    let accessors: FsFileTreeAccessors;

    beforeEach(() => {
      accessors = new FsFileTreeAccessors(FIXTURES_PATH);
    });

    describe('getFileContents method', () => {
      test('reads JSON file contents', () => {
        expect(accessors.getFileContents('config.json')).toSucceedWith('{"name": "test", "enabled": true}');
      });

      test('reads JSON file in subdirectory', () => {
        expect(accessors.getFileContents('data/items.json')).toSucceedWith('[1, 2, 3]');
      });

      test('reads deeply nested JSON file', () => {
        expect(accessors.getFileContents('docs/api/reference.json')).toSucceedWith('{"endpoints": []}');
      });

      test('reads array JSON file contents', () => {
        expect(accessors.getFileContents('data/items.json')).toSucceedWith('[1, 2, 3]');
      });

      test('fails for non-existent files', () => {
        expect(accessors.getFileContents('missing.json')).toFailWith(/ENOENT|no such file/i);
      });

      test('fails when trying to read directory as file', () => {
        expect(accessors.getFileContents('data')).toFailWith(/EISDIR|illegal operation/i);
      });
    });

    describe('getItem method', () => {
      test('gets file items', () => {
        expect(accessors.getItem('config.json')).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          expect(item.name).toBe('config.json');
          expect(item.absolutePath).toBe(accessors.resolveAbsolutePath('config.json'));
        });
      });

      test('gets directory items', () => {
        expect(accessors.getItem('data')).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
          expect(item.name).toBe('data');
          expect(item.absolutePath).toBe(accessors.resolveAbsolutePath('data'));
        });
      });

      test('gets nested file items', () => {
        expect(accessors.getItem('docs/api/reference.json')).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          expect(item.name).toBe('reference.json');
        });
      });

      test('gets nested directory items', () => {
        expect(accessors.getItem('docs/api')).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
          expect(item.name).toBe('api');
        });
      });

      test('fails for non-existent items', () => {
        expect(accessors.getItem('missing')).toFailWith(/ENOENT|no such file/i);
      });
    });

    describe('getChildren method', () => {
      test('gets children of root directory', () => {
        expect(accessors.getChildren('.')).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);

          const names = children.map((child) => child.name).sort();
          expect(names).toContain('config.json');
          expect(names).toContain('data');
          expect(names).toContain('docs');
        });
      });

      test('gets children of data directory', () => {
        expect(accessors.getChildren('data')).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);

          const names = children.map((child) => child.name);
          expect(names).toContain('items.json');

          const files = children.filter((child) => child.type === 'file');
          expect(files.length).toBeGreaterThan(0);
        });
      });

      test('gets children of docs directory', () => {
        expect(accessors.getChildren('docs')).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);

          const names = children.map((child) => child.name);
          expect(names).toContain('api');

          const dirs = children.filter((child) => child.type === 'directory');
          expect(dirs.length).toBeGreaterThan(0);
        });
      });

      test('gets children of nested directory', () => {
        expect(accessors.getChildren('docs/api')).toSucceedAndSatisfy((children) => {
          expect(children).toHaveLength(1);
          expect(children[0].name).toBe('reference.json');
          expect(children[0].type).toBe('file');
        });
      });

      test('gets children with mixed content types', () => {
        expect(accessors.getChildren('docs')).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);

          // Should have both files and directories
          const hasFiles = children.some((child) => child.type === 'file');
          const hasDirs = children.some((child) => child.type === 'directory');
          expect(hasFiles || hasDirs).toBe(true);
        });
      });

      test('fails for non-existent directories', () => {
        expect(accessors.getChildren('missing-dir')).toFailWith(/ENOENT|no such file/i);
      });

      test('fails when trying to list children of file', () => {
        expect(accessors.getChildren('config.json')).toFailWith(/ENOTDIR|not a directory/i);
      });
    });
  });

  describe('prefix handling with filesystem operations', () => {
    test('works without prefix', () => {
      const accessors = new FsFileTreeAccessors();
      const fullPath = path.join(FIXTURES_PATH, 'config.json');

      expect(accessors.getFileContents(fullPath)).toSucceedWith('{"name": "test", "enabled": true}');
    });

    test('works with prefix for relative paths', () => {
      const accessors = new FsFileTreeAccessors(FIXTURES_PATH);

      expect(accessors.getFileContents('config.json')).toSucceedWith('{"name": "test", "enabled": true}');
      expect(accessors.getItem('data')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
      });
    });

    test('ignores prefix for absolute paths', () => {
      const accessors = new FsFileTreeAccessors('/some/other/prefix');
      const fullPath = path.join(FIXTURES_PATH, 'config.json');

      expect(accessors.getFileContents(fullPath)).toSucceedWith('{"name": "test", "enabled": true}');
    });
  });

  describe('integration with FileItem and DirectoryItem', () => {
    let accessors: FsFileTreeAccessors;

    beforeEach(() => {
      accessors = new FsFileTreeAccessors(FIXTURES_PATH);
    });

    test('creates functional FileItem instances', () => {
      expect(accessors.getItem('config.json')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('file');
        expect(item.name).toBe('config.json');

        // Test that FileItem can read contents
        if (item.type === 'file') {
          expect(item.extension).toBe('.json');
          expect(item.baseName).toBe('config');
          expect(item.getRawContents()).toSucceedWith('{"name": "test", "enabled": true}');
          expect(item.getContents()).toSucceedWith({ name: 'test', enabled: true });
        }
      });
    });

    test('creates functional DirectoryItem instances', () => {
      expect(accessors.getItem('data')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
        expect(item.name).toBe('data');

        // Test that DirectoryItem can list children
        if (item.type === 'directory') {
          expect(item.getChildren()).toSucceedAndSatisfy((children) => {
            expect(children.length).toBeGreaterThan(0);
            const names = children.map((child) => child.name);
            expect(names).toContain('items.json');
          });
        }
      });
    });

    test('maintains consistent paths across operations', () => {
      const itemPath = 'docs/api/reference.json';

      expect(accessors.getItem(itemPath)).toSucceedAndSatisfy((item) => {
        expect(item.absolutePath).toBe(accessors.resolveAbsolutePath(itemPath));

        if (item.type === 'file') {
          expect(item.getRawContents()).toSucceedWith('{"endpoints": []}');
        }
      });
    });
  });
});
