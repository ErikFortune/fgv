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
  createDefaultCommonSettings,
  createDefaultDeviceSettings,
  DeviceId,
  ICommonSettings,
  IDefaultCollectionTargets,
  IDeviceSettings,
  IResolvedSettings,
  IToolSettings,
  resolveSettings,
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
 * Filename for common settings.
 * @public
 */
export const COMMON_SETTINGS_FILENAME: string = 'common.json';

/**
 * Filename prefix for device settings.
 * @public
 */
export const DEVICE_SETTINGS_PREFIX: string = 'device-';

/**
 * Filename suffix for device settings.
 * @public
 */
export const DEVICE_SETTINGS_SUFFIX: string = '.json';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates the filename for device-specific settings.
 * @param deviceId - The device identifier
 * @returns The device settings filename
 * @public
 */
export function getDeviceSettingsFilename(deviceId: DeviceId): string {
  return `${DEVICE_SETTINGS_PREFIX}${deviceId}${DEVICE_SETTINGS_SUFFIX}`;
}

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
   * Gets the resolved settings (common merged with device overrides).
   * @returns The resolved settings
   */
  getResolvedSettings(): IResolvedSettings;

  /**
   * Gets the common settings shared across all devices.
   * @returns The common settings
   */
  getCommonSettings(): ICommonSettings;

  /**
   * Gets the device-specific settings.
   * @returns The device settings
   */
  getDeviceSettings(): IDeviceSettings;

  /**
   * Updates common settings with partial values.
   * @param updates - Partial common settings to merge
   * @returns Success with updated common settings, or Failure
   */
  updateCommonSettings(updates: Partial<Omit<ICommonSettings, 'schemaVersion'>>): Result<ICommonSettings>;

  /**
   * Updates device-specific settings with partial values.
   * @param updates - Partial device settings to merge
   * @returns Success with updated device settings, or Failure
   */
  updateDeviceSettings(
    updates: Partial<Omit<IDeviceSettings, 'schemaVersion' | 'deviceId'>>
  ): Result<IDeviceSettings>;

  /**
   * Updates the default collection targets (convenience method).
   * @param targets - Partial default targets to merge
   * @returns Success with updated targets, or Failure
   */
  updateDefaultTargets(targets: Partial<IDefaultCollectionTargets>): Result<IDefaultCollectionTargets>;

  /**
   * Updates the last active session ID for this device (convenience method).
   * @param sessionId - The session ID, or undefined to clear
   * @returns Success with the updated session ID, or Failure
   */
  updateLastActiveSessionId(sessionId: string | undefined): Result<string | undefined>;

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
export interface ISettingsManagerParams {
  /**
   * The file tree containing settings files.
   * Must be the user library root (settings are in data/settings/).
   */
  readonly fileTree: FileTree.IFileTreeDirectoryItem;

  /**
   * The device identifier for this instance.
   */
  readonly deviceId: DeviceId;

  /**
   * Optional device name for new device settings.
   */
  readonly deviceName?: string;
}

// ============================================================================
// Settings Manager Implementation
// ============================================================================

/**
 * Manages workspace settings - loading, updating, and persisting.
 * @public
 */
export class SettingsManager implements ISettingsManager {
  private _common: ICommonSettings;
  private _device: IDeviceSettings;
  private _commonDirty: boolean = false;
  private _deviceDirty: boolean = false;
  private readonly _fileTree: FileTree.IFileTreeDirectoryItem;

  /**
   * Creates a SettingsManager. Use SettingsManager.create() instead.
   * @internal
   */
  private constructor(
    fileTree: FileTree.IFileTreeDirectoryItem,
    common: ICommonSettings,
    device: IDeviceSettings
  ) {
    this._fileTree = fileTree;
    this._common = common;
    this._device = device;
  }

  /**
   * Creates a new SettingsManager, loading settings from the file tree.
   * Creates default settings files if they don't exist.
   * @param params - Creation parameters
   * @returns Success with SettingsManager, or Failure
   * @public
   */
  public static create(params: ISettingsManagerParams): Result<SettingsManager> {
    const { fileTree, deviceId, deviceName } = params;

    // Load or create common settings
    const commonResult = SettingsManager._loadOrCreateCommon(fileTree);
    if (commonResult.isFailure()) {
      return fail(commonResult.message);
    }
    const { settings: common, isNew: commonIsNew } = commonResult.value;

    // Load or create device settings
    const deviceResult = SettingsManager._loadOrCreateDevice(fileTree, deviceId, deviceName);
    if (deviceResult.isFailure()) {
      return fail(deviceResult.message);
    }
    const { settings: device, isNew: deviceIsNew } = deviceResult.value;

    const manager = new SettingsManager(fileTree, common, device);

    // Mark as dirty if we created new settings (need to save them)
    manager._commonDirty = commonIsNew;
    manager._deviceDirty = deviceIsNew;

    return succeed(manager);
  }

  /**
   * Loads common settings or creates defaults if not found.
   * @internal
   */
  private static _loadOrCreateCommon(
    fileTree: FileTree.IFileTreeDirectoryItem
  ): Result<{ settings: ICommonSettings; isNew: boolean }> {
    const settingsPath = `${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`;

    return SettingsManager._loadSettingsFile(fileTree, settingsPath, Converters.commonSettings).onSuccess(
      (loaded): Result<{ settings: ICommonSettings; isNew: boolean }> => {
        if (loaded !== undefined) {
          return succeed({ settings: loaded, isNew: false });
        }
        return succeed({ settings: createDefaultCommonSettings(), isNew: true });
      }
    );
  }

  /**
   * Loads device settings or creates defaults if not found.
   * @internal
   */
  private static _loadOrCreateDevice(
    fileTree: FileTree.IFileTreeDirectoryItem,
    deviceId: DeviceId,
    deviceName?: string
  ): Result<{ settings: IDeviceSettings; isNew: boolean }> {
    const settingsPath = `${SETTINGS_DIR_PATH}/${getDeviceSettingsFilename(deviceId)}`;

    return SettingsManager._loadSettingsFile(fileTree, settingsPath, Converters.deviceSettings).onSuccess(
      (loaded): Result<{ settings: IDeviceSettings; isNew: boolean }> => {
        if (loaded !== undefined) {
          return succeed({ settings: loaded, isNew: false });
        }
        return succeed({ settings: createDefaultDeviceSettings(deviceId, deviceName), isNew: true });
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
    return this._device.deviceId;
  }

  /**
   * {@inheritDoc ISettingsManager.getResolvedSettings}
   */
  public getResolvedSettings(): IResolvedSettings {
    return resolveSettings(this._common, this._device);
  }

  /**
   * {@inheritDoc ISettingsManager.getCommonSettings}
   */
  public getCommonSettings(): ICommonSettings {
    return this._common;
  }

  /**
   * {@inheritDoc ISettingsManager.getDeviceSettings}
   */
  public getDeviceSettings(): IDeviceSettings {
    return this._device;
  }

  /**
   * {@inheritDoc ISettingsManager.updateCommonSettings}
   */
  public updateCommonSettings(
    updates: Partial<Omit<ICommonSettings, 'schemaVersion'>>
  ): Result<ICommonSettings> {
    const updated: ICommonSettings = {
      ...this._common,
      ...updates,
      schemaVersion: SETTINGS_SCHEMA_VERSION
    };

    // Validate the updated settings
    return Converters.commonSettings.convert(updated).onSuccess((validated) => {
      this._common = validated;
      this._commonDirty = true;
      return succeed(validated);
    });
  }

  /**
   * {@inheritDoc ISettingsManager.updateDeviceSettings}
   */
  public updateDeviceSettings(
    updates: Partial<Omit<IDeviceSettings, 'schemaVersion' | 'deviceId'>>
  ): Result<IDeviceSettings> {
    const updated: IDeviceSettings = {
      ...this._device,
      ...updates,
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      deviceId: this._device.deviceId
    };

    // Validate the updated settings
    return Converters.deviceSettings.convert(updated).onSuccess((validated) => {
      this._device = validated;
      this._deviceDirty = true;
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
      ...this._common.defaultTargets,
      ...targets
    };

    return this.updateCommonSettings({ defaultTargets: merged }).onSuccess((updated) => {
      /* c8 ignore next - branch: defensive fallback when updated settings lack field */
      return succeed(updated.defaultTargets ?? {});
    });
  }

  /**
   * {@inheritDoc ISettingsManager.updateLastActiveSessionId}
   */
  public updateLastActiveSessionId(sessionId: string | undefined): Result<string | undefined> {
    return this.updateDeviceSettings({ lastActiveSessionId: sessionId }).onSuccess((updated) => {
      return succeed(updated.lastActiveSessionId);
    });
  }

  /**
   * {@inheritDoc ISettingsManager.isDirty}
   */
  public get isDirty(): boolean {
    return this._commonDirty || this._deviceDirty;
  }

  /**
   * {@inheritDoc ISettingsManager.save}
   */
  public async save(): Promise<Result<boolean>> {
    if (!this.isDirty) {
      return succeed(false);
    }

    // Save common settings if dirty
    if (this._commonDirty) {
      const commonPath = `${SETTINGS_DIR_PATH}/${COMMON_SETTINGS_FILENAME}`;
      const saveResult = await this._saveSettingsFile(commonPath, this._common);
      if (saveResult.isFailure()) {
        return fail(saveResult.message);
      }
      this._commonDirty = false;
    }

    // Save device settings if dirty
    if (this._deviceDirty) {
      const devicePath = `${SETTINGS_DIR_PATH}/${getDeviceSettingsFilename(this._device.deviceId)}`;
      const saveResult = await this._saveSettingsFile(devicePath, this._device);
      if (saveResult.isFailure()) {
        return fail(saveResult.message);
      }
      this._deviceDirty = false;
    }

    return succeed(true);
  }

  /**
   * Saves a settings object to a file in the file tree.
   * @internal
   */
  private async _saveSettingsFile(
    path: string,
    settings: ICommonSettings | IDeviceSettings
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
    settings: ICommonSettings | IDeviceSettings
  ): Result<boolean> {
    if (dir.createChildFile === undefined) {
      return fail(
        `Cannot create new settings file: ${fileName}. ` +
          `The settings directory exists but the file does not. ` +
          `Platform initializer should create default settings files.`
      );
    }
    const content = JSON.stringify(settings, null, 2);
    return dir.createChildFile(fileName, content).onSuccess(() => succeed(true));
  }

  // ============================================================================
  // Additional Methods
  // ============================================================================

  /**
   * Updates tool settings in common settings.
   * @param tools - Partial tool settings to merge
   * @returns Success with updated tool settings, or Failure
   * @public
   */
  public updateToolSettings(tools: Partial<IToolSettings>): Result<IToolSettings> {
    const merged: IToolSettings = {
      ...this._common.tools,
      scaling: {
        ...this._common.tools?.scaling,
        ...tools.scaling
      },
      workflow: {
        ...this._common.tools?.workflow,
        ...tools.workflow
      }
    };

    return this.updateCommonSettings({ tools: merged }).onSuccess((updated) => {
      /* c8 ignore next - branch: defensive fallback when updated settings lack field */
      return succeed(updated.tools ?? {});
    });
  }

  /**
   * Updates device tool settings overrides.
   * @param tools - Partial tool settings to merge as device overrides
   * @returns Success with updated device tool settings, or Failure
   * @public
   */
  public updateDeviceToolsOverride(tools: Partial<IToolSettings>): Result<Partial<IToolSettings>> {
    const merged: Partial<IToolSettings> = {
      ...this._device.toolsOverride,
      scaling: {
        ...this._device.toolsOverride?.scaling,
        ...tools.scaling
      },
      workflow: {
        ...this._device.toolsOverride?.workflow,
        ...tools.workflow
      }
    };

    return this.updateDeviceSettings({ toolsOverride: merged }).onSuccess((updated) => {
      /* c8 ignore next - branch: defensive fallback when updated settings lack field */
      return succeed(updated.toolsOverride ?? {});
    });
  }
}
