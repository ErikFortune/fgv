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

import { CollectionId } from '@fgv/ts-chocolate';

/**
 * Supported entity types for add/edit operations.
 */
export type EntityTypeName = 'task' | 'ingredient' | 'mold' | 'procedure' | 'filling' | 'confection';

/**
 * Display labels for entity types.
 */
export const entityTypeLabels: Record<EntityTypeName, string> = {
  task: 'Task',
  ingredient: 'Ingredient',
  mold: 'Mold',
  procedure: 'Procedure',
  filling: 'Filling',
  confection: 'Confection'
};

/**
 * All entity type names in recommended implementation order.
 */
export const allEntityTypeNames: ReadonlyArray<EntityTypeName> = [
  'task',
  'ingredient',
  'mold',
  'procedure',
  'filling',
  'confection'
];

/**
 * Entity types that support interactive prompts.
 */
export const interactiveEntityTypes: ReadonlyArray<EntityTypeName> = [
  'task',
  'ingredient',
  'mold',
  'procedure'
];

/**
 * Options for the edit command.
 */
export interface IEditCommandOptions {
  readonly workspace: string;
  readonly deviceName?: string;
}

/**
 * Options for the add subcommand.
 */
export interface IAddCommandOptions extends IEditCommandOptions {
  readonly type: EntityTypeName;
  readonly fromFile?: string;
  readonly collection?: string;
}

/**
 * Options for the update subcommand.
 */
export interface IUpdateCommandOptions extends IEditCommandOptions {
  readonly type: EntityTypeName;
  readonly fromFile?: string;
  readonly collection?: string;
}

/**
 * Context for edit operations, passed to orchestrator and prompts.
 */
export interface IEditContext {
  readonly entityType: EntityTypeName;
  readonly collectionId: CollectionId;
}
