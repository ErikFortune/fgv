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
import {
  createZipArchiveManifest,
  parseZipArchiveManifest,
  validateZipArchiveManifest,
  parseZipArchiveConfiguration,
  generateZipArchiveFilename,
  normalizePath,
  getDirectoryName,
  sanitizeFilename,
  isZipFile
} from '../../../packlets/zip-archive';

describe('ZipArchiveFormat utilities', () => {
  describe('createZipArchiveManifest', () => {
    test('should create manifest for file input', () => {
      const manifest = createZipArchiveManifest('file', '/path/to/file.json', 'file.json');

      expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(manifest.input).toBeDefined();
      expect(manifest.input?.type).toBe('file');
      expect(manifest.input?.originalPath).toBe('/path/to/file.json');
      expect(manifest.input?.archivePath).toBe('file.json');
    });

    test('should create manifest for directory input', () => {
      const manifest = createZipArchiveManifest('directory', '/path/to/dir', 'dir');

      expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(manifest.input).toBeDefined();
      expect(manifest.input?.type).toBe('directory');
      expect(manifest.input?.originalPath).toBe('/path/to/dir');
      expect(manifest.input?.archivePath).toBe('dir');
    });

    test('should create manifest with input even when paths are empty', () => {
      const manifest = createZipArchiveManifest('file', '', '');

      expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(manifest.input).toBeDefined();
      expect(manifest.input?.type).toBe('file');
      expect(manifest.input?.originalPath).toBe('');
      expect(manifest.input?.archivePath).toBe('');
    });

    test('should create manifest with config file when configPath is provided', () => {
      const manifest = createZipArchiveManifest('directory', '/path/to/dir', 'dir', '/path/to/config.json');

      expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(manifest.input).toBeDefined();
      expect(manifest.input?.type).toBe('directory');
      expect(manifest.input?.originalPath).toBe('/path/to/dir');
      expect(manifest.input?.archivePath).toBe('dir');

      // This is the missing coverage - config creation when configPath is provided
      expect(manifest.config).toBeDefined();
      expect(manifest.config?.type).toBe('file');
      expect(manifest.config?.originalPath).toBe('/path/to/config.json');
      expect(manifest.config?.archivePath).toBe('config.json');
    });

    test('should create manifest without config when configPath is not provided', () => {
      const manifest = createZipArchiveManifest('file', '/path/to/file.json', 'file.json');

      expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(manifest.input).toBeDefined();
      expect(manifest.config).toBeUndefined();
    });

    test('should create manifest without config when configPath is empty string', () => {
      const manifest = createZipArchiveManifest('file', '/path/to/file.json', 'file.json', '');

      expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(manifest.input).toBeDefined();
      expect(manifest.config).toBeUndefined();
    });
  });

  describe('parseZipArchiveManifest', () => {
    test('should parse valid manifest JSON', () => {
      const manifestJson = JSON.stringify({
        timestamp: '2025-01-15T10:30:00.000Z',
        input: {
          type: 'file',
          originalPath: '/path/to/file.json',
          archivePath: 'file.json'
        }
      });

      expect(parseZipArchiveManifest(manifestJson)).toSucceedAndSatisfy((manifest) => {
        expect(manifest.timestamp).toBe('2025-01-15T10:30:00.000Z');
        expect(manifest.input?.type).toBe('file');
      });
    });

    test('should fail with invalid JSON', () => {
      const invalidJson = '{ "timestamp": "2025-01-15T10:30:00.000Z", invalid }';

      expect(parseZipArchiveManifest(invalidJson)).toFailWith(/parse.*manifest/i);
    });

    test('should fail with manifest missing required fields', () => {
      const invalidManifest = JSON.stringify({
        input: {
          type: 'file',
          originalPath: '/path/to/file.json',
          archivePath: 'file.json'
        }
      });

      expect(parseZipArchiveManifest(invalidManifest)).toFailWith(/timestamp.*not found/i);
    });
  });

  describe('validateZipArchiveManifest', () => {
    test('should validate correct manifest object', () => {
      const validManifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        input: {
          type: 'file' as const,
          originalPath: '/path/to/file.json',
          archivePath: 'file.json'
        }
      };

      expect(validateZipArchiveManifest(validManifest)).toSucceedWith(validManifest);
    });

    test('should fail with invalid manifest object', () => {
      const invalidManifest = {
        timestamp: 1642248600000,
        input: {
          type: 'file',
          originalPath: '/path/to/file.json',
          archivePath: 'file.json'
        }
      };

      expect(validateZipArchiveManifest(invalidManifest)).toFailWith(/not a string/i);
    });
  });

  describe('parseZipArchiveConfiguration', () => {
    test('should parse valid configuration JSON', () => {
      const configJson = JSON.stringify({
        name: 'test-config',
        qualifierTypes: [],
        qualifiers: [],
        resourceTypes: []
      });

      expect(parseZipArchiveConfiguration(configJson)).toSucceedAndSatisfy((config) => {
        expect(config.name).toBe('test-config');
        expect(config.qualifierTypes).toEqual([]);
        expect(config.qualifiers).toEqual([]);
        expect(config.resourceTypes).toEqual([]);
      });
    });

    test('should fail with invalid JSON', () => {
      const invalidJson = '{ "compression": 6, invalid }';

      expect(parseZipArchiveConfiguration(invalidJson)).toFailWith(/parse.*config/i);
    });

    test('should fail with invalid configuration object', () => {
      const invalidConfig = JSON.stringify({
        name: 123,
        qualifierTypes: 'invalid'
      });

      expect(parseZipArchiveConfiguration(invalidConfig)).toFailWith(/invalid.*config/i);
    });
  });

  describe('generateZipArchiveFilename', () => {
    test('should generate filename with timestamp', () => {
      const filename = generateZipArchiveFilename('test-data');

      expect(filename).toMatch(/^test-data-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/);
    });

    test('should sanitize base name', () => {
      const filename = generateZipArchiveFilename('test/data with spaces');

      expect(filename).toMatch(/^test\/data with spaces-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/);
    });

    test('should handle empty base name', () => {
      const filename = generateZipArchiveFilename('');

      expect(filename).toMatch(/^ts-res-archive-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/);
    });
  });

  describe('normalizePath', () => {
    test('should normalize path separators', () => {
      expect(normalizePath('path\\to\\file')).toBe('path/to/file');
      expect(normalizePath('path/to/file')).toBe('path/to/file');
    });

    test('should normalize path separators', () => {
      expect(normalizePath('/path/to/file')).toBe('/path/to/file');
      expect(normalizePath('\\path\\to\\file')).toBe('/path/to/file');
    });

    test('should handle empty path', () => {
      expect(normalizePath('')).toBe('');
    });
  });

  describe('getDirectoryName', () => {
    test('should extract directory name from path', () => {
      expect(getDirectoryName('/path/to/directory')).toBe('directory');
      expect(getDirectoryName('C:\\path\\to\\directory')).toBe('directory');
    });

    test('should handle path with trailing separators', () => {
      expect(getDirectoryName('/path/to/directory/')).toBe('archive');
      expect(getDirectoryName('C:\\path\\to\\directory\\')).toBe('archive');
    });

    test('should handle root path', () => {
      expect(getDirectoryName('/')).toBe('archive');
      expect(getDirectoryName('C:\\')).toBe('archive');
    });

    test('should handle single directory name', () => {
      expect(getDirectoryName('directory')).toBe('directory');
    });
  });

  describe('sanitizeFilename', () => {
    test('should sanitize invalid characters', () => {
      expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file_.txt');
    });

    test('should replace spaces with underscores', () => {
      expect(sanitizeFilename('file name with spaces.txt')).toBe('file_name_with_spaces.txt');
    });

    test('should handle path separators', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
    });

    test('should handle empty filename', () => {
      expect(sanitizeFilename('')).toBe('');
    });
  });

  describe('isZipFile', () => {
    test('should detect zip files by extension', () => {
      expect(isZipFile('archive.zip')).toBe(true);
      expect(isZipFile('ARCHIVE.ZIP')).toBe(true);
      expect(isZipFile('path/to/archive.zip')).toBe(true);
    });

    test('should reject non-zip files', () => {
      expect(isZipFile('archive.txt')).toBe(false);
      expect(isZipFile('archive.tar.gz')).toBe(false);
      expect(isZipFile('archive')).toBe(false);
    });

    test('should handle empty filename', () => {
      expect(isZipFile('')).toBe(false);
    });
  });
});
