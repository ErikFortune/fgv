/*
 * Copyright (c) 2026 Erik Fortune
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
import { createZipFromTextFiles, IZipTextFile } from '../../packlets/zip-file-tree';
import { ZipFileTreeAccessors } from '../../packlets/zip-file-tree';

describe('createZipFromTextFiles', () => {
  describe('basic file creation', () => {
    it('should create a zip from a single text file', () => {
      const files: IZipTextFile[] = [{ path: 'hello.txt', contents: 'Hello, World!' }];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        expect(zipData).toBeInstanceOf(Uint8Array);
        expect(zipData.length).toBeGreaterThan(0);

        // Verify the zip can be read back
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          const fileResult = accessors.getItem('/hello.txt');
          expect(fileResult).toSucceedAndSatisfy((item) => {
            expect(item.type).toBe('file');
            if (item.type === 'file') {
              expect(item.getRawContents()).toSucceedWith('Hello, World!');
            }
          });
        });
      });
    });

    it('should create a zip from multiple text files', () => {
      const files: IZipTextFile[] = [
        { path: 'file1.txt', contents: 'Content 1' },
        { path: 'file2.txt', contents: 'Content 2' },
        { path: 'file3.json', contents: '{"key": "value"}' }
      ];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/file1.txt')).toSucceedWith('Content 1');
          expect(accessors.getFileContents('/file2.txt')).toSucceedWith('Content 2');
          expect(accessors.getFileContents('/file3.json')).toSucceedWith('{"key": "value"}');
        });
      });
    });

    it('should create a zip with files in nested directories', () => {
      const files: IZipTextFile[] = [
        { path: 'root.txt', contents: 'root content' },
        { path: 'dir1/file1.txt', contents: 'dir1 content' },
        { path: 'dir1/dir2/file2.txt', contents: 'nested content' },
        { path: 'other/path/deep/file.json', contents: '{}' }
      ];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/root.txt')).toSucceedWith('root content');
          expect(accessors.getFileContents('/dir1/file1.txt')).toSucceedWith('dir1 content');
          expect(accessors.getFileContents('/dir1/dir2/file2.txt')).toSucceedWith('nested content');
          expect(accessors.getFileContents('/other/path/deep/file.json')).toSucceedWith('{}');

          // Verify directories are accessible
          const dir1Result = accessors.getItem('/dir1');
          expect(dir1Result).toSucceedAndSatisfy((item) => {
            expect(item.type).toBe('directory');
          });
        });
      });
    });
  });

  describe('path normalization', () => {
    it('should normalize paths with single leading slash', () => {
      const files: IZipTextFile[] = [{ path: '/leading-slash.txt', contents: 'content' }];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          // Path should be normalized - leading slash removed
          expect(accessors.getFileContents('/leading-slash.txt')).toSucceedWith('content');
        });
      });
    });

    it('should normalize paths with multiple leading slashes', () => {
      const files: IZipTextFile[] = [{ path: '///multiple-slashes.txt', contents: 'content' }];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/multiple-slashes.txt')).toSucceedWith('content');
        });
      });
    });

    it('should handle mixed paths with and without leading slashes', () => {
      const files: IZipTextFile[] = [
        { path: 'no-slash.txt', contents: 'no slash' },
        { path: '/with-slash.txt', contents: 'with slash' },
        { path: '//double-slash.txt', contents: 'double slash' }
      ];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/no-slash.txt')).toSucceedWith('no slash');
          expect(accessors.getFileContents('/with-slash.txt')).toSucceedWith('with slash');
          expect(accessors.getFileContents('/double-slash.txt')).toSucceedWith('double slash');
        });
      });
    });

    it('should normalize nested paths with leading slashes', () => {
      const files: IZipTextFile[] = [{ path: '/dir/subdir/file.txt', contents: 'nested' }];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/dir/subdir/file.txt')).toSucceedWith('nested');
        });
      });
    });
  });

  describe('compression options', () => {
    it('should use default compression level (6) when not specified', () => {
      const files: IZipTextFile[] = [
        { path: 'compressible.txt', contents: 'a'.repeat(1000) } // Highly compressible
      ];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        // Compressed size should be much smaller than uncompressed
        expect(zipData.length).toBeLessThan(1000);

        // Verify content is still correct
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/compressible.txt')).toSucceedWith('a'.repeat(1000));
        });
      });
    });

    it('should respect explicit compression level 0 (no compression)', () => {
      const files: IZipTextFile[] = [{ path: 'uncompressed.txt', contents: 'a'.repeat(1000) }];

      const uncompressedResult = createZipFromTextFiles(files, { level: 0 });
      const compressedResult = createZipFromTextFiles(files, { level: 9 });

      expect(uncompressedResult).toSucceedAndSatisfy((uncompressedZip) => {
        expect(compressedResult).toSucceedAndSatisfy((compressedZip) => {
          // Uncompressed should be larger than compressed
          expect(uncompressedZip.length).toBeGreaterThan(compressedZip.length);

          // Both should still have correct content
          const uncompressedAccessors = ZipFileTreeAccessors.fromBuffer(
            Buffer.from(uncompressedZip)
          ).orThrow();
          const compressedAccessors = ZipFileTreeAccessors.fromBuffer(Buffer.from(compressedZip)).orThrow();

          expect(uncompressedAccessors.getFileContents('/uncompressed.txt')).toSucceedWith('a'.repeat(1000));
          expect(compressedAccessors.getFileContents('/uncompressed.txt')).toSucceedWith('a'.repeat(1000));
        });
      });
    });

    it('should respect explicit compression level 9 (maximum compression)', () => {
      const files: IZipTextFile[] = [{ path: 'max-compressed.txt', contents: 'abcdefghij'.repeat(100) }];

      const result = createZipFromTextFiles(files, { level: 9 });

      expect(result).toSucceedAndSatisfy((zipData) => {
        // Should be compressed
        expect(zipData.length).toBeLessThan(1000);

        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/max-compressed.txt')).toSucceedWith('abcdefghij'.repeat(100));
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty file array', () => {
      const files: IZipTextFile[] = [];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        expect(zipData).toBeInstanceOf(Uint8Array);
        expect(zipData.length).toBeGreaterThan(0); // Even empty zip has header

        // Verify it's a valid zip
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          // Should have no files
          const rootChildren = accessors.getChildren('/');
          expect(rootChildren).toSucceedAndSatisfy((children) => {
            expect(children).toHaveLength(0);
          });
        });
      });
    });

    it('should handle files with empty contents', () => {
      const files: IZipTextFile[] = [
        { path: 'empty.txt', contents: '' },
        { path: 'not-empty.txt', contents: 'has content' }
      ];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/empty.txt')).toSucceedWith('');
          expect(accessors.getFileContents('/not-empty.txt')).toSucceedWith('has content');
        });
      });
    });

    it('should handle files with unicode content', () => {
      const files: IZipTextFile[] = [
        { path: 'unicode.txt', contents: 'Hello, \u4e16\u754c! \u{1F600}' }, // "Hello, 世界! 😀"
        { path: 'emoji.txt', contents: '🎉🎊🎁' }
      ];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/unicode.txt')).toSucceedWith('Hello, 世界! 😀');
          expect(accessors.getFileContents('/emoji.txt')).toSucceedWith('🎉🎊🎁');
        });
      });
    });

    it('should handle files with special characters in paths', () => {
      const files: IZipTextFile[] = [
        { path: 'file with spaces.txt', contents: 'spaces' },
        { path: 'dir with spaces/nested file.txt', contents: 'nested spaces' }
      ];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/file with spaces.txt')).toSucceedWith('spaces');
          expect(accessors.getFileContents('/dir with spaces/nested file.txt')).toSucceedWith(
            'nested spaces'
          );
        });
      });
    });

    it('should handle large content', () => {
      const largeContent = 'x'.repeat(100000); // 100KB
      const files: IZipTextFile[] = [{ path: 'large.txt', contents: largeContent }];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        // Should be compressed significantly
        expect(zipData.length).toBeLessThan(largeContent.length);

        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          expect(accessors.getFileContents('/large.txt')).toSucceedWith(largeContent);
        });
      });
    });

    it('should handle JSON content correctly', () => {
      const jsonContent = JSON.stringify(
        {
          name: 'test',
          values: [1, 2, 3],
          nested: { key: 'value' }
        },
        null,
        2
      );

      const files: IZipTextFile[] = [{ path: 'data.json', contents: jsonContent }];

      const result = createZipFromTextFiles(files);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          const contentResult = accessors.getFileContents('/data.json');
          expect(contentResult).toSucceedAndSatisfy((content) => {
            const parsed = JSON.parse(content);
            expect(parsed.name).toBe('test');
            expect(parsed.values).toEqual([1, 2, 3]);
            expect(parsed.nested.key).toBe('value');
          });
        });
      });
    });
  });

  describe('round-trip verification', () => {
    it('should create zips that can be read back with identical content', () => {
      const originalFiles: IZipTextFile[] = [
        { path: 'readme.md', contents: '# README\n\nThis is a test.' },
        { path: 'src/index.ts', contents: 'export const foo = 42;' },
        { path: 'src/utils/helper.ts', contents: 'export function helper() {}' },
        { path: 'config.json', contents: '{"version": "1.0.0"}' }
      ];

      const result = createZipFromTextFiles(originalFiles);

      expect(result).toSucceedAndSatisfy((zipData) => {
        const accessorsResult = ZipFileTreeAccessors.fromBuffer(Buffer.from(zipData));
        expect(accessorsResult).toSucceedAndSatisfy((accessors) => {
          // Verify each file matches exactly
          for (const file of originalFiles) {
            const normalizedPath = '/' + file.path.replace(/^\/+/, '');
            expect(accessors.getFileContents(normalizedPath)).toSucceedWith(file.contents);
          }
        });
      });
    });
  });
});
