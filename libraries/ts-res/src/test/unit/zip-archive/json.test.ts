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
import { Json } from '../../../packlets/zip-archive';

describe('ZipArchive Json namespace', () => {
  describe('IZipArchiveManifest', () => {
    test('should define required timestamp field', () => {
      const manifest: Json.IZipArchiveManifest = {
        timestamp: '2025-01-15T10:30:00.000Z'
      };

      expect(manifest.timestamp).toBeDefined();
      expect(typeof manifest.timestamp).toBe('string');
    });

    test('should support optional input field', () => {
      const manifest: Json.IZipArchiveManifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        input: {
          type: 'file',
          originalPath: '/path/to/file.json',
          archivePath: 'file.json'
        }
      };

      expect(manifest.input).toBeDefined();
      expect(manifest.input?.type).toBe('file');
    });

    test('should support optional config field', () => {
      const manifest: Json.IZipArchiveManifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        config: {
          type: 'file',
          originalPath: '/path/to/config.json',
          archivePath: 'config.json'
        }
      };

      expect(manifest.config).toBeDefined();
      expect(manifest.config?.type).toBe('file');
    });
  });

  describe('IZipArchiveInputInfo', () => {
    test('should support file type', () => {
      const inputInfo: Json.IZipArchiveInputInfo = {
        type: 'file',
        originalPath: '/path/to/file.json',
        archivePath: 'file.json'
      };

      expect(inputInfo.type).toBe('file');
      expect(inputInfo.originalPath).toBe('/path/to/file.json');
      expect(inputInfo.archivePath).toBe('file.json');
    });

    test('should support directory type', () => {
      const inputInfo: Json.IZipArchiveInputInfo = {
        type: 'directory',
        originalPath: '/path/to/directory',
        archivePath: 'directory'
      };

      expect(inputInfo.type).toBe('directory');
      expect(inputInfo.originalPath).toBe('/path/to/directory');
      expect(inputInfo.archivePath).toBe('directory');
    });
  });

  describe('IZipArchiveConfigInfo', () => {
    test('should support file type', () => {
      const configInfo: Json.IZipArchiveConfigInfo = {
        type: 'file',
        originalPath: '/path/to/config.json',
        archivePath: 'config.json'
      };

      expect(configInfo.type).toBe('file');
      expect(configInfo.originalPath).toBe('/path/to/config.json');
      expect(configInfo.archivePath).toBe('config.json');
    });
  });

  describe('IImportedFile', () => {
    test('should define file structure', () => {
      const file: Json.IImportedFile = {
        name: 'test.json',
        path: 'resources/test.json',
        content: '{"key": "value"}',
        type: 'application/json'
      };

      expect(file.name).toBe('test.json');
      expect(file.path).toBe('resources/test.json');
      expect(file.content).toBe('{"key": "value"}');
      expect(file.type).toBe('application/json');
    });
  });

  describe('IImportedDirectory', () => {
    test('should define directory structure', () => {
      const directory: Json.IImportedDirectory = {
        name: 'resources',
        files: [
          {
            name: 'test.json',
            path: 'resources/test.json',
            content: '{"key": "value"}',
            type: 'application/json'
          }
        ],
        subdirectories: []
      };

      expect(directory.name).toBe('resources');
      expect(directory.files).toHaveLength(1);
      expect(directory.subdirectories).toHaveLength(0);
    });
  });
});
