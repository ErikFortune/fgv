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

import { search } from '@inquirer/prompts';
import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';

/**
 * Interface for items that can be selected interactively
 */
export interface ISelectableItem {
  /**
   * Unique identifier for the item
   */
  id: string;

  /**
   * Display name for the item
   */
  name: string;

  /**
   * Optional description shown alongside the name
   */
  description?: string;
}

/**
 * Configuration for interactive selection
 */
export interface IInteractiveSelectConfig<T extends ISelectableItem> {
  /**
   * Items to select from
   */
  items: T[];

  /**
   * Prompt message to display
   */
  prompt: string;

  /**
   * Optional function to format the display name
   */
  formatName?: (item: T) => string;
}

/**
 * Result of interactive selection
 */
export type InteractiveSelectResult<T extends ISelectableItem> = Result<T | 'cancelled'>;

/**
 * Default name formatter
 */
function defaultFormatName<T extends ISelectableItem>(item: T): string {
  const description = item.description ? ` - ${item.description}` : '';
  return `${item.id}${description}`;
}

/**
 * Interactively select an item from a list using search/filter
 *
 * @param config - Configuration for the selection
 * @returns Result with the selected item, 'cancelled' if user cancelled, or error
 */
export async function interactiveSelect<T extends ISelectableItem>(
  config: IInteractiveSelectConfig<T>
): Promise<InteractiveSelectResult<T>> {
  const { items, prompt, formatName = defaultFormatName } = config;

  if (items.length === 0) {
    return fail('No items available for selection');
  }

  // Build search source function
  const searchSource = async (
    term: string | undefined
  ): Promise<Array<{ name: string; value: string; description?: string }>> => {
    const searchTerm = (term ?? '').toLowerCase();

    return items
      .filter((item) => {
        if (!searchTerm) {
          return true;
        }
        const searchable = `${item.id} ${item.name} ${item.description ?? ''}`.toLowerCase();
        return searchable.includes(searchTerm);
      })
      .map((item) => ({
        name: formatName(item),
        value: item.id,
        description: item.name !== item.id ? item.name : undefined
      }));
  };

  try {
    const selectedId = await search({
      message: prompt,
      source: searchSource,
      pageSize: 15
    });

    // Find the selected item
    const selectedItem = items.find((item) => item.id === selectedId);
    if (!selectedItem) {
      return fail(`Selected item not found: ${selectedId}`);
    }

    return succeed(selectedItem);
  } catch (error) {
    // Handle user cancellation (Ctrl+C, Escape)
    return captureResult(() => {
      const err = error as Error;
      if (err.name === 'ExitPromptError' || err.message?.includes('User force closed')) {
        return 'cancelled' as const;
      }
      throw error;
    });
  }
}

/**
 * Format a list item for display in the interactive selector
 * with consistent formatting across entity types
 */
export function formatSelectableItem<T extends ISelectableItem>(item: T, extraInfo?: string): string {
  const extra = extraInfo ? ` [${extraInfo}]` : '';
  return `${item.id}${extra}`;
}
