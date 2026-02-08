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

import { password } from '@inquirer/prompts';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { IWorkspace, createNodeWorkspace, type StartupMode } from '@fgv/ts-chocolate';

/**
 * Options for loading a workspace.
 */
export interface ILoadWorkspaceOptions {
  /**
   * Path to the workspace directory.
   */
  readonly workspacePath: string;

  /**
   * Whether to load built-in data.
   * @defaultValue true
   */
  readonly builtin?: boolean;

  /**
   * Whether to pre-warm caches on load.
   * @defaultValue false
   */
  readonly preWarm?: boolean;

  /**
   * Startup mode for error handling.
   * @defaultValue 'fail-on-error'
   */
  readonly startupMode?: StartupMode;

  /**
   * Device name for this instance.
   */
  readonly deviceName?: string;
}

/**
 * Options for unlocking a workspace.
 */
export interface IUnlockWorkspaceOptions {
  /**
   * The workspace to unlock.
   */
  readonly workspace: IWorkspace;

  /**
   * Optional password (if not provided, will prompt).
   */
  readonly password?: string;

  /**
   * Whether to suppress console output.
   * @defaultValue false
   */
  readonly quiet?: boolean;
}

/**
 * Loads a workspace from the specified path using platform initialization.
 *
 * @param options - Workspace loading options
 * @returns Success with workspace, or Failure if loading fails
 */
export async function loadWorkspace(options: ILoadWorkspaceOptions): Promise<Result<IWorkspace>> {
  // Use the enhanced createNodeWorkspace with single-root layout
  return createNodeWorkspace({
    layout: {
      mode: 'single-root',
      rootPath: options.workspacePath
    },
    builtin: options.builtin ?? true,
    preWarm: options.preWarm ?? false,
    startupMode: options.startupMode ?? 'fail-on-error',
    deviceName: options.deviceName
  });
}

/**
 * Unlocks a workspace by prompting for password if needed.
 *
 * @param options - Unlock options
 * @returns Success with unlocked workspace, or Failure if unlock fails
 */
export async function unlockWorkspace(options: IUnlockWorkspaceOptions): Promise<Result<IWorkspace>> {
  const { workspace, quiet } = options;

  // Check if workspace needs unlocking
  if (workspace.state === 'no-keystore') {
    if (!quiet) {
      console.log('Workspace has no keystore - no unlock needed');
    }
    return succeed(workspace);
  }

  if (workspace.state === 'unlocked') {
    if (!quiet) {
      console.log('Workspace is already unlocked');
    }
    return succeed(workspace);
  }

  // Workspace is locked - get password
  let pwd = options.password;
  if (!pwd) {
    pwd = await password({
      message: 'Enter workspace password:'
    });
  }

  // Unlock the workspace
  const unlockResult = await workspace.unlock(pwd);
  if (unlockResult.isFailure()) {
    return fail(`Failed to unlock workspace: ${unlockResult.message}`);
  }

  if (!quiet) {
    console.log('Workspace unlocked successfully');
  }

  return succeed(unlockResult.value);
}

/**
 * Loads and optionally unlocks a workspace.
 *
 * @param options - Load options
 * @returns Success with workspace (unlocked if keystore present), or Failure
 */
export async function loadAndUnlockWorkspace(
  options: ILoadWorkspaceOptions & { password?: string; quiet?: boolean }
): Promise<Result<IWorkspace>> {
  // Load the workspace
  const loadResult = await loadWorkspace(options);
  if (loadResult.isFailure()) {
    return loadResult;
  }

  const workspace = loadResult.value;

  // Unlock if needed
  if (workspace.state === 'locked') {
    return unlockWorkspace({
      workspace,
      password: options.password,
      quiet: options.quiet
    });
  }

  return succeed(workspace);
}

/**
 * Cached workspace for interactive sessions.
 * Allows commands to share a single workspace instance.
 */
let cachedWorkspace: IWorkspace | undefined;

/**
 * Gets the cached workspace if available.
 */
export function getCachedWorkspace(): IWorkspace | undefined {
  return cachedWorkspace;
}

/**
 * Sets the cached workspace for interactive sessions.
 */
export function setCachedWorkspace(workspace: IWorkspace | undefined): void {
  cachedWorkspace = workspace;
}

/**
 * Clears the cached workspace.
 */
export function clearCachedWorkspace(): void {
  cachedWorkspace = undefined;
}
