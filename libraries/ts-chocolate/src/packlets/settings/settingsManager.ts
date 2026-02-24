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
 * Settings manager for loading, updating, and persisting workspace settings.
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';
import { FileTree, JsonValue } from '@fgv/ts-json-base';

import * as Converters from './converters';
import {
  createDefaultBootstrapSettings,
  createDefaultPreferencesSettings,
  DeviceId,
  IBootstrapSettings,
  IDefaultCollectionTargets,
  IDefaultStorageTargets,
  IPreferencesSettings,
  IResolvedSettings,
  IToolSettings,
  resolvePreferencesSettings,
  SETTINGS_SCHEMA_VERSION
} from './model';

// ============================================================================
// Constants
// ============================================================================

/**
 * Path to the settings directory within the user library.
 * @public
 */
export const SETTINGS_DIR_PATH: string = 'data/settings';

/**
 * Filename for bootstrap settings.
 * @public
 */
export const BOOTSTRAP_SETTINGS_FILENAME: string = 'bootstrap.json';

/**
 * Filename for preferences settings.
 * @public
 */
export const PREFERENCES_SETTINGS_FILENAME: string = 'preferences.json';

// ============================================================================
// Settings Manager Interface
// ============================================================================

/**
 * Interface for managing workspace settings.
 * @public
 */
export interface ISettingsManager {
  /**
   * The current device identifier.
   */
  readonly deviceId: DeviceId;

  /**
   * Gets the resolved settings.
   * @returns The resolved settings
   */
  getResolvedSettings(): IResolvedSettings;

  /**
   * Gets the bootstrap settings (preload configuration).
   * @returns The bootstrap settings
   */
  getBootstrapSettings(): IBootstrapSettings;

  /**
   * Gets the preferences settings (runtime configuration).
   * @returns The preferences settings
   */
  getPreferencesSettings(): IPreferencesSettings;

  /**
   * Updates bootstrap settings with partial values.
   * @param updates - Partial bootstrap settings to merge
   * @returns Success with updated bootstrap settings, or Failure
   */
  updateBootstrapSettings(
    updates: Partial<Omit<IBootstrapSettings, 'schemaVersion'>>
  ): Result<IBootstrapSettings>;

  /**
   * Updates preferences settings with partial values.
   * @param updates - Partial preferences settings to merge
   * @returns Success with updated preferences settings, or Failure
   */
  updatePreferencesSettings(
    updates: Partial<Omit<IPreferencesSettings, 'schemaVersion'>>
  ): Result<IPreferencesSettings>;

  /**
   * Updates the default collection targets (convenience method).
   * @param targets - Partial default targets to merge
   * @returns Success with updated targets, or Failure
   */
  updateDefaultTargets(targets: Partial<IDefaultCollectionTargets>): Result<IDefaultCollectionTargets>;

  /**
   * Updates the default storage targets (convenience method).
   * @param targets - Partial default storage targets to merge
   * @returns Success with updated targets, or Failure
   */
  updateDefaultStorageTargets(targets: Partial<IDefaultStorageTargets>): Result<IDefaultStorageTargets>;

  /**
   * Whether there are unsaved changes.
   */
  readonly isDirty: boolean;

  /**
   * Saves all pending changes to the file tree.
   * @returns Promise resolving to Success, or Failure with error message
   */
  save(): Promise<Result<boolean>>;
}

// ============================================================================
// Settings Manager Creation Parameters
// ============================================================================

/**
 * Parameters for creating a SettingsManager.
 * @public
 */
export interface ISettingsManagerBootstrapParams {
  /**
   * The file tree containing settings files.
   * Must be the user library root (settings are in data/settings/).
   */
  readonly fileTree: FileTree.IFileTreeDirectoryItem;

  /**
   * The device identifier for this instance.
   */
  readonly deviceId: DeviceId;
}

// ============================================================================
// Settings Manager Implementation
// ============================================================================

/**
 * Manages workspace settings - loading, updating, and persisting.
 * @public
 */
export class SettingsManager implements ISettingsManager {
  private _bootstrap: IBootstrapSettings;
  private _preferences: IPreferencesSettings;
  private _bootstrapDirty: boolean = false;
  private _preferencesDirty: boolean = false;
  private readonly _deviceId: DeviceId;
  private readonly _fileTree: FileTree.IFileTreeDirectoryItem;

  /**
   * Creates a SettingsManager. Use SettingsManager.createFromBootstrap() instead.
   * @internal
   */
  private constructor(
    fileTree: FileTree.IFileTreeDirectoryItem,
    deviceId: DeviceId,
    bootstrap: IBootstrapSettings,
    preferences: IPreferencesSettings
  ) {
    this._fileTree = fileTree;
    this._deviceId = deviceId;
    this._bootstrap = bootstrap;
    this._preferences = preferences;
  }

  /**
   * Creates a new SettingsManager from bootstrap + preferences files.
   * Creates default files if they don't exist.
   * @param params - Creation parameters
   * @returns Success with SettingsManager, or Failure
   * @public
   */
  public static createFromBootstrap(params: ISettingsManagerBootstrapParams): Result<SettingsManager> {
    const { fileTree, deviceId } = params;

    // Load or create bootstrap settings
    const bootstrapResult = SettingsManager._loadOrCreate(
      fileTree,
      `${SETTINGS_DIR_PATH}/${BOOTSTRAP_SETTINGS_FILENAME}`,
      Converters.bootstrapSettings,
      createDefaultBootstrapSettings
    );
    if (bootstrapResult.isFailure()) {
      return fail(bootstrapResult.message);
    }
    const { settings: bootstrap, isNew: bootstrapIsNew } = bootstrapResult.value;

    // Load or create preferences settings
    const preferencesResult = SettingsManager._loadOrCreate(
      fileTree,
      `${SETTINGS_DIR_PATH}/${PREFERENCES_SETTINGS_FILENAME}`,
      Converters.preferencesSettings,
      createDefaultPreferencesSettings
    );
    if (preferencesResult.isFailure()) {
      return fail(preferencesResult.message);
    }
    const { settings: preferences, isNew: preferencesIsNew } = preferencesResult.value;

    const manager = new SettingsManager(fileTree, deviceId, bootstrap, preferences);
    manager._bootstrapDirty = bootstrapIsNew;
    manager._preferencesDirty = preferencesIsNew;

    return succeed(manager);
  }

  /**
   * Generic load-or-create helper for any settings file.
   * @internal
   */
  private static _loadOrCreate<T>(
    fileTree: FileTree.IFileTreeDirectoryItem,
    settingsPath: string,
    converter: { convert: (from: unknown) => Result<T> },
    createDefault: () => T
  ): Result<{ settings: T; isNew: boolean }> {
    return SettingsManager._loadSettingsFile(fileTree, settingsPath, converter).onSuccess(
      (loaded): Result<{ settings: T; isNew: boolean }> => {
        if (loaded !== undefined) {
          return succeed({ settings: loaded, isNew: false });
        }
        return succeed({ settings: createDefault(), isNew: true });
      }
    );
  }

  /**
   * Loads a settings file from the file tree.
   * @returns Success with settings (or undefined if file not found), or Failure on parse error
   * @internal
   */
  private static _loadSettingsFile<T>(
    fileTree: FileTree.IFileTreeDirectoryItem,
    path: string,
    converter: { convert: (from: unknown) => Result<T> }
  ): Result<T | undefined> {
    // Navigate to the settings directory
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    const dirResult = SettingsManager._navigateToDirectory(fileTree, dirPath);
    if (dirResult.isFailure()) {
      // Directory doesn't exist - return undefined to create defaults
      return succeed(undefined);
    }

    const childrenResult = dirResult.value.getChildren();
    /* c8 ignore next 3 - defensive: getChildren failure on valid directory */
    if (childrenResult.isFailure()) {
      return fail(childrenResult.message);
    }

    const file = childrenResult.value.find((c) => c.name === fileName && c.type === 'file') as
      | FileTree.IFileTreeFileItem
      | undefined;
    if (!file) {
      // File doesn't exist - return undefined to create defaults
      return succeed(undefined);
    }

    return file.getContents().onSuccess((json) => {
      return converter.convert(json).withErrorFormat((e) => `${path}: ${e}`);
    });
  }

  /**
   * Navigates to a subdirectory within a FileTree by path.
   * @internal
   */
  private static _navigateToDirectory(
    tree: FileTree.IFileTreeDirectoryItem,
    path: string
  ): Result<FileTree.IFileTreeDirectoryItem> {
    const parts = path.split('/').filter((p) => p.length > 0);
    /* c8 ignore next 3 - edge case: empty path returns root (SETTINGS_DIR_PATH is hardcoded) */
    if (parts.length === 0) {
      return succeed(tree);
    }

    let current: FileTree.IFileTreeDirectoryItem = tree;

    for (const part of parts) {
      const childrenResult = current.getChildren();
      /* c8 ignore next 3 - defensive: getChildren failure during navigation */
      if (childrenResult.isFailure()) {
        return fail(childrenResult.message);
      }

      const child = childrenResult.value.find((c) => c.name === part);
      if (child === undefined) {
        return fail(`${path}: Directory not found at '${part}'.`);
      }

      /* c8 ignore next 3 - defensive: non-directory found during navigation */
      if (child.type !== 'directory') {
        return fail(`${path}: '${part}' is not a directory.`);
      }

      current = child;
    }

    return succeed(current);
  }

  // ============================================================================
  // ISettingsManager Implementation
  // ============================================================================

  /**
   * {@inheritDoc ISettingsManager.deviceId}
   */
  public get deviceId(): DeviceId {
    return this._deviceId;
  }

  /**
   * {@inheritDoc ISettingsManager.getResolvedSettings}
   */
  public getResolvedSettings(): IResolvedSettings {
    return resolvePreferencesSettings(this._preferences, this._deviceId);
  }

  /**
   * {@inheritDoc ISettingsManager.getBootstrapSettings}
   */
  public getBootstrapSettings(): IBootstrapSettings {
    return this._bootstrap;
  }

  /**
   * {@inheritDoc ISettingsManager.getPreferencesSettings}
   */
  public getPreferencesSettings(): IPreferencesSettings {
    return this._preferences;
  }

  /**
   * {@inheritDoc ISettingsManager.updateBootstrapSettings}
   */
  public updateBootstrapSettings(
    updates: Partial<Omit<IBootstrapSettings, 'schemaVersion'>>
  ): Result<IBootstrapSettings> {
    const updated: IBootstrapSettings = {
      ...this._bootstrap,
      ...updates,
      schemaVersion: SETTINGS_SCHEMA_VERSION
    };

    return Converters.bootstrapSettings.convert(updated).onSuccess((validated) => {
      this._bootstrap = validated;
      this._bootstrapDirty = true;
      return succeed(validated);
    });
  }

  /**
   * {@inheritDoc ISettingsManager.updatePreferencesSettings}
   */
  public updatePreferencesSettings(
    updates: Partial<Omit<IPreferencesSettings, 'schemaVersion'>>
  ): Result<IPreferencesSettings> {
    const updated: IPreferencesSettings = {
      ...this._preferences,
      ...updates,
      schemaVersion: SETTINGS_SCHEMA_VERSION
    };

    return Converters.preferencesSettings.convert(updated).onSuccess((validated) => {
      this._preferences = validated;
      this._preferencesDirty = true;
      return succeed(validated);
    });
  }

  /**
   * {@inheritDoc ISettingsManager.updateDefaultTargets}
   */
  public updateDefaultTargets(
    targets: Partial<IDefaultCollectionTargets>
  ): Result<IDefaultCollectionTargets> {
    const merged: IDefaultCollectionTargets = {
      ...this._preferences.defaultTargets,
      ...targets
    };
    return this.updatePreferencesSettings({ defaultTargets: merged }).onSuccess((updated) => {
      /* c8 ignore next - branch: defensive fallback when updated settings lack field */
      return succeed(updated.defaultTargets ?? {});
    });
  }

  /**
   * {@inheritDoc ISettingsManager.updateDefaultStorageTargets}
   */
  public updateDefaultStorageTargets(
    targets: Partial<IDefaultStorageTargets>
  ): Result<IDefaultStorageTargets> {
    const merged: IDefaultStorageTargets = {
      ...this._preferences.defaultStorageTargets,
      ...targets
    };
    return this.updatePreferencesSettings({ defaultStorageTargets: merged }).onSuccess((updated) => {
      /* c8 ignore next - branch: defensive fallback when updated settings lack field */
      return succeed(updated.defaultStorageTargets ?? {});
    });
  }

  /**
   * {@inheritDoc ISettingsManager.isDirty}
   */
  public get isDirty(): boolean {
    return this._bootstrapDirty || this._preferencesDirty;
  }

  /**
   * {@inheritDoc ISettingsManager.save}
   */
  public async save(): Promise<Result<boolean>> {
    if (!this.isDirty) {
      return succeed(false);
    }

    // Save bootstrap settings if dirty
    if (this._bootstrapDirty) {
      const bootstrapPath = `${SETTINGS_DIR_PATH}/${BOOTSTRAP_SETTINGS_FILENAME}`;
      const saveResult = await this._saveSettingsFile(bootstrapPath, this._bootstrap);
      if (saveResult.isFailure()) {
        return fail(saveResult.message);
      }
      this._bootstrapDirty = false;
    }

    // Save preferences settings if dirty
    if (this._preferencesDirty) {
      const preferencesPath = `${SETTINGS_DIR_PATH}/${PREFERENCES_SETTINGS_FILENAME}`;
      const saveResult = await this._saveSettingsFile(preferencesPath, this._preferences);
      if (saveResult.isFailure()) {
        return fail(saveResult.message);
      }
      this._preferencesDirty = false;
    }

    return succeed(true);
  }

  /**
   * Saves a settings object to a file in the file tree.
   * @internal
   */
  private async _saveSettingsFile(
    path: string,
    settings: IBootstrapSettings | IPreferencesSettings
  ): Promise<Result<boolean>> {
    // Navigate to or create the settings directory
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    const dirResult = this._ensureDirectory(dirPath);
    if (dirResult.isFailure()) {
      return fail(dirResult.message);
    }

    const dir = dirResult.value;
    const childrenResult = dir.getChildren();
    /* c8 ignore next 3 - defensive: getChildren failure on valid directory */
    if (childrenResult.isFailure()) {
      return fail(childrenResult.message);
    }

    const existingFile = childrenResult.value.find((c) => c.name === fileName && c.type === 'file') as
      | FileTree.IFileTreeFileItem
      | undefined;

    if (existingFile) {
      // File exists - use setContents
      const setResult = existingFile.setContents(settings as unknown as JsonValue);
      if (setResult.isFailure()) {
        return fail(`Failed to save ${path}: ${setResult.message}`);
      }
      return succeed(true);
    }

    // File doesn't exist - we need to create it
    // Check if the directory supports mutable accessors for creating new files
    return this._createNewSettingsFile(dir, fileName, settings);
  }

  /**
   * Ensures a directory exists, creating it if necessary.
   * @internal
   */
  private _ensureDirectory(path: string): Result<FileTree.IFileTreeDirectoryItem> {
    // Try to navigate to the directory
    const navResult = SettingsManager._navigateToDirectory(this._fileTree, path);
    if (navResult.isSuccess()) {
      return navResult;
    }

    // Directory doesn't exist - we can't create directories through the FileTree API
    // The platform initializer should ensure the settings directory exists
    return fail(
      `Settings directory does not exist: ${path}. Platform initializer should create this directory.`
    );
  }

  /**
   * Creates a new settings file in the directory.
   * @internal
   */
  private _createNewSettingsFile(
    dir: FileTree.IFileTreeDirectoryItem,
    fileName: string,
    settings: IBootstrapSettings | IPreferencesSettings
  ): Result<boolean> {
    /* c8 ignore next 3 - defensive: all current implementations define createChildFile */
    if (dir.createChildFile === undefined) {
      return fail(`Cannot create new settings file ${fileName}: file creation not supported`);
    }
    const content = JSON.stringify(settings, null, 2);
    return dir
      .createChildFile(fileName, content)
      .withErrorFormat((msg) => `Cannot create new settings file ${fileName}: ${msg}`)
      .onSuccess(() => succeed(true));
  }

  // ============================================================================
  // Additional Methods
  // ============================================================================

  /**
   * Updates tool settings.
   * @param tools - Partial tool settings to merge
   * @returns Success with updated tool settings, or Failure
   * @public
   */
  public updateToolSettings(tools: Partial<IToolSettings>): Result<IToolSettings> {
    const merged: IToolSettings = {
      ...this._preferences.tools,
      scaling: {
        ...this._preferences.tools?.scaling,
        ...tools.scaling
      },
      workflow: {
        ...this._preferences.tools?.workflow,
        ...tools.workflow
      }
    };
    return this.updatePreferencesSettings({ tools: merged }).onSuccess((updated) => {
      /* c8 ignore next - branch: defensive fallback when updated settings lack field */
      return succeed(updated.tools ?? {});
    });
  }
}
