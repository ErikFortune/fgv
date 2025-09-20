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
import { fail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
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
        inputPath: singleFilePath
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
        inputPath: customConfigPath
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
          inputPath: customConfigPath
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
        inputPath: customConfigPath
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.zipBuffer).toBeInstanceOf(Uint8Array);
        expect(archiveResult.zipBuffer.length).toBeGreaterThan(0);
      });
    });

    test('should fail with non-existent input', async () => {
      const result = await creator.createFromBuffer({
        inputPath: '/non-existent/path'
      });

      expect(result).toFailWith(/no such file/i);
    });

    test('should create archive with custom config', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');
      const result = await creator.createFromBuffer({
        inputPath: customConfigPath,
        configPath: configPath
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
        inputPath: customConfigPath,
        configPath: nonExistentConfigPath
      });

      expect(result).toFailWith(/Failed to get config file/i);
    });

    test('should call progress callbacks with config processing', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');
      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await creator.createFromBuffer(
        {
          inputPath: customConfigPath,
          configPath: configPath
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
          inputPath: singleFilePath
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
          inputPath: customConfigPath
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

  describe('createFromBuffer with FileTree items', () => {
    test('should create archive from FileTree directory item', async () => {
      // Create FileTree and get directory item
      const fileTree = FileTree.forFilesystem().orThrow();
      const directoryItem = fileTree.getItem(customConfigPath).orThrow();

      // Verify it's a directory
      expect(directoryItem.type).toBe('directory');

      const result = await creator.createFromBuffer({
        inputItem: directoryItem
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.zipBuffer).toBeInstanceOf(Uint8Array);
        expect(archiveResult.zipBuffer.length).toBeGreaterThan(0);
        expect(archiveResult.manifest.input?.type).toBe('directory');
        expect(archiveResult.manifest.input?.originalPath).toBe(customConfigPath);
        expect(archiveResult.manifest.input?.archivePath).toBe(`input/${path.basename(customConfigPath)}`);
        expect(archiveResult.manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    test('should create archive from FileTree file item', async () => {
      const singleFilePath = path.join(customConfigPath, 'resources-config.json');

      // Create FileTree and get file item
      const fileTree = FileTree.forFilesystem().orThrow();
      const fileItem = fileTree.getFile(singleFilePath).orThrow();

      const result = await creator.createFromBuffer({
        inputItem: fileItem
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.zipBuffer).toBeInstanceOf(Uint8Array);
        expect(archiveResult.zipBuffer.length).toBeGreaterThan(0);
        expect(archiveResult.manifest.input?.type).toBe('file');
        expect(archiveResult.manifest.input?.originalPath).toBe(singleFilePath);
        expect(archiveResult.manifest.input?.archivePath).toBe('input/resources-config.json');
        expect(archiveResult.manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    test('should create archive with FileTree config item', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');

      // Create FileTree and get items
      const fileTree = FileTree.forFilesystem().orThrow();
      const directoryItem = fileTree.getItem(customConfigPath).orThrow();
      const configItem = fileTree.getFile(configPath).orThrow();

      const result = await creator.createFromBuffer({
        inputItem: directoryItem,
        configItem: configItem
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.manifest.config).toBeDefined();
        expect(archiveResult.manifest.config?.type).toBe('file');
        expect(archiveResult.manifest.config?.originalPath).toBe(configPath);
        expect(archiveResult.manifest.config?.archivePath).toBe('config/resources-config.json');
      });
    });

    test('should produce equivalent results with FileTree items vs paths', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');

      // Create archive using paths
      const pathResult = await creator.createFromBuffer({
        inputPath: customConfigPath,
        configPath: configPath
      });

      // Create archive using FileTree items
      const fileTree = FileTree.forFilesystem().orThrow();
      const directoryItem = fileTree.getItem(customConfigPath).orThrow();
      const configItem = fileTree.getFile(configPath).orThrow();

      const itemResult = await creator.createFromBuffer({
        inputItem: directoryItem,
        configItem: configItem
      });

      expect(pathResult).toSucceed();
      expect(itemResult).toSucceed();

      const pathArchive = pathResult.value!;
      const itemArchive = itemResult.value!;

      // Compare manifests (excluding timestamp which will differ)
      expect(itemArchive.manifest.input?.type).toBe(pathArchive.manifest.input?.type);
      expect(itemArchive.manifest.input?.originalPath).toBe(pathArchive.manifest.input?.originalPath);
      expect(itemArchive.manifest.input?.archivePath).toBe(pathArchive.manifest.input?.archivePath);

      expect(itemArchive.manifest.config?.type).toBe(pathArchive.manifest.config?.type);
      expect(itemArchive.manifest.config?.originalPath).toBe(pathArchive.manifest.config?.originalPath);
      expect(itemArchive.manifest.config?.archivePath).toBe(pathArchive.manifest.config?.archivePath);

      // Compare ZIP sizes (should be very similar, allowing for slight timestamp differences)
      const sizeDifference = Math.abs(itemArchive.size - pathArchive.size);
      expect(sizeDifference).toBeLessThan(100); // Allow small difference due to timestamps
    });

    test('should call progress callbacks with FileTree items', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');

      // Create FileTree and get items
      const fileTree = FileTree.forFilesystem().orThrow();
      const directoryItem = fileTree.getItem(customConfigPath).orThrow();
      const configItem = fileTree.getFile(configPath).orThrow();

      const progressCalls: Array<{ phase: string; progress: number; message: string }> = [];

      const result = await creator.createFromBuffer(
        {
          inputItem: directoryItem,
          configItem: configItem
        },
        (phase, progress, message) => {
          progressCalls.push({ phase, progress, message });
        }
      );

      expect(result).toSucceed();

      // Verify progress callbacks are called
      expect(progressCalls.length).toBeGreaterThan(3);

      // Verify input processing callback
      const inputProcessingCall = progressCalls.find(
        (call) => call.phase === 'reading-file' && call.message.includes('Processing input')
      );
      expect(inputProcessingCall).toBeDefined();
      expect(inputProcessingCall?.message).toContain(customConfigPath);

      // Verify config processing callback
      const configProcessingCall = progressCalls.find(
        (call) => call.phase === 'reading-file' && call.message.includes('Processing config')
      );
      expect(configProcessingCall).toBeDefined();
      expect(configProcessingCall?.message).toContain(configPath);
    });

    test('should work with only inputItem and no config', async () => {
      // Create FileTree and get directory item
      const fileTree = FileTree.forFilesystem().orThrow();
      const directoryItem = fileTree.getItem(customConfigPath).orThrow();

      const result = await creator.createFromBuffer({
        inputItem: directoryItem
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.manifest.input?.type).toBe('directory');
        expect(archiveResult.manifest.input?.originalPath).toBe(customConfigPath);
        expect(archiveResult.manifest.config).toBeUndefined();
      });
    });

    test('should work with only configItem and no input', async () => {
      const configPath = path.join(customConfigPath, 'resources-config.json');

      // Create FileTree and get config item
      const fileTree = FileTree.forFilesystem().orThrow();
      const configItem = fileTree.getFile(configPath).orThrow();

      const result = await creator.createFromBuffer({
        configItem: configItem
      });

      expect(result).toSucceedAndSatisfy((archiveResult) => {
        expect(archiveResult.manifest.input).toBeUndefined();
        expect(archiveResult.manifest.config?.type).toBe('file');
        expect(archiveResult.manifest.config?.originalPath).toBe(configPath);
      });
    });

    test('should fail gracefully when FileTree item operations fail', async () => {
      // Create a mock FileTree item that will fail on getRawContents
      const mockFileItem = {
        name: 'test.json',
        absolutePath: '/mock/test.json',
        type: 'file' as const,
        getRawContents: () => {
          return fail('Mock file read error');
        }
      } as FileTree.IFileTreeFileItem;

      const result = await creator.createFromBuffer({
        inputItem: mockFileItem
      });

      expect(result).toFailWith(/Mock file read error/);
    });
  });
});
