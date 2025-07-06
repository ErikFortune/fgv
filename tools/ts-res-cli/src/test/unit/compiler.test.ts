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
      expect(outputData.resources).toHaveProperty('test.message');
    });

    test('compiles with context filtering', async () => {
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
        includeMetadata: false
      };

      const compiler = new ResourceCompiler(options);
      const result = await compiler.compile();

      expect(result).toSucceed();

      const outputContent = await fs.readFile(outputFile, 'utf-8');
      const outputData = JSON.parse(outputContent);

      expect(outputData.resources['test.message']).toBeDefined();
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

      expect(outputData.resources).toHaveProperty('msg.hello');
      expect(outputData.resources).toHaveProperty('btn.ok');
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
