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

import {
  CollectionId,
  Editing,
  IWorkspace,
  LibraryRuntime,
  Converters as CommonConverters
} from '@fgv/ts-chocolate';
import { Result, fail, succeed } from '@fgv/ts-utils';

import { confirmAction, promptInput, showInfo, showMenu, showWarning } from '../shared';
import { EntityTypeName, entityTypeLabels } from './editTypes';

/**
 * Information about a collection available for editing.
 */
interface ICollectionInfo {
  readonly collectionId: CollectionId;
  readonly isMutable: boolean;
  readonly itemCount: number;
  readonly name?: string;
}

/**
 * Gets the sub-library for a given entity type from the workspace.
 */
function getSubLibrary(
  workspace: IWorkspace,
  entityType: EntityTypeName
): LibraryRuntime.ChocolateEntityLibrary {
  return workspace.data.entities;
}

/**
 * Lists all collections for a given entity type, with mutability info.
 */
function listCollections(workspace: IWorkspace, entityType: EntityTypeName): ReadonlyArray<ICollectionInfo> {
  const entityLib = getSubLibrary(workspace, entityType);
  let subLibrary: {
    collections: {
      keys(): IterableIterator<CollectionId>;
      get(id: CollectionId): {
        asResult: Result<{ isMutable: boolean; items: { size: number }; metadata?: { name?: string } }>;
      };
    };
  };

  switch (entityType) {
    case 'task':
      subLibrary = entityLib.tasks;
      break;
    case 'ingredient':
      subLibrary = entityLib.ingredients;
      break;
    case 'mold':
      subLibrary = entityLib.molds;
      break;
    case 'procedure':
      subLibrary = entityLib.procedures;
      break;
    case 'filling':
      subLibrary = entityLib.fillings;
      break;
    case 'confection':
      subLibrary = entityLib.confections;
      break;
  }

  const results: ICollectionInfo[] = [];
  for (const collectionId of subLibrary.collections.keys()) {
    const collResult = subLibrary.collections.get(collectionId).asResult;
    if (collResult.isSuccess()) {
      const coll = collResult.value;
      results.push({
        collectionId,
        isMutable: coll.isMutable,
        itemCount: coll.items.size,
        name: coll.metadata?.name
      });
    }
  }
  return results;
}

/**
 * Selects a mutable collection for editing.
 *
 * If only one mutable collection exists, returns it automatically.
 * If multiple exist, prompts the user to choose.
 * If none exist, returns a failure.
 *
 * @param workspace - The workspace
 * @param entityType - The entity type being edited
 * @returns Result with the selected collection ID
 */
export async function selectCollection(
  workspace: IWorkspace,
  entityType: EntityTypeName
): Promise<Result<CollectionId>> {
  const collections = listCollections(workspace, entityType);
  const mutableCollections = collections.filter((c) => c.isMutable);

  if (mutableCollections.length === 0) {
    const immutableCount = collections.length;
    if (immutableCount > 0) {
      showInfo(
        `No mutable ${entityTypeLabels[entityType].toLowerCase()} collections found. ` +
          `${immutableCount} collection(s) exist but are read-only.`
      );
    } else {
      showInfo(`No ${entityTypeLabels[entityType].toLowerCase()} collections found in workspace.`);
    }

    const shouldCreate = await confirmAction('Create a new collection?', true);
    if (!shouldCreate) {
      return fail('No mutable collection available');
    }

    return createNewCollection(workspace, entityType);
  }

  if (mutableCollections.length === 1) {
    return succeed(mutableCollections[0].collectionId);
  }

  // Multiple mutable collections — prompt user to choose
  const menuResult = await showMenu<CollectionId>({
    message: `Select a ${entityTypeLabels[entityType].toLowerCase()} collection:`,
    choices: mutableCollections.map((c) => ({
      value: c.collectionId,
      name: c.name ? `${c.collectionId} - ${c.name}` : c.collectionId,
      description: `${c.itemCount} item(s)`
    })),
    showBack: false,
    showExit: true
  });

  if (menuResult.action === 'exit') {
    return fail('Operation cancelled');
  }

  if (menuResult.action !== 'value') {
    return fail('Operation cancelled');
  }

  return succeed(menuResult.value);
}

/**
 * Resolves a collection ID — either from a provided string option or by prompting.
 *
 * @param workspace - The workspace
 * @param entityType - The entity type being edited
 * @param collectionOption - Optional collection ID from command line
 * @returns Result with the resolved collection ID
 */
export async function resolveCollectionId(
  workspace: IWorkspace,
  entityType: EntityTypeName,
  collectionOption?: string
): Promise<Result<CollectionId>> {
  if (collectionOption) {
    // Validate that the provided collection exists and is mutable
    const collections = listCollections(workspace, entityType);
    const match = collections.find((c) => c.collectionId === collectionOption);
    if (!match) {
      return fail(
        `Collection "${collectionOption}" not found for ${entityTypeLabels[
          entityType
        ].toLowerCase()} entities.`
      );
    }
    if (!match.isMutable) {
      showWarning(`Collection "${collectionOption}" is read-only.`);
      return fail(`Collection "${collectionOption}" is not mutable.`);
    }
    return succeed(match.collectionId);
  }

  return selectCollection(workspace, entityType);
}

/**
 * Creates a new mutable collection for the given entity type.
 * Prompts the user for a collection ID and optional name.
 */
async function createNewCollection(
  workspace: IWorkspace,
  entityType: EntityTypeName
): Promise<Result<CollectionId>> {
  const idInput = await promptInput('Collection ID (e.g., "user", "custom"):');
  if (!idInput.trim()) {
    return fail('Collection ID is required');
  }

  const idResult = CommonConverters.collectionId.convert(idInput.trim());
  if (idResult.isFailure()) {
    return fail(`Invalid collection ID: ${idResult.message}`);
  }
  const collectionId = idResult.value;

  const name = await promptInput('Collection name (optional):');
  const metadata = {
    ...(name.trim() && { name: name.trim() })
  };

  const entityLib = workspace.data.entities;
  let createResult: Result<unknown>;

  switch (entityType) {
    case 'task':
      createResult = new Editing.CollectionManager(entityLib.tasks).createWithFile(collectionId, metadata);
      break;
    case 'ingredient':
      createResult = new Editing.CollectionManager(entityLib.ingredients).createWithFile(
        collectionId,
        metadata
      );
      break;
    case 'mold':
      createResult = new Editing.CollectionManager(entityLib.molds).createWithFile(collectionId, metadata);
      break;
    case 'procedure':
      createResult = new Editing.CollectionManager(entityLib.procedures).createWithFile(
        collectionId,
        metadata
      );
      break;
    case 'filling':
      createResult = new Editing.CollectionManager(entityLib.fillings).createWithFile(collectionId, metadata);
      break;
    case 'confection':
      createResult = new Editing.CollectionManager(entityLib.confections).createWithFile(
        collectionId,
        metadata
      );
      break;
  }

  if (createResult.isFailure()) {
    return fail(`Failed to create collection: ${createResult.message}`);
  }

  showInfo(`Collection "${collectionId}" created successfully.`);
  return succeed(collectionId);
}
