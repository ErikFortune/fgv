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
import { ResourceCompiler } from '../../src/compiler';
import { ICompileOptions } from '../../src/options';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as TsRes from '@fgv/ts-res';

describe('ResourceCompiler', () => {
  let tempDir: string;
  let inputFile: string;
  let outputFile: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(__dirname, '../../test-temp-'));
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

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    test('creates a compiler with options', () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'source',
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
    test('compiles resources to compiled format by default', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'compiled',
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

      // Check compiled output structure
      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const compiledCollectionData = JSON.parse(outputContent);

      // Use the ts-res converter to validate the compiled resource collection
      const validationResult =
        TsRes.ResourceJson.Compiled.Convert.compiledResourceCollection.convert(compiledCollectionData);
      expect(validationResult).toSucceedAndSatisfy((compiledCollection) => {
        // Verify it's a properly structured compiled resource collection
        expect(compiledCollection.qualifierTypes).toBeDefined();
        expect(compiledCollection.qualifiers).toBeDefined();
        expect(compiledCollection.resourceTypes).toBeDefined();
        expect(compiledCollection.conditions).toBeDefined();
        expect(compiledCollection.conditionSets).toBeDefined();
        expect(compiledCollection.decisions).toBeDefined();
        expect(compiledCollection.resources).toBeDefined();

        // Verify these are arrays with expected content
        expect(Array.isArray(compiledCollection.qualifierTypes)).toBe(true);
        expect(Array.isArray(compiledCollection.qualifiers)).toBe(true);
        expect(Array.isArray(compiledCollection.resourceTypes)).toBe(true);
        expect(Array.isArray(compiledCollection.conditions)).toBe(true);
        expect(Array.isArray(compiledCollection.conditionSets)).toBe(true);
        expect(Array.isArray(compiledCollection.decisions)).toBe(true);
        expect(Array.isArray(compiledCollection.resources)).toBe(true);

        // Verify we have some resources
        expect(compiledCollection.resources.length).toBeGreaterThan(0);

        // Verify basic structural integrity
        expect(compiledCollection.qualifierTypes.length).toBeGreaterThan(0);
        expect(compiledCollection.qualifiers.length).toBeGreaterThan(0);
        expect(compiledCollection.resourceTypes.length).toBeGreaterThan(0);
      });
    });

    test('compiles resources to compiled format with metadata', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'compiled',
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

      // When includeMetadata is true and format is compiled, it should wrap the compiled collection in a blob
      expect(outputData).toHaveProperty('compiledCollection');
      expect(outputData).toHaveProperty('metadata');

      // Check metadata structure
      expect(outputData.metadata).toHaveProperty('totalResources');
      expect(outputData.metadata).toHaveProperty('totalCandidates');
      expect(outputData.metadata).toHaveProperty('resourceTypes');
      expect(outputData.metadata).toHaveProperty('qualifiers');

      // Validate the compiled collection using ts-res converter
      const compiledCollection = outputData.compiledCollection;
      const validationResult =
        TsRes.ResourceJson.Compiled.Convert.compiledResourceCollection.convert(compiledCollection);
      expect(validationResult).toSucceedAndSatisfy((validCollection) => {
        expect(validCollection.qualifierTypes).toBeDefined();
        expect(validCollection.qualifiers).toBeDefined();
        expect(validCollection.resourceTypes).toBeDefined();
        expect(validCollection.conditions).toBeDefined();
        expect(validCollection.conditionSets).toBeDefined();
        expect(validCollection.decisions).toBeDefined();
        expect(validCollection.resources).toBeDefined();
        expect(validCollection.resources.length).toBeGreaterThan(0);
      });
    });

    test('compiles resources to source format', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'source',
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
      expect(Object.keys(outputData.resources)).toContain('input.test.message');
    });

    test('compiles with context filtering and excludes non-matching variants', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        context: '{"language": "en"}',
        format: 'source',
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
      expect(outputData.resources['input.test.message']).toBeDefined();

      const messageResource = outputData.resources['input.test.message'];
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
      const complexTestResources = {
        resources: [
          {
            id: 'greeting.hello',
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
          },
          {
            id: 'button.ok',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { label: 'OK' },
                conditions: { language: 'en' }
              }
            ]
          },
          {
            id: 'error.notfound',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { message: 'Not found' },
                conditions: { language: 'es' }
              }
            ]
          },
          {
            id: 'app.name',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { title: 'My App' }
              }
            ]
          }
        ]
      };

      await fs.writeFile(complexTestFile, JSON.stringify(complexTestResources, null, 2));

      const complexOutputFile = path.join(tempDir, 'complex-output.json');
      const options: ICompileOptions = {
        input: complexTestFile,
        output: complexOutputFile,
        context: '{"language": "en"}',
        format: 'source',
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
      expect(Object.keys(outputData.resources)).toContain('complex-input.greeting.hello'); // Has en variant
      expect(Object.keys(outputData.resources)).toContain('complex-input.button.ok'); // Only has en
      expect(Object.keys(outputData.resources)).toContain('complex-input.app.name'); // No language condition (default)

      // Verify what should be excluded
      expect(Object.keys(outputData.resources)).not.toContain('complex-input.error.notfound'); // Only has es

      // Verify greeting.hello only has English, not Spanish
      const greetingResource = outputData.resources['complex-input.greeting.hello'];
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
        format: 'source',
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
      const variantTestResources = {
        resources: [
          {
            id: 'msg.hello',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { text: 'Hello (US)' },
                conditions: { language: 'en-US' }
              },
              {
                json: { text: 'Hello (CA)' },
                conditions: { language: 'en-CA' }
              },
              {
                json: { text: 'Hello (AU)' },
                conditions: { language: 'en-AU' }
              },
              {
                json: { text: 'Hello (generic)' },
                conditions: { language: 'en' }
              },
              {
                json: { text: 'Bonjour (FR)' },
                conditions: { language: 'fr-FR' }
              },
              {
                json: { text: 'Bonjour (CA)' },
                conditions: { language: 'fr-CA' }
              },
              {
                json: { text: 'Bonjour (generic)' },
                conditions: { language: 'fr' }
              },
              {
                json: { text: 'Hola (ES)' },
                conditions: { language: 'es-ES' }
              },
              {
                json: { text: 'Hola (MX)' },
                conditions: { language: 'es-MX' }
              }
            ]
          },
          {
            id: 'btn.save',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { label: 'Save (US)' },
                conditions: { language: 'en-US' }
              },
              {
                json: { label: 'Save (FR)' },
                conditions: { language: 'fr-FR' }
              }
            ]
          }
        ]
      };

      await fs.writeFile(variantTestFile, JSON.stringify(variantTestResources, null, 2));

      const variantOutputFile = path.join(tempDir, 'variant-output.json');
      const options: ICompileOptions = {
        input: variantTestFile,
        output: variantOutputFile,
        context: '{"language": "en-GB"}', // British English - should match other English variants
        format: 'source',
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
      expect(Object.keys(outputData.resources)).toContain('variant-input.msg.hello');
      expect(Object.keys(outputData.resources)).toContain('variant-input.btn.save');

      // Verify msg.hello contains English variants but not French/Spanish
      const helloResource = outputData.resources['variant-input.msg.hello'];
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
      const saveResource = outputData.resources['variant-input.btn.save'];
      const saveKeys = Object.keys(saveResource);
      expect(saveKeys.some((key) => key.includes('en-US'))).toBe(true);
      expect(saveKeys.some((key) => key.includes('fr'))).toBe(false);

      // Verify metadata shows appropriate filtering
      expect(outputData.metadata.totalCandidates).toBe(11); // All input candidates
      // Should filter to: 4 English msg.hello + 1 English btn.save = 5
      expect(outputData.metadata.filteredCandidates).toBe(5);
      expect(outputData.metadata.totalResources).toBe(2); // 2 unique resource IDs
      expect(outputData.metadata.filteredResources).toBe(2); // All 2 resources have matching candidates
    });

    test('context filtering with partial matching enabled is more permissive', async () => {
      // Test that partial matching allows broader matches
      const options: ICompileOptions = {
        input: inputFile, // Uses basic test data with en/es
        output: outputFile,
        context: '{"language": "en-GB"}',
        format: 'source',
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
      expect(outputData.resources['input.test.message']).toBeDefined();

      const messageResource = outputData.resources['input.test.message'];
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
        format: 'source',
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

    test('compiled format can be reconstructed as runtime ICompiledResourceCollection', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'compiled',
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
      const compiledCollectionData = JSON.parse(outputContent);

      // Validate the structure using the converter
      expect(
        TsRes.ResourceJson.Compiled.Convert.compiledResourceCollection.convert(compiledCollectionData)
      ).toSucceed();
    });

    test('compiled format produces different output than source format', async () => {
      const compiledOutputFile = path.join(tempDir, 'compiled.json');
      const sourceOutputFile = path.join(tempDir, 'source.json');

      const baseOptions: ICompileOptions = {
        input: inputFile,
        output: '',
        format: 'compiled',
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

      // Compile to compiled format
      const compiledCompiler = new ResourceCompiler({
        ...baseOptions,
        output: compiledOutputFile,
        format: 'compiled'
      });
      const compiledResult = await compiledCompiler.compile();
      expect(compiledResult).toSucceed();

      // Compile to source format
      const sourceCompiler = new ResourceCompiler({
        ...baseOptions,
        output: sourceOutputFile,
        format: 'source'
      });
      const sourceResult = await sourceCompiler.compile();
      expect(sourceResult).toSucceed();

      // Read both outputs
      const compiledContent = await fs.readFile(compiledOutputFile, 'utf-8');
      const sourceContent = await fs.readFile(sourceOutputFile, 'utf-8');

      const compiledData = JSON.parse(compiledContent);
      const sourceData = JSON.parse(sourceContent);

      // They should be different formats
      expect(compiledData).not.toEqual(sourceData);

      // Validate compiled format using ts-res converter
      const compiledValidation =
        TsRes.ResourceJson.Compiled.Convert.compiledResourceCollection.convert(compiledData);
      expect(compiledValidation).toSucceedAndSatisfy((validCompiledCollection) => {
        expect(validCompiledCollection.qualifierTypes).toBeDefined();
        expect(validCompiledCollection.qualifiers).toBeDefined();
        expect(validCompiledCollection.resourceTypes).toBeDefined();
        expect(validCompiledCollection.conditions).toBeDefined();
        expect(validCompiledCollection.conditionSets).toBeDefined();
        expect(validCompiledCollection.decisions).toBeDefined();
        expect(validCompiledCollection.resources).toBeDefined();
        expect(validCompiledCollection.resources.length).toBeGreaterThan(0);
      });

      // Source format should have legacy blob structure
      expect(sourceData).toHaveProperty('resources');
      expect(sourceData).not.toHaveProperty('qualifierTypes');
      expect(sourceData).not.toHaveProperty('conditions');
      expect(sourceData).not.toHaveProperty('conditionSets');
      expect(sourceData).not.toHaveProperty('decisions');

      // Source format resources should be object with condition keys
      expect(typeof sourceData.resources).toBe('object');
      expect(sourceData.resources['input.test.message']).toBeDefined();
    });

    test('handles minified output', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'source',
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
        format: 'source',
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
        JSON.stringify({
          resources: [
            {
              id: 'msg.hello',
              resourceTypeName: 'json',
              candidates: [
                {
                  json: { text: 'Hello' },
                  conditions: { language: 'en' }
                }
              ]
            }
          ]
        })
      );

      await fs.writeFile(
        resource2,
        JSON.stringify({
          resources: [
            {
              id: 'btn.ok',
              resourceTypeName: 'json',
              candidates: [
                {
                  json: { label: 'OK' },
                  conditions: { language: 'en' }
                }
              ]
            }
          ]
        })
      );

      const options: ICompileOptions = {
        input: inputDir,
        output: outputFile,
        format: 'source',
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

      expect(Object.keys(outputData.resources)).toContain('resources.messages.msg.hello');
      expect(Object.keys(outputData.resources)).toContain('resources.buttons.btn.ok');
    });
  });

  describe('idempotency and stability tests', () => {
    test('produces identical output when compiled multiple times', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'source',
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
      const file1 = path.join(testDir, 'first.json');
      const file2 = path.join(testDir, 'second.json');
      const file3 = path.join(testDir, 'third.json');

      await fs.writeFile(
        file1,
        JSON.stringify({
          resources: [
            {
              id: 'msg.hello',
              resourceTypeName: 'json',
              candidates: [
                {
                  json: { text: 'Hello' },
                  conditions: { language: 'en' }
                }
              ]
            }
          ]
        })
      );
      await fs.writeFile(
        file2,
        JSON.stringify({
          resources: [
            {
              id: 'msg.goodbye',
              resourceTypeName: 'json',
              candidates: [
                {
                  json: { text: 'Goodbye' },
                  conditions: { language: 'en' }
                }
              ]
            }
          ]
        })
      );
      await fs.writeFile(
        file3,
        JSON.stringify({
          resources: [
            {
              id: 'msg.welcome',
              resourceTypeName: 'json',
              candidates: [
                {
                  json: { text: 'Welcome' },
                  conditions: { language: 'en' }
                }
              ]
            }
          ]
        })
      );

      const options: ICompileOptions = {
        input: testDir,
        output: path.join(tempDir, 'deterministic-output.json'),
        format: 'source',
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
        format: 'source',
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

      // Test source format
      const sourceOutput = path.join(tempDir, 'format-test.json');
      const sourceCompiler = new ResourceCompiler({ ...baseOptions, output: sourceOutput, format: 'source' });
      const sourceResult = await sourceCompiler.compile();
      expect(sourceResult).toSucceed();

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

      // Parse the source output as baseline
      const sourceContent = await fs.readFile(sourceOutput, 'utf-8');
      const sourceData = JSON.parse(sourceContent);

      // Verify JS format contains same data
      const jsContent = await fs.readFile(jsOutput, 'utf-8');
      expect(jsContent).toMatch(/^module\.exports = /);
      // Extract the data part from "module.exports = {...};"
      const jsDataStr = jsContent.replace(/^module\.exports = /, '').replace(/;$/, '');
      const jsData = JSON.parse(jsDataStr);
      expect(jsData).toEqual(sourceData);

      // Verify TS format contains same data
      const tsContent = await fs.readFile(tsOutput, 'utf-8');
      expect(tsContent).toMatch(/^export const resources = /);
      // Extract the data part from "export const resources = {...} as const;"
      const tsDataStr = tsContent.replace(/^export const resources = /, '').replace(/ as const;$/, '');
      const tsData = JSON.parse(tsDataStr);
      expect(tsData).toEqual(sourceData);
    });
  });

  describe('validate method', () => {
    test('validates resources successfully', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'source',
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
  });

  describe('getInfo method', () => {
    test('returns resource information', async () => {
      const options: ICompileOptions = {
        input: inputFile,
        output: outputFile,
        format: 'source',
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
        format: 'source',
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
