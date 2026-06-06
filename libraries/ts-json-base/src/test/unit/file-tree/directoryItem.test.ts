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
import { fail, succeed } from '@fgv/ts-utils';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  DirectoryItem,
  InMemoryTreeAccessors,
  IInMemoryFile,
  FsFileTreeAccessors
} from '../../../packlets/file-tree';

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

  describe('deleteChild method', () => {
    test('succeeds with mutable InMemoryTreeAccessors and removes the file', () => {
      const mutableAccessors = InMemoryTreeAccessors.create([{ path: '/dir/file.json', contents: '{}' }], {
        mutable: true
      }).orThrow();
      const directoryItem = DirectoryItem.create('/dir', mutableAccessors).orThrow();

      expect(directoryItem.deleteChild?.('file.json')).toSucceedWith(true);
      expect(mutableAccessors.getFileContents('/dir/file.json')).toFailWith(/not found/i);
    });

    test('deleted child no longer appears in getChildren', () => {
      const mutableAccessors = InMemoryTreeAccessors.create(
        [
          { path: '/dir/file1.json', contents: '{}' },
          { path: '/dir/file2.json', contents: '{}' }
        ],
        { mutable: true }
      ).orThrow();
      const directoryItem = DirectoryItem.create('/dir', mutableAccessors).orThrow();

      expect(directoryItem.deleteChild?.('file1.json')).toSucceedWith(true);
      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        const names = children.map((c) => c.name);
        expect(names).not.toContain('file1.json');
        expect(names).toContain('file2.json');
      });
    });

    test('fails when child does not exist', () => {
      const mutableAccessors = InMemoryTreeAccessors.create([{ path: '/dir/file.json', contents: '{}' }], {
        mutable: true
      }).orThrow();
      const directoryItem = DirectoryItem.create('/dir', mutableAccessors).orThrow();

      expect(directoryItem.deleteChild('missing.json')).toFailWith(/not found/i);
    });

    test('fails with non-mutable accessors (no fileIsMutable or saveFileContents)', () => {
      const mockAccessor = {
        resolveAbsolutePath: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
        getExtension: (p: string) => '',
        getBaseName: (p: string) => p.split('/').pop() ?? '',
        joinPaths: (...paths: string[]) => paths.join('/'),
        getItem: () => fail('not implemented') as unknown as ReturnType<typeof accessors.getItem>,
        getFileContents: () =>
          fail('not implemented') as unknown as ReturnType<typeof accessors.getFileContents>,
        getFileContentType: () => succeed(undefined),
        getChildren: () => succeed([]) as unknown as ReturnType<typeof accessors.getChildren>
      };

      const directoryItem = DirectoryItem.create('/dir', mockAccessor).orThrow();
      expect(directoryItem.deleteChild?.('file.json')).toFailWith(/mutation not supported/i);
    });
  });

  describe('createChildFile method', () => {
    let tempDir: string;

    beforeEach(() => {
      // Create a temporary directory for mutable filesystem tests
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'directoryitem-test-'));
    });

    afterEach(() => {
      // Clean up temp directory
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('succeeds with mutable FsFileTreeAccessors and creates file', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      expect(directoryItem.createChildFile?.('test.txt', 'hello world')).toSucceedAndSatisfy((fileItem) => {
        expect(fileItem.type).toBe('file');
        expect(fileItem.name).toBe('test.txt');
        expect(fileItem.getRawContents()).toSucceedWith('hello world');
        expect(fs.existsSync(path.join(tempDir, 'test.txt'))).toBe(true);
      });
    });

    test('fails with non-mutable accessors (InMemoryTreeAccessors)', () => {
      const nonMutableAccessors = InMemoryTreeAccessors.create([]).orThrow();
      const directoryItem = DirectoryItem.create('/', nonMutableAccessors).orThrow();

      expect(directoryItem.createChildFile?.('test.txt', 'content')).toFailWith(/mutability is disabled/i);
    });

    test('succeeds creating file with JSON content', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      const jsonContent = '{"name": "test", "value": 42}';
      expect(directoryItem.createChildFile?.('data.json', jsonContent)).toSucceedAndSatisfy((fileItem) => {
        expect(fileItem.type).toBe('file');
        expect(fileItem.name).toBe('data.json');
        expect(fileItem.getRawContents()).toSucceedWith(jsonContent);
        expect(fileItem.getContents()).toSucceedWith({ name: 'test', value: 42 });
      });
    });

    test('succeeds creating multiple files in same directory', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      expect(directoryItem.createChildFile?.('file1.txt', 'content 1')).toSucceed();
      expect(directoryItem.createChildFile?.('file2.txt', 'content 2')).toSucceed();
      expect(directoryItem.createChildFile?.('file3.txt', 'content 3')).toSucceed();

      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        const names = children.map((c) => c.name).sort();
        expect(names).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);
      });
    });

    test('succeeds creating file in subdirectory', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const subdir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subdir);

      const directoryItem = DirectoryItem.create('subdir', accessors).orThrow();

      expect(directoryItem.createChildFile?.('nested.txt', 'nested content')).toSucceedAndSatisfy(
        (fileItem) => {
          expect(fileItem.absolutePath).toBe(path.join(subdir, 'nested.txt'));
          expect(fs.existsSync(path.join(subdir, 'nested.txt'))).toBe(true);
        }
      );
    });

    test('fails when accessor lacks IMutableFileTreeAccessors (mutation not supported)', () => {
      // Use a mock accessor that doesn't implement IMutableFileTreeAccessors
      const mockAccessor = {
        resolveAbsolutePath: (...paths: string[]) => path.join(...paths),
        getExtension: (p: string) => path.extname(p),
        getBaseName: (p: string) => path.basename(p),
        joinPaths: (...paths: string[]) => path.join(...paths),
        getItem: () => fail('not implemented') as unknown as ReturnType<typeof accessors.getItem>,
        getFileContents: () =>
          fail('not implemented') as unknown as ReturnType<typeof accessors.getFileContents>,
        getFileContentType: () => succeed(undefined),
        getChildren: () => succeed([]) as unknown as ReturnType<typeof accessors.getChildren>
      };

      const directoryItem = DirectoryItem.create('.', mockAccessor).orThrow();

      expect(directoryItem.createChildFile?.('test.txt', 'content')).toFailWith(/mutation not supported/i);
    });
  });

  describe('createChildDirectory method', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'directoryitem-test-'));
    });

    afterEach(() => {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('succeeds with mutable FsFileTreeAccessors and creates directory', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      expect(directoryItem.createChildDirectory?.('newdir')).toSucceedAndSatisfy((childDir) => {
        expect(childDir.type).toBe('directory');
        expect(childDir.name).toBe('newdir');
        expect(fs.existsSync(path.join(tempDir, 'newdir'))).toBe(true);
      });
    });

    test('fails with non-mutable accessors (InMemoryTreeAccessors)', () => {
      const nonMutableAccessors = InMemoryTreeAccessors.create([]).orThrow();
      const directoryItem = DirectoryItem.create('/', nonMutableAccessors).orThrow();

      // Non-mutable InMemoryTreeAccessors fails at the mutability check
      expect(directoryItem.createChildDirectory?.('newdir')).toFailWith(/mutability is disabled/i);
    });

    test('succeeds with mutable InMemoryTreeAccessors', () => {
      // InMemoryTreeAccessors now implements createDirectory
      const mutableAccessors = InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
      const directoryItem = DirectoryItem.create('/', mutableAccessors).orThrow();

      expect(directoryItem.createChildDirectory?.('newdir')).toSucceedAndSatisfy((childDir) => {
        expect(childDir.type).toBe('directory');
        expect(childDir.name).toBe('newdir');
      });
    });

    test('succeeds creating multiple subdirectories', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      expect(directoryItem.createChildDirectory?.('dir1')).toSucceed();
      expect(directoryItem.createChildDirectory?.('dir2')).toSucceed();
      expect(directoryItem.createChildDirectory?.('dir3')).toSucceed();

      expect(directoryItem.getChildren()).toSucceedAndSatisfy((children) => {
        const names = children
          .filter((c) => c.type === 'directory')
          .map((c) => c.name)
          .sort();
        expect(names).toEqual(['dir1', 'dir2', 'dir3']);
      });
    });

    test('succeeds creating nested subdirectories', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      expect(directoryItem.createChildDirectory('parent')).toSucceedAndSatisfy((parentDir) => {
        expect(parentDir.createChildDirectory('child')).toSucceedAndSatisfy((childDir) => {
          expect(childDir.name).toBe('child');
          expect(fs.existsSync(path.join(tempDir, 'parent', 'child'))).toBe(true);
        });
      });
    });

    test('created directory can be used immediately', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      expect(directoryItem.createChildDirectory('workdir')).toSucceedAndSatisfy((workdir) => {
        expect(workdir.createChildFile('file.txt', 'test content')).toSucceedAndSatisfy((file) => {
          expect(file.name).toBe('file.txt');
          expect(file.getRawContents()).toSucceedWith('test content');
        });
      });
    });

    test('deleteChild removes a file child', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      directoryItem.createChildFile('deleteme.txt', 'content').orThrow();
      expect(fs.existsSync(path.join(tempDir, 'deleteme.txt'))).toBe(true);

      expect(directoryItem.deleteChild('deleteme.txt')).toSucceedWith(true);
      expect(fs.existsSync(path.join(tempDir, 'deleteme.txt'))).toBe(false);
    });

    test('deleteChild removes an empty directory child', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      directoryItem.createChildDirectory('emptydir').orThrow();
      expect(fs.existsSync(path.join(tempDir, 'emptydir'))).toBe(true);

      expect(directoryItem.deleteChild('emptydir')).toSucceedWith(true);
      expect(fs.existsSync(path.join(tempDir, 'emptydir'))).toBe(false);
    });

    test('deleteChild fails on non-empty directory without recursive option', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      const subdir = directoryItem.createChildDirectory('nonempty').orThrow();
      subdir.createChildFile('file.txt', 'content').orThrow();

      expect(directoryItem.deleteChild('nonempty')).toFail();
      expect(fs.existsSync(path.join(tempDir, 'nonempty'))).toBe(true);
    });

    test('deleteChild with recursive option removes non-empty directory', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      const subdir = directoryItem.createChildDirectory('recursive').orThrow();
      subdir.createChildFile('file1.txt', 'content').orThrow();
      const nested = subdir.createChildDirectory('nested').orThrow();
      nested.createChildFile('file2.txt', 'content').orThrow();

      expect(directoryItem.deleteChild('recursive', { recursive: true })).toSucceedWith(true);
      expect(fs.existsSync(path.join(tempDir, 'recursive'))).toBe(false);
    });

    test('deleteChild fails for non-existent child', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const directoryItem = DirectoryItem.create('.', accessors).orThrow();

      expect(directoryItem.deleteChild('nonexistent')).toFail();
    });

    test('delete removes the directory itself', () => {
      const accessors = new FsFileTreeAccessors({ prefix: tempDir, mutable: true });
      const dirPath = path.join(tempDir, 'todelete');
      fs.mkdirSync(dirPath);

      const directoryItem = DirectoryItem.create('todelete', accessors).orThrow();
      expect(directoryItem.delete()).toSucceedWith(true);
      expect(fs.existsSync(dirPath)).toBe(false);
    });

    test('fails when accessor lacks IMutableFileTreeAccessors (mutation not supported)', () => {
      // Use a mock accessor that doesn't implement IMutableFileTreeAccessors
      const mockAccessor = {
        resolveAbsolutePath: (...paths: string[]) => path.join(...paths),
        getExtension: (p: string) => path.extname(p),
        getBaseName: (p: string) => path.basename(p),
        joinPaths: (...paths: string[]) => path.join(...paths),
        getItem: () => fail('not implemented') as unknown as ReturnType<typeof accessors.getItem>,
        getFileContents: () =>
          fail('not implemented') as unknown as ReturnType<typeof accessors.getFileContents>,
        getFileContentType: () => succeed(undefined),
        getChildren: () => succeed([]) as unknown as ReturnType<typeof accessors.getChildren>
      };

      const directoryItem = DirectoryItem.create('.', mockAccessor).orThrow();

      expect(directoryItem.createChildDirectory('newdir')).toFailWith(/mutation not supported/i);
      expect(directoryItem.deleteChild('anything')).toFailWith(/mutation not supported/i);
      expect(directoryItem.delete()).toFailWith(/mutation not supported/i);
    });
  });
});
