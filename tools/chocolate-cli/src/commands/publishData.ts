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
import { captureResult, Result, fail, succeed } from '@fgv/ts-utils';
import { JsonValue } from '@fgv/ts-json-base';
import { Crypto } from '@fgv/ts-chocolate';
import * as yaml from 'yaml';

/**
 * Command-line options for the publish-data command
 */
interface IPublishDataCommandOptions {
  secretName?: string;
  key?: string;
  secretsFile?: string;
  source: string;
  dest: string;
  dryRun?: boolean;
}

/**
 * Secrets file format: mapping from secret name to base64-encoded key
 */
type SecretsFile = Record<string, string>;

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
 * Extracts the secretName from source file metadata, if present.
 */
function getSecretNameFromMetadata(sourceData: JsonValue): string | undefined {
  if (typeof sourceData === 'object' && sourceData !== null && !Array.isArray(sourceData)) {
    const obj = sourceData as Record<string, unknown>;
    if (typeof obj.metadata === 'object' && obj.metadata !== null) {
      const metadata = obj.metadata as Record<string, unknown>;
      if (typeof metadata.secretName === 'string') {
        return metadata.secretName;
      }
    }
  }
  return undefined;
}

/**
 * Extracts the items from source file data (new format), or returns the data as-is (legacy format).
 */
function getItemsFromSourceData(sourceData: JsonValue): JsonValue {
  if (typeof sourceData === 'object' && sourceData !== null && !Array.isArray(sourceData)) {
    const obj = sourceData as Record<string, unknown>;
    if ('items' in obj) {
      return obj.items as JsonValue;
    }
  }
  // Legacy format or unexpected structure - return as-is
  return sourceData;
}

/**
 * Resolves the secret name and key to use for a given file.
 * Priority:
 * 1. metadata.secretName from source file (if present and --secrets-file provided)
 * 2. Directory name with --secrets-file
 * 3. --secret-name flag with --key or env var
 *
 * If metadata.secretName is specified but key not found in secrets file, returns error (no fallback).
 */
function resolveSecret(
  filePath: string,
  sourceDir: string,
  options: IPublishDataCommandOptions,
  secrets?: SecretsFile,
  metadataSecretName?: string
): Result<{ secretName: string; key: Uint8Array }> {
  // If metadata specifies a secret name, use it (requires secrets file)
  if (metadataSecretName) {
    if (!options.secretsFile || !secrets) {
      return fail(
        `File specifies secretName "${metadataSecretName}" in metadata but no --secrets-file provided`
      );
    }
    const keyBase64 = secrets[metadataSecretName];
    if (!keyBase64) {
      return fail(`No key found for secret "${metadataSecretName}" (from file metadata) in secrets file`);
    }
    return decodeKey(keyBase64).onSuccess((key) => succeed({ secretName: metadataSecretName, key }));
  }

  // Secrets file mode: use directory name as secret name
  if (options.secretsFile && secrets) {
    const relativePath = path.relative(sourceDir, filePath);
    const topDir = relativePath.split(path.sep)[0];
    const secretName = topDir || path.basename(sourceDir);

    const keyBase64 = secrets[secretName];
    if (!keyBase64) {
      return fail(`No key found for secret "${secretName}" in secrets file`);
    }

    return decodeKey(keyBase64).onSuccess((key) => succeed({ secretName, key }));
  }

  // Single secret mode
  const secretName = options.secretName;
  if (!secretName) {
    return fail('No secret name provided. Use --secret-name or --secrets-file');
  }

  const keyBase64 = options.key ?? process.env.CHOCO_ENCRYPTION_KEY;
  if (!keyBase64) {
    return fail('No encryption key provided. Use --key, --secrets-file, or set CHOCO_ENCRYPTION_KEY env var');
  }

  return decodeKey(keyBase64).onSuccess((key) => succeed({ secretName, key }));
}

/**
 * Creates the publish-data command.
 * Encrypts YAML/JSON files from source directory to destination as encrypted JSON.
 */
export function createPublishDataCommand(): Command {
  const cmd = new Command('publish-data');

  cmd
    .description('Encrypt and publish YAML/JSON files as encrypted JSON')
    .requiredOption('--source <dir>', 'Source directory containing files to encrypt')
    .requiredOption('--dest <dir>', 'Destination directory for encrypted output')
    .option('-s, --secret-name <name>', 'Name of the secret for encryption (single-secret mode)')
    .option(
      '-k, --key <base64>',
      'Base64-encoded 32-byte encryption key (or use CHOCO_ENCRYPTION_KEY env var)'
    )
    .option('--secrets-file <path>', 'Path to secrets file (YAML/JSON) mapping secret names to base64 keys')
    .option('--dry-run', 'Show what would be done without making changes', false)
    .action(async (options: IPublishDataCommandOptions) => {
      // Validate options
      if (options.secretsFile && (options.secretName || options.key)) {
        console.error('Error: Cannot use --secrets-file with --secret-name or --key');
        process.exit(1);
      }

      if (!options.secretsFile && !options.secretName) {
        console.error('Error: Must provide either --secrets-file or --secret-name');
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

      // Verify source exists
      if (!fs.existsSync(sourceDir)) {
        console.error(`Error: Source directory does not exist: ${sourceDir}`);
        process.exit(1);
      }

      // Find all data files (YAML and JSON) in source
      const dataFiles = findDataFiles(sourceDir);
      if (dataFiles.length === 0) {
        console.log(`No data files (YAML/JSON) found in ${sourceDir}`);
        return;
      }

      console.log(`Found ${dataFiles.length} data file(s) to encrypt`);
      console.log(`Source: ${sourceDir}`);
      console.log(`Destination: ${destDir}`);
      if (options.secretsFile) {
        console.log(`Secrets file: ${options.secretsFile}`);
      } else {
        console.log(`Secret name: ${options.secretName}`);
      }
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

        // Extract metadata.secretName if present
        const metadataSecretName = getSecretNameFromMetadata(dataResult.value);

        // Resolve secret for this file (using metadata.secretName if available)
        const secretResult = resolveSecret(sourceFile, sourceDir, options, secrets, metadataSecretName);
        if (secretResult.isFailure()) {
          console.error(`  ERROR: ${relativePath} - ${secretResult.message}`);
          errorCount++;
          continue;
        }
        const { secretName, key } = secretResult.value;

        // Extract items to encrypt (only items, not metadata wrapper)
        const contentToEncrypt = getItemsFromSourceData(dataResult.value);

        // Encrypt the content
        const encryptResult = await Crypto.createEncryptedCollectionFile({
          content: contentToEncrypt,
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
          console.log(`  Would encrypt: ${relativePath} -> ${destRelativePath} (secret: ${secretName})`);
        } else {
          const writeResult = writeJsonFile(destFile, encryptResult.value);
          if (writeResult.isFailure()) {
            console.error(`  ERROR: ${relativePath} - ${writeResult.message}`);
            errorCount++;
            continue;
          }
          console.log(`  Encrypted: ${relativePath} -> ${destRelativePath} (secret: ${secretName})`);
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
