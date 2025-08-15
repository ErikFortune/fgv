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
import { zipSync, Zippable } from 'fflate';
import { Validators, fail } from '@fgv/ts-utils';
import { ZipFileTreeAccessors } from '../../packlets/zip-file-tree';

describe('ZipFileTreeAccessors', () => {
  const createTestZip = (): Buffer => {
    const files: Zippable = {};

    // Add some test files with various extensions and structures
    files['manifest.json'] = new TextEncoder().encode(
      JSON.stringify({
        timestamp: '2025-07-22T00:00:00.000Z',
        input: { type: 'directory', path: 'input/test' }
      })
    );
    files['input/test/file1.json'] = new TextEncoder().encode(
      JSON.stringify({ name: 'file1', data: 'test data 1' })
    );
    files['input/test/file2.json'] = new TextEncoder().encode(
      JSON.stringify({ name: 'file2', data: 'test data 2' })
    );
    files['config/settings.json'] = new TextEncoder().encode(
      JSON.stringify({ setting1: 'value1', setting2: 'value2' })
    );
    // Add files with various extensions and edge cases
    files['script.min.js'] = new TextEncoder().encode('console.log("minified");');
    files.README = new TextEncoder().encode('This file has no extension');
    files['docs/guide.md'] = new TextEncoder().encode('# Guide\n\nContent here');
    files['assets/image.png'] = new TextEncoder().encode('fake-png-data');
    files['invalid.json'] = new TextEncoder().encode('{ invalid json content');

    return Buffer.from(zipSync(files));
  };

  const createEmptyZip = (): Buffer => {
    const files: Zippable = {};
    return Buffer.from(zipSync(files));
  };

  const createDirectoryOnlyZip = (): Buffer => {
    const files: Zippable = {};
    // fflate doesn't store empty directories, so we'll add placeholder files
    files['dir1/.keep'] = new Uint8Array(0);
    files['dir2/.keep'] = new Uint8Array(0);
    files['nested/dir/.keep'] = new Uint8Array(0);
    return Buffer.from(zipSync(files));
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
      const files: Zippable = {};

      // fflate doesn't have explicit directory entries, directories are implicit from file paths
      files['explicit-dir/nested/file.txt'] = new TextEncoder().encode('nested file content');

      // Also add implicit directories through file paths
      files['implicit-dir/file.json'] = new TextEncoder().encode(JSON.stringify({ test: 'data' }));

      return Buffer.from(zipSync(files));
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

  describe('fromBufferAsync method', () => {
    it('should create ZipFileTreeAccessors from buffer asynchronously', async () => {
      const zipBuffer = createTestZip();
      const result = await ZipFileTreeAccessors.fromBufferAsync(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const fileResult = accessors.getItem('/manifest.json');
        expect(fileResult).toSucceed();
      });
    });

    it('should create with prefix parameter asynchronously', async () => {
      const zipBuffer = createTestZip();
      const result = await ZipFileTreeAccessors.fromBufferAsync(zipBuffer, 'async-prefix');

      expect(result).toSucceedAndSatisfy((accessors) => {
        const resolved = accessors.resolveAbsolutePath('test.json');
        expect(resolved).toBe('/async-prefix/test.json');
      });
    });

    it('should handle invalid zip buffer asynchronously', async () => {
      const invalidBuffer = Buffer.from('not a zip file');
      const result = await ZipFileTreeAccessors.fromBufferAsync(invalidBuffer);

      expect(result).toFailWith(/Failed to load ZIP archive/i);
    });

    it('should handle Uint8Array input asynchronously', async () => {
      const zipBuffer = createTestZip();
      const uint8Buffer = new Uint8Array(zipBuffer);
      const result = await ZipFileTreeAccessors.fromBufferAsync(uint8Buffer);

      expect(result).toSucceed();
    });
  });

  describe('deep directory hierarchies', () => {
    const createDeepHierarchyZip = (): Buffer => {
      const files: Zippable = {};

      // Create a 6-level deep hierarchy
      files['level1/level2/level3/level4/level5/level6/deep-file.txt'] = new TextEncoder().encode(
        'deep content'
      );

      // Add files at various levels
      files['level1/root-level.json'] = new TextEncoder().encode(JSON.stringify({ level: 1 }));
      files['level1/level2/mid-level.txt'] = new TextEncoder().encode('middle content');
      files['level1/level2/level3/level4/near-deep.md'] = new TextEncoder().encode('# Near Deep\nContent');

      // Multiple branches
      files['level1/branch-a/file-a.txt'] = new TextEncoder().encode('branch a');
      files['level1/branch-b/file-b.txt'] = new TextEncoder().encode('branch b');
      files['level1/branch-b/sub-branch/sub-file.json'] = new TextEncoder().encode(
        JSON.stringify({ sub: true })
      );

      return Buffer.from(zipSync(files));
    };

    it('should handle deep directory structures (6+ levels)', () => {
      const zipBuffer = createDeepHierarchyZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Test deep file access
        const deepFile = accessors.getItem('/level1/level2/level3/level4/level5/level6/deep-file.txt');
        expect(deepFile).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          if (item.type === 'file') {
            expect(item.getRawContents()).toSucceedWith('deep content');
          }
        });

        // Test intermediate directories
        const level3Dir = accessors.getItem('/level1/level2/level3');
        expect(level3Dir).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
          expect(item.name).toBe('level3');
        });

        // Test directory children at various levels
        const level1Children = accessors.getChildren('/level1');
        expect(level1Children).toSucceedAndSatisfy((children) => {
          expect(children.length).toBe(4); // level2, root-level.json, branch-a, branch-b
          const hasLevel2 = children.some((c) => c.name === 'level2' && c.type === 'directory');
          const hasRootLevel = children.some((c) => c.name === 'root-level.json' && c.type === 'file');
          expect(hasLevel2).toBe(true);
          expect(hasRootLevel).toBe(true);
        });
      });
    });

    it('should handle multiple branches in directory tree', () => {
      const zipBuffer = createDeepHierarchyZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Test branch-a
        const branchA = accessors.getChildren('/level1/branch-a');
        expect(branchA).toSucceedAndSatisfy((children) => {
          expect(children).toHaveLength(1);
          expect(children[0].name).toBe('file-a.txt');
        });

        // Test branch-b with sub-branch
        const branchB = accessors.getChildren('/level1/branch-b');
        expect(branchB).toSucceedAndSatisfy((children) => {
          expect(children).toHaveLength(2); // file-b.txt and sub-branch
          const hasFile = children.some((c) => c.name === 'file-b.txt');
          const hasSubBranch = children.some((c) => c.name === 'sub-branch' && c.type === 'directory');
          expect(hasFile).toBe(true);
          expect(hasSubBranch).toBe(true);
        });
      });
    });
  });

  describe('special characters and edge cases', () => {
    const createSpecialCharZip = (): Buffer => {
      const files: Zippable = {};

      // Files with special characters in names
      files['special chars/file with spaces.txt'] = new TextEncoder().encode('spaces in path');
      files['unicode/résumé.txt'] = new TextEncoder().encode('unicode filename');
      files['symbols/file-with-dashes_and_underscores.json'] = new TextEncoder().encode(
        JSON.stringify({ special: true })
      );
      files['numbers/123-file.txt'] = new TextEncoder().encode('numeric prefix');

      // Edge case paths
      files['single-char/a'] = new TextEncoder().encode('single char file');
      files[
        'very-long-directory-name-that-tests-length-limits/very-long-file-name-that-also-tests-length-limits.extension'
      ] = new TextEncoder().encode('long names');

      // Multiple dots in filename
      files['multi-dot/file.backup.2024.01.15.json'] = new TextEncoder().encode(
        JSON.stringify({ backup: true })
      );

      return Buffer.from(zipSync(files));
    };

    it('should handle files with spaces in paths', () => {
      const zipBuffer = createSpecialCharZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const spaceFile = accessors.getItem('/special chars/file with spaces.txt');
        expect(spaceFile).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          expect(item.name).toBe('file with spaces.txt');
          if (item.type === 'file') {
            expect(item.getRawContents()).toSucceedWith('spaces in path');
          }
        });

        // Test directory with spaces
        const spaceDir = accessors.getItem('/special chars');
        expect(spaceDir).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('directory');
          expect(item.name).toBe('special chars');
        });
      });
    });

    it('should handle unicode characters in filenames', () => {
      const zipBuffer = createSpecialCharZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const unicodeFile = accessors.getItem('/unicode/résumé.txt');
        expect(unicodeFile).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          expect(item.name).toBe('résumé.txt');
          if (item.type === 'file') {
            expect(item.extension).toBe('.txt');
            expect(item.baseName).toBe('résumé');
          }
        });
      });
    });

    it('should handle complex filename extensions', () => {
      const zipBuffer = createSpecialCharZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // File with multiple dots
        const multiDotFile = accessors.getItem('/multi-dot/file.backup.2024.01.15.json');
        expect(multiDotFile).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            expect(item.extension).toBe('.json'); // Should get last extension
            expect(item.baseName).toBe('file.backup.2024.01.15');
            expect(item.name).toBe('file.backup.2024.01.15.json');
          }
        });

        // File with very long extension
        const longExtFile = accessors.getItem(
          '/very-long-directory-name-that-tests-length-limits/very-long-file-name-that-also-tests-length-limits.extension'
        );
        expect(longExtFile).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            expect(item.extension).toBe('.extension');
            expect(item.baseName).toBe('very-long-file-name-that-also-tests-length-limits');
          }
        });
      });
    });

    it('should handle edge case filenames', () => {
      const zipBuffer = createSpecialCharZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Single character filename
        const singleChar = accessors.getItem('/single-char/a');
        expect(singleChar).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          expect(item.name).toBe('a');
          if (item.type === 'file') {
            expect(item.extension).toBe('');
            expect(item.baseName).toBe('a');
          }
        });

        // Symbols and mixed characters
        const symbolFile = accessors.getItem('/symbols/file-with-dashes_and_underscores.json');
        expect(symbolFile).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          expect(item.name).toBe('file-with-dashes_and_underscores.json');
        });
      });
    });
  });

  describe('large content and stress tests', () => {
    const createLargeContentZip = (): Buffer => {
      const files: Zippable = {};

      // Large text content
      const largeText = 'x'.repeat(50000); // 50KB of text
      files['large/large-text.txt'] = new TextEncoder().encode(largeText);

      // Large JSON content
      const largeObject = {
        data: Array(1000)
          .fill(0)
          .map((unused, i) => ({ id: i, value: `item-${i}`, nested: { count: i * 2 } }))
      };
      files['large/large-json.json'] = new TextEncoder().encode(JSON.stringify(largeObject));

      // Binary-like data (simulated)
      const binaryData = new Uint8Array(1000);
      for (let i = 0; i < binaryData.length; i++) {
        binaryData[i] = i % 256;
      }
      files['binary/data.bin'] = binaryData;

      return Buffer.from(zipSync(files));
    };

    const createManyFilesZip = (): Buffer => {
      const files: Zippable = {};

      // Create many directories and files
      for (let dir = 0; dir < 20; dir++) {
        for (let file = 0; file < 10; file++) {
          const path = `dir${dir}/file${file}.txt`;
          files[path] = new TextEncoder().encode(`Content for dir ${dir} file ${file}`);
        }
      }

      return Buffer.from(zipSync(files));
    };

    it('should handle large text files', () => {
      const zipBuffer = createLargeContentZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const largeFile = accessors.getItem('/large/large-text.txt');
        expect(largeFile).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            const content = item.getRawContents();
            expect(content).toSucceedAndSatisfy((text) => {
              expect(text.length).toBe(50000);
              expect(text).toMatch(/^x+$/);
            });
          }
        });
      });
    });

    it('should handle large JSON files', () => {
      const zipBuffer = createLargeContentZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const jsonFile = accessors.getItem('/large/large-json.json');
        expect(jsonFile).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            // Just check that we can parse it without error
            const content = item.getContents();
            expect(content).toSucceed();

            // And check the raw contents can be parsed as JSON
            const rawResult = item.getRawContents();
            expect(rawResult).toSucceedAndSatisfy((rawText) => {
              const parsed = JSON.parse(rawText);
              expect(parsed).toHaveProperty('data');
              expect(parsed.data).toHaveLength(1000);
              expect(parsed.data[0]).toMatchObject({ id: 0, value: 'item-0' });
            });
          }
        });
      });
    });

    it('should handle binary-like data', () => {
      const zipBuffer = createLargeContentZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const binaryFile = accessors.getItem('/binary/data.bin');
        expect(binaryFile).toSucceedAndSatisfy((item) => {
          expect(item.type).toBe('file');
          if (item.type === 'file') {
            expect(item.extension).toBe('.bin');
            const content = item.getRawContents();
            expect(content).toSucceed(); // Should at least be readable as string
          }
        });
      });
    });

    it('should handle many files and directories efficiently', () => {
      const zipBuffer = createManyFilesZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Test that we can access random files efficiently
        const file1 = accessors.getItem('/dir5/file3.txt');
        expect(file1).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            expect(item.getRawContents()).toSucceedWith('Content for dir 5 file 3');
          }
        });

        const file2 = accessors.getItem('/dir15/file7.txt');
        expect(file2).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            expect(item.getRawContents()).toSucceedWith('Content for dir 15 file 7');
          }
        });

        // Test directory enumeration
        const dir10Children = accessors.getChildren('/dir10');
        expect(dir10Children).toSucceedAndSatisfy((children) => {
          expect(children).toHaveLength(10); // 10 files per directory
          expect(children.every((c) => c.type === 'file')).toBe(true);
        });
      });
    });
  });

  describe('converter and validator error scenarios', () => {
    const createConverterTestZip = (): Buffer => {
      const files: Zippable = {};

      // Valid JSON that will fail converter validation
      files['validation/valid-json-wrong-shape.json'] = new TextEncoder().encode(
        JSON.stringify({ wrongField: 'value', notExpected: true })
      );

      // JSON that passes basic parsing but fails complex validation
      files['validation/partial-valid.json'] = new TextEncoder().encode(
        JSON.stringify({ requiredField: 'present', missingField: undefined })
      );

      return Buffer.from(zipSync(files));
    };

    it('should handle converter validation failures', () => {
      const zipBuffer = createConverterTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const fileItem = accessors.getItem('/validation/valid-json-wrong-shape.json');
        expect(fileItem).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            // Test with malformed JSON - this should fail
            const rawContents = item.getRawContents();
            expect(rawContents).toSucceedAndSatisfy((contents) => {
              // Manually corrupt the JSON and try to parse it
              const corruptedJson = contents.replace('{', '{ "broken": ');
              expect(() => JSON.parse(corruptedJson)).toThrow();
            });
          }
        });
      });
    });

    it('should handle basic JSON parsing without converter', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const manifestItem = accessors.getItem('/manifest.json');
        expect(manifestItem).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            // Test the basic getContents without converter - should parse JSON successfully
            const basicResult = item.getContents();
            expect(basicResult).toSucceed();
          }
        });
      });
    });

    it('should handle JSON parse errors gracefully in getContents', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const invalidJsonItem = accessors.getItem('/invalid.json');
        expect(invalidJsonItem).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            // Should fail JSON parsing but provide clear error message
            const parseResult = item.getContents();
            expect(parseResult).toFailWith(/Failed to parse JSON from file.*invalid\.json/i);

            // But raw content should still work
            const rawResult = item.getRawContents();
            expect(rawResult).toSucceedWith('{ invalid json content');
          }
        });
      });
    });

    it('should handle getRawContents errors in getContents chain', () => {
      // This tests the error chaining in getContents when getRawContents fails
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const validItem = accessors.getItem('/manifest.json');
        expect(validItem).toSucceedAndSatisfy((item) => {
          if (item.type === 'file') {
            // Mock getRawContents to fail to test error propagation
            const originalGetRawContents = item.getRawContents;
            jest.spyOn(item, 'getRawContents').mockReturnValue(fail('Simulated raw content error'));

            const contentsResult = item.getContents();
            expect(contentsResult).toFailWith(
              /Failed to get contents from file.*Simulated raw content error/i
            );

            // Restore original method
            item.getRawContents = originalGetRawContents;
          }
        });
      });
    });
  });

  describe('complex path edge cases', () => {
    it('should handle complex path joining scenarios', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer, 'complex-prefix');

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Test various path joining combinations
        expect(accessors.joinPaths()).toBe('');
        expect(accessors.joinPaths('')).toBe('');
        expect(accessors.joinPaths('', '', '')).toBe('');
        expect(accessors.joinPaths('a', '', 'b')).toBe('a/b');
        expect(accessors.joinPaths('/a//', '//b//', '//c//')).toBe('a/b/c');

        // Test path resolution with prefix
        expect(accessors.resolveAbsolutePath('')).toBe('/complex-prefix');
        expect(accessors.resolveAbsolutePath('/', '')).toBe('/complex-prefix');
        expect(accessors.resolveAbsolutePath('a', 'b', 'c')).toBe('/complex-prefix/a/b/c');
      });
    });

    it('should handle getBaseName edge cases comprehensively', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Empty and root paths
        expect(accessors.getBaseName('')).toBe('');
        expect(accessors.getBaseName('/')).toBe('');
        expect(accessors.getBaseName('//')).toBe('');
        expect(accessors.getBaseName('///')).toBe('');

        // Paths with trailing slashes
        expect(accessors.getBaseName('dirname/')).toBe('dirname');
        expect(accessors.getBaseName('/path/to/dirname/')).toBe('dirname');

        // Single components
        expect(accessors.getBaseName('filename')).toBe('filename');
        expect(accessors.getBaseName('/filename')).toBe('filename');

        // Suffix removal
        expect(accessors.getBaseName('file.txt', '.txt')).toBe('file');
        expect(accessors.getBaseName('file.txt', '.exe')).toBe('file.txt'); // Wrong suffix
        expect(accessors.getBaseName('file', '.txt')).toBe('file'); // No suffix to remove
        expect(accessors.getBaseName('file.backup.txt', '.txt')).toBe('file.backup');
      });
    });

    it('should handle getExtension edge cases', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        // Standard cases
        expect(accessors.getExtension('file.txt')).toBe('.txt');
        expect(accessors.getExtension('path/to/file.json')).toBe('.json');

        // No extension cases
        expect(accessors.getExtension('file')).toBe('');
        expect(accessors.getExtension('path/to/file')).toBe('');
        expect(accessors.getExtension('')).toBe('');

        // Multiple dots
        expect(accessors.getExtension('file.backup.txt')).toBe('.txt');
        expect(accessors.getExtension('archive.tar.gz')).toBe('.gz');

        // Dot at beginning (hidden files)
        expect(accessors.getExtension('.hiddenfile')).toBe('.hiddenfile'); // Whole name is extension
        expect(accessors.getExtension('.hiddenfile.txt')).toBe('.txt');

        // Edge cases with dots
        expect(accessors.getExtension('file.')).toBe('.');
        expect(accessors.getExtension('file..')).toBe('.');
      });
    });

    it('should handle root level getChildren', () => {
      const zipBuffer = createTestZip();
      const result = ZipFileTreeAccessors.fromBuffer(zipBuffer);

      expect(result).toSucceedAndSatisfy((accessors) => {
        const rootChildren = accessors.getChildren('/');
        expect(rootChildren).toSucceedAndSatisfy((children) => {
          expect(children.length).toBeGreaterThan(0);
          // Should include top-level files and directories
          const hasManifest = children.some((c) => c.name === 'manifest.json' && c.type === 'file');
          const hasInput = children.some((c) => c.name === 'input' && c.type === 'directory');
          expect(hasManifest).toBe(true);
          expect(hasInput).toBe(true);
        });

        // Also test empty path for root
        const emptyPathChildren = accessors.getChildren('');
        expect(emptyPathChildren).toSucceedAndSatisfy((children) => {
          expect(children.length).toBe(rootChildren.value!.length);
        });
      });
    });
  });
});
