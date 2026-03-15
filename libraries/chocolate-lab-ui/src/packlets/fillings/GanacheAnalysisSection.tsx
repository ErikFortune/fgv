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
 * Shared ganache analysis display components for filling views.
 * @packageDocumentation
 */

import React, { useMemo, useState } from 'react';

import { DetailSection, DetailRow } from '@fgv/ts-app-shell';
import type { Entities, LibraryRuntime } from '@fgv/ts-chocolate';

// ============================================================================
// useGanacheCalculation Hook
// ============================================================================

/**
 * Computes ganache calculation from a resolved filling recipe variation.
 * Returns undefined if the calculation fails (e.g. unresolved ingredients).
 */
export function useGanacheCalculation(
  variation: LibraryRuntime.FillingRecipeVariation
): LibraryRuntime.IGanacheCalculation | undefined {
  return useMemo(() => {
    const result = variation.calculateGanache();
    return result.isSuccess() ? result.value : undefined;
  }, [variation]);
}

// ============================================================================
// Validation Messages
// ============================================================================

function GanacheValidationMessages({
  validation
}: {
  readonly validation: LibraryRuntime.IGanacheValidation;
}): React.ReactElement | null {
  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <div className="mt-2 px-2 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded">
        Ratios within guidelines
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      {validation.errors.length > 0 && (
        <div className="px-2 py-1.5 bg-red-50 border border-red-200 rounded">
          {validation.errors.map((error, i) => (
            <div key={i} className="text-xs text-red-700">
              {error}
            </div>
          ))}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="px-2 py-1.5 bg-amber-50 border border-amber-200 rounded">
          {validation.warnings.map((warning, i) => (
            <div key={i} className="text-xs text-amber-700">
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Characteristics Display — Detail Variant
// ============================================================================

function DetailVariant({
  calculation
}: {
  readonly calculation: LibraryRuntime.IGanacheCalculation;
}): React.ReactElement {
  const { characteristics } = calculation.analysis;
  return (
    <>
      <DetailSection title="Blended Composition">
        <DetailRow label="Cacao Fat" value={`${characteristics.cacaoFat.toFixed(1)}%`} />
        <DetailRow label="Sugar" value={`${characteristics.sugar.toFixed(1)}%`} />
        <DetailRow label="Milk Fat" value={`${characteristics.milkFat.toFixed(1)}%`} />
        <DetailRow label="Water" value={`${characteristics.water.toFixed(1)}%`} />
        <DetailRow label="Solids" value={`${characteristics.solids.toFixed(1)}%`} />
        <DetailRow label="Other Fats" value={`${characteristics.otherFats.toFixed(1)}%`} />
      </DetailSection>
      <DetailSection title="Ratios">
        <DetailRow label="Total Fat" value={`${calculation.analysis.totalFat.toFixed(1)}%`} />
        <DetailRow label="Fat : Water" value={calculation.analysis.fatToWaterRatio.toFixed(2)} />
        <DetailRow label="Sugar : Water" value={calculation.analysis.sugarToWaterRatio.toFixed(2)} />
      </DetailSection>
      <GanacheValidationMessages validation={calculation.validation} />
    </>
  );
}

// ============================================================================
// Characteristics Display — Preview Variant
// ============================================================================

function PreviewVariant({
  calculation
}: {
  readonly calculation: LibraryRuntime.IGanacheCalculation;
}): React.ReactElement {
  const { characteristics } = calculation.analysis;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Composition</h3>
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Cacao Fat</span>
          <span className="text-gray-900 font-medium tabular-nums">
            {characteristics.cacaoFat.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Sugar</span>
          <span className="text-gray-900 font-medium tabular-nums">{characteristics.sugar.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Milk Fat</span>
          <span className="text-gray-900 font-medium tabular-nums">
            {characteristics.milkFat.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Water</span>
          <span className="text-gray-900 font-medium tabular-nums">{characteristics.water.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Solids</span>
          <span className="text-gray-900 font-medium tabular-nums">{characteristics.solids.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Other Fats</span>
          <span className="text-gray-900 font-medium tabular-nums">
            {characteristics.otherFats.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ratios</h3>
        <div className="grid grid-cols-3 gap-x-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Total Fat</span>
            <span className="text-gray-900 font-medium tabular-nums">
              {calculation.analysis.totalFat.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Fat:Water</span>
            <span className="text-gray-900 font-medium tabular-nums">
              {calculation.analysis.fatToWaterRatio.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Sugar:Water</span>
            <span className="text-gray-900 font-medium tabular-nums">
              {calculation.analysis.sugarToWaterRatio.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <GanacheValidationMessages validation={calculation.validation} />
    </div>
  );
}

// ============================================================================
// GanacheCharacteristicsDisplay
// ============================================================================

export function GanacheCharacteristicsDisplay({
  calculation,
  variant
}: {
  readonly calculation: LibraryRuntime.IGanacheCalculation;
  readonly variant: 'detail' | 'preview';
}): React.ReactElement {
  if (variant === 'preview') {
    return <PreviewVariant calculation={calculation} />;
  }
  return <DetailVariant calculation={calculation} />;
}

// ============================================================================
// CollapsibleGanacheSection
// ============================================================================

export function CollapsibleGanacheSection({
  category,
  children
}: {
  readonly category: Entities.Fillings.FillingCategory;
  readonly children: React.ReactNode;
}): React.ReactElement {
  const alwaysExpanded = category === 'ganache';
  const [collapsed, setCollapsed] = useState(!alwaysExpanded);

  if (alwaysExpanded) {
    return (
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Ganache Analysis
        </h3>
        {children}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={(): void => setCollapsed((prev) => !prev)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 mb-2"
      >
        <span className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}>{'\u203A'}</span>
        Ganache Analysis
      </button>
      {!collapsed && children}
    </div>
  );
}
