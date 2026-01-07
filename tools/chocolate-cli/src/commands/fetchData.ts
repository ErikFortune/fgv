// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { captureResult, Result, fail } from '@fgv/ts-utils';
import { JsonObject, JsonValue } from '@fgv/ts-json-base';
import { Crypto } from '@fgv/ts-chocolate';
import * as yaml from 'yaml';

/**
 * Command-line options for the fetch-data command
 */
interface IFetchDataCommandOptions {
  key?: string;
  source?: string;
  dest?: string;
  dryRun?: boolean;
  skipPlain?: boolean;
  format?: 'yaml' | 'json';
}

/**
 * Default paths relative to repo root
 */
const DEFAULT_SOURCE: string = 'data/published/chocolate';
const DEFAULT_DEST: string = 'temp/data/chocolate';

/**
 * Finds the repository root by looking for rush.json
 */
function findRepoRoot(): Result<string> {
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'rush.json'))) {
      return captureResult(() => current);
    }
    current = path.dirname(current);
  }
  return fail('Could not find repository root (no rush.json found)');
}

/**
 * Recursively finds all JSON files in a directory
 */
function findJsonFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Reads and parses a JSON file.
 */
function readJsonFile(filePath: string): Result<JsonValue> {
  return captureResult(() => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as JsonValue;
  }).withErrorFormat((e) => `Failed to read JSON file "${filePath}": ${e}`);
}

/**
 * Ensures parent directory exists and writes content to file as JSON
 */
function writeJsonFile(filePath: string, content: unknown): Result<void> {
  return captureResult(() => {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  }).withErrorFormat((e) => `Failed to write file "${filePath}": ${e}`);
}

/**
 * Ensures parent directory exists and writes content to file as YAML
 */
function writeYamlFile(filePath: string, content: unknown): Result<void> {
  return captureResult(() => {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, yaml.stringify(content), 'utf-8');
  }).withErrorFormat((e) => `Failed to write file "${filePath}": ${e}`);
}

/**
 * Writes content to a file in the specified format
 */
function writeDataFile(filePath: string, content: unknown, format: 'yaml' | 'json'): Result<void> {
  return format === 'yaml' ? writeYamlFile(filePath, content) : writeJsonFile(filePath, content);
}

/**
 * Converts a .json path to .yaml extension
 */
function toYamlPath(filePath: string): string {
  if (filePath.endsWith('.json')) {
    return filePath.slice(0, -5) + '.yaml';
  }
  return filePath;
}

/**
 * Decodes a base64 key string to Uint8Array
 */
function decodeKey(keyBase64: string): Result<Uint8Array> {
  return captureResult(() => {
    const buffer = Buffer.from(keyBase64, 'base64');
    if (buffer.length !== 32) {
      throw new Error(`Key must be 32 bytes (got ${buffer.length})`);
    }
    return new Uint8Array(buffer);
  }).withErrorFormat((e) => `Invalid encryption key: ${e}`);
}

/**
 * Creates the fetch-data command.
 * Decrypts JSON files from data folder to temp/data as YAML.
 */
export function createFetchDataCommand(): Command {
  const cmd = new Command('fetch-data');

  cmd
    .description('Decrypt encrypted JSON files from data folder to temp/data (outputs YAML by default)')
    .option(
      '-k, --key <base64>',
      'Base64-encoded 32-byte decryption key (or use CHOCO_ENCRYPTION_KEY env var)'
    )
    .option('--source <dir>', 'Source directory relative to repo root', DEFAULT_SOURCE)
    .option('--dest <dir>', 'Destination directory relative to repo root', DEFAULT_DEST)
    .option('--dry-run', 'Show what would be done without making changes', false)
    .option('--skip-plain', 'Skip files that are not encrypted (default: copy them as-is)', false)
    .option('-f, --format <format>', 'Output format: yaml or json', 'yaml')
    .action(async (options: IFetchDataCommandOptions) => {
      // Get decryption key from option or environment
      const keyBase64 = options.key ?? process.env.CHOCO_ENCRYPTION_KEY;
      if (!keyBase64) {
        console.error(
          'Error: No decryption key provided. Use --key or set CHOCO_ENCRYPTION_KEY environment variable.'
        );
        process.exit(1);
      }

      const keyResult = decodeKey(keyBase64);
      if (keyResult.isFailure()) {
        console.error(`Error: ${keyResult.message}`);
        process.exit(1);
      }
      const key = keyResult.value;

      // Find repo root
      const repoRootResult = findRepoRoot();
      if (repoRootResult.isFailure()) {
        console.error(`Error: ${repoRootResult.message}`);
        process.exit(1);
      }
      const repoRoot = repoRootResult.value;

      const sourceDir = path.join(repoRoot, options.source ?? DEFAULT_SOURCE);
      const destDir = path.join(repoRoot, options.dest ?? DEFAULT_DEST);
      const outputFormat = (options.format ?? 'yaml') as 'yaml' | 'json';

      // Find all JSON files in source
      const jsonFiles = findJsonFiles(sourceDir);
      if (jsonFiles.length === 0) {
        console.log(`No JSON files found in ${sourceDir}`);
        return;
      }

      console.log(`Found ${jsonFiles.length} JSON file(s) to process`);
      console.log(`Source: ${sourceDir}`);
      console.log(`Destination: ${destDir}`);
      console.log(`Output format: ${outputFormat}`);
      if (options.dryRun) {
        console.log('(Dry run - no files will be modified)\n');
      } else {
        console.log('');
      }

      let decryptedCount = 0;
      let copiedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const sourceFile of jsonFiles) {
        const relativePath = path.relative(sourceDir, sourceFile);
        // Convert to YAML extension if outputting YAML
        const destRelativePath = outputFormat === 'yaml' ? toYamlPath(relativePath) : relativePath;
        const destFile = path.join(destDir, destRelativePath);

        // Read source JSON
        const jsonResult = readJsonFile(sourceFile);
        if (jsonResult.isFailure()) {
          console.error(`  ERROR: ${relativePath} - ${jsonResult.message}`);
          errorCount++;
          continue;
        }

        const json = jsonResult.value;

        // Check if this is an encrypted file
        if (Crypto.isEncryptedCollectionFile(json)) {
          // Decrypt the content (cast is safe after type guard check)
          const decryptResult = await Crypto.tryDecryptCollectionFile(
            json as JsonObject,
            key,
            Crypto.nodeCryptoProvider
          );

          if (decryptResult.isFailure()) {
            console.error(`  ERROR: ${relativePath} - ${decryptResult.message}`);
            errorCount++;
            continue;
          }

          if (options.dryRun) {
            console.log(`  Would decrypt: ${relativePath} -> ${destRelativePath}`);
          } else {
            const writeResult = writeDataFile(destFile, decryptResult.value, outputFormat);
            if (writeResult.isFailure()) {
              console.error(`  ERROR: ${relativePath} - ${writeResult.message}`);
              errorCount++;
              continue;
            }
            console.log(`  Decrypted: ${relativePath} -> ${destRelativePath}`);
          }
          decryptedCount++;
        } else {
          // Plain JSON file
          if (options.skipPlain) {
            console.log(`  Skipped (not encrypted): ${relativePath}`);
            skippedCount++;
          } else {
            if (options.dryRun) {
              console.log(`  Would copy: ${relativePath} -> ${destRelativePath}`);
            } else {
              const writeResult = writeDataFile(destFile, json, outputFormat);
              if (writeResult.isFailure()) {
                console.error(`  ERROR: ${relativePath} - ${writeResult.message}`);
                errorCount++;
                continue;
              }
              console.log(`  Copied: ${relativePath} -> ${destRelativePath}`);
            }
            copiedCount++;
          }
        }
      }

      console.log(
        `\nCompleted: ${decryptedCount} decrypted, ${copiedCount} copied, ${skippedCount} skipped, ${errorCount} failed`
      );
      if (errorCount > 0) {
        process.exit(1);
      }
    });

  return cmd;
}
