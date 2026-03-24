/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Browser platform initializer implementation.
 * Uses localStorage-backed FileTree for persistence.
 * @packageDocumentation
 */

import { fail, Logging, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import {
  CryptoUtils as BrowserCrypto,
  FileApiTreeAccessors,
  ILocalStorageTreeParams
} from '@fgv/ts-web-extras';
import { ensureWorkspaceDirectoriesInTree, LibraryData, Settings } from '@fgv/ts-chocolate';
import { loadKeystoreFromTree } from './keystoreStorage';

import type {
  IPlatformInitializer,
  IPlatformInitOptions,
  IPlatformInitResult,
  IResolvedExternalLibrary
} from '@fgv/ts-chocolate';

// ============================================================================
// Browser Platform Init Options
// ============================================================================

/**
 * Options for browser platform initialization.
 * Extends the base options with localStorage-specific configuration.
 * @public
 */
export interface IBrowserPlatformInitOptions extends Omit<IPlatformInitOptions, 'keyStorePath'> {
  /**
   * Prefix for localStorage keys.
   * All keys will be prefixed with this value followed by a colon.
   * @defaultValue 'chocolate-lab'
   */
  readonly storageKeyPrefix?: string;

  /**
   * Storage instance to use. Defaults to window.localStorage.
   * Can be overridden for testing with mock storage.
   */
  readonly storage?: Storage;

  /**
   * Whether to auto-sync changes to localStorage on every modification.
   * @defaultValue true
   */
  readonly autoSync?: boolean;

  /**
   * Optional cloud storage configuration override.
   * If omitted, bootstrap settings are used.
   */
  readonly cloudStorage?: Settings.ICloudStorageConfig;

  /**
   * Default cloud storage configuration used when no saved bootstrap settings exist.
   * Typically provided by a server config endpoint so container deployments can
   * auto-enable cloud storage for first-time users without affecting local dev.
   */
  readonly defaultCloudStorage?: Settings.ICloudStorageConfig;

  /**
   * Optional logger for cloud storage accessors.
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

// ============================================================================
// Default Storage Key Mapping
// ============================================================================

/**
 * Creates the default path-to-key mapping for localStorage.
 * Maps each data directory to a separate localStorage key.
 * @param prefix - The storage key prefix
 * @returns Record mapping directory paths to localStorage keys
 * @internal
 */
function createDefaultPathToKeyMap(prefix: string): Record<string, string> {
  return {
    [`/${LibraryData.LibraryPaths.ingredients}`]: `${prefix}:ingredients:v1`,
    [`/${LibraryData.LibraryPaths.fillings}`]: `${prefix}:fillings:v1`,
    [`/${LibraryData.LibraryPaths.confections}`]: `${prefix}:confections:v1`,
    [`/${LibraryData.LibraryPaths.decorations}`]: `${prefix}:decorations:v1`,
    [`/${LibraryData.LibraryPaths.molds}`]: `${prefix}:molds:v1`,
    [`/${LibraryData.LibraryPaths.procedures}`]: `${prefix}:procedures:v1`,
    [`/${LibraryData.LibraryPaths.tasks}`]: `${prefix}:tasks:v1`,
    [`/${LibraryData.LibraryPaths.journals}`]: `${prefix}:journals:v1`,
    [`/${LibraryData.LibraryPaths.sessions}`]: `${prefix}:sessions:v1`,
    [`/${LibraryData.LibraryPaths.moldInventory}`]: `${prefix}:mold-inventory:v1`,
    [`/${LibraryData.LibraryPaths.ingredientInventory}`]: `${prefix}:ingredient-inventory:v1`,
    [`/${LibraryData.LibraryPaths.locations}`]: `${prefix}:locations:v1`,
    [`/${LibraryData.LibraryPaths.settings}`]: `${prefix}:settings:v1`,
    ['/keystore']: `${prefix}:keystore:v1`
  };
}

// ============================================================================
// Browser Platform Initializer
// ============================================================================

/**
 * Platform initializer implementation for browser environments.
 * Uses localStorage-backed FileTree for persistence via LocalStorageTreeAccessors.
 * @public
 */
export class BrowserPlatformInitializer implements IPlatformInitializer {
  private static _instance: BrowserPlatformInitializer | undefined;

  /**
   * Gets the singleton instance.
   */
  public static get instance(): BrowserPlatformInitializer {
    if (!BrowserPlatformInitializer._instance) {
      BrowserPlatformInitializer._instance = new BrowserPlatformInitializer();
    }
    return BrowserPlatformInitializer._instance;
  }

  private constructor() {}

  /**
   * {@inheritDoc IPlatformInitializer.initialize}
   */
  public async initialize(options: IPlatformInitOptions): Promise<Result<IPlatformInitResult>> {
    const browserOptions = options as IBrowserPlatformInitOptions;
    const prefix = browserOptions.storageKeyPrefix ?? 'chocolate-lab';
    const autoSync = browserOptions.autoSync ?? true;
    const deviceId = options.deviceId ?? this._generateDeviceId(prefix, browserOptions.storage);

    const cryptoProviderResult = BrowserCrypto.createBrowserCryptoProvider().withErrorFormat(
      (msg) => `browser crypto provider: ${msg}`
    );
    if (cryptoProviderResult.isFailure()) {
      return fail(cryptoProviderResult.message);
    }

    const treeParams: ILocalStorageTreeParams = {
      pathToKeyMap: createDefaultPathToKeyMap(prefix),
      storage: browserOptions.storage,
      mutable: true,
      autoSync
    };

    const treeResult = FileApiTreeAccessors.createFromLocalStorage(treeParams).withErrorFormat(
      (msg) => `localStorage FileTree: ${msg}`
    );
    if (treeResult.isFailure()) {
      return fail(treeResult.message);
    }
    const tree = treeResult.value;

    const userLibraryTreeResult = tree.getDirectory('/').withErrorFormat((msg) => `root directory: ${msg}`);
    if (userLibraryTreeResult.isFailure()) {
      return fail(userLibraryTreeResult.message);
    }
    const userLibraryTree = userLibraryTreeResult.value;

    const dirsResult = ensureWorkspaceDirectoriesInTree(userLibraryTree);
    if (dirsResult.isFailure()) {
      return fail(`workspace directories: ${dirsResult.message}`);
    }

    // Stage 1a: Load bootstrap settings (needed to know where preferences and keystore live)
    const bootstrapResult = this._loadBootstrapSettings(tree).withErrorFormat((msg) => `settings: ${msg}`);
    if (bootstrapResult.isFailure()) {
      return fail(bootstrapResult.message);
    }
    const bootstrapSettings = bootstrapResult.value;

    // Stage 1b: Resolve cloud libraries (using bootstrap config or server-provided defaults)
    let cloudConfig =
      browserOptions.cloudStorage ?? bootstrapSettings?.cloudStorage ?? browserOptions.defaultCloudStorage;
    // If cloud storage is enabled but no explicit base URL, derive from proxy URL by loading
    // a minimal preferences pass from local storage first
    if (cloudConfig?.enabled && !cloudConfig.baseUrl?.trim()) {
      const localPrefs = this._loadPreferencesSettings(userLibraryTree).orDefault(undefined);
      const proxyUrl = localPrefs?.tools?.aiAssist?.proxyUrl;
      if (proxyUrl) {
        cloudConfig = { ...cloudConfig, baseUrl: `${proxyUrl}/api/storage` };
      }
    }
    const cloudLibrariesResult = await this._resolveCloudLibraries(
      cloudConfig,
      autoSync,
      browserOptions.logger
    );
    if (cloudLibrariesResult.isFailure()) {
      return fail(cloudLibrariesResult.message);
    }
    const cloudLibraries = cloudLibrariesResult.value;

    // Stage 1c: Determine preferences tree from bootstrap.preferencesLocation or cold-start defaults.
    // On cold start (no bootstrap), if server provided cloud defaults, infer preferences from
    // the first resolved cloud library — preferences will be created there on first save.
    let preferencesTree: FileTree.IFileTreeDirectoryItem | undefined;
    const preferencesLocation = bootstrapSettings?.preferencesLocation;
    if (preferencesLocation?.type === 'external') {
      const match = cloudLibraries.find((lib) => lib.name === preferencesLocation.rootName);
      preferencesTree = match?.fileTree;
    } else if (!bootstrapSettings && browserOptions.defaultCloudStorage && cloudLibraries.length > 0) {
      preferencesTree = cloudLibraries[0].fileTree;
    }

    // Stage 1d: Load preferences from the resolved tree (cloud or local)
    const preferencesResult = this._loadPreferencesSettings(
      preferencesTree ?? userLibraryTree
    ).withErrorFormat((msg) => `settings: ${msg}`);
    if (preferencesResult.isFailure()) {
      return fail(preferencesResult.message);
    }
    const resolvedSettings = Settings.resolvePreferencesSettings(
      preferencesResult.value ?? { schemaVersion: 1 as Settings.SettingsSchemaVersion },
      deviceId
    );

    // Determine which tree to load the keystore from based on keystoreLocation.
    // If the bootstrap says 'external', look for a matching cloud tree by name.
    const keystoreLocation = bootstrapSettings?.keystoreLocation;
    let keystoreTree: FileTree.IFileTreeDirectoryItem = userLibraryTree;
    if (keystoreLocation?.type === 'external') {
      const match = cloudLibraries.find(
        (lib: IResolvedExternalLibrary) => lib.name === keystoreLocation.rootName
      );
      if (match) {
        keystoreTree = match.fileTree;
      }
    }

    const keystoreResult = loadKeystoreFromTree(keystoreTree);
    if (keystoreResult.isFailure()) {
      return fail(`keystore: ${keystoreResult.message}`);
    }

    return succeed({
      cryptoProvider: cryptoProviderResult.value,
      userLibraryTree,
      externalLibraries: cloudLibraries,
      keyStoreFile: keystoreResult.value,
      bootstrapSettings,
      resolvedSettings,
      deviceId,
      preferencesTree
    });
  }

  /**
   * {@inheritDoc IPlatformInitializer.resolveExternalLibrary}
   */
  public resolveExternalLibrary(
    __ref: Settings.ExternalLibraryRef,
    __config: Settings.IExternalLibraryRefConfig
  ): Result<FileTree.IFileTreeDirectoryItem> {
    return fail('External library resolution is not supported in browser environments');
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Generates a device ID for browser environments.
   * Uses a persistent ID stored in localStorage, or creates a new one.
   * @param storage - Optional storage override
   * @internal
   */
  private _generateDeviceId(prefix: string, storage?: Storage): Settings.DeviceId {
    const storageKey = `${prefix}:device-id`;
    const resolvedStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

    if (resolvedStorage) {
      const existing = resolvedStorage.getItem(storageKey);
      if (existing) {
        const validated = Settings.Converters.deviceId.convert(existing);
        if (validated.isSuccess()) {
          return validated.value;
        }
        // Existing ID is invalid — fall through to generate a new one
      }

      const id = `browser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      resolvedStorage.setItem(storageKey, id);
      return Settings.Converters.deviceId.convert(id).orThrow();
    }

    // No storage available — generate a transient ID
    const id = `browser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return Settings.Converters.deviceId.convert(id).orThrow();
  }

  /**
   * Loads bootstrap settings from the FileTree.
   * Returns undefined (not failure) if the file doesn't exist.
   * @internal
   */
  private _loadBootstrapSettings(tree: FileTree.FileTree): Result<Settings.IBootstrapSettings | undefined> {
    const settingsPath = `/${LibraryData.LibraryPaths.settings}/${LibraryData.LibraryPaths.settingsBootstrap}`;

    const fileResult = tree.getFile(settingsPath);
    if (fileResult.isFailure()) {
      return succeed(undefined);
    }

    return fileResult.value
      .getContents()
      .onSuccess((json) =>
        Settings.Converters.bootstrapSettings.convert(json).withErrorFormat((e) => `bootstrap.json: ${e}`)
      );
  }

  /**
   * Loads preferences settings from a directory tree root.
   * Navigates data/settings/preferences.json using directory children.
   * Returns undefined (not failure) if the file or any parent directory doesn't exist.
   * Accepts either a local or cloud root directory.
   * @internal
   */
  private _loadPreferencesSettings(
    rootDir: FileTree.IFileTreeDirectoryItem
  ): Result<Settings.IPreferencesSettings | undefined> {
    const pathParts = [LibraryData.LibraryPaths.settings];
    const fileName = LibraryData.LibraryPaths.settingsPreferences;

    let dir: FileTree.IFileTreeDirectoryItem = rootDir;
    for (const part of pathParts) {
      const childrenResult = dir.getChildren();
      if (childrenResult.isFailure()) return succeed(undefined);
      const child = childrenResult.value.find((c) => c.name === part && c.type === 'directory');
      if (!child) return succeed(undefined);
      dir = child as FileTree.IFileTreeDirectoryItem;
    }

    const childrenResult = dir.getChildren();
    if (childrenResult.isFailure()) return succeed(undefined);
    const file = childrenResult.value.find((c) => c.name === fileName && c.type === 'file') as
      | FileTree.IFileTreeFileItem
      | undefined;
    if (!file) return succeed(undefined);

    return file
      .getContents()
      .onSuccess((json) =>
        Settings.Converters.preferencesSettings.convert(json).withErrorFormat((e) => `preferences.json: ${e}`)
      );
  }

  private async _resolveCloudLibraries(
    config: Settings.ICloudStorageConfig | undefined,
    autoSync: boolean,
    logger?: Logging.LogReporter<unknown>
  ): Promise<Result<ReadonlyArray<IResolvedExternalLibrary>>> {
    if (!config || config.enabled !== true) {
      return succeed([]);
    }

    const sourceName = config.sourceName ?? `cloud:${config.namespace ?? 'default'}`;
    const treeResult = await FileApiTreeAccessors.createFromHttp({
      baseUrl: config.baseUrl,
      namespace: config.namespace,
      userId: config.userId,
      autoSync,
      mutable: true,
      logger
    });
    if (treeResult.isFailure()) {
      return fail(`cloud storage '${sourceName}': ${treeResult.message}`);
    }

    const rootResult = treeResult.value.getDirectory('/');
    if (rootResult.isFailure()) {
      return fail(`cloud storage '${sourceName}' root: ${rootResult.message}`);
    }

    const load = this._toCloudLoadSpec(config);
    const originalRef = Settings.Converters.externalLibraryRef.convert(config.baseUrl);
    if (originalRef.isFailure()) {
      return fail(`cloud storage '${sourceName}' ref: ${originalRef.message}`);
    }

    const accessors = treeResult.value.hal;
    const persistentTree =
      'syncToDisk' in accessors && 'isDirty' in accessors
        ? {
            tree: treeResult.value,
            accessors: accessors as FileTree.IPersistentFileTreeAccessors
          }
        : undefined;

    return succeed([
      {
        name: sourceName,
        originalRef: originalRef.value,
        fileTree: rootResult.value,
        load,
        mutable: true,
        persistentTree,
        skipMissingDirectories: true
      }
    ]);
  }

  private _toCloudLoadSpec(
    config: Settings.ICloudStorageConfig
  ): boolean | Partial<Record<LibraryData.SubLibraryId | 'default', boolean>> {
    const includeLibrary = config.library ?? true;
    const includeUserData = config.userData ?? true;

    if (includeLibrary && includeUserData) {
      return true;
    }

    if (!includeLibrary && !includeUserData) {
      return false;
    }

    const spec: Partial<Record<LibraryData.SubLibraryId | 'default', boolean>> = { default: false };

    if (includeLibrary) {
      spec.ingredients = true;
      spec.fillings = true;
      spec.confections = true;
      spec.decorations = true;
      spec.molds = true;
      spec.procedures = true;
      spec.tasks = true;
    }

    if (includeUserData) {
      spec.sessions = true;
      spec.journals = true;
      spec.moldInventory = true;
      spec.ingredientInventory = true;
      spec.locations = true;
    }

    return spec;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Creates a browser platform initializer instance.
 * @returns The singleton BrowserPlatformInitializer instance
 * @public
 */
export function createBrowserPlatformInitializer(): IPlatformInitializer {
  return BrowserPlatformInitializer.instance;
}

/**
 * Convenience function to perform browser platform initialization.
 * @param options - Platform initialization options
 * @returns Success with init result, or Failure
 * @public
 */
export async function initializeBrowserPlatform(
  options: IBrowserPlatformInitOptions
): Promise<Result<IPlatformInitResult>> {
  return BrowserPlatformInitializer.instance.initialize(options);
}
