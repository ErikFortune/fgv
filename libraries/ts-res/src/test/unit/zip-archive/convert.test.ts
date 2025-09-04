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
import { Convert } from '../../../packlets/zip-archive';

describe('ZipArchive Convert namespace', () => {
  describe('zipArchiveInputInfo validator', () => {
    test('should validate valid file input info', () => {
      const validInput = {
        type: 'file' as const,
        originalPath: '/path/to/file.json',
        archivePath: 'file.json'
      };

      expect(Convert.zipArchiveInputInfo.validate(validInput)).toSucceedWith(validInput);
    });

    test('should validate valid directory input info', () => {
      const validInput = {
        type: 'directory' as const,
        originalPath: '/path/to/directory',
        archivePath: 'directory'
      };

      expect(Convert.zipArchiveInputInfo.validate(validInput)).toSucceedWith(validInput);
    });

    test('should fail with invalid type', () => {
      const invalidInput = {
        type: 'invalid',
        originalPath: '/path/to/file.json',
        archivePath: 'file.json'
      };

      expect(Convert.zipArchiveInputInfo.validate(invalidInput)).toFailWith(/type/i);
    });

    test('should fail with missing originalPath', () => {
      const invalidInput = {
        type: 'file',
        archivePath: 'file.json'
      };

      expect(Convert.zipArchiveInputInfo.validate(invalidInput)).toFailWith(/originalPath/i);
    });

    test('should fail with missing archivePath', () => {
      const invalidInput = {
        type: 'file',
        originalPath: '/path/to/file.json'
      };

      expect(Convert.zipArchiveInputInfo.validate(invalidInput)).toFailWith(/archivePath/i);
    });
  });

  describe('zipArchiveConfigInfo validator', () => {
    test('should validate valid config info', () => {
      const validConfig = {
        type: 'file' as const,
        originalPath: '/path/to/config.json',
        archivePath: 'config.json'
      };

      expect(Convert.zipArchiveConfigInfo.validate(validConfig)).toSucceedWith(validConfig);
    });

    test('should fail with invalid type', () => {
      const invalidConfig = {
        type: 'directory' as unknown as 'file',
        originalPath: '/path/to/config.json',
        archivePath: 'config.json'
      };

      expect(Convert.zipArchiveConfigInfo.validate(invalidConfig)).toFailWith(/type/i);
    });

    test('should fail with missing originalPath', () => {
      const invalidConfig = {
        type: 'file' as const,
        archivePath: 'config.json'
      };

      expect(Convert.zipArchiveConfigInfo.validate(invalidConfig)).toFailWith(/originalPath/i);
    });

    test('should fail with missing archivePath', () => {
      const invalidConfig = {
        type: 'file' as const,
        originalPath: '/path/to/config.json'
      };

      expect(Convert.zipArchiveConfigInfo.validate(invalidConfig)).toFailWith(/archivePath/i);
    });
  });

  describe('zipArchiveManifest validator', () => {
    test('should validate manifest with timestamp only', () => {
      const validManifest = {
        timestamp: '2025-01-15T10:30:00.000Z'
      };

      expect(Convert.zipArchiveManifest.validate(validManifest)).toSucceedWith(validManifest);
    });

    test('should validate complete manifest', () => {
      const completeManifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        input: {
          type: 'directory' as const,
          originalPath: '/path/to/directory',
          archivePath: 'directory'
        },
        config: {
          type: 'file' as const,
          originalPath: '/path/to/config.json',
          archivePath: 'config.json'
        }
      };

      expect(Convert.zipArchiveManifest.validate(completeManifest)).toSucceedWith(completeManifest);
    });

    test('should fail with missing timestamp', () => {
      const invalidManifest = {
        input: {
          type: 'file',
          originalPath: '/path/to/file.json',
          archivePath: 'file.json'
        }
      };

      expect(Convert.zipArchiveManifest.validate(invalidManifest)).toFailWith(/timestamp/i);
    });

    test('should fail with invalid timestamp type', () => {
      const invalidManifest = {
        timestamp: 1642248600000 as unknown as string
      };

      expect(Convert.zipArchiveManifest.validate(invalidManifest)).toFailWith(/timestamp/i);
    });

    test('should fail with invalid input info', () => {
      const invalidManifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        input: {
          type: 'invalid',
          originalPath: '/path/to/file.json',
          archivePath: 'file.json'
        }
      };

      expect(Convert.zipArchiveManifest.validate(invalidManifest)).toFailWith(/input/i);
    });

    test('should fail with invalid config info', () => {
      const invalidManifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        config: {
          type: 'file' as const,
          originalPath: 123 as unknown as string,
          archivePath: 'config.json'
        }
      };

      expect(Convert.zipArchiveManifest.validate(invalidManifest)).toFailWith(/config/i);
    });
  });

  describe('importedFile converter', () => {
    test('should convert valid file data', () => {
      const validFile = {
        name: 'test.json',
        path: 'resources/test.json',
        content: '{"key": "value"}',
        type: 'application/json'
      };

      expect(Convert.importedFile.convert(validFile)).toSucceedWith(validFile);
    });

    test('should fail with missing name', () => {
      const invalidFile = {
        path: 'resources/test.json',
        content: '{"key": "value"}',
        type: 'application/json'
      };

      expect(Convert.importedFile.convert(invalidFile)).toFailWith(/name/i);
    });

    test('should fail with missing path', () => {
      const invalidFile = {
        name: 'test.json',
        content: '{"key": "value"}',
        type: 'application/json'
      };

      expect(Convert.importedFile.convert(invalidFile)).toFailWith(/path/i);
    });

    test('should fail with missing content', () => {
      const invalidFile = {
        name: 'test.json',
        path: 'resources/test.json',
        type: 'application/json'
      };

      expect(Convert.importedFile.convert(invalidFile)).toFailWith(/content/i);
    });

    test('should fail with missing type', () => {
      const invalidFile = {
        name: 'test.json',
        path: 'resources/test.json',
        content: '{"key": "value"}'
      };

      expect(Convert.importedFile.convert(invalidFile)).toFailWith(/type/i);
    });

    test('should fail with invalid type for name', () => {
      const invalidFile = {
        name: 123 as unknown as string,
        path: 'resources/test.json',
        content: '{"key": "value"}',
        type: 'application/json'
      };

      expect(Convert.importedFile.convert(invalidFile)).toFailWith(/name/i);
    });
  });

  describe('importedDirectory converter', () => {
    test('should convert simple directory with files', () => {
      const validDirectory = {
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

      expect(Convert.importedDirectory.convert(validDirectory)).toSucceedWith(validDirectory);
    });

    test('should convert nested directory structure', () => {
      const nestedDirectory = {
        name: 'resources',
        files: [
          {
            name: 'root.json',
            path: 'resources/root.json',
            content: '{"level": "root"}',
            type: 'application/json'
          }
        ],
        subdirectories: [
          {
            name: 'config',
            files: [
              {
                name: 'app.json',
                path: 'resources/config/app.json',
                content: '{"app": "config"}',
                type: 'application/json'
              }
            ],
            subdirectories: [
              {
                name: 'deep',
                files: [
                  {
                    name: 'nested.json',
                    path: 'resources/config/deep/nested.json',
                    content: '{"nested": true}',
                    type: 'application/json'
                  }
                ],
                subdirectories: []
              }
            ]
          }
        ]
      };

      expect(Convert.importedDirectory.convert(nestedDirectory)).toSucceedWith(nestedDirectory);
    });

    test('should convert empty directory', () => {
      const emptyDirectory = {
        name: 'empty',
        files: [],
        subdirectories: []
      };

      expect(Convert.importedDirectory.convert(emptyDirectory)).toSucceedWith(emptyDirectory);
    });

    test('should fail with missing name', () => {
      const invalidDirectory = {
        files: [],
        subdirectories: []
      };

      expect(Convert.importedDirectory.convert(invalidDirectory)).toFailWith(/name/i);
    });

    test('should fail with missing files array', () => {
      const invalidDirectory = {
        name: 'resources',
        subdirectories: []
      };

      expect(Convert.importedDirectory.convert(invalidDirectory)).toFailWith(/files/i);
    });

    test('should fail with missing subdirectories array', () => {
      const invalidDirectory = {
        name: 'resources',
        files: []
      };

      expect(Convert.importedDirectory.convert(invalidDirectory)).toFailWith(/subdirectories/i);
    });

    test('should fail with invalid file in files array', () => {
      const invalidDirectory = {
        name: 'resources',
        files: [
          {
            name: 'test.json'
            // missing path, content, type
          }
        ],
        subdirectories: []
      };

      expect(Convert.importedDirectory.convert(invalidDirectory)).toFailWith(/files/i);
    });

    test('should fail with invalid subdirectory', () => {
      const invalidDirectory = {
        name: 'resources',
        files: [],
        subdirectories: [
          {
            // missing name, files, subdirectories
          }
        ]
      };

      expect(Convert.importedDirectory.convert(invalidDirectory)).toFailWith(/subdirectories/i);
    });

    test('should fail with non-array files', () => {
      const invalidDirectory = {
        name: 'resources',
        files: 'not-an-array' as unknown as Array<unknown>,
        subdirectories: []
      };

      expect(Convert.importedDirectory.convert(invalidDirectory)).toFailWith(/files/i);
    });

    test('should fail with non-array subdirectories', () => {
      const invalidDirectory = {
        name: 'resources',
        files: [],
        subdirectories: 'not-an-array' as unknown as Array<unknown>
      };

      expect(Convert.importedDirectory.convert(invalidDirectory)).toFailWith(/subdirectories/i);
    });
  });

  describe('mimeType validator', () => {
    test('should validate valid MIME types', () => {
      const validTypes = [
        'application/json',
        'text/plain',
        'text/html',
        'application/javascript',
        'image/png',
        'application/octet-stream'
      ];

      for (const type of validTypes) {
        expect(Convert.mimeType.validate(type)).toSucceedWith(type);
      }
    });

    test('should fail with non-string values', () => {
      const invalidTypes = [123, null, undefined, {}, []];

      for (const type of invalidTypes) {
        expect(Convert.mimeType.validate(type)).toFailWith(/string/i);
      }
    });
  });

  describe('systemConfiguration validator', () => {
    test('should validate valid system configuration', () => {
      const validConfig = {
        name: 'test-config',
        qualifierTypes: [],
        qualifiers: [],
        resourceTypes: []
      };

      expect(Convert.systemConfiguration.validate(validConfig)).toSucceedWith(validConfig);
    });

    test('should fail with invalid configuration', () => {
      const invalidConfig = {
        name: 123, // should be string
        qualifierTypes: 'invalid' // should be array
      };

      expect(Convert.systemConfiguration.validate(invalidConfig)).toFailWith(/system configuration/i);
    });

    test('should fail with null/undefined', () => {
      expect(Convert.systemConfiguration.validate(null)).toFailWith(/system configuration/i);
      expect(Convert.systemConfiguration.validate(undefined)).toFailWith(/system configuration/i);
    });
  });
});
