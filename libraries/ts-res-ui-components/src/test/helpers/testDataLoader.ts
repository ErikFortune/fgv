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

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { Result, succeed, fail } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';

/**
 * Base path for test fixtures - using existing test data in monorepo
 */
const PROJECT_ROOT: string = dirname(dirname(dirname(__dirname)));
const FIXTURES_PATH: string = join(PROJECT_ROOT, '../../data/test/ts-res');
const TEMP_PATH: string = join(PROJECT_ROOT, 'temp');

/**
 * Generate a unique temp folder name with timestamp and random suffix
 */
export function createUniqueTempPath(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueName = `${prefix}-${timestamp}-${random}`;
  const tempPath = join(TEMP_PATH, uniqueName);

  // Create the temp directory
  mkdirSync(tempPath, { recursive: true });

  return tempPath;
}

/**
 * Load a test configuration file from the existing test data
 */
export function loadTestConfiguration(
  testSet: 'default' | 'custom-config' | 'extended-example',
  filename?: string
): Result<Config.Model.ISystemConfiguration> {
  try {
    let configPath: string;

    if (testSet === 'default') {
      configPath = join(FIXTURES_PATH, 'default', filename || 'default-config.json');
    } else if (testSet === 'custom-config') {
      configPath = join(FIXTURES_PATH, 'custom-config', filename || 'resources-config.json');
    } else if (testSet === 'extended-example') {
      configPath = join(FIXTURES_PATH, 'extended-example', filename || 'configuration.json');
    } else {
      return fail(`Unknown test set: ${testSet}`);
    }

    const configData = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData) as Config.Model.ISystemConfiguration;
    return succeed(config);
  } catch (error) {
    return fail(`Failed to load test configuration from ${testSet}/${filename}: ${error}`);
  }
}

/**
 * Load test resource files from a test set
 */
export function loadTestResources(
  testSet: 'default' | 'custom-config' | 'extended-example'
): Result<Array<{ path: string; content: string }>> {
  try {
    const resourcesPath = join(FIXTURES_PATH, testSet, 'resources');
    const fs = require('fs');

    if (!existsSync(resourcesPath)) {
      return fail(`Test resource directory for ${testSet} does not exist`);
    }

    const files: Array<{ path: string; content: string }> = [];

    function readDirectory(dir: string, basePath: string = ''): void {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = join(basePath, entry.name);

        if (entry.isDirectory()) {
          readDirectory(fullPath, relativePath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          const content = readFileSync(fullPath, 'utf8');
          files.push({ path: relativePath, content });
        }
      }
    }

    readDirectory(resourcesPath);
    return succeed(files);
  } catch (error) {
    return fail(`Failed to load test resources from ${testSet}: ${error}`);
  }
}

/**
 * Write test data to a temp file
 */
export function writeTempFile(tempDir: string, filename: string, content: string): Result<string> {
  try {
    const filePath = join(tempDir, filename);
    const fileDir = dirname(filePath);

    // Ensure directory exists
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    writeFileSync(filePath, content, 'utf8');
    return succeed(filePath);
  } catch (error) {
    return fail(`Failed to write temp file ${filename}: ${error}`);
  }
}

/**
 * Write test data structure to temp directory
 */
export function writeTempResourceFiles(
  tempDir: string,
  files: Array<{ path: string; content: string }>
): Result<string[]> {
  try {
    const writtenPaths: string[] = [];

    for (const file of files) {
      const result = writeTempFile(tempDir, file.path, file.content);
      if (result.isFailure()) {
        return fail(`Failed to write resource file ${file.path}: ${result.message}`);
      }
      writtenPaths.push(result.value);
    }

    return succeed(writtenPaths);
  } catch (error) {
    return fail(`Failed to write temp resource files: ${error}`);
  }
}

/**
 * Load a test bundle file as buffer or text
 */
export function loadTestBundleFile(
  filename: string = 'extended.resource-bundle.json',
  asBuffer: boolean = false
): Result<Buffer | string> {
  try {
    const bundlePath = join(FIXTURES_PATH, filename);

    if (asBuffer) {
      const buffer = readFileSync(bundlePath);
      return succeed(buffer);
    } else {
      const text = readFileSync(bundlePath, 'utf8');
      return succeed(text);
    }
  } catch (error) {
    return fail(`Failed to load test bundle file ${filename}: ${error}`);
  }
}

/**
 * Clean up temp directory (optional - temp folder is git-ignored)
 */
export async function cleanupTempPath(tempPath: string): Promise<void> {
  try {
    const fs = require('fs');
    if (existsSync(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
    }
  } catch (error) {
    // Use test observability context to avoid console spew
    const { ObservabilityTools } = await import('../../namespaces');
    ObservabilityTools.TestObservabilityContext.diag.warn(
      `Warning: Failed to cleanup temp path ${tempPath}:`,
      error
    );
  }
}
