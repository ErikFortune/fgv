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
import { FileTreeHelpers } from '../../packlets/helpers';
import { FileApiTreeAccessors } from '../../packlets/file-tree';
import { createMockFile, createMockFileList, createMockDirectoryFileList } from '../utils/testHelpers';

describe('FileTreeHelpers', () => {
  describe('fromFileList', () => {
    test('creates FileTree from simple FileList', async () => {
      const fileList = createMockFileList([
        { name: 'file1.txt', content: 'content1' },
        { name: 'file2.txt', content: 'content2' }
      ]);

      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify files are accessible with proper paths
        expect(fileTree.getFile('/file1.txt')).toSucceed();
        expect(fileTree.getFile('/file2.txt')).toSucceed();

        // Verify content can be retrieved
        const content1 = fileTree.hal.getFileContents('/file1.txt');
        expect(content1).toSucceedWith('content1');

        const content2 = fileTree.hal.getFileContents('/file2.txt');
        expect(content2).toSucceedWith('content2');
      });
    });

    test('creates FileTree from FileList with prefix', async () => {
      const fileList = createMockFileList([{ name: 'test.txt', content: 'test content' }]);

      const result = await FileTreeHelpers.fromFileList(fileList, { prefix: '/upload' });
      expect(result).toSucceed();
    });

    test('handles empty FileList', async () => {
      const fileList = createMockFileList([]);
      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toSucceed();
    });

    test('handles various file types', async () => {
      const fileList = createMockFileList([
        { name: 'data.json', content: '{"key": "value"}', type: 'application/json' },
        { name: 'script.js', content: 'console.log("hello");', type: 'application/javascript' },
        { name: 'style.css', content: 'body { margin: 0; }', type: 'text/css' },
        { name: 'readme.txt', content: 'This is a readme', type: 'text/plain' }
      ]);

      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        expect(fileTree.getFile('/data.json')).toSucceed();
        expect(fileTree.getFile('/script.js')).toSucceed();
        expect(fileTree.getFile('/style.css')).toSucceed();
        expect(fileTree.getFile('/readme.txt')).toSucceed();
      });
    });

    test('automatically applies MIME types as contentType', async () => {
      const fileList = createMockFileList([
        { name: 'data.json', content: '{"key": "value"}', type: 'application/json' },
        { name: 'script.js', content: 'console.log("hello");', type: 'application/javascript' },
        { name: 'style.css', content: 'body { margin: 0; }', type: 'text/css' },
        { name: 'readme.txt', content: 'This is a readme', type: 'text/plain' },
        { name: 'image.png', content: 'PNG data', type: 'image/png' },
        { name: 'document.pdf', content: 'PDF content', type: 'application/pdf' },
        { name: 'archive.zip', content: 'ZIP data', type: 'application/zip' }
      ]);

      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify MIME types are automatically applied as contentType
        expect(fileTree.getFile('/data.json')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/json');
        });

        expect(fileTree.getFile('/script.js')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/javascript');
        });

        expect(fileTree.getFile('/style.css')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/css');
        });

        expect(fileTree.getFile('/readme.txt')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/plain');
        });

        expect(fileTree.getFile('/image.png')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('image/png');
        });

        expect(fileTree.getFile('/document.pdf')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/pdf');
        });

        expect(fileTree.getFile('/archive.zip')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/zip');
        });
      });
    });

    test('handles files without MIME types', async () => {
      const fileList = createMockFileList([
        { name: 'no-type.txt', content: 'content without type' },
        { name: 'empty-type.dat', content: 'empty type', type: '' },
        { name: 'unknown.ext', content: 'unknown extension' }
      ]);

      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Files without MIME types should have undefined contentType
        expect(fileTree.getFile('/no-type.txt')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/plain'); // Default from createMockFile
        });

        expect(fileTree.getFile('/empty-type.dat')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/plain'); // Browser defaults empty type to text/plain
        });

        expect(fileTree.getFile('/unknown.ext')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/plain'); // Default from createMockFile
        });
      });
    });

    test('forces content type to string (not templated)', async () => {
      const fileList = createMockFileList([
        { name: 'test.json', content: '{"test": true}', type: 'application/json' }
      ]);

      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify the return type is FileTree<string> not FileTree<T>
        expect(fileTree.getFile('/test.json')).toSucceedAndSatisfy((file) => {
          expect(typeof file.contentType).toBe('string');
          expect(file.contentType).toBe('application/json');
        });
      });
    });

    test('propagates file reading errors', async () => {
      const badFile = {
        name: 'bad.txt',
        size: 10,
        type: 'text/plain',
        lastModified: Date.now(),
        text: () => Promise.reject(new Error('Read failed'))
      } as unknown as File;

      const fileList = createMockFileList([{ name: 'good.txt', content: 'good content' }]);

      // Create a FileList with just the bad file
      const dt = new DataTransfer();
      dt.items.add(badFile);
      const badFileList = dt.files;

      const result = await FileTreeHelpers.fromFileList(badFileList);
      expect(result).toFailWith(/Failed to read file/);
    });

    test('maintains file accessibility through FileTree API', async () => {
      const fileList = createMockFileList([{ name: 'test.json', content: '{"name": "test", "value": 42}' }]);

      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        const file = fileTree.getFile('/test.json');
        expect(file).toSucceedAndSatisfy((fileItem) => {
          // Test JSON parsing through FileTree
          const jsonResult = fileItem.getContents();
          expect(jsonResult).toSucceedAndSatisfy((parsed) => {
            expect(parsed).toEqual({ name: 'test', value: 42 });
          });

          // Test raw content access
          const rawResult = fileItem.getRawContents();
          expect(rawResult).toSucceedWith('{"name": "test", "value": 42}');

          // Test file properties
          expect(fileItem.name).toBe('test.json');
          expect(fileItem.extension).toBe('.json');
          expect(fileItem.baseName).toBe('test');
        });
      });
    });
  });

  describe('fromDirectoryUpload', () => {
    test('creates FileTree from directory structure', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'project/src/index.js', content: 'console.log("main");' },
        { path: 'project/src/utils.js', content: 'export const helper = () => {};' },
        { path: 'project/package.json', content: '{"name": "test-project"}' },
        { path: 'project/README.md', content: '# Test Project' }
      ]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify all files are accessible
        expect(fileTree.getFile('/project/src/index.js')).toSucceed();
        expect(fileTree.getFile('/project/src/utils.js')).toSucceed();
        expect(fileTree.getFile('/project/package.json')).toSucceed();
        expect(fileTree.getFile('/project/README.md')).toSucceed();

        // Verify directory structure
        expect(fileTree.getDirectory('/project')).toSucceed();
        expect(fileTree.getDirectory('/project/src')).toSucceed();

        // Verify content retrieval
        const packageContent = fileTree.hal.getFileContents('/project/package.json');
        expect(packageContent).toSucceedWith('{"name": "test-project"}');
      });
    });

    test('creates FileTree from directory with prefix', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'app/config.json', content: '{"setting": "value"}' },
        { path: 'app/main.js', content: 'console.log("app");' }
      ]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList, { prefix: '/upload' });
      expect(result).toSucceed();
    });

    test('preserves directory hierarchy', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'deep/nested/structure/file1.txt', content: 'content1' },
        { path: 'deep/nested/structure/file2.txt', content: 'content2' },
        { path: 'deep/other/branch/file3.txt', content: 'content3' },
        { path: 'deep/file4.txt', content: 'content4' }
      ]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Test all directory levels
        expect(fileTree.getDirectory('/deep')).toSucceed();
        expect(fileTree.getDirectory('/deep/nested')).toSucceed();
        expect(fileTree.getDirectory('/deep/nested/structure')).toSucceed();
        expect(fileTree.getDirectory('/deep/other')).toSucceed();
        expect(fileTree.getDirectory('/deep/other/branch')).toSucceed();

        // Test directory traversal
        const deepDir = fileTree.getDirectory('/deep');
        expect(deepDir).toSucceedAndSatisfy((dir) => {
          const children = dir.getChildren();
          expect(children).toSucceedAndSatisfy((items) => {
            const names = items.map((item) => item.name).sort();
            expect(names).toContain('nested');
            expect(names).toContain('other');
            expect(names).toContain('file4.txt');
          });
        });
      });
    });

    test('handles webkitRelativePath correctly', async () => {
      // Create files with explicit webkitRelativePath
      const files = [
        createMockFile({
          name: 'index.html',
          content: '<html></html>',
          webkitRelativePath: 'website/index.html'
        }),
        createMockFile({
          name: 'style.css',
          content: 'body {}',
          webkitRelativePath: 'website/css/style.css'
        })
      ];

      // Create FileList manually to preserve webkitRelativePath
      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      const fileList = dt.files;

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        expect(fileTree.getFile('/website/index.html')).toSucceed();
        expect(fileTree.getFile('/website/css/style.css')).toSucceed();
        expect(fileTree.getDirectory('/website')).toSucceed();
        expect(fileTree.getDirectory('/website/css')).toSucceed();
      });
    });

    test('handles single file in directory', async () => {
      const fileList = createMockDirectoryFileList([{ path: 'single/file.txt', content: 'lone file' }]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        expect(fileTree.getFile('/single/file.txt')).toSucceed();
        expect(fileTree.getDirectory('/single')).toSucceed();
      });
    });

    test('handles empty directory upload', async () => {
      const fileList = createMockDirectoryFileList([]);
      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceed();
    });

    test('automatically applies MIME types as contentType in directory upload', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'project/package.json', content: '{"name": "test"}', type: 'application/json' },
        { path: 'project/src/index.js', content: 'console.log("main");', type: 'application/javascript' },
        { path: 'project/src/styles.css', content: 'body { color: red; }', type: 'text/css' },
        { path: 'project/README.md', content: '# Project', type: 'text/markdown' },
        { path: 'project/data.xml', content: '<root></root>', type: 'application/xml' },
        { path: 'project/assets/logo.svg', content: '<svg></svg>', type: 'image/svg+xml' },
        { path: 'project/docs/manual.pdf', content: 'PDF content', type: 'application/pdf' }
      ]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify MIME types are automatically applied as contentType
        expect(fileTree.getFile('/project/package.json')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/json');
        });

        expect(fileTree.getFile('/project/src/index.js')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/javascript');
        });

        expect(fileTree.getFile('/project/src/styles.css')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/css');
        });

        expect(fileTree.getFile('/project/README.md')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/markdown');
        });

        expect(fileTree.getFile('/project/data.xml')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/xml');
        });

        expect(fileTree.getFile('/project/assets/logo.svg')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('image/svg+xml');
        });

        expect(fileTree.getFile('/project/docs/manual.pdf')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/pdf');
        });
      });
    });

    test('handles mixed MIME types and missing types in directory upload', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'mixed/typed.json', content: '{}', type: 'application/json' },
        { path: 'mixed/untyped.txt', content: 'plain text' }, // No type specified
        { path: 'mixed/empty-type.dat', content: 'data', type: '' }, // Empty type
        { path: 'mixed/binary.bin', content: 'binary data', type: 'application/octet-stream' }
      ]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        expect(fileTree.getFile('/mixed/typed.json')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/json');
        });

        expect(fileTree.getFile('/mixed/untyped.txt')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/plain'); // Default from createMockFile
        });

        expect(fileTree.getFile('/mixed/empty-type.dat')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('text/plain'); // Browser defaults empty type to text/plain
        });

        expect(fileTree.getFile('/mixed/binary.bin')).toSucceedAndSatisfy((file) => {
          expect(file.contentType).toBe('application/octet-stream');
        });
      });
    });

    test('forces content type to string for directory upload (not templated)', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'app/config.json', content: '{"app": "test"}', type: 'application/json' }
      ]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify the return type is FileTree<string> not FileTree<T>
        expect(fileTree.getFile('/app/config.json')).toSucceedAndSatisfy((file) => {
          expect(typeof file.contentType).toBe('string');
          expect(file.contentType).toBe('application/json');
        });
      });
    });
  });

  // Note: fromFileApiFiles method was deprecated and removed.
  // The functionality has been replaced by the create() method in FileApiTreeAccessors
  // which uses TreeInitializer[] instead of IFileApiFile[].

  describe('getOriginalFile', () => {
    test('retrieves original File object by path', () => {
      const fileList = createMockFileList([
        { name: 'target.txt', content: 'target content', type: 'text/plain' },
        { name: 'other.txt', content: 'other content', type: 'text/plain' }
      ]);

      const result = FileTreeHelpers.getOriginalFile(fileList, 'target.txt');
      expect(result).toSucceedAndSatisfy((file) => {
        expect(file.name).toBe('target.txt');
        expect(file.type).toBe('text/plain');
        expect(file.size).toBeGreaterThan(0);
      });
    });

    test('handles webkitRelativePath matching', () => {
      const fileList = createMockDirectoryFileList([
        { path: 'folder/subfolder/file.txt', content: 'content', type: 'text/plain' }
      ]);

      const result = FileTreeHelpers.getOriginalFile(fileList, 'folder/subfolder/file.txt');
      expect(result).toSucceedAndSatisfy((file) => {
        expect(file.name).toBe('file.txt');
        expect((file as any).webkitRelativePath).toBe('folder/subfolder/file.txt');
      });
    });

    test('fails gracefully for non-existent files', () => {
      const fileList = createMockFileList([{ name: 'exists.txt', content: 'content' }]);

      const result = FileTreeHelpers.getOriginalFile(fileList, 'missing.txt');
      expect(result).toFailWith(/File not found: missing\.txt/);
    });

    test('handles empty FileList', () => {
      const fileList = createMockFileList([]);
      const result = FileTreeHelpers.getOriginalFile(fileList, 'any.txt');
      expect(result).toFailWith(/File not found/);
    });

    test('prioritizes exact name match over webkitRelativePath', () => {
      // Create files with both regular names and webkitRelativePath
      const files = [
        createMockFile({ name: 'file.txt', content: 'regular file' }),
        createMockFile({
          name: 'other.txt',
          content: 'directory file',
          webkitRelativePath: 'file.txt' // Same as first file's name
        })
      ];

      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      const fileList = dt.files;

      const result = FileTreeHelpers.getOriginalFile(fileList, 'file.txt');
      expect(result).toSucceedAndSatisfy((file) => {
        expect(file.name).toBe('file.txt');
        expect(file.size).toBeGreaterThan(0);
      });
    });
  });

  describe('extractFileListMetadata', () => {
    test('extracts complete metadata from FileList', () => {
      const testTime = Date.now();
      const fileList = createMockFileList([
        {
          name: 'document.pdf',
          content: 'PDF content here',
          type: 'application/pdf',
          lastModified: testTime
        },
        {
          name: 'image.png',
          content: 'PNG data',
          type: 'image/png',
          lastModified: testTime + 1000
        }
      ]);

      const metadata = FileTreeHelpers.extractFileListMetadata(fileList);
      expect(metadata).toHaveLength(2);

      const pdfMeta = metadata.find((m) => m.name === 'document.pdf');
      expect(pdfMeta).toEqual({
        path: 'document.pdf',
        name: 'document.pdf',
        size: expect.any(Number),
        type: 'application/pdf',
        lastModified: testTime
      });

      const pngMeta = metadata.find((m) => m.name === 'image.png');
      expect(pngMeta).toEqual({
        path: 'image.png',
        name: 'image.png',
        size: expect.any(Number),
        type: 'image/png',
        lastModified: testTime + 1000
      });
    });

    test('includes webkitRelativePath in path field', () => {
      const fileList = createMockDirectoryFileList([
        { path: 'project/src/main.js', content: 'main code', type: 'application/javascript' },
        { path: 'project/assets/logo.png', content: 'logo data', type: 'image/png' }
      ]);

      const metadata = FileTreeHelpers.extractFileListMetadata(fileList);
      expect(metadata).toHaveLength(2);

      expect(metadata.find((m) => m.name === 'main.js')?.path).toBe('project/src/main.js');
      expect(metadata.find((m) => m.name === 'logo.png')?.path).toBe('project/assets/logo.png');
    });

    test('handles various file sizes correctly', () => {
      const fileList = createMockFileList([
        { name: 'tiny.txt', content: '' },
        { name: 'small.txt', content: 'small' },
        { name: 'large.txt', content: 'x'.repeat(10000) }
      ]);

      const metadata = FileTreeHelpers.extractFileListMetadata(fileList);
      const sizes = metadata.map((m) => m.size);

      expect(sizes[0]).toBe(0); // empty file
      expect(sizes[1]).toBeGreaterThan(0); // small file
      expect(sizes[2]).toBeGreaterThan(sizes[1]); // large file
    });

    test('returns empty array for empty FileList', () => {
      const fileList = createMockFileList([]);
      const metadata = FileTreeHelpers.extractFileListMetadata(fileList);
      expect(metadata).toEqual([]);
    });

    test('preserves file order', () => {
      const expectedOrder = ['first.txt', 'second.txt', 'third.txt'];
      const fileList = createMockFileList(expectedOrder.map((name) => ({ name, content: 'content' })));

      const metadata = FileTreeHelpers.extractFileListMetadata(fileList);
      const actualOrder = metadata.map((m) => m.name);
      expect(actualOrder).toEqual(expectedOrder);
    });
  });

  describe('extractFileMetadata', () => {
    test('extracts metadata from single file', () => {
      const testTime = Date.now();
      const file = createMockFile({
        name: 'single.txt',
        content: 'single file content',
        type: 'text/plain',
        lastModified: testTime
      });

      const metadata = FileTreeHelpers.extractFileMetadata(file);
      expect(metadata).toEqual({
        path: 'single.txt',
        name: 'single.txt',
        size: expect.any(Number),
        type: 'text/plain',
        lastModified: testTime
      });
    });

    test('handles webkitRelativePath for single file', () => {
      const file = createMockFile({
        name: 'nested.txt',
        content: 'nested content',
        type: 'text/plain',
        webkitRelativePath: 'folder/nested.txt'
      });

      const metadata = FileTreeHelpers.extractFileMetadata(file);
      expect(metadata.path).toBe('folder/nested.txt');
      expect(metadata.name).toBe('nested.txt');
    });
  });

  describe('Error propagation', () => {
    test('propagates errors from FileApiTreeAccessors.fromFileList', async () => {
      const badFile = {
        name: 'bad.txt',
        size: 10,
        type: 'text/plain',
        lastModified: Date.now(),
        text: () => Promise.reject(new Error('File system error'))
      } as unknown as File;

      // Create a FileList with just the bad file
      const dt = new DataTransfer();
      dt.items.add(badFile);
      const badFileList = dt.files;

      const result = await FileTreeHelpers.fromFileList(badFileList);
      expect(result).toFailWith(/Failed to read file/);
    });

    test('propagates errors from FileApiTreeAccessors.fromDirectoryUpload', async () => {
      const badFile = {
        name: 'bad.txt',
        size: 10,
        type: 'text/plain',
        lastModified: Date.now(),
        webkitRelativePath: 'folder/bad.txt',
        text: () => Promise.reject(new Error('Directory read error'))
      } as unknown as File;

      const dt = new DataTransfer();
      dt.items.add(badFile);
      const fileList = dt.files;

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toFailWith(/Failed to read file/);
    });

    test('propagates errors from FileApiTreeAccessors.create via fromFileList', async () => {
      const badFile = {
        name: 'bad.txt',
        size: 10,
        type: 'text/plain',
        lastModified: Date.now(),
        text: () => Promise.reject(new Error('API error'))
      } as unknown as File;

      // Create FileList with the bad file
      const dt = new DataTransfer();
      dt.items.add(badFile);
      const fileList = dt.files;

      const result = await FileTreeHelpers.fromFileList(fileList);
      expect(result).toFailWith(/Failed to read file/);
    });
  });

  describe('Integration scenarios', () => {
    test('handles realistic file upload scenario', async () => {
      const fileList = createMockFileList([
        { name: 'photo1.jpg', content: 'JPEG data 1', type: 'image/jpeg' },
        { name: 'photo2.jpg', content: 'JPEG data 2', type: 'image/jpeg' },
        { name: 'metadata.txt', content: 'Photo metadata', type: 'text/plain' }
      ]);

      const result = await FileTreeHelpers.fromFileList(fileList, { prefix: '/uploads' });
      expect(result).toSucceed();
    });

    test('handles realistic project upload scenario', async () => {
      const fileList = createMockDirectoryFileList([
        { path: 'my-app/package.json', content: '{"name": "my-app"}' },
        { path: 'my-app/src/index.js', content: 'console.log("Hello");' },
        { path: 'my-app/src/components/App.jsx', content: 'export default App;' },
        { path: 'my-app/public/index.html', content: '<html></html>' },
        { path: 'my-app/README.md', content: '# My App' }
      ]);

      const result = await FileTreeHelpers.fromDirectoryUpload(fileList);
      expect(result).toSucceedAndSatisfy((fileTree) => {
        // Verify complete project structure
        expect(fileTree.getDirectory('/my-app')).toSucceed();
        expect(fileTree.getDirectory('/my-app/src')).toSucceed();
        expect(fileTree.getDirectory('/my-app/src/components')).toSucceed();
        expect(fileTree.getDirectory('/my-app/public')).toSucceed();

        // Verify all files
        expect(fileTree.getFile('/my-app/package.json')).toSucceed();
        expect(fileTree.getFile('/my-app/src/index.js')).toSucceed();
        expect(fileTree.getFile('/my-app/src/components/App.jsx')).toSucceed();
        expect(fileTree.getFile('/my-app/public/index.html')).toSucceed();
        expect(fileTree.getFile('/my-app/README.md')).toSucceed();

        // Verify content access
        const packageContent = fileTree.hal.getFileContents('/my-app/package.json');
        expect(packageContent).toSucceedWith('{"name": "my-app"}');
      });
    });
  });
});
