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
import { captureResult, Result } from '@fgv/ts-utils';
import { JsonObject } from '@fgv/ts-json-base';
import { Crypto } from '@fgv/ts-chocolate';

/**
 * Command-line options for the decrypt command
 */
interface IDecryptCommandOptions {
  key?: string;
  password?: string;
  output?: string;
}

/**
 * Reads and parses a JSON file.
 */
function readJsonFile(filePath: string): Result<JsonObject> {
  return captureResult(() => {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(content) as JsonObject;
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
 * Derives a key from password using params from the encrypted file.
 */
async function deriveKeyFromPassword(
  password: string,
  keyDerivation: Crypto.IKeyDerivationParams
): Promise<Result<Uint8Array>> {
  const saltResult = captureResult(() => Buffer.from(keyDerivation.salt, 'base64'));
  if (saltResult.isFailure()) {
    return fail(`Invalid salt in encrypted file: ${saltResult.message}`);
  }

  const salt = new Uint8Array(saltResult.value);
  return Crypto.nodeCryptoProvider.deriveKey(password, salt, keyDerivation.iterations);
}

/**
 * Creates the decrypt command.
 */
export function createDecryptCommand(): Command {
  const cmd = new Command('decrypt');

  cmd
    .description('Decrypt an encrypted collection tombstone to plain JSON')
    .argument('<input>', 'Encrypted collection file to decrypt')
    .option('-k, --key <base64>', 'Base64-encoded 32-byte decryption key')
    .option('-p, --password <password>', 'Password to derive key (uses salt/iterations from file)')
    .option('-o, --output <file>', 'Output file (defaults to input file, overwriting it)')
    .action(async (input: string, options: IDecryptCommandOptions) => {
      const outputPath = options.output ?? input;

      // Validate that either key or password is provided
      if (!options.key && !options.password) {
        console.error('Error: Either --key or --password must be provided');
        process.exit(1);
      }
      if (options.key && options.password) {
        console.error('Error: Cannot specify both --key and --password');
        process.exit(1);
      }

      // Read and parse input file first to get keyDerivation params if using password
      const jsonResult = readJsonFile(input);
      if (jsonResult.isFailure()) {
        console.error(`Error: ${jsonResult.message}`);
        process.exit(1);
      }

      const json = jsonResult.value;

      // Verify it's an encrypted collection file
      if (!Crypto.isEncryptedCollectionFile(json)) {
        console.error(`Error: File "${input}" is not an encrypted collection file`);
        process.exit(1);
      }

      // Parse as encrypted collection file to get keyDerivation
      const tombstoneResult = Crypto.Converters.encryptedCollectionFile.convert(json);
      if (tombstoneResult.isFailure()) {
        console.error(`Error: Invalid encrypted file format: ${tombstoneResult.message}`);
        process.exit(1);
      }
      const tombstone = tombstoneResult.value;

      let key: Uint8Array;

      if (options.password) {
        // Password mode - derive key from password using file's keyDerivation params
        if (!tombstone.keyDerivation) {
          console.error('Error: Encrypted file does not contain key derivation parameters');
          console.error('Hint: This file was encrypted with a raw key. Use --key instead of --password');
          process.exit(1);
        }

        console.error(
          `Deriving key using ${tombstone.keyDerivation.kdf} with ${tombstone.keyDerivation.iterations} iterations...`
        );
        const keyResult = await deriveKeyFromPassword(options.password, tombstone.keyDerivation);
        if (keyResult.isFailure()) {
          console.error(`Error: ${keyResult.message}`);
          process.exit(1);
        }
        key = keyResult.value;
      } else {
        // Key mode - use provided key directly
        const keyResult = decodeKey(options.key!);
        if (keyResult.isFailure()) {
          console.error(`Error: ${keyResult.message}`);
          process.exit(1);
        }
        key = keyResult.value;
      }

      // Decrypt the content
      const decryptResult = await Crypto.decryptCollectionFile(tombstone, key, Crypto.nodeCryptoProvider);

      if (decryptResult.isFailure()) {
        console.error(`Error: Decryption failed: ${decryptResult.message}`);
        process.exit(1);
      }

      // Write the decrypted JSON
      const writeResult = writeJsonFile(outputPath, decryptResult.value);
      if (writeResult.isFailure()) {
        console.error(`Error: ${writeResult.message}`);
        process.exit(1);
      }

      console.log(`Successfully decrypted ${input} -> ${outputPath}`);
    });

  return cmd;
}
