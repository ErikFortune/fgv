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
  parseUrlParameters,
  parseContextFilter,
  parseQualifierDefaults,
  parseResourceTypes,
  extractDirectoryPath,
  isFilePath,
  type IUrlConfigOptions
} from '../../packlets/url-utils';

// Mock window.location.search for testing
const mockLocation = {
  search: ''
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('URL Parameters', () => {
  describe('parseUrlParameters', () => {
    beforeEach(() => {
      mockLocation.search = '';
    });

    test('returns empty object for empty URL parameters', () => {
      mockLocation.search = '';
      const result = parseUrlParameters();
      expect(result).toEqual({});
    });

    test('parses basic string parameters', () => {
      mockLocation.search = '?input=test.json&config=config.json';
      const result = parseUrlParameters();
      expect(result).toEqual({
        input: 'test.json',
        config: 'config.json',
        inputStartDir: '/',
        configStartDir: '/'
      });
    });

    test('parses file paths and sets start directories', () => {
      mockLocation.search = '?input=/path/to/file.json&config=/config/settings.json';
      const result = parseUrlParameters();
      expect(result).toEqual({
        input: '/path/to/file.json',
        config: '/config/settings.json',
        inputStartDir: '/path/to',
        configStartDir: '/config'
      });
    });

    test('handles directory paths without setting start directories', () => {
      mockLocation.search = '?input=/path/to/directory&config=/config/folder';
      const result = parseUrlParameters();
      expect(result).toEqual({
        input: '/path/to/directory',
        config: '/config/folder'
      });
    });

    test('parses numeric parameters', () => {
      mockLocation.search = '?maxDistance=5';
      const result = parseUrlParameters();
      expect(result).toEqual({
        maxDistance: 5
      });
    });

    test('ignores invalid numeric parameters', () => {
      mockLocation.search = '?maxDistance=invalid';
      const result = parseUrlParameters();
      expect(result).toEqual({});
    });

    test('parses boolean parameters (true)', () => {
      mockLocation.search = '?reduceQualifiers=true&interactive=true&loadZip=true';
      const result = parseUrlParameters();
      expect(result).toEqual({
        reduceQualifiers: true,
        interactive: true,
        loadZip: true
      });
    });

    test('ignores boolean parameters that are not "true"', () => {
      mockLocation.search = '?reduceQualifiers=false&interactive=1&loadZip=yes';
      const result = parseUrlParameters();
      expect(result).toEqual({});
    });

    test('parses complex filter parameters', () => {
      mockLocation.search =
        '?contextFilter=lang%3Den%7Cregion%3DUS&qualifierDefaults=lang%3Den,fr%7Cregion%3DUS&resourceTypes=json,string';
      const result = parseUrlParameters();
      expect(result).toEqual({
        contextFilter: 'lang=en|region=US',
        qualifierDefaults: 'lang=en,fr|region=US',
        resourceTypes: 'json,string'
      });
    });

    test('parses ZIP loading parameters', () => {
      mockLocation.search = '?loadZip=true&zipPath=/path/to/archive.zip&zipFile=download.zip';
      const result = parseUrlParameters();
      expect(result).toEqual({
        loadZip: true,
        zipPath: '/path/to/archive.zip',
        zipFile: 'download.zip'
      });
    });

    test('parses all parameters together', () => {
      mockLocation.search =
        '?input=data.json&config=settings.json&contextFilter=lang%3Den&qualifierDefaults=lang%3Den,fr&resourceTypes=json&maxDistance=3&reduceQualifiers=true&interactive=true&loadZip=true&zipPath=archive.zip&zipFile=download.zip';
      const result = parseUrlParameters();
      expect(result).toEqual({
        input: 'data.json',
        config: 'settings.json',
        contextFilter: 'lang=en',
        qualifierDefaults: 'lang=en,fr',
        resourceTypes: 'json',
        maxDistance: 3,
        reduceQualifiers: true,
        interactive: true,
        loadZip: true,
        zipPath: 'archive.zip',
        zipFile: 'download.zip',
        inputStartDir: '/',
        configStartDir: '/'
      });
    });

    test('handles URL encoded parameters', () => {
      mockLocation.search = '?input=test%20file.json&config=config%2Bsettings.json';
      const result = parseUrlParameters();
      expect(result).toEqual({
        input: 'test file.json',
        config: 'config+settings.json',
        inputStartDir: '/',
        configStartDir: '/'
      });
    });

    test('handles empty parameter values', () => {
      mockLocation.search = '?input=&config=&maxDistance=';
      const result = parseUrlParameters();
      expect(result).toEqual({});
    });
  });

  describe('parseContextFilter', () => {
    test('parses simple key-value pairs', () => {
      const result = parseContextFilter('language=en-US|territory=US');
      expect(result).toEqual({
        language: 'en-US',
        territory: 'US'
      });
    });

    test('handles single key-value pair', () => {
      const result = parseContextFilter('language=en-US');
      expect(result).toEqual({
        language: 'en-US'
      });
    });

    test('trims whitespace from keys and values', () => {
      const result = parseContextFilter(' language = en-US | territory = US ');
      expect(result).toEqual({
        language: 'en-US',
        territory: 'US'
      });
    });

    test('handles empty string', () => {
      const result = parseContextFilter('');
      expect(result).toEqual({});
    });

    test('ignores tokens without equals sign', () => {
      const result = parseContextFilter('language=en-US|invalidtoken|territory=US');
      expect(result).toEqual({
        language: 'en-US',
        territory: 'US'
      });
    });

    test('ignores tokens with missing key', () => {
      const result = parseContextFilter('=en-US|territory=US');
      expect(result).toEqual({
        territory: 'US'
      });
    });

    test('ignores tokens with missing value', () => {
      const result = parseContextFilter('language=|territory=US');
      expect(result).toEqual({
        territory: 'US'
      });
    });

    test('handles special characters in values', () => {
      const result = parseContextFilter('language=en-US|path=/some/path.json');
      expect(result).toEqual({
        language: 'en-US',
        path: '/some/path.json'
      });
    });

    test('handles complex nested values', () => {
      const result = parseContextFilter('filter=a=b,c=d|type=complex');
      expect(result).toEqual({
        filter: 'a',
        type: 'complex'
      });
    });
  });

  describe('parseQualifierDefaults', () => {
    test('parses simple qualifier defaults', () => {
      const result = parseQualifierDefaults('language=en-US,en-CA|territory=US');
      expect(result).toEqual({
        language: ['en-US', 'en-CA'],
        territory: ['US']
      });
    });

    test('handles single qualifier with single value', () => {
      const result = parseQualifierDefaults('language=en-US');
      expect(result).toEqual({
        language: ['en-US']
      });
    });

    test('handles single qualifier with multiple values', () => {
      const result = parseQualifierDefaults('language=en-US,en-CA,fr-CA');
      expect(result).toEqual({
        language: ['en-US', 'en-CA', 'fr-CA']
      });
    });

    test('trims whitespace from keys and values', () => {
      const result = parseQualifierDefaults(' language = en-US , en-CA | territory = US ');
      expect(result).toEqual({
        language: ['en-US', 'en-CA'],
        territory: ['US']
      });
    });

    test('handles empty string', () => {
      const result = parseQualifierDefaults('');
      expect(result).toEqual({});
    });

    test('ignores tokens without equals sign', () => {
      const result = parseQualifierDefaults('language=en-US|invalidtoken|territory=US');
      expect(result).toEqual({
        language: ['en-US'],
        territory: ['US']
      });
    });

    test('ignores tokens with missing key', () => {
      const result = parseQualifierDefaults('=en-US,en-CA|territory=US');
      expect(result).toEqual({
        territory: ['US']
      });
    });

    test('ignores tokens with missing value', () => {
      const result = parseQualifierDefaults('language=|territory=US');
      expect(result).toEqual({
        territory: ['US']
      });
    });

    test('handles complex qualifier combinations', () => {
      const result = parseQualifierDefaults('language=en-US,en-CA,fr-CA|territory=US,CA|currency=USD,CAD');
      expect(result).toEqual({
        language: ['en-US', 'en-CA', 'fr-CA'],
        territory: ['US', 'CA'],
        currency: ['USD', 'CAD']
      });
    });

    test('handles empty values in comma-separated lists', () => {
      const result = parseQualifierDefaults('language=en-US,,en-CA|territory=,US,');
      expect(result).toEqual({
        language: ['en-US', '', 'en-CA'],
        territory: ['', 'US', '']
      });
    });
  });

  describe('parseResourceTypes', () => {
    test('parses comma-separated resource types', () => {
      const result = parseResourceTypes('json,string');
      expect(result).toEqual(['json', 'string']);
    });

    test('handles single resource type', () => {
      const result = parseResourceTypes('json');
      expect(result).toEqual(['json']);
    });

    test('trims whitespace from types', () => {
      const result = parseResourceTypes(' json , string , object ');
      expect(result).toEqual(['json', 'string', 'object']);
    });

    test('filters out empty types', () => {
      const result = parseResourceTypes('json,,string,');
      expect(result).toEqual(['json', 'string']);
    });

    test('handles empty string', () => {
      const result = parseResourceTypes('');
      expect(result).toEqual([]);
    });

    test('handles only commas and whitespace', () => {
      const result = parseResourceTypes(' , , ');
      expect(result).toEqual([]);
    });

    test('handles multiple resource types with various spacing', () => {
      const result = parseResourceTypes('json,  string,object  ,  array, number');
      expect(result).toEqual(['json', 'string', 'object', 'array', 'number']);
    });
  });

  describe('extractDirectoryPath', () => {
    test('extracts directory from file path', () => {
      expect(extractDirectoryPath('/path/to/file.json')).toBe('/path/to');
    });

    test('returns directory path as-is', () => {
      expect(extractDirectoryPath('/path/to/directory')).toBe('/path/to/directory');
    });

    test('handles root file path', () => {
      expect(extractDirectoryPath('/file.json')).toBe('/');
    });

    test('handles root directory', () => {
      expect(extractDirectoryPath('/')).toBe('/');
    });

    test('handles empty path', () => {
      expect(extractDirectoryPath('')).toBe('');
    });

    test('handles relative file paths', () => {
      expect(extractDirectoryPath('file.json')).toBe('/');
      expect(extractDirectoryPath('dir/file.json')).toBe('dir');
    });

    test('handles relative directory paths', () => {
      expect(extractDirectoryPath('directory')).toBe('directory');
      expect(extractDirectoryPath('path/to/directory')).toBe('path/to/directory');
    });

    test('normalizes backslashes to forward slashes', () => {
      expect(extractDirectoryPath('C:\\path\\to\\file.json')).toBe('C:/path/to');
      expect(extractDirectoryPath('path\\file.json')).toBe('path');
    });

    test('handles mixed separators', () => {
      expect(extractDirectoryPath('C:\\path/to\\file.json')).toBe('C:/path/to');
    });

    test('handles hidden files (starting with dot)', () => {
      expect(extractDirectoryPath('/path/to/.hidden')).toBe('/path/to/.hidden');
      expect(extractDirectoryPath('.hidden')).toBe('.hidden');
    });

    test('handles files with multiple dots', () => {
      expect(extractDirectoryPath('/path/to/file.min.js')).toBe('/path/to');
      expect(extractDirectoryPath('file.backup.json')).toBe('/');
    });

    test('handles directories with dots in name', () => {
      expect(extractDirectoryPath('/path/to/version.1.0')).toBe('/path/to');
      expect(extractDirectoryPath('node_modules')).toBe('node_modules');
    });
  });

  describe('isFilePath', () => {
    test('identifies file paths with extensions', () => {
      expect(isFilePath('file.json')).toBe(true);
      expect(isFilePath('/path/to/file.json')).toBe(true);
      expect(isFilePath('C:\\path\\file.txt')).toBe(true);
    });

    test('identifies directory paths without extensions', () => {
      expect(isFilePath('directory')).toBe(false);
      expect(isFilePath('/path/to/directory')).toBe(false);
      expect(isFilePath('C:\\path\\to\\directory')).toBe(false);
    });

    test('handles empty path', () => {
      expect(isFilePath('')).toBe(false);
    });

    test('handles root path', () => {
      expect(isFilePath('/')).toBe(false);
    });

    test('handles hidden files and directories', () => {
      expect(isFilePath('.hidden')).toBe(false);
      expect(isFilePath('.hiddendir')).toBe(false);
      expect(isFilePath('/path/.hidden')).toBe(false);
    });

    test('handles files with multiple extensions', () => {
      expect(isFilePath('file.min.js')).toBe(true);
      expect(isFilePath('archive.tar.gz')).toBe(true);
    });

    test('handles special file names', () => {
      expect(isFilePath('Makefile')).toBe(false);
      expect(isFilePath('README')).toBe(false);
      expect(isFilePath('package.json')).toBe(true);
    });

    test('handles paths with mixed separators', () => {
      expect(isFilePath('C:\\path/file.json')).toBe(true);
      expect(isFilePath('path\\to/directory')).toBe(false);
    });

    test('handles edge cases with dots', () => {
      expect(isFilePath('.')).toBe(false);
      expect(isFilePath('..')).toBe(false);
      expect(isFilePath('/path/.')).toBe(false);
      expect(isFilePath('/path/..')).toBe(false);
    });
  });
});
