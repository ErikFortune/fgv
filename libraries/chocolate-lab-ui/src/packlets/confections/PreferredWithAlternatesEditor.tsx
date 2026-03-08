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
 * Generic "preferred + alternates" editor for confection edit view.
 *
 * Renders a primary card showing the preferred option, an "also:" row with
 * alternate chips (★ to set preferred, ✕ to remove), and an add-input.
 * Used for molds, shell chocolate, enrobing chocolate, coatings, procedures,
 * and decorations.
 *
 * @packageDocumentation
 */

import React from 'react';
import { EditSection } from '@fgv/ts-app-shell';

/**
 * Props for PreferredWithAlternatesEditor.
 * @public
 */
export interface IPreferredWithAlternatesEditorProps<TId extends string = string> {
  /** Section title */
  readonly title: string;
  /** The preferred item id (undefined if nothing set) */
  readonly preferredId: TId | undefined;
  /** All alternate item ids (excluding the preferred) */
  readonly alternateIds: ReadonlyArray<TId>;
  /** Resolve an id to a display name */
  readonly getDisplayName: (id: TId) => string;
  /** Whether editing is disabled */
  readonly disabled: boolean;
  /** Datalist id for typeahead suggestions */
  readonly datalistId: string;
  /** Placeholder for the "change preferred" input */
  readonly changePlaceholder: string;
  /** Placeholder for the "add alternate" input */
  readonly addPlaceholder: string;
  /** Called when the preferred item should change (new input committed) */
  readonly onChangePreferred?: (input: string) => void;
  /** Called when an alternate is promoted to preferred */
  readonly onSetPreferred?: (id: TId) => void;
  /** Called when an item should be removed */
  readonly onRemove?: (id: TId) => void;
  /** Called to add an alternate */
  readonly onAddAlternate?: (input: string) => void;
  /** Called when the preferred should be cleared entirely */
  readonly onClear?: () => void;
  /** Whether to show the clear button on the preferred card */
  readonly showClear?: boolean;
}

/**
 * Generic preferred + alternates editor.
 * @public
 */
export function PreferredWithAlternatesEditor<TId extends string = string>({
  title,
  preferredId,
  alternateIds,
  getDisplayName,
  disabled,
  datalistId,
  changePlaceholder,
  addPlaceholder,
  onChangePreferred,
  onSetPreferred,
  onRemove,
  onAddAlternate,
  onClear,
  showClear = false
}: IPreferredWithAlternatesEditorProps<TId>): React.ReactElement {
  const handleBlurOrEnter = (
    handler: ((input: string) => void) | undefined,
    e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const target = e.target as HTMLInputElement;
    if ('key' in e && e.key !== 'Enter') return;
    handler?.(target.value);
    target.value = '';
  };

  return (
    <EditSection title={title}>
      {preferredId ? (
        <div className="rounded border border-gray-200 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">{getDisplayName(preferredId)}</span>
            {!disabled && showClear && onClear && (
              <button type="button" onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">
                ✕
              </button>
            )}
            {!disabled && !showClear && onRemove && (
              <button
                type="button"
                onClick={(): void => onRemove(preferredId)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
          {!disabled && onChangePreferred && (
            <input
              type="text"
              placeholder={changePlaceholder}
              className="text-xs border border-dashed border-gray-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
              list={datalistId}
              onBlur={(e): void => handleBlurOrEnter(onChangePreferred, e)}
              onKeyDown={(e): void => handleBlurOrEnter(onChangePreferred, e)}
            />
          )}
          {(alternateIds.length > 0 || !disabled) && (
            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
              <span className="text-xs text-gray-400 shrink-0">also:</span>
              {alternateIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600"
                >
                  {!disabled && onSetPreferred && (
                    <button
                      type="button"
                      title="Set as preferred"
                      onClick={(): void => onSetPreferred(id)}
                      className="text-gray-300 hover:text-amber-400 shrink-0"
                    >
                      ★
                    </button>
                  )}
                  <span>{getDisplayName(id)}</span>
                  {!disabled && onRemove && (
                    <button
                      type="button"
                      title="Remove"
                      onClick={(): void => onRemove(id)}
                      className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
              {!disabled && onAddAlternate && (
                <input
                  type="text"
                  placeholder={addPlaceholder}
                  className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                  list={datalistId}
                  onBlur={(e): void => handleBlurOrEnter(onAddAlternate, e)}
                  onKeyDown={(e): void => handleBlurOrEnter(onAddAlternate, e)}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        !disabled &&
        onChangePreferred && (
          <input
            type="text"
            placeholder={changePlaceholder}
            className="text-xs border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
            list={datalistId}
            onBlur={(e): void => handleBlurOrEnter(onChangePreferred, e)}
            onKeyDown={(e): void => handleBlurOrEnter(onChangePreferred, e)}
          />
        )
      )}
    </EditSection>
  );
}
