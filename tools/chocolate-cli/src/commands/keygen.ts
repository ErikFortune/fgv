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
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { captureResult, Result, fail, succeed } from '@fgv/ts-utils';
import { Crypto } from '@fgv/ts-extras';
import * as yaml from 'yaml';

/**
 * Command-line options for the keygen command
 */
interface IKeygenCommandOptions {
  format?: 'base64' | 'hex';
  fromPassword?: boolean;
  salt?: string;
  iterations?: number;
  update?: string;
  name?: string;
}

/**
 * Single secret entry in the secrets file.
 * Can be:
 * - A string (base64-encoded key only, for backwards compatibility)
 * - An object with key and optional keyDerivation params
 */
interface ISecretEntry {
  /** Base64-encoded 32-byte key */
  key: string;
  /** Optional key derivation parameters (for password-based decryption) */
  keyDerivation?: Crypto.IKeyDerivationParams;
}

/**
 * Secrets file format: mapping from secret name to key/params
 * Supports both old format (string values) and new format (object values)
 */
type SecretsFile = Record<string, string | ISecretEntry>;

/**
 * Supported secrets file extensions
 */
const YAML_EXTENSIONS: ReadonlyArray<string> = ['.yaml', '.yml'];
const JSON_EXTENSIONS: ReadonlyArray<string> = ['.json'];

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
 * Reads and parses a secrets file (YAML or JSON).
 * Returns an empty object if the file doesn't exist.
 */
function readSecretsFile(filePath: string): Result<SecretsFile> {
  const absolutePath = path.resolve(filePath);

  // If file doesn't exist, return empty object (we'll create it)
  if (!fs.existsSync(absolutePath)) {
    return succeed({});
  }

  return captureResult(() => {
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const ext = path.extname(absolutePath).toLowerCase();
    if (YAML_EXTENSIONS.includes(ext)) {
      return (yaml.parse(content) as SecretsFile) ?? {};
    }
    return (JSON.parse(content) as SecretsFile) ?? {};
  }).withErrorFormat((e) => `Failed to read secrets file "${filePath}": ${e}`);
}

/**
 * Writes a secrets file (YAML or JSON based on extension).
 */
function writeSecretsFile(filePath: string, secrets: SecretsFile): Result<void> {
  const absolutePath = path.resolve(filePath);
  const ext = path.extname(absolutePath).toLowerCase();

  return captureResult(() => {
    const dir = path.dirname(absolutePath);
    fs.mkdirSync(dir, { recursive: true });

    let content: string;
    if (YAML_EXTENSIONS.includes(ext)) {
      content = yaml.stringify(secrets);
    } else if (JSON_EXTENSIONS.includes(ext)) {
      content = JSON.stringify(secrets, null, 2) + '\n';
    } else {
      throw new Error(`Unsupported file extension: ${ext}. Use .yaml, .yml, or .json`);
    }

    fs.writeFileSync(absolutePath, content, 'utf-8');
  }).withErrorFormat((e) => `Failed to write secrets file "${filePath}": ${e}`);
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
    .option('-u, --update <file>', 'Update a secrets file with the generated key')
    .option('-n, --name <name>', 'Secret name for --update (required when using --update)')
    .action(async (options: IKeygenCommandOptions) => {
      const format = (options.format ?? 'base64') as 'base64' | 'hex';
      const iterations = parseInt(String(options.iterations ?? '100000'), 10);

      // Validate --update requires --name
      if (options.update && !options.name) {
        console.error('Error: --name is required when using --update');
        process.exit(1);
      }

      let keyBase64: string;
      let salt: string | undefined;

      if (options.fromPassword) {
        // Read password from stdin
        const password = await readPasswordFromStdin();
        if (!password) {
          console.error('Error: No password provided');
          process.exit(1);
        }

        salt = options.salt ?? generateSalt();
        console.error(`Using salt: ${salt}`);
        console.error(`Using iterations: ${iterations}`);

        const keyResult = await deriveKeyFromPassword(password, salt, iterations);
        if (keyResult.isFailure()) {
          console.error(`Error: ${keyResult.message}`);
          process.exit(1);
        }

        keyBase64 = formatKey(keyResult.value, 'base64');

        // Output in requested format (unless updating file)
        if (!options.update) {
          console.log(format === 'base64' ? keyBase64 : formatKey(keyResult.value, format));
        }
      } else {
        // Generate random key
        const keyResult = await Crypto.nodeCryptoProvider.generateKey();
        if (keyResult.isFailure()) {
          console.error(`Error: ${keyResult.message}`);
          process.exit(1);
        }

        keyBase64 = formatKey(keyResult.value, 'base64');

        // Output in requested format (unless updating file)
        if (!options.update) {
          console.log(format === 'base64' ? keyBase64 : formatKey(keyResult.value, format));
        }
      }

      // Update secrets file if requested
      if (options.update && options.name) {
        const secretsResult = readSecretsFile(options.update);
        if (secretsResult.isFailure()) {
          console.error(`Error: ${secretsResult.message}`);
          process.exit(1);
        }

        const secrets = secretsResult.value;
        const secretName = options.name;
        const existed = secretName in secrets;

        // Create the entry with the correct format
        if (salt) {
          // Password-derived key: include keyDerivation params
          secrets[secretName] = {
            key: keyBase64,
            keyDerivation: {
              kdf: 'pbkdf2',
              salt,
              iterations
            }
          };
        } else {
          // Random key: just include the key (using object format for consistency)
          secrets[secretName] = {
            key: keyBase64
          };
        }

        const writeResult = writeSecretsFile(options.update, secrets);
        if (writeResult.isFailure()) {
          console.error(`Error: ${writeResult.message}`);
          process.exit(1);
        }

        const action = existed ? 'Updated' : 'Added';
        console.log(`${action} secret "${secretName}" in ${options.update}`);
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
