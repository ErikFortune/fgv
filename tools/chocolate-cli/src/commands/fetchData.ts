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
import { Crypto } from '@fgv/ts-extras';
import { LibraryData } from '@fgv/ts-chocolate';
import * as yaml from 'yaml';

/**
 * Command-line options for the fetch-data command
 */
interface IFetchDataCommandOptions {
  key?: string;
  secretsFile?: string;
  source: string;
  dest: string;
  dryRun?: boolean;
  skipPlain?: boolean;
  format?: 'yaml' | 'json';
}

/**
 * Secrets file format: mapping from secret name to base64-encoded key
 */
type SecretsFile = Record<string, string>;

/**
 * YAML file extensions
 */
const YAML_EXTENSIONS: ReadonlyArray<string> = ['.yaml', '.yml'];

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
 * Reads and parses a secrets file (YAML or JSON).
 * Format: `{ "secretName": "base64-key", ... }`
 */
function readSecretsFile(filePath: string): Result<SecretsFile> {
  return captureResult(() => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    if (YAML_EXTENSIONS.includes(ext)) {
      return yaml.parse(content) as SecretsFile;
    }
    return JSON.parse(content) as SecretsFile;
  }).withErrorFormat((e) => `Failed to read secrets file "${filePath}": ${e}`);
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
 * Resolves the key to use for decrypting a file with the given secret name.
 * With --secrets-file: looks up key by secret name from file.
 * With --key: uses that key for all files.
 */
function resolveKey(
  secretName: string,
  options: IFetchDataCommandOptions,
  secrets?: SecretsFile
): Result<Uint8Array> {
  if (options.secretsFile && secrets) {
    const keyBase64 = secrets[secretName];
    if (!keyBase64) {
      return fail(`No key found for secret "${secretName}" in secrets file`);
    }
    return decodeKey(keyBase64);
  }

  // Single key mode
  const keyBase64 = options.key ?? process.env.CHOCO_ENCRYPTION_KEY;
  if (!keyBase64) {
    return fail('No decryption key provided. Use --key, --secrets-file, or set CHOCO_ENCRYPTION_KEY env var');
  }

  return decodeKey(keyBase64);
}

/**
 * Creates the fetch-data command.
 * Decrypts JSON files from source directory to destination (outputs YAML by default).
 */
export function createFetchDataCommand(): Command {
  const cmd = new Command('fetch-data');

  cmd
    .description('Decrypt encrypted JSON files (outputs YAML by default)')
    .requiredOption('--source <dir>', 'Source directory containing encrypted files')
    .requiredOption('--dest <dir>', 'Destination directory for decrypted output')
    .option(
      '-k, --key <base64>',
      'Base64-encoded 32-byte decryption key (or use CHOCO_ENCRYPTION_KEY env var)'
    )
    .option('--secrets-file <path>', 'Path to secrets file (YAML/JSON) mapping secret names to base64 keys')
    .option('--dry-run', 'Show what would be done without making changes', false)
    .option('--skip-plain', 'Skip files that are not encrypted (default: copy them as-is)', false)
    .option('-f, --format <format>', 'Output format: yaml or json', 'yaml')
    .action(async (options: IFetchDataCommandOptions) => {
      // Validate that at least one key source is provided
      if (!options.secretsFile && !options.key && !process.env.CHOCO_ENCRYPTION_KEY) {
        console.error(
          'Error: No decryption key provided. Use --key, --secrets-file, or set CHOCO_ENCRYPTION_KEY env var'
        );
        process.exit(1);
      }

      // Load secrets file if provided
      let secrets: SecretsFile | undefined;
      if (options.secretsFile) {
        const secretsResult = readSecretsFile(options.secretsFile);
        if (secretsResult.isFailure()) {
          console.error(`Error: ${secretsResult.message}`);
          process.exit(1);
        }
        secrets = secretsResult.value;
      }

      const sourceDir = path.resolve(options.source);
      const destDir = path.resolve(options.dest);
      const outputFormat = (options.format ?? 'yaml') as 'yaml' | 'json';

      // Verify source exists
      if (!fs.existsSync(sourceDir)) {
        console.error(`Error: Source directory does not exist: ${sourceDir}`);
        process.exit(1);
      }

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
      if (options.secretsFile) {
        console.log(`Secrets file: ${options.secretsFile}`);
      }
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
        if (LibraryData.isEncryptedCollectionFile(json)) {
          const encryptedFile = json as JsonObject;
          const secretName = (encryptedFile as { secretName?: string }).secretName;

          if (!secretName) {
            console.error(`  ERROR: ${relativePath} - Encrypted file missing secretName`);
            errorCount++;
            continue;
          }

          // Resolve key for this secret
          const keyResult = resolveKey(secretName, options, secrets);
          if (keyResult.isFailure()) {
            console.error(`  ERROR: ${relativePath} - ${keyResult.message}`);
            errorCount++;
            continue;
          }

          // Decrypt the content
          const decryptResult = await Crypto.tryDecryptFile(
            encryptedFile,
            keyResult.value,
            Crypto.nodeCryptoProvider
          );

          if (decryptResult.isFailure()) {
            console.error(`  ERROR: ${relativePath} - ${decryptResult.message}`);
            errorCount++;
            continue;
          }

          if (options.dryRun) {
            console.log(`  Would decrypt: ${relativePath} -> ${destRelativePath} (secret: ${secretName})`);
          } else {
            const writeResult = writeDataFile(destFile, decryptResult.value, outputFormat);
            if (writeResult.isFailure()) {
              console.error(`  ERROR: ${relativePath} - ${writeResult.message}`);
              errorCount++;
              continue;
            }
            console.log(`  Decrypted: ${relativePath} -> ${destRelativePath} (secret: ${secretName})`);
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
