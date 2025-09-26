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
import { inMemory, forFilesystem } from '../../../packlets/file-tree';

describe('FileTree helpers', () => {
  describe('inMemory function', () => {
    test('creates FileTree from empty array', () => {
      const result = inMemory([]);
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeDefined();
      });
    });

    test('creates FileTree from single file', () => {
      const files = [{ path: '/test.json', contents: '{"key": "value"}' }];

      const result = inMemory(files);
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree.getFile('/test.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('test.json');
          expect(file.absolutePath).toBe('/test.json');
        });
      });
    });

    test('creates FileTree from multiple files', () => {
      const files = [
        { path: '/file1.json', contents: '{"a": 1}' },
        { path: '/dir/file2.json', contents: '{"b": 2}' },
        { path: '/dir/subdir/file3.json', contents: '{"c": 3}' }
      ];

      const result = inMemory(files);
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree.getFile('/file1.json')).toSucceed();
        expect(tree.getFile('/dir/file2.json')).toSucceed();
        expect(tree.getFile('/dir/subdir/file3.json')).toSucceed();
        expect(tree.getDirectory('/dir')).toSucceed();
        expect(tree.getDirectory('/dir/subdir')).toSucceed();
      });
    });

    test('creates FileTree with prefix', () => {
      const files = [{ path: '/test.json', contents: '{"key": "value"}' }];

      const result = inMemory(files, '/prefix');
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree.getFile('/prefix/test.json')).toSucceedAndSatisfy((file) => {
          expect(file.absolutePath).toBe('/prefix/test.json');
        });
      });
    });

    test('fails with duplicate file paths', () => {
      const files = [
        { path: '/test.json', contents: '{"first": 1}' },
        { path: '/test.json', contents: '{"second": 2}' }
      ];

      const result = inMemory(files);
      expect(result).toFailWith(/already exists/i);
    });

    test('normalizes file paths', () => {
      const files = [
        { path: 'test.json', contents: '{"key": "value"}' }, // No leading slash
        { path: '//double//slash.json', contents: '{"key": "value"}' } // Multiple slashes
      ];

      const result = inMemory(files);
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree.getFile('/test.json')).toSucceed();
        expect(tree.getFile('/double/slash.json')).toSucceed();
      });
    });

    test('fails with empty prefix', () => {
      const files = [{ path: '/test.json', contents: '{"key": "value"}' }];

      const result = inMemory(files, '');
      expect(result).toFailWith(/not an absolute path/i);
    });
  });

  describe('forFilesystem function', () => {
    test('creates FileTree for filesystem without prefix', () => {
      const result = forFilesystem();
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeDefined();
        // Tree is created but files depend on actual filesystem
      });
    });

    test('creates FileTree for filesystem with prefix', () => {
      const result = forFilesystem('/some/prefix');
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeDefined();
      });
    });

    test('handles empty prefix string', () => {
      const result = forFilesystem('');
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeDefined();
      });
    });

    test('handles invalid prefix gracefully', () => {
      // Test with a prefix that might cause issues
      const result = forFilesystem('//invalid//prefix//');
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeDefined();
      });
    });
  });

  describe('integration tests', () => {
    test('both helper functions create compatible FileTree instances', () => {
      const files = [{ path: '/test.json', contents: '{"key": "value"}' }];

      const inMemoryResult = inMemory(files);
      const filesystemResult = forFilesystem();

      expect(inMemoryResult).toSucceed();
      expect(filesystemResult).toSucceed();

      if (inMemoryResult.isSuccess() && filesystemResult.isSuccess()) {
        // Both should be FileTree instances with the same interface
        expect(typeof inMemoryResult.value.getFile).toBe('function');
        expect(typeof inMemoryResult.value.getDirectory).toBe('function');
        expect(typeof inMemoryResult.value.getItem).toBe('function');

        expect(typeof filesystemResult.value.getFile).toBe('function');
        expect(typeof filesystemResult.value.getDirectory).toBe('function');
        expect(typeof filesystemResult.value.getItem).toBe('function');
      }
    });

    test('inMemory FileTree can access created files', () => {
      const files = [
        { path: '/config.json', contents: '{"name": "test", "enabled": true}' },
        { path: '/data/items.json', contents: '[1, 2, 3]' }
      ];

      const result = inMemory(files);
      expect(result).toSucceedAndSatisfy((tree) => {
        // Test file access
        expect(tree.getFile('/config.json')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('config.json');
          expect(file.extension).toBe('.json');
          expect(file.getContents()).toSucceedAndSatisfy((content: unknown) => {
            expect(content).toEqual({ name: 'test', enabled: true });
          });
        });

        // Test directory access
        expect(tree.getDirectory('/data')).toSucceedAndSatisfy((dir) => {
          expect(dir.name).toBe('data');
          expect(dir.getChildren()).toSucceedAndSatisfy(
            (children: readonly import('../../../packlets/file-tree').FileTreeItem[]) => {
              expect(children).toHaveLength(1);
              expect(children[0].name).toBe('items.json');
            }
          );
        });
      });
    });
  });
});
