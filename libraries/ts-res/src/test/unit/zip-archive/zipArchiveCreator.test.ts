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
import { ZipArchiveCreator } from '../../../packlets/zip-archive';

describe('ZipArchiveCreator', () => {
  const testDataPath = path.resolve(__dirname, '../../../../../../data/test/ts-res');
  const customConfigPath = path.join(testDataPath, 'custom-config');

  let creator: ZipArchiveCreator;

  beforeEach(() => {
    creator = new ZipArchiveCreator();
  });

  describe('createBuffer', () => {
    test('should create archive from single file', async () => {
      const singleFilePath = path.join(customConfigPath, 'resources-config.json');

      const result = await creator.createFromBuffer({
        input: singleFilePath
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.zipBuffer).toBeInstanceOf(Uint8Array);
        expect(archiveResult.zipBuffer.length).toBeGreaterThan(0);
        expect(archiveResult.manifest.input?.type).toBe('file');
        expect(archiveResult.manifest.input?.originalPath).toContain('resources-config.json');
        expect(archiveResult.manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    test('should create archive from directory', async () => {
      const result = await creator.createFromBuffer({
        input: customConfigPath
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.zipBuffer).toBeInstanceOf(Uint8Array);
        expect(archiveResult.zipBuffer.length).toBeGreaterThan(0);
        expect(archiveResult.manifest.input?.type).toBe('directory');
        expect(archiveResult.manifest.input?.originalPath).toBe(customConfigPath);
        expect(archiveResult.manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    test('should call progress callbacks throughout the process', async () => {
      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await creator.createFromBuffer(
        {
          input: customConfigPath
        },
        (phase, progress, message) => {
          progressCalls.push({ phase, progress, message });
        }
      );

      expect(result).toSucceed();

      // Verify that progress callbacks are called throughout the process
      expect(progressCalls.length).toBeGreaterThan(3); // Should have multiple progress calls

      // Verify the expected progression of calls
      expect(progressCalls[0]).toEqual({
        phase: 'creating-zip',
        progress: 0,
        message: 'Starting ZIP archive creation'
      });

      // Verify that input processing is reported
      const inputProcessingCall = progressCalls.find(
        (call) => call.phase === 'reading-file' && call.message.includes('Processing input')
      );
      expect(inputProcessingCall).toBeDefined();

      // Verify that manifest addition is reported
      const manifestCall = progressCalls.find(
        (call) => call.phase === 'creating-zip' && call.message.includes('Adding manifest')
      );
      expect(manifestCall).toBeDefined();

      // Verify that compression is reported
      const compressionCall = progressCalls.find(
        (call) => call.phase === 'creating-zip' && call.message.includes('Compressing files')
      );
      expect(compressionCall).toBeDefined();

      // Verify final completion call
      const finalCall = progressCalls[progressCalls.length - 1];
      expect(finalCall).toEqual({
        phase: 'creating-zip',
        progress: 100,
        message: 'ZIP archive buffer created'
      });
    });

    test('should work without progress callback', async () => {
      const result = await creator.createFromBuffer({
        input: customConfigPath
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.zipBuffer).toBeInstanceOf(Uint8Array);
        expect(archiveResult.zipBuffer.length).toBeGreaterThan(0);
      });
    });

    test('should fail with non-existent input', async () => {
      const result = await creator.createFromBuffer({
        input: '/non-existent/path'
      });

      expect(result).toFailWith(/no such file/i);
    });

    test('should create archive with custom config', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');
      const result = await creator.createFromBuffer({
        input: customConfigPath,
        config: configPath
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.manifest.config).toBeDefined();
        expect(archiveResult.manifest.config?.type).toBe('file');
        expect(archiveResult.manifest.config?.originalPath).toBe(configPath);
      });
    });

    test('should fail when config file does not exist', async () => {
      const nonExistentConfigPath = path.join(customConfigPath, 'non-existent-config.json');
      const result = await creator.createFromBuffer({
        input: customConfigPath,
        config: nonExistentConfigPath
      });

      expect(result).toFailWith(/Failed to get config file/i);
    });

    test('should call progress callbacks with config processing', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');
      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await creator.createFromBuffer(
        {
          input: customConfigPath,
          config: configPath
        },
        (phase, progress, message) => {
          progressCalls.push({ phase, progress, message });
        }
      );

      expect(result).toSucceed();

      // Verify that config processing is reported in progress
      const configProcessingCall = progressCalls.find(
        (call) => call.phase === 'reading-file' && call.message.includes('Processing config')
      );
      expect(configProcessingCall).toBeDefined();
      expect(configProcessingCall?.message).toContain(configPath);
    });

    test('should call progress callbacks when creating archive from single file', async () => {
      const singleFilePath = path.join(customConfigPath, 'resources-config.json');
      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await creator.createFromBuffer(
        {
          input: singleFilePath
        },
        (phase, progress, message) => {
          progressCalls.push({ phase, progress, message });
        }
      );

      expect(result).toSucceed();

      // Verify that progress callbacks are called for single file processing
      expect(progressCalls.length).toBeGreaterThan(3); // Should have multiple progress calls

      // Verify the expected progression of calls
      expect(progressCalls[0]).toEqual({
        phase: 'creating-zip',
        progress: 0,
        message: 'Starting ZIP archive creation'
      });

      // Verify that input processing is reported
      const inputProcessingCall = progressCalls.find(
        (call) => call.phase === 'reading-file' && call.message.includes('Processing input')
      );
      expect(inputProcessingCall).toBeDefined();
      expect(inputProcessingCall?.message).toContain(singleFilePath);

      // Verify that manifest addition is reported
      const manifestCall = progressCalls.find(
        (call) => call.phase === 'creating-zip' && call.message.includes('Adding manifest')
      );
      expect(manifestCall).toBeDefined();

      // Verify that compression is reported
      const compressionCall = progressCalls.find(
        (call) => call.phase === 'creating-zip' && call.message.includes('Compressing files')
      );
      expect(compressionCall).toBeDefined();

      // Verify final completion call
      const finalCall = progressCalls[progressCalls.length - 1];
      expect(finalCall).toEqual({
        phase: 'creating-zip',
        progress: 100,
        message: 'ZIP archive buffer created'
      });
    });

    test('should call progress callbacks for file additions during directory processing', async () => {
      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await creator.createFromBuffer(
        {
          input: customConfigPath
        },
        (phase, progress, message) => {
          progressCalls.push({ phase, progress, message });
        }
      );

      expect(result).toSucceed();

      // Verify that individual file additions are reported during directory processing
      const fileAdditionCalls = progressCalls.filter(
        (call) => call.phase === 'reading-file' && call.message.includes('Added file:')
      );
      expect(fileAdditionCalls.length).toBeGreaterThan(0);

      // Each file addition should include the archive path
      for (const fileCall of fileAdditionCalls) {
        expect(fileCall.message).toMatch(/Added file: input\//);
      }
    });
  });
});
