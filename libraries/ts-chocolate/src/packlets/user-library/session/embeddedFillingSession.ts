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

/**
 * Embedded filling session wrapper for parent-owned (confection) editing state.
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import { IngredientId, Measurement, MeasurementUnit, Model as CommonModel, ProcedureId } from '../../common';
import { Fillings } from '../../entities';

import { EditingSession } from './editingSession';
import { IEmbeddableFillingSession, ISaveAnalysis } from './model';

/**
 * Identity-free wrapper over a standalone filling editing session.
 *
 * This class intentionally does not expose session identity or persistence APIs.
 * Mutations notify an optional parent callback so parent sessions can mark
 * themselves dirty and own save orchestration.
 *
 * @public
 */
export class EmbeddedFillingSession implements IEmbeddableFillingSession {
  private readonly _session: EditingSession;
  private readonly _onMutation: (() => void) | undefined;

  /**
   * Creates an EmbeddedFillingSession wrapping an existing EditingSession.
   * @param session - Standalone session to wrap
   * @param onMutation - Optional callback when a mutation succeeds
   */
  public constructor(session: EditingSession, onMutation?: () => void) {
    this._session = session;
    this._onMutation = onMutation;
  }

  /**
   * Returns the underlying standalone session.
   * Intended for transitional code paths only.
   * @internal
   */
  public get standaloneSession(): EditingSession {
    return this._session;
  }

  public get baseRecipe(): EditingSession['baseRecipe'] {
    return this._session.baseRecipe;
  }

  public get produced(): EditingSession['produced'] {
    return this._session.produced;
  }

  public get targetWeight(): Measurement {
    return this._session.targetWeight;
  }

  public get hasChanges(): boolean {
    return this._session.hasChanges;
  }

  public setIngredient(
    id: IngredientId,
    amount: Measurement,
    unit?: MeasurementUnit,
    modifiers?: Fillings.IIngredientModifiers
  ): Result<void> {
    return this._session.setIngredient(id, amount, unit, modifiers).onSuccess(() => {
      this._notifyMutation();
      return succeed(undefined);
    });
  }

  public replaceIngredient(
    oldId: IngredientId,
    newId: IngredientId,
    amount: Measurement,
    unit?: MeasurementUnit,
    modifiers?: Fillings.IIngredientModifiers
  ): Result<void> {
    return this._session.replaceIngredient(oldId, newId, amount, unit, modifiers).onSuccess(() => {
      this._notifyMutation();
      return succeed(undefined);
    });
  }

  public removeIngredient(id: IngredientId): Result<void> {
    return this._session.removeIngredient(id).onSuccess(() => {
      this._notifyMutation();
      return succeed(undefined);
    });
  }

  public scaleToTargetWeight(targetWeight: Measurement): Result<Measurement> {
    return this._session.scaleToTargetWeight(targetWeight).onSuccess((actualWeight) => {
      this._notifyMutation();
      return succeed(actualWeight);
    });
  }

  public setNotes(notes: CommonModel.ICategorizedNote[]): Result<void> {
    return this._session.setNotes(notes).onSuccess(() => {
      this._notifyMutation();
      return succeed(undefined);
    });
  }

  public setProcedure(id: ProcedureId | undefined): Result<void> {
    return this._session.setProcedure(id).onSuccess(() => {
      this._notifyMutation();
      return succeed(undefined);
    });
  }

  public undo(): Result<boolean> {
    return this._session.undo().onSuccess((didUndo) => {
      if (didUndo) {
        this._notifyMutation();
      }
      return succeed(didUndo);
    });
  }

  public redo(): Result<boolean> {
    return this._session.redo().onSuccess((didRedo) => {
      if (didRedo) {
        this._notifyMutation();
      }
      return succeed(didRedo);
    });
  }

  public canUndo(): boolean {
    return this._session.canUndo();
  }

  public canRedo(): boolean {
    return this._session.canRedo();
  }

  public analyzeSaveOptions(): ISaveAnalysis {
    return this._session.analyzeSaveOptions();
  }

  public markSaved(): void {
    this._session.markSaved();
  }

  private _notifyMutation(): void {
    this._onMutation?.();
  }
}
