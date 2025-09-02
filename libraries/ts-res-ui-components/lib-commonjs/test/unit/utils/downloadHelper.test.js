'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
require('@fgv/ts-utils-jest');
const downloadHelper_1 = require('../../../utils/downloadHelper');
describe('DownloadUtils', () => {
  // Mock DOM APIs
  let mockLink;
  let mockBlob;
  let mockURL;
  let appendChildSpy;
  let removeChildSpy;
  let createObjectURLSpy;
  let revokeObjectURLSpy;
  let clickSpy;
  beforeEach(() => {
    // Mock DOM elements and APIs
    mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: jest.fn()
    };
    mockURL = 'blob:mock-url';
    // Mock document methods
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockLink;
      }
      return {};
    });
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    // Mock URL methods
    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue(mockURL);
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    // Mock click
    clickSpy = mockLink.click;
    // Mock Blob constructor
    global.Blob = jest.fn().mockImplementation((content, options) => {
      mockBlob = {
        size: content.join('').length,
        type: options?.type || 'text/plain'
      };
      return mockBlob;
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('createTimestamp', () => {
    test('should use custom format when provided', () => {
      const customFormat = '2024-01-15-10-30-00';
      const result = downloadHelper_1.DownloadUtils.createTimestamp(customFormat);
      expect(result).toBe(customFormat);
    });
    test('should generate ISO timestamp with colons replaced when no custom format', () => {
      // Mock Date to return a fixed timestamp
      const fixedDate = new Date('2024-01-15T10:30:45.123Z');
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);
      const result = downloadHelper_1.DownloadUtils.createTimestamp();
      expect(result).toBe('2024-01-15T10-30-45');
      jest.restoreAllMocks();
    });
    test('should handle date formatting correctly', () => {
      const result = downloadHelper_1.DownloadUtils.createTimestamp();
      // Should be in format YYYY-MM-DDTHH-mm-ss (colons replaced with dashes)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });
  });
  describe('generateFilename', () => {
    test('should succeed with basic filename', () => {
      const result = downloadHelper_1.DownloadUtils.generateFilename('test-file');
      expect(result).toSucceedAndSatisfy((filename) => {
        expect(filename).toMatch(/^test-file-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      });
    });
    test('should fail with empty base filename', () => {
      expect(downloadHelper_1.DownloadUtils.generateFilename('')).toFailWith(/Base filename cannot be empty/);
      expect(downloadHelper_1.DownloadUtils.generateFilename('   ')).toFailWith(
        /Base filename cannot be empty/
      );
    });
    test('should trim whitespace from base filename', () => {
      const result = downloadHelper_1.DownloadUtils.generateFilename('  test-file  ');
      expect(result).toSucceedAndSatisfy((filename) => {
        expect(filename).toMatch(/^test-file-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      });
    });
    test('should add type when provided', () => {
      const result = downloadHelper_1.DownloadUtils.generateFilename('base', 'source');
      expect(result).toSucceedAndSatisfy((filename) => {
        expect(filename).toMatch(/^base-source-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      });
    });
    test('should skip timestamp when includeTimestamp is false', () => {
      const result = downloadHelper_1.DownloadUtils.generateFilename('test-file', 'type', {
        includeTimestamp: false
      });
      expect(result).toSucceedWith('test-file-type.json');
    });
    test('should use custom extension', () => {
      const result = downloadHelper_1.DownloadUtils.generateFilename('test-file', undefined, {
        extension: 'txt',
        includeTimestamp: false
      });
      expect(result).toSucceedWith('test-file.txt');
    });
    test('should use custom timestamp format', () => {
      const customTimestamp = '2024-01-15-custom';
      const result = downloadHelper_1.DownloadUtils.generateFilename('test-file', undefined, {
        timestampFormat: customTimestamp
      });
      expect(result).toSucceedWith(`test-file-${customTimestamp}.json`);
    });
    test('should apply filename transformer', () => {
      const transformer = (filename) => `transformed-${filename}`;
      const result = downloadHelper_1.DownloadUtils.generateFilename('test-file', undefined, {
        includeTimestamp: false,
        filenameTransformer: transformer
      });
      expect(result).toSucceedWith('transformed-test-file.json');
    });
    test('should handle complex filename generation with all options', () => {
      const options = {
        extension: 'txt',
        timestampFormat: '2024-custom',
        filenameTransformer: (name) => `prefix-${name}-suffix`
      };
      const result = downloadHelper_1.DownloadUtils.generateFilename('base', 'type', options);
      expect(result).toSucceedWith('prefix-base-type-2024-custom-suffix.txt');
    });
  });
  describe('downloadFile', () => {
    test('should successfully download string data with default options', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile('test content', 'test');
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith(['test content'], { type: 'application/json' });
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe(mockURL);
      expect(mockLink.download).toMatch(/^ts-res-export-test-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      expect(mockLink.style.display).toBe('none');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockURL);
    });
    test('should stringify JSON data when extension is json', () => {
      const testData = { key: 'value', nested: { count: 42 } };
      const result = downloadHelper_1.DownloadUtils.downloadFile(testData, 'test');
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith(
        ['{\n  "key": "value",\n  "nested": {\n    "count": 42\n  }\n}'],
        { type: 'application/json' }
      );
    });
    test('should convert non-string data to string for non-json extensions', () => {
      const testData = { key: 'value' };
      const result = downloadHelper_1.DownloadUtils.downloadFile(testData, 'test', { extension: 'txt' });
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith(['[object Object]'], { type: 'text/plain' });
    });
    test('should use custom MIME type when provided', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test', {
        mimeType: 'text/csv',
        extension: 'csv'
      });
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith(['content'], { type: 'text/csv' });
    });
    test('should use custom base filename', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test', {
        baseFilename: 'custom-name',
        includeTimestamp: false
      });
      expect(result).toSucceed();
      expect(mockLink.download).toBe('custom-name-test.json');
    });
    test('should fail when filename generation fails', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test', {
        baseFilename: '' // This will cause filename generation to fail
      });
      expect(result).toFailWith(/Failed to generate filename: Base filename cannot be empty/);
      expect(global.Blob).not.toHaveBeenCalled();
    });
    test('should handle DOM errors and format them correctly', () => {
      // Mock createElement to throw an error
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM error');
      });
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test');
      expect(result).toFailWith(/Failed to download file: DOM error/);
    });
    test('should handle Blob creation errors', () => {
      // Mock Blob constructor to throw an error
      global.Blob = jest.fn().mockImplementation(() => {
        throw new Error('Blob creation failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test');
      expect(result).toFailWith(/Failed to download file: Blob creation failed/);
    });
    test('should handle URL.createObjectURL errors', () => {
      createObjectURLSpy.mockImplementation(() => {
        throw new Error('URL creation failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test');
      expect(result).toFailWith(/Failed to download file: URL creation failed/);
    });
    test('should pass through all download options', () => {
      const options = {
        baseFilename: 'custom-base',
        extension: 'csv',
        includeTimestamp: false,
        mimeType: 'text/csv',
        filenameTransformer: (name) => `processed-${name}`
      };
      const result = downloadHelper_1.DownloadUtils.downloadFile('data', 'export', options);
      expect(result).toSucceed();
      expect(mockLink.download).toBe('processed-custom-base-export.csv');
      expect(global.Blob).toHaveBeenCalledWith(['data'], { type: 'text/csv' });
    });
  });
  describe('downloadTsResJson', () => {
    test('should download with ts-res specific defaults', () => {
      const testData = { resources: ['a', 'b'] };
      const result = downloadHelper_1.DownloadUtils.downloadTsResJson(testData, 'bundle');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/^ts-res-bundle-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      expect(global.Blob).toHaveBeenCalledWith([JSON.stringify(testData, null, 2)], {
        type: 'application/json'
      });
    });
    test('should handle complex data structures', () => {
      const complexData = {
        config: { version: '1.0' },
        resources: [
          { id: 'res1', value: 'test' },
          { id: 'res2', value: 'another' }
        ]
      };
      const result = downloadHelper_1.DownloadUtils.downloadTsResJson(complexData, 'complex');
      expect(result).toSucceed();
    });
    test('should propagate download errors', () => {
      // Mock createElement to throw an error
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('Download failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadTsResJson({}, 'test');
      expect(result).toFailWith(/Failed to download file: Download failed/);
    });
  });
  describe('downloadBundle', () => {
    test('should download bundle with enhanced naming', () => {
      const bundleData = { config: {}, resources: {} };
      const result = downloadHelper_1.DownloadUtils.downloadBundle(bundleData, 5, 'my-config');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /^ts-res-bundle-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-5res-my-config\.json$/
      );
    });
    test('should clean config name by removing invalid characters', () => {
      const result = downloadHelper_1.DownloadUtils.downloadBundle({}, 3, 'my config@#$%name!');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /ts-res-bundle-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-3res-my-config----name-/
      );
    });
    test('should handle missing resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadBundle({}, undefined, 'config-name');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /ts-res-bundle-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-config-name\.json$/
      );
      expect(mockLink.download).not.toMatch(/\d+res/);
    });
    test('should handle zero resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadBundle({}, 0, 'empty-config');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /ts-res-bundle-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-empty-config\.json$/
      );
      expect(mockLink.download).not.toMatch(/0res/);
    });
    test('should handle missing config name', () => {
      const result = downloadHelper_1.DownloadUtils.downloadBundle({}, 7);
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/^ts-res-bundle-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-7res\.json$/);
    });
    test('should handle both missing resource count and config name', () => {
      const result = downloadHelper_1.DownloadUtils.downloadBundle({});
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/^ts-res-bundle-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });
    test('should propagate download errors', () => {
      global.Blob = jest.fn().mockImplementation(() => {
        throw new Error('Bundle download failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadBundle({}, 5, 'config');
      expect(result).toFailWith(/Failed to download file: Bundle download failed/);
    });
  });
  describe('downloadResources', () => {
    test('should download resources with enhanced naming', () => {
      const resourceData = [{ id: 'res1' }, { id: 'res2' }];
      const result = downloadHelper_1.DownloadUtils.downloadResources(resourceData, 10, 'my-collection');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /^ts-res-resources-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-10items-my-collection\.json$/
      );
    });
    test('should clean collection name', () => {
      const result = downloadHelper_1.DownloadUtils.downloadResources({}, 2, 'special!@#collection$%^name');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /ts-res-resources-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-2items-special---collection---name/
      );
    });
    test('should handle missing resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadResources({}, undefined, 'collection');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /ts-res-resources-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-collection\.json$/
      );
      expect(mockLink.download).not.toMatch(/\d+items/);
    });
    test('should handle zero resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadResources({}, 0, 'empty');
      expect(result).toSucceed();
      expect(mockLink.download).not.toMatch(/0items/);
    });
    test('should handle missing collection name', () => {
      const result = downloadHelper_1.DownloadUtils.downloadResources({}, 15);
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(
        /^ts-res-resources-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-15items\.json$/
      );
    });
    test('should propagate download errors', () => {
      createObjectURLSpy.mockImplementation(() => {
        throw new Error('Resource download failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadResources({}, 5, 'test');
      expect(result).toFailWith(/Failed to download file: Resource download failed/);
    });
  });
  describe('downloadCompiledResources', () => {
    test('should download compiled resources with specific naming', () => {
      const compiledData = { compiled: true };
      const result = downloadHelper_1.DownloadUtils.downloadCompiledResources(compiledData, 8);
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/^ts-res-compiled-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-8res\.json$/);
    });
    test('should handle missing resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadCompiledResources({});
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/^ts-res-compiled-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      expect(mockLink.download).not.toMatch(/\d+res/);
    });
    test('should handle zero resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadCompiledResources({}, 0);
      expect(result).toSucceed();
      expect(mockLink.download).not.toMatch(/0res/);
    });
    test('should use correct file extension and MIME type', () => {
      const result = downloadHelper_1.DownloadUtils.downloadCompiledResources({}, 3);
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/\.json$/);
      expect(global.Blob).toHaveBeenCalledWith([expect.any(String)], { type: 'application/json' });
    });
    test('should propagate download errors', () => {
      appendChildSpy.mockImplementation(() => {
        throw new Error('Compiled download failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadCompiledResources({}, 5);
      expect(result).toFailWith(/Failed to download file: Compiled download failed/);
    });
  });
  describe('downloadSourceResources', () => {
    test('should download source resources with specific naming', () => {
      const sourceData = { source: true };
      const result = downloadHelper_1.DownloadUtils.downloadSourceResources(sourceData, 12);
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/^ts-res-source-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-12res\.json$/);
    });
    test('should handle missing resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadSourceResources({});
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/^ts-res-source-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      expect(mockLink.download).not.toMatch(/\d+res/);
    });
    test('should handle zero resource count', () => {
      const result = downloadHelper_1.DownloadUtils.downloadSourceResources({}, 0);
      expect(result).toSucceed();
      expect(mockLink.download).not.toMatch(/0res/);
    });
    test('should use correct file extension and MIME type', () => {
      const result = downloadHelper_1.DownloadUtils.downloadSourceResources({}, 6);
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/\.json$/);
      expect(global.Blob).toHaveBeenCalledWith([expect.any(String)], { type: 'application/json' });
    });
    test('should propagate download errors', () => {
      removeChildSpy.mockImplementation(() => {
        throw new Error('Source download failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadSourceResources({}, 8);
      expect(result).toFailWith(/Failed to download file: Source download failed/);
    });
  });
  describe('edge cases and error handling', () => {
    test('should handle undefined data with json extension', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile(undefined, 'test', { extension: 'json' });
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith([undefined], { type: 'application/json' });
    });
    test('should handle undefined data with text extension', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile(undefined, 'test', { extension: 'txt' });
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith(['undefined'], { type: 'text/plain' });
    });
    test('should handle null data with json extension', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile(null, 'test', { extension: 'json' });
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith(['null'], { type: 'application/json' });
    });
    test('should handle null data with text extension', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile(null, 'test', { extension: 'txt' });
      expect(result).toSucceed();
      expect(global.Blob).toHaveBeenCalledWith(['null'], { type: 'text/plain' });
    });
    test('should handle complex nested objects', () => {
      const complexObject = {
        level1: {
          level2: {
            level3: {
              array: [1, 2, { nested: 'value' }],
              boolean: true,
              nullValue: null,
              undefinedValue: undefined
            }
          }
        }
      };
      const result = downloadHelper_1.DownloadUtils.downloadFile(complexObject, 'complex');
      expect(result).toSucceed();
    });
    test('should handle circular references in JSON', () => {
      const circular = { name: 'test' };
      circular.circular = circular;
      // JSON.stringify should throw for circular references
      const result = downloadHelper_1.DownloadUtils.downloadFile(circular, 'test');
      expect(result).toFailWith(/Failed to download file:/);
    });
    test('should handle very large filenames', () => {
      const longBaseName = 'a'.repeat(200);
      const result = downloadHelper_1.DownloadUtils.generateFilename(longBaseName, 'type');
      expect(result).toSucceed(); // Should not fail, just create a long filename
    });
    test('should handle special characters in type parameter', () => {
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'special!@#$%type');
      expect(result).toSucceed();
      expect(mockLink.download).toMatch(/special!@#\$%type/);
    });
  });
  describe('DOM cleanup verification', () => {
    test('should cleanup DOM elements and URL even if click fails', () => {
      clickSpy.mockImplementation(() => {
        throw new Error('Click failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test');
      expect(result).toFailWith(/Failed to download file: Click failed/);
      // Cleanup does not happen when captureResult catches the error
      expect(removeChildSpy).not.toHaveBeenCalled();
      expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    });
    test('should cleanup URL even if removeChild fails', () => {
      removeChildSpy.mockImplementation(() => {
        throw new Error('RemoveChild failed');
      });
      const result = downloadHelper_1.DownloadUtils.downloadFile('content', 'test');
      expect(result).toFailWith(/Failed to download file: RemoveChild failed/);
      // URL is not revoked when captureResult catches the error
      expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=downloadHelper.test.js.map
