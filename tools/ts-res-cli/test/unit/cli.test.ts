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
import { TsResCliApp } from '../../src/cli';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('TsResCliApp', () => {
  let app: TsResCliApp;
  let originalConsoleError: typeof console.error;
  let originalProcessExit: typeof process.exit;
  let originalStderrWrite: typeof process.stderr.write;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  let stderrWriteSpy: jest.SpyInstance;
  let tempDir: string;

  beforeEach(async () => {
    app = new TsResCliApp();

    // Mock console.error, process.exit, and stderr.write to prevent test output
    originalConsoleError = console.error;
    originalProcessExit = process.exit;
    originalStderrWrite = process.stderr.write;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stderrWriteSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(__dirname, '../../test-temp-cli-'));
  });

  afterEach(async () => {
    // Restore original functions
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    process.stderr.write = originalStderrWrite;
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    stderrWriteSpy.mockRestore();

    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('creates a CLI application', () => {
    expect(app).toBeDefined();
  });

  describe('command parsing', () => {
    test('handles help command', async () => {
      const originalWrite = process.stdout.write;
      let helpOutput = '';
      process.stdout.write = jest.fn((chunk: string | Uint8Array) => {
        helpOutput += chunk.toString();
        return true;
      });

      try {
        await app.run(['node', 'ts-res-compile', '--help']);
      } catch (error) {
        // Commander calls process.exit() for help, which our mock prevents
      } finally {
        process.stdout.write = originalWrite;
      }

      expect(helpOutput).toMatch(/Compile and optimize ts-res resources/);
    });

    test('handles version command', async () => {
      const originalWrite = process.stdout.write;
      let versionOutput = '';
      process.stdout.write = jest.fn((chunk: string | Uint8Array) => {
        versionOutput += chunk.toString();
        return true;
      });

      try {
        await app.run(['node', 'ts-res-compile', '--version']);
      } catch (error) {
        // Commander calls process.exit() for version, which our mock prevents
      } finally {
        process.stdout.write = originalWrite;
      }

      expect(versionOutput.trim()).toBe('1.0.0');
    });

    test('handles compile command help', async () => {
      const originalWrite = process.stdout.write;
      let helpOutput = '';
      process.stdout.write = jest.fn((chunk: string | Uint8Array) => {
        helpOutput += chunk.toString();
        return true;
      });

      try {
        await app.run(['node', 'ts-res-compile', 'compile', '--help']);
      } catch (error) {
        // Commander calls process.exit() for help, which our mock prevents
      } finally {
        process.stdout.write = originalWrite;
      }

      expect(helpOutput).toMatch(/Compile resources from input to output format/);
    });
  });

  describe('compile command', () => {
    let inputFile: string;
    let outputFile: string;

    beforeEach(async () => {
      inputFile = path.join(tempDir, 'input.json');
      outputFile = path.join(tempDir, 'output.json');

      // Create test input file in ResourceCollection format
      const testResources = {
        resources: [
          {
            id: 'test.message',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { text: 'Hello' },
                conditions: { language: 'en' }
              }
            ]
          }
        ]
      };
      await fs.writeFile(inputFile, JSON.stringify(testResources, null, 2));
    });

    test('handles missing required options', async () => {
      await app.run(['node', 'ts-res-compile', 'compile']);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('compiles resources successfully', async () => {
      const originalConsoleLog = console.log;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await app.run(['node', 'ts-res-compile', 'compile', '--input', inputFile, '--output', outputFile]);

        // Should not exit with error
        expect(processExitSpy).not.toHaveBeenCalledWith(1);

        // Should print success message
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Successfully compiled resources')
        );

        // Output file should exist
        const outputExists = await fs.stat(outputFile).then(
          () => true,
          () => false
        );
        expect(outputExists).toBe(true);
      } finally {
        console.log = originalConsoleLog;
        consoleLogSpy.mockRestore();
      }
    });

    test('handles quiet mode', async () => {
      const originalConsoleLog = console.log;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await app.run([
          'node',
          'ts-res-compile',
          'compile',
          '--input',
          inputFile,
          '--output',
          outputFile,
          '--quiet'
        ]);

        // Should not print success message in quiet mode
        expect(consoleLogSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Successfully compiled resources')
        );
      } finally {
        console.log = originalConsoleLog;
        consoleLogSpy.mockRestore();
      }
    });

    test('handles compilation errors', async () => {
      await app.run([
        'node',
        'ts-res-compile',
        'compile',
        '--input',
        '/nonexistent/file.json',
        '--output',
        outputFile,
        '--quiet'
      ]);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    });

    test('handles invalid format option', async () => {
      await app.run([
        'node',
        'ts-res-compile',
        'compile',
        '--input',
        inputFile,
        '--output',
        outputFile,
        '--format',
        'invalid',
        '--quiet'
      ]);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid format'));
    });

    test('handles context option', async () => {
      const originalConsoleLog = console.log;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await app.run([
          'node',
          'ts-res-compile',
          'compile',
          '--input',
          inputFile,
          '--output',
          outputFile,
          '--context',
          '{"language": "en"}',
          '--quiet'
        ]);

        expect(processExitSpy).not.toHaveBeenCalledWith(1);
      } finally {
        console.log = originalConsoleLog;
        consoleLogSpy.mockRestore();
      }
    });
  });

  describe('validate command', () => {
    let inputFile: string;

    beforeEach(async () => {
      inputFile = path.join(tempDir, 'input.json');

      // Create test input file in ResourceCollection format
      const testResources = {
        resources: [
          {
            id: 'test.message',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { text: 'Hello' },
                conditions: { language: 'en' }
              }
            ]
          }
        ]
      };
      await fs.writeFile(inputFile, JSON.stringify(testResources, null, 2));
    });

    test('validates resources successfully', async () => {
      const originalConsoleLog = console.log;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await app.run(['node', 'ts-res-compile', 'validate', '--input', inputFile]);

        expect(processExitSpy).not.toHaveBeenCalledWith(1);
        expect(consoleLogSpy).toHaveBeenCalledWith('Resources validated successfully');
      } finally {
        console.log = originalConsoleLog;
        consoleLogSpy.mockRestore();
      }
    });

    test('handles validation errors', async () => {
      // Create invalid resource file
      const invalidResources = [
        {
          id: 'invalid resource id', // Invalid ID with spaces
          json: { text: 'Hello' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        }
      ];
      await fs.writeFile(inputFile, JSON.stringify(invalidResources));

      await app.run(['node', 'ts-res-compile', 'validate', '--input', inputFile, '--quiet']);

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
    });
  });

  describe('info command', () => {
    let inputFile: string;

    beforeEach(async () => {
      inputFile = path.join(tempDir, 'input.json');

      // Create test input file with multiple resources in ResourceCollection format
      const testResources = {
        resources: [
          {
            id: 'test.message',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { text: 'Hello' },
                conditions: { language: 'en' }
              },
              {
                json: { text: 'Hola' },
                conditions: { language: 'es' }
              }
            ]
          }
        ]
      };
      await fs.writeFile(inputFile, JSON.stringify(testResources, null, 2));
    });

    test('displays resource information', async () => {
      const originalConsoleLog = console.log;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await app.run(['node', 'ts-res-compile', 'info', '--input', inputFile]);

        expect(processExitSpy).not.toHaveBeenCalledWith(1);
        expect(consoleLogSpy).toHaveBeenCalled();

        const infoOutput = consoleLogSpy.mock.calls[0][0];
        const info = JSON.parse(infoOutput);

        expect(info).toHaveProperty('totalResources');
        expect(info).toHaveProperty('totalCandidates');
        expect(info.totalResources).toBeGreaterThan(0);
        expect(info.totalCandidates).toBeGreaterThan(0);
      } finally {
        console.log = originalConsoleLog;
        consoleLogSpy.mockRestore();
      }
    });

    test('displays filtered resource information', async () => {
      const originalConsoleLog = console.log;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        await app.run([
          'node',
          'ts-res-compile',
          'info',
          '--input',
          inputFile,
          '--context-filter',
          'language=en'
        ]);

        expect(processExitSpy).not.toHaveBeenCalledWith(1);
        expect(consoleLogSpy).toHaveBeenCalled();

        const infoOutput = consoleLogSpy.mock.calls[0][0];
        const info = JSON.parse(infoOutput);

        expect(info).toHaveProperty('context');
        expect(info.context).toEqual({ language: 'en' });
      } finally {
        console.log = originalConsoleLog;
        consoleLogSpy.mockRestore();
      }
    });
  });
});
