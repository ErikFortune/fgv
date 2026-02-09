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

import * as path from 'path';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';
import { FileTree } from '@fgv/ts-json-base';
import { IWorkspaceFactoryParams, IWorkspace } from './model';
import { Workspace } from './workspace';
import { initializeNodePlatform } from './nodePlatformInit';
import { createWorkspaceFromPlatform } from './platformInit';
import { DeviceId } from '../settings';
import { ILibraryFileTreeSource } from '../library-data';

/**
 * Startup mode for workspace initialization.
 * @public
 */
export type StartupMode = 'fail-on-error' | 'ignore-errors';

/**
 * Behavior when a required file or directory is missing.
 * @public
 */
export type MissingFileBehavior = 'fail' | 'ignore' | 'create-empty';

/**
 * Directory layout mode for workspace initialization.
 * @public
 */
export type DirectoryLayoutMode = 'single-root' | 'dual-root' | 'multi-root';

/**
 * Parameters for single-root directory layout.
 * All data (settings, keystore, user data, library collections) in one directory.
 * @public
 */
export interface ISingleRootParams {
  /**
   * Layout mode identifier.
   */
  readonly mode: 'single-root';

  /**
   * Path to the root directory containing all workspace data.
   */
  readonly rootPath: string;
}

/**
 * Parameters for dual-root directory layout.
 * Separate directories for installation data and library collections.
 * @public
 */
export interface IDualRootParams {
  /**
   * Layout mode identifier.
   */
  readonly mode: 'dual-root';

  /**
   * Path to installation data (settings, keystore, user data, possibly additional libraries).
   */
  readonly installationPath: string;

  /**
   * Path to library collections directory (possibly read-only).
   */
  readonly libraryPath: string;

  /**
   * Whether the library path is read-only.
   * @defaultValue false
   */
  readonly libraryReadOnly?: boolean;
}

/**
 * Parameters for multi-root directory layout.
 * One installation directory and multiple library collection directories.
 * @public
 */
export interface IMultiRootParams {
  /**
   * Layout mode identifier.
   */
  readonly mode: 'multi-root';

  /**
   * Path to installation data (settings, keystore, user data).
   */
  readonly installationPath: string;

  /**
   * Paths to library collection directories.
   */
  readonly libraryPaths: ReadonlyArray<{
    readonly path: string;
    readonly readOnly?: boolean;
  }>;
}

/**
 * Union type for directory layout parameters.
 * @public
 */
export type DirectoryLayoutParams = ISingleRootParams | IDualRootParams | IMultiRootParams;

/**
 * Enhanced parameters for creating a Node.js workspace.
 * @public
 */
export interface ICreateNodeWorkspaceParams {
  /**
   * Directory layout configuration.
   */
  readonly layout: DirectoryLayoutParams;

  /**
   * Startup mode for error handling.
   * @defaultValue 'fail-on-error'
   */
  readonly startupMode?: StartupMode;

  /**
   * Behavior when required files are missing.
   * @defaultValue 'fail'
   */
  readonly missingFileBehavior?: MissingFileBehavior;

  /**
   * Device identifier for this instance.
   */
  readonly deviceId?: DeviceId;

  /**
   * Human-readable device name.
   */
  readonly deviceName?: string;

  /**
   * Whether to load built-in data.
   * @defaultValue true
   */
  readonly builtin?: boolean;

  /**
   * Whether to pre-warm caches on load.
   * @defaultValue false
   */
  readonly preWarm?: boolean;
}

/**
 * Creates a workspace with Node.js platform defaults (legacy API).
 * Uses nodeCryptoProvider for key store and encryption operations.
 *
 * @deprecated Use createNodeWorkspace with DirectoryLayoutParams instead
 * @param params - Workspace creation parameters (without crypto provider)
 * @returns Success with workspace, or Failure if creation fails
 * @public
 */
export function createNodeWorkspaceLegacy(params?: IWorkspaceFactoryParams): Result<Workspace> {
  return Workspace.create({
    ...params,
    keyStore: params?.keyStoreFile
      ? {
          file: params.keyStoreFile,
          cryptoProvider: CryptoUtils.nodeCryptoProvider
        }
      : undefined
  });
}

/**
 * Creates a workspace from filesystem directories using platform initialization.
 * Supports three directory layout modes:
 * 1. Single root - all data in one directory
 * 2. Dual root - separate installation and library directories
 * 3. Multi-root - installation directory plus multiple library directories
 *
 * @param params - Workspace creation parameters with directory layout
 * @returns Success with workspace, or Failure if creation fails
 * @public
 */
export async function createNodeWorkspace(params: ICreateNodeWorkspaceParams): Promise<Result<IWorkspace>> {
  const { layout, startupMode = 'fail-on-error', builtin = true, preWarm = false } = params;

  // Determine user library path based on layout mode
  const userLibraryPath = layout.mode === 'single-root' ? layout.rootPath : layout.installationPath;

  // Stage 1: Platform initialization
  const platformResult = await initializeNodePlatform({
    userLibraryPath,
    deviceId: params.deviceId,
    deviceName: params.deviceName
  });

  if (platformResult.isFailure()) {
    if (startupMode === 'ignore-errors') {
      // Create minimal workspace with built-in data only (no file sources, no key store)
      return Workspace.create({ builtin, preWarm });
    }
    return fail(`Platform initialization failed: ${platformResult.message}`);
  }

  // Stage 2: Create additional file sources for multi-directory layouts
  const additionalFileSources: ILibraryFileTreeSource[] = [];

  if (layout.mode === 'dual-root') {
    const sourceResult = createFileTreeSource(layout.libraryPath, !(layout.libraryReadOnly ?? false));
    /* c8 ignore next 6 - defensive: DirectoryItem.create rarely fails */
    if (sourceResult.isFailure()) {
      if (startupMode === 'ignore-errors') {
        return Workspace.create({ builtin, preWarm });
      }
      return fail(`Failed to create library source for ${layout.libraryPath}: ${sourceResult.message}`);
    }
    additionalFileSources.push(sourceResult.value);
  } else if (layout.mode === 'multi-root') {
    for (const libPath of layout.libraryPaths) {
      const sourceResult = createFileTreeSource(libPath.path, !(libPath.readOnly ?? false));
      /* c8 ignore next 6 - defensive: DirectoryItem.create rarely fails */
      if (sourceResult.isFailure()) {
        if (startupMode === 'ignore-errors') {
          return Workspace.create({ builtin, preWarm });
        }
        return fail(`Failed to create library source for ${libPath.path}: ${sourceResult.message}`);
      }
      additionalFileSources.push(sourceResult.value);
    }
  }

  // Stage 3: Create workspace from platform init result
  return createWorkspaceFromPlatform({
    platformInit: platformResult.value,
    builtin,
    preWarm,
    additionalFileSources: additionalFileSources.length > 0 ? additionalFileSources : undefined
  });
}

/**
 * Creates a file tree source from a directory path.
 * @param dirPath - Path to the directory
 * @param mutable - Whether the directory is mutable (writable)
 * @returns Success with file tree source, or Failure if creation fails
 */
function createFileTreeSource(dirPath: string, mutable: boolean): Result<ILibraryFileTreeSource> {
  const resolvedPath = path.resolve(dirPath);
  const accessors = new FileTree.FsFileTreeAccessors({
    prefix: resolvedPath,
    mutable
  });
  return FileTree.DirectoryItem.create('.', accessors).onSuccess((directory) =>
    succeed({ directory, mutable })
  );
}
