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
 * Variation selector chips for confection edit view.
 *
 * Renders variation chips with golden-star toggles, inline name editing,
 * remove buttons, and an "Add Variation" form.
 *
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import { EditSection } from '@fgv/ts-app-shell';
import type { ConfectionRecipeVariationSpec, LibraryRuntime } from '@fgv/ts-chocolate';

type EditedConfectionRecipe = LibraryRuntime.EditedConfectionRecipe;

/**
 * Props for VariationChips.
 * @public
 */
export interface IVariationChipsProps {
  /** The recipe wrapper for reading variations and golden spec */
  readonly wrapper: EditedConfectionRecipe;
  /** Currently selected variation spec */
  readonly selectedVariationSpec: ConfectionRecipeVariationSpec;
  /** Whether editing is disabled */
  readonly disabled: boolean;
  /** Callback when user selects a different variation */
  readonly onVariationChange: (spec: ConfectionRecipeVariationSpec) => void;
  /** Callback when golden variation is set */
  readonly onSetGolden: (spec: ConfectionRecipeVariationSpec) => void;
  /** Callback when a variation is removed */
  readonly onRemove: (spec: ConfectionRecipeVariationSpec) => void;
  /** Callback when a variation is renamed */
  readonly onRename: (spec: ConfectionRecipeVariationSpec, name: string) => void;
  /** Callback when a blank variation is created (date, name) */
  readonly onCreateBlank: (date: string | undefined, name: string | undefined) => void;
  /** Callback when current variation is duplicated (date, name) */
  readonly onDuplicate: (date: string | undefined, name: string | undefined) => void;
}

/**
 * Variation selector chips component.
 * @public
 */
export function VariationChips({
  wrapper,
  selectedVariationSpec,
  disabled,
  onVariationChange,
  onSetGolden,
  onRemove,
  onRename,
  onCreateBlank,
  onDuplicate
}: IVariationChipsProps): React.ReactElement {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariationDate, setNewVariationDate] = useState('');
  const [newVariationName, setNewVariationName] = useState('');
  const [editingSpec, setEditingSpec] = useState<ConfectionRecipeVariationSpec | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const handleCommitName = useCallback(
    (spec: ConfectionRecipeVariationSpec, name: string): void => {
      onRename(spec, name);
      setEditingSpec(null);
      setEditingNameValue('');
    },
    [onRename]
  );

  const handleCreateBlank = useCallback((): void => {
    onCreateBlank(newVariationDate || undefined, newVariationName.trim() || undefined);
    setShowAddForm(false);
    setNewVariationDate('');
    setNewVariationName('');
  }, [newVariationDate, newVariationName, onCreateBlank]);

  const handleDuplicate = useCallback((): void => {
    onDuplicate(newVariationDate || undefined, newVariationName.trim() || undefined);
    setShowAddForm(false);
    setNewVariationDate('');
    setNewVariationName('');
  }, [newVariationDate, newVariationName, onDuplicate]);

  return (
    <EditSection title="Variations">
      <div className="flex flex-wrap gap-1.5 items-start">
        {wrapper.variations.map((v) => {
          const isSelected = v.variationSpec === selectedVariationSpec;
          const isGolden = v.variationSpec === wrapper.goldenVariationSpec;
          const canRemove = !disabled && !isGolden && wrapper.variations.length > 1;
          const isEditingName = editingSpec === v.variationSpec;

          return (
            <div
              key={v.variationSpec}
              className={`inline-flex items-center gap-0.5 rounded border text-xs transition-colors ${
                isSelected
                  ? 'bg-choco-primary text-white border-choco-primary'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {/* Golden star toggle */}
              {!disabled && (
                <button
                  type="button"
                  title={isGolden ? 'Golden variation' : 'Set as golden'}
                  onClick={(): void => onSetGolden(v.variationSpec)}
                  className={`pl-1.5 py-1 shrink-0 ${
                    isGolden
                      ? isSelected
                        ? 'text-amber-300'
                        : 'text-amber-500'
                      : isSelected
                      ? 'text-white/40 hover:text-amber-300'
                      : 'text-gray-300 hover:text-amber-400'
                  }`}
                >
                  ★
                </button>
              )}
              {/* Golden star display (read-only) */}
              {disabled && isGolden && (
                <span className={`pl-1.5 py-1 shrink-0 ${isSelected ? 'text-amber-300' : 'text-amber-500'}`}>
                  ★
                </span>
              )}

              {/* Variation label — click to select, double-click to rename */}
              {isEditingName ? (
                <input
                  autoFocus
                  type="text"
                  className="text-xs px-1 py-0.5 w-28 bg-white text-gray-800 border-0 outline-none rounded"
                  value={editingNameValue}
                  onChange={(e): void => setEditingNameValue(e.target.value)}
                  onBlur={(): void => handleCommitName(v.variationSpec, editingNameValue)}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter') handleCommitName(v.variationSpec, editingNameValue);
                    if (e.key === 'Escape') {
                      setEditingSpec(null);
                      setEditingNameValue('');
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={(): void => onVariationChange(v.variationSpec)}
                  onDoubleClick={(): void => {
                    if (!disabled) {
                      setEditingSpec(v.variationSpec);
                      setEditingNameValue(v.name ?? '');
                    }
                  }}
                  className={`px-1.5 py-1 ${isSelected ? '' : 'hover:border-choco-primary'}`}
                  title={!disabled ? 'Click to select, double-click to rename' : undefined}
                >
                  {v.name ?? v.variationSpec}
                </button>
              )}

              {/* Remove button (non-golden only) */}
              {canRemove && (
                <button
                  type="button"
                  title="Remove variation"
                  onClick={(): void => onRemove(v.variationSpec)}
                  className={`pr-1 py-1 shrink-0 ${
                    isSelected ? 'text-white/60 hover:text-white' : 'text-gray-300 hover:text-red-400'
                  }`}
                >
                  ✕
                </button>
              )}
              {!canRemove && !isEditingName && <span className="pr-1" />}
            </div>
          );
        })}

        {/* Add Variation button / form */}
        {!disabled && (
          <>
            {!showAddForm ? (
              <button
                type="button"
                onClick={(): void => setShowAddForm(true)}
                className="px-2.5 py-1 text-xs rounded border border-dashed border-gray-300 text-gray-400 hover:border-choco-primary hover:text-choco-primary transition-colors"
              >
                + New
              </button>
            ) : (
              <div className="w-full mt-1 p-2 rounded border border-gray-200 bg-gray-50 space-y-2">
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-gray-500 shrink-0 w-10">Date</label>
                  <input
                    type="text"
                    placeholder={new Date().toISOString().split('T')[0]}
                    pattern="\d{4}-\d{2}-\d{2}"
                    className="text-xs border border-gray-300 rounded px-1.5 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    value={newVariationDate}
                    onChange={(e): void => setNewVariationDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-gray-500 shrink-0 w-10">Name</label>
                  <input
                    type="text"
                    placeholder="optional label"
                    className="text-xs border border-gray-300 rounded px-1.5 py-0.5 flex-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    value={newVariationName}
                    onChange={(e): void => setNewVariationName(e.target.value)}
                  />
                </div>
                <div className="flex gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={(): void => {
                      setShowAddForm(false);
                      setNewVariationDate('');
                      setNewVariationName('');
                    }}
                    className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateBlank}
                    className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Create Blank
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                  >
                    Duplicate Current
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </EditSection>
  );
}
