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
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  InMemoryFile,
  InMemoryDirectory,
  TreeBuilder
} from '../../../packlets/file-tree/in-memory/treeBuilder';

describe('InMemoryFile', () => {
  test('creates file with path and contents', () => {
    const file = new InMemoryFile('/test.json', { name: 'test' });
    expect(file.absolutePath).toBe('/test.json');
    expect(file.contents).toEqual({ name: 'test' });
  });

  test('creates file with string contents', () => {
    const file = new InMemoryFile('/readme.txt', 'This is a readme');
    expect(file.absolutePath).toBe('/readme.txt');
    expect(file.contents).toBe('This is a readme');
  });

  test('creates file with nested path', () => {
    const file = new InMemoryFile('/data/config/settings.json', { setting: 'value' });
    expect(file.absolutePath).toBe('/data/config/settings.json');
    expect(file.contents).toEqual({ setting: 'value' });
  });

  test('creates file with various content types', () => {
    const stringFile = new InMemoryFile('/string.txt', 'string content');
    const objectFile = new InMemoryFile('/object.json', { key: 'value' });
    const arrayFile = new InMemoryFile('/array.json', [1, 2, 3]);
    const numberFile = new InMemoryFile('/number.txt', 42);
    const booleanFile = new InMemoryFile('/boolean.txt', true);
    const nullFile = new InMemoryFile('/null.txt', null);

    expect(stringFile.contents).toBe('string content');
    expect(objectFile.contents).toEqual({ key: 'value' });
    expect(arrayFile.contents).toEqual([1, 2, 3]);
    expect(numberFile.contents).toBe(42);
    expect(booleanFile.contents).toBe(true);
    expect(nullFile.contents).toBeNull();
  });
});

describe('InMemoryDirectory', () => {
  test('creates empty directory with path', () => {
    const directory = new InMemoryDirectory('/data');
    expect(directory.absolutePath).toBe('/data');
    expect(directory.children.size).toBe(0);
  });

  test('creates root directory', () => {
    const directory = new InMemoryDirectory('/');
    expect(directory.absolutePath).toBe('/');
    expect(directory.children.size).toBe(0);
  });

  describe('getOrAddDirectory method', () => {
    test('adds new child directory', () => {
      const parent = new InMemoryDirectory('/parent');
      expect(parent.getOrAddDirectory('child')).toSucceedAndSatisfy((child) => {
        expect(child).toBeInstanceOf(InMemoryDirectory);
        expect(child.absolutePath).toBe('/parent/child');
        expect(parent.children.size).toBe(1);
        expect(parent.children.get('child')).toBe(child);
      });
    });

    test('returns existing child directory', () => {
      const parent = new InMemoryDirectory('/parent');
      const firstResult = parent.getOrAddDirectory('child').orThrow();

      expect(parent.getOrAddDirectory('child')).toSucceedAndSatisfy((child) => {
        expect(child).toBe(firstResult);
        expect(parent.children.size).toBe(1);
      });
    });

    test('fails when child name conflicts with file', () => {
      const parent = new InMemoryDirectory('/parent');
      parent.addFile('conflict', 'content').orThrow();

      expect(parent.getOrAddDirectory('conflict')).toFailWith(/not a directory/i);
    });

    test('handles root directory child paths correctly', () => {
      const root = new InMemoryDirectory('/');
      expect(root.getOrAddDirectory('child')).toSucceedAndSatisfy((child) => {
        expect(child.absolutePath).toBe('/child');
      });
    });

    test('handles nested directory creation', () => {
      const parent = new InMemoryDirectory('/parent');
      const child1 = parent.getOrAddDirectory('child1').orThrow();
      const child2 = parent.getOrAddDirectory('child2').orThrow();

      expect(parent.children.size).toBe(2);
      expect(child1.absolutePath).toBe('/parent/child1');
      expect(child2.absolutePath).toBe('/parent/child2');
    });
  });

  describe('addFile method', () => {
    test('adds new file to directory', () => {
      const directory = new InMemoryDirectory('/data');
      expect(directory.addFile('test.json', { test: true })).toSucceedAndSatisfy((file) => {
        expect(file).toBeInstanceOf(InMemoryFile);
        expect(file.absolutePath).toBe('/data/test.json');
        expect(file.contents).toEqual({ test: true });
        expect(directory.children.size).toBe(1);
        expect(directory.children.get('test.json')).toBe(file);
      });
    });

    test('fails when file name already exists', () => {
      const directory = new InMemoryDirectory('/data');
      directory.addFile('test.json', { first: true }).orThrow();

      expect(directory.addFile('test.json', { second: true })).toFailWith(/already exists/i);
    });

    test('fails when file name conflicts with directory', () => {
      const directory = new InMemoryDirectory('/data');
      directory.getOrAddDirectory('conflict').orThrow();

      expect(directory.addFile('conflict', 'content')).toFailWith(/already exists/i);
    });

    test('handles root directory file paths correctly', () => {
      const root = new InMemoryDirectory('/');
      expect(root.addFile('config.json', {})).toSucceedAndSatisfy((file) => {
        expect(file.absolutePath).toBe('/config.json');
      });
    });

    test('adds multiple files to directory', () => {
      const directory = new InMemoryDirectory('/data');
      const file1 = directory.addFile('file1.txt', 'content1').orThrow();
      const file2 = directory.addFile('file2.txt', 'content2').orThrow();

      expect(directory.children.size).toBe(2);
      expect(file1.absolutePath).toBe('/data/file1.txt');
      expect(file2.absolutePath).toBe('/data/file2.txt');
    });
  });

  describe('getChildPath method', () => {
    test('generates correct child paths for regular directory', () => {
      const directory = new InMemoryDirectory('/parent');
      expect(directory.getChildPath('child')).toBe('/parent/child');
      expect(directory.getChildPath('file.txt')).toBe('/parent/file.txt');
    });

    test('generates correct child paths for root directory', () => {
      const root = new InMemoryDirectory('/');
      expect(root.getChildPath('child')).toBe('/child');
      expect(root.getChildPath('file.txt')).toBe('/file.txt');
    });

    test('generates correct child paths for nested directory', () => {
      const nested = new InMemoryDirectory('/parent/nested');
      expect(nested.getChildPath('child')).toBe('/parent/nested/child');
      expect(nested.getChildPath('file.txt')).toBe('/parent/nested/file.txt');
    });
  });

  describe('children property', () => {
    test('returns readonly map of children', () => {
      const directory = new InMemoryDirectory('/data');
      const child1 = directory.getOrAddDirectory('subdir').orThrow();
      const child2 = directory.addFile('file.txt', 'content').orThrow();

      const children = directory.children;
      expect(children.size).toBe(2);
      expect(children.get('subdir')).toBe(child1);
      expect(children.get('file.txt')).toBe(child2);

      // Should be readonly
      expect(children).toBeInstanceOf(Map);
    });

    test('reflects changes to directory contents', () => {
      const directory = new InMemoryDirectory('/data');
      expect(directory.children.size).toBe(0);

      directory.addFile('file1.txt', 'content').orThrow();
      expect(directory.children.size).toBe(1);

      directory.getOrAddDirectory('subdir').orThrow();
      expect(directory.children.size).toBe(2);
    });
  });
});

describe('TreeBuilder', () => {
  describe('create static method', () => {
    test('creates TreeBuilder with default prefix', () => {
      const result = TreeBuilder.create();
      expect(result).toSucceedAndSatisfy((builder) => {
        expect(builder).toBeInstanceOf(TreeBuilder);
        expect(builder.prefix).toBe('/');
        expect(builder.root.absolutePath).toBe('/');
        expect(builder.byAbsolutePath.size).toBe(1);
        expect(builder.byAbsolutePath.get('/')).toBe(builder.root);
      });
    });

    test('creates TreeBuilder with custom prefix', () => {
      const result = TreeBuilder.create('/custom');
      expect(result).toSucceedAndSatisfy((builder) => {
        expect(builder.prefix).toBe('/custom');
        expect(builder.root.absolutePath).toBe('/custom');
        expect(builder.byAbsolutePath.size).toBe(1);
        expect(builder.byAbsolutePath.get('/custom')).toBe(builder.root);
      });
    });

    test('fails with non-absolute prefix', () => {
      expect(TreeBuilder.create('relative')).toFailWith(/not an absolute path/i);
      expect(TreeBuilder.create('relative/path')).toFailWith(/not an absolute path/i);
    });

    test('handles various absolute prefixes', () => {
      expect(TreeBuilder.create('/root')).toSucceed();
      expect(TreeBuilder.create('/app/data')).toSucceed();
      expect(TreeBuilder.create('/very/deep/prefix/path')).toSucceed();
    });
  });

  describe('addFile method', () => {
    test('adds file to root directory', () => {
      const builder = TreeBuilder.create().orThrow();
      expect(builder.addFile('/config.json', { name: 'test' })).toSucceedAndSatisfy((file) => {
        expect(file.absolutePath).toBe('/config.json');
        expect(file.contents).toEqual({ name: 'test' });
        expect(builder.byAbsolutePath.size).toBe(2); // root + file
        expect(builder.byAbsolutePath.get('/config.json')).toBe(file);
      });
    });

    test('adds file to nested directory, creating directories as needed', () => {
      const builder = TreeBuilder.create().orThrow();
      expect(builder.addFile('/data/config/settings.json', { setting: 'value' })).toSucceedAndSatisfy(
        (file) => {
          expect(file.absolutePath).toBe('/data/config/settings.json');
          expect(file.contents).toEqual({ setting: 'value' });

          // Should have created intermediate directories
          expect(builder.byAbsolutePath.size).toBe(4); // root + data + config + file
          expect(builder.byAbsolutePath.get('/data')).toBeInstanceOf(InMemoryDirectory);
          expect(builder.byAbsolutePath.get('/data/config')).toBeInstanceOf(InMemoryDirectory);
          expect(builder.byAbsolutePath.get('/data/config/settings.json')).toBe(file);
        }
      );
    });

    test('adds multiple files to same directory', () => {
      const builder = TreeBuilder.create().orThrow();
      const file1 = builder.addFile('/data/file1.txt', 'content1').orThrow();
      const file2 = builder.addFile('/data/file2.txt', 'content2').orThrow();

      expect(builder.byAbsolutePath.size).toBe(4); // root + data + file1 + file2
      expect(builder.byAbsolutePath.get('/data/file1.txt')).toBe(file1);
      expect(builder.byAbsolutePath.get('/data/file2.txt')).toBe(file2);

      const dataDir = builder.byAbsolutePath.get('/data') as InMemoryDirectory;
      expect(dataDir.children.size).toBe(2);
    });

    test('fails for invalid file paths', () => {
      const builder = TreeBuilder.create().orThrow();
      expect(builder.addFile('/', 'content')).toFailWith(/invalid file path/i);
    });

    test('fails when file conflicts with existing directory', () => {
      const builder = TreeBuilder.create().orThrow();
      builder.addFile('/data/subdir/file.txt', 'content').orThrow();

      expect(builder.addFile('/data/subdir', 'content')).toFailWith(/already exists/i);
    });

    test('fails when directory conflicts with existing file', () => {
      const builder = TreeBuilder.create().orThrow();
      builder.addFile('/data/file.txt', 'content').orThrow();

      expect(builder.addFile('/data/file.txt/nested.txt', 'content')).toFailWith(/not a directory/i);
    });

    test('handles deeply nested file structures', () => {
      const builder = TreeBuilder.create().orThrow();
      const deepPath = '/a/b/c/d/e/f/g/h/i/j/deep.txt';

      expect(builder.addFile(deepPath, 'deep content')).toSucceedAndSatisfy((file) => {
        expect(file.absolutePath).toBe(deepPath);
        expect(file.contents).toBe('deep content');

        // Should have created all intermediate directories
        expect(builder.byAbsolutePath.size).toBe(12); // root + 10 dirs + file
        expect(builder.byAbsolutePath.get('/a')).toBeInstanceOf(InMemoryDirectory);
        expect(builder.byAbsolutePath.get('/a/b/c/d/e')).toBeInstanceOf(InMemoryDirectory);
        expect(builder.byAbsolutePath.get('/a/b/c/d/e/f/g/h/i/j')).toBeInstanceOf(InMemoryDirectory);
      });
    });

    test('adds files with various content types', () => {
      const builder = TreeBuilder.create().orThrow();

      const stringFile = builder.addFile('/string.txt', 'string content').orThrow();
      const objectFile = builder.addFile('/object.json', { key: 'value' }).orThrow();
      const arrayFile = builder.addFile('/array.json', [1, 2, 3]).orThrow();
      const numberFile = builder.addFile('/number.txt', 42).orThrow();
      const nullFile = builder.addFile('/null.txt', null).orThrow();

      expect(stringFile.contents).toBe('string content');
      expect(objectFile.contents).toEqual({ key: 'value' });
      expect(arrayFile.contents).toEqual([1, 2, 3]);
      expect(numberFile.contents).toBe(42);
      expect(nullFile.contents).toBeNull();
    });
  });

  describe('byAbsolutePath property', () => {
    test('tracks all directories and files by absolute path', () => {
      const builder = TreeBuilder.create().orThrow();

      builder.addFile('/config.json', {}).orThrow();
      builder.addFile('/data/items.json', []).orThrow();
      builder.addFile('/docs/api/reference.json', {}).orThrow();

      expect(builder.byAbsolutePath.size).toBe(7); // root + config.json + data + items.json + docs + api + reference.json

      expect(builder.byAbsolutePath.get('/')).toBeInstanceOf(InMemoryDirectory);
      expect(builder.byAbsolutePath.get('/config.json')).toBeInstanceOf(InMemoryFile);
      expect(builder.byAbsolutePath.get('/data')).toBeInstanceOf(InMemoryDirectory);
      expect(builder.byAbsolutePath.get('/data/items.json')).toBeInstanceOf(InMemoryFile);
      expect(builder.byAbsolutePath.get('/docs')).toBeInstanceOf(InMemoryDirectory);
      expect(builder.byAbsolutePath.get('/docs/api')).toBeInstanceOf(InMemoryDirectory);
      expect(builder.byAbsolutePath.get('/docs/api/reference.json')).toBeInstanceOf(InMemoryFile);
    });

    test('allows efficient lookup of any path', () => {
      const builder = TreeBuilder.create().orThrow();

      const file = builder.addFile('/deep/nested/path/file.txt', 'content').orThrow();
      const directory = builder.byAbsolutePath.get('/deep/nested') as InMemoryDirectory;

      expect(directory).toBeInstanceOf(InMemoryDirectory);
      expect(directory.absolutePath).toBe('/deep/nested');
      expect(builder.byAbsolutePath.get('/deep/nested/path/file.txt')).toBe(file);
    });
  });

  describe('integration scenarios', () => {
    test('builds complex file tree structure', () => {
      const builder = TreeBuilder.create().orThrow();

      // Add various files and directories
      builder.addFile('/package.json', { name: 'test-project', version: '1.0.0' }).orThrow();
      builder.addFile('/README.md', '# Test Project').orThrow();
      builder.addFile('/src/index.ts', 'export * from "./lib";').orThrow();
      builder.addFile('/src/lib/utils.ts', 'export function helper() {}').orThrow();
      builder.addFile('/src/lib/types.ts', 'export interface ITest {}').orThrow();
      builder.addFile('/tests/unit/utils.test.ts', 'describe("utils", () => {})').orThrow();
      builder.addFile('/docs/api.md', '# API Documentation').orThrow();
      builder.addFile('/config/settings.json', { debug: true }).orThrow();

      // Verify structure
      expect(builder.byAbsolutePath.size).toBe(15); // root + all dirs and files

      // Check root children
      const root = builder.root;
      expect(root.children.size).toBe(6); // package.json, README.md, src, tests, docs, config

      // Check src directory structure
      const srcDir = builder.byAbsolutePath.get('/src') as InMemoryDirectory;
      expect(srcDir.children.size).toBe(2); // index.ts, lib

      const libDir = builder.byAbsolutePath.get('/src/lib') as InMemoryDirectory;
      expect(libDir.children.size).toBe(2); // utils.ts, types.ts

      // Verify file contents
      const packageFile = builder.byAbsolutePath.get('/package.json') as InMemoryFile;
      expect(packageFile.contents).toEqual({ name: 'test-project', version: '1.0.0' });
    });

    test('handles file tree with prefix', () => {
      const builder = TreeBuilder.create('/app').orThrow();

      const configFile = builder.addFile('/config.json', { app: 'test' }).orThrow();
      const itemsFile = builder.addFile('/data/items.json', [1, 2, 3]).orThrow();

      expect(builder.prefix).toBe('/app');
      expect(builder.root.absolutePath).toBe('/app');
      expect(builder.byAbsolutePath.get('/app')).toBe(builder.root);

      // Check that files are resolved with the prefix
      expect(configFile.absolutePath).toBe('/app/config.json');
      expect(itemsFile.absolutePath).toBe('/app/data/items.json');

      expect(builder.byAbsolutePath.get('/app/config.json')).toBe(configFile);
      expect(builder.byAbsolutePath.get('/app/data')).toBeInstanceOf(InMemoryDirectory);
      expect(builder.byAbsolutePath.get('/app/data/items.json')).toBe(itemsFile);
    });

    test('can recreate same structure with multiple TreeBuilders', () => {
      const builder1 = TreeBuilder.create().orThrow();
      const builder2 = TreeBuilder.create().orThrow();

      const files = [
        { path: '/config.json', content: { name: 'test' } },
        { path: '/data/items.json', content: [1, 2, 3] },
        { path: '/docs/readme.txt', content: 'readme' }
      ];

      files.forEach(({ path, content }) => {
        builder1.addFile(path, content).orThrow();
        builder2.addFile(path, content).orThrow();
      });

      expect(builder1.byAbsolutePath.size).toBe(builder2.byAbsolutePath.size);
      expect(builder1.root.children.size).toBe(builder2.root.children.size);

      // Verify same structure
      files.forEach(({ path }) => {
        expect(builder1.byAbsolutePath.has(path)).toBe(true);
        expect(builder2.byAbsolutePath.has(path)).toBe(true);
      });
    });
  });

  describe('error handling and edge cases', () => {
    test('handles empty tree', () => {
      const builder = TreeBuilder.create().orThrow();

      expect(builder.byAbsolutePath.size).toBe(1); // Just root
      expect(builder.root.children.size).toBe(0);
    });

    test('handles files with special characters in names', () => {
      const builder = TreeBuilder.create().orThrow();

      const specialFiles = [
        '/special-chars_123.txt',
        '/file.with.dots.json',
        '/UPPERCASE.TXT',
        '/numbers123.txt'
      ];

      specialFiles.forEach((path) => {
        expect(builder.addFile(path, 'content')).toSucceed();
        expect(builder.byAbsolutePath.get(path)).toBeInstanceOf(InMemoryFile);
      });
    });

    test('handles large number of files', () => {
      const builder = TreeBuilder.create().orThrow();

      // Add 100 files in same directory
      for (let i = 0; i < 100; i++) {
        builder.addFile(`/files/file${i}.txt`, `content${i}`).orThrow();
      }

      expect(builder.byAbsolutePath.size).toBe(102); // root + files dir + 100 files

      const filesDir = builder.byAbsolutePath.get('/files') as InMemoryDirectory;
      expect(filesDir.children.size).toBe(100);
    });

    test('properly maintains directory hierarchy', () => {
      const builder = TreeBuilder.create().orThrow();

      // Add files in different order to test hierarchy maintenance
      builder.addFile('/a/b/c/d/file1.txt', 'content1').orThrow();
      builder.addFile('/a/file2.txt', 'content2').orThrow();
      builder.addFile('/a/b/file3.txt', 'content3').orThrow();

      const aDir = builder.byAbsolutePath.get('/a') as InMemoryDirectory;
      const bDir = builder.byAbsolutePath.get('/a/b') as InMemoryDirectory;
      const cDir = builder.byAbsolutePath.get('/a/b/c') as InMemoryDirectory;
      const dDir = builder.byAbsolutePath.get('/a/b/c/d') as InMemoryDirectory;

      expect(aDir.children.size).toBe(2); // file2.txt + b directory
      expect(bDir.children.size).toBe(2); // file3.txt + c directory
      expect(cDir.children.size).toBe(1); // d directory
      expect(dDir.children.size).toBe(1); // file1.txt
    });
  });
});
