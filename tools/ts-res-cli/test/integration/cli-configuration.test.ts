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

describe('CLI Configuration Tests', () => {
  let tempDir: string;
  let cliBin: string;
  let customConfigTestDataDir: string;

  beforeAll(async () => {
    cliBin = path.resolve(__dirname, '../../bin/ts-res-compile.js');
    customConfigTestDataDir = path.resolve(__dirname, '../../../../data/test/ts-res/custom-config');

    // Verify test data directory exists
    try {
      await fs.access(customConfigTestDataDir);
    } catch (error) {
      throw new Error(`Custom config test data directory not found at: ${customConfigTestDataDir}`);
    }
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, '../../test-temp-config-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  /**
   * Helper function to run CLI commands
   */
  async function runCli(
    args: string[],
    debug = false
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      if (debug) {
        console.log('Running CLI command:', 'node', [cliBin, ...args]);
      }
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

  describe('Configuration compatibility tests', () => {
    test('fails to compile custom-config resources with default configuration', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'src/resources');
      const outputFile = path.join(tempDir, 'default-config-output.json');

      const result = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        outputFile,
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Error|Failed|Invalid/i);

      // The failure should be due to unknown qualifiers like 'territory', 'role', etc.
      // that exist in the custom-config resources but not in the default configuration
    });

    test('succeeds in compiling custom-config resources with correct configuration', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'resources');
      const configFile = path.join(customConfigTestDataDir, 'resources-config.json');
      const outputFile = path.join(tempDir, 'custom-config-output.json');

      const result = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        outputFile,
        '--config',
        configFile,
        '--format',
        'source'
      ]);

      if (process.env.DEBUG_CLI_TESTS === 'true') {
        console.log('CLI stdout:', result.stdout);
        console.log('CLI stderr:', result.stderr);
      }

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Successfully compiled resources/);

      // Verify output file exists and has expected structure
      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      expect(output).toHaveProperty('resources');

      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          expect(resources?.resources?.length).toBeGreaterThan(0);

          // Verify we can compile resources with custom qualifiers
          const hasCustomQualifiers = resources?.resources?.some((resource) =>
            resource.candidates?.some((candidate) =>
              candidate.conditions?.some(
                (condition) =>
                  condition.qualifierName === 'territory' ||
                  condition.qualifierName === 'role' ||
                  condition.qualifierName === 'platform'
              )
            )
          );
          expect(hasCustomQualifiers).toBe(true);

          return true;
        }
      );
    });

    test('test consistent output by building same input twice', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'resources');
      const configFile = path.join(customConfigTestDataDir, 'resources-config.json');
      const firstOutputFile = path.join(tempDir, 'first-build.json');
      const secondOutputFile = path.join(tempDir, 'second-build.json');

      // First compilation
      const firstResult = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        firstOutputFile,
        '--config',
        configFile,
        '--format',
        'source'
      ]);

      expect(firstResult.exitCode).toBe(0);

      // Second compilation of the same input
      const secondResult = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        secondOutputFile,
        '--config',
        configFile,
        '--format',
        'source'
      ]);

      expect(secondResult.exitCode).toBe(0);
      expect(secondResult.stdout).toMatch(/Successfully compiled resources/);

      // Compare the outputs - they should be identical for consistency
      const firstOutput = await fs.readFile(firstOutputFile, 'utf-8');
      const secondOutput = await fs.readFile(secondOutputFile, 'utf-8');

      const firstParsed = JSON.parse(firstOutput);
      const secondParsed = JSON.parse(secondOutput);

      expect(secondParsed).toEqual(firstParsed);
    });

    test('validates configuration file format', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'src/resources');
      const invalidConfigFile = path.join(tempDir, 'invalid-config.json');
      await fs.writeFile(
        invalidConfigFile,
        JSON.stringify({
          // Missing required fields
          name: 'Invalid Config'
        })
      );

      const outputFile = path.join(tempDir, 'invalid-config-output.json');

      const result = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        outputFile,
        '--config',
        invalidConfigFile
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Error|Invalid|Failed/i);
    });

    test('handles missing configuration file gracefully', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'src/resources');
      const missingConfigFile = path.join(tempDir, 'missing-config.json');
      const outputFile = path.join(tempDir, 'missing-config-output.json');

      const result = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        outputFile,
        '--config',
        missingConfigFile
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Error|File not found|ENOENT/i);
    });
  });

  describe('Configuration with context filtering', () => {
    test('compiles with territory context using custom configuration', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'resources');
      const configFile = path.join(customConfigTestDataDir, 'resources-config.json');
      const outputFile = path.join(tempDir, 'territory-filtered.json');

      const result = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        outputFile,
        '--config',
        configFile,
        '--context',
        '{"territory": "CA"}',
        '--partial-match',
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      expect(output).toHaveProperty('resources');

      // Should include resources that match Canadian territory
      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          const hasCanadianTerritory = resources?.resources?.some((resource) =>
            resource.candidates?.some((candidate) =>
              candidate.conditions?.some(
                (condition) => condition.qualifierName === 'territory' && condition.value === 'CA'
              )
            )
          );
          expect(hasCanadianTerritory).toBe(true);
          return true;
        }
      );
    });

    test('compiles with role context using custom configuration', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'resources');
      const configFile = path.join(customConfigTestDataDir, 'resources-config.json');
      const outputFile = path.join(tempDir, 'role-filtered.json');

      const result = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        outputFile,
        '--config',
        configFile,
        '--context',
        '{"role": "admin"}',
        '--partial-match',
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      expect(output).toHaveProperty('resources');

      // Should include resources that match admin role
      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          const hasAdminRole = resources?.resources?.some((resource) =>
            resource.candidates?.some((candidate) =>
              candidate.conditions?.some(
                (condition) => condition.qualifierName === 'role' && condition.value === 'admin'
              )
            )
          );
          expect(hasAdminRole).toBe(true);
          return true;
        }
      );
    });

    test.skip('compiles with complex multi-qualifier context', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'resources');
      const configFile = path.join(customConfigTestDataDir, 'resources-config.json');
      const outputFile = path.join(tempDir, 'complex-filtered.json');

      const result = await runCli([
        'compile',
        '--input',
        resourcesDir,
        '--output',
        outputFile,
        '--config',
        configFile,
        '--context',
        '{"language": "fr-CA", "territory": "CA", "role": "user"}',
        '--partial-match',
        '--format',
        'source'
      ]);

      expect(result.exitCode).toBe(0);

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const output = JSON.parse(outputContent);

      expect(output).toHaveProperty('resources');

      // Should include resources that match the complex context
      expect(TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(output.resources)).toSucceedAndSatisfy(
        (resources) => {
          const hasMatchingConditions = resources?.resources?.some((resource) =>
            resource.candidates?.some((candidate) =>
              candidate.conditions?.some(
                (condition) =>
                  (condition.qualifierName === 'language' && condition.value === 'fr-CA') ||
                  (condition.qualifierName === 'territory' && condition.value === 'CA') ||
                  (condition.qualifierName === 'role' && condition.value === 'user')
              )
            )
          );
          expect(hasMatchingConditions).toBe(true);
          return true;
        }
      );
    });
  });

  describe('Configuration validation and info commands', () => {
    test('validates resources with custom configuration', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'resources');
      const configFile = path.join(customConfigTestDataDir, 'resources-config.json');

      const result = await runCli(['validate', '--input', resourcesDir, '--config', configFile]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Resources validated successfully/);
    });

    test('shows info with custom configuration', async () => {
      const resourcesDir = path.join(customConfigTestDataDir, 'resources');
      const configFile = path.join(customConfigTestDataDir, 'resources-config.json');

      const result = await runCli(['info', '--input', resourcesDir, '--config', configFile]);

      expect(result.exitCode).toBe(0);

      const info = JSON.parse(result.stdout);
      expect(info).toHaveProperty('totalResources');
      expect(info).toHaveProperty('totalCandidates');
      expect(info).toHaveProperty('resourceTypes');
      expect(info).toHaveProperty('qualifiers');

      // Should include custom qualifiers
      expect(info.qualifiers).toContain('territory');
      expect(info.qualifiers).toContain('role');
      expect(info.qualifiers).toContain('platform');
      expect(info.qualifiers).toContain('density');
      expect(info.qualifiers).toContain('region');
    });
  });
});
