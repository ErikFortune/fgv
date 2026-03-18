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
 * Confection print view - composes the confection recipe with optional filling
 * recipes for popup print window rendering.
 * @packageDocumentation
 */

import React, { useMemo, useState } from 'react';

import type { Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import { Entities as EntitiesNS, LibraryRuntime as LR } from '@fgv/ts-chocolate';
import { openPrintWindow } from '@fgv/ts-app-shell';

import type { IConfectionViewSettings } from './viewSettings';
import { ConfectionPreviewPanel } from './ConfectionPreviewPanel';
import { FillingPreviewPanel } from '../fillings';

// ============================================================================
// Types
// ============================================================================

interface IFillingRecipeEntry {
  readonly slotName: string;
  readonly filling: LibraryRuntime.FillingRecipe;
  readonly targetWeight?: number;
}

export interface IConfectionPrintViewProps {
  readonly confection: LibraryRuntime.IConfectionBase;
  readonly draftEntity?: Entities.Confections.AnyConfectionRecipeEntity;
  readonly viewSettings?: IConfectionViewSettings;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Computes per-slot target weights using the same scaling logic as
 * ConfectionPreviewPanel: explicit scaling from viewSettings if present,
 * otherwise default scaling from the recipe's own yield.
 */
function computeSlotWeights(
  goldenVariation: LibraryRuntime.IConfectionBase['goldenVariation'],
  viewSettings?: IConfectionViewSettings
): Readonly<Record<string, number>> | undefined {
  const scalingTarget: LR.IConfectionScalingTarget | undefined = viewSettings
    ? {
        targetFrames: viewSettings.targetFrames,
        bufferPercentage: viewSettings.bufferPercentage,
        targetCount: viewSettings.targetCount,
        selectedMoldId: viewSettings.moldId,
        fillingSelections: viewSettings.fillingSelections
      }
    : undefined;

  // Try explicit scaling first
  let scalingResult: LR.IConfectionScalingResult | undefined;
  if (scalingTarget && LR.canScale(goldenVariation, scalingTarget)) {
    const result = LR.computeScaledFillings(goldenVariation, scalingTarget);
    scalingResult = result.isSuccess() ? result.value : undefined;
  }

  // Fall back to default scaling from the recipe's own yield
  if (!scalingResult) {
    const defaultTarget: LR.IConfectionScalingTarget = EntitiesNS.Confections.isYieldInFrames(
      goldenVariation.yield
    )
      ? { targetFrames: goldenVariation.yield.numFrames }
      : { targetCount: goldenVariation.yield.numPieces };
    if (LR.canScale(goldenVariation, defaultTarget)) {
      const result = LR.computeScaledFillings(goldenVariation, defaultTarget);
      scalingResult = result.isSuccess() ? result.value : undefined;
    }
  }

  if (!scalingResult) return undefined;

  const weights: Record<string, number> = {};
  for (const slot of scalingResult.slots) {
    weights[slot.slotId] = slot.targetWeight;
  }
  return weights;
}

/**
 * Extracts filling recipe entries from a confection's resolved filling slots,
 * scaled to match the confection's output yield.
 * Only includes recipe-type fillings (not ingredient fillings).
 */
function extractFillingRecipes(
  confection: LibraryRuntime.IConfectionBase,
  viewSettings?: IConfectionViewSettings
): ReadonlyArray<IFillingRecipeEntry> {
  const goldenVariation = confection.goldenVariation;
  const slots = goldenVariation.fillings ?? [];
  const slotWeights = computeSlotWeights(goldenVariation, viewSettings);
  const entries: IFillingRecipeEntry[] = [];

  for (const slot of slots) {
    const selectedId = viewSettings?.fillingSelections?.[slot.slotId];
    const option =
      slot.filling.options.find((o) => o.id === selectedId) ??
      slot.filling.options.find((o) => o.id === slot.filling.preferredId) ??
      slot.filling.options[0];

    if (option?.type === 'recipe') {
      entries.push({
        slotName: slot.name ?? slot.slotId,
        // The runtime resolves fillings as FillingRecipe class instances,
        // but the interface types them as IFillingRecipe. Cast is safe here.
        filling: option.filling as LibraryRuntime.FillingRecipe,
        targetWeight: slotWeights?.[slot.slotId]
      });
    }
  }

  return entries;
}

// ============================================================================
// ConfectionPrintView Component
// ============================================================================

/**
 * Composes a confection recipe with optional filling recipes for printing.
 * Rendered inside a print popup window via {@link openConfectionPrintWindow}.
 *
 * @remarks
 * The filling toggle is passed as `toolbarExtras` to the PrintEnclosure
 * by {@link openConfectionPrintWindow}, so this component just renders
 * the content body.
 */
export function ConfectionPrintView({
  confection,
  draftEntity,
  viewSettings,
  includeFillings
}: IConfectionPrintViewProps & { readonly includeFillings: boolean }): React.ReactElement {
  const fillingEntries = useMemo(
    () => extractFillingRecipes(confection, viewSettings),
    [confection, viewSettings]
  );

  return (
    <div>
      <ConfectionPreviewPanel
        confection={confection}
        draftEntity={draftEntity}
        viewSettings={viewSettings}
        printMode
      />

      {includeFillings &&
        fillingEntries.map((entry) => (
          <div key={entry.filling.id} className="break-before-page">
            <FillingPreviewPanel filling={entry.filling} targetYield={entry.targetWeight} printMode />
          </div>
        ))}
    </div>
  );
}

// ============================================================================
// Print Window Launcher
// ============================================================================

/**
 * Wrapper component rendered inside the popup that manages the filling toggle state.
 */
function ConfectionPrintWindowContent(props: IConfectionPrintViewProps): React.ReactElement {
  const [includeFillings, setIncludeFillings] = useState(false);

  const fillingCount = useMemo(() => {
    return extractFillingRecipes(props.confection, props.viewSettings).length;
  }, [props.confection, props.viewSettings]);

  const hasFillings = fillingCount > 0;

  return (
    <div>
      {hasFillings && (
        <label className="print-toolbar flex items-center gap-2 mb-4 text-sm text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeFillings}
            onChange={(e): void => setIncludeFillings(e.target.checked)}
            className="rounded border-border text-brand-primary focus:ring-focus-ring"
          />
          Include filling recipes ({fillingCount})
        </label>
      )}
      <ConfectionPrintView {...props} includeFillings={includeFillings && hasFillings} />
    </div>
  );
}

/**
 * Opens a popup print window for a confection recipe with an optional toggle
 * to include filling recipes.
 * @public
 */
export function openConfectionPrintWindow(props: IConfectionPrintViewProps): Window | null {
  const entity = props.draftEntity ?? props.confection.entity;

  return openPrintWindow(<ConfectionPrintWindowContent {...props} />, {
    title: `Print: ${entity.name}`
  });
}
