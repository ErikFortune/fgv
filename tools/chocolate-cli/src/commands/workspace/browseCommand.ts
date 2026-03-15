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
import { Result, succeed } from '@fgv/ts-utils';
import { IWorkspace } from '@fgv/ts-chocolate';
import { loadWorkspace, showMenu, showError, showInfo, MenuBreadcrumb, type MenuResult } from './shared';
import {
  browseIngredients,
  browseMoldsInteractive,
  browseProceduresInteractive,
  browseFillingsInteractive,
  browseConfectionsInteractive,
  browseSessionsInteractive,
  browseJournalsInteractive,
  browseInventoryInteractive,
  IBrowseContext
} from './browse';

/**
 * Options for the browse command.
 */
interface IBrowseCommandOptions {
  readonly workspace: string;
  readonly config?: string;
}

/**
 * Main menu categories for browsing.
 */
type BrowseCategory =
  | 'ingredients'
  | 'fillings'
  | 'molds'
  | 'procedures'
  | 'confections'
  | 'sessions'
  | 'journals'
  | 'inventory';

/**
 * Creates a browse context from a workspace.
 */
function createBrowseContext(workspace: IWorkspace): IBrowseContext {
  const library = workspace.data;
  return {
    library,
    userLibrary: workspace.userData,
    breadcrumb: new MenuBreadcrumb(),
    renderContext: { library }
  };
}

/**
 * Unlocks a workspace if it has a keystore.
 * If unlock fails or user skips, proceeds with public collections only.
 */
async function unlockWorkspaceIfNeeded(workspace: IWorkspace): Promise<Result<void>> {
  if (workspace.state === 'no-keystore') {
    return succeed(undefined);
  }

  if (workspace.state === 'unlocked') {
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
 * Shows the main browse menu.
 */
async function showMainMenu(browseContext: IBrowseContext): Promise<MenuResult<BrowseCategory>> {
  const library = browseContext.library;
  const userLibrary = browseContext.userLibrary;
  const breadcrumb = browseContext.breadcrumb;

  const ingredientCount = library.ingredients.size;
  const fillingCount = library.fillings.size;
  const moldCount = library.molds.size;
  const procedureCount = library.procedures.size;
  const confectionCount = library.confections.size;
  const sessionCount = userLibrary ? userLibrary.sessions.size : 0;
  const journalCount = userLibrary ? userLibrary.journals.size : 0;

  return showMenu<BrowseCategory>({
    message: `Browse Workspace${breadcrumb.path.length > 0 ? ` - ${breadcrumb.toString()}` : ''}`,
    choices: [
      {
        value: 'ingredients',
        name: `Ingredients (${ingredientCount})`,
        description: 'Browse chocolate ingredients'
      },
      {
        value: 'fillings',
        name: `Fillings (${fillingCount})`,
        description: 'Browse filling recipes'
      },
      {
        value: 'molds',
        name: `Molds (${moldCount})`,
        description: 'Browse chocolate molds'
      },
      {
        value: 'procedures',
        name: `Procedures (${procedureCount})`,
        description: 'Browse procedures and techniques'
      },
      {
        value: 'confections',
        name: `Confections (${confectionCount})`,
        description: 'Browse confection recipes'
      },
      {
        value: 'sessions',
        name: `Sessions (${sessionCount})`,
        description: 'Browse production sessions',
        disabled: !userLibrary ? 'User library not available' : false
      },
      {
        value: 'journals',
        name: `Journals (${journalCount})`,
        description: 'Browse journal entries',
        disabled: !userLibrary ? 'User library not available' : false
      },
      {
        value: 'inventory',
        name: 'Inventory',
        description: 'Browse mold and ingredient inventory',
        disabled: !userLibrary ? 'User library not available' : false
      }
    ],
    showBack: breadcrumb.path.length > 0,
    showExit: true
  });
}

/**
 * Main browse loop.
 */
async function browseWorkspace(workspace: IWorkspace): Promise<Result<void>> {
  const browseContext = createBrowseContext(workspace);
  const breadcrumb = browseContext.breadcrumb;

  while (true) {
    const menuResult = await showMainMenu(browseContext);

    if (menuResult.action === 'exit') {
      return succeed(undefined);
    }

    if (menuResult.action === 'back') {
      if (breadcrumb.path.length > 0) {
        breadcrumb.pop();
      } else {
        return succeed(undefined);
      }
      continue;
    }

    if (menuResult.action !== 'value') {
      continue;
    }

    const category = menuResult.value;
    let result: Result<void> = succeed(undefined);

    switch (category) {
      case 'ingredients':
        result = await browseIngredients(browseContext);
        break;
      case 'fillings':
        result = await browseFillingsInteractive(browseContext);
        break;
      case 'molds':
        result = await browseMoldsInteractive(browseContext);
        break;
      case 'procedures':
        result = await browseProceduresInteractive(browseContext);
        break;
      case 'confections':
        result = await browseConfectionsInteractive(browseContext);
        break;
      case 'sessions':
        result = await browseSessionsInteractive(browseContext);
        break;
      case 'journals':
        result = await browseJournalsInteractive(browseContext);
        break;
      case 'inventory':
        result = await browseInventoryInteractive(browseContext);
        break;
    }

    if (result.isFailure()) {
      if (result.message === 'exit') {
        return succeed(undefined);
      }
      showError(result.message);
    }
  }
}

/**
 * Creates the browse command.
 */
export function createBrowseCommand(): Command {
  const cmd = new Command('browse');

  cmd
    .description('Browse workspace contents interactively')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .option('-d, --device-name <name>', 'Device name for this instance')
    .option('--config <name>', 'Configuration name (e.g. debug)')
    .action(async (options: IBrowseCommandOptions) => {
      const workspaceResult = await loadWorkspace({
        workspacePath: options.workspace,
        configName: options.config
      });

      if (workspaceResult.isFailure()) {
        showError(workspaceResult.message);
        process.exit(1);
      }

      const workspace = workspaceResult.value;

      const unlockResult = await unlockWorkspaceIfNeeded(workspace);
      if (unlockResult.isFailure()) {
        showError(unlockResult.message);
        process.exit(1);
      }

      const browseResult = await browseWorkspace(workspace);
      if (browseResult.isFailure()) {
        showError(browseResult.message);
        process.exit(1);
      }
    });

  return cmd;
}
