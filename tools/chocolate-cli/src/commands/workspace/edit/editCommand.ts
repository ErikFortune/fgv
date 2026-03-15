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

import { Command } from 'commander';
import { password } from '@inquirer/prompts';
import { IWorkspace } from '@fgv/ts-chocolate';
import { Result, succeed } from '@fgv/ts-utils';

import { loadWorkspace, showError, showInfo, showSuccess } from '../shared';
import { IEditCommandOptions, IAddCommandOptions, IUpdateCommandOptions } from './editTypes';
import { executeAdd, executeUpdate, executeInteractive } from './editOrchestrator';

/**
 * Unlocks a workspace if it has a keystore.
 */
async function unlockWorkspaceIfNeeded(workspace: IWorkspace): Promise<Result<void>> {
  if (workspace.state === 'no-keystore' || workspace.state === 'unlocked') {
    return succeed(undefined);
  }

  const pwd = await password({
    message: 'Enter keystore password to unlock protected collections (press Enter to skip):',
    mask: '*'
  });

  if (!pwd || pwd.trim() === '') {
    showInfo('Skipping keystore unlock - only public collections will be available');
    return succeed(undefined);
  }

  const unlockResult = await workspace.unlock(pwd);
  if (unlockResult.isFailure()) {
    showError(`Failed to unlock workspace: ${unlockResult.message}`);
    showInfo('Proceeding with public collections only');
    return succeed(undefined);
  }

  showInfo('Workspace unlocked successfully');
  return succeed(undefined);
}

/**
 * Loads and optionally unlocks a workspace for edit operations.
 */
async function loadEditWorkspace(options: IEditCommandOptions): Promise<IWorkspace | undefined> {
  const workspaceResult = await loadWorkspace({
    workspacePath: options.workspace,
    configName: options.config
  });

  if (workspaceResult.isFailure()) {
    showError(workspaceResult.message);
    return undefined;
  }

  const workspace = workspaceResult.value;

  const unlockResult = await unlockWorkspaceIfNeeded(workspace);
  if (unlockResult.isFailure()) {
    showError(unlockResult.message);
    return undefined;
  }

  return workspace;
}

/**
 * Creates the 'add' subcommand.
 */
function createAddSubcommand(): Command {
  const cmd = new Command('add');

  cmd
    .description('Add a new entity to a workspace collection')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .requiredOption(
      '-t, --type <type>',
      'Entity type (task, ingredient, mold, procedure, filling, confection)'
    )
    .option('-f, --from-file <path>', 'Import entity from a JSON or YAML file')
    .option('-c, --collection <id>', 'Target collection ID')
    .option('-d, --device-name <name>', 'Device name for this instance')
    .option('--config <name>', 'Configuration name (e.g. debug)')
    .action(async (options: IAddCommandOptions) => {
      const workspace = await loadEditWorkspace(options);
      if (!workspace) {
        process.exit(1);
      }

      const result = await executeAdd(workspace, options.type, options.fromFile, options.collection);

      if (result.isFailure()) {
        showError(result.message);
        process.exit(1);
      }

      showSuccess(result.value);
    });

  return cmd;
}

/**
 * Creates the 'update' subcommand.
 */
function createUpdateSubcommand(): Command {
  const cmd = new Command('update');

  cmd
    .description('Edit an existing entity in a workspace collection')
    .argument('<entity-id>', 'Entity ID to edit (e.g., "user.my-task")')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .requiredOption(
      '-t, --type <type>',
      'Entity type (task, ingredient, mold, procedure, filling, confection)'
    )
    .option('-f, --from-file <path>', 'Import updated entity from a JSON or YAML file')
    .option('-c, --collection <id>', 'Collection ID override')
    .option('-d, --device-name <name>', 'Device name for this instance')
    .option('--config <name>', 'Configuration name (e.g. debug)')
    .action(async (entityId: string, options: IUpdateCommandOptions) => {
      const workspace = await loadEditWorkspace(options);
      if (!workspace) {
        process.exit(1);
      }

      const result = await executeUpdate(
        workspace,
        options.type,
        entityId,
        options.fromFile,
        options.collection
      );

      if (result.isFailure()) {
        showError(result.message);
        process.exit(1);
      }

      showSuccess(result.value);
    });

  return cmd;
}

/**
 * Creates the main 'edit' command with add/update subcommands.
 *
 * Usage:
 *   choco workspace edit -w <path>                                     # Interactive menu
 *   choco workspace edit add -w <path> --type task                     # Add interactively
 *   choco workspace edit add -w <path> --type task --from-file t.yaml  # Add from file
 *   choco workspace edit update <entity-id> -w <path>                  # Edit existing
 *   choco workspace edit update <entity-id> -w <path> --from-file t.yaml
 */
export function createEditCommand(): Command {
  const cmd = new Command('edit');

  cmd.description('Add or edit entities in a workspace');

  // Add subcommands
  cmd.addCommand(createAddSubcommand());
  cmd.addCommand(createUpdateSubcommand());

  // Default action (no subcommand) → interactive menu
  cmd
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .option('-c, --collection <id>', 'Target collection ID')
    .option('-d, --device-name <name>', 'Device name for this instance')
    .option('--config <name>', 'Configuration name (e.g. debug)')
    .action(async (options: IEditCommandOptions & { collection?: string }) => {
      const workspace = await loadEditWorkspace(options);
      if (!workspace) {
        process.exit(1);
      }

      const result = await executeInteractive(workspace, options.collection);

      if (result.isFailure()) {
        showError(result.message);
        process.exit(1);
      }

      if (result.value !== 'Cancelled') {
        showSuccess(result.value);
      }
    });

  return cmd;
}
