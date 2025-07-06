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
import { ResourceCompiler } from '../../compiler';
import { ICompileOptions } from '../../options';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('ResourceCompiler', () => {
  let tempDir: string;
  let inputFile: string;
  let outputFile: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(__dirname, '../../test-temp-'));
    inputFile = path.join(tempDir, 'input.json');
    outputFile = path.join(tempDir, 'output.json');

    // Create test input file
    const testResources = [
      {
        id: 'test.message',
        json: { text: 'Hello' },
        conditions: { language: 'en' },
        resourceTypeName: 'json'
      },
      {
        id: 'test.message',
        json: { text: 'Hola' },
        conditions: { language: 'es' },
        resourceTypeName: 'json'
      }
    ];
    await fs.writeFile(inputFile, JSON.stringify(testResources, null, 2));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    test('creates a compiler with options', () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      expect(compiler).toBeDefined();
    });
  });

  describe('compile method', () => {
    test('compiles resources to JSON format', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      // Check that output file was created
      const outputExists = await fs.stat(outputFile).then(
        () => true,
        () => false
      );
      expect(outputExists).toBe(true);

      // Check output content
      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      expect(outputData).toHaveProperty('resources');
      expect(Object.keys(outputData.resources)).toContain('test.message');
    });

    test('compiles with context filtering and excludes non-matching variants', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        context: '{"language": "en"}',
        format: 'json',
        mode: 'development',
        partialMatch: false, // Strict matching
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      // Verify the resource exists
      expect(outputData.resources['test.message']).toBeDefined();

      const messageResource = outputData.resources['test.message'];
      const conditionKeys = Object.keys(messageResource);

      // Should only contain English variants
      expect(conditionKeys.some((key) => key.includes('en'))).toBe(true);
      // Should NOT contain Spanish variants
      expect(conditionKeys.some((key) => key.includes('es'))).toBe(false);

      // Verify the content is correct
      const englishCondition = conditionKeys.find((key) => key.includes('en'));
      expect(messageResource[englishCondition!]).toEqual({ text: 'Hello' });

      // Verify metadata shows filtering occurred
      expect(outputData.metadata).toBeDefined();
      expect(outputData.metadata.totalCandidates).toBe(2); // Both en and es
      expect(outputData.metadata.filteredCandidates).toBe(1); // Only en after filtering
    });

    test('context filtering with multiple resources shows selective filtering', async () => {
      // Create a more complex test file with multiple resources and languages
      const complexTestFile = path.join(tempDir, 'complex-input.json');
      const complexTestResources = [
        // Resource 1: Has both en and es
        {
          id: 'greeting.hello',
          json: { text: 'Hello' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        },
        {
          id: 'greeting.hello',
          json: { text: 'Hola' },
          conditions: { language: 'es' },
          resourceTypeName: 'json'
        },

        // Resource 2: Only has en
        { id: 'button.ok', json: { label: 'OK' }, conditions: { language: 'en' }, resourceTypeName: 'json' },

        // Resource 3: Only has es
        {
          id: 'error.notfound',
          json: { message: 'Not found' },
          conditions: { language: 'es' },
          resourceTypeName: 'json'
        },

        // Resource 4: No language condition (default)
        { id: 'app.name', json: { title: 'My App' }, resourceTypeName: 'json' }
      ];

      await fs.writeFile(complexTestFile, JSON.stringify(complexTestResources, null, 2));

      const complexOutputFile = path.join(tempDir, 'complex-output.json');
      const options: ICompileOptions = {
        input: complexTestFile,
        output: complexOutputFile,
        context: '{"language": "en"}',
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();
      expect(result).toSucceed();

      const outputContent = await fs.readFile(complexOutputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      // Verify what should be included
      expect(Object.keys(outputData.resources)).toContain('greeting.hello'); // Has en variant
      expect(Object.keys(outputData.resources)).toContain('button.ok'); // Only has en
      expect(Object.keys(outputData.resources)).toContain('app.name'); // No language condition (default)

      // Verify what should be excluded
      expect(Object.keys(outputData.resources)).not.toContain('error.notfound'); // Only has es

      // Verify greeting.hello only has English, not Spanish
      const greetingResource = outputData.resources['greeting.hello'];
      const greetingKeys = Object.keys(greetingResource);
      expect(greetingKeys.some((key) => key.includes('en'))).toBe(true);
      expect(greetingKeys.some((key) => key.includes('es'))).toBe(false);

      // Verify metadata
      expect(outputData.metadata.totalCandidates).toBe(5); // All 5 candidates
      expect(outputData.metadata.filteredCandidates).toBe(3); // greeting.hello[en], button.ok[en], app.name[default]
      expect(outputData.metadata.totalResources).toBe(4); // 4 unique resource IDs
      expect(outputData.metadata.filteredResources).toBe(3); // Only 3 resources match context
    });

    test('context filtering with no matches produces empty output', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        context: '{"language": "fr"}', // French - not in our test data
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();
      expect(result).toSucceed();

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      // Should have no resources in output
      expect(Object.keys(outputData.resources)).toHaveLength(0);

      // Metadata should show filtering occurred
      expect(outputData.metadata.totalCandidates).toBe(2); // Both en and es in input
      expect(outputData.metadata.filteredCandidates).toBe(0); // None match French
      expect(outputData.metadata.totalResources).toBe(1); // 1 resource ID in input
      expect(outputData.metadata.filteredResources).toBe(0); // No resources match
    });

    test('context filtering with language variants uses fuzzy matching', async () => {
      // Create test data with various English variants and other languages
      const variantTestFile = path.join(tempDir, 'variant-input.json');
      const variantTestResources = [
        // English variants that should match en-GB
        {
          id: 'msg.hello',
          json: { text: 'Hello (US)' },
          conditions: { language: 'en-US' },
          resourceTypeName: 'json'
        },
        {
          id: 'msg.hello',
          json: { text: 'Hello (CA)' },
          conditions: { language: 'en-CA' },
          resourceTypeName: 'json'
        },
        {
          id: 'msg.hello',
          json: { text: 'Hello (AU)' },
          conditions: { language: 'en-AU' },
          resourceTypeName: 'json'
        },
        {
          id: 'msg.hello',
          json: { text: 'Hello (generic)' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        },

        // French variants that should NOT match en-GB
        {
          id: 'msg.hello',
          json: { text: 'Bonjour (FR)' },
          conditions: { language: 'fr-FR' },
          resourceTypeName: 'json'
        },
        {
          id: 'msg.hello',
          json: { text: 'Bonjour (CA)' },
          conditions: { language: 'fr-CA' },
          resourceTypeName: 'json'
        },
        {
          id: 'msg.hello',
          json: { text: 'Bonjour (generic)' },
          conditions: { language: 'fr' },
          resourceTypeName: 'json'
        },

        // Spanish variants that should NOT match en-GB
        {
          id: 'msg.hello',
          json: { text: 'Hola (ES)' },
          conditions: { language: 'es-ES' },
          resourceTypeName: 'json'
        },
        {
          id: 'msg.hello',
          json: { text: 'Hola (MX)' },
          conditions: { language: 'es-MX' },
          resourceTypeName: 'json'
        },

        // Different resource with mixed variants
        {
          id: 'btn.save',
          json: { label: 'Save (US)' },
          conditions: { language: 'en-US' },
          resourceTypeName: 'json'
        },
        {
          id: 'btn.save',
          json: { label: 'Save (FR)' },
          conditions: { language: 'fr-FR' },
          resourceTypeName: 'json'
        },

        // Resource with no language condition (should always match)
        { id: 'app.version', json: { version: '1.0.0' }, resourceTypeName: 'json' }
      ];

      await fs.writeFile(variantTestFile, JSON.stringify(variantTestResources, null, 2));

      const variantOutputFile = path.join(tempDir, 'variant-output.json');
      const options: ICompileOptions = {
        input: variantTestFile,
        output: variantOutputFile,
        context: '{"language": "en-GB"}', // British English - should match other English variants
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();
      expect(result).toSucceed();

      const outputContent = await fs.readFile(variantOutputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      // Verify all resources that should match are included
      expect(Object.keys(outputData.resources)).toContain('msg.hello');
      expect(Object.keys(outputData.resources)).toContain('btn.save');
      expect(Object.keys(outputData.resources)).toContain('app.version'); // No language condition

      // Verify msg.hello contains English variants but not French/Spanish
      const helloResource = outputData.resources['msg.hello'];
      const helloKeys = Object.keys(helloResource);

      // Should include English variants (fuzzy matching)
      expect(helloKeys.some((key) => key.includes('en-US'))).toBe(true);
      expect(helloKeys.some((key) => key.includes('en-CA'))).toBe(true);
      expect(helloKeys.some((key) => key.includes('en-AU'))).toBe(true);
      expect(helloKeys.some((key) => key.includes('en]') && !key.includes('en-'))).toBe(true); // Generic 'en'

      // Should NOT include French or Spanish variants
      expect(helloKeys.some((key) => key.includes('fr'))).toBe(false);
      expect(helloKeys.some((key) => key.includes('es'))).toBe(false);

      // Verify btn.save only has English variants
      const saveResource = outputData.resources['btn.save'];
      const saveKeys = Object.keys(saveResource);
      expect(saveKeys.some((key) => key.includes('en-US'))).toBe(true);
      expect(saveKeys.some((key) => key.includes('fr'))).toBe(false);

      // Verify app.version has default condition (no language)
      const versionResource = outputData.resources['app.version'];
      expect(versionResource).toHaveProperty('default');

      // Verify metadata shows appropriate filtering
      expect(outputData.metadata.totalCandidates).toBe(12); // All input candidates
      // Should filter to: 4 English msg.hello + 1 English btn.save + 1 app.version = 6
      expect(outputData.metadata.filteredCandidates).toBe(6);
      expect(outputData.metadata.totalResources).toBe(3); // 3 unique resource IDs
      expect(outputData.metadata.filteredResources).toBe(3); // All 3 resources have matching candidates
    });

    test('context filtering with partial matching enabled is more permissive', async () => {
      // Test that partial matching allows broader matches
      const options: ICompileOptions = {
        input: inputFile, // Uses basic test data with en/es
        output: outputFile,
        context: '{"language": "en-GB"}',
        format: 'json',
        mode: 'development',
        partialMatch: true, // Enable partial matching
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();
      expect(result).toSucceed();

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      // With partial matching, should still find English matches
      expect(outputData.resources['test.message']).toBeDefined();

      const messageResource = outputData.resources['test.message'];
      const conditionKeys = Object.keys(messageResource);

      // Should include English (partial match for en-GB -> en)
      expect(conditionKeys.some((key) => key.includes('en'))).toBe(true);
      // Should still exclude Spanish
      expect(conditionKeys.some((key) => key.includes('es'))).toBe(false);

      // Verify metadata
      expect(outputData.metadata.totalCandidates).toBe(2);
      expect(outputData.metadata.filteredCandidates).toBe(1); // Only English matches
    });

    test('compiles with metadata included', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      expect(outputData).toHaveProperty('metadata');
      expect(outputData.metadata).toHaveProperty('totalResources');
      expect(outputData.metadata).toHaveProperty('totalCandidates');
    });

    test('compiles to JavaScript format', async () => {
      const jsOutputFile = path.join(tempDir, 'output.js');
      const options: ICompileOptions = {
        input: inputFile,
        output: jsOutputFile,
        format: 'js',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      const outputContent = await fs.readFile(jsOutputFile, 'utf-8');
      expect(outputContent).toMatch(/^module\.exports = /);
    });

    test('compiles to TypeScript format', async () => {
      const tsOutputFile = path.join(tempDir, 'output.ts');
      const options: ICompileOptions = {
        input: inputFile,
        output: tsOutputFile,
        format: 'ts',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      const outputContent = await fs.readFile(tsOutputFile, 'utf-8');
      expect(outputContent).toMatch(/^export const resources = /);
      expect(outputContent).toMatch(/ as const;$/);
    });

    test('handles minified output', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'production',
        partialMatch: false,
        sourceMaps: false,
        minify: true,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      // Minified JSON should not have pretty formatting
      expect(outputContent).not.toMatch(/\n\s+/);
    });

    test('fails with invalid input file', async () => {
      const options: ICompileOptions = {
        input: '/nonexistent/file.json',
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toFailWith(/Failed to load resources/);
    });

    test('handles directory input', async () => {
      const inputDir = path.join(tempDir, 'resources');
      await fs.mkdir(inputDir);

      const resource1 = path.join(inputDir, 'messages.json');
      const resource2 = path.join(inputDir, 'buttons.json');

      await fs.writeFile(
        resource1,
        JSON.stringify([
          {
            id: 'msg.hello',
            json: { text: 'Hello' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ])
      );

      await fs.writeFile(
        resource2,
        JSON.stringify([
          {
            id: 'btn.ok',
            json: { label: 'OK' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ])
      );

      const options: ICompileOptions = {
        input: inputDir,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      expect(Object.keys(outputData.resources)).toContain('msg.hello');
      expect(Object.keys(outputData.resources)).toContain('btn.ok');
    });
  });

  describe('idempotency and stability tests', () => {
    test('produces identical output when compiled multiple times', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      // First compilation
      const compiler1 = new ResourceCompiler(options);
      const result1 = await compiler1.compile();
      expect(result1).toSucceed();

      const output1 = await fs.readFile(outputFile, 'utf-8');
      const data1 = JSON.parse(output1);

      // Second compilation with same input
      const outputFile2 = path.join(tempDir, 'output2.json');
      const options2 = { ...options, output: outputFile2 };
      const compiler2 = new ResourceCompiler(options2);
      const result2 = await compiler2.compile();
      expect(result2).toSucceed();

      const output2 = await fs.readFile(outputFile2, 'utf-8');
      const data2 = JSON.parse(output2);

      // Outputs should be identical
      expect(data1).toEqual(data2);
    });

    test('produces deterministic output regardless of compilation order', async () => {
      // Test with a directory containing multiple files to ensure
      // file processing order doesn't affect output
      const testDir = path.join(tempDir, 'multi-files');
      await fs.mkdir(testDir, { recursive: true });

      // Create multiple resource files
      const file1 = path.join(testDir, '001-first.json');
      const file2 = path.join(testDir, '002-second.json');
      const file3 = path.join(testDir, '003-third.json');

      await fs.writeFile(
        file1,
        JSON.stringify([
          {
            id: 'msg.hello',
            json: { text: 'Hello' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ])
      );
      await fs.writeFile(
        file2,
        JSON.stringify([
          {
            id: 'msg.goodbye',
            json: { text: 'Goodbye' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ])
      );
      await fs.writeFile(
        file3,
        JSON.stringify([
          {
            id: 'msg.welcome',
            json: { text: 'Welcome' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ])
      );

      const options: ICompileOptions = {
        input: testDir,
        output: path.join(tempDir, 'deterministic-output.json'),
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      // Compile multiple times
      const outputs: string[] = [];
      for (let i = 0; i < 3; i++) {
        const outputFile = path.join(tempDir, `deterministic-${i}.json`);
        const compiler = new ResourceCompiler({ ...options, output: outputFile });
        const result = await compiler.compile();
        expect(result).toSucceed();

        const output = await fs.readFile(outputFile, 'utf-8');
        outputs.push(output);
      }

      // All outputs should be identical
      expect(outputs[0]).toBe(outputs[1]);
      expect(outputs[1]).toBe(outputs[2]);
    });

    test('produces identical output across different format conversions', async () => {
      const baseOptions: ICompileOptions = {
        input: inputFile,
        output: '', // Will be set per format
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      // Test JSON format
      const jsonOutput = path.join(tempDir, 'format-test.json');
      const jsonCompiler = new ResourceCompiler({ ...baseOptions, output: jsonOutput, format: 'json' });
      const jsonResult = await jsonCompiler.compile();
      expect(jsonResult).toSucceed();

      // Test JS format
      const jsOutput = path.join(tempDir, 'format-test.js');
      const jsCompiler = new ResourceCompiler({ ...baseOptions, output: jsOutput, format: 'js' });
      const jsResult = await jsCompiler.compile();
      expect(jsResult).toSucceed();

      // Test TS format
      const tsOutput = path.join(tempDir, 'format-test.ts');
      const tsCompiler = new ResourceCompiler({ ...baseOptions, output: tsOutput, format: 'ts' });
      const tsResult = await tsCompiler.compile();
      expect(tsResult).toSucceed();

      // Parse the JSON output as baseline
      const jsonContent = await fs.readFile(jsonOutput, 'utf-8');
      const jsonData = JSON.parse(jsonContent);

      // Verify JS format contains same data
      const jsContent = await fs.readFile(jsOutput, 'utf-8');
      expect(jsContent).toMatch(/^module\.exports = /);
      // Extract the data part from "module.exports = {...};"
      const jsDataStr = jsContent.replace(/^module\.exports = /, '').replace(/;$/, '');
      const jsData = JSON.parse(jsDataStr);
      expect(jsData).toEqual(jsonData);

      // Verify TS format contains same data
      const tsContent = await fs.readFile(tsOutput, 'utf-8');
      expect(tsContent).toMatch(/^export const resources = /);
      // Extract the data part from "export const resources = {...} as const;"
      const tsDataStr = tsContent.replace(/^export const resources = /, '').replace(/ as const;$/, '');
      const tsData = JSON.parse(tsDataStr);
      expect(tsData).toEqual(jsonData);
    });
  });

  describe('validate method', () => {
    test('validates resources successfully', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.validate();

      expect(result).toSucceed();
    });

    test('fails validation with invalid resources', async () => {
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

      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.validate();

      expect(result).toFailWith(/invalid id/);
    });
  });

  describe('getInfo method', () => {
    test('returns resource information', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'json',
        mode: 'development',
        partialMatch: false,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.getInfo();

      expect(result).toSucceedAndSatisfy((info) => {
        expect(info.totalResources).toBeGreaterThan(0);
        expect(info.totalCandidates).toBeGreaterThan(0);
        expect(info.resourceTypes).toContain('json');
        expect(info.qualifiers).toContain('language');
      });
    });

    test('returns filtered resource information', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        context: '{"language": "en"}',
        format: 'json',
        mode: 'development',
        partialMatch: true,
        sourceMaps: false,
        minify: false,
        debug: false,
        verbose: false,
        quiet: false,
        validate: true,
        includeMetadata: true
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.getInfo();

      expect(result).toSucceedAndSatisfy((info) => {
        expect(info.totalResources).toBeGreaterThan(0);
        expect(info.filteredResources).toBeGreaterThan(0);
        expect(info.context).toEqual({ language: 'en' });
      });
    });
  });
});
