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
 * Workspace class - the primary entry point for chocolate applications.
 * @packageDocumentation
 */

import { fail, Logging, Result, succeed } from '@fgv/ts-utils';

import { CryptoUtils } from '@fgv/ts-extras';
import { IEncryptionConfig } from '../library-data';
import { ChocolateLibrary } from '../library-runtime';
import { ISettingsManager } from '../settings';
import { UserEntityLibrary } from '../user-entities';
import { IUserLibrary, UserLibrary } from '../user-library';
import {
  IWorkspace,
  IWorkspaceCreateParams,
  IWorkspaceCreateWithSettingsParams,
  toLibraryParams,
  toUserLibraryParams,
  WorkspaceState
} from './model';

// ============================================================================
// Workspace Class
// ============================================================================

/**
 * The primary entry point for chocolate applications.
 *
 * Workspace is a thin coordinator that wraps:
 * - RuntimeContext for library access and session creation
 * - KeyStore for encrypted collection support
 *
 * @public
 */
export class Workspace implements IWorkspace {
  private readonly _library: ChocolateLibrary;
  private readonly _userEntities: UserEntityLibrary;
  private readonly _keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
  private readonly _cryptoProvider: CryptoUtils.ICryptoProvider | undefined;
  private readonly _settings: ISettingsManager | undefined;
  private readonly _logger: Logging.LogReporter<unknown>;
  private _userData: UserLibrary | undefined;

  /**
   * Private constructor - use static factory methods.
   */
  private constructor(
    library: ChocolateLibrary,
    userEntityLibrary: UserEntityLibrary,
    keyStore: CryptoUtils.KeyStore.KeyStore | undefined,
    cryptoProvider: CryptoUtils.ICryptoProvider | undefined,
    settings: ISettingsManager | undefined,
    logger: Logging.LogReporter<unknown>
  ) {
    this._library = library;
    this._userEntities = userEntityLibrary;
    this._keyStore = keyStore;
    this._cryptoProvider = cryptoProvider;
    this._settings = settings;
    this._logger = logger;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Creates a new workspace with the specified configuration.
   *
   * @param params - Workspace creation parameters
   * @returns Success with workspace, or Failure if creation fails
   * @public
   */
  public static create(params?: IWorkspaceCreateParams): Result<Workspace> {
    params = params ?? {};

    // Set up logger
    const logger = Logging.LogReporter.createDefault(params.logger).orThrow();

    // Create key store if configured
    let keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
    let cryptoProvider: CryptoUtils.ICryptoProvider | undefined;

    if (params.keyStore) {
      cryptoProvider = params.keyStore.cryptoProvider;

      if (params.keyStore.file) {
        // Open existing key store
        const openResult = CryptoUtils.KeyStore.KeyStore.open({
          keystoreFile: params.keyStore.file,
          cryptoProvider
        });
        if (openResult.isFailure()) {
          return fail(`Failed to open key store: ${openResult.message}`);
        }
        keyStore = openResult.value;
      } else {
        // Create new key store (caller will need to initialize it)
        const createResult = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider });
        /* c8 ignore next 3 - defensive: KeyStore.create failure */
        if (createResult.isFailure()) {
          return fail(`Failed to create key store: ${createResult.message}`);
        }
        keyStore = createResult.value;
      }
    }

    // Create library parameters
    const libraryParams = toLibraryParams(params);
    const userLibraryParams = toUserLibraryParams(params);

    // Create chocolate library and user library, then assemble workspace
    return ChocolateLibrary.create({
      entityLibraryParams: libraryParams,
      preWarm: params.preWarm
    })
      .withErrorFormat((msg) => `Failed to create chocolate library: ${msg}`)
      .onSuccess((library) =>
        UserEntityLibrary.create(userLibraryParams)
          .withErrorFormat((msg) => `Failed to create user library: ${msg}`)
          .onSuccess((userLibrary) => {
            const workspace = new Workspace(
              library,
              userLibrary,
              keyStore,
              cryptoProvider,
              undefined, // Settings manager - not available via basic create
              logger
            );
            logger.info(
              `Workspace created: ${
                workspace.state === 'no-keystore' ? 'no key store' : 'with key store (locked)'
              }`
            );
            return succeed(workspace);
          })
      );
  }

  /**
   * Creates a new workspace with a pre-created settings manager.
   * Used by platform initialization flow after settings have been loaded.
   *
   * @param params - Workspace creation parameters with settings manager
   * @returns Success with workspace, or Failure if creation fails
   * @public
   */
  public static createWithSettings(params: IWorkspaceCreateWithSettingsParams): Result<Workspace> {
    // Set up logger
    const logger = Logging.LogReporter.createDefault(params.logger).orThrow();

    // Create key store if configured
    let keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
    let cryptoProvider: CryptoUtils.ICryptoProvider | undefined;

    if (params.keyStore) {
      cryptoProvider = params.keyStore.cryptoProvider;

      if (params.keyStore.file) {
        // Open existing key store
        const openResult = CryptoUtils.KeyStore.KeyStore.open({
          keystoreFile: params.keyStore.file,
          cryptoProvider
        });
        if (openResult.isFailure()) {
          return fail(`Failed to open key store: ${openResult.message}`);
        }
        keyStore = openResult.value;
      } else {
        // Create new key store (caller will need to initialize it)
        const createResult = CryptoUtils.KeyStore.KeyStore.create({ cryptoProvider });
        /* c8 ignore next 3 - defensive: KeyStore.create failure */
        if (createResult.isFailure()) {
          return fail(`Failed to create key store: ${createResult.message}`);
        }
        keyStore = createResult.value;
      }
    }

    // Create library parameters
    const libraryParams = toLibraryParams(params);
    const userLibraryParams = toUserLibraryParams(params);

    // Create chocolate library and user library, then assemble workspace
    return ChocolateLibrary.create({
      entityLibraryParams: libraryParams,
      preWarm: params.preWarm
    })
      .withErrorFormat((msg) => `Failed to create chocolate library: ${msg}`)
      .onSuccess((library) =>
        UserEntityLibrary.create(userLibraryParams)
          .withErrorFormat((msg) => `Failed to create user library: ${msg}`)
          .onSuccess((userLibrary) => {
            const workspace = new Workspace(
              library,
              userLibrary,
              keyStore,
              cryptoProvider,
              params.settings,
              logger
            );
            logger.info(
              `Workspace created with settings: ${
                workspace.state === 'no-keystore' ? 'no key store' : 'with key store (locked)'
              }`
            );
            return succeed(workspace);
          })
      );
  }

  // ============================================================================
  // Core Access (IWorkspace)
  // ============================================================================

  /**
   * {@inheritDoc IWorkspace.data}
   */
  public get data(): ChocolateLibrary {
    return this._library;
  }

  /**
   * {@inheritDoc IWorkspace.userData}
   */
  public get userData(): IUserLibrary {
    if (this._userData === undefined) {
      // Lazily create the user runtime on first access
      this._userData = UserLibrary.create(this._userEntities, this._library).orThrow();
    }
    return this._userData;
  }

  /**
   * {@inheritDoc IWorkspace.keyStore}
   */
  public get keyStore(): CryptoUtils.KeyStore.KeyStore | undefined {
    return this._keyStore;
  }

  /**
   * {@inheritDoc IWorkspace.settings}
   */
  public get settings(): ISettingsManager | undefined {
    return this._settings;
  }

  // ============================================================================
  // Workspace State (IWorkspace)
  // ============================================================================

  /**
   * {@inheritDoc IWorkspace.state}
   */
  public get state(): WorkspaceState {
    if (!this._keyStore) {
      return 'no-keystore';
    }
    return this._keyStore.isUnlocked ? 'unlocked' : 'locked';
  }

  /**
   * {@inheritDoc IWorkspace.isReady}
   */
  public get isReady(): boolean {
    return this.state !== 'locked';
  }

  // ============================================================================
  // Lifecycle (IWorkspace)
  // ============================================================================

  /**
   * {@inheritDoc IWorkspace.unlock}
   */
  public async unlock(password: string): Promise<Result<IWorkspace>> {
    if (!this._keyStore) {
      return fail('No key store configured');
    }

    if (this._keyStore.isUnlocked) {
      return succeed(this);
    }

    // Unlock the key store
    const unlockResult = await this._keyStore.unlock(password);
    if (unlockResult.isFailure()) {
      return fail(`Failed to unlock key store: ${unlockResult.message}`);
    }

    // Load protected collections from each sub-library
    await this._loadProtectedCollections();

    this._logger.info('Workspace unlocked');
    return succeed(this);
  }

  /**
   * {@inheritDoc IWorkspace.lock}
   */
  public lock(): Result<IWorkspace> {
    if (!this._keyStore) {
      return fail('No key store configured');
    }

    if (!this._keyStore.isUnlocked) {
      return succeed(this);
    }

    const lockResult = this._keyStore.lock();
    if (lockResult.isFailure()) {
      return fail(`Failed to lock key store: ${lockResult.message}`);
    }

    this._logger.info('Workspace locked');
    return succeed(this);
  }

  /**
   * Loads protected collections from all sub-libraries using the key store's secrets.
   * @internal
   */
  private async _loadProtectedCollections(): Promise<void> {
    /* c8 ignore next 3 - defensive: already validated by caller */
    if (!this._keyStore || !this._cryptoProvider) {
      return;
    }

    // Get the secret provider from the key store
    const providerResult = this._keyStore.getSecretProvider();
    /* c8 ignore next 4 - defensive: keyStore.getSecretProvider unlikely to fail after unlock */
    if (providerResult.isFailure()) {
      this._logger.warn(`Could not get secret provider: ${providerResult.message}`);
      return;
    }

    const encryption: IEncryptionConfig = {
      cryptoProvider: this._cryptoProvider,
      secretProvider: providerResult.value
    };

    // Load protected collections from each sub-library
    const library = this._library.entities;

    // Load ingredients
    const ingredientsResult = await library.ingredients.loadProtectedCollectionAsync(encryption);
    if (ingredientsResult.isSuccess()) {
      this._logger.info(`Loaded ${ingredientsResult.value.length} protected ingredient collection(s)`);
    }

    // Load fillings
    const fillingsResult = await library.fillings.loadProtectedCollectionAsync(encryption);
    if (fillingsResult.isSuccess()) {
      this._logger.info(`Loaded ${fillingsResult.value.length} protected filling collection(s)`);
    }

    // Load molds
    const moldsResult = await library.molds.loadProtectedCollectionAsync(encryption);
    if (moldsResult.isSuccess()) {
      this._logger.info(`Loaded ${moldsResult.value.length} protected mold collection(s)`);
    }

    // Load procedures
    const proceduresResult = await library.procedures.loadProtectedCollectionAsync(encryption);
    if (proceduresResult.isSuccess()) {
      this._logger.info(`Loaded ${proceduresResult.value.length} protected procedure collection(s)`);
    }

    // Load tasks
    const tasksResult = await library.tasks.loadProtectedCollectionAsync(encryption);
    if (tasksResult.isSuccess()) {
      this._logger.info(`Loaded ${tasksResult.value.length} protected task collection(s)`);
    }

    // Load confections
    const confectionsResult = await library.confections.loadProtectedCollectionAsync(encryption);
    if (confectionsResult.isSuccess()) {
      this._logger.info(`Loaded ${confectionsResult.value.length} protected confection collection(s)`);
    }

    // Load journals (user library)
    const journalsResult = await this._userEntities.journals.loadProtectedCollectionAsync(encryption);
    if (journalsResult.isSuccess()) {
      this._logger.info(`Loaded ${journalsResult.value.length} protected journal collection(s)`);
    }

    // Clear runtime cache so new items are visible
    this._library.clearCache();
  }
}
