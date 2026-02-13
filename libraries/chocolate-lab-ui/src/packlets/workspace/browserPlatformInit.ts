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

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { CryptoUtils } from '@fgv/ts-extras';
import {
  CryptoUtils as BrowserCrypto,
  FileApiTreeAccessors,
  ILocalStorageTreeParams
} from '@fgv/ts-web-extras';
import { LibraryData, Settings } from '@fgv/ts-chocolate';

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
    [`/${LibraryData.LibraryPaths.molds}`]: `${prefix}:molds:v1`,
    [`/${LibraryData.LibraryPaths.procedures}`]: `${prefix}:procedures:v1`,
    [`/${LibraryData.LibraryPaths.tasks}`]: `${prefix}:tasks:v1`,
    [`/${LibraryData.LibraryPaths.journals}`]: `${prefix}:journals:v1`,
    [`/${LibraryData.LibraryPaths.sessions}`]: `${prefix}:sessions:v1`,
    [`/${LibraryData.LibraryPaths.moldInventory}`]: `${prefix}:mold-inventory:v1`,
    [`/${LibraryData.LibraryPaths.ingredientInventory}`]: `${prefix}:ingredient-inventory:v1`,
    [`/${LibraryData.LibraryPaths.settings}`]: `${prefix}:settings:v1`
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
    const deviceId = options.deviceId ?? this._generateDeviceId(browserOptions.storage);

    return BrowserCrypto.createBrowserCryptoProvider()
      .withErrorFormat((msg) => `browser crypto provider: ${msg}`)
      .onSuccess((cryptoProvider) => {
        // Create localStorage-backed FileTree
        const treeParams: ILocalStorageTreeParams = {
          pathToKeyMap: createDefaultPathToKeyMap(prefix),
          storage: browserOptions.storage,
          mutable: true,
          autoSync
        };

        return FileApiTreeAccessors.createFromLocalStorage(treeParams)
          .withErrorFormat((msg) => `localStorage FileTree: ${msg}`)
          .onSuccess((tree) => {
            return tree
              .getDirectory('/')
              .withErrorFormat((msg) => `root directory: ${msg}`)
              .onSuccess((userLibraryTree) => {
                return this._loadSettings(tree, deviceId, browserOptions.deviceName)
                  .withErrorFormat((msg) => `settings: ${msg}`)
                  .onSuccess(({ common, device }) => {
                    const keyStoreFile = this._loadKeyStoreFromStorage(
                      browserOptions.storage ??
                        (typeof window !== 'undefined' ? window.localStorage : undefined),
                      `${prefix}:keystore:v1`
                    );

                    return succeed({
                      cryptoProvider,
                      userLibraryTree,
                      externalLibraries: [] as IResolvedExternalLibrary[],
                      keyStoreFile: keyStoreFile.isSuccess() ? keyStoreFile.value : undefined,
                      commonSettings: common,
                      deviceSettings: device,
                      resolvedSettings: Settings.resolveSettings(common, device),
                      deviceId
                    });
                  });
              });
          });
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
  private _generateDeviceId(storage?: Storage): Settings.DeviceId {
    const storageKey = 'chocolate-lab:device-id';
    const resolvedStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

    if (resolvedStorage) {
      const existing = resolvedStorage.getItem(storageKey);
      if (existing) {
        return existing as unknown as Settings.DeviceId;
      }

      const id = `browser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      resolvedStorage.setItem(storageKey, id);
      return id as unknown as Settings.DeviceId;
    }

    // No storage available — generate a transient ID
    return `browser-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}` as unknown as Settings.DeviceId;
  }

  /**
   * Loads settings from the FileTree.
   * @param tree - The FileTree instance (for path-based file lookup)
   * @param deviceId - Device ID for device settings
   * @param deviceName - Optional device name for new device settings
   * @internal
   */
  private _loadSettings(
    tree: FileTree.FileTree,
    deviceId: Settings.DeviceId,
    deviceName?: string
  ): Result<{ common: Settings.ICommonSettings; device: Settings.IDeviceSettings }> {
    return this._loadCommonSettings(tree).onSuccess((common) =>
      this._loadDeviceSettings(tree, deviceId, deviceName).onSuccess((device) => succeed({ common, device }))
    );
  }

  /**
   * Loads common settings from the FileTree.
   * Falls back to defaults if the settings file doesn't exist.
   * @internal
   */
  private _loadCommonSettings(tree: FileTree.FileTree): Result<Settings.ICommonSettings> {
    const settingsPath = `/${LibraryData.LibraryPaths.settings}/${LibraryData.LibraryPaths.settingsCommon}`;

    const fileResult = tree.getFile(settingsPath);
    if (fileResult.isFailure()) {
      return succeed(Settings.createDefaultCommonSettings());
    }

    return fileResult.value
      .getContents()
      .onSuccess((json) =>
        Settings.Converters.commonSettings.convert(json).withErrorFormat((e) => `common.json: ${e}`)
      );
  }

  /**
   * Loads device settings from the FileTree.
   * Falls back to defaults if the device settings file doesn't exist.
   * @internal
   */
  private _loadDeviceSettings(
    tree: FileTree.FileTree,
    deviceId: Settings.DeviceId,
    deviceName?: string
  ): Result<Settings.IDeviceSettings> {
    const deviceFileName = `${LibraryData.LibraryPaths.settingsDevicePrefix}${deviceId}.json`;
    const settingsPath = `/${LibraryData.LibraryPaths.settings}/${deviceFileName}`;

    const fileResult = tree.getFile(settingsPath);
    if (fileResult.isFailure()) {
      return succeed(Settings.createDefaultDeviceSettings(deviceId, deviceName));
    }

    return fileResult.value
      .getContents()
      .onSuccess((json) =>
        Settings.Converters.deviceSettings.convert(json).withErrorFormat((e) => `${deviceFileName}: ${e}`)
      );
  }

  /**
   * Loads key store file from localStorage.
   * @internal
   */
  private _loadKeyStoreFromStorage(
    storage: Storage | undefined,
    key: string
  ): Result<CryptoUtils.KeyStore.IKeyStoreFile> {
    if (!storage) {
      return fail('localStorage not available');
    }

    const raw = storage.getItem(key);
    if (!raw) {
      return fail('Key store not found in localStorage');
    }

    return captureResult(() => JSON.parse(raw) as unknown)
      .withErrorFormat((msg) => `keystore parse: ${msg}`)
      .onSuccess((json) =>
        CryptoUtils.KeyStore.Converters.keystoreFile
          .convert(json)
          .withErrorFormat((msg) => `keystore: ${msg}`)
      );
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
