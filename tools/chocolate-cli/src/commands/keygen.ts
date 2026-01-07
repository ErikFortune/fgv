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

import * as crypto from 'crypto';
import { Command } from 'commander';
import { captureResult, Result, fail } from '@fgv/ts-utils';
import { Crypto } from '@fgv/ts-chocolate';

/**
 * Command-line options for the keygen command
 */
interface IKeygenCommandOptions {
  format?: 'base64' | 'hex';
  fromPassword?: boolean;
  salt?: string;
  iterations?: number;
}

/**
 * Formats a key as base64 or hex string.
 */
function formatKey(key: Uint8Array, format: 'base64' | 'hex'): string {
  const buffer = Buffer.from(key);
  return format === 'hex' ? buffer.toString('hex') : buffer.toString('base64');
}

/**
 * Generates a random salt for password derivation.
 */
function generateSalt(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Derives a key from a password using PBKDF2.
 */
async function deriveKeyFromPassword(
  password: string,
  saltBase64: string,
  iterations: number
): Promise<Result<Uint8Array>> {
  const saltResult = captureResult(() => Buffer.from(saltBase64, 'base64'));
  if (saltResult.isFailure()) {
    return fail(`Invalid salt: ${saltResult.message}`);
  }

  const salt = new Uint8Array(saltResult.value);
  return Crypto.nodeCryptoProvider.deriveKey(password, salt, iterations);
}

/**
 * Creates the keygen command.
 */
export function createKeygenCommand(): Command {
  const cmd = new Command('keygen');

  cmd
    .description('Generate a random encryption key or derive one from a password')
    .option('-f, --format <format>', 'Output format: base64 or hex', 'base64')
    .option('-p, --from-password', 'Derive key from a password (reads from stdin)')
    .option('--salt <base64>', 'Salt for password derivation (generates random if not provided)')
    .option('--iterations <n>', 'Number of PBKDF2 iterations', '100000')
    .action(async (options: IKeygenCommandOptions) => {
      const format = (options.format ?? 'base64') as 'base64' | 'hex';
      const iterations = parseInt(String(options.iterations ?? '100000'), 10);

      if (options.fromPassword) {
        // Read password from stdin
        const password = await readPasswordFromStdin();
        if (!password) {
          console.error('Error: No password provided');
          process.exit(1);
        }

        const salt = options.salt ?? generateSalt();
        console.error(`Using salt: ${salt}`);
        console.error(`Using iterations: ${iterations}`);

        const keyResult = await deriveKeyFromPassword(password, salt, iterations);
        if (keyResult.isFailure()) {
          console.error(`Error: ${keyResult.message}`);
          process.exit(1);
        }

        console.log(formatKey(keyResult.value, format));
      } else {
        // Generate random key
        const keyResult = await Crypto.nodeCryptoProvider.generateKey();
        if (keyResult.isFailure()) {
          console.error(`Error: ${keyResult.message}`);
          process.exit(1);
        }

        console.log(formatKey(keyResult.value, format));
      }
    });

  return cmd;
}

/**
 * Reads a password from stdin.
 */
async function readPasswordFromStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';

    // Check if stdin is a TTY (interactive terminal)
    if (process.stdin.isTTY) {
      // For interactive mode, just read until newline
      process.stdin.setEncoding('utf8');
      process.stderr.write('Enter password: ');

      process.stdin.once('data', (chunk) => {
        resolve(chunk.toString().trim());
      });
    } else {
      // For piped input, read all data
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => {
        data += chunk;
      });
      process.stdin.on('end', () => {
        resolve(data.trim());
      });
    }
  });
}
