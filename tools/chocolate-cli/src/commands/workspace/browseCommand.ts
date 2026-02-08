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
import { Result, fail, succeed } from '@fgv/ts-utils';
import { IWorkspace } from '@fgv/ts-chocolate';
import { loadWorkspace, showMenu, showError, showInfo, MenuBreadcrumb, type MenuResult } from './shared';

/**
 * Options for the browse command.
 */
interface IBrowseCommandOptions {
  /**
   * Path to the workspace directory.
   */
  readonly workspace: string;

  /**
   * Device name for this instance.
   */
  readonly deviceName?: string;
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

  // Workspace is locked - prompt for password (allow empty to skip)
  const pwd = await password({
    message: 'Enter keystore password to unlock protected collections (press Enter to skip):',
    mask: '*'
  });

  // If user pressed Enter without typing, skip unlock
  if (!pwd || pwd.trim() === '') {
    showInfo('Skipping keystore unlock - only public collections will be available');
    return succeed(undefined);
  }

  // Try to unlock
  const unlockResult = await workspace.unlock(pwd);
  if (unlockResult.isFailure()) {
    await showError(`Failed to unlock workspace: ${unlockResult.message}`);
    showInfo('Proceeding with public collections only');
    return succeed(undefined);
  }

  showInfo('Workspace unlocked successfully');
  return succeed(undefined);
}

/**
 * Shows the main browse menu.
 */
async function showMainMenu(
  workspace: IWorkspace,
  breadcrumb: MenuBreadcrumb
): Promise<MenuResult<BrowseCategory>> {
  const library = workspace.data;
  const userLibrary = workspace.userData;

  // Get counts for each category
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
 * Browses ingredients.
 */
async function browseIngredients(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Ingredients');

  const library = workspace.data;
  const ingredients = Array.from(library.ingredients.values());

  if (ingredients.length === 0) {
    showInfo('No ingredients found');
    breadcrumb.pop();
    return succeed(undefined);
  }

  showInfo(`Found ${ingredients.length} ingredient(s)`);
  console.log('\nIngredients:');
  for (const ingredient of ingredients) {
    console.log(`  - ${ingredient.name} (${ingredient.id})`);
    if (ingredient.description) {
      console.log(`    ${ingredient.description}`);
    }
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses fillings.
 */
async function browseFillings(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Fillings');

  const library = workspace.data;
  const fillings = Array.from(library.fillings.values());

  if (fillings.length === 0) {
    showInfo('No fillings found');
    breadcrumb.pop();
    return succeed(undefined);
  }

  showInfo(`Found ${fillings.length} filling(s)`);
  console.log('\nFillings:');
  for (const filling of fillings) {
    console.log(`  - ${filling.name} (${filling.id})`);
    if (filling.description) {
      console.log(`    ${filling.description}`);
    }
    console.log(`    Variations: ${filling.variations.length}`);
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses molds.
 */
async function browseMolds(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Molds');

  const library = workspace.data;
  const molds = Array.from(library.molds.values());

  if (molds.length === 0) {
    showInfo('No molds found');
    breadcrumb.pop();
    return succeed(undefined);
  }

  showInfo(`Found ${molds.length} mold(s)`);
  console.log('\nMolds:');
  for (const mold of molds) {
    console.log(`  - ${JSON.stringify(mold, null, 2)}`);
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses procedures.
 */
async function browseProcedures(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Procedures');

  const library = workspace.data;
  const procedures = Array.from(library.procedures.values());

  if (procedures.length === 0) {
    showInfo('No procedures found');
    breadcrumb.pop();
    return succeed(undefined);
  }

  showInfo(`Found ${procedures.length} procedure(s)`);
  console.log('\nProcedures:');
  for (const procedure of procedures) {
    console.log(`  - ${procedure.name} (${procedure.id})`);
    if (procedure.description) {
      console.log(`    ${procedure.description}`);
    }
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses confections.
 */
async function browseConfections(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Confections');

  const library = workspace.data;
  const confections = Array.from(library.confections.values());

  if (confections.length === 0) {
    showInfo('No confections found');
    breadcrumb.pop();
    return succeed(undefined);
  }

  showInfo(`Found ${confections.length} confection(s)`);
  console.log('\nConfections:');
  for (const confection of confections) {
    console.log(`  - ${confection.name} (${confection.id})`);
    if (confection.description) {
      console.log(`    ${confection.description}`);
    }
    const type = confection.isMoldedBonBon()
      ? 'Molded Bon Bon'
      : confection.isBarTruffle()
      ? 'Bar Truffle'
      : confection.isRolledTruffle()
      ? 'Rolled Truffle'
      : 'Unknown';
    console.log(`    Type: ${type}`);
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses sessions.
 */
async function browseSessions(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Sessions');

  const userLibrary = workspace.userData;
  if (!userLibrary) {
    breadcrumb.pop();
    return fail('User library not available');
  }

  const sessions = Array.from(userLibrary.sessions.values());

  if (sessions.length === 0) {
    showInfo('No sessions found');
    breadcrumb.pop();
    return succeed(undefined);
  }

  showInfo(`Found ${sessions.length} session(s)`);
  console.log('\nSessions:');
  for (const session of sessions) {
    console.log(`  - ${JSON.stringify(session, null, 2)}`);
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses journals.
 */
async function browseJournals(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Journals');

  const userLibrary = workspace.userData;
  if (!userLibrary) {
    breadcrumb.pop();
    return fail('User library not available');
  }

  const journals = Array.from(userLibrary.journals.values());

  if (journals.length === 0) {
    showInfo('No journal entries found');
    breadcrumb.pop();
    return succeed(undefined);
  }

  showInfo(`Found ${journals.length} journal entry/entries`);
  console.log('\nJournal Entries:');
  for (const entry of journals) {
    console.log(`  - ${JSON.stringify(entry, null, 2)}`);
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses inventory.
 */
async function browseInventory(workspace: IWorkspace, breadcrumb: MenuBreadcrumb): Promise<Result<void>> {
  breadcrumb.push('Inventory');

  const userLibrary = workspace.userData;
  if (!userLibrary) {
    breadcrumb.pop();
    return fail('User library not available');
  }

  const moldInventory = Array.from(userLibrary.moldInventory.values());
  const ingredientInventory = Array.from(userLibrary.ingredientInventory.values());

  showInfo(`Mold Inventory: ${moldInventory.length} entry/entries`);
  showInfo(`Ingredient Inventory: ${ingredientInventory.length} entry/entries`);

  if (moldInventory.length > 0) {
    console.log('\nMold Inventory:');
    for (const entry of moldInventory) {
      console.log(`  - ${JSON.stringify(entry, null, 2)}`);
    }
  }

  if (ingredientInventory.length > 0) {
    console.log('\nIngredient Inventory:');
    for (const entry of ingredientInventory) {
      console.log(`  - ${JSON.stringify(entry, null, 2)}`);
    }
  }

  breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Main browse loop.
 */
async function browseWorkspace(workspace: IWorkspace): Promise<Result<void>> {
  const breadcrumb = new MenuBreadcrumb();

  while (true) {
    const menuResult = await showMainMenu(workspace, breadcrumb);

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

    // Handle category selection - menuResult.action === 'value'
    if (menuResult.action !== 'value') {
      continue;
    }

    const category = menuResult.value;
    let result: Result<void> = succeed(undefined);

    switch (category) {
      case 'ingredients':
        result = await browseIngredients(workspace, breadcrumb);
        break;
      case 'fillings':
        result = await browseFillings(workspace, breadcrumb);
        break;
      case 'molds':
        result = await browseMolds(workspace, breadcrumb);
        break;
      case 'procedures':
        result = await browseProcedures(workspace, breadcrumb);
        break;
      case 'confections':
        result = await browseConfections(workspace, breadcrumb);
        break;
      case 'sessions':
        result = await browseSessions(workspace, breadcrumb);
        break;
      case 'journals':
        result = await browseJournals(workspace, breadcrumb);
        break;
      case 'inventory':
        result = await browseInventory(workspace, breadcrumb);
        break;
    }

    if (result.isFailure()) {
      await showError(result.message);
    }
  }
}

/**
 * Creates the browse command.
 *
 * @returns The browse command
 */
export function createBrowseCommand(): Command {
  const cmd = new Command('browse');

  cmd
    .description('Browse workspace contents interactively')
    .requiredOption('-w, --workspace <path>', 'Path to workspace directory')
    .option('-d, --device-name <name>', 'Device name for this instance')
    .action(async (options: IBrowseCommandOptions) => {
      // Load workspace
      const workspaceResult = await loadWorkspace({
        workspacePath: options.workspace,
        deviceName: options.deviceName
      });

      if (workspaceResult.isFailure()) {
        await showError(workspaceResult.message);
        process.exit(1);
      }

      const workspace = workspaceResult.value;

      // Unlock if needed
      const unlockResult = await unlockWorkspaceIfNeeded(workspace);
      if (unlockResult.isFailure()) {
        await showError(unlockResult.message);
        process.exit(1);
      }

      // Start browsing
      const browseResult = await browseWorkspace(workspace);
      if (browseResult.isFailure()) {
        await showError(browseResult.message);
        process.exit(1);
      }
    });

  return cmd;
}
