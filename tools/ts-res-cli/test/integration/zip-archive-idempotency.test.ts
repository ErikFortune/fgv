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
import { ResourceCompiler } from '../../src/compiler';
import { ICompileOptions } from '../../src/options';
import * as TsRes from '@fgv/ts-res';

describe('ZIP Archive Idempotency Integration Test', () => {
  const testDataPath = path.resolve(__dirname, '../../../../data/test/ts-res/custom-config');
  const configFilePath = path.join(testDataPath, 'resources-config.json');
  const inputPath = path.join(testDataPath, 'resources');

  // Temporary files for the test
  const tempDir = path.join(__dirname, '../../temp');
  const originalBundlePath = path.join(tempDir, 'original-bundle.json');
  const archivePath = path.join(tempDir, 'test-archive.zip');
  const reconstructedBundlePath = path.join(tempDir, 'reconstructed-bundle.json');

  beforeAll(async () => {
    // Ensure temp directory exists
    await fs.promises.mkdir(tempDir, { recursive: true });

    // Verify test data exists
    expect(fs.existsSync(testDataPath)).toBe(true);
    expect(fs.existsSync(configFilePath)).toBe(true);
    expect(fs.existsSync(inputPath)).toBe(true);
  });

  afterAll(async () => {
    // Clean up temporary files
    const filesToClean = [originalBundlePath, archivePath, reconstructedBundlePath];
    for (const file of filesToClean) {
      try {
        if (fs.existsSync(file)) {
          await fs.promises.unlink(file);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('should create identical bundles from source files and ZIP archive', async () => {
    // Step 1: Create bundle from original source files
    console.log('Step 1: Creating bundle from original source files...');

    const originalCompileOptions: ICompileOptions = {
      input: inputPath,
      output: originalBundlePath,
      config: configFilePath,
      format: 'bundle',
      debug: false,
      verbose: false,
      quiet: true,
      validate: true,
      includeMetadata: true,
      reduceQualifiers: false
    };

    const originalCompiler = new ResourceCompiler(originalCompileOptions);
    const originalResult = await originalCompiler.compile();

    expect(originalResult).toSucceed();
    expect(fs.existsSync(originalBundlePath)).toBe(true);

    // Step 2: Create ZIP archive from the same source files
    console.log('Step 2: Creating ZIP archive from source files...');

    const { ZipArchive } = TsRes;
    const archiveCreator = new ZipArchive.ZipArchiveCreator();
    const archiveResult = await archiveCreator.createFromBuffer({
      inputPath: inputPath,
      configPath: configFilePath
    });

    expect(archiveResult).toSucceed();

    // Write ZIP archive to disk
    const { zipBuffer } = archiveResult.value!;
    await fs.promises.writeFile(archivePath, zipBuffer);
    expect(fs.existsSync(archivePath)).toBe(true);

    // Step 3: Load ZIP archive and create bundle from it
    console.log('Step 3: Creating bundle from ZIP archive...');

    const archiveLoader = new ZipArchive.ZipArchiveLoader();

    // Read ZIP file back from disk
    const zipFileBuffer = await fs.promises.readFile(archivePath);
    const loadResult = await archiveLoader.loadFromBuffer(zipFileBuffer.buffer);

    expect(loadResult).toSucceed();

    const { files, config } = loadResult.value!;

    // Create a temporary directory structure to simulate the loaded archive
    const tempArchiveDir = path.join(tempDir, 'loaded-archive');
    await fs.promises.mkdir(tempArchiveDir, { recursive: true });

    // Write extracted files to temporary directory
    const resourcesDir = path.join(tempArchiveDir, 'resources');
    await fs.promises.mkdir(resourcesDir, { recursive: true });

    for (const file of files) {
      // Skip manifest.json and config files when reconstructing resource structure
      if (file.name === 'manifest.json' || file.path.startsWith('config/')) {
        continue;
      }

      // Remove 'input/' prefix from the path to get the relative resource path
      const relativePath = file.path.replace(/^input\//, '');
      const targetPath = path.join(tempArchiveDir, relativePath);
      const targetDir = path.dirname(targetPath);

      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.writeFile(targetPath, file.content, 'utf8');
    }

    // Write config file if present
    let configPath: string | undefined;
    if (config) {
      configPath = path.join(tempArchiveDir, 'config.json');
      await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    }

    // Create bundle from the reconstructed archive
    const reconstructedCompileOptions: ICompileOptions = {
      input: resourcesDir,
      output: reconstructedBundlePath,
      config: configPath,
      format: 'bundle',
      debug: false,
      verbose: false,
      quiet: true,
      validate: true,
      includeMetadata: true,
      reduceQualifiers: false
    };

    const reconstructedCompiler = new ResourceCompiler(reconstructedCompileOptions);
    const reconstructedResult = await reconstructedCompiler.compile();

    expect(reconstructedResult).toSucceed();
    expect(fs.existsSync(reconstructedBundlePath)).toBe(true);

    // Step 4: Compare the two bundles
    console.log('Step 4: Comparing original and reconstructed bundles...');

    const originalBundleContent = await fs.promises.readFile(originalBundlePath, 'utf8');
    const reconstructedBundleContent = await fs.promises.readFile(reconstructedBundlePath, 'utf8');

    const originalBundle = JSON.parse(originalBundleContent);
    const reconstructedBundle = JSON.parse(reconstructedBundleContent);

    // Remove timestamps and other non-deterministic fields that may differ
    const normalizeBundle = (bundle: any) => {
      if (bundle.metadata?.timestamp) {
        delete bundle.metadata.timestamp;
      }
      if (bundle.bundle?.metadata?.timestamp) {
        delete bundle.bundle.metadata.timestamp;
      }
      if (bundle.bundle?.metadata?.dateBuilt) {
        delete bundle.bundle.metadata.dateBuilt;
      }
      // Sort arrays for consistent comparison
      if (bundle.bundle?.resources) {
        bundle.bundle.resources.sort((a: any, b: any) => {
          return (a.id || '').localeCompare(b.id || '');
        });
        // Sort candidates within each resource
        bundle.bundle.resources.forEach((resource: any) => {
          if (resource.candidates) {
            resource.candidates.sort((a: any, b: any) => {
              return JSON.stringify(a.conditions || {}).localeCompare(JSON.stringify(b.conditions || {}));
            });
          }
        });
      }
      return bundle;
    };

    const normalizedOriginal = normalizeBundle(JSON.parse(JSON.stringify(originalBundle)));
    const normalizedReconstructed = normalizeBundle(JSON.parse(JSON.stringify(reconstructedBundle)));

    // Deep comparison of the normalized bundles
    expect(normalizedReconstructed).toEqual(normalizedOriginal);

    // Clean up temporary archive directory
    await fs.promises.rm(tempArchiveDir, { recursive: true, force: true });

    console.log('✅ Idempotency test passed: Bundles are identical!');
  }, 30000); // 30 second timeout for this comprehensive test
});
