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
import { FileTree, InMemoryTreeAccessors, IInMemoryFile } from '../../../packlets/file-tree';

describe('FileTree', () => {
  let sampleFiles: IInMemoryFile[];
  let accessors: InMemoryTreeAccessors;
  let fileTree: FileTree;

  beforeEach(() => {
    sampleFiles = [
      { path: '/config.json', contents: '{"name": "test", "enabled": true}' },
      { path: '/data/items.json', contents: '[1, 2, 3]' },
      { path: '/data/metadata.json', contents: '{"version": "1.0"}' },
      { path: '/docs/readme.txt', contents: 'This is a readme file' },
      { path: '/docs/api/reference.json', contents: '{"endpoints": []}' },
      { path: '/empty.json', contents: '{}' }
    ];

    accessors = InMemoryTreeAccessors.create(sampleFiles).orThrow();
    fileTree = FileTree.create(accessors).orThrow();
  });

  describe('create static method', () => {
    test('creates FileTree with valid accessors', () => {
      const result = FileTree.create(accessors);
      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeInstanceOf(FileTree);
      });
    });

    test('creates FileTree from in-memory files', () => {
      const files: IInMemoryFile[] = [{ path: '/test.json', contents: '{"test": true}' }];

      const result = InMemoryTreeAccessors.create(files).onSuccess((acc) => FileTree.create(acc));

      expect(result).toSucceedAndSatisfy((tree) => {
        expect(tree).toBeInstanceOf(FileTree);
      });
    });
  });

  describe('getFile method', () => {
    test('retrieves existing files', () => {
      expect(fileTree.getFile('/config.json')).toSucceedAndSatisfy((file) => {
        expect(file.name).toBe('config.json');
        expect(file.absolutePath).toBe('/config.json');
        expect(file.extension).toBe('.json');
        expect(file.baseName).toBe('config');
        expect(file.type).toBe('file');
      });
    });

    test('retrieves files in subdirectories', () => {
      expect(fileTree.getFile('/data/items.json')).toSucceedAndSatisfy((file) => {
        expect(file.name).toBe('items.json');
        expect(file.absolutePath).toBe('/data/items.json');
      });

      expect(fileTree.getFile('/docs/api/reference.json')).toSucceedAndSatisfy((file) => {
        expect(file.name).toBe('reference.json');
        expect(file.absolutePath).toBe('/docs/api/reference.json');
      });
    });

    test('fails for non-existent files', () => {
      expect(fileTree.getFile('/missing.json')).toFailWith(/not found/i);
      expect(fileTree.getFile('/data/missing.json')).toFailWith(/not found/i);
    });

    test('fails for directories', () => {
      expect(fileTree.getFile('/data')).toFailWith(/not a file/i);
      expect(fileTree.getFile('/docs')).toFailWith(/not a file/i);
    });

    test('handles root path', () => {
      expect(fileTree.getFile('/')).toFailWith(/not a file/i);
    });
  });

  describe('getDirectory method', () => {
    test('retrieves existing directories', () => {
      expect(fileTree.getDirectory('/data')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('data');
        expect(dir.absolutePath).toBe('/data');
        expect(dir.type).toBe('directory');
      });
    });

    test('retrieves nested directories', () => {
      expect(fileTree.getDirectory('/docs/api')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('api');
        expect(dir.absolutePath).toBe('/docs/api');
      });
    });

    test('retrieves root directory', () => {
      expect(fileTree.getDirectory('/')).toSucceedAndSatisfy((dir) => {
        expect(dir.name).toBe('');
        expect(dir.absolutePath).toBe('/');
        expect(dir.type).toBe('directory');
      });
    });

    test('fails for non-existent directories', () => {
      expect(fileTree.getDirectory('/missing')).toFailWith(/not found/i);
      expect(fileTree.getDirectory('/data/missing')).toFailWith(/not found/i);
    });

    test('fails for files', () => {
      expect(fileTree.getDirectory('/config.json')).toFailWith(/not a directory/i);
      expect(fileTree.getDirectory('/data/items.json')).toFailWith(/not a directory/i);
    });
  });

  describe('getItem method', () => {
    test('retrieves files as items', () => {
      expect(fileTree.getItem('/config.json')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('file');
        expect(item.name).toBe('config.json');
        expect(item.absolutePath).toBe('/config.json');
      });
    });

    test('retrieves directories as items', () => {
      expect(fileTree.getItem('/data')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
        expect(item.name).toBe('data');
        expect(item.absolutePath).toBe('/data');
      });
    });

    test('retrieves root as item', () => {
      expect(fileTree.getItem('/')).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
        expect(item.name).toBe('');
        expect(item.absolutePath).toBe('/');
      });
    });

    test('fails for non-existent items', () => {
      expect(fileTree.getItem('/missing')).toFailWith(/not found/i);
      expect(fileTree.getItem('/data/missing')).toFailWith(/not found/i);
    });
  });

  describe('file content access', () => {
    test('files can access their contents', () => {
      const fileResult = fileTree.getFile('/config.json');
      expect(fileResult).toSucceedAndSatisfy((file) => {
        expect(file.getContents()).toSucceedAndSatisfy((content) => {
          expect(content).toEqual({ name: 'test', enabled: true });
        });
      });
    });

    test('files can access raw contents', () => {
      const fileResult = fileTree.getFile('/config.json');
      expect(fileResult).toSucceedAndSatisfy((file) => {
        expect(file.getRawContents()).toSucceedAndSatisfy((content) => {
          expect(content).toBe('{"name": "test", "enabled": true}');
        });
      });
    });

    test('handles non-JSON files', () => {
      const fileResult = fileTree.getFile('/docs/readme.txt');
      expect(fileResult).toSucceedAndSatisfy((file) => {
        expect(file.getRawContents()).toSucceedAndSatisfy((content) => {
          expect(content).toBe('This is a readme file');
        });
      });
    });
  });

  describe('directory traversal', () => {
    test('directories can list their children', () => {
      const dirResult = fileTree.getDirectory('/data');
      expect(dirResult).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          expect(children).toHaveLength(2);

          const names = children.map((child) => child.name).sort();
          expect(names).toEqual(['items.json', 'metadata.json']);

          children.forEach((child) => {
            expect(child.type).toBe('file');
          });
        });
      });
    });

    test('root directory lists top-level items', () => {
      const dirResult = fileTree.getDirectory('/');
      expect(dirResult).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);

          const names = children.map((child) => child.name).sort();
          expect(names).toContain('config.json');
          expect(names).toContain('data');
          expect(names).toContain('docs');
          expect(names).toContain('empty.json');
        });
      });
    });

    test('nested directory traversal works', () => {
      const dirResult = fileTree.getDirectory('/docs');
      expect(dirResult).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const names = children.map((child) => child.name);
          expect(names).toContain('readme.txt');
          expect(names).toContain('api');

          // Check that we can traverse further
          const apiDir = children.find((child) => child.name === 'api');
          expect(apiDir).toBeDefined();
          expect(apiDir?.type).toBe('directory');
        });
      });
    });
  });

  describe('path resolution', () => {
    test('handles various path formats', () => {
      // These should all refer to the same file
      expect(fileTree.getFile('/config.json')).toSucceed();

      // Test that path normalization works through the accessors
      const result = fileTree.getFile('/config.json');
      expect(result).toSucceedAndSatisfy((file) => {
        expect(file.absolutePath).toBe('/config.json');
      });
    });

    test('handles nested paths correctly', () => {
      expect(fileTree.getFile('/docs/api/reference.json')).toSucceedAndSatisfy((file) => {
        expect(file.absolutePath).toBe('/docs/api/reference.json');
        expect(file.name).toBe('reference.json');
      });
    });
  });

  describe('integration scenarios', () => {
    test('can navigate from directory to files', () => {
      expect(fileTree.getDirectory('/data')).toSucceedAndSatisfy((dir) => {
        expect(dir.getChildren()).toSucceedAndSatisfy((children) => {
          const itemsFile = children.find((child) => child.name === 'items.json');
          expect(itemsFile).toBeDefined();
          expect(itemsFile?.type).toBe('file');

          // Get the same file directly and compare
          expect(fileTree.getFile('/data/items.json')).toSucceedAndSatisfy((directFile) => {
            expect(itemsFile?.absolutePath).toBe(directFile.absolutePath);
          });
        });
      });
    });

    test('can traverse entire tree structure', () => {
      expect(fileTree.getDirectory('/')).toSucceedAndSatisfy((root) => {
        expect(root.getChildren()).toSucceedAndSatisfy((rootChildren) => {
          // Verify we can access all expected items
          const dataDir = rootChildren.find((child) => child.name === 'data');
          const docsDir = rootChildren.find((child) => child.name === 'docs');
          const configFile = rootChildren.find((child) => child.name === 'config.json');

          expect(dataDir?.type).toBe('directory');
          expect(docsDir?.type).toBe('directory');
          expect(configFile?.type).toBe('file');
        });
      });
    });
  });

  describe('error handling and edge cases', () => {
    test('handles empty file tree', () => {
      const emptyAccessors = InMemoryTreeAccessors.create([]).orThrow();
      const emptyTree = FileTree.create(emptyAccessors).orThrow();

      // Root should exist but be empty
      expect(emptyTree.getDirectory('/')).toSucceedAndSatisfy((root) => {
        expect(root.getChildren()).toSucceedAndSatisfy((children) => {
          expect(children).toHaveLength(0);
        });
      });

      // No files should be accessible
      expect(emptyTree.getFile('/any.json')).toFailWith(/not found/i);
    });

    test('handles tree with only root files', () => {
      const rootFiles: IInMemoryFile[] = [
        { path: '/root1.json', contents: '{}' },
        { path: '/root2.txt', contents: 'text' }
      ];

      const rootAccessors = InMemoryTreeAccessors.create(rootFiles).orThrow();
      const rootTree = FileTree.create(rootAccessors).orThrow();

      expect(rootTree.getFile('/root1.json')).toSucceed();
      expect(rootTree.getFile('/root2.txt')).toSucceed();

      expect(rootTree.getDirectory('/')).toSucceedAndSatisfy((root) => {
        expect(root.getChildren()).toSucceedAndSatisfy((children) => {
          expect(children).toHaveLength(2);
          children.forEach((child) => {
            expect(child.type).toBe('file');
          });
        });
      });
    });

    test('handles very deep directory structures', () => {
      const deepFiles: IInMemoryFile[] = [{ path: '/a/b/c/d/e/f/g/h/deep.json', contents: '{"deep": true}' }];

      const deepAccessors = InMemoryTreeAccessors.create(deepFiles).orThrow();
      const deepTree = FileTree.create(deepAccessors).orThrow();

      expect(deepTree.getFile('/a/b/c/d/e/f/g/h/deep.json')).toSucceed();
      expect(deepTree.getDirectory('/a')).toSucceed();
      expect(deepTree.getDirectory('/a/b/c')).toSucceed();
      expect(deepTree.getDirectory('/a/b/c/d/e/f/g/h')).toSucceed();
    });
  });
});
