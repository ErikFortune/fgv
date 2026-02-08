// Copyright (c) 2026 Erik Fortune
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
import { password } from '@inquirer/prompts';
import { captureResult, Result, succeed, fail } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';
import { confirmAction, showSuccess, showError, showInfo } from './shared';

/**
 * Options for keystore commands.
 */
interface IKeystoreCommandOptions {
  /**
   * Path to the workspace directory.
   */
  readonly workspace: string;
}

/**
 * Gets the keystore file path for a workspace.
 */
function getKeystorePath(workspacePath: string): string {
  return path.join(path.resolve(workspacePath), 'keystore.json');
}

/**
 * Reads a keystore file from disk.
 */
function readKeystoreFile(keystorePath: string): Result<CryptoUtils.KeyStore.IKeyStoreFile> {
  return captureResult(() => {
    const content = fs.readFileSync(keystorePath, 'utf8');
    return JSON.parse(content) as CryptoUtils.KeyStore.IKeyStoreFile;
  }).onFailure((msg) => fail(`Failed to read keystore file: ${msg}`));
}

/**
 * Writes a keystore file to disk.
 */
function writeKeystoreFile(
  keystorePath: string,
  keystoreFile: CryptoUtils.KeyStore.IKeyStoreFile
): Result<void> {
  return captureResult(() => {
    fs.writeFileSync(keystorePath, JSON.stringify(keystoreFile, null, 2), 'utf8');
  }).onFailure((msg) => fail(`Failed to write keystore file: ${msg}`));
}

/**
 * Initializes a new keystore with a master password.
 */
async function initializeKeystore(options: IKeystoreCommandOptions): Promise<Result<void>> {
  const keystorePath = getKeystorePath(options.workspace);

  // Check if keystore already exists
  if (fs.existsSync(keystorePath)) {
    const readResult = readKeystoreFile(keystorePath);
    if (readResult.isSuccess()) {
      const file = readResult.value;
      // Check if it's already initialized (has the required fields)
      if (file.format && file.algorithm && file.encryptedData) {
        const confirmed = await confirmAction(
          'Keystore is already initialized. Reinitialize (this will destroy existing secrets)?',
          false
        );
        if (!confirmed) {
          return fail('Keystore initialization cancelled');
        }
      }
    }
  }

  // Get master password
  const pwd = await password({
    message: 'Enter master password for keystore:',
    mask: '*'
  });

  const confirmPwd = await password({
    message: 'Confirm master password:',
    mask: '*'
  });

  if (pwd !== confirmPwd) {
    return fail('Passwords do not match');
  }

  // Create new keystore
  const createResult = CryptoUtils.KeyStore.KeyStore.create({
    cryptoProvider: CryptoUtils.nodeCryptoProvider
  });

  if (createResult.isFailure()) {
    return fail(`Failed to create keystore: ${createResult.message}`);
  }

  const keystore = createResult.value;

  // Initialize with password
  const initResult = await keystore.initialize(pwd);
  if (initResult.isFailure()) {
    return fail(`Failed to initialize keystore: ${initResult.message}`);
  }

  // Save to file (requires password to encrypt)
  const saveResult = await keystore.save(pwd);
  if (saveResult.isFailure()) {
    return fail(`Failed to save keystore: ${saveResult.message}`);
  }

  return writeKeystoreFile(keystorePath, saveResult.value);
}

/**
 * Shows keystore status.
 */
async function showKeystoreStatus(options: IKeystoreCommandOptions): Promise<Result<void>> {
  const keystorePath = getKeystorePath(options.workspace);

  if (!fs.existsSync(keystorePath)) {
    showInfo('No keystore file found');
    return succeed(undefined);
  }

  const readResult = readKeystoreFile(keystorePath);
  if (readResult.isFailure()) {
    return fail('Keystore file exists but cannot be read');
  }

  const file = readResult.value;

  // Check if initialized
  if (!file.format || !file.algorithm || !file.encryptedData) {
    showInfo('Keystore file exists but is not initialized');
    console.log(`  Path: ${keystorePath}`);
    console.log('  Use "choco workspace keystore init" to initialize it');
    return succeed(undefined);
  }

  showInfo('Keystore is initialized');
  console.log(`  Path: ${keystorePath}`);
  console.log(`  Format: ${file.format}`);
  console.log(`  Algorithm: ${file.algorithm}`);
  console.log(`  KDF: ${file.keyDerivation.kdf}`);
  console.log(`  Iterations: ${file.keyDerivation.iterations}`);

  return succeed(undefined);
}

/**
 * Tests unlocking the keystore with a password.
 */
async function testUnlock(options: IKeystoreCommandOptions): Promise<Result<void>> {
  const keystorePath = getKeystorePath(options.workspace);

  if (!fs.existsSync(keystorePath)) {
    return fail('No keystore file found');
  }

  const readResult = readKeystoreFile(keystorePath);
  if (readResult.isFailure()) {
    return fail(`Failed to read keystore: ${readResult.message}`);
  }

  // Open the keystore
  const openResult = CryptoUtils.KeyStore.KeyStore.open({
    cryptoProvider: CryptoUtils.nodeCryptoProvider,
    keystoreFile: readResult.value
  });

  if (openResult.isFailure()) {
    return fail(`Failed to open keystore: ${openResult.message}`);
  }

  const keystore = openResult.value;

  // Get password
  const pwd = await password({
    message: 'Enter keystore password:',
    mask: '*'
  });

  // Try to unlock
  const unlockResult = await keystore.unlock(pwd);
  if (unlockResult.isFailure()) {
    return fail(`Failed to unlock keystore: ${unlockResult.message}`);
  }

  return succeed(undefined);
}

/**
 * Creates the keystore init subcommand.
 */
function createInitSubcommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize a new keystore with a master password')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .action(async (options: IKeystoreCommandOptions) => {
      const result = await initializeKeystore(options);

      if (result.isFailure()) {
        await showError(result.message);
        process.exit(1);
      }

      showSuccess('Keystore initialized successfully');
      console.log(`  Path: ${getKeystorePath(options.workspace)}`);
      console.log('\nYou can now use this keystore to encrypt sensitive data.');
    });

  return cmd;
}

/**
 * Creates the keystore status subcommand.
 */
function createStatusSubcommand(): Command {
  const cmd = new Command('status');

  cmd
    .description('Show keystore status')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .action(async (options: IKeystoreCommandOptions) => {
      const result = await showKeystoreStatus(options);

      if (result.isFailure()) {
        await showError(result.message);
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Creates the keystore unlock test subcommand.
 */
function createUnlockSubcommand(): Command {
  const cmd = new Command('unlock');

  cmd
    .description('Test unlocking the keystore with a password')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .action(async (options: IKeystoreCommandOptions) => {
      const result = await testUnlock(options);

      if (result.isFailure()) {
        await showError(result.message);
        process.exit(1);
      }

      showSuccess('Keystore unlocked successfully');
    });

  return cmd;
}

/**
 * Creates the keystore command with all subcommands.
 *
 * @returns The keystore command
 */
export function createKeystoreCommand(): Command {
  const cmd = new Command('keystore');

  cmd.description('Manage workspace keystore');

  // Add subcommands
  cmd.addCommand(createInitSubcommand());
  cmd.addCommand(createStatusSubcommand());
  cmd.addCommand(createUnlockSubcommand());

  return cmd;
}
