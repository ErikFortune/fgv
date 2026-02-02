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

import { ICryptoProvider, KeyStore } from '../crypto-utils';
import { JournalLibrary } from '../entities';
import { IEncryptionConfig } from '../library-data';
import { RuntimeContext } from '../runtime';
import { UserLibrary } from '../user-library';
import {
  IWorkspace,
  IWorkspaceCreateParams,
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
  private readonly _runtime: RuntimeContext;
  private readonly _userLibrary: UserLibrary;
  private readonly _keyStore: KeyStore | undefined;
  private readonly _cryptoProvider: ICryptoProvider | undefined;
  private readonly _logger: Logging.LogReporter<unknown>;

  /**
   * Private constructor - use static factory methods.
   */
  private constructor(
    runtime: RuntimeContext,
    userLibrary: UserLibrary,
    keyStore: KeyStore | undefined,
    cryptoProvider: ICryptoProvider | undefined,
    logger: Logging.LogReporter<unknown>
  ) {
    this._runtime = runtime;
    this._userLibrary = userLibrary;
    this._keyStore = keyStore;
    this._cryptoProvider = cryptoProvider;
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
    const logger = params.logger ?? Logging.LogReporter.createDefault().orThrow();

    // Create key store if configured
    let keyStore: KeyStore | undefined;
    let cryptoProvider: ICryptoProvider | undefined;

    if (params.keyStore) {
      cryptoProvider = params.keyStore.cryptoProvider;

      if (params.keyStore.file) {
        // Open existing key store
        const openResult = KeyStore.open({
          keystoreFile: params.keyStore.file,
          cryptoProvider
        });
        if (openResult.isFailure()) {
          return fail(`Failed to open key store: ${openResult.message}`);
        }
        keyStore = openResult.value;
      } else {
        // Create new key store (caller will need to initialize it)
        const createResult = KeyStore.create({ cryptoProvider });
        if (createResult.isFailure()) {
          return fail(`Failed to create key store: ${createResult.message}`);
        }
        keyStore = createResult.value;
      }
    }

    // Create library parameters
    const libraryParams = toLibraryParams(params);

    // Create runtime context (this creates the shared library)
    const runtimeResult = RuntimeContext.create({
      libraryParams,
      preWarm: params.preWarm
    });

    if (runtimeResult.isFailure()) {
      return fail(`Failed to create runtime context: ${runtimeResult.message}`);
    }

    // Create user library parameters
    const userLibraryParams = toUserLibraryParams(params);

    // Create user library (journals, future inventory)
    const userLibraryResult = UserLibrary.create(userLibraryParams);

    if (userLibraryResult.isFailure()) {
      return fail(`Failed to create user library: ${userLibraryResult.message}`);
    }

    const workspace = new Workspace(
      runtimeResult.value,
      userLibraryResult.value,
      keyStore,
      cryptoProvider,
      logger
    );

    logger.info(
      `Workspace created: ${workspace.state === 'no-keystore' ? 'no key store' : 'with key store (locked)'}`
    );

    return succeed(workspace);
  }

  // ============================================================================
  // Core Access (IWorkspace)
  // ============================================================================

  /**
   * {@inheritDoc IWorkspace.runtime}
   */
  public get runtime(): RuntimeContext {
    return this._runtime;
  }

  /**
   * {@inheritDoc IWorkspace.journals}
   */
  public get journals(): JournalLibrary {
    return this._userLibrary.journals;
  }

  /**
   * {@inheritDoc IWorkspace.keyStore}
   */
  public get keyStore(): KeyStore | undefined {
    return this._keyStore;
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
    if (!this._keyStore || !this._cryptoProvider) {
      return;
    }

    // Get the secret provider from the key store
    const providerResult = this._keyStore.getSecretProvider();
    if (providerResult.isFailure()) {
      this._logger.warn(`Could not get secret provider: ${providerResult.message}`);
      return;
    }

    const encryption: IEncryptionConfig = {
      cryptoProvider: this._cryptoProvider,
      secretProvider: providerResult.value
    };

    // Load protected collections from each sub-library
    const library = this._runtime.library;

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
    const journalsResult = await this._userLibrary.journals.loadProtectedCollectionAsync(encryption);
    if (journalsResult.isSuccess()) {
      this._logger.info(`Loaded ${journalsResult.value.length} protected journal collection(s)`);
    }

    // Clear runtime cache so new items are visible
    this._runtime.clearCache();
  }
}
