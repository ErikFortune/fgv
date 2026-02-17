/**
 * Shared utilities, entity descriptors, and filter specs for Chocolate Lab Web.
 * @packageDocumentation
 */

import type { IEntityDescriptor } from '@fgv/ts-app-shell';
import { Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type {
  IngredientId,
  FillingId,
  MoldId,
  TaskId,
  ProcedureId,
  ConfectionId,
  DecorationId
} from '@fgv/ts-chocolate';
import type { IEntityFilterSpec } from '@fgv/chocolate-lab-ui';

// ============================================================================
// Entity List Descriptors
// ============================================================================

export const INGREDIENT_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.AnyIngredient, IngredientId> = {
  getId: (i: LibraryRuntime.AnyIngredient): IngredientId => i.id,
  getLabel: (i: LibraryRuntime.AnyIngredient): string => i.name,
  getSublabel: (i: LibraryRuntime.AnyIngredient): string | undefined =>
    [i.manufacturer, i.category].filter(Boolean).join(' · ') || undefined,
  getStatus: undefined
};

export const FILLING_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.FillingRecipe, FillingId> = {
  getId: (f: LibraryRuntime.FillingRecipe): FillingId => f.id,
  getLabel: (f: LibraryRuntime.FillingRecipe): string => f.name,
  getSublabel: (f: LibraryRuntime.FillingRecipe): string | undefined =>
    [f.entity.category, f.variationCount > 1 ? `${f.variationCount} variations` : undefined]
      .filter(Boolean)
      .join(' · ') || undefined,
  getStatus: undefined
};

export const CONFECTION_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IConfectionBase, ConfectionId> = {
  getId: (c: LibraryRuntime.IConfectionBase): ConfectionId => c.id,
  getLabel: (c: LibraryRuntime.IConfectionBase): string => c.name,
  getSublabel: (c: LibraryRuntime.IConfectionBase): string | undefined =>
    [c.confectionType, c.description].filter(Boolean).join(' · ') || undefined,
  getStatus: undefined
};

export const PROCEDURE_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IProcedure, ProcedureId> = {
  getId: (p: LibraryRuntime.IProcedure): ProcedureId => p.id,
  getLabel: (p: LibraryRuntime.IProcedure): string => p.name,
  getSublabel: (p: LibraryRuntime.IProcedure): string | undefined =>
    [p.category, `${p.stepCount} step${p.stepCount !== 1 ? 's' : ''}`].filter(Boolean).join(' · ') ||
    undefined,
  getStatus: undefined
};

export const TASK_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.ITask, TaskId> = {
  getId: (t: LibraryRuntime.ITask): TaskId => t.id,
  getLabel: (t: LibraryRuntime.ITask): string => t.name,
  getSublabel: (t: LibraryRuntime.ITask): string | undefined =>
    t.requiredVariables.length > 0
      ? `${t.requiredVariables.length} variable${t.requiredVariables.length > 1 ? 's' : ''}`
      : undefined,
  getStatus: undefined
};

export const MOLD_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IMold, MoldId> = {
  getId: (m: LibraryRuntime.IMold): MoldId => m.id,
  getLabel: (m: LibraryRuntime.IMold): string => m.displayName,
  getSublabel: (m: LibraryRuntime.IMold): string | undefined =>
    [m.format, m.description].filter(Boolean).join(' · ') || undefined,
  getStatus: undefined
};

export const DECORATION_DESCRIPTOR: IEntityDescriptor<LibraryRuntime.IDecoration, DecorationId> = {
  getId: (d: LibraryRuntime.IDecoration): DecorationId => d.id,
  getLabel: (d: LibraryRuntime.IDecoration): string => d.name,
  getSublabel: (d: LibraryRuntime.IDecoration): string | undefined =>
    [
      d.description,
      d.ingredients.length > 0
        ? `${d.ingredients.length} ingredient${d.ingredients.length > 1 ? 's' : ''}`
        : undefined
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
  getStatus: undefined
};

// ============================================================================
// Filter Specs
// ============================================================================

export function collectionFromId(id: string): string {
  return id.split('.')[0] ?? id;
}

export const INGREDIENT_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.AnyIngredient> = {
  getSearchText: (i) => [i.name, i.manufacturer, i.category].filter(Boolean).join(' '),
  getCollectionId: (i) => i.collectionId,
  selectionExtractors: {
    collection: (i) => i.collectionId,
    category: (i) => i.category,
    tags: (i) => i.tags ?? []
  }
};

export const FILLING_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.FillingRecipe> = {
  getSearchText: (f) => [f.name, f.entity.category].filter(Boolean).join(' '),
  getCollectionId: (f) => f.collectionId,
  selectionExtractors: {
    collection: (f) => f.collectionId,
    category: (f) => f.entity.category,
    tags: (f) => f.tags ?? []
  }
};

export const CONFECTION_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IConfectionBase> = {
  getSearchText: (c) => [c.name, c.confectionType, c.description].filter(Boolean).join(' '),
  getCollectionId: (c) => c.collectionId,
  selectionExtractors: {
    collection: (c) => c.collectionId,
    category: (c) => c.confectionType,
    tags: (c) => c.tags ?? []
  }
};

export const MOLD_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IMold> = {
  getSearchText: (m) => [m.displayName, m.manufacturer, m.format, m.description].filter(Boolean).join(' '),
  getCollectionId: (m) => m.collectionId,
  selectionExtractors: {
    collection: (m) => m.collectionId,
    shape: (m) => m.format,
    cavities: (m) => String(m.cavityCount)
  }
};

export const PROCEDURE_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IProcedure> = {
  getSearchText: (p) => [p.name, p.category, p.description].filter(Boolean).join(' '),
  getCollectionId: (p) => collectionFromId(p.id),
  selectionExtractors: {
    collection: (p) => collectionFromId(p.id),
    category: (p) => p.category,
    tags: (p) => p.tags ?? []
  }
};

export const TASK_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.ITask> = {
  getSearchText: (t) => [t.name, t.template].filter(Boolean).join(' '),
  getCollectionId: (t) => collectionFromId(t.id),
  selectionExtractors: {
    collection: (t) => collectionFromId(t.id),
    tags: (t) => t.tags ?? []
  }
};

export const DECORATION_FILTER_SPEC: IEntityFilterSpec<LibraryRuntime.IDecoration> = {
  getSearchText: (d) => [d.name, d.description].filter(Boolean).join(' '),
  getCollectionId: (d) => collectionFromId(d.id),
  selectionExtractors: {
    collection: (d) => collectionFromId(d.id),
    tags: (d) => d.tags ?? []
  }
};

// ============================================================================
// Helpers
// ============================================================================

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'unnamed'
  );
}

export const { createBlankIngredientEntity } = Entities.Ingredients;
export const { createBlankMoldEntity } = Entities.Molds;
export const { createBlankRawTaskEntity } = Entities.Tasks;
export const { createBlankRawProcedureEntity } = Entities.Procedures;
export const { createBlankDecorationEntity } = Entities.Decorations;
export const { createBlankFillingRecipeEntity } = Entities.Fillings;
