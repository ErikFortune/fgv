/*
 * CLI Context Filter Working Tests - Tests that demonstrate working functionality
 */

import '@fgv/ts-utils-jest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as TsRes from '@fgv/ts-res';

describe('CLI Context Filter Working Tests', () => {
  let tempDir: string;
  let cliBin: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, '../../temp/test-temp-working-'));
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
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Successfully compiled resources/);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
      (resources) => {
        expect(resources?.resources?.length).toBeGreaterThan(0);

        const welcomeResource = resources?.resources?.find((r) => r.id === 'test.welcome.message');
        expect(welcomeResource).toBeDefined();
        expect(welcomeResource?.candidates?.length).toBe(1);
        expect(welcomeResource?.candidates?.[0]?.conditions).toEqual([
          { qualifierName: 'language', value: 'en' }
        ]);
        expect(welcomeResource?.candidates?.[0]?.json).toEqual({ text: 'Welcome!' });

        return true;
      }
    );
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
              conditions: { currentTerritory: 'US' }
            },
            {
              json: { symbol: '€', name: 'Euro' },
              conditions: { currentTerritory: 'DE' }
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
      'currentTerritory=US',
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
      (resources) => {
        expect(resources?.resources?.length).toBeGreaterThan(0);

        const currencyResource = resources?.resources?.find((r) => r.id === 'territory.currency.symbol');
        expect(currencyResource).toBeDefined();
        expect(currencyResource?.candidates?.length).toBe(1);
        expect(currencyResource?.candidates?.[0]?.conditions).toEqual([
          { qualifierName: 'currentTerritory', value: 'US' }
        ]);
        expect(currencyResource?.candidates?.[0]?.json).toEqual({ symbol: '$', name: 'US Dollar' });

        return true;
      }
    );
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
              conditions: { language: 'en', currentTerritory: 'US' }
            },
            {
              json: { text: 'Good day' },
              conditions: { language: 'en', currentTerritory: 'GB' }
            },
            {
              json: { text: 'Buenos días' },
              conditions: { language: 'es', currentTerritory: 'ES' }
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
      'language=en|currentTerritory=US',
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
      (resources) => {
        expect(resources?.resources?.length).toBeGreaterThan(0);

        const greetingResource = resources?.resources?.find((r) => r.id === 'multi.greeting.formal');
        expect(greetingResource).toBeDefined();
        expect(greetingResource?.candidates?.length).toBe(1);
        expect(greetingResource?.candidates?.[0]?.conditions).toEqual(
          expect.arrayContaining([
            { qualifierName: 'language', value: 'en' },
            { qualifierName: 'currentTerritory', value: 'US' }
          ])
        );
        expect(greetingResource?.candidates?.[0]?.json).toEqual({ text: 'Good morning' });

        return true;
      }
    );
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
      '--format',
      'source'
    ]);

    expect(result.exitCode).toBe(0);

    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const output = JSON.parse(outputContent);

    expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
      (resources) => {
        expect(resources?.resources?.length).toBeGreaterThan(0);

        const testResource = resources?.resources?.find((r) => r.id === 'json-format.test.comparison');
        expect(testResource).toBeDefined();
        expect(testResource?.candidates?.length).toBeGreaterThanOrEqual(1);
        const englishCandidate = testResource?.candidates?.find((c) =>
          c.conditions?.some((cond) => cond.qualifierName === 'language' && cond.value === 'en')
        );
        expect(englishCandidate).toBeDefined();
        expect(englishCandidate?.conditions).toEqual([{ qualifierName: 'language', value: 'en' }]);
        expect(englishCandidate?.json).toEqual({ text: 'English' });

        return true;
      }
    );
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

    const result = await runCli(['info', '--input', inputFile, '--context-filter', 'language=en']);

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
