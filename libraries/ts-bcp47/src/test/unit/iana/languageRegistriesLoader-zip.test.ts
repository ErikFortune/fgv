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
import * as path from 'path';
import * as fs from 'fs';
import * as Iana from '../../../packlets/iana';

describe('LanguageRegistriesLoader ZIP functionality', () => {
  const testDataDir = 'src/data/iana';
  const tempZipPath = path.join(__dirname, 'test-iana-data.zip');

  beforeAll(() => {
    // Create a test ZIP file for testing
    const execSync = require('child_process').execSync;
    const originalDir = process.cwd();
    process.chdir(testDataDir);
    try {
      execSync(`zip -9 "${tempZipPath}" language-subtags.json language-tag-extensions.json`, {
        stdio: 'ignore'
      });
    } finally {
      process.chdir(originalDir);
    }
  });

  afterAll(() => {
    // Clean up test ZIP file
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
  });

  describe('loadLanguageRegistriesFromZip', () => {
    test('should load language registries from a ZIP file', () => {
      const result = Iana.loadLanguageRegistriesFromZip(tempZipPath);
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
        expect(registries.subtags.fileDate).toBe('2025-08-25');
        expect(registries.extensions.fileDate).toBe('2014-04-02');
      });
    });

    test('should fail for non-existent ZIP file', () => {
      const result = Iana.loadLanguageRegistriesFromZip('non-existent.zip');
      expect(result).toFailWith(/no such file or directory|cannot find the file/i);
    });

    test('should fail for invalid ZIP file', () => {
      // Create a temporary invalid ZIP file
      const invalidZipPath = path.join(__dirname, 'invalid.zip');
      fs.writeFileSync(invalidZipPath, 'not a zip file');

      try {
        const result = Iana.loadLanguageRegistriesFromZip(invalidZipPath);
        expect(result).toFail();
      } finally {
        fs.unlinkSync(invalidZipPath);
      }
    });
  });

  describe('loadLanguageRegistriesFromZipBuffer', () => {
    test('should load language registries from a ZIP buffer', () => {
      const zipBuffer = fs.readFileSync(tempZipPath);
      const result = Iana.loadLanguageRegistriesFromZipBuffer(zipBuffer);
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
        expect(registries.subtags.fileDate).toBe('2025-08-25');
        expect(registries.extensions.fileDate).toBe('2014-04-02');
      });
    });

    test('should work with ArrayBuffer', () => {
      const zipBuffer = fs.readFileSync(tempZipPath).buffer;
      const result = Iana.loadLanguageRegistriesFromZipBuffer(zipBuffer);
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
      });
    });

    test('should fail for invalid buffer', () => {
      const invalidBuffer = new Uint8Array([1, 2, 3, 4, 5]);
      const result = Iana.loadLanguageRegistriesFromZipBuffer(invalidBuffer);
      expect(result).toFail();
    });
  });

  describe('loadLanguageRegistries ZIP auto-detection', () => {
    test('should auto-detect and load ZIP file based on extension', () => {
      const result = Iana.loadLanguageRegistries(tempZipPath);
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
        expect(registries.subtags.fileDate).toBe('2025-08-25');
      });
    });

    test('should still work with directory paths', () => {
      const result = Iana.loadLanguageRegistries(testDataDir);
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
      });
    });
  });

  describe('LanguageRegistries ZIP methods', () => {
    test('should load from ZIP file via loadLanguageRegistriesFromZip', () => {
      const result = Iana.loadLanguageRegistriesFromZip(tempZipPath);
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
      });
    });

    test('should load from ZIP buffer via LanguageRegistries.loadFromZipBuffer', () => {
      const zipBuffer = fs.readFileSync(tempZipPath);
      const result = Iana.LanguageRegistries.loadFromZipBuffer(zipBuffer);
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
      });
    });
  });

  describe('LanguageRegistries compressed default loading', () => {
    test('should load from embedded compressed data via loadDefaultCompressed', () => {
      const result = Iana.LanguageRegistries.loadDefaultCompressed();
      expect(result).toSucceedAndSatisfy((registries) => {
        expect(registries).toBeInstanceOf(Iana.LanguageRegistries);
        expect(registries.subtags.fileDate).toBe('2025-08-25');
        expect(registries.extensions.fileDate).toBe('2014-04-02');
      });
    });
  });
});
