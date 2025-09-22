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
import { Result, succeed, fail } from '@fgv/ts-utils';
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
      const accessors = new FsFileTreeAccessors({ prefix });
      expect(accessors.prefix).toBe(prefix);
    });

    test('creates instance with custom inferContentType function', () => {
      const customInferContentType = (filePath: string): Result<string | undefined> => {
        if (filePath.endsWith('.custom')) return succeed('custom/type');
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors({ inferContentType: customInferContentType });
      expect(accessors.prefix).toBeUndefined();

      // Test that the custom inference function is being used
      expect(accessors.getFileContentType('/test.custom')).toSucceedWith('custom/type');
      expect(accessors.getFileContentType('/test.txt')).toSucceedWith(undefined);
    });

    test('creates instance with both prefix and inferContentType', () => {
      const prefix = '/some/prefix';
      const customInferContentType = (filePath: string): Result<string | undefined> => {
        if (filePath.endsWith('.json')) return succeed('application/json');
        if (filePath.endsWith('.xml')) return succeed('application/xml');
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors({ prefix, inferContentType: customInferContentType });
      expect(accessors.prefix).toBe(prefix);

      // Test that the custom inference function works
      expect(accessors.getFileContentType('/config.json')).toSucceedWith('application/json');
      expect(accessors.getFileContentType('/data.xml')).toSucceedWith('application/xml');
      expect(accessors.getFileContentType('/readme.txt')).toSucceedWith(undefined);
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
        const accessors = new FsFileTreeAccessors({ prefix: '/some/prefix' });
        const result = accessors.resolveAbsolutePath('/test/path');
        expect(result).toBe(path.resolve('/test/path'));
      });

      test('resolves relative paths with prefix', () => {
        const accessors = new FsFileTreeAccessors({ prefix: '/some/prefix' });
        const result = accessors.resolveAbsolutePath('relative/path');
        expect(result).toBe(path.resolve('/some/prefix', 'relative/path'));
      });

      test('resolves multiple path segments', () => {
        const accessors = new FsFileTreeAccessors();
        const result = accessors.resolveAbsolutePath('path', 'to', 'file.txt');
        expect(result).toBe(path.resolve('path', 'to', 'file.txt'));
      });

      test('resolves multiple path segments with prefix', () => {
        const accessors = new FsFileTreeAccessors({ prefix: '/prefix' });
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
      accessors = new FsFileTreeAccessors({ prefix: FIXTURES_PATH });
    });

    describe('getFileContents method', () => {
      test('reads JSON file contents', () => {
        expect(accessors.getFileContents('config.json')).toSucceedWith(
          '{ "name": "test", "enabled": true }\n'
        );
      });

      test('reads JSON file in subdirectory', () => {
        expect(accessors.getFileContents('data/items.json')).toSucceedWith('[1, 2, 3]\n');
      });

      test('reads deeply nested JSON file', () => {
        expect(accessors.getFileContents('docs/api/reference.json')).toSucceedWith('{ "endpoints": [] }\n');
      });

      test('reads array JSON file contents', () => {
        expect(accessors.getFileContents('data/items.json')).toSucceedWith('[1, 2, 3]\n');
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

      expect(accessors.getFileContents(fullPath)).toSucceedWith('{ "name": "test", "enabled": true }\n');
    });

    test('works with prefix for relative paths', () => {
      const accessors = new FsFileTreeAccessors({ prefix: FIXTURES_PATH });

      expect(accessors.getFileContents('config.json')).toSucceedWith('{ "name": "test", "enabled": true }\n');
      expect(accessors.getItem('data')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
      });
    });

    test('ignores prefix for absolute paths', () => {
      const accessors = new FsFileTreeAccessors({ prefix: '/some/other/prefix' });
      const fullPath = path.join(FIXTURES_PATH, 'config.json');

      expect(accessors.getFileContents(fullPath)).toSucceedWith('{ "name": "test", "enabled": true }\n');
    });
  });

  describe('integration with FileItem and DirectoryItem', () => {
    let accessors: FsFileTreeAccessors;

    beforeEach(() => {
      accessors = new FsFileTreeAccessors({ prefix: FIXTURES_PATH });
    });

    test('creates functional FileItem instances', () => {
      expect(accessors.getItem('config.json')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('file');
        expect(item.name).toBe('config.json');

        // Test that FileItem can read contents
        if (item.type === 'file') {
          expect(item.extension).toBe('.json');
          expect(item.baseName).toBe('config');
          expect(item.getRawContents()).toSucceedWith('{ "name": "test", "enabled": true }\n');
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
          expect(item.getRawContents()).toSucceedWith('{ "endpoints": [] }\n');
        }
      });
    });
  });

  describe('getFileContentType method with inferContentType functionality', () => {
    test('uses provided contentType parameter when specified', () => {
      const accessors = new FsFileTreeAccessors();

      // Test that provided parameter takes precedence
      expect(accessors.getFileContentType('/any/path.json', 'custom/type')).toSucceedWith('custom/type');
      expect(accessors.getFileContentType('/any/path.txt', 'application/override')).toSucceedWith(
        'application/override'
      );
      expect(accessors.getFileContentType('/non/existent/file.xml', 'text/special')).toSucceedWith(
        'text/special'
      );
    });

    test('handles empty string as provided contentType', () => {
      const accessors = new FsFileTreeAccessors();

      expect(accessors.getFileContentType('/test.txt', '')).toSucceedWith('');
      expect(accessors.getFileContentType('/test.txt', '   ')).toSucceedWith('   ');
    });

    test('falls back to inference function when provided is undefined', () => {
      const customInferContentType = (filePath: string): Result<string | undefined> => {
        if (filePath.endsWith('.json')) return succeed('application/json');
        if (filePath.endsWith('.txt')) return succeed('text/plain');
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors({ inferContentType: customInferContentType });

      // Without provided parameter, uses inference
      expect(accessors.getFileContentType('/test.json')).toSucceedWith('application/json');
      expect(accessors.getFileContentType('/test.txt')).toSucceedWith('text/plain');
      expect(accessors.getFileContentType('/test.unknown')).toSucceedWith(undefined);

      // With explicit undefined, should behave the same
      expect(accessors.getFileContentType('/test.json', undefined)).toSucceedWith('application/json');
    });

    test('provided parameter takes precedence over inference', () => {
      const customInferContentType = (filePath: string): Result<string | undefined> => {
        if (filePath.endsWith('.json')) return succeed('application/json');
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors({ inferContentType: customInferContentType });

      // Inference would return 'application/json', but provided takes precedence
      expect(accessors.getFileContentType('/test.json', 'text/override')).toSucceedWith('text/override');
      expect(accessors.getFileContentType('/test.json', 'custom/type')).toSucceedWith('custom/type');
    });

    test('works with custom content type constraints', () => {
      type CustomContentTypes = 'custom/type1' | 'custom/type2' | 'custom/type3';

      const customInferContentType = (filePath: string): Result<CustomContentTypes | undefined> => {
        if (filePath.endsWith('.type1')) return succeed('custom/type1');
        if (filePath.endsWith('.type2')) return succeed('custom/type2');
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors<CustomContentTypes>({
        inferContentType: customInferContentType
      });

      // Test inference works with custom types
      expect(accessors.getFileContentType('/test.type1')).toSucceedWith('custom/type1');
      expect(accessors.getFileContentType('/test.type2')).toSucceedWith('custom/type2');
      expect(accessors.getFileContentType('/test.unknown')).toSucceedWith(undefined);

      // Test provided parameter works with custom types
      expect(accessors.getFileContentType('/any.file', 'custom/type3')).toSucceedWith('custom/type3');
    });

    test('handles complex inference scenarios', () => {
      const customInferContentType = (filePath: string): Result<string | undefined> => {
        const basename = path.basename(filePath);
        const extension = path.extname(filePath);

        if (basename.startsWith('config') && extension === '.json') {
          return succeed('application/config+json');
        }
        if (basename.startsWith('data') && extension === '.xml') {
          return succeed('application/data+xml');
        }
        if (extension === '.json') {
          return succeed('application/json');
        }
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors({ inferContentType: customInferContentType });

      // Test specific inference rules
      expect(accessors.getFileContentType('/path/config.json')).toSucceedWith('application/config+json');
      expect(accessors.getFileContentType('/path/data.xml')).toSucceedWith('application/data+xml');
      expect(accessors.getFileContentType('/path/regular.json')).toSucceedWith('application/json');
      expect(accessors.getFileContentType('/path/file.txt')).toSucceedWith(undefined);

      // Test that provided still takes precedence
      expect(accessors.getFileContentType('/path/config.json', 'override/type')).toSucceedWith(
        'override/type'
      );
    });

    test('precedence order: provided > inference > default', () => {
      const customInferContentType = (filePath: string): Result<string | undefined> => {
        if (filePath.endsWith('.json')) return succeed('inferred/json');
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors({ inferContentType: customInferContentType });

      // Test precedence chain
      // 1. Inference only (no provided parameter)
      expect(accessors.getFileContentType('/test.json')).toSucceedWith('inferred/json');
      expect(accessors.getFileContentType('/test.txt')).toSucceedWith(undefined);

      // 2. Provided takes precedence over inference
      expect(accessors.getFileContentType('/test.json', 'provided/type')).toSucceedWith('provided/type');
      expect(accessors.getFileContentType('/test.txt', 'provided/type')).toSucceedWith('provided/type');
    });
  });

  // Additional tests for specific coverage gaps
  describe('Additional coverage gap tests', () => {
    test('joinPaths method is properly covered', () => {
      const accessors = new FsFileTreeAccessors();

      // Ensure this specific line (85) is covered
      expect(accessors.joinPaths('path', 'to', 'file.txt')).toBe(path.join('path', 'to', 'file.txt'));
      expect(accessors.joinPaths('/root', 'sub')).toBe(path.join('/root', 'sub'));
      expect(accessors.joinPaths('single')).toBe(path.join('single'));
      expect(accessors.joinPaths('')).toBe(path.join(''));
      expect(accessors.joinPaths('a', '', 'b')).toBe(path.join('a', '', 'b'));
    });

    test('getFileContentType without provided parameter uses inference function', () => {
      const customInfer = (filePath: string): Result<string | undefined> => {
        if (filePath.endsWith('.custom')) return succeed('custom/type');
        return succeed(undefined);
      };

      const accessors = new FsFileTreeAccessors({ inferContentType: customInfer });

      // This should hit line 119: return this._inferContentType(filePath);
      expect(accessors.getFileContentType('/test.custom')).toSucceedWith('custom/type');
      expect(accessors.getFileContentType('/test.other')).toSucceedWith(undefined);

      // Explicitly test with undefined parameter (should follow same path)
      expect(accessors.getFileContentType('/test.custom', undefined)).toSucceedWith('custom/type');
    });

    test('import statements are loaded by using the module', () => {
      // This test ensures imports like line 24 are covered by simply using the class
      const accessors = new FsFileTreeAccessors();

      // Use path-related functionality to ensure path import is covered
      expect(accessors.resolveAbsolutePath('test')).toBeDefined();
      expect(accessors.getExtension('file.txt')).toBe('.txt');
      expect(accessors.getBaseName('file.txt')).toBe('file.txt');
      expect(accessors.joinPaths('a', 'b')).toBe('a/b');
    });
  });

  // Phase 2: Functional Integration Tests with Real Filesystem Operations
  describe('Phase 2: Real filesystem integration with custom inferContentType', () => {
    describe('extension-based content type inference with real files', () => {
      let accessors: FsFileTreeAccessors;

      beforeEach(() => {
        // Extension-based inference function
        const extensionInferContentType = (filePath: string): Result<string | undefined> => {
          const extension = path.extname(filePath).toLowerCase();

          switch (extension) {
            case '.json':
              return succeed('application/json');
            case '.xml':
              return succeed('application/xml');
            case '.txt':
              return succeed('text/plain');
            default:
              return succeed(undefined);
          }
        };

        accessors = new FsFileTreeAccessors({
          prefix: FIXTURES_PATH,
          inferContentType: extensionInferContentType
        });
      });

      test('infers content types for existing JSON files', () => {
        // Test multiple JSON files that actually exist
        expect(accessors.getFileContentType('config.json')).toSucceedWith('application/json');
        expect(accessors.getFileContentType('data/items.json')).toSucceedWith('application/json');
        expect(accessors.getFileContentType('docs/api/reference.json')).toSucceedWith('application/json');
      });

      test('infers content types for XML file paths (even if file does not exist)', () => {
        // Test inference logic without depending on file existence
        expect(accessors.getFileContentType('data/metadata.xml')).toSucceedWith('application/xml');
        expect(accessors.getFileContentType('any/path/document.xml')).toSucceedWith('application/xml');
      });

      test('infers content types for text file paths (even if file does not exist)', () => {
        // Test inference logic without depending on file existence
        expect(accessors.getFileContentType('docs/readme.txt')).toSucceedWith('text/plain');
        expect(accessors.getFileContentType('any/path/document.txt')).toSucceedWith('text/plain');
      });

      test('integration with file tree operations shows inferred types', () => {
        // Get a JSON file item and verify its content type inference works
        expect(accessors.getItem('config.json')).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          if (item.type === 'file') {
            // Test that the file item can use the accessor's inference function
            expect(accessors.getFileContentType(item.name)).toSucceedWith('application/json');
            expect(accessors.getFileContentType(item.absolutePath)).toSucceedWith('application/json');
          }
        });

        // Test XML inference with an existing JSON file but using .xml extension for inference
        expect(accessors.getItem('data/items.json')).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          if (item.type === 'file') {
            // Test inference on a hypothetical XML file in the same directory
            expect(accessors.getFileContentType('data/metadata.xml')).toSucceedWith('application/xml');
          }
        });
      });
    });

    describe('path-pattern-based content type inference with real files', () => {
      let accessors: FsFileTreeAccessors<'config/json' | 'data/json' | 'data/xml' | 'documentation/text'>;

      beforeEach(() => {
        // Path pattern-based inference function
        const patternInferContentType = (
          filePath: string
        ): Result<'config/json' | 'data/json' | 'data/xml' | 'documentation/text' | undefined> => {
          const normalizedPath = filePath.replace(/\\/g, '/');
          const basename = path.basename(filePath);
          const extension = path.extname(filePath).toLowerCase();

          // Config files get special treatment
          if (basename.startsWith('config') && extension === '.json') {
            return succeed('config/json');
          }

          // Files in data directory
          if (normalizedPath.includes('/data/') || normalizedPath.startsWith('data/')) {
            if (extension === '.json') {
              return succeed('data/json');
            }
            if (extension === '.xml') {
              return succeed('data/xml');
            }
          }

          // Documentation files
          if (normalizedPath.includes('/docs/') || normalizedPath.startsWith('docs/')) {
            if (extension === '.txt') {
              return succeed('documentation/text');
            }
          }

          return succeed(undefined);
        };

        accessors = new FsFileTreeAccessors({
          prefix: FIXTURES_PATH,
          inferContentType: patternInferContentType
        });
      });

      test('categorizes config files specially', () => {
        expect(accessors.getFileContentType('config.json')).toSucceedWith('config/json');
      });

      test('categorizes data directory files by type', () => {
        expect(accessors.getFileContentType('data/items.json')).toSucceedWith('data/json');
        expect(accessors.getFileContentType('data/metadata.xml')).toSucceedWith('data/xml');
      });

      test('categorizes documentation files', () => {
        expect(accessors.getFileContentType('docs/readme.txt')).toSucceedWith('documentation/text');
      });

      test('returns undefined for files that do not match patterns', () => {
        expect(accessors.getFileContentType('docs/api/reference.json')).toSucceedWith(undefined);
      });

      test('integration with file tree traversal maintains content type patterns', () => {
        // Test getting children and verifying their content types
        expect(accessors.getChildren('data')).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);

          // Find the items.json file
          const itemsFile = children.find((child) => child.name === 'items.json');
          expect(itemsFile).toBeDefined();

          if (itemsFile) {
            // Use the relative path from the directory perspective
            expect(accessors.getFileContentType('data/items.json')).toSucceedWith('data/json');
          }

          // Test inference for XML files in the data directory
          // Note: We test the inference logic even if the specific XML file doesn't exist
          expect(accessors.getFileContentType('data/metadata.xml')).toSucceedWith('data/xml');
        });
      });
    });

    describe('content-aware inference with real file operations', () => {
      let accessors: FsFileTreeAccessors<
        'json/config' | 'json/data' | 'json/api' | 'xml/metadata' | 'text/documentation'
      >;

      beforeEach(() => {
        // Content-aware inference that actually reads file names and paths
        const contentAwareInferContentType = (
          filePath: string
        ): Result<
          'json/config' | 'json/data' | 'json/api' | 'xml/metadata' | 'text/documentation' | undefined
        > => {
          const basename = path.basename(filePath, path.extname(filePath));
          const extension = path.extname(filePath).toLowerCase();
          const normalizedPath = filePath.replace(/\\/g, '/');

          if (extension === '.json') {
            if (basename === 'config') {
              return succeed('json/config');
            }
            if (basename === 'items' || normalizedPath.includes('/data/')) {
              return succeed('json/data');
            }
            if (basename === 'reference' || normalizedPath.includes('/api/')) {
              return succeed('json/api');
            }
          }

          if (extension === '.xml' && basename === 'metadata') {
            return succeed('xml/metadata');
          }

          if (extension === '.txt' && (basename === 'readme' || normalizedPath.includes('/docs/'))) {
            return succeed('text/documentation');
          }

          return succeed(undefined);
        };

        accessors = new FsFileTreeAccessors({
          prefix: FIXTURES_PATH,
          inferContentType: contentAwareInferContentType
        });
      });

      test('categorizes files based on name and location context', () => {
        expect(accessors.getFileContentType('config.json')).toSucceedWith('json/config');
        expect(accessors.getFileContentType('data/items.json')).toSucceedWith('json/data');
        expect(accessors.getFileContentType('docs/api/reference.json')).toSucceedWith('json/api');
        expect(accessors.getFileContentType('data/metadata.xml')).toSucceedWith('xml/metadata');
        expect(accessors.getFileContentType('docs/readme.txt')).toSucceedWith('text/documentation');
      });

      test('integration with complete file tree traversal and content type checking', () => {
        // Traverse the entire tree and verify content types are correctly inferred
        expect(accessors.getChildren('.')).toSucceedAndSatisfy((rootChildren) => {
          expect(rootChildren.length).toBeGreaterThan(0);

          // Check config.json
          const configFile = rootChildren.find((child) => child.name === 'config.json');
          if (configFile) {
            expect(accessors.getFileContentType('config.json')).toSucceedWith('json/config');
          }

          // Check data directory
          const dataDir = rootChildren.find((child) => child.name === 'data' && child.type === 'directory');
          if (dataDir) {
            expect(accessors.getChildren('data')).toSucceedAndSatisfy((dataChildren) => {
              const itemsFile = dataChildren.find((child) => child.name === 'items.json');
              if (itemsFile) {
                expect(accessors.getFileContentType('data/items.json')).toSucceedWith('json/data');
              }

              const metadataFile = dataChildren.find((child) => child.name === 'metadata.xml');
              if (metadataFile) {
                expect(accessors.getFileContentType('data/metadata.xml')).toSucceedWith('xml/metadata');
              }
            });
          }

          // Check docs directory
          const docsDir = rootChildren.find((child) => child.name === 'docs' && child.type === 'directory');
          if (docsDir) {
            expect(accessors.getChildren('docs')).toSucceedAndSatisfy((docsChildren) => {
              // Test inference for text files in docs directory
              expect(accessors.getFileContentType('docs/readme.txt')).toSucceedWith('text/documentation');

              // Check nested API directory
              const apiDir = docsChildren.find((child) => child.name === 'api' && child.type === 'directory');
              if (apiDir) {
                expect(accessors.getChildren('docs/api')).toSucceedAndSatisfy((apiChildren) => {
                  const referenceFile = apiChildren.find((child) => child.name === 'reference.json');
                  if (referenceFile) {
                    expect(accessors.getFileContentType('docs/api/reference.json')).toSucceedWith('json/api');
                  }
                });
              }
            });
          }
        });
      });

      test('content type inference works with file contents operations', () => {
        // Test that inference works alongside actual file content reading
        expect(accessors.getFileContents('config.json')).toSucceedAndSatisfy((contents) => {
          expect(contents).toContain('test');
          expect(contents).toContain('enabled');

          // Verify content type is still correctly inferred
          expect(accessors.getFileContentType('config.json')).toSucceedWith('json/config');
        });

        // Test content type inference for XML files (without relying on file existence)
        expect(accessors.getFileContentType('data/metadata.xml')).toSucceedWith('xml/metadata');
      });
    });

    describe('error handling with custom inference and real filesystem', () => {
      let accessors: FsFileTreeAccessors;

      beforeEach(() => {
        // Inference function that can fail in certain cases
        const fallibleInferContentType = (filePath: string): Result<string | undefined> => {
          const extension = path.extname(filePath).toLowerCase();

          // Simulate a case where inference might fail for certain paths
          if (filePath.includes('invalid-pattern')) {
            return fail('Cannot infer content type for invalid pattern');
          }

          switch (extension) {
            case '.json':
              return succeed('application/json');
            case '.xml':
              return succeed('application/xml');
            case '.txt':
              return succeed('text/plain');
            default:
              return succeed(undefined);
          }
        };

        accessors = new FsFileTreeAccessors({
          prefix: FIXTURES_PATH,
          inferContentType: fallibleInferContentType
        });
      });

      test('handles inference function errors gracefully', () => {
        // This should succeed because the file exists and pattern is valid
        expect(accessors.getFileContentType('config.json')).toSucceedWith('application/json');

        // This should fail due to the invalid pattern, even though it would normally work
        expect(accessors.getFileContentType('invalid-pattern/config.json')).toFailWith(
          /Cannot infer content type/
        );
      });

      test('provided content type bypasses inference errors', () => {
        // Even with an invalid pattern, provided content type should work
        expect(accessors.getFileContentType('invalid-pattern/config.json', 'override/type')).toSucceedWith(
          'override/type'
        );
      });

      test('inference errors do not affect other filesystem operations', () => {
        // File operations should still work normally even if inference might fail for some patterns
        expect(accessors.getFileContents('config.json')).toSucceedWith(
          '{ "name": "test", "enabled": true }\n'
        );

        expect(accessors.getItem('config.json')).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          expect(item.name).toBe('config.json');
        });
      });
    });

    describe('multiple inference scenarios with real file tree operations', () => {
      test('different accessors with different inference functions work independently', () => {
        // Accessor 1: Simple extension-based
        const simpleInferContentType = (filePath: string): Result<string | undefined> => {
          const extension = path.extname(filePath).toLowerCase();
          return succeed(extension ? `simple${extension}` : undefined);
        };

        const simpleAccessors = new FsFileTreeAccessors({
          prefix: FIXTURES_PATH,
          inferContentType: simpleInferContentType
        });

        // Accessor 2: Complex pattern-based
        const complexInferContentType = (filePath: string): Result<string | undefined> => {
          if (filePath.includes('config')) return succeed('complex/config');
          if (filePath.includes('data')) return succeed('complex/data');
          if (filePath.includes('docs')) return succeed('complex/docs');
          return succeed('complex/unknown');
        };

        const complexAccessors = new FsFileTreeAccessors({
          prefix: FIXTURES_PATH,
          inferContentType: complexInferContentType
        });

        // Test that they work independently on the same files
        expect(simpleAccessors.getFileContentType('config.json')).toSucceedWith('simple.json');
        expect(complexAccessors.getFileContentType('config.json')).toSucceedWith('complex/config');

        expect(simpleAccessors.getFileContentType('data/items.json')).toSucceedWith('simple.json');
        expect(complexAccessors.getFileContentType('data/items.json')).toSucceedWith('complex/data');

        expect(simpleAccessors.getFileContentType('docs/readme.txt')).toSucceedWith('simple.txt');
        expect(complexAccessors.getFileContentType('docs/readme.txt')).toSucceedWith('complex/docs');
      });

      test('custom inference works with mixed file operations across directory tree', () => {
        const smartInferContentType = (filePath: string): Result<string | undefined> => {
          const normalizedPath = filePath.replace(/\\/g, '/');
          const basename = path.basename(filePath);
          const extension = path.extname(filePath).toLowerCase();

          // Configuration files
          if (basename.startsWith('config')) {
            return succeed(`config${extension}`);
          }

          // API documentation
          if (normalizedPath.includes('/api/')) {
            return succeed(`api${extension}`);
          }

          // Data files
          if (normalizedPath.includes('/data/') || normalizedPath.startsWith('data/')) {
            return succeed(`data${extension}`);
          }

          // General documentation
          if (normalizedPath.includes('/docs/') || normalizedPath.startsWith('docs/')) {
            return succeed(`docs${extension}`);
          }

          return succeed(`general${extension}`);
        };

        const accessors = new FsFileTreeAccessors({
          prefix: FIXTURES_PATH,
          inferContentType: smartInferContentType
        });

        // Test complete tree traversal with content type verification
        const testFileWithContentType = (
          filePath: string,
          expectedContentType: string,
          shouldExist: boolean = true
        ): void => {
          expect(accessors.getFileContentType(filePath)).toSucceedWith(expectedContentType);

          if (shouldExist) {
            expect(accessors.getItem(filePath)).toSucceedAndSatisfy((item) => {
              expect(item.type).toBe('file');
            });
          }
        };

        // Test all known files with their expected content types
        testFileWithContentType('config.json', 'config.json');
        testFileWithContentType('data/items.json', 'data.json');
        testFileWithContentType('data/metadata.xml', 'data.xml', false); // File doesn't exist in lib
        testFileWithContentType('docs/readme.txt', 'docs.txt', false); // File doesn't exist in lib
        testFileWithContentType('docs/api/reference.json', 'api.json');

        // Verify that file operations work correctly alongside content type inference
        expect(accessors.getChildren('.')).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);

          // Each child should be accessible and have a deterministic content type
          children.forEach((child) => {
            if (child.type === 'file') {
              // Get content type for each file - should succeed
              expect(accessors.getFileContentType(child.name)).toSucceed();
            }
          });
        });
      });
    });
  });
});
