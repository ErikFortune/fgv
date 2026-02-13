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

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  CollectionId,
  Entities,
  IWorkspace,
  BaseTaskId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseFillingId,
  BaseConfectionId
} from '@fgv/ts-chocolate';

import { promptInput, showInfo, showMenu } from '../shared';
import { EntityTypeName, allEntityTypeNames, entityTypeLabels, interactiveEntityTypes } from './editTypes';
import { loadEntityFromFile } from './entityFileLoader';
import { resolveCollectionId } from './collectionSelector';
import { promptNewTask, promptEditTask } from './prompts/taskPrompts';
import { promptNewIngredient, promptEditIngredient } from './prompts/ingredientPrompts';
import { promptNewMold, promptEditMold } from './prompts/moldPrompts';
import { promptNewProcedure, promptEditProcedure } from './prompts/procedurePrompts';
import { promptNewFilling, promptEditFilling } from './prompts/fillingPrompts';
import { promptNewConfection, promptEditConfection } from './prompts/confectionPrompts';

// ============================================================================
// Add Flow
// ============================================================================

/**
 * Executes the add flow: create a new entity in a collection.
 *
 * @param workspace - The workspace
 * @param entityType - Type of entity to add
 * @param fromFile - Optional file path to import from
 * @param collectionOption - Optional collection ID
 * @returns Result indicating success or failure
 */
export async function executeAdd(
  workspace: IWorkspace,
  entityType: EntityTypeName,
  fromFile?: string,
  collectionOption?: string
): Promise<Result<string>> {
  // 1. Resolve collection
  const collectionResult = await resolveCollectionId(workspace, entityType, collectionOption);
  if (collectionResult.isFailure()) {
    return fail(collectionResult.message);
  }
  const collectionId = collectionResult.value;

  // 2. Get entity data — from file or interactive prompts
  let entityData: unknown;
  let baseId: string | undefined;

  if (fromFile) {
    const loadResult = loadEntityFromFile(fromFile, entityType);
    if (loadResult.isFailure()) {
      return fail(loadResult.message);
    }
    entityData = loadResult.value.entity;
    // Extract baseId from the entity if present
    baseId = extractBaseId(entityData, entityType);
  } else {
    const promptResult = await promptEntity(entityType);
    if (promptResult.isFailure()) {
      return fail(promptResult.message);
    }
    entityData = promptResult.value;
    baseId = extractBaseId(entityData, entityType);
  }

  if (!baseId) {
    return fail('Entity must have a base ID');
  }

  // 3. Add to collection
  return addToCollection(workspace, entityType, collectionId, baseId, entityData);
}

// ============================================================================
// Update Flow
// ============================================================================

/**
 * Executes the update flow: modify an existing entity.
 *
 * @param workspace - The workspace
 * @param entityId - Full entity ID (e.g., "user.my-task")
 * @param fromFile - Optional file path to import from
 * @param collectionOption - Optional collection ID override
 * @returns Result indicating success or failure
 */
export async function executeUpdate(
  workspace: IWorkspace,
  entityId: string,
  fromFile?: string,
  collectionOption?: string
): Promise<Result<string>> {
  // Parse entity ID to determine type and collection
  const parsed = parseEntityId(entityId);
  if (parsed.isFailure()) {
    return fail(parsed.message);
  }
  const { entityType, collectionId: parsedCollectionId, baseId } = parsed.value;
  const collectionId = collectionOption ? (collectionOption as unknown as CollectionId) : parsedCollectionId;

  // Get existing entity
  const existingResult = getExistingEntity(workspace, entityType, collectionId, baseId);
  if (existingResult.isFailure()) {
    return fail(existingResult.message);
  }
  const existing = existingResult.value;

  // Get updated entity data
  let updatedData: unknown;
  if (fromFile) {
    const loadResult = loadEntityFromFile(fromFile, entityType);
    if (loadResult.isFailure()) {
      return fail(loadResult.message);
    }
    updatedData = loadResult.value.entity;
  } else {
    const promptResult = await promptEditEntity(entityType, existing);
    if (promptResult.isFailure()) {
      return fail(promptResult.message);
    }
    updatedData = promptResult.value;
  }

  // Update in collection
  return updateInCollection(workspace, entityType, collectionId, baseId, updatedData);
}

// ============================================================================
// Interactive Menu Flow
// ============================================================================

/**
 * Interactive menu for choosing add/update action, then entity type.
 */
export async function executeInteractive(
  workspace: IWorkspace,
  collectionOption?: string
): Promise<Result<string>> {
  // Choose action
  const actionResult = await showMenu<'add' | 'update'>({
    message: 'What would you like to do?',
    choices: [
      { value: 'add', name: 'Add new entity', description: 'Create a new entity in a collection' },
      { value: 'update', name: 'Edit existing entity', description: 'Modify an existing entity' }
    ],
    showBack: false,
    showExit: true
  });

  if (actionResult.action !== 'value') {
    return succeed('Cancelled');
  }

  // Choose entity type
  const typeResult = await showMenu<EntityTypeName>({
    message: 'Select entity type:',
    choices: allEntityTypeNames.map((t) => ({
      value: t,
      name: entityTypeLabels[t],
      description: interactiveEntityTypes.includes(t)
        ? 'Interactive prompts or file import'
        : 'File import only'
    })),
    showBack: true,
    showExit: true
  });

  if (typeResult.action !== 'value') {
    return succeed('Cancelled');
  }

  const entityType = typeResult.value;

  if (actionResult.value === 'add') {
    // Ask: from file or interactive?
    const sourceResult = await chooseDataSource(entityType);
    if (sourceResult.isFailure()) {
      return fail(sourceResult.message);
    }

    if (sourceResult.value === 'cancelled') {
      return succeed('Cancelled');
    }

    return executeAdd(workspace, entityType, sourceResult.value ?? undefined, collectionOption);
  }

  // Update flow — need to select an entity
  const entityIdResult = await selectEntityForUpdate(workspace, entityType);
  if (entityIdResult.isFailure()) {
    return fail(entityIdResult.message);
  }

  return executeUpdate(workspace, entityIdResult.value, undefined, collectionOption);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extracts the base ID from an entity based on its type.
 */
function extractBaseId(entity: unknown, _entityType: EntityTypeName): string | undefined {
  if (typeof entity === 'object' && entity !== null && 'baseId' in entity) {
    const baseId = (entity as { baseId: unknown }).baseId;
    return typeof baseId === 'string' ? baseId : undefined;
  }
  return undefined;
}

/**
 * Prompts the user to create a new entity interactively.
 */
async function promptEntity(entityType: EntityTypeName): Promise<Result<unknown>> {
  switch (entityType) {
    case 'task':
      return promptNewTask();
    case 'ingredient':
      return promptNewIngredient();
    case 'mold':
      return promptNewMold();
    case 'procedure':
      return promptNewProcedure();
    case 'filling':
      return promptNewFilling();
    case 'confection':
      return promptNewConfection();
  }
}

/**
 * Prompts the user to edit an existing entity interactively.
 */
async function promptEditEntity(entityType: EntityTypeName, existing: unknown): Promise<Result<unknown>> {
  switch (entityType) {
    case 'task':
      return promptEditTask(existing as Entities.Tasks.IRawTaskEntity);
    case 'ingredient':
      return promptEditIngredient(existing as Entities.Ingredients.IngredientEntity);
    case 'mold':
      return promptEditMold(existing as Entities.IMoldEntity);
    case 'procedure':
      return promptEditProcedure(existing as Entities.IProcedureEntity);
    case 'filling':
      return promptEditFilling(existing as Entities.IFillingRecipeEntity);
    case 'confection':
      return promptEditConfection(existing as Entities.Confections.AnyConfectionRecipeEntity);
  }
}

/**
 * Asks the user whether to import from file or use interactive prompts.
 * Returns the file path if chosen, undefined for interactive, or 'cancelled'.
 */
async function chooseDataSource(
  entityType: EntityTypeName
): Promise<Result<string | undefined | 'cancelled'>> {
  const supportsInteractive = interactiveEntityTypes.includes(entityType);

  if (!supportsInteractive) {
    showInfo(`${entityTypeLabels[entityType]} entities require file import.`);
    const filePath = await promptInput('File path (JSON or YAML):');
    if (!filePath.trim()) {
      return succeed('cancelled');
    }
    return succeed(filePath.trim());
  }

  const sourceResult = await showMenu<'interactive' | 'file'>({
    message: 'How would you like to provide entity data?',
    choices: [
      {
        value: 'interactive',
        name: 'Interactive prompts',
        description: 'Answer prompts to build the entity'
      },
      {
        value: 'file',
        name: 'Import from file',
        description: 'Load from a JSON or YAML file'
      }
    ],
    showBack: true,
    showExit: true
  });

  if (sourceResult.action !== 'value') {
    return succeed('cancelled');
  }

  if (sourceResult.value === 'file') {
    const filePath = await promptInput('File path (JSON or YAML):');
    if (!filePath.trim()) {
      return succeed('cancelled');
    }
    return succeed(filePath.trim());
  }

  return succeed(undefined);
}

/**
 * Shows a selection menu for choosing an existing entity to update.
 */
async function selectEntityForUpdate(
  workspace: IWorkspace,
  entityType: EntityTypeName
): Promise<Result<string>> {
  const entityLib = workspace.data.entities;
  const entries: Array<{ id: string; name: string }> = [];

  switch (entityType) {
    case 'task':
      for (const [key, entity] of entityLib.tasks.entries()) {
        entries.push({ id: `${key}`, name: entity.name });
      }
      break;
    case 'ingredient':
      for (const [key, entity] of entityLib.ingredients.entries()) {
        entries.push({ id: `${key}`, name: entity.name });
      }
      break;
    case 'mold':
      for (const [key, entity] of entityLib.molds.entries()) {
        entries.push({ id: `${key}`, name: `${entity.manufacturer} ${entity.productNumber}` });
      }
      break;
    case 'procedure':
      for (const [key, entity] of entityLib.procedures.entries()) {
        entries.push({ id: `${key}`, name: entity.name });
      }
      break;
    case 'filling':
      for (const [key, entity] of entityLib.fillings.entries()) {
        entries.push({ id: `${key}`, name: entity.name });
      }
      break;
    case 'confection':
      for (const [key, entity] of entityLib.confections.entries()) {
        entries.push({ id: `${key}`, name: entity.name });
      }
      break;
  }

  if (entries.length === 0) {
    return fail(`No ${entityTypeLabels[entityType].toLowerCase()} entities found in workspace.`);
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  const menuResult = await showMenu<string>({
    message: `Select ${entityTypeLabels[entityType].toLowerCase()} to edit:`,
    choices: entries.map((e) => ({
      value: e.id,
      name: `${e.id} - ${e.name}`
    })),
    showBack: true,
    showExit: true
  });

  if (menuResult.action !== 'value') {
    return fail('Operation cancelled');
  }

  return succeed(menuResult.value);
}

/**
 * Parses a full entity ID like "user.my-task" into type, collection, and baseId.
 * The entity type must be determined by trying each sub-library.
 */
function parseEntityId(
  entityId: string
): Result<{ entityType: EntityTypeName; collectionId: CollectionId; baseId: string }> {
  const dotIndex = entityId.indexOf('.');
  if (dotIndex < 0) {
    return fail(`Invalid entity ID "${entityId}": expected format "collectionId.baseId"`);
  }

  const collectionId = entityId.substring(0, dotIndex) as CollectionId;
  const baseId = entityId.substring(dotIndex + 1);

  if (!collectionId || !baseId) {
    return fail(`Invalid entity ID "${entityId}": both collection ID and base ID are required`);
  }

  // Entity type is not encoded in the ID, so we need it from context
  // For the update command, we'll require the entity type to be known from
  // the interactive selection flow. For now, fail with a helpful message.
  return fail(
    `Cannot determine entity type from ID "${entityId}". ` +
      'Use the interactive flow or specify --type when updating.'
  );
}

/**
 * Gets an existing entity from a workspace collection.
 */
function getExistingEntity(
  workspace: IWorkspace,
  entityType: EntityTypeName,
  collectionId: CollectionId,
  baseId: string
): Result<unknown> {
  const entityLib = workspace.data.entities;

  switch (entityType) {
    case 'task': {
      const collection = entityLib.tasks;
      for (const [key, entity] of collection.entries()) {
        const keyStr = key as string;
        if (keyStr.endsWith(`.${baseId}`) || keyStr === `${collectionId}.${baseId}`) {
          return succeed(entity);
        }
      }
      return fail(`Task "${collectionId}.${baseId}" not found`);
    }
    case 'ingredient': {
      const collection = entityLib.ingredients;
      for (const [key, entity] of collection.entries()) {
        const keyStr = key as string;
        if (keyStr === `${collectionId}.${baseId}`) {
          return succeed(entity);
        }
      }
      return fail(`Ingredient "${collectionId}.${baseId}" not found`);
    }
    case 'mold': {
      const collection = entityLib.molds;
      for (const [key, entity] of collection.entries()) {
        const keyStr = key as string;
        if (keyStr === `${collectionId}.${baseId}`) {
          return succeed(entity);
        }
      }
      return fail(`Mold "${collectionId}.${baseId}" not found`);
    }
    case 'procedure': {
      const collection = entityLib.procedures;
      for (const [key, entity] of collection.entries()) {
        const keyStr = key as string;
        if (keyStr === `${collectionId}.${baseId}`) {
          return succeed(entity);
        }
      }
      return fail(`Procedure "${collectionId}.${baseId}" not found`);
    }
    case 'filling': {
      const collection = entityLib.fillings;
      for (const [key, entity] of collection.entries()) {
        const keyStr = key as string;
        if (keyStr === `${collectionId}.${baseId}`) {
          return succeed(entity);
        }
      }
      return fail(`Filling "${collectionId}.${baseId}" not found`);
    }
    case 'confection': {
      const collection = entityLib.confections;
      for (const [key, entity] of collection.entries()) {
        const keyStr = key as string;
        if (keyStr === `${collectionId}.${baseId}`) {
          return succeed(entity);
        }
      }
      return fail(`Confection "${collectionId}.${baseId}" not found`);
    }
  }
}

/**
 * Adds an entity to a collection and saves.
 */
function addToCollection(
  workspace: IWorkspace,
  entityType: EntityTypeName,
  collectionId: CollectionId,
  baseId: string,
  entity: unknown
): Result<string> {
  const entityLib = workspace.data.entities;

  switch (entityType) {
    case 'task': {
      return entityLib.getEditableTasksEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .add(baseId as BaseTaskId, entity as Entities.Tasks.IRawTaskEntity)
          .asResult.withErrorFormat((msg) => `Failed to add task: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Task "${collectionId}.${baseId}" added successfully`))
              .onFailure((msg) => fail(`Task added but save failed: ${msg}`));
          });
      });
    }
    case 'ingredient': {
      return entityLib.getEditableIngredientsEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .add(baseId as BaseIngredientId, entity as Entities.IngredientEntity)
          .asResult.withErrorFormat((msg) => `Failed to add ingredient: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Ingredient "${collectionId}.${baseId}" added successfully`))
              .onFailure((msg) => fail(`Ingredient added but save failed: ${msg}`));
          });
      });
    }
    case 'mold': {
      return entityLib.getEditableMoldsEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .add(baseId as BaseMoldId, entity as Entities.IMoldEntity)
          .asResult.withErrorFormat((msg) => `Failed to add mold: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Mold "${collectionId}.${baseId}" added successfully`))
              .onFailure((msg) => fail(`Mold added but save failed: ${msg}`));
          });
      });
    }
    case 'procedure': {
      return entityLib.getEditableProceduresEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .add(baseId as BaseProcedureId, entity as Entities.IProcedureEntity)
          .asResult.withErrorFormat((msg) => `Failed to add procedure: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Procedure "${collectionId}.${baseId}" added successfully`))
              .onFailure((msg) => fail(`Procedure added but save failed: ${msg}`));
          });
      });
    }
    case 'filling': {
      return entityLib.getEditableFillingsRecipeEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .add(baseId as BaseFillingId, entity as Entities.IFillingRecipeEntity)
          .asResult.withErrorFormat((msg) => `Failed to add filling: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Filling "${collectionId}.${baseId}" added successfully`))
              .onFailure((msg) => fail(`Filling added but save failed: ${msg}`));
          });
      });
    }
    case 'confection': {
      return entityLib.getEditableConfectionsEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .add(baseId as BaseConfectionId, entity as Entities.Confections.AnyConfectionRecipeEntity)
          .asResult.withErrorFormat((msg) => `Failed to add confection: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Confection "${collectionId}.${baseId}" added successfully`))
              .onFailure((msg) => fail(`Confection added but save failed: ${msg}`));
          });
      });
    }
  }
}

/**
 * Updates an entity in a collection and saves.
 */
function updateInCollection(
  workspace: IWorkspace,
  entityType: EntityTypeName,
  collectionId: CollectionId,
  baseId: string,
  entity: unknown
): Result<string> {
  const entityLib = workspace.data.entities;

  switch (entityType) {
    case 'task': {
      return entityLib.getEditableTasksEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .set(baseId as BaseTaskId, entity as Entities.Tasks.IRawTaskEntity)
          .asResult.withErrorFormat((msg) => `Failed to update task: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Task "${collectionId}.${baseId}" updated successfully`))
              .onFailure((msg) => fail(`Task updated but save failed: ${msg}`));
          });
      });
    }
    case 'ingredient': {
      return entityLib.getEditableIngredientsEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .set(baseId as BaseIngredientId, entity as Entities.IngredientEntity)
          .asResult.withErrorFormat((msg) => `Failed to update ingredient: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Ingredient "${collectionId}.${baseId}" updated successfully`))
              .onFailure((msg) => fail(`Ingredient updated but save failed: ${msg}`));
          });
      });
    }
    case 'mold': {
      return entityLib.getEditableMoldsEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .set(baseId as BaseMoldId, entity as Entities.IMoldEntity)
          .asResult.withErrorFormat((msg) => `Failed to update mold: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Mold "${collectionId}.${baseId}" updated successfully`))
              .onFailure((msg) => fail(`Mold updated but save failed: ${msg}`));
          });
      });
    }
    case 'procedure': {
      return entityLib.getEditableProceduresEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .set(baseId as BaseProcedureId, entity as Entities.IProcedureEntity)
          .asResult.withErrorFormat((msg) => `Failed to update procedure: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Procedure "${collectionId}.${baseId}" updated successfully`))
              .onFailure((msg) => fail(`Procedure updated but save failed: ${msg}`));
          });
      });
    }
    case 'filling': {
      return entityLib.getEditableFillingsRecipeEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .set(baseId as BaseFillingId, entity as Entities.IFillingRecipeEntity)
          .asResult.withErrorFormat((msg) => `Failed to update filling: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Filling "${collectionId}.${baseId}" updated successfully`))
              .onFailure((msg) => fail(`Filling updated but save failed: ${msg}`));
          });
      });
    }
    case 'confection': {
      return entityLib.getEditableConfectionsEntityCollection(collectionId).onSuccess((collection) => {
        return collection
          .set(baseId as BaseConfectionId, entity as Entities.Confections.AnyConfectionRecipeEntity)
          .asResult.withErrorFormat((msg) => `Failed to update confection: ${msg}`)
          .onSuccess(() => {
            return collection
              .save()
              .onSuccess(() => succeed(`Confection "${collectionId}.${baseId}" updated successfully`))
              .onFailure((msg) => fail(`Confection updated but save failed: ${msg}`));
          });
      });
    }
  }
}
