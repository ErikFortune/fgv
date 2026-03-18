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
 * Small helper components extracted from FillingEditView to keep the main file under the line limit.
 * @packageDocumentation
 */

import React, { useEffect, useState } from 'react';
import type { IngredientId, IngredientRole, Measurement, SlotId } from '@fgv/ts-chocolate';
import { Validation } from '@fgv/ts-chocolate';

// ============================================================================
// AlternateAddInput Component
// ============================================================================

export function AlternateAddInput({
  ingredientId,
  onAdd,
  datalistId
}: {
  readonly ingredientId: IngredientId;
  readonly onAdd: (producedId: IngredientId, input: string) => void;
  readonly datalistId: string;
}): React.ReactElement {
  const [value, setValue] = useState('');

  const commit = (v: string): void => {
    if (v.trim()) {
      onAdd(ingredientId, v);
      setValue('');
    }
  };

  return (
    <input
      type="text"
      className="text-xs border border-dashed border-border rounded px-1.5 py-0.5 w-32 text-muted placeholder-muted focus:outline-none focus:ring-1 focus:ring-focus-ring focus:border-focus-ring"
      value={value}
      list={datalistId}
      placeholder="+ add alternate"
      onChange={(e): void => setValue(e.target.value)}
      onBlur={(): void => commit(value)}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          commit(value);
        }
      }}
    />
  );
}

// ============================================================================
// ProcedureAlternateAddInput Component
// ============================================================================

export function ProcedureAlternateAddInput({
  onAdd,
  datalistId
}: {
  readonly onAdd: (input: string) => void;
  readonly datalistId: string;
}): React.ReactElement {
  const [value, setValue] = useState('');

  const commit = (v: string): void => {
    if (v.trim()) {
      onAdd(v);
      setValue('');
    }
  };

  return (
    <input
      type="text"
      className="text-xs border border-dashed border-border rounded px-1.5 py-0.5 w-32 text-muted placeholder-muted focus:outline-none focus:ring-1 focus:ring-focus-ring focus:border-focus-ring"
      value={value}
      list={datalistId}
      placeholder="+ add alternate"
      onChange={(e): void => setValue(e.target.value)}
      onBlur={(): void => commit(value)}
      onKeyDown={(e): void => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          commit(value);
        }
      }}
    />
  );
}

// ============================================================================
// IngredientRoleInput Component
// ============================================================================

export function IngredientRoleInput({
  value,
  index,
  onChange
}: {
  readonly value: IngredientRole | undefined;
  readonly index: number;
  readonly onChange: (index: number, role: IngredientRole | undefined) => void;
}): React.ReactElement {
  const [draft, setDraft] = useState<string>(value ?? '');
  const [error, setError] = useState<string | undefined>();

  // Sync draft when external value changes (e.g. undo/redo)
  useEffect(() => {
    setDraft(value ?? '');
    setError(undefined);
  }, [value]);

  const commit = (v: string): void => {
    const trimmed = v.trim();
    if (!trimmed) {
      setError(undefined);
      onChange(index, undefined);
      return;
    }
    const result = Validation.toIngredientRole(trimmed);
    if (result.isSuccess()) {
      setError(undefined);
      onChange(index, result.value);
    } else {
      setError('kebab-case only (e.g. heated, ganache-base)');
    }
  };

  return (
    <span className="inline-flex flex-col">
      <input
        type="text"
        className={`w-28 text-xs border rounded px-1.5 py-0.5 text-secondary placeholder-muted focus:outline-none focus:ring-1 focus:ring-focus-ring focus:border-focus-ring ${
          error ? 'border-red-300' : 'border-border'
        }`}
        value={draft}
        placeholder="e.g. heated"
        onChange={(e): void => setDraft(e.target.value)}
        onBlur={(): void => commit(draft)}
        onKeyDown={(e): void => {
          if (e.key === 'Enter') {
            commit(draft);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {error && <span className="text-[10px] text-red-500 mt-0.5">{error}</span>}
    </span>
  );
}

// ============================================================================
// DuplicateIngredientPrompt Component
// ============================================================================

export interface IPendingDuplicate {
  readonly ingredientId: IngredientId;
  readonly ingredientName: string;
  /** Base ingredient ID (after the dot), used for deriving slotIds */
  readonly baseIngredientId: string;
  readonly existingIndex: number;
  readonly existingSlotId: SlotId | undefined;
  readonly existingRole: IngredientRole | undefined;
  readonly existingAmount: Measurement;
}

export interface IDuplicateConfirmResult {
  readonly existingRole: IngredientRole | undefined;
  readonly existingSlotId: string;
  readonly newRole: IngredientRole | undefined;
  readonly newSlotId: string;
}

/**
 * Derives a slotId from a role and base ingredient ID.
 * If role is set: `${role}-${baseId}`, otherwise `${baseId}-${count}`.
 */
function deriveSlotId(role: string, baseId: string, fallback: string): string {
  const trimmed = role.trim();
  if (trimmed) {
    return `${trimmed}-${baseId}`;
  }
  return fallback;
}

export function DuplicateIngredientPrompt({
  pending,
  onConfirm,
  onCancel
}: {
  readonly pending: IPendingDuplicate;
  readonly onConfirm: (result: IDuplicateConfirmResult) => void;
  readonly onCancel: () => void;
}): React.ReactElement {
  const baseId = pending.baseIngredientId;

  // Role inputs (primary user input)
  const [existingRole, setExistingRole] = useState(pending.existingRole ?? '');
  const [newRole, setNewRole] = useState('');

  // SlotId inputs (derived from role, but user can override)
  const [existingSlotIdOverride, setExistingSlotIdOverride] = useState('');
  const [newSlotIdOverride, setNewSlotIdOverride] = useState('');
  const [showSlotIds, setShowSlotIds] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Compute effective slotIds: override > derived from role > fallback
  const effectiveExistingSlotId = pending.existingSlotId
    ? String(pending.existingSlotId)
    : existingSlotIdOverride.trim() || deriveSlotId(existingRole, baseId, `${baseId}-1`);
  const effectiveNewSlotId = newSlotIdOverride.trim() || deriveSlotId(newRole, baseId, `${baseId}-2`);

  const handleConfirm = (): void => {
    if (effectiveExistingSlotId === effectiveNewSlotId) {
      setError('Slot IDs must be different — adjust a role or override the slot ID');
      return;
    }
    // Validate roles (if provided)
    if (existingRole.trim()) {
      const result = Validation.toIngredientRole(existingRole.trim());
      if (result.isFailure()) {
        setError('Existing role: kebab-case only (e.g. heated, ganache-base)');
        return;
      }
    }
    if (newRole.trim()) {
      const result = Validation.toIngredientRole(newRole.trim());
      if (result.isFailure()) {
        setError('New role: kebab-case only (e.g. heated, ganache-base)');
        return;
      }
    }
    // Validate slotIds
    const existingSlotResult = Validation.toSlotId(effectiveExistingSlotId);
    const newSlotResult = Validation.toSlotId(effectiveNewSlotId);
    if (existingSlotResult.isFailure()) {
      setError(`Existing slot ID "${effectiveExistingSlotId}": ${existingSlotResult.message}`);
      return;
    }
    if (newSlotResult.isFailure()) {
      setError(`New slot ID "${effectiveNewSlotId}": ${newSlotResult.message}`);
      return;
    }
    setError(undefined);
    const validatedExistingRole = existingRole.trim()
      ? Validation.toIngredientRole(existingRole.trim()).orThrow()
      : undefined;
    const validatedNewRole = newRole.trim()
      ? Validation.toIngredientRole(newRole.trim()).orThrow()
      : undefined;
    onConfirm({
      existingRole: validatedExistingRole,
      existingSlotId: effectiveExistingSlotId,
      newRole: validatedNewRole,
      newSlotId: effectiveNewSlotId
    });
  };

  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-3 space-y-2">
      <p className="text-xs text-amber-800 font-medium">
        Duplicate ingredient: {pending.ingredientName} already exists
        {pending.existingAmount > 0 ? ` (${pending.existingAmount}g)` : ''}. Assign a role to each to
        distinguish them.
      </p>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center">
        <label className="text-xs text-secondary">Existing role:</label>
        <input
          type="text"
          className="text-xs border border-border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-focus-ring"
          value={existingRole}
          disabled={!!pending.existingSlotId}
          autoFocus={!pending.existingSlotId}
          onChange={(e): void => setExistingRole(e.target.value)}
          placeholder="e.g. heated"
        />
        <label className="text-xs text-secondary">New role:</label>
        <input
          type="text"
          className="text-xs border border-border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-focus-ring"
          value={newRole}
          autoFocus={!!pending.existingSlotId}
          onChange={(e): void => setNewRole(e.target.value)}
          placeholder="e.g. cold"
          onKeyDown={(e): void => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted">
          slot IDs: {effectiveExistingSlotId}, {effectiveNewSlotId}
        </span>
        <button
          type="button"
          className="text-[10px] text-brand-primary hover:underline"
          onClick={(): void => setShowSlotIds(!showSlotIds)}
        >
          {showSlotIds ? 'hide' : 'override'}
        </button>
      </div>
      {showSlotIds && (
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center">
          <label className="text-[10px] text-muted">Existing slot ID:</label>
          <input
            type="text"
            className="text-xs border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-focus-ring"
            value={existingSlotIdOverride}
            disabled={!!pending.existingSlotId}
            placeholder={effectiveExistingSlotId}
            onChange={(e): void => setExistingSlotIdOverride(e.target.value)}
          />
          <label className="text-[10px] text-muted">New slot ID:</label>
          <input
            type="text"
            className="text-xs border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-focus-ring"
            value={newSlotIdOverride}
            placeholder={effectiveNewSlotId}
            onChange={(e): void => setNewSlotIdOverride(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-0.5 text-xs text-secondary border border-border rounded hover:bg-hover"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-2 py-0.5 text-xs rounded bg-brand-primary text-inverted hover:bg-brand-primary/90"
        >
          Add Duplicate
        </button>
      </div>
    </div>
  );
}
