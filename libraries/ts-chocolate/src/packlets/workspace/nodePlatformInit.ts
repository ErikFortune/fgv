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
 * Node.js platform initializer implementation.
 * Resolves filesystem paths to FileTree objects and loads settings.
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { IKeyStoreFile, KeyStoreConverters, nodeCryptoProvider } from '../crypto-utils';
import { LibraryPaths } from '../library-data';
import {
  Converters as SettingsConverters,
  createDefaultCommonSettings,
  createDefaultDeviceSettings,
  DeviceId,
  ExternalLibraryRef,
  ICommonSettings,
  IDeviceSettings,
  IExternalLibraryRefConfig,
  resolveSettings
} from '../settings';
import {
  IPlatformInitializer,
  IPlatformInitOptions,
  IPlatformInitResult,
  IResolvedExternalLibrary
} from './platformInit';

// ============================================================================
// Node.js Platform Initializer
// ============================================================================

/**
 * Platform initializer implementation for Node.js environments.
 * Uses the filesystem for all resource resolution.
 * @public
 */
export class NodePlatformInitializer implements IPlatformInitializer {
  /**
   * Singleton instance of the Node.js platform initializer.
   */
  private static _instance: NodePlatformInitializer | undefined;

  /**
   * Gets the singleton instance.
   */
  public static get instance(): NodePlatformInitializer {
    if (!NodePlatformInitializer._instance) {
      NodePlatformInitializer._instance = new NodePlatformInitializer();
    }
    return NodePlatformInitializer._instance;
  }

  /**
   * Private constructor - use NodePlatformInitializer.instance.
   */
  private constructor() {}

  /**
   * {@inheritDoc IPlatformInitializer.initialize}
   */
  public async initialize(options: IPlatformInitOptions): Promise<Result<IPlatformInitResult>> {
    // 1. Generate or use provided device ID
    const deviceId = options.deviceId ?? this._generateDeviceId();

    // 2. Create the user library FileTree
    const userLibraryTreeResult = this._createFileTree(options.userLibraryPath, true);
    if (userLibraryTreeResult.isFailure()) {
      return fail(`Failed to create user library tree: ${userLibraryTreeResult.message}`);
    }
    const userLibraryTree = userLibraryTreeResult.value;

    // 3. Load settings (common and device-specific)
    const settingsResult = this._loadSettings(userLibraryTree, deviceId, options.deviceName);
    if (settingsResult.isFailure()) {
      return fail(`Failed to load settings: ${settingsResult.message}`);
    }
    const { common, device } = settingsResult.value;

    // 4. Resolve external libraries
    const externalLibrariesResult = this._resolveExternalLibraries(common.externalLibraries ?? []);
    if (externalLibrariesResult.isFailure()) {
      return fail(`Failed to resolve external libraries: ${externalLibrariesResult.message}`);
    }

    // 5. Load key store file if present
    const keyStorePath = options.keyStorePath ?? path.join(options.userLibraryPath, LibraryPaths.keyStore);
    const keyStoreFileResult = this._loadKeyStoreFile(keyStorePath);

    // 6. Create resolved settings
    const resolvedSettings = resolveSettings(common, device);

    return succeed({
      cryptoProvider: nodeCryptoProvider,
      userLibraryTree,
      externalLibraries: externalLibrariesResult.value,
      keyStoreFile: keyStoreFileResult.isSuccess() ? keyStoreFileResult.value : undefined,
      commonSettings: common,
      deviceSettings: device,
      resolvedSettings,
      deviceId
    });
  }

  /**
   * {@inheritDoc IPlatformInitializer.resolveExternalLibrary}
   */
  public resolveExternalLibrary(
    ref: ExternalLibraryRef,
    config: IExternalLibraryRefConfig
  ): Result<FileTree.IFileTreeDirectoryItem> {
    // Resolve the path (could be relative or absolute)
    const resolvedPath = path.resolve(ref as string);

    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
      return fail(`External library path does not exist: ${resolvedPath}`);
    }

    if (!fs.statSync(resolvedPath).isDirectory()) {
      return fail(`External library path is not a directory: ${resolvedPath}`);
    }

    // Create FileTree for the path
    return this._createFileTree(resolvedPath, config.mutable ?? false);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Generates a device ID from the hostname or a random UUID.
   * @internal
   */
  private _generateDeviceId(): DeviceId {
    // Use hostname as base, sanitized for device ID pattern
    const hostname = os
      .hostname()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    return hostname as unknown as DeviceId;
  }

  /**
   * Creates a FileTree rooted at the given path.
   * @internal
   */
  private _createFileTree(rootPath: string, mutable: boolean): Result<FileTree.IFileTreeDirectoryItem> {
    const resolvedPath = path.resolve(rootPath);

    // Ensure directory exists
    if (!fs.existsSync(resolvedPath)) {
      // Try to create it
      const createResult = captureResult(() => {
        fs.mkdirSync(resolvedPath, { recursive: true });
      });
      if (createResult.isFailure()) {
        return fail(`Failed to create directory ${resolvedPath}: ${createResult.message}`);
      }
    }

    if (!fs.statSync(resolvedPath).isDirectory()) {
      return fail(`Path is not a directory: ${resolvedPath}`);
    }

    // Create accessors with appropriate mutability
    const accessors = new FileTree.FsFileTreeAccessors({
      prefix: resolvedPath,
      mutable
    });

    // Create directory item for root
    return FileTree.DirectoryItem.create('.', accessors);
  }

  /**
   * Loads settings from the user library.
   * @internal
   */
  private _loadSettings(
    userLibraryTree: FileTree.IFileTreeDirectoryItem,
    deviceId: DeviceId,
    deviceName?: string
  ): Result<{ common: ICommonSettings; device: IDeviceSettings }> {
    // Try to navigate to settings directory
    const settingsDir = this._navigateToDirectory(userLibraryTree, LibraryPaths.settings);

    // Load common settings
    const commonResult = this._loadCommonSettings(settingsDir);
    if (commonResult.isFailure()) {
      return fail(`Failed to load common settings: ${commonResult.message}`);
    }

    // Load device settings
    const deviceResult = this._loadDeviceSettings(settingsDir, deviceId, deviceName);
    if (deviceResult.isFailure()) {
      return fail(`Failed to load device settings: ${deviceResult.message}`);
    }

    return succeed({
      common: commonResult.value,
      device: deviceResult.value
    });
  }

  /**
   * Loads common settings from the settings directory.
   * @internal
   */
  private _loadCommonSettings(settingsDir: Result<FileTree.IFileTreeDirectoryItem>): Result<ICommonSettings> {
    if (settingsDir.isFailure()) {
      // Settings directory doesn't exist - use defaults
      return succeed(createDefaultCommonSettings());
    }

    const childrenResult = settingsDir.value.getChildren();
    if (childrenResult.isFailure()) {
      return fail(childrenResult.message);
    }

    const commonFile = childrenResult.value.find(
      (c) => c.name === LibraryPaths.settingsCommon && c.type === 'file'
    ) as FileTree.IFileTreeFileItem | undefined;

    if (!commonFile) {
      // Common settings file doesn't exist - use defaults
      return succeed(createDefaultCommonSettings());
    }

    return commonFile.getContents().onSuccess((json) => {
      return SettingsConverters.commonSettings.convert(json).withErrorFormat((e) => `common.json: ${e}`);
    });
  }

  /**
   * Loads device settings from the settings directory.
   * @internal
   */
  private _loadDeviceSettings(
    settingsDir: Result<FileTree.IFileTreeDirectoryItem>,
    deviceId: DeviceId,
    deviceName?: string
  ): Result<IDeviceSettings> {
    if (settingsDir.isFailure()) {
      // Settings directory doesn't exist - use defaults
      return succeed(createDefaultDeviceSettings(deviceId, deviceName));
    }

    const deviceFileName = `${LibraryPaths.settingsDevicePrefix}${deviceId}.json`;

    const childrenResult = settingsDir.value.getChildren();
    if (childrenResult.isFailure()) {
      return fail(childrenResult.message);
    }

    const deviceFile = childrenResult.value.find((c) => c.name === deviceFileName && c.type === 'file') as
      | FileTree.IFileTreeFileItem
      | undefined;

    if (!deviceFile) {
      // Device settings file doesn't exist - use defaults
      return succeed(createDefaultDeviceSettings(deviceId, deviceName));
    }

    return deviceFile.getContents().onSuccess((json) => {
      return SettingsConverters.deviceSettings
        .convert(json)
        .withErrorFormat((e) => `${deviceFileName}: ${e}`);
    });
  }

  /**
   * Resolves all external library references to FileTrees.
   * @internal
   */
  private _resolveExternalLibraries(
    configs: ReadonlyArray<IExternalLibraryRefConfig>
  ): Result<ReadonlyArray<IResolvedExternalLibrary>> {
    const resolved: IResolvedExternalLibrary[] = [];

    for (const config of configs) {
      const treeResult = this.resolveExternalLibrary(config.ref, config);
      if (treeResult.isFailure()) {
        return fail(`Failed to resolve external library "${config.name}": ${treeResult.message}`);
      }

      resolved.push({
        name: config.name,
        originalRef: config.ref,
        fileTree: treeResult.value,
        load: config.load,
        mutable: config.mutable
      });
    }

    return succeed(resolved);
  }

  /**
   * Loads the key store file if it exists.
   * @internal
   */
  private _loadKeyStoreFile(keyStorePath: string): Result<IKeyStoreFile> {
    if (!fs.existsSync(keyStorePath)) {
      return fail(`Key store file not found: ${keyStorePath}`);
    }

    return captureResult(() => {
      const contents = fs.readFileSync(keyStorePath, 'utf8');
      return JSON.parse(contents) as unknown;
    }).onSuccess((json) => {
      return KeyStoreConverters.keystoreFile
        .convert(json)
        .withErrorFormat((e: string) => `${keyStorePath}: ${e}`);
    });
  }

  /**
   * Navigates to a subdirectory within a FileTree.
   * @internal
   */
  private _navigateToDirectory(
    tree: FileTree.IFileTreeDirectoryItem,
    relativePath: string
  ): Result<FileTree.IFileTreeDirectoryItem> {
    const parts = relativePath.split('/').filter((p) => p.length > 0);
    if (parts.length === 0) {
      return succeed(tree);
    }

    let current: FileTree.IFileTreeDirectoryItem = tree;

    for (const part of parts) {
      const childrenResult = current.getChildren();
      if (childrenResult.isFailure()) {
        return fail(childrenResult.message);
      }

      const child = childrenResult.value.find((c) => c.name === part);
      if (child === undefined) {
        return fail(`Directory not found: ${part}`);
      }

      if (child.type !== 'directory') {
        return fail(`Not a directory: ${part}`);
      }

      current = child;
    }

    return succeed(current);
  }
}

/**
 * Creates a Node.js platform initializer instance.
 * @returns The singleton NodePlatformInitializer instance
 * @public
 */
export function createNodePlatformInitializer(): IPlatformInitializer {
  return NodePlatformInitializer.instance;
}

/**
 * Convenience function to perform Node.js platform initialization.
 * @param options - Platform initialization options
 * @returns Success with init result, or Failure
 * @public
 */
export async function initializeNodePlatform(
  options: IPlatformInitOptions
): Promise<Result<IPlatformInitResult>> {
  return NodePlatformInitializer.instance.initialize(options);
}
