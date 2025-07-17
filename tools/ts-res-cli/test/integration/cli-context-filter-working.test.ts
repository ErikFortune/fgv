/*
 * CLI Context Filter Working Tests - Tests that demonstrate working functionality
 */

import '@fgv/ts-utils-jest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

describe('CLI Context Filter Working Tests', () => {
  let tempDir: string;
  let cliBin: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, '../../test-temp-working-'));
    cliBin = path.resolve(__dirname, '../../bin/ts-res-compile.js');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

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

  test('context filter successfully filters language candidates', async () => {
    const inputFile = path.join(tempDir, 'test.json');
    const outputFile = path.join(tempDir, 'output.json');

    const resources = {
      resources: [
        {
          id: 'welcome.message',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Welcome!' },
              conditions: { language: 'en' }
            },
            {
              json: { text: '¡Bienvenido!' },
              conditions: { language: 'es' }
            },
            {
              json: { text: 'Willkommen!' },
              conditions: { language: 'de' }
            }
          ]
        }
      ]
    };

    await fs.writeFile(inputFile, JSON.stringify(resources, null, 2));

    const result = await runCli([
      'compile',
      '--input',
      inputFile,
      '--output',
      outputFile,
      '--context-filter',
      'language=en',
      '--partial-match',
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Successfully compiled resources/);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    const resourceKeys = Object.keys(output.resources);
    expect(resourceKeys).toContain('test.welcome.message');

    const welcomeResource = output.resources['test.welcome.message'];
    const candidateKeys = Object.keys(welcomeResource);

    // Should only include English candidates
    expect(candidateKeys).toContain('language-[en]@600');
    expect(candidateKeys).not.toContain('language-[es]@600');
    expect(candidateKeys).not.toContain('language-[de]@600');

    // Verify the actual content
    expect(welcomeResource['language-[en]@600']).toEqual({ text: 'Welcome!' });
  });

  test('context filter works with territory qualifier', async () => {
    const inputFile = path.join(tempDir, 'territory.json');
    const outputFile = path.join(tempDir, 'territory-output.json');

    const resources = {
      resources: [
        {
          id: 'currency.symbol',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { symbol: '$', name: 'US Dollar' },
              conditions: { territory: 'US' }
            },
            {
              json: { symbol: '€', name: 'Euro' },
              conditions: { territory: 'DE' }
            }
          ]
        }
      ]
    };

    await fs.writeFile(inputFile, JSON.stringify(resources, null, 2));

    const result = await runCli([
      'compile',
      '--input',
      inputFile,
      '--output',
      outputFile,
      '--context-filter',
      'territory=US',
      '--partial-match',
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    const currencyResource = output.resources['territory.currency.symbol'];
    const candidateKeys = Object.keys(currencyResource);

    // Should only include US territory candidates
    expect(candidateKeys).toContain('territory-[US]@500');
    expect(candidateKeys).not.toContain('territory-[DE]@500');

    // Verify the actual content
    expect(currencyResource['territory-[US]@500']).toEqual({ symbol: '$', name: 'US Dollar' });
  });

  test('context filter works with multiple qualifiers', async () => {
    const inputFile = path.join(tempDir, 'multi.json');
    const outputFile = path.join(tempDir, 'multi-output.json');

    const resources = {
      resources: [
        {
          id: 'greeting.formal',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Good morning' },
              conditions: { language: 'en', territory: 'US' }
            },
            {
              json: { text: 'Good day' },
              conditions: { language: 'en', territory: 'GB' }
            },
            {
              json: { text: 'Buenos días' },
              conditions: { language: 'es', territory: 'ES' }
            }
          ]
        }
      ]
    };

    await fs.writeFile(inputFile, JSON.stringify(resources, null, 2));

    const result = await runCli([
      'compile',
      '--input',
      inputFile,
      '--output',
      outputFile,
      '--context-filter',
      'language=en|territory=US',
      '--partial-match',
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    const greetingResource = output.resources['multi.greeting.formal'];
    const candidateKeys = Object.keys(greetingResource);

    // Should only include US English candidates
    expect(candidateKeys).toContain('language-[en]@600+territory-[US]@500');
    expect(candidateKeys).not.toContain('language-[en]@600+territory-[GB]@500');
    expect(candidateKeys).not.toContain('language-[es]@600+territory-[ES]@500');

    // Verify the actual content
    expect(greetingResource['language-[en]@600+territory-[US]@500']).toEqual({ text: 'Good morning' });
  });

  test('context filter works with JSON format for comparison', async () => {
    const inputFile = path.join(tempDir, 'json-format.json');
    const outputFile = path.join(tempDir, 'json-format-output.json');

    const resources = {
      resources: [
        {
          id: 'test.comparison',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'English' },
              conditions: { language: 'en' }
            },
            {
              json: { text: 'Spanish' },
              conditions: { language: 'es' }
            }
          ]
        }
      ]
    };

    await fs.writeFile(inputFile, JSON.stringify(resources, null, 2));

    const result = await runCli([
      'compile',
      '--input',
      inputFile,
      '--output',
      outputFile,
      '--context',
      '{"language": "en"}',
      '--partial-match',
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    const testResource = output.resources['json-format.test.comparison'];
    const candidateKeys = Object.keys(testResource);

    // Should only include English candidates (same result as context filter)
    expect(candidateKeys).toContain('language-[en]@600');
    expect(candidateKeys).not.toContain('language-[es]@600');

    // Verify the actual content
    expect(testResource['language-[en]@600']).toEqual({ text: 'English' });
  });

  test('info command works with context filter', async () => {
    const inputFile = path.join(tempDir, 'info.json');

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

    await fs.writeFile(inputFile, JSON.stringify(resources, null, 2));

    const result = await runCli([
      'info',
      '--input',
      inputFile,
      '--context-filter',
      'language=en',
      '--partial-match'
    ]);

    expect(result.exitCode).toBe(0);

    const info = JSON.parse(result.stdout);
    expect(info).toHaveProperty('totalResources');
    expect(info).toHaveProperty('filteredResources');
    expect(info).toHaveProperty('totalCandidates');
    expect(info).toHaveProperty('filteredCandidates');

    expect(info.totalResources).toBe(2);
    expect(info.filteredResources).toBeLessThanOrEqual(info.totalResources); // Resources should be filtered
    expect(info.filteredCandidates).toBe(1); // Only English candidate should be included
  });
});
