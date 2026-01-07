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
import { JsonObject } from '@fgv/ts-json-base';
import { Crypto } from '@fgv/ts-chocolate';

/**
 * Command-line options for the decrypt command
 */
interface IDecryptCommandOptions {
  key: string;
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
 * Decrypts an encrypted collection file and writes the plain JSON.
 */
async function decryptFile(inputPath: string, outputPath: string, key: Uint8Array): Promise<Result<void>> {
  // Read and parse input file
  const jsonResult = readJsonFile(inputPath);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }

  const json = jsonResult.value;

  // Verify it's an encrypted collection file
  if (!Crypto.isEncryptedCollectionFile(json)) {
    return fail(`File "${inputPath}" is not an encrypted collection file`);
  }

  // Decrypt the content
  const decryptResult = await Crypto.tryDecryptCollectionFile(json, key, Crypto.nodeCryptoProvider);

  if (decryptResult.isFailure()) {
    return fail(`Decryption failed: ${decryptResult.message}`);
  }

  // Write the decrypted JSON
  return writeJsonFile(outputPath, decryptResult.value);
}

/**
 * Creates the decrypt command.
 */
export function createDecryptCommand(): Command {
  const cmd = new Command('decrypt');

  cmd
    .description('Decrypt an encrypted collection tombstone to plain JSON')
    .argument('<input>', 'Encrypted collection file to decrypt')
    .requiredOption('-k, --key <base64>', 'Base64-encoded 32-byte decryption key')
    .option('-o, --output <file>', 'Output file (defaults to input file, overwriting it)')
    .action(async (input: string, options: IDecryptCommandOptions) => {
      const outputPath = options.output ?? input;

      // Decode the key
      const keyResult = decodeKey(options.key);
      if (keyResult.isFailure()) {
        console.error(`Error: ${keyResult.message}`);
        process.exit(1);
      }

      // Decrypt the file
      const result = await decryptFile(input, outputPath, keyResult.value);

      if (result.isFailure()) {
        console.error(`Error: ${result.message}`);
        process.exit(1);
      }

      console.log(`Successfully decrypted ${input} -> ${outputPath}`);
    });

  return cmd;
}
