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

import * as yaml from 'yaml';
import {
  ICategorizedNote,
  ICategorizedUrl,
  IOptionsWithPreferred,
  IRefWithNotes,
  SourceId
} from '@fgv/ts-chocolate';

import { OutputFormat } from './types';

/**
 * ID separator for composite IDs
 */
const ID_SEPARATOR: string = '.';

// ============================================================================
// Generic Formatting Utilities
// ============================================================================

/**
 * Formats a number with a specified precision
 */
export function formatNumber(value: number, precision: number = 1): string {
  return value.toFixed(precision);
}

/**
 * Converts categorized notes to a single string for display
 */
export function formatCategorizedNotes(
  notes: ReadonlyArray<ICategorizedNote> | undefined,
  separator: string = '; '
): string | undefined {
  if (!notes || notes.length === 0) {
    return undefined;
  }
  return notes.map((n) => n.note).join(separator);
}

/**
 * Pads a string to a given length
 */
export function padRight(str: string, length: number): string {
  return str.padEnd(length);
}

/**
 * Extracts source ID from a composite ID (sourceId.baseId format)
 */
export function getSourceIdFromCompositeId(compositeId: string): SourceId {
  const dotIndex = compositeId.indexOf(ID_SEPARATOR);
  if (dotIndex === -1) {
    return compositeId as SourceId;
  }
  return compositeId.substring(0, dotIndex) as SourceId;
}

/**
 * Formats URLs for human output
 */
export function formatUrls(urls: ReadonlyArray<ICategorizedUrl>, lines: string[]): void {
  lines.push('');
  lines.push('URLs:');
  for (const url of urls) {
    lines.push(`  [${url.category}] ${url.url}`);
  }
}

/**
 * Formats tags for display
 */
export function formatTags(tags: ReadonlyArray<string> | undefined): string {
  return tags?.join(', ') ?? '';
}

/**
 * Gets the preferred ID from an IOptionsWithPreferred structure.
 * Returns preferredId if set, otherwise the first option's ID.
 */
export function getPreferredId<TOption extends { id: TId }, TId extends string>(
  options: IOptionsWithPreferred<TOption, TId>
): TId | undefined {
  if (options.preferredId) {
    return options.preferredId;
  }
  return options.options.length > 0 ? options.options[0].id : undefined;
}

/**
 * Formats options with preferred IDs for display
 */
export function formatOptionsWithPreferred<TId extends string>(
  options: IOptionsWithPreferred<IRefWithNotes<TId>, TId>,
  lines: string[],
  label: string
): void {
  const preferredId = getPreferredId(options);

  lines.push('');
  lines.push(`${label}:`);

  for (const ref of options.options) {
    const isPreferred = ref.id === preferredId;
    const preferredMarker = isPreferred ? ' (preferred)' : '';
    const notes = ref.notes ? ` - ${ref.notes}` : '';
    lines.push(`  ${ref.id}${preferredMarker}${notes}`);
  }
}

// ============================================================================
// Generic List Item Interface
// ============================================================================

/**
 * Generic interface for list items with common fields
 */
export interface IGenericListItem {
  id: string;
  name: string;
  sourceId: SourceId;
  description?: string;
  tags?: ReadonlyArray<string>;
}

/**
 * Column configuration for table output
 */
export interface IColumnConfig {
  header: string;
  getValue: (item: IGenericListItem) => string;
  minWidth?: number;
}

// ============================================================================
// Generic List Formatting
// ============================================================================

/**
 * Formats a generic list as human-readable output with dynamic columns
 */
export function formatGenericListHuman<T extends IGenericListItem>(
  items: T[],
  entityName: string,
  columns: IColumnConfig[]
): string {
  if (items.length === 0) {
    return `No ${entityName}s found.`;
  }

  const lines: string[] = [];
  lines.push(`Found ${items.length} ${entityName}(s):\n`);

  // Calculate column widths
  const widths = columns.map((col) => {
    const values = items.map((item) => col.getValue(item).length);
    const headerLen = col.header.length;
    return Math.max(col.minWidth ?? 0, headerLen, ...values);
  });

  // Header
  const headerLine = columns.map((col, i) => padRight(col.header, widths[i])).join('  ');
  lines.push(headerLine);
  lines.push(columns.map((_, i) => '-'.repeat(widths[i])).join('  '));

  // Data rows
  for (const item of items) {
    const row = columns.map((col, i) => padRight(col.getValue(item), widths[i])).join('  ');
    lines.push(row);
  }

  return lines.join('\n');
}

/**
 * Formats a generic list as table output
 */
export function formatGenericListTable<T extends IGenericListItem>(
  items: T[],
  entityName: string,
  columns: IColumnConfig[]
): string {
  if (items.length === 0) {
    return `No ${entityName}s found.`;
  }

  const lines: string[] = [];

  // Calculate column widths
  const widths = columns.map((col) => {
    const values = items.map((item) => col.getValue(item).length);
    const headerLen = col.header.length;
    return Math.max(col.minWidth ?? 0, headerLen, ...values);
  });

  // Header with pipe separators
  const headerLine = columns.map((col, i) => padRight(col.header, widths[i])).join(' | ');
  lines.push(headerLine);
  lines.push(columns.map((_, i) => '-'.repeat(widths[i])).join('-+-'));

  // Data rows
  for (const item of items) {
    const row = columns.map((col, i) => padRight(col.getValue(item), widths[i])).join(' | ');
    lines.push(row);
  }

  return lines.join('\n');
}

/**
 * Formats a list for output based on format type
 */
export function formatList<T extends IGenericListItem>(
  items: T[],
  format: OutputFormat,
  entityName: string,
  columns: IColumnConfig[]
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(items, null, 2);
    case 'yaml':
      return yaml.stringify(items);
    case 'table':
      return formatGenericListTable(items, entityName, columns);
    case 'human':
    default:
      return formatGenericListHuman(items, entityName, columns);
  }
}

/**
 * Formats an entity for JSON/YAML output
 */
export function formatEntityData<T>(entity: T, format: 'json' | 'yaml'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(entity, null, 2);
    case 'yaml':
      return yaml.stringify(entity);
  }
}
