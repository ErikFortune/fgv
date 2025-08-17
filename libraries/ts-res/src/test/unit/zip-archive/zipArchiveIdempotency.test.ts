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
import path from 'path';
import fs from 'fs';
import { ZipArchiveCreator, ZipArchiveLoader } from '../../../packlets/zip-archive';

describe('ZipArchive Idempotency', () => {
  const testDataPath = path.resolve(__dirname, '../../../../../../data/test/ts-res/custom-config');
  const configFilePath = path.join(testDataPath, 'resources-config.json');
  const inputPath = path.join(testDataPath, 'resources');

  let creator: ZipArchiveCreator;
  let loader: ZipArchiveLoader;

  beforeEach(() => {
    creator = new ZipArchiveCreator();
    loader = new ZipArchiveLoader();
  });

  describe('round-trip consistency', () => {
    test('should maintain file integrity through archive/extract cycle - custom-config (path torture test)', async () => {
      // Create archive from custom-config directory (path torture test)
      const createResult = await creator.createFromBuffer({
        input: inputPath,
        config: configFilePath
      });

      expect(createResult).toSucceed();
      const archiveResult = createResult.value!;

      expect(archiveResult.zipBuffer).toBeInstanceOf(Uint8Array);
      expect(archiveResult.manifest.input?.type).toBe('directory');

      // Load the archive back
      const file = new File([archiveResult.zipBuffer], 'custom-config.zip', {
        type: 'application/zip'
      });

      const loadResult = await loader.loadFromFile(file, {
        strictManifestValidation: true
      });

      expect(loadResult).toSucceedAndSatisfy((loadedResult) => {
        // Verify manifest consistency
        expect(loadedResult.manifest?.input?.type).toBe(archiveResult.manifest.input?.type);
        expect(loadedResult.manifest?.input?.originalPath).toBe(archiveResult.manifest.input?.originalPath);

        // Read original files and compare with extracted content
        const originalFiles = collectJsonFiles(inputPath);

        // Verify all original JSON files are present in archive
        for (const [relativePath, originalContent] of Object.entries(originalFiles)) {
          const archiveFile = loadedResult.files.find((file) =>
            file.path.includes(relativePath.replace(/\\/g, '/'))
          );

          expect(archiveFile).toBeDefined();

          if (archiveFile) {
            // Compare file content (normalize line endings)
            const normalizedOriginal = normalizeContent(originalContent);
            const normalizedArchived = normalizeContent(archiveFile.content);

            expect(normalizedArchived).toBe(normalizedOriginal);

            // Verify file metadata
            expect(archiveFile.path).toContain(relativePath.replace(/\\/g, '/'));
            expect(archiveFile.name).toBe(path.basename(relativePath));
          }
        }

        // Verify directory structure is preserved by checking file paths
        const directories = collectDirectories(inputPath);
        for (const directory of directories) {
          const hasFilesInDirectory = loadedResult.files.some((file) =>
            file.path.includes(directory.replace(/\\/g, '/'))
          );
          expect(hasFilesInDirectory).toBe(true);
        }

        // Verify that config file is also present in the manifest
        expect(loadedResult.manifest?.config).toBeDefined();
        expect(loadedResult.manifest?.config?.type).toBe('file');
        expect(loadedResult.manifest?.config?.originalPath).toBe(configFilePath);

        // Verify that the config file content is actually included in the archive and matches
        const configFileInArchive = loadedResult.files.find(
          (file) => file.name === 'resources-config.json' && file.path.includes('config')
        );
        expect(configFileInArchive).toBeDefined();

        if (configFileInArchive) {
          const originalConfigContent = fs.readFileSync(configFilePath, 'utf8');
          const normalizedOriginalConfig = normalizeContent(originalConfigContent);
          const normalizedArchivedConfig = normalizeContent(configFileInArchive.content);
          expect(normalizedArchivedConfig).toBe(normalizedOriginalConfig);
        }
      });
    });

    test('should preserve file timestamps and metadata through round-trip', async () => {
      const singleFilePath = configFilePath;

      const createResult = await creator.createFromBuffer({
        input: singleFilePath
      });

      expect(createResult).toSucceed();
      const archiveResult = createResult.value!;

      const file = new File([archiveResult.zipBuffer], 'resources-config.zip', {
        type: 'application/zip'
      });

      const loadResult = await loader.loadFromFile(file, {
        strictManifestValidation: true
      });

      expect(loadResult).toSucceedAndSatisfy((loadedResult) => {
        // Verify manifest metadata is preserved
        expect(loadedResult.manifest?.timestamp).toBe(archiveResult.manifest.timestamp);
        expect(loadedResult.manifest?.config).toEqual(archiveResult.manifest.config);

        // Verify file exists and content matches
        expect(loadedResult.files.length).toBeGreaterThan(0);

        // Find the actual file (not the manifest)
        const archivedFile = loadedResult.files.find((f) => f.name === 'resources-config.json');
        expect(archivedFile).toBeDefined();

        const originalContent = fs.readFileSync(singleFilePath, 'utf8');
        expect(normalizeContent(archivedFile!.content)).toBe(normalizeContent(originalContent));
      });
    });

    test('should handle complex path structures with special characters', async () => {
      // Test with the complex custom-config structure that has various path patterns
      const createResult = await creator.createFromBuffer({
        input: inputPath
      });

      expect(createResult).toSucceed();
      const archiveResult = createResult.value!;

      const file = new File([archiveResult.zipBuffer], 'complex-paths.zip', {
        type: 'application/zip'
      });

      const loadResult = await loader.loadFromFile(file);

      expect(loadResult).toSucceedAndSatisfy((loadedResult) => {
        const filePaths = loadedResult.files.map((f) => f.path);

        // Verify complex path patterns are preserved
        const expectedPatterns = [
          /home=CA/,
          /lang=en-US/,
          /language=en-CA/,
          /language=fr-CA/,
          /territory=BE/,
          /territory=CA/,
          /region=europe/,
          /strings\/dashboard\.home=CA,language=fr\.json/
        ];

        for (const pattern of expectedPatterns) {
          const hasMatchingPath = filePaths.some((path) => pattern.test(path));
          expect(hasMatchingPath).toBe(true);
        }
      });
    });
  });
});

/**
 * Recursively collect all JSON files from a directory
 */
function collectJsonFiles(dirPath: string): Record<string, string> {
  const files: Record<string, string> = {};

  function traverse(currentPath: string, relativePath: string = ''): void {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath, itemRelativePath);
      } else if (stat.isFile() && item.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        files[itemRelativePath] = content;
      }
    }
  }

  traverse(dirPath);
  return files;
}

/**
 * Collect all directory paths from a directory structure
 */
function collectDirectories(dirPath: string): string[] {
  const directories: string[] = [];

  function traverse(currentPath: string, relativePath: string = ''): void {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        directories.push(itemRelativePath);
        traverse(fullPath, itemRelativePath);
      }
    }
  }

  traverse(dirPath);
  return directories;
}

/**
 * Normalize content for comparison (handle line endings, etc.)
 */
function normalizeContent(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}
