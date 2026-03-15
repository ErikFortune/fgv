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
 * Type-dispatching session detail view.
 * Routes to specialized panels based on session type.
 * @packageDocumentation
 */

import React from 'react';
import {
  type DecorationId,
  type FillingId,
  type FillingRecipeVariationSpec,
  type IngredientId,
  type MoldId,
  type ProcedureId,
  type SessionId,
  type SlotId,
  UserLibrary
} from '@fgv/ts-chocolate';

import type { CascadeEntityType } from '../navigation';
import { ConfectionSessionPanel } from './ConfectionSessionPanel';
import { FillingSessionPanel, type RecipeSwapHandler } from './FillingSessionPanel';
import { GenericSessionDetailView } from './GenericSessionDetailView';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the SessionDetailView component.
 * @public
 */
export interface ISessionDetailViewProps {
  /** The composite session ID */
  readonly sessionId: SessionId;
  /** The materialized session to display */
  readonly session: UserLibrary.AnyMaterializedSession;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
  /** Optional callback to request creating a new entity via cascade */
  readonly onRequestCreateEntity?: (entityType: CascadeEntityType, prefillName: string) => void;
  /** Optional callback when user requests a recipe or variation swap */
  readonly onRecipeSwap?: RecipeSwapHandler;
  /** Optional callback to open the current filling recipe in a cascade browser panel */
  readonly onOpenFillingRecipe?: (fillingId: FillingId, variationSpec: FillingRecipeVariationSpec) => void;
  /** Optional callback to browse an ingredient in a cascade detail panel */
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
  /** Optional callback to browse a procedure in a cascade detail panel */
  readonly onBrowseProcedure?: (procedureId: ProcedureId) => void;
  /** Optional callback to browse a mold in a cascade detail panel */
  readonly onBrowseMold?: (moldId: MoldId) => void;
  /** Optional callback to browse a decoration in a cascade detail panel */
  readonly onBrowseDecoration?: (decorationId: DecorationId) => void;
  /** Optional callback when user selects a filling slot in a confection session */
  readonly onSelectFillingSlot?: (slotId: SlotId, label: string) => void;
  /** Optional callback to open the commit dialog for this session */
  readonly onCommit?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Type-dispatching detail view for materialized editing sessions.
 *
 * Routes to specialized panels based on session type:
 * - Filling sessions → {@link FillingSessionPanel}
 * - Other session types → {@link GenericSessionDetailView} (fallback)
 *
 * @public
 */
export function SessionDetailView({
  sessionId,
  session,
  onClose,
  onRequestCreateEntity,
  onRecipeSwap,
  onOpenFillingRecipe,
  onBrowseIngredient,
  onBrowseProcedure,
  onBrowseMold,
  onBrowseDecoration,
  onSelectFillingSlot,
  onCommit
}: ISessionDetailViewProps): React.ReactElement {
  if (session.sessionType === 'filling') {
    return (
      <FillingSessionPanel
        sessionId={sessionId}
        session={session as UserLibrary.Session.EditingSession}
        onClose={onClose}
        onRequestCreateEntity={onRequestCreateEntity}
        onRecipeSwap={onRecipeSwap}
        onOpenFillingRecipe={onOpenFillingRecipe}
        onBrowseIngredient={onBrowseIngredient}
        onBrowseProcedure={onBrowseProcedure}
        onCommit={onCommit}
      />
    );
  }

  if (session.sessionType === 'confection') {
    return (
      <ConfectionSessionPanel
        sessionId={sessionId}
        session={session as UserLibrary.Session.AnyConfectionEditingSession}
        onClose={onClose}
        onSelectFillingSlot={onSelectFillingSlot}
        onBrowseIngredient={onBrowseIngredient}
        onBrowseProcedure={onBrowseProcedure}
        onBrowseMold={onBrowseMold}
        onBrowseDecoration={onBrowseDecoration}
        onCommit={onCommit}
      />
    );
  }

  return <GenericSessionDetailView sessionId={sessionId} session={session} onClose={onClose} />;
}
