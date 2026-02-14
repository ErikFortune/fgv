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

/**
 * Platform initialization interfaces for two-stage workspace setup.
 *
 * Two-stage initialization flow:
 * 1. Platform layer (Node.js/Browser) resolves platform-specific resources
 *    - Creates crypto provider
 *    - Resolves user library path → FileTree
 *    - Loads & merges settings
 *    - Resolves external library refs → FileTrees
 *    - Loads keystore file
 * 2. Common initializer creates workspace from resolved resources
 *    - Creates Workspace with file tree sources
 *    - Creates SettingsManager
 *
 * @packageDocumentation
 */

import { fail, Logging, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { CryptoUtils } from '@fgv/ts-extras';
import { FullLibraryLoadSpec, ILibraryFileTreeSource, LibraryPaths, SubLibraryId } from '../library-data';
import {
  DeviceId,
  ExternalLibraryRef,
  ICommonSettings,
  IDeviceSettings,
  IExternalLibraryRefConfig,
  IResolvedSettings,
  SettingsManager
} from '../settings';
import { IWorkspace } from './model';
import { Workspace } from './workspace';

// ============================================================================
// Resolved External Library
// ============================================================================

/**
 * An external library reference after platform resolution.
 * The ref has been resolved to a FileTree that can be used directly.
 * @public
 */
export interface IResolvedExternalLibrary {
  /**
   * Human-readable name for the library.
   */
  readonly name: string;

  /**
   * The original reference that was resolved.
   */
  readonly originalRef: ExternalLibraryRef;

  /**
   * The resolved file tree root directory.
   */
  readonly fileTree: FileTree.IFileTreeDirectoryItem;

  /**
   * Which sublibraries to load from this source.
   */
  readonly load?: boolean | Partial<Record<SubLibraryId | 'default', boolean>>;

  /**
   * Whether collections from this source are mutable.
   */
  readonly mutable?: boolean;
}

// ============================================================================
// Platform Initialization Result (Stage 1 Output)
// ============================================================================

/**
 * Result of platform-specific initialization (Stage 1).
 * Contains all platform-resolved resources ready for workspace creation.
 * @public
 */
export interface IPlatformInitResult {
  /**
   * The crypto provider for this platform.
   */
  readonly cryptoProvider: CryptoUtils.ICryptoProvider;

  /**
   * The user library root directory (contains data/journals, data/sessions, data/settings).
   */
  readonly userLibraryTree: FileTree.IFileTreeDirectoryItem;

  /**
   * External libraries with resolved file trees.
   */
  readonly externalLibraries: ReadonlyArray<IResolvedExternalLibrary>;

  /**
   * The key store file contents, if found.
   */
  readonly keyStoreFile?: CryptoUtils.KeyStore.IKeyStoreFile;

  /**
   * The common settings (loaded from file or defaults).
   */
  readonly commonSettings: ICommonSettings;

  /**
   * The device settings (loaded from file or defaults).
   */
  readonly deviceSettings: IDeviceSettings;

  /**
   * The merged resolved settings.
   */
  readonly resolvedSettings: IResolvedSettings;

  /**
   * The device identifier for this instance.
   */
  readonly deviceId: DeviceId;
}

// ============================================================================
// Platform Initialization Options
// ============================================================================

/**
 * Options for platform initialization.
 * @public
 */
export interface IPlatformInitOptions {
  /**
   * Path to the user library root directory (platform-specific format).
   * On Node.js, this is a filesystem path.
   * On Browser, this might be a localStorage key prefix or similar.
   */
  readonly userLibraryPath: string;

  /**
   * The device identifier for this instance.
   * If not provided, the platform should generate one.
   */
  readonly deviceId?: DeviceId;

  /**
   * Human-readable name for this device.
   * Used for new device settings if device settings file doesn't exist.
   */
  readonly deviceName?: string;

  /**
   * Path to the key store file (platform-specific format).
   * If not provided, defaults to a standard location within the user library.
   */
  readonly keyStorePath?: string;
}

// ============================================================================
// Platform Initializer Interface
// ============================================================================

/**
 * Interface for platform-specific initialization.
 * Implementations handle platform-specific resource resolution.
 * @public
 */
export interface IPlatformInitializer {
  /**
   * Performs platform initialization (Stage 1).
   * - Creates crypto provider
   * - Resolves user library path to FileTree
   * - Loads settings (common and device-specific)
   * - Resolves external library references to FileTrees
   * - Loads key store file if present
   *
   * @param options - Platform initialization options
   * @returns Success with init result, or Failure
   */
  initialize(options: IPlatformInitOptions): Promise<Result<IPlatformInitResult>>;

  /**
   * Resolves an external library reference to a FileTree.
   * @param ref - The external library reference (path or URI)
   * @param config - The full external library configuration
   * @returns Success with file tree, or Failure if resolution fails
   */
  resolveExternalLibrary(
    ref: ExternalLibraryRef,
    config: IExternalLibraryRefConfig
  ): Result<FileTree.IFileTreeDirectoryItem>;
}

// ============================================================================
// Common Workspace Initialization Parameters (Stage 2 Input)
// ============================================================================

/**
 * Parameters for common workspace initialization (Stage 2).
 * Takes the platform-resolved resources and creates a workspace.
 * @public
 */
export interface ICommonWorkspaceInitParams {
  /**
   * The result from platform initialization (Stage 1).
   */
  readonly platformInit: IPlatformInitResult;

  /**
   * Specifies built-in data loading for each sub-library.
   */
  readonly builtin?: FullLibraryLoadSpec;

  /**
   * Additional file tree sources beyond those from platform init.
   * Useful for test scenarios or specialized configurations.
   */
  readonly additionalFileSources?: ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Whether to pre-warm the runtime caches on creation.
   * @defaultValue false
   */
  readonly preWarm?: boolean;

  /**
   * Optional logger for workspace operations.
   * If not provided, a default NoOp logger is used.
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts resolved external libraries to library file tree sources.
 * @param libraries - The resolved external libraries
 * @returns Array of library file tree sources
 * @public
 */
export function toLibraryFileSources(
  libraries: ReadonlyArray<IResolvedExternalLibrary>
): ReadonlyArray<ILibraryFileTreeSource> {
  return libraries.map((lib): ILibraryFileTreeSource => {
    // Convert load spec to the library format
    let load: FullLibraryLoadSpec | undefined;
    if (lib.load === true) {
      load = true;
    } else if (lib.load === false) {
      load = false;
    } else if (lib.load !== undefined) {
      // Per-sublibrary configuration
      load = lib.load;
    }

    return {
      directory: lib.fileTree,
      load,
      mutable: lib.mutable
    };
  });
}

/**
 * Converts user library tree to a library file tree source for user data.
 * @param userLibraryTree - The user library root directory
 * @param mutable - Whether the user library is mutable (defaults to true)
 * @returns Library file tree source for user data
 * @public
 */
export function toUserLibrarySource(
  userLibraryTree: FileTree.IFileTreeDirectoryItem,
  mutable: boolean = true
): ILibraryFileTreeSource {
  return {
    directory: userLibraryTree,
    load: {
      // User library only loads user-specific sub-libraries (journals, sessions).
      // Entity libraries (ingredients, fillings, etc.) come from built-in or external sources.
      journals: true,
      sessions: true,
      default: false
    },
    mutable
  };
}

// ============================================================================
// FileTree-based Workspace Directory Initialization
// ============================================================================

/**
 * All standard workspace directory paths that should be pre-created.
 * @internal
 */
const WORKSPACE_DIRECTORY_PATHS: ReadonlyArray<string> = [
  // Library entity directories
  LibraryPaths.ingredients,
  LibraryPaths.fillings,
  LibraryPaths.confections,
  LibraryPaths.decorations,
  LibraryPaths.molds,
  LibraryPaths.procedures,
  LibraryPaths.tasks,
  // User entity directories
  LibraryPaths.sessions,
  LibraryPaths.journals,
  LibraryPaths.moldInventory,
  LibraryPaths.ingredientInventory,
  // Settings
  LibraryPaths.settings
];

/**
 * Ensures a directory path exists in a FileTree, creating intermediate
 * directories as needed (analogous to `mkdir -p`).
 *
 * @param root - The root directory item to start from
 * @param relativePath - A `/`-separated relative path (e.g. `data/ingredients`)
 * @returns Success with the leaf directory item, or Failure if creation is not supported
 * @public
 */
export function ensureDirectoryPath(
  root: FileTree.IFileTreeDirectoryItem,
  relativePath: string
): Result<FileTree.IFileTreeDirectoryItem> {
  const segments = relativePath.split('/').filter((s) => s.length > 0);
  let current = root;

  for (const segment of segments) {
    // Check if child already exists
    const childrenResult = current.getChildren();
    if (childrenResult.isSuccess()) {
      const existing = childrenResult.value.find(
        (child): child is FileTree.IFileTreeDirectoryItem => 'getChildren' in child && child.name === segment
      );
      if (existing) {
        current = existing;
        continue;
      }
    }

    // Create the directory
    if (current.createChildDirectory === undefined) {
      return fail(`${current.absolutePath}: directory creation not supported`);
    }
    const createResult = current.createChildDirectory(segment);
    if (createResult.isFailure()) {
      return fail(`${current.absolutePath}/${segment}: ${createResult.message}`);
    }
    current = createResult.value;
  }

  return succeed(current);
}

/**
 * Ensures the standard workspace directory structure exists in a FileTree.
 *
 * Platform-agnostic equivalent of {@link createWorkspaceDirectories} — works
 * with any writable FileTree (localStorage, File System Access API, in-memory, etc.).
 *
 * @param root - The root directory item of the workspace tree
 * @returns Success if all directories were created/verified, Failure otherwise
 * @public
 */
export function ensureWorkspaceDirectoriesInTree(root: FileTree.IFileTreeDirectoryItem): Result<void> {
  for (const dirPath of WORKSPACE_DIRECTORY_PATHS) {
    const result = ensureDirectoryPath(root, dirPath);
    if (result.isFailure()) {
      return fail(`Failed to ensure workspace directory '${dirPath}': ${result.message}`);
    }
  }
  return succeed(undefined);
}

// ============================================================================
// Stage 2: Common Workspace Initialization
// ============================================================================

/**
 * Creates a workspace from platform initialization results (Stage 2).
 *
 * This is the common initialization logic that works the same across all platforms.
 * Call this after platform-specific initialization (Stage 1) has completed.
 *
 * @example
 * ```typescript
 * // Node.js example
 * const platformResult = await initializeNodePlatform({
 *   userLibraryPath: '/path/to/user-lib'
 * });
 * const workspace = createWorkspaceFromPlatform({
 *   platformInit: platformResult.value,
 *   builtin: true
 * }).orThrow();
 * // workspace.settings is now available
 * ```
 *
 * @param params - Common workspace initialization parameters
 * @returns Success with workspace, or Failure if creation fails
 * @public
 */
export function createWorkspaceFromPlatform(params: ICommonWorkspaceInitParams): Result<IWorkspace> {
  const { platformInit, builtin, additionalFileSources, preWarm } = params;

  // Create settings manager and workspace from the platform init result
  return SettingsManager.create({
    fileTree: platformInit.userLibraryTree,
    deviceId: platformInit.deviceId
  })
    .withErrorFormat((msg) => `Failed to create settings manager: ${msg}`)
    .onSuccess((settings) => {
      // Convert external libraries to file tree sources
      const externalSources = toLibraryFileSources(platformInit.externalLibraries);

      // Convert user library to file tree source
      const userSource = toUserLibrarySource(platformInit.userLibraryTree);

      // Combine all file sources
      const allFileSources: ILibraryFileTreeSource[] = [...externalSources, userSource];

      /* c8 ignore next 3 - not currently exercised: additionalFileSources is not passed by any caller */
      if (additionalFileSources) {
        allFileSources.push(...additionalFileSources);
      }

      // Create key store configuration if we have a key store file
      let keyStoreConfig:
        | { file?: CryptoUtils.KeyStore.IKeyStoreFile; cryptoProvider: CryptoUtils.ICryptoProvider }
        | undefined;
      if (platformInit.keyStoreFile) {
        keyStoreConfig = {
          file: platformInit.keyStoreFile,
          cryptoProvider: platformInit.cryptoProvider
        };
      }

      // Create the workspace using the internal factory
      return Workspace.createWithSettings({
        builtin,
        fileSources: allFileSources,
        userFileSources: userSource,
        keyStore: keyStoreConfig,
        preWarm,
        settings,
        logger: params.logger
      });
    });
}
