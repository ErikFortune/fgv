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
 * Workspace initialization helpers.
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as path from 'path';

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';

import { LibraryPaths } from '../library-data';
import {
  createDefaultCommonSettings,
  createDefaultDeviceSettings,
  DeviceId,
  ICommonSettings,
  IDeviceSettings
} from '../settings';

/**
 * Parameters for workspace initialization.
 * @public
 */
export interface IWorkspaceInitParams {
  /**
   * Absolute path to the workspace root directory.
   */
  readonly workspacePath: string;

  /**
   * Device ID for this workspace instance.
   */
  readonly deviceId: DeviceId;

  /**
   * Optional human-readable device name.
   */
  readonly deviceName?: string;
}

/**
 * Result of workspace initialization.
 * @public
 */
export interface IWorkspaceInitResult {
  /**
   * Path to the created workspace.
   */
  readonly workspacePath: string;

  /**
   * Created common settings.
   */
  readonly commonSettings: ICommonSettings;

  /**
   * Created device settings.
   */
  readonly deviceSettings: IDeviceSettings;
}

/**
 * Creates the standard workspace directory structure.
 *
 * @param workspacePath - Absolute path to workspace root
 * @returns Success if directories created, Failure otherwise
 * @public
 */
export function createWorkspaceDirectories(workspacePath: string): Result<void> {
  const directories = [
    LibraryPaths.settings,
    LibraryPaths.ingredients,
    LibraryPaths.fillings,
    LibraryPaths.confections,
    LibraryPaths.molds,
    LibraryPaths.procedures,
    LibraryPaths.tasks,
    LibraryPaths.sessions,
    LibraryPaths.journals
  ];

  return captureResult(() => {
    for (const dir of directories) {
      const fullPath = path.join(workspacePath, dir);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }).onFailure((msg) => fail(`Failed to create workspace directories: ${msg}`));
}

/**
 * Writes common settings to disk.
 *
 * @param workspacePath - Absolute path to workspace root
 * @param settings - Common settings to write
 * @returns Success or failure
 * @public
 */
export function writeCommonSettings(workspacePath: string, settings: ICommonSettings): Result<void> {
  const settingsPath = path.join(workspacePath, LibraryPaths.settings, LibraryPaths.settingsCommon);

  return captureResult(() => {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  }).onFailure((msg) => fail(`Failed to write common settings: ${msg}`));
}

/**
 * Writes device settings to disk.
 *
 * @param workspacePath - Absolute path to workspace root
 * @param deviceId - Device identifier
 * @param settings - Device settings to write
 * @returns Success or failure
 * @public
 */
export function writeDeviceSettings(
  workspacePath: string,
  deviceId: DeviceId,
  settings: IDeviceSettings
): Result<void> {
  const deviceFileName = `${LibraryPaths.settingsDevicePrefix}${deviceId}.json`;
  const settingsPath = path.join(workspacePath, LibraryPaths.settings, deviceFileName);

  return captureResult(() => {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  }).onFailure((msg) => fail(`Failed to write device settings: ${msg}`));
}

/**
 * Initializes a new workspace with default settings and directory structure.
 *
 * This is the primary initialization function that tools should call.
 * It creates:
 * - Standard directory structure
 * - Default common settings with schemaVersion
 * - Default device settings with schemaVersion
 *
 * @param params - Workspace initialization parameters
 * @returns Success with initialization result, or Failure
 * @public
 */
export function initializeWorkspace(params: IWorkspaceInitParams): Result<IWorkspaceInitResult> {
  // TODO: workspace is just an orchestrator, so it should call the library to create default libraries and the user library to create user default libraries
  const commonSettings = createDefaultCommonSettings();
  const deviceSettings = createDefaultDeviceSettings(params.deviceId, params.deviceName);

  return createWorkspaceDirectories(params.workspacePath)
    .onSuccess(() => writeCommonSettings(params.workspacePath, commonSettings))
    .onSuccess(() => writeDeviceSettings(params.workspacePath, params.deviceId, deviceSettings))
    .onSuccess(() => succeed({ workspacePath: params.workspacePath, commonSettings, deviceSettings }));
}
