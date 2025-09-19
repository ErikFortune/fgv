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
import { Result, succeed } from '@fgv/ts-utils';
import {
  FileItem,
  InMemoryTreeAccessors,
  IInMemoryFile,
  DirectoryItem,
  FileTree
} from '../../../packlets/file-tree';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { TreeBuilder } from '../../../packlets/file-tree/in-memory/treeBuilder';

describe('ContentType functionality', () => {
  describe('Setting contentType via IInMemoryFile array (HAL)', () => {
    test('FileItem with no contentType returns undefined', () => {
      const files: IInMemoryFile[] = [{ path: '/test.txt', contents: 'plain text' }];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      const fileItem = FileItem.create('/test.txt', accessors).orThrow();
      expect(fileItem.contentType).toBeUndefined();
    });

    test('FileItem with explicit contentType in IInMemoryFile', () => {
      const files: IInMemoryFile[] = [
        { path: '/test.json', contents: '{"test": true}', contentType: 'application/json' as const }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      const fileItem = FileItem.create('/test.json', accessors).orThrow();
      expect(fileItem.contentType).toBe('application/json');
    });

    test('Multiple files with different contentTypes', () => {
      const files: IInMemoryFile[] = [
        { path: '/file1.json', contents: '{"a": 1}', contentType: 'application/json' as const },
        { path: '/file2.xml', contents: '<root/>', contentType: 'application/xml' as const },
        { path: '/file3.txt', contents: 'text', contentType: 'text/plain' as const },
        { path: '/file4.bin', contents: 'binary' } // No contentType
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      expect(FileItem.create('/file1.json', accessors).orThrow().contentType).toBe('application/json');
      expect(FileItem.create('/file2.xml', accessors).orThrow().contentType).toBe('application/xml');
      expect(FileItem.create('/file3.txt', accessors).orThrow().contentType).toBe('text/plain');
      expect(FileItem.create('/file4.bin', accessors).orThrow().contentType).toBeUndefined();
    });

    test('contentType with custom string type', () => {
      type MyContentTypes = 'custom/type1' | 'custom/type2';
      const files: IInMemoryFile<MyContentTypes>[] = [
        { path: '/custom1.dat', contents: 'data1', contentType: 'custom/type1' },
        { path: '/custom2.dat', contents: 'data2', contentType: 'custom/type2' }
      ];
      const accessors = InMemoryTreeAccessors.create<MyContentTypes>(files).orThrow();

      const file1 = FileItem.create('/custom1.dat', accessors).orThrow();
      const file2 = FileItem.create('/custom2.dat', accessors).orThrow();
      expect(file1.contentType).toBe('custom/type1');
      expect(file2.contentType).toBe('custom/type2');
    });

    test('Nested files with contentType', () => {
      const files: IInMemoryFile[] = [
        { path: '/root/sub1/file1.json', contents: '{}', contentType: 'application/json' as const },
        { path: '/root/sub2/file2.yaml', contents: 'key: value', contentType: 'application/x-yaml' as const },
        { path: '/root/file3.txt', contents: 'text' }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      expect(FileItem.create('/root/sub1/file1.json', accessors).orThrow().contentType).toBe(
        'application/json'
      );
      expect(FileItem.create('/root/sub2/file2.yaml', accessors).orThrow().contentType).toBe(
        'application/x-yaml'
      );
      expect(FileItem.create('/root/file3.txt', accessors).orThrow().contentType).toBeUndefined();
    });
  });

  describe('Setting contentType after file creation', () => {
    test('setContentType changes contentType of existing file', () => {
      const files: IInMemoryFile[] = [{ path: '/test.txt', contents: 'test content' }];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      const fileItem = FileItem.create('/test.txt', accessors).orThrow();
      expect(fileItem.contentType).toBeUndefined();

      fileItem.setContentType('text/plain');
      expect(fileItem.contentType).toBe('text/plain');
    });

    test('setContentType overwrites existing contentType', () => {
      const files: IInMemoryFile[] = [
        { path: '/test.json', contents: '{}', contentType: 'application/json' as const }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      const fileItem = FileItem.create('/test.json', accessors).orThrow();
      expect(fileItem.contentType).toBe('application/json');

      fileItem.setContentType('text/plain');
      expect(fileItem.contentType).toBe('text/plain');
    });

    test('setContentType to undefined clears contentType', () => {
      const files: IInMemoryFile[] = [
        { path: '/test.json', contents: '{}', contentType: 'application/json' as const }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      const fileItem = FileItem.create('/test.json', accessors).orThrow();
      expect(fileItem.contentType).toBe('application/json');

      fileItem.setContentType(undefined);
      expect(fileItem.contentType).toBeUndefined();
    });

    test('setContentType is instance-specific and does not persist', () => {
      const files: IInMemoryFile[] = [{ path: '/test.txt', contents: 'test' }];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      const fileItem1 = FileItem.create('/test.txt', accessors).orThrow();
      fileItem1.setContentType('text/plain');
      expect(fileItem1.contentType).toBe('text/plain');

      // Create a new FileItem for the same path - contentType is not persisted
      const fileItem2 = FileItem.create('/test.txt', accessors).orThrow();
      expect(fileItem2.contentType).toBeUndefined();

      // But the first instance still has its contentType
      expect(fileItem1.contentType).toBe('text/plain');
    });
  });

  describe('Edge cases and error conditions', () => {
    test('Empty string contentType is allowed', () => {
      const files: IInMemoryFile[] = [{ path: '/test.txt', contents: 'test', contentType: '' as const }];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      const fileItem = FileItem.create('/test.txt', accessors).orThrow();
      expect(fileItem.contentType).toBe('');
    });

    test('Special characters in contentType', () => {
      const files: IInMemoryFile[] = [
        { path: '/test1.dat', contents: 'data', contentType: 'application/x-custom+json' as const },
        { path: '/test2.dat', contents: 'data', contentType: 'text/plain; charset=utf-8' as const },
        {
          path: '/test3.dat',
          contents: 'data',
          contentType: 'multipart/form-data; boundary=----WebKitFormBoundary' as const
        }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      expect(FileItem.create('/test1.dat', accessors).orThrow().contentType).toBe(
        'application/x-custom+json'
      );
      expect(FileItem.create('/test2.dat', accessors).orThrow().contentType).toBe(
        'text/plain; charset=utf-8'
      );
      expect(FileItem.create('/test3.dat', accessors).orThrow().contentType).toBe(
        'multipart/form-data; boundary=----WebKitFormBoundary'
      );
    });

    test('getFileContentType for non-existent file uses inference', () => {
      const files: IInMemoryFile[] = [
        { path: '/exists.txt', contents: 'test', contentType: 'text/plain' as const }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      // For non-existent files, it should fall back to inference (which returns undefined by default)
      const result = accessors.getFileContentType('/does-not-exist.txt');
      expect(result).toSucceedWith(undefined);
    });

    test('getFileContentType for directory path returns undefined', () => {
      const files: IInMemoryFile[] = [
        { path: '/dir/file.txt', contents: 'test', contentType: 'text/plain' as const }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      // For directories, it should return undefined
      const result = accessors.getFileContentType('/dir');
      expect(result).toSucceedWith(undefined);
    });

    test('ContentType is not affected by file contents changes', () => {
      const files: IInMemoryFile[] = [
        { path: '/test.json', contents: '{"old": true}', contentType: 'application/json' as const }
      ];
      const accessors = InMemoryTreeAccessors.create(files).orThrow();

      // Get initial file
      const fileItem1 = FileItem.create('/test.json', accessors).orThrow();
      expect(fileItem1.contentType).toBe('application/json');

      // Even if we somehow modified the contents (not directly possible via public API),
      // contentType should remain unchanged
      const fileItem2 = FileItem.create('/test.json', accessors).orThrow();
      expect(fileItem2.contentType).toBe('application/json');
    });
  });

  describe('Integration with FileTree and TreeBuilder', () => {
    test('TreeBuilder preserves contentType when building tree', () => {
      const files: IInMemoryFile[] = [
        { path: '/root/data.json', contents: '{}', contentType: 'application/json' as const },
        { path: '/root/style.css', contents: 'body {}', contentType: 'text/css' as const }
      ];

      const accessors = InMemoryTreeAccessors.create(files).orThrow();
      const tree = FileTree.create(accessors).orThrow();

      // Get root directory
      const rootItem = tree.getItem('/root');
      expect(rootItem).toSucceedAndSatisfy((item) => {
        expect(item).toBeInstanceOf(DirectoryItem);
      });

      // Check files in tree using getItem
      const jsonFile = tree.getItem('/root/data.json');
      expect(jsonFile).toSucceedAndSatisfy((item) => {
        expect(item).toBeInstanceOf(FileItem);
        const fileItem = item as FileItem;
        expect(fileItem.contentType).toBe('application/json');
      });

      const cssFile = tree.getItem('/root/style.css');
      expect(cssFile).toSucceedAndSatisfy((item) => {
        expect(item).toBeInstanceOf(FileItem);
        const fileItem = item as FileItem;
        expect(fileItem.contentType).toBe('text/css');
      });
    });

    test('TreeBuilder addFile method with contentType', () => {
      const builder = TreeBuilder.create('/').orThrow();

      // Add files with contentType
      expect(builder.addFile('/test1.json', '{}', 'application/json')).toSucceed();
      expect(builder.addFile('/dir/test2.xml', '<root/>', 'application/xml')).toSucceed();
      expect(builder.addFile('/dir/test3.txt', 'text')).toSucceed(); // No contentType

      // Verify contentTypes are stored
      const root = builder.root;
      const file1 = root.children.get('test1.json');
      expect(file1).toBeDefined();
      expect(file1).toHaveProperty('contentType', 'application/json');

      const dir = root.children.get('dir');
      expect(dir).toBeDefined();
      if (dir && 'children' in dir) {
        const file2 = dir.children.get('test2.xml');
        expect(file2).toBeDefined();
        expect(file2).toHaveProperty('contentType', 'application/xml');

        const file3 = dir.children.get('test3.txt');
        expect(file3).toBeDefined();
        expect(file3).toHaveProperty('contentType', undefined);
      }
    });
  });

  describe('ContentType with inference function', () => {
    test('Inference function is used when no explicit contentType is set', () => {
      // Create files with no explicit contentType
      const files: IInMemoryFile[] = [
        { path: '/test.json', contents: '{}' },
        { path: '/test.txt', contents: 'text' }
      ];

      // Create accessor with custom inference function
      const inferContentType = (path: string): Result<string | undefined> => {
        if (path.endsWith('.json')) return succeed('application/json');
        if (path.endsWith('.txt')) return succeed('text/plain');
        return succeed(undefined);
      };

      const accessors = InMemoryTreeAccessors.create(files, { inferContentType }).orThrow();

      // Without explicit contentType, inference function is used
      expect(accessors.getFileContentType('/test.json')).toSucceedWith('application/json');
      expect(accessors.getFileContentType('/test.txt')).toSucceedWith('text/plain');
    });

    test('Explicit contentType takes precedence over inference', () => {
      const files: IInMemoryFile[] = [
        { path: '/test.json', contents: '{}', contentType: 'text/plain' as const } // Wrong on purpose
      ];

      const inferContentType = (path: string): Result<string | undefined> => {
        if (path.endsWith('.json')) return succeed('application/json');
        return succeed(undefined);
      };

      const accessors = InMemoryTreeAccessors.create(files, { inferContentType }).orThrow();

      // Explicit contentType should win
      const fileItem = FileItem.create('/test.json', accessors).orThrow();
      expect(fileItem.contentType).toBe('text/plain');
    });
  });
});
