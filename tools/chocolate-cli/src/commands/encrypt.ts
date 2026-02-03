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
import { CryptoUtils } from '@fgv/ts-extras';
import { LibraryData } from '@fgv/ts-chocolate';

/**
 * Command-line options for the encrypt command
 */
interface IEncryptCommandOptions {
  secretName: string;
  key: string;
  output?: string;
  metadata?: boolean;
  salt?: string;
  iterations?: string;
}

/**
 * Reads and parses a JSON file.
 */
function readJsonFile(filePath: string): Result<JsonValue> {
  return captureResult(() => {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(content) as JsonValue;
  }).withErrorFormat((e) => `Failed to read JSON file "${filePath}": ${e}`);
}

/**
 * Writes content to a JSON file.
 */
function writeJsonFile(filePath: string, content: unknown): Result<void> {
  return captureResult(() => {
    const absolutePath = path.resolve(filePath);
    fs.writeFileSync(absolutePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  }).withErrorFormat((e) => `Failed to write file "${filePath}": ${e}`);
}

/**
 * Decodes a base64 key string to Uint8Array.
 */
function decodeKey(base64Key: string): Result<Uint8Array> {
  return captureResult(() => {
    const buffer = Buffer.from(base64Key, 'base64');
    if (buffer.length !== 32) {
      throw new Error(`Key must be 32 bytes (256 bits), got ${buffer.length} bytes`);
    }
    return new Uint8Array(buffer);
  }).withErrorFormat((e) => `Invalid key: ${e}`);
}

/**
 * Encrypts a JSON file and writes the encrypted tombstone.
 */
async function encryptFile(
  inputPath: string,
  outputPath: string,
  secretName: string,
  key: Uint8Array,
  includeMetadata: boolean,
  keyDerivation?: CryptoUtils.IKeyDerivationParams
): Promise<Result<void>> {
  // Read and parse input file
  const jsonResult = readJsonFile(inputPath);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const content = jsonResult.value;

  // Build metadata if requested
  const metadata: LibraryData.IEncryptedCollectionMetadata | undefined = includeMetadata
    ? {
        collectionId: path.basename(inputPath, path.extname(inputPath)),
        itemCount: typeof content === 'object' && content !== null ? Object.keys(content).length : undefined
      }
    : undefined;

  // Encrypt the content
  const encryptResult = await CryptoUtils.createEncryptedFile({
    content,
    secretName,
    key,
    metadata,
    keyDerivation,
    cryptoProvider: CryptoUtils.nodeCryptoProvider
  });

  if (encryptResult.isFailure()) {
    return fail(`Encryption failed: ${encryptResult.message}`);
  }

  // Write the encrypted tombstone
  return writeJsonFile(outputPath, encryptResult.value);
}

/**
 * Creates the encrypt command.
 */
export function createEncryptCommand(): Command {
  const cmd = new Command('encrypt');

  cmd
    .description('Encrypt a JSON file to an encrypted collection tombstone')
    .argument('<input>', 'Input JSON file to encrypt')
    .requiredOption('-s, --secret-name <name>', 'Name of the secret used for encryption')
    .requiredOption('-k, --key <base64>', 'Base64-encoded 32-byte encryption key')
    .option('-o, --output <file>', 'Output file (defaults to input file, overwriting it)')
    .option('-m, --metadata', 'Include unencrypted metadata in the tombstone', false)
    .option('--salt <base64>', 'Salt used for key derivation (stores in file for password-based decryption)')
    .option(
      '--iterations <n>',
      'Iterations used for key derivation (stores in file for password-based decryption)'
    )
    .action(async (input: string, options: IEncryptCommandOptions) => {
      const outputPath = options.output ?? input;

      // Decode the key
      const keyResult = decodeKey(options.key);
      if (keyResult.isFailure()) {
        console.error(`Error: ${keyResult.message}`);
        process.exit(1);
      }

      // Build key derivation params if salt is provided
      let keyDerivation: CryptoUtils.IKeyDerivationParams | undefined;
      if (options.salt) {
        const iterations = options.iterations ? parseInt(options.iterations, 10) : 100000;
        if (isNaN(iterations) || iterations <= 0) {
          console.error('Error: iterations must be a positive number');
          process.exit(1);
        }
        keyDerivation = {
          kdf: 'pbkdf2',
          salt: options.salt,
          iterations
        };
        console.error(`Storing key derivation params: salt=${options.salt}, iterations=${iterations}`);
      }

      // Encrypt the file
      const result = await encryptFile(
        input,
        outputPath,
        options.secretName,
        keyResult.value,
        options.metadata ?? false,
        keyDerivation
      );

      if (result.isFailure()) {
        console.error(`Error: ${result.message}`);
        process.exit(1);
      }

      console.log(`Successfully encrypted ${input} -> ${outputPath}`);
    });

  return cmd;
}
