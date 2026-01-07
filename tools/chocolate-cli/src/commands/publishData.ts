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
import { JsonValue } from '@fgv/ts-json-base';
import { Crypto } from '@fgv/ts-chocolate';
import * as yaml from 'yaml';

/**
 * Command-line options for the publish-data command
 */
interface IPublishDataCommandOptions {
  secretName: string;
  key?: string;
  source?: string;
  dest?: string;
  dryRun?: boolean;
}

/**
 * Default paths relative to repo root
 */
const DEFAULT_SOURCE: string = 'temp/data';
const DEFAULT_DEST: string = 'data';
const DEFAULT_SECRET_NAME: string = 'choco-data';

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
 * Supported source file extensions
 */
const YAML_EXTENSIONS: ReadonlyArray<string> = ['.yaml', '.yml'];
const JSON_EXTENSIONS: ReadonlyArray<string> = ['.json'];
const ALL_EXTENSIONS: ReadonlyArray<string> = [...YAML_EXTENSIONS, ...JSON_EXTENSIONS];

/**
 * Checks if a file has a YAML extension
 */
function isYamlFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return YAML_EXTENSIONS.includes(ext);
}

/**
 * Recursively finds all data files (YAML and JSON) in a directory
 */
function findDataFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findDataFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALL_EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * Reads and parses a data file (YAML or JSON).
 */
function readDataFile(filePath: string): Result<JsonValue> {
  return captureResult(() => {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (isYamlFile(filePath)) {
      return yaml.parse(content) as JsonValue;
    }
    return JSON.parse(content) as JsonValue;
  }).withErrorFormat((e) => `Failed to read file "${filePath}": ${e}`);
}

/**
 * Converts a source file path to a destination path with .json extension.
 * YAML files (.yaml, .yml) are converted to .json.
 */
function toJsonPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (YAML_EXTENSIONS.includes(ext)) {
    return filePath.slice(0, -ext.length) + '.json';
  }
  return filePath;
}

/**
 * Ensures parent directory exists and writes content to file
 */
function writeJsonFile(filePath: string, content: unknown): Result<void> {
  return captureResult(() => {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  }).withErrorFormat((e) => `Failed to write file "${filePath}": ${e}`);
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
 * Creates the publish-data command.
 * Encrypts YAML/JSON files from temp/data to data folder as encrypted JSON.
 */
export function createPublishDataCommand(): Command {
  const cmd = new Command('publish-data');

  cmd
    .description('Encrypt and publish YAML/JSON files from temp/data to data folder (outputs encrypted JSON)')
    .option('-s, --secret-name <name>', 'Name of the secret for encryption', DEFAULT_SECRET_NAME)
    .option(
      '-k, --key <base64>',
      'Base64-encoded 32-byte encryption key (or use CHOCO_ENCRYPTION_KEY env var)'
    )
    .option('--source <dir>', 'Source directory relative to repo root', DEFAULT_SOURCE)
    .option('--dest <dir>', 'Destination directory relative to repo root', DEFAULT_DEST)
    .option('--dry-run', 'Show what would be done without making changes', false)
    .action(async (options: IPublishDataCommandOptions) => {
      // Get encryption key from option or environment
      const keyBase64 = options.key ?? process.env.CHOCO_ENCRYPTION_KEY;
      if (!keyBase64) {
        console.error(
          'Error: No encryption key provided. Use --key or set CHOCO_ENCRYPTION_KEY environment variable.'
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
      const secretName = options.secretName ?? DEFAULT_SECRET_NAME;

      // Find all data files (YAML and JSON) in source
      const dataFiles = findDataFiles(sourceDir);
      if (dataFiles.length === 0) {
        console.log(`No data files (YAML/JSON) found in ${sourceDir}`);
        return;
      }

      console.log(`Found ${dataFiles.length} data file(s) to encrypt`);
      console.log(`Source: ${sourceDir}`);
      console.log(`Destination: ${destDir}`);
      console.log(`Secret name: ${secretName}`);
      if (options.dryRun) {
        console.log('(Dry run - no files will be modified)\n');
      } else {
        console.log('');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const sourceFile of dataFiles) {
        const relativePath = path.relative(sourceDir, sourceFile);
        // Convert YAML paths to JSON for output
        const destRelativePath = toJsonPath(relativePath);
        const destFile = path.join(destDir, destRelativePath);

        // Read source file (YAML or JSON)
        const dataResult = readDataFile(sourceFile);
        if (dataResult.isFailure()) {
          console.error(`  ERROR: ${relativePath} - ${dataResult.message}`);
          errorCount++;
          continue;
        }

        // Encrypt the content
        const encryptResult = await Crypto.createEncryptedCollectionFile({
          content: dataResult.value,
          secretName,
          key,
          cryptoProvider: Crypto.nodeCryptoProvider
        });

        if (encryptResult.isFailure()) {
          console.error(`  ERROR: ${relativePath} - ${encryptResult.message}`);
          errorCount++;
          continue;
        }

        if (options.dryRun) {
          console.log(`  Would encrypt: ${relativePath} -> ${destRelativePath}`);
        } else {
          const writeResult = writeJsonFile(destFile, encryptResult.value);
          if (writeResult.isFailure()) {
            console.error(`  ERROR: ${relativePath} - ${writeResult.message}`);
            errorCount++;
            continue;
          }
          console.log(`  Encrypted: ${relativePath} -> ${destRelativePath}`);
        }
        successCount++;
      }

      console.log(`\nCompleted: ${successCount} succeeded, ${errorCount} failed`);
      if (errorCount > 0) {
        process.exit(1);
      }
    });

  return cmd;
}
