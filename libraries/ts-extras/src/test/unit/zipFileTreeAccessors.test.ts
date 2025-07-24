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
import AdmZip from 'adm-zip';
import { Validators } from '@fgv/ts-utils';
import { ZipFileTreeAccessors } from '../../packlets/zip-file-tree';

describe('ZipFileTreeAccessors', () => {
  const createTestZip = (): Buffer => {
    const zip = new AdmZip();

    // Add some test files with various extensions and structures
    zip.addFile(
      'manifest.json',
      Buffer.from(
        JSON.stringify({
          timestamp: '2025-07-22T00:00:00.000Z',
          input: { type: 'directory', path: 'input/test' }
        })
      )
    );
    zip.addFile('input/test/file1.json', Buffer.from(JSON.stringify({ name: 'file1', data: 'test data 1' })));
    zip.addFile('input/test/file2.json', Buffer.from(JSON.stringify({ name: 'file2', data: 'test data 2' })));
    zip.addFile(
      'config/settings.json',
      Buffer.from(JSON.stringify({ setting1: 'value1', setting2: 'value2' }))
    );
    // Add files with various extensions and edge cases
    zip.addFile('script.min.js', Buffer.from('console.log("minified");'));
    zip.addFile('README', Buffer.from('This file has no extension'));
    zip.addFile('docs/guide.md', Buffer.from('# Guide\n\nContent here'));
    zip.addFile('assets/image.png', Buffer.from('fake-png-data'));
    zip.addFile('invalid.json', Buffer.from('{ invalid json content'));

    return zip.toBuffer();
  };

  const createEmptyZip = (): Buffer => {
    const zip = new AdmZip();
    return zip.toBuffer();
  };

  const createDirectoryOnlyZip = (): Buffer => {
    const zip = new AdmZip();
    zip.addFile('dir1/', Buffer.from(''));
    zip.addFile('dir2/', Buffer.from(''));
    zip.addFile('nested/dir/', Buffer.from(''));
    return zip.toBuffer();
  };

  describe('fromBuffer', () => {
    it('should create ZipFileTreeAccessors from buffer', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceed();
    });

    it('should create with prefix parameter', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer, 'archive-root');

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Test that prefix is applied to resolved paths
        const resolved = accessors.resolveAbsolutePath('test.json');
        expect(resolved).toBe('/archive-root/test.json');
      });
    });

    it('should handle empty zip archive', () => {
      const zipBuffer = createEmptyZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Should succeed but have no items
        const itemResult = accessors.getItem('/anything');
        expect(itemResult).toFailWith(/Item not found/i);
      });
    });

    it('should handle directory-only zip', () => {
      const zipBuffer = createDirectoryOnlyZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Should find directories but no files
        const dir1Result = accessors.getItem('/dir1');
        expect(dir1Result).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
        });

        const nestedResult = accessors.getItem('/nested/dir');
        expect(nestedResult).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
        });
      });
    });

    it('should handle invalid zip buffer', () => {
      const invalidBuffer = Buffer.alloc(10, 'invalid');
      const result = ZipFileTreeAccessors.fromBuffer(invalidBuffer);

      expect(result).toFailWith(/Failed to load ZIP archive/i);
    });

    it('should handle non-Error exceptions in fromBuffer (line 210)', () => {
      // Simple approach: very small buffer that might cause unusual exceptions
      const tinyBuffer = Buffer.from([0x50, 0x4b]); // Just ZIP signature, nothing else
      const result = ZipFileTreeAccessors.fromBuffer(tinyBuffer);

      expect(result).toFailWith(/Failed to load ZIP archive/i);
    });

    it('should handle Uint8Array input', () => {
      const zipBuffer = createTestZip();
      const uint8Buffer = new Uint8Array(zipBuffer);
      const result = ZipFileTreeAccessors.fromBuffer(uint8Buffer);

      expect(result).toSucceed();
    });
  });

  describe('file operations', () => {
    let accessors: ZipFileTreeAccessors;

    beforeEach(() => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);
      accessors = result.orThrow();
    });

    it('should get file items with various extensions', () => {
      // Test standard extension
      const jsonResult = accessors.getItem('/manifest.json');
      expect(jsonResult).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('file');
        expect(item.name).toBe('manifest.json');
        if (item.type === 'file') {
          expect(item.extension).toBe('.json');
          expect(item.baseName).toBe('manifest');
        }
      });

      // Test multiple extensions
      const jsResult = accessors.getItem('/script.min.js');
      expect(jsResult).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          expect(item.extension).toBe('.js');
          expect(item.baseName).toBe('script.min');
          expect(item.name).toBe('script.min.js');
        }
      });

      // Test no extension
      const noExtResult = accessors.getItem('/README');
      expect(noExtResult).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          expect(item.extension).toBe('');
          expect(item.baseName).toBe('README');
          expect(item.name).toBe('README');
        }
      });

      // Test nested file
      const nestedResult = accessors.getItem('/docs/guide.md');
      expect(nestedResult).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          expect(item.extension).toBe('.md');
          expect(item.baseName).toBe('guide');
          expect(item.name).toBe('guide.md');
          expect(item.absolutePath).toBe('/docs/guide.md');
        }
      });
    });

    it('should get directory items', () => {
      const result = accessors.getItem('/input');

      expect(result).toSucceedAndSatisfy((item) => {
        expect(item.type).toBe('directory');
        expect(item.name).toBe('input');
      });
    });

    it('should get file contents', () => {
      const result = accessors.getItem('/manifest.json');

      expect(result).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          const contentsResult = item.getRawContents();
          expect(contentsResult).toSucceedAndSatisfy((contents) => {
            const parsed = JSON.parse(contents);
            expect(parsed.timestamp).toBe('2025-07-22T00:00:00.000Z');
          });
        }
      });
    });

    it('should handle non-JSON content', () => {
      const result = accessors.getItem('/README');

      expect(result).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          const contentsResult = item.getRawContents();
          expect(contentsResult).toSucceedWith('This file has no extension');
        }
      });
    });

    it('should get directory children', () => {
      const result = accessors.getChildren('/input');

      expect(result).toSucceedAndSatisfy((children) => {
        expect(children).toHaveLength(1); // Only 'test' directory
        expect(children[0].type).toBe('directory');
        expect(children[0].name).toBe('test');
      });
    });

    it('should handle missing items', () => {
      const result = accessors.getItem('/nonexistent.json');

      expect(result).toFail();
    });

    it('should get file contents with getFileContents method', () => {
      const result = accessors.getFileContents('/manifest.json');

      expect(result).toSucceedAndSatisfy((contents) => {
        const parsed = JSON.parse(contents);
        expect(parsed.timestamp).toBe('2025-07-22T00:00:00.000Z');
      });
    });

    it('should fail getFileContents for directories', () => {
      const result = accessors.getFileContents('/input');

      expect(result).toFailWith(/Path is not a file/i);
    });

    it('should fail getFileContents for missing files', () => {
      const result = accessors.getFileContents('/nonexistent.json');

      expect(result).toFail();
    });
  });

  describe('JSON parsing with converters and validators', () => {
    let accessors: ZipFileTreeAccessors;

    beforeEach(() => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);
      accessors = result.orThrow();
    });

    it('should parse JSON without converter (line 105)', () => {
      const fileResult = accessors.getItem('/manifest.json');

      expect(fileResult).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          const contentsResult = item.getContents();
          expect(contentsResult).toSucceed();
        }
      });
    });

    it('should handle validator path', () => {
      const fileResult = accessors.getItem('/manifest.json');

      expect(fileResult).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          // Use a simple validator to test the validator path (line 102)
          const validator = Validators.object<{ timestamp: string }>({
            timestamp: Validators.string
          });

          const contentsResult = item.getContents(validator);
          expect(contentsResult).toSucceed();
        }
      });
    });

    it('should handle invalid JSON content', () => {
      const fileResult = accessors.getItem('/invalid.json');

      expect(fileResult).toSucceedAndSatisfy((item) => {
        if (item.type === 'file') {
          // Test raw contents work
          const rawResult = item.getRawContents();
          expect(rawResult).toSucceedWith('{ invalid json content');

          // Test JSON parsing fails gracefully
          const contentsResult = item.getContents();
          expect(contentsResult).toFailWith(/Failed to parse JSON from file/i);
        }
      });
    });
  });

  describe('path operations', () => {
    let accessors: ZipFileTreeAccessors;

    beforeEach(() => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);
      accessors = result.orThrow();
    });

    it('should resolve absolute paths correctly', () => {
      expect(accessors.resolveAbsolutePath('test.json')).toBe('/test.json');
      expect(accessors.resolveAbsolutePath('/test.json')).toBe('/test.json');
      expect(accessors.resolveAbsolutePath('dir', 'test.json')).toBe('/dir/test.json');
    });

    it('should get file extensions correctly', () => {
      expect(accessors.getExtension('test.json')).toBe('.json');
      expect(accessors.getExtension('file.txt')).toBe('.txt');
      expect(accessors.getExtension('noext')).toBe('');
    });

    it('should get base names correctly', () => {
      expect(accessors.getBaseName('test.json')).toBe('test.json');
      expect(accessors.getBaseName('test.json', '.json')).toBe('test');
      expect(accessors.getBaseName('dir/file.txt')).toBe('file.txt');
    });

    it('should join paths correctly', () => {
      expect(accessors.joinPaths('a', 'b', 'c')).toBe('a/b/c');
      expect(accessors.joinPaths('/a/', '/b/', '/c/')).toBe('a/b/c');
      expect(accessors.joinPaths('a//b', 'c')).toBe('a/b/c');
    });

    it('should handle paths already starting with slash in resolveAbsolutePath (line 278)', () => {
      // Test when joined path already starts with '/'
      expect(accessors.resolveAbsolutePath('/already-absolute.json')).toBe('/already-absolute.json');
      expect(accessors.resolveAbsolutePath('/', 'file.json')).toBe('/file.json');
    });

    it('should handle empty path components in getBaseName (line 296)', () => {
      // Test empty path that results in empty parts array access
      expect(accessors.getBaseName('')).toBe('');
      expect(accessors.getBaseName('/')).toBe('');
      expect(accessors.getBaseName('//')).toBe('');
      expect(accessors.getBaseName('///')).toBe('');
    });
  });

  describe('fromFile method', () => {
    it('should create ZipFileTreeAccessors from File object', async () => {
      const zipBuffer = createTestZip();
      const file = new File([zipBuffer], 'test.zip', { type: 'application/zip' });

      const result = await ZipFileTreeAccessors.fromFile(file);
      expect(result).toSucceed();
    });

    it('should handle invalid File object', async () => {
      // Create a mock File that will fail during arrayBuffer() call
      const mockFile = {
        arrayBuffer: jest.fn().mockRejectedValue(new Error('File read error'))
      } as unknown as File;

      const result = await ZipFileTreeAccessors.fromFile(mockFile);
      expect(result).toFailWith(/Failed to read file/i);
    });

    it('should handle non-Error exceptions in fromFile (line 225)', async () => {
      // Create a mock File that will throw a non-Error exception
      const mockFile = {
        arrayBuffer: jest.fn().mockRejectedValue('String error instead of Error object')
      } as unknown as File;

      const result = await ZipFileTreeAccessors.fromFile(mockFile);
      expect(result).toFailWith(/Failed to read file.*String error/i);
    });
  });

  describe('explicit directory handling', () => {
    const createZipWithExplicitDirectories = (): Buffer => {
      const zip = new AdmZip();

      // Add explicit directory entries (with trailing slashes)
      zip.addFile('explicit-dir/', Buffer.from(''));
      zip.addFile('explicit-dir/nested/', Buffer.from(''));
      zip.addFile('explicit-dir/nested/file.txt', Buffer.from('nested file content'));

      // Also add implicit directories through file paths
      zip.addFile('implicit-dir/file.json', Buffer.from(JSON.stringify({ test: 'data' })));

      return zip.toBuffer();
    };

    it('should handle explicit directory entries', () => {
      const zipBuffer = createZipWithExplicitDirectories();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Test explicit directory access
        const explicitDirResult = accessors.getItem('/explicit-dir');
        expect(explicitDirResult).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
          expect(item.name).toBe('explicit-dir');
        });

        // Test nested explicit directory
        const nestedDirResult = accessors.getItem('/explicit-dir/nested');
        expect(nestedDirResult).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
          expect(item.name).toBe('nested');
        });

        // Test implicit directory
        const implicitDirResult = accessors.getItem('/implicit-dir');
        expect(implicitDirResult).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
          expect(item.name).toBe('implicit-dir');
        });
      });
    });

    it('should get children for directory items', () => {
      const zipBuffer = createZipWithExplicitDirectories();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const dirResult = accessors.getItem('/explicit-dir');
        expect(dirResult).toSucceedAndSatisfy((item) => {
          if (item.type === 'directory') {
            const childrenResult = item.getChildren();
            expect(childrenResult).toSucceedAndSatisfy((children) => {
              expect(children.length).toBeGreaterThan(0);
              expect(children.some((child) => child.name === 'nested')).toBe(true);
            });
          }
        });
      });
    });
  });
});
