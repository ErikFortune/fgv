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
 * Cascade panel for viewing a produced filling session snapshot.
 * @packageDocumentation
 */

import React, { useCallback } from 'react';

import type {
  Entities,
  FillingId,
  FillingRecipeVariationSpec,
  IngredientId,
  ProcedureId
} from '@fgv/ts-chocolate';
import { EntityDetailHeader, copyJsonToClipboard } from '../common';
import { ProducedFillingContent } from './ProducedFillingContent';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the ProducedFillingDetail cascade panel.
 * @public
 */
export interface IProducedFillingDetailProps {
  /** The produced filling snapshot to display */
  readonly produced: Entities.Fillings.IProducedFillingEntity;
  /** Human-readable filling recipe name for the header */
  readonly fillingName: string;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
  /** Optional callback to browse an ingredient in a cascade detail panel */
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
  /** Optional callback to browse a procedure in a cascade detail panel */
  readonly onBrowseProcedure?: (procedureId: ProcedureId) => void;
  /** Optional callback to open the source filling recipe at a specific variation */
  readonly onOpenFillingRecipe?: (fillingId: FillingId, variationSpec: FillingRecipeVariationSpec) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only cascade panel for a produced filling session snapshot.
 *
 * Wraps {@link ProducedFillingContent} with a header and close button,
 * suitable for display in a cascade column.
 *
 * @public
 */
export function ProducedFillingDetail({
  produced,
  fillingName,
  onClose,
  onBrowseIngredient,
  onBrowseProcedure,
  onOpenFillingRecipe
}: IProducedFillingDetailProps): React.ReactElement {
  const handleCopyJson = useCallback((): void => {
    copyJsonToClipboard(produced);
  }, [produced]);

  return (
    <div className="flex flex-col p-4 overflow-y-auto">
      <EntityDetailHeader
        title={fillingName}
        badge={{ label: 'Filling Session', colorClass: 'bg-green-100 text-green-800' }}
        onCopyJson={handleCopyJson}
        onClose={onClose}
      />

      <div className="flex flex-col gap-4">
        <ProducedFillingContent
          produced={produced}
          onBrowseIngredient={onBrowseIngredient}
          onBrowseProcedure={onBrowseProcedure}
          onOpenFillingRecipe={onOpenFillingRecipe}
        />
      </div>
    </div>
  );
}
