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
import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';
import { Entities, LibraryData } from '@fgv/ts-chocolate';
import * as yaml from 'yaml';

import { IDataSourceOptions } from './types';

/**
 * Secrets file format: mapping from secret name to base64-encoded key
 */
type SecretsFile = Record<string, string>;

/**
 * YAML file extensions
 */
const YAML_EXTENSIONS: ReadonlyArray<string> = ['.yaml', '.yml'];

/**
 * Generic file tree source type (all libraries use the same structure)
 */
export type IFileTreeSource = LibraryData.SubLibraryFileTreeSource;

/**
 * Reads and parses a secrets file (YAML or JSON).
 * Format: `{ "secretName": "base64-key", ... }`
 */
export function readSecretsFile(filePath: string): Result<SecretsFile> {
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
 * Decodes a base64 key string to Uint8Array
 */
export function decodeKey(keyBase64: string): Result<Uint8Array> {
  return captureResult(() => {
    const buffer = Buffer.from(keyBase64, 'base64');
    if (buffer.length !== 32) {
      throw new Error(`Key must be 32 bytes (got ${buffer.length})`);
    }
    return new Uint8Array(buffer);
  }).withErrorFormat((e) => `Invalid encryption key: ${e}`);
}

/**
 * Builds encryption configuration from command options.
 * Always returns a config with appropriate error handling to skip
 * encrypted collections when keys aren't available.
 */
export function buildEncryptionConfig(
  options: IDataSourceOptions,
  secrets?: SecretsFile
): Result<LibraryData.IEncryptionConfig> {
  const namedSecrets: CryptoUtils.INamedSecret[] = [];

  // Build secrets from secrets file
  if (secrets) {
    for (const [name, keyBase64] of Object.entries(secrets)) {
      const keyResult = decodeKey(keyBase64);
      if (keyResult.isFailure()) {
        return fail(`Secret "${name}": ${keyResult.message}`);
      }
      namedSecrets.push({ name, key: keyResult.value });
    }
  }

  // Add single key if provided
  const singleKeyBase64 = options.key ?? process.env.CHOCO_ENCRYPTION_KEY;
  if (singleKeyBase64) {
    const keyResult = decodeKey(singleKeyBase64);
    if (keyResult.isFailure()) {
      return fail(keyResult.message);
    }
    const secretName = options.secretName ?? 'default';
    // Only add if not already in secrets file
    if (!namedSecrets.some((s) => s.name === secretName)) {
      namedSecrets.push({ name: secretName, key: keyResult.value });
    }
  }

  // Always return a config - use 'skip' mode to gracefully skip encrypted
  // collections when no keys are available
  return succeed({
    secrets: namedSecrets.length > 0 ? namedSecrets : undefined,
    cryptoProvider: CryptoUtils.nodeCryptoProvider,
    onMissingKey: 'skip' as const,
    onDecryptionError: 'warn' as const
  });
}

/**
 * Builds file tree sources from library paths
 */
export function buildFileSources(libraryPaths: string[]): Result<IFileTreeSource[]> {
  const sources: IFileTreeSource[] = [];

  for (const libraryPath of libraryPaths) {
    const resolvedPath = path.resolve(libraryPath);

    if (!fs.existsSync(resolvedPath)) {
      return fail(`Library path does not exist: ${resolvedPath}`);
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return fail(`Library path is not a directory: ${resolvedPath}`);
    }

    // Create a FileTree for this path
    const treeResult = FileTree.forFilesystem(resolvedPath);
    if (treeResult.isFailure()) {
      return fail(`Failed to create file tree for "${resolvedPath}": ${treeResult.message}`);
    }

    // Get the root directory item
    const rootResult = treeResult.value.getDirectory('.');
    if (rootResult.isFailure()) {
      return fail(`Failed to get directory for "${resolvedPath}": ${rootResult.message}`);
    }

    sources.push({
      directory: rootResult.value,
      mutable: false
    });
  }

  return succeed(sources);
}

/**
 * Common parameters for async library creation
 */
interface IAsyncLibraryParams {
  builtin: boolean;
  fileSources: IFileTreeSource[] | undefined;
  encryption: LibraryData.IEncryptionConfig;
}

/**
 * Prepares common async library parameters from options
 */
async function prepareAsyncParams(options: IDataSourceOptions): Promise<Result<IAsyncLibraryParams>> {
  // Load secrets file if provided
  let secrets: SecretsFile | undefined;
  if (options.secretsFile) {
    const secretsResult = readSecretsFile(options.secretsFile);
    if (secretsResult.isFailure()) {
      return fail(secretsResult.message);
    }
    secrets = secretsResult.value;
  }

  // Build encryption config
  const encryptionResult = buildEncryptionConfig(options, secrets);
  if (encryptionResult.isFailure()) {
    return fail(encryptionResult.message);
  }

  // Build file sources from library paths
  const libraryPaths = options.library ?? [];
  const fileSourcesResult = buildFileSources(libraryPaths);
  if (fileSourcesResult.isFailure()) {
    return fail(fileSourcesResult.message);
  }

  return succeed({
    builtin: options.noBuiltin !== true,
    fileSources: fileSourcesResult.value.length > 0 ? fileSourcesResult.value : undefined,
    encryption: encryptionResult.value
  });
}

// ============================================================================
// Entity Library Loaders
// ============================================================================

/**
 * Loads a FillingsLibrary from the specified data sources.
 *
 * @param options - Data source options from command line
 * @returns Promise resolving to Success with FillingsLibrary, or Failure with error
 */
export async function loadFillingsLibrary(
  options: IDataSourceOptions
): Promise<Result<Entities.Fillings.FillingsLibrary>> {
  const paramsResult = await prepareAsyncParams(options);
  if (paramsResult.isFailure()) {
    return fail(paramsResult.message);
  }

  const params: Entities.Fillings.IFillingsLibraryAsyncParams = {
    ...paramsResult.value
  };

  return Entities.Fillings.FillingsLibrary.createAsync(params);
}

/**
 * Loads an IngredientsLibrary from the specified data sources.
 *
 * @param options - Data source options from command line
 * @returns Promise resolving to Success with IngredientsLibrary, or Failure with error
 */
export async function loadIngredientsLibrary(
  options: IDataSourceOptions
): Promise<Result<Entities.Ingredients.IngredientsLibrary>> {
  const paramsResult = await prepareAsyncParams(options);
  if (paramsResult.isFailure()) {
    return fail(paramsResult.message);
  }

  const params: Entities.Ingredients.IIngredientsLibraryAsyncParams = {
    ...paramsResult.value
  };

  return Entities.Ingredients.IngredientsLibrary.createAsync(params);
}

/**
 * Loads a MoldsLibrary from the specified data sources.
 *
 * @param options - Data source options from command line
 * @returns Promise resolving to Success with MoldsLibrary, or Failure with error
 */
export async function loadMoldsLibrary(
  options: IDataSourceOptions
): Promise<Result<Entities.Molds.MoldsLibrary>> {
  const paramsResult = await prepareAsyncParams(options);
  if (paramsResult.isFailure()) {
    return fail(paramsResult.message);
  }

  const params: Entities.Molds.IMoldsLibraryAsyncParams = {
    ...paramsResult.value
  };

  return Entities.Molds.MoldsLibrary.createAsync(params);
}

/**
 * Loads a TasksLibrary from the specified data sources.
 *
 * @param options - Data source options from command line
 * @returns Promise resolving to Success with TasksLibrary, or Failure with error
 */
export async function loadTasksLibrary(
  options: IDataSourceOptions
): Promise<Result<Entities.Tasks.TasksLibrary>> {
  const paramsResult = await prepareAsyncParams(options);
  if (paramsResult.isFailure()) {
    return fail(paramsResult.message);
  }

  const params: Entities.Tasks.ITasksLibraryAsyncParams = {
    ...paramsResult.value
  };

  return Entities.Tasks.TasksLibrary.createAsync(params);
}

/**
 * Loads a ProceduresLibrary from the specified data sources.
 *
 * @param options - Data source options from command line
 * @returns Promise resolving to Success with ProceduresLibrary, or Failure with error
 */
export async function loadProceduresLibrary(
  options: IDataSourceOptions
): Promise<Result<Entities.Procedures.ProceduresLibrary>> {
  const paramsResult = await prepareAsyncParams(options);
  if (paramsResult.isFailure()) {
    return fail(paramsResult.message);
  }

  const params: Entities.Procedures.IProceduresLibraryAsyncParams = {
    ...paramsResult.value
  };

  return Entities.Procedures.ProceduresLibrary.createAsync(params);
}

/**
 * Loads a ConfectionsLibrary from the specified data sources.
 *
 * @param options - Data source options from command line
 * @returns Promise resolving to Success with ConfectionsLibrary, or Failure with error
 */
export async function loadConfectionsLibrary(
  options: IDataSourceOptions
): Promise<Result<Entities.Confections.ConfectionsLibrary>> {
  const paramsResult = await prepareAsyncParams(options);
  if (paramsResult.isFailure()) {
    return fail(paramsResult.message);
  }

  const params: Entities.Confections.IConfectionsLibraryAsyncParams = {
    ...paramsResult.value
  };

  return Entities.Confections.ConfectionsLibrary.createAsync(params);
}
