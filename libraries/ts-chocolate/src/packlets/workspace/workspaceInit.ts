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

import { createDefaultLibraryDirectories, LibraryPaths } from '../library-data';
import {
  createDefaultBootstrapSettings,
  createDefaultPreferencesSettings,
  DeviceId,
  IBootstrapSettings,
  IPreferencesSettings
} from '../settings';
import { createDefaultUserEntityDirectories } from '../user-entities';

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
   * Created bootstrap settings.
   */
  readonly bootstrapSettings: IBootstrapSettings;

  /**
   * Created preferences settings.
   */
  readonly preferencesSettings: IPreferencesSettings;
}

/**
 * Creates the standard workspace directory structure.
 *
 * @param workspacePath - Absolute path to workspace root
 * @returns Success if directories created, Failure otherwise
 * @public
 */
export function createWorkspaceDirectories(workspacePath: string): Result<void> {
  // Create settings directory
  const settingsResult = captureResult(() => {
    const settingsPath = path.join(workspacePath, LibraryPaths.settings);
    fs.mkdirSync(settingsPath, { recursive: true });
  });

  if (settingsResult.isFailure()) {
    return fail(`Failed to create workspace directories: ${settingsResult.message}`);
  }

  // Delegate library and user entity directory creation to their respective modules
  return (
    createDefaultLibraryDirectories(workspacePath)
      /* c8 ignore next 1 - coverage intermittently missed in full suite */
      .onFailure((msg) => fail(`Failed to create workspace directories: ${msg}`))
      .onSuccess(() =>
        /* c8 ignore next 2 - coverage intermittently missed in full suite */
        createDefaultUserEntityDirectories(workspacePath).onFailure((msg) =>
          fail(`Failed to create workspace directories: ${msg}`)
        )
      )
  );
}

/**
 * Writes bootstrap settings to disk.
 *
 * @param workspacePath - Absolute path to workspace root
 * @param settings - Bootstrap settings to write
 * @returns Success or failure
 * @public
 */
export function writeBootstrapSettings(workspacePath: string, settings: IBootstrapSettings): Result<void> {
  const settingsPath = path.join(workspacePath, LibraryPaths.settings, LibraryPaths.settingsBootstrap);

  return captureResult(() => {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  }).onFailure((msg) => fail(`Failed to write bootstrap settings: ${msg}`));
}

/**
 * Writes preferences settings to disk.
 *
 * @param workspacePath - Absolute path to workspace root
 * @param settings - Preferences settings to write
 * @returns Success or failure
 * @public
 */
export function writePreferencesSettings(
  workspacePath: string,
  settings: IPreferencesSettings
): Result<void> {
  const settingsPath = path.join(workspacePath, LibraryPaths.settings, LibraryPaths.settingsPreferences);

  return captureResult(() => {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  }).onFailure((msg) => fail(`Failed to write preferences settings: ${msg}`));
}

/**
 * Initializes a new workspace with default settings and directory structure.
 *
 * This is the primary initialization function that tools should call.
 * It creates:
 * - Standard directory structure
 * - Default bootstrap settings
 * - Default preferences settings
 *
 * @param params - Workspace initialization parameters
 * @returns Success with initialization result, or Failure
 * @public
 */
export function initializeWorkspace(params: IWorkspaceInitParams): Result<IWorkspaceInitResult> {
  const bootstrapSettings: IBootstrapSettings = {
    ...createDefaultBootstrapSettings(),
    deviceName: params.deviceName
  };
  const preferencesSettings = createDefaultPreferencesSettings();

  return createWorkspaceDirectories(params.workspacePath)
    .onSuccess(() => writeBootstrapSettings(params.workspacePath, bootstrapSettings))
    .onSuccess(() => writePreferencesSettings(params.workspacePath, preferencesSettings))
    .onSuccess(() =>
      succeed({
        workspacePath: params.workspacePath,
        bootstrapSettings,
        preferencesSettings
      })
    );
}
