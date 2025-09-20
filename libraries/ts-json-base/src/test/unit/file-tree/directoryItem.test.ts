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
import { DirectoryItem, InMemoryTreeAccessors, IInMemoryFile } from '../../../packlets/file-tree';

describe('DirectoryItem', () => {
  let sampleFiles: IInMemoryFile[];
  let accessors: InMemoryTreeAccessors;

  beforeEach(() => {
    sampleFiles = [
      { path: '/config.json', contents: '{"name": "test", "enabled": true}' },
      { path: '/data/items.json', contents: '[1, 2, 3]' },
      { path: '/data/metadata.json', contents: '{"version": "1.0"}' },
      { path: '/docs/readme.txt', contents: 'This is a readme file' },
      { path: '/docs/api/reference.json', contents: '{"endpoints": []}' },
      { path: '/docs/api/guide.md', contents: '# API Guide\nThis is the guide.' },
      { path: '/empty-dir/placeholder.txt', contents: 'placeholder' },
      { path: '/nested/very/deep/file.txt', contents: 'deep content' },
      { path: '/scripts/build.sh', contents: '#!/bin/bash\necho "Building..."' },
      { path: '/scripts/deploy.py', contents: 'print("Deploying...")' }
    ];

    accessors = InMemoryTreeAccessors.create(sampleFiles).orThrow();
  });

  describe('create static method', () => {
    test('creates DirectoryItem with valid path and accessors', () => {
      const result = DirectoryItem.create('/data', accessors);
      expect(result).toSucceedAndSatisfy((directoryItem) => {
        expect(directoryItem).toBeInstanceOf(DirectoryItem);
        expect(directoryItem.type).toBe('directory');
        expect(directoryItem.absolutePath).toBe('/data');
      });
    });

    test('creates DirectoryItem with relative path', () => {
      const result = DirectoryItem.create('data', accessors);
      expect(result).toSucceedAndSatisfy((directoryItem) => {
        expect(directoryItem.absolutePath).toBe('/data');
      });
    });

    test('creates DirectoryItem with nested path', () => {
      const result = DirectoryItem.create('/docs/api', accessors);
      expect(result).toSucceedAndSatisfy((directoryItem) => {
        expect(directoryItem.absolutePath).toBe('/docs/api');
      });
    });

    test('creates DirectoryItem for root directory', () => {
      const result = DirectoryItem.create('/', accessors);
      expect(result).toSucceedAndSatisfy((directoryItem) => {
        expect(directoryItem.absolutePath).toBe('/');
      });
    });

    test('creates DirectoryItem even for non-existent directories', () => {
      const result = DirectoryItem.create('/non-existent', accessors);
      expect(result).toSucceedAndSatisfy((directoryItem) => {
        expect(directoryItem.absolutePath).toBe('/non-existent');
      });
    });
  });

  describe('properties', () => {
    test('type property is always "directory"', () => {
      const directoryItem = DirectoryItem.create('/data', accessors).orThrow();
      expect(directoryItem.type).toBe('directory');
    });

    test('absolutePath property returns resolved absolute path', () => {
      const directoryItem1 = DirectoryItem.create('/data', accessors).orThrow();
      expect(directoryItem1.absolutePath).toBe('/data');

      const directoryItem2 = DirectoryItem.create('data', accessors).orThrow();
      expect(directoryItem2.absolutePath).toBe('/data');
    });

    test('name property returns directory name', () => {
      const directoryItem1 = DirectoryItem.create('/data', accessors).orThrow();
      expect(directoryItem1.name).toBe('data');

      const directoryItem2 = DirectoryItem.create('/docs/api', accessors).orThrow();
      expect(directoryItem2.name).toBe('api');

      const directoryItem3 = DirectoryItem.create('/scripts', accessors).orThrow();
      expect(directoryItem3.name).toBe('scripts');
    });

    test('name property for root directory', () => {
      const directoryItem = DirectoryItem.create('/', accessors).orThrow();
      expect(directoryItem.name).toBe('');
    });

    test('name property for deeply nested directories', () => {
      const directoryItem = DirectoryItem.create('/nested/very/deep', accessors).orThrow();
      expect(directoryItem.name).toBe('deep');
    });
  });

  describe('getChildren method', () => {
    test('retrieves children of directory with files', () => {
      const directoryItem = DirectoryItem.create('/data', accessors).orThrow();
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(2);

        const names = children.map((child) => child.name).sort();
        expect(names).toEqual(['items.json', 'metadata.json']);

        children.forEach((child) => {
          expect(child.type).toBe('file');
          expect(child.absolutePath).toMatch(/^\/data\//);
        });
      });
    });

    test('retrieves children of directory with mixed content', () => {
      const directoryItem = DirectoryItem.create('/docs', accessors).orThrow();
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(2);

        const names = children.map((child) => child.name).sort();
        expect(names).toEqual(['api', 'readme.txt']);

        const apiDir = children.find((child) => child.name === 'api');
        const readmeFile = children.find((child) => child.name === 'readme.txt');

        expect(apiDir?.type).toBe('directory');
        expect(readmeFile?.type).toBe('file');
      });
    });

    test('retrieves children of nested subdirectory', () => {
      const directoryItem = DirectoryItem.create('/docs/api', accessors).orThrow();
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(2);

        const names = children.map((child) => child.name).sort();
        expect(names).toEqual(['guide.md', 'reference.json']);

        children.forEach((child) => {
          expect(child.type).toBe('file');
        });
      });
    });

    test('retrieves children of root directory', () => {
      const directoryItem = DirectoryItem.create('/', accessors).orThrow();
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children.length).toBeGreaterThan(0);

        const names = children.map((child) => child.name).sort();
        expect(names).toContain('config.json');
        expect(names).toContain('data');
        expect(names).toContain('docs');
        expect(names).toContain('scripts');
        expect(names).toContain('empty-dir');
        expect(names).toContain('nested');

        const hasFiles = children.some((child) => child.type === 'file');
        const hasDirectories = children.some((child) => child.type === 'directory');
        expect(hasFiles).toBe(true);
        expect(hasDirectories).toBe(true);
      });
    });

    test('retrieves children of directory with single subdirectory', () => {
      const directoryItem = DirectoryItem.create('/empty-dir', accessors).orThrow();
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(1);
        expect(children[0].name).toBe('placeholder.txt');
        expect(children[0].type).toBe('file');
      });
    });

    test('fails for non-existent directories', () => {
      const directoryItem = DirectoryItem.create('/missing', accessors).orThrow();
      expect(directoryItem.getChildren()).toFailWith(/not found/i);
    });

    test('succeeds for deeply nested directories', () => {
      const directoryItem = DirectoryItem.create('/nested/very/deep', accessors).orThrow();
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(1);
        expect(children[0].name).toBe('file.txt');
        expect(children[0].type).toBe('file');
      });
    });
  });

  describe('integration scenarios', () => {
    test('can access directory properties and children consistently', () => {
      const directoryItem = DirectoryItem.create('/docs/api', accessors).orThrow();

      expect(directoryItem.name).toBe('api');
      expect(directoryItem.type).toBe('directory');
      expect(directoryItem.absolutePath).toBe('/docs/api');

      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(2);

        const referenceFile = children.find((child) => child.name === 'reference.json');
        const guideFile = children.find((child) => child.name === 'guide.md');

        expect(referenceFile).toBeDefined();
        expect(guideFile).toBeDefined();
        expect(referenceFile?.absolutePath).toBe('/docs/api/reference.json');
        expect(guideFile?.absolutePath).toBe('/docs/api/guide.md');
      });
    });

    test('handles various directory types', () => {
      const directories = ['/data', '/docs', '/scripts', '/nested/very', '/empty-dir'];

      directories.forEach((dirPath) => {
        const directoryItem = DirectoryItem.create(dirPath, accessors).orThrow();
        expect(directoryItem.type).toBe('directory');
        expect(directoryItem.absolutePath).toBe(dirPath);
        expect(directoryItem.getChildren()).toSucceed();
      });
    });

    test('consistent behavior with different path formats', () => {
      const absoluteItem = DirectoryItem.create('/data', accessors).orThrow();
      const relativeItem = DirectoryItem.create('data', accessors).orThrow();

      expect(absoluteItem.absolutePath).toBe(relativeItem.absolutePath);
      expect(absoluteItem.name).toBe(relativeItem.name);
      expect(absoluteItem.type).toBe(relativeItem.type);

      const absoluteChildren = absoluteItem.getChildren().orThrow();
      const relativeChildren = relativeItem.getChildren().orThrow();

      expect(absoluteChildren).toHaveLength(relativeChildren.length);
      expect(absoluteChildren.map((c) => c.name).sort()).toEqual(relativeChildren.map((c) => c.name).sort());
    });

    test('can traverse directory tree hierarchically', () => {
      const rootItem = DirectoryItem.create('/', accessors).orThrow();

      expect(rootItem.getChildren()).toSucceedAndSatisfy((rootChildren) => {
        const docsDir = rootChildren.find((child) => child.name === 'docs');
        expect(docsDir?.type).toBe('directory');

        // Create DirectoryItem from found directory and check its children
        const docsItem = DirectoryItem.create('/docs', accessors).orThrow();
        expect(docsItem.getChildren()).toSucceedAndSatisfy((docsChildren) => {
          const apiDir = docsChildren.find((child) => child.name === 'api');
          expect(apiDir?.type).toBe('directory');

          // Create DirectoryItem for API directory
          const apiItem = DirectoryItem.create('/docs/api', accessors).orThrow();
          expect(apiItem.getChildren()).toSucceedAndSatisfy((apiChildren) => {
            expect(apiChildren).toHaveLength(2);
            expect(apiChildren.every((child) => child.type === 'file')).toBe(true);
          });
        });
      });
    });
  });

  describe('error handling and edge cases', () => {
    test('handles empty directory tree', () => {
      const emptyAccessors = InMemoryTreeAccessors.create([]).orThrow();
      const emptyDirectoryItem = DirectoryItem.create('/', emptyAccessors).orThrow();

      expect(emptyDirectoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(0);
      });
    });

    test('handles directories with complex names', () => {
      const complexFiles: IInMemoryFile[] = [
        { path: '/special-chars_123/file.txt', contents: 'content' },
        { path: '/with.dots.in.name/file.txt', contents: 'content' },
        { path: '/UPPERCASE/file.txt', contents: 'content' }
      ];
      const complexAccessors = InMemoryTreeAccessors.create(complexFiles).orThrow();

      const directoryItem1 = DirectoryItem.create('/special-chars_123', complexAccessors).orThrow();
      expect(directoryItem1.name).toBe('special-chars_123');

      const directoryItem2 = DirectoryItem.create('/with.dots.in.name', complexAccessors).orThrow();
      expect(directoryItem2.name).toBe('with.dots.in.name');

      const directoryItem3 = DirectoryItem.create('/UPPERCASE', complexAccessors).orThrow();
      expect(directoryItem3.name).toBe('UPPERCASE');
    });

    test('handles very deep directory structures', () => {
      const deepFiles: IInMemoryFile[] = [
        { path: '/a/b/c/d/e/f/g/h/i/j/k/deep.txt', contents: 'deep content' }
      ];
      const deepAccessors = InMemoryTreeAccessors.create(deepFiles).orThrow();

      const directoryItem = DirectoryItem.create('/a/b/c/d/e/f/g/h/i/j/k', deepAccessors).orThrow();
      expect(directoryItem.name).toBe('k');
      expect(directoryItem.absolutePath).toBe('/a/b/c/d/e/f/g/h/i/j/k');

      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(1);
        expect(children[0].name).toBe('deep.txt');
      });
    });

    test('handles directory with many children', () => {
      const manyFiles: IInMemoryFile[] = [];
      for (let i = 0; i < 100; i++) {
        manyFiles.push({ path: `/large-dir/file${i}.txt`, contents: `content ${i}` });
      }
      const largeAccessors = InMemoryTreeAccessors.create(manyFiles).orThrow();

      const directoryItem = DirectoryItem.create('/large-dir', largeAccessors).orThrow();
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(100);
        expect(children.every((child) => child.type === 'file')).toBe(true);
        expect(children.every((child) => child.name.startsWith('file'))).toBe(true);
      });
    });

    test('handles single-level directory tree', () => {
      const flatFiles: IInMemoryFile[] = [
        { path: '/file1.txt', contents: 'content1' },
        { path: '/file2.txt', contents: 'content2' },
        { path: '/file3.txt', contents: 'content3' }
      ];
      const flatAccessors = InMemoryTreeAccessors.create(flatFiles).orThrow();

      const rootItem = DirectoryItem.create('/', flatAccessors).orThrow();
      expect(rootItem.getChildren()).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(3);
        expect(children.every((child) => child.type === 'file')).toBe(true);

        const names = children.map((child) => child.name).sort();
        expect(names).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);
      });
    });
  });
});
