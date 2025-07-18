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
import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as TsRes from '@fgv/ts-res';

describe('CLI Integration Tests', () => {
  let tempDir: string;
  let cliBin: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, '../../test-temp-integration-'));
    cliBin = path.resolve(__dirname, '../../bin/ts-res-compile.js');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  /**
   * Helper function to run CLI commands
   */
  async function runCli(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn('node', [cliBin, ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (exitCode) => {
        resolve({ exitCode: exitCode || 0, stdout, stderr });
      });
    });
  }

  describe('Basic CLI functionality', () => {
    test('shows help when run without arguments', async () => {
      const result = await runCli([]);
      expect(result.exitCode).toBe(1); // Commander exits with 1 when no command provided
      expect(result.stderr).toMatch(/Usage:/);
      expect(result.stderr).toMatch(/Commands:/);
    });

    test('shows version with --version flag', async () => {
      const result = await runCli(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('1.0.0');
    });

    test('shows help with --help flag', async () => {
      const result = await runCli(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Compile and optimize ts-res resources/);
    });
  });

  describe('Compile command integration', () => {
    let inputFile: string;
    let outputFile: string;

    beforeEach(async () => {
      inputFile = path.join(tempDir, 'resources.json');
      outputFile = path.join(tempDir, 'compiled.json');

      // Create comprehensive test resources in ResourceCollection format
      const resources = {
        resources: [
          {
            id: 'app.title',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { title: 'My Application' }
              }
            ]
          },
          {
            id: 'messages.welcome',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { text: 'Welcome!', subtitle: 'Please log in' },
                conditions: { language: 'en' }
              },
              {
                json: { text: '¡Bienvenido!', subtitle: 'Por favor inicie sesión' },
                conditions: { language: 'es' }
              },
              {
                json: { text: 'Welcome to the USA!', subtitle: 'Please log in to continue' },
                conditions: { language: 'en-US', territory: 'US' }
              }
            ]
          },
          {
            id: 'buttons.actions',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { submit: 'Submit', cancel: 'Cancel', save: 'Save' },
                conditions: { language: 'en' }
              }
            ]
          }
        ]
      };

      await fs.writeFile(inputFile, JSON.stringify(resources, null, 2));
    });

    test('compiles resources to source format', async () => {
      const result = await runCli([
        'compile',
        '--input',
        inputFile,
        '--output',
        outputFile,
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Successfully compiled resources/);

      // Verify output file exists and has expected structure
      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      expect(output).toHaveProperty('resources');
      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          expect(resources?.resources?.length).toBeGreaterThan(0);
          const resourceIds = resources?.resources?.map((r) => r.id) || [];
          expect(resourceIds).toContain('resources.app.title');
          expect(resourceIds).toContain('resources.messages.welcome');
          expect(resourceIds).toContain('resources.buttons.actions');
          return true;
        }
      );
    });

    test('compiles resources to JavaScript format', async () => {
      const jsOutputFile = path.join(tempDir, 'compiled.js');
      const result = await runCli([
        'compile',
        '--input',
        inputFile,
        '--output',
        jsOutputFile,
        '--format',
        'js'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(jsOutputFile, 'utf-8');
      expect(outputContent).toMatch(/^module\.exports = /);
      expect(outputContent).toMatch(/app\.title/);
    });

    test('compiles resources to TypeScript format', async () => {
      const tsOutputFile = path.join(tempDir, 'compiled.ts');
      const result = await runCli([
        'compile',
        '--input',
        inputFile,
        '--output',
        tsOutputFile,
        '--format',
        'ts'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(tsOutputFile, 'utf-8');
      expect(outputContent).toMatch(/^export const resources = /);
      expect(outputContent).toMatch(/ as const;$/);
    });

    test('compiles with context filtering', async () => {
      const result = await runCli([
        'compile',
        '--input',
        inputFile,
        '--output',
        outputFile,
        '--context',
        '{"language": "en"}',
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      // Should include resources that match English
      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          const resourceIds = resources?.resources?.map((r) => r.id) || [];
          expect(resourceIds).toContain('resources.messages.welcome');
          expect(resourceIds).toContain('resources.buttons.actions');
          return true;
        }
      );
    });

    test('compiles with specific territory context', async () => {
      const result = await runCli([
        'compile',
        '--input',
        inputFile,
        '--output',
        outputFile,
        '--context',
        '{"language": "en-US", "territory": "US"}',
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          const resourceIds = resources?.resources?.map((r) => r.id) || [];
          expect(resourceIds).toContain('resources.messages.welcome');

          // Check that we get the US-specific variant
          const welcomeResource = resources?.resources?.find((r) => r.id === 'resources.messages.welcome');
          expect(welcomeResource).toBeDefined();
          const hasUSVariant = welcomeResource?.candidates?.some(
            (c) =>
              c.conditions?.some((cond) => cond.qualifierName === 'language' && cond.value === 'en-US') &&
              c.conditions?.some((cond) => cond.qualifierName === 'territory' && cond.value === 'US')
          );
          expect(hasUSVariant).toBe(true);
          return true;
        }
      );
    });

    test('compiles with metadata included', async () => {
      const result = await runCli([
        'compile',
        '--input',
        inputFile,
        '--output',
        outputFile,
        '--include-metadata'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      // With compiled format and --include-metadata, output should have metadata and compiledCollection
      expect(output).toHaveProperty('metadata');
      expect(output).toHaveProperty('compiledCollection');
      expect(output.metadata).toHaveProperty('totalResources');
      expect(output.metadata).toHaveProperty('totalCandidates');
      expect(output.metadata).toHaveProperty('resourceTypes');
      expect(output.metadata).toHaveProperty('qualifiers');
      expect(output.metadata.totalResources).toBeGreaterThan(0);
      expect(output.metadata.resourceTypes).toContain('json');
    });

    test('handles quiet mode', async () => {
      const result = await runCli(['compile', '--input', inputFile, '--output', outputFile, '--quiet']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toMatch(/Successfully compiled/);
    });

    test('handles errors gracefully', async () => {
      const result = await runCli(['compile', '--input', '/nonexistent/file.json', '--output', outputFile]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Error:/);
    });

    test('validates input format', async () => {
      const result = await runCli([
        'compile',
        '--input',
        inputFile,
        '--output',
        outputFile,
        '--format',
        'invalid'
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Invalid format/);
    });
  });

  describe('Validate command integration', () => {
    test('validates correct resources', async () => {
      const inputFile = path.join(tempDir, 'valid-resources.json');
      const resources = {
        resources: [
          {
            id: 'test.resource',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { message: 'Hello' },
                conditions: { language: 'en' }
              }
            ]
          }
        ]
      };
      await fs.writeFile(inputFile, JSON.stringify(resources));

      const result = await runCli(['validate', '--input', inputFile]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Resources validated successfully/);
    });

    test('detects invalid resources', async () => {
      const inputFile = path.join(tempDir, 'invalid-resources.json');
      const resources = {
        resources: [
          {
            id: 'invalid resource id', // Invalid ID with spaces
            resourceTypeName: 'json',
            candidates: [
              {
                json: { message: 'Hello' },
                conditions: { language: 'en' }
              }
            ]
          }
        ]
      };
      await fs.writeFile(inputFile, JSON.stringify(resources));

      const result = await runCli(['validate', '--input', inputFile]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Validation failed/);
    });
  });

  describe('Info command integration', () => {
    test('displays resource information', async () => {
      const inputFile = path.join(tempDir, 'info-resources.json');
      const resources = {
        resources: [
          {
            id: 'info.test1',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { message: 'Hello' },
                conditions: { language: 'en' }
              }
            ]
          },
          {
            id: 'info.test2',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { message: 'Hola' },
                conditions: { language: 'es' }
              }
            ]
          }
        ]
      };
      await fs.writeFile(inputFile, JSON.stringify(resources));

      const result = await runCli(['info', '--input', inputFile]);

      expect(result.exitCode).toBe(0);

      const info = JSON.parse(result.stdout);
      expect(info).toHaveProperty('totalResources');
      expect(info).toHaveProperty('totalCandidates');
      expect(info).toHaveProperty('resourceTypes');
      expect(info).toHaveProperty('qualifiers');
      expect(info.totalResources).toBeGreaterThan(0);
      expect(info.resourceTypes).toContain('json');
      expect(info.qualifiers).toContain('language');
    });

    test('displays filtered resource information', async () => {
      const inputFile = path.join(tempDir, 'filter-resources.json');
      const resources = {
        resources: [
          {
            id: 'filter.test1',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { message: 'Hello' },
                conditions: { language: 'en' }
              }
            ]
          },
          {
            id: 'filter.test2',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { message: 'Hola' },
                conditions: { language: 'es' }
              }
            ]
          }
        ]
      };
      await fs.writeFile(inputFile, JSON.stringify(resources));

      const result = await runCli(['info', '--input', inputFile, '--context', '{"language": "en"}']);

      expect(result.exitCode).toBe(0);

      const info = JSON.parse(result.stdout);
      expect(info).toHaveProperty('context');
      expect(info.context).toEqual({ language: 'en' });
      expect(info.filteredResources).toBeGreaterThan(0);
      expect(info.filteredCandidates).toBeGreaterThan(0);
    });
  });

  describe('Directory input integration', () => {
    test('processes multiple files in a directory', async () => {
      const inputDir = path.join(tempDir, 'resources');
      await fs.mkdir(inputDir);

      // Create multiple resource files
      const messages = {
        resources: [
          {
            id: 'dir.messages.hello',
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

      const buttons = {
        resources: [
          {
            id: 'dir.buttons.ok',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { label: 'OK' },
                conditions: { language: 'en' }
              }
            ]
          }
        ]
      };

      await fs.writeFile(path.join(inputDir, 'messages.json'), JSON.stringify(messages));
      await fs.writeFile(path.join(inputDir, 'buttons.json'), JSON.stringify(buttons));

      const outputFile = path.join(tempDir, 'directory-output.json');
      const result = await runCli([
        'compile',
        '--input',
        inputDir,
        '--output',
        outputFile,
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          expect(resources?.resources?.length).toBe(2);
          const resourceIds = resources?.resources?.map((r) => r.id) || [];
          expect(resourceIds).toContain('resources.messages.dir.messages.hello');
          expect(resourceIds).toContain('resources.buttons.dir.buttons.ok');
          return true;
        }
      );
    });
  });
});
