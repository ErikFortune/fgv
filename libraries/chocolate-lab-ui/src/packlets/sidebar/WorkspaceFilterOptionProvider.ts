/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Workspace-aware filter option provider.
 *
 * Scans workspace data to build filter options with counts for each tab/filter key.
 *
 * @packageDocumentation
 */

import type { IFilterOption } from '@fgv/ts-app-shell';
import type { LibraryRuntime } from '@fgv/ts-chocolate';

import { type AppTab } from '../navigation';
import { type IFilterOptionProvider } from './TabSidebar';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Collects unique values from an iterable, counting occurrences.
 * Returns sorted IFilterOption array.
 */
function collectOptions(values: Iterable<string | undefined>): ReadonlyArray<IFilterOption<string>> {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (v !== undefined && v !== '') {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({ value, label: value, count }));
}

/**
 * Flattens tag arrays from entities into a single iterable of tag strings.
 */
function* flatTags<T extends { readonly tags?: ReadonlyArray<string> }>(
  entities: Iterable<T>
): Iterable<string | undefined> {
  for (const e of entities) {
    if (e.tags) {
      for (const tag of e.tags) {
        yield tag;
      }
    }
  }
}

// ============================================================================
// Per-Tab Option Extractors
// ============================================================================

type OptionExtractor = (data: LibraryRuntime.ChocolateLibrary) => ReadonlyArray<IFilterOption<string>>;

function ingredientOptions(key: string): OptionExtractor | undefined {
  switch (key) {
    case 'category':
      return (data) => collectOptions(Array.from(data.ingredients.values()).map((i) => i.category));
    case 'tags':
      return (data) => collectOptions(flatTags(Array.from(data.ingredients.values())));
    case 'collection':
      return (data) => collectOptions(Array.from(data.ingredients.values()).map((i) => i.collectionId));
    default:
      return undefined;
  }
}

function fillingOptions(key: string): OptionExtractor | undefined {
  switch (key) {
    case 'category':
      return (data) => collectOptions(Array.from(data.fillings.values()).map((f) => f.entity.category));
    case 'tags':
      return (data) => collectOptions(flatTags(Array.from(data.fillings.values())));
    case 'collection':
      return (data) => collectOptions(Array.from(data.fillings.values()).map((f) => f.collectionId));
    default:
      return undefined;
  }
}

function confectionOptions(key: string): OptionExtractor | undefined {
  switch (key) {
    case 'category':
      return (data) => collectOptions(Array.from(data.confections.values()).map((c) => c.confectionType));
    case 'tags':
      return (data) => collectOptions(flatTags(Array.from(data.confections.values())));
    case 'collection':
      return (data) => collectOptions(Array.from(data.confections.values()).map((c) => c.collectionId));
    default:
      return undefined;
  }
}

function moldOptions(key: string): OptionExtractor | undefined {
  switch (key) {
    case 'shape':
      return (data) => collectOptions(Array.from(data.molds.values()).map((m) => m.format));
    case 'cavities':
      return (data) => collectOptions(Array.from(data.molds.values()).map((m) => String(m.cavityCount)));
    case 'collection':
      return (data) => collectOptions(Array.from(data.molds.values()).map((m) => m.collectionId));
    default:
      return undefined;
  }
}

function procedureOptions(key: string): OptionExtractor | undefined {
  switch (key) {
    case 'category':
      return (data) => collectOptions(Array.from(data.procedures.values()).map((p) => p.category));
    case 'tags':
      return (data) => collectOptions(flatTags(Array.from(data.procedures.values())));
    case 'collection':
      return (data) => collectOptions(Array.from(data.procedures.values()).map((p) => p.id.split('.')[0]));
    default:
      return undefined;
  }
}

function decorationOptions(key: string): OptionExtractor | undefined {
  switch (key) {
    case 'tags':
      return (data) => collectOptions(flatTags(Array.from(data.decorations.values())));
    case 'collection':
      return (data) => collectOptions(Array.from(data.decorations.values()).map((d) => d.id.split('.')[0]));
    default:
      return undefined;
  }
}

function taskOptions(key: string): OptionExtractor | undefined {
  switch (key) {
    case 'category':
      // Tasks don't have a category field, but we include it for future use
      return () => [];
    case 'tags':
      return (data) => collectOptions(flatTags(Array.from(data.tasks.values())));
    case 'collection':
      return (data) => collectOptions(Array.from(data.tasks.values()).map((t) => t.id.split('.')[0]));
    default:
      return undefined;
  }
}

function getExtractor(tab: AppTab, key: string): OptionExtractor | undefined {
  switch (tab) {
    case 'ingredients':
      return ingredientOptions(key);
    case 'fillings':
      return fillingOptions(key);
    case 'confections':
      return confectionOptions(key);
    case 'decorations':
      return decorationOptions(key);
    case 'molds':
      return moldOptions(key);
    case 'procedures':
      return procedureOptions(key);
    case 'tasks':
      return taskOptions(key);
    default:
      return undefined;
  }
}

// ============================================================================
// WorkspaceFilterOptionProvider
// ============================================================================

/**
 * Filter option provider that scans workspace data to build filter options with counts.
 *
 * @public
 */
export class WorkspaceFilterOptionProvider implements IFilterOptionProvider {
  private readonly _data: LibraryRuntime.ChocolateLibrary;

  public constructor(data: LibraryRuntime.ChocolateLibrary) {
    this._data = data;
  }

  public getOptions(tab: AppTab, filterKey: string): ReadonlyArray<IFilterOption<string>> {
    const extractor = getExtractor(tab, filterKey);
    if (!extractor) {
      return [];
    }
    return extractor(this._data);
  }
}
