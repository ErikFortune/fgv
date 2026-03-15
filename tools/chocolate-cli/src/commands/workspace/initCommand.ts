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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { Settings, initializeWorkspace as initWorkspaceLib } from '@fgv/ts-chocolate';
import { confirmAction, promptInput, showSuccess, showError } from './shared';

/**
 * Options for the workspace init command.
 */
interface IInitCommandOptions {
  /**
   * Path to the workspace directory.
   */
  readonly workspace: string;

  /**
   * Device name for this instance.
   */
  readonly deviceName?: string;

  /**
   * Whether to skip confirmation prompts.
   */
  readonly yes?: boolean;
}

/**
 * Generates a device ID from device name or hostname.
 */
function generateDeviceId(deviceName?: string): string {
  if (deviceName) {
    return deviceName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  }
  return os
    .hostname()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
}

/**
 * Initializes a new workspace using library helpers.
 *
 * @param options - Initialization options
 * @returns Success if workspace initialized, Failure otherwise
 */
async function initializeWorkspace(options: IInitCommandOptions): Promise<Result<void>> {
  const workspacePath = path.resolve(options.workspace);

  // Check if directory already exists
  if (fs.existsSync(workspacePath)) {
    const isEmpty = fs.readdirSync(workspacePath).length === 0;
    if (!isEmpty) {
      if (!options.yes) {
        const confirmed = await confirmAction(
          `Directory ${workspacePath} already exists and is not empty. Continue anyway?`,
          false
        );
        if (!confirmed) {
          return fail('Workspace initialization cancelled');
        }
      }
    }
  }

  // Get device name
  let deviceName = options.deviceName;
  if (!deviceName && !options.yes) {
    deviceName = await promptInput('Enter device name (optional):');
  }

  // Generate device ID - cast to branded type
  const deviceId = generateDeviceId(deviceName) as unknown as Settings.DeviceId;

  // Use library helper to initialize workspace
  return initWorkspaceLib({
    workspacePath,
    deviceId,
    deviceName: deviceName || undefined
  }).onSuccess(() => succeed(undefined));
}

/**
 * Creates the workspace init command.
 *
 * @returns The init command
 */
export function createInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize a new workspace')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .option('-d, --device-name <name>', 'Device name for this instance')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options: IInitCommandOptions) => {
      const result = await initializeWorkspace(options);

      if (result.isFailure()) {
        await showError(result.message);
        process.exit(1);
      }

      showSuccess(`Workspace initialized at ${path.resolve(options.workspace)}`);
      console.log('\nNext steps:');
      console.log('  - To add encryption support: choco workspace keystore init -w <workspace>');
      console.log('  - To browse workspace: choco workspace browse -w <workspace>');
    });

  return cmd;
}
