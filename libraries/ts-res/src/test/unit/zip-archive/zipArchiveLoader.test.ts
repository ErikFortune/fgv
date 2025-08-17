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
import { ZipArchiveCreator, ZipArchiveLoader } from '../../../packlets/zip-archive';

describe('ZipArchiveLoader', () => {
  const testDataPath = path.resolve(__dirname, '../../../../../../data/test/ts-res');
  const customConfigPath = path.join(testDataPath, 'custom-config');

  let creator: ZipArchiveCreator;
  let loader: ZipArchiveLoader;

  beforeEach(() => {
    creator = new ZipArchiveCreator();
    loader = new ZipArchiveLoader();
  });

  describe('loadFromFile', () => {
    test('should load archive from buffer', async () => {
      // First create an archive
      const createResult = await creator.createFromBuffer({
        input: customConfigPath
      });

      expect(createResult).toSucceed();
      const archiveBuffer = createResult.value!.zipBuffer;

      // Create a mock File object
      const file = new File([archiveBuffer], 'test-archive.zip', { type: 'application/zip' });

      // Load the archive
      const loadResult = await loader.loadFromFile(file, {
        strictManifestValidation: true
      });

      expect(loadResult).toSucceedAndSatisfy((loadedResult) => {
        expect(loadedResult.manifest).toBeDefined();
        expect(loadedResult.manifest?.input?.type).toBe('directory');
        expect(loadedResult.files).toBeDefined();
        expect(loadedResult.files.length).toBeGreaterThan(0);
      });
    });

    test('should handle progress callbacks during loading', async () => {
      // First create an archive
      const createResult = await creator.createFromBuffer({
        input: customConfigPath
      });

      expect(createResult).toSucceed();
      const archiveBuffer = createResult.value!.zipBuffer;
      const file = new File([archiveBuffer], 'test-archive.zip', { type: 'application/zip' });

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const loadResult = await loader.loadFromFile(file, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(loadResult).toSucceed();
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    test('should fail with invalid zip file', async () => {
      const invalidFile = new File([new Uint8Array([1, 2, 3, 4])], 'invalid.not-a-zip', {
        type: 'application/zip'
      });

      const result = await loader.loadFromFile(invalidFile);

      expect(result).toFailWith(/invalid.*zip/i);
    });

    test('should fail with for a non-zip', async () => {
      const invalidFile = new File([new Uint8Array([1, 2, 3, 4])], 'invalid.zip', {
        type: 'application/zip'
      });

      const result = await loader.loadFromFile(invalidFile);

      expect(result).toFailWith(/invalid.*zip/i);
    });

    test('should call progress callbacks even when zip file is invalid', async () => {
      const invalidFile = new File([new Uint8Array([1, 2, 3, 4])], 'invalid.zip', {
        type: 'application/zip'
      });

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await loader.loadFromFile(invalidFile, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(result).toFail();
      // Should have at least one progress callback before failing
      expect(progressCalls.length).toBeGreaterThan(0);

      // Should start with file reading phase
      expect(progressCalls[0]).toEqual({
        phase: 'reading-file',
        progress: 0,
        message: 'Reading file: invalid.zip'
      });
    });

    test('should load archive with basic options', async () => {
      // Create archive with mixed content
      const createResult = await creator.createFromBuffer({
        input: customConfigPath
      });

      expect(createResult).toSucceed();
      const archiveBuffer = createResult.value!.zipBuffer;
      const file = new File([archiveBuffer], 'test-archive.zip', { type: 'application/zip' });

      const loadResult = await loader.loadFromFile(file, {});

      expect(loadResult).toSucceedAndSatisfy((loadedResult) => {
        // Verify that files are loaded
        expect(loadedResult.files).toBeDefined();
        expect(loadedResult.files.length).toBeGreaterThan(0);
        // Verify files are JSON files (no binary filtering in actual API)
        const hasJsonFiles = loadedResult.files.some((file) => file.name.endsWith('.json'));
        expect(hasJsonFiles).toBe(true);
      });
    });
  });

  describe('loadFromBuffer', () => {
    test('should call progress callbacks with valid zip buffer', async () => {
      // First create an archive
      const createResult = await creator.createFromBuffer({
        input: customConfigPath
      });

      expect(createResult).toSucceed();
      const archiveBuffer = createResult.value!.zipBuffer;

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await loader.loadFromBuffer(archiveBuffer, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(result).toSucceed();
      // Should have multiple progress callbacks throughout the process
      expect(progressCalls.length).toBeGreaterThan(3);

      // Should start with parsing phase
      expect(progressCalls[0]).toEqual({
        phase: 'parsing-zip',
        progress: 0,
        message: 'Parsing ZIP archive'
      });

      // Should have manifest loading phase
      const manifestCall = progressCalls.find(
        (call) => call.phase === 'loading-manifest' && call.message === 'Loading manifest'
      );
      expect(manifestCall).toBeDefined();

      // Should have config loading phase
      const configCall = progressCalls.find(
        (call) => call.phase === 'loading-config' && call.message === 'Loading configuration'
      );
      expect(configCall).toBeDefined();

      // Should have file extraction phase
      const extractingCall = progressCalls.find((call) => call.phase === 'extracting-files');
      expect(extractingCall).toBeDefined();

      // Should end with extracting-files phase
      const finalPhase = progressCalls[progressCalls.length - 1].phase;
      expect(finalPhase).toBe('extracting-files');
    });

    test('should call progress callbacks even when buffer is not a valid zip', async () => {
      const invalidBuffer = new Uint8Array([1, 2, 3, 4]);

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await loader.loadFromBuffer(invalidBuffer, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(result).toFail();
      // Should have at least one progress callback before failing
      expect(progressCalls.length).toBeGreaterThan(0);

      // Should start with parsing phase
      expect(progressCalls[0]).toEqual({
        phase: 'parsing-zip',
        progress: 0,
        message: 'Parsing ZIP archive'
      });
    });

    test('should succeed when zip file has no manifest.json but with undefined manifest', async () => {
      // Create a valid ZIP file but without manifest.json
      // We'll create a simple ZIP with just a text file
      const JSZip = require('jszip');
      const zip = new JSZip();
      zip.file('test.txt', 'Hello, world!');
      const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await loader.loadFromBuffer(zipBuffer, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(result).toSucceedAndSatisfy((loadedResult) => {
        // Should succeed but have undefined manifest
        expect(loadedResult.manifest).toBeUndefined();
        expect(loadedResult.config).toBeUndefined();
        expect(loadedResult.files).toBeDefined();
        expect(loadedResult.files.length).toBe(1);
        expect(loadedResult.files[0].name).toBe('test.txt');
        expect(loadedResult.files[0].content).toBe('Hello, world!');
      });

      // Should have progress callbacks including zip loading and extraction
      expect(progressCalls.length).toBeGreaterThan(1);

      // Should start with parsing phase
      expect(progressCalls[0]).toEqual({
        phase: 'parsing-zip',
        progress: 0,
        message: 'Parsing ZIP archive'
      });

      // Verify we have progress updates
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    test('should fail when manifest specifies config but config file is missing', async () => {
      // Create a ZIP file with a manifest that specifies a config, but the config file is missing
      const JSZip = require('jszip');
      const zip = new JSZip();

      // Add a manifest that specifies a config file at a specific path
      const manifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        config: {
          type: 'file',
          originalPath: '/path/to/config.json',
          archivePath: 'config/missing-config.json'
        }
      };
      zip.file('manifest.json', JSON.stringify(manifest));
      zip.file('test.txt', 'Hello, world!');

      const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await loader.loadFromBuffer(zipBuffer, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(result).toFailWith(
        /Manifest specifies config file at 'config\/missing-config\.json' but it was not found in archive/i
      );

      // Should have some progress callbacks before failing
      expect(progressCalls.length).toBeGreaterThan(1);

      // Should start with parsing phase
      expect(progressCalls[0]).toEqual({
        phase: 'parsing-zip',
        progress: 0,
        message: 'Parsing ZIP archive'
      });

      // Should have manifest loading phase
      const manifestCall = progressCalls.find(
        (call) => call.phase === 'loading-manifest' && call.message === 'Manifest loaded'
      );
      expect(manifestCall).toBeDefined();
    });

    test('should fail when manifest.json is present but malformed', async () => {
      // Create a ZIP file with malformed manifest.json
      const JSZip = require('jszip');
      const zip = new JSZip();

      // Add malformed JSON
      zip.file('manifest.json', '{ "timestamp": "2025-01-15T10:30:00.000Z", "invalid":');
      zip.file('test.txt', 'Hello, world!');

      const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await loader.loadFromBuffer(zipBuffer, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(result).toFailWith(/Failed to parse manifest\.json/i);

      // Should have some progress callbacks before failing
      expect(progressCalls.length).toBeGreaterThan(1);

      // Should start with parsing phase
      expect(progressCalls[0]).toEqual({
        phase: 'parsing-zip',
        progress: 0,
        message: 'Parsing ZIP archive'
      });
    });

    test('should fail when config file is present but malformed', async () => {
      // Create a ZIP file with a valid manifest that specifies a config, but the config file is malformed
      const JSZip = require('jszip');
      const zip = new JSZip();

      // Add a valid manifest that specifies a config file
      const manifest = {
        timestamp: '2025-01-15T10:30:00.000Z',
        config: {
          type: 'file',
          originalPath: '/path/to/config.json',
          archivePath: 'config/malformed-config.json'
        }
      };
      zip.file('manifest.json', JSON.stringify(manifest));

      // Add malformed config file
      zip.file('config/malformed-config.json', '{ "qualifierTypes": [{ "invalid json":');
      zip.file('test.txt', 'Hello, world!');

      const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await loader.loadFromBuffer(zipBuffer, {}, (phase, progress, message) => {
        progressCalls.push({ phase, progress, message });
      });

      expect(result).toFailWith(/Failed to parse config file 'config\/malformed-config\.json'/i);

      // Should have progress callbacks including manifest loading before failing
      expect(progressCalls.length).toBeGreaterThan(2);

      // Should start with parsing phase
      expect(progressCalls[0]).toEqual({
        phase: 'parsing-zip',
        progress: 0,
        message: 'Parsing ZIP archive'
      });

      // Should have manifest loading phase
      const manifestCall = progressCalls.find(
        (call) => call.phase === 'loading-manifest' && call.message === 'Manifest loaded'
      );
      expect(manifestCall).toBeDefined();
    });
  });
});
