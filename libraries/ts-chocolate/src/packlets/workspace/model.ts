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
 * Workspace model interfaces - the primary entry point for chocolate applications.
 *
 * A workspace coordinates:
 * - Library access (ingredients, fillings, confections, etc.)
 * - Key store for encrypted collection support
 * - Session creation for editing
 *
 * @packageDocumentation
 */

import { Logging, Result } from '@fgv/ts-utils';

import { CryptoUtils } from '@fgv/ts-extras';
import { JournalLibrary } from '../entities';
import { FullLibraryLoadSpec, IEncryptionConfig, ILibraryFileTreeSource } from '../library-data';
import { IChocolateEntityLibraryCreateParams, IInstantiatedEntityLibrarySources } from '../library-runtime';
import { RuntimeContext } from '../runtime';
import { ISettingsManager } from '../settings';
import { IUserEntityLibraryCreateParams } from '../user-entities';
import { IUserLibraryRuntime } from '../user-runtime';

// ============================================================================
// Workspace State
// ============================================================================

/**
 * State of the workspace with respect to key store and encryption.
 * @public
 */
export type WorkspaceState = 'locked' | 'unlocked' | 'no-keystore';

// ============================================================================
// Workspace Interface
// ============================================================================

/**
 * The primary entry point for chocolate applications.
 *
 * A workspace provides unified access to:
 * - Library runtime for materialized library objects (ingredients, fillings, confections, etc.)
 * - User runtime for materialized user data (sessions, journals, inventory)
 * - Key store for encrypted collection support
 * - Settings management
 *
 * @public
 */
export interface IWorkspace {
  // ---- Core Access ----

  /**
   * The runtime context providing materialized library objects.
   * Access via `runtime.ingredients`, `runtime.fillings`, `runtime.confections`, etc.
   */
  readonly data: RuntimeContext;

  /**
   * User library runtime for materialized user data.
   * Access via `userRuntime.sessions`, `userRuntime.journals`, `userRuntime.moldInventory`, etc.
   */
  readonly userData: IUserLibraryRuntime;

  /**
   * The key store for encryption key management, if configured.
   */
  readonly keyStore: CryptoUtils.KeyStore.KeyStore | undefined;

  /**
   * The settings manager for workspace configuration.
   * May be undefined if workspace was created without platform initialization.
   */
  readonly settings: ISettingsManager | undefined;

  // ---- Workspace State ----

  /**
   * Current state of the workspace with respect to key store.
   * - `'locked'`: Key store is present but not unlocked
   * - `'unlocked'`: Key store is present and unlocked
   * - `'no-keystore'`: No key store configured
   */
  readonly state: WorkspaceState;

  /**
   * Whether the workspace is ready for use (unlocked or no key store configured).
   */
  readonly isReady: boolean;

  // ---- Lifecycle ----

  /**
   * Unlocks the workspace with a password.
   * - Unlocks the key store
   * - Loads any protected collections using the now-available secrets
   * @param password - The master password for the key store
   * @returns Success with the workspace, or Failure if unlock fails
   */
  unlock(password: string): Promise<Result<IWorkspace>>;

  /**
   * Locks the workspace.
   * - Locks the key store, clearing secrets from memory
   * @returns Success with the workspace, or Failure if lock fails
   */
  lock(): Result<IWorkspace>;
}

// ============================================================================
// Workspace Creation Parameters
// ============================================================================

/**
 * Key store configuration for workspace creation.
 * @public
 */
export interface IWorkspaceKeyStoreConfig {
  /**
   * Existing key store file data to load.
   * If not provided, no key store will be configured.
   */
  readonly file?: CryptoUtils.KeyStore.IKeyStoreFile;

  /**
   * The crypto provider for key store operations.
   */
  readonly cryptoProvider: CryptoUtils.ICryptoProvider;
}

/**
 * Parameters for creating a workspace.
 *
 * Combines library loading parameters with key store configuration.
 *
 * @public
 */
export interface IWorkspaceCreateParams {
  // ---- Library Sources (same as IChocolateEntityLibraryCreateParams) ----

  /**
   * Specifies built-in data loading for each sub-library.
   * @see {@link LibraryData.FullLibraryLoadSpec}
   */
  readonly builtin?: FullLibraryLoadSpec;

  /**
   * File tree sources to load data from.
   * @see {@link LibraryData.ILibraryFileTreeSource}
   */
  readonly fileSources?: ILibraryFileTreeSource | ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Pre-instantiated library sources.
   * @see {@link LibraryRuntime.IInstantiatedLibrarySource}
   */
  readonly libraries?: IInstantiatedEntityLibrarySources;

  // ---- User Library Sources (Journals, Future Inventory) ----

  /**
   * File tree sources for user-specific data (journals, future inventory).
   * Separate from shared library sources.
   */
  readonly userFileSources?: ILibraryFileTreeSource | ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Pre-instantiated journal library.
   */
  readonly journals?: JournalLibrary;

  // ---- Key Store Configuration ----

  /**
   * Key store configuration.
   * If provided, the workspace will support encrypted collections.
   */
  readonly keyStore?: IWorkspaceKeyStoreConfig;

  // ---- Encryption Configuration ----

  /**
   * Additional encryption configuration options.
   * The workspace automatically wires up the key store's secret provider.
   */
  readonly encryption?: Partial<Omit<IEncryptionConfig, 'secretProvider'>>;

  // ---- Logging ----

  /**
   * Logger for workspace operations.
   */
  readonly logger?: Logging.LogReporter<unknown>;

  // ---- Caching ----

  /**
   * Whether to pre-warm the runtime caches on creation.
   * @defaultValue false
   */
  readonly preWarm?: boolean;
}

/**
 * Parameters for creating a workspace with platform-specific defaults.
 * Used by platform factory functions.
 * @public
 */
export interface IWorkspaceFactoryParams extends Omit<IWorkspaceCreateParams, 'keyStore'> {
  /**
   * Key store file data to load.
   * The crypto provider will be supplied by the platform factory.
   */
  readonly keyStoreFile?: CryptoUtils.KeyStore.IKeyStoreFile;
}

/**
 * Parameters for creating a workspace with pre-created settings manager.
 * Used by platform initialization flow.
 * @public
 */
export interface IWorkspaceCreateWithSettingsParams extends IWorkspaceCreateParams {
  /**
   * Pre-created settings manager from platform initialization.
   * If provided, the workspace will use this settings manager.
   */
  readonly settings: ISettingsManager;
}

/**
 * Creates library parameters from workspace parameters.
 * @param params - The workspace creation parameters
 * @param encryption - The assembled encryption configuration
 * @returns Library creation parameters
 * @internal
 */
export function toLibraryParams(
  params: IWorkspaceCreateParams,
  encryption?: IEncryptionConfig
): IChocolateEntityLibraryCreateParams {
  return {
    builtin: params.builtin,
    fileSources: params.fileSources,
    libraries: params.libraries,
    logger: params.logger
    // Note: encryption is handled at sub-library level during protected collection loading
  };
}

/**
 * Creates user library parameters from workspace parameters.
 * @param params - The workspace creation parameters
 * @returns User library creation parameters
 * @internal
 */
export function toUserLibraryParams(params: IWorkspaceCreateParams): IUserEntityLibraryCreateParams {
  return {
    fileSources: params.userFileSources,
    libraries: params.journals ? { journals: params.journals } : undefined,
    logger: params.logger
  };
}
