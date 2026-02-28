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
 * Read-only confection detail view with subtype-specific sections.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';

import { EntityRow, DetailSection, DetailRow, TagList } from '@fgv/ts-app-shell';
import type { ISelectableItem } from '@fgv/ts-app-shell';
import {
  EntityDetailHeader,
  NotesSection,
  UrlsSection,
  DerivedFromIndicator,
  copyJsonToClipboard
} from '../common';
import type {
  LibraryRuntime,
  Model,
  ConfectionRecipeVariationSpec,
  DecorationId,
  FillingId,
  IngredientId,
  MoldId,
  ProcedureId
} from '@fgv/ts-chocolate';
import { Entities, LibraryRuntime as LR } from '@fgv/ts-chocolate';

import type { IConfectionViewSettings } from './viewSettings';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the ConfectionDetail component.
 * @public
 */
export interface IConfectionDetailProps {
  /** The resolved confection to display */
  readonly confection: LibraryRuntime.IConfectionBase;
  /** Callback when a filling recipe is clicked for drill-down, with optional scaled target weight and source context */
  readonly onFillingClick?: (
    id: FillingId,
    targetWeight?: number,
    sourceConfectionId?: string,
    sourceSlotId?: string
  ) => void;
  /** Callback when an ingredient is clicked for drill-down */
  readonly onIngredientClick?: (id: IngredientId) => void;
  /** Callback when a mold is clicked for drill-down */
  readonly onMoldClick?: (id: MoldId) => void;
  /** Callback when a procedure is clicked for drill-down */
  readonly onProcedureClick?: (id: ProcedureId) => void;
  /** Callback when a decoration is clicked for drill-down */
  readonly onDecorationClick?: (id: DecorationId) => void;
  /** Callback to compare selected variations side-by-side */
  readonly onCompareVariations?: (specs: ReadonlyArray<ConfectionRecipeVariationSpec>) => void;
  /** Override the initially selected variation (defaults to golden) */
  readonly defaultVariationSpec?: ConfectionRecipeVariationSpec;
  /** Called when the user selects a different variation */
  readonly onVariationChange?: (spec: ConfectionRecipeVariationSpec) => void;
  /** Optional callback to enter edit mode - receives the currently selected variation spec */
  readonly onEdit?: (spec: ConfectionRecipeVariationSpec) => void;
  /** Optional callback to open the preview pane */
  readonly onPreview?: () => void;
  /** Current view settings (alternate selections, scaling) */
  readonly viewSettings?: IConfectionViewSettings;
  /** Callback when any view setting changes */
  readonly onViewSettingsChange?: (settings: IConfectionViewSettings) => void;
}

// ============================================================================
// Yield Section
// ============================================================================

function YieldSection({
  yieldSpec
}: {
  readonly yieldSpec: Entities.Confections.IConfectionYield;
}): React.ReactElement {
  return (
    <DetailSection title="Yield">
      <DetailRow label="Count" value={`${yieldSpec.count} ${yieldSpec.unit ?? 'pieces'}`} />
      {yieldSpec.weightPerPiece !== undefined && (
        <DetailRow label="Weight per piece" value={`${yieldSpec.weightPerPiece}g`} />
      )}
    </DetailSection>
  );
}

// ============================================================================
// Decorations Section
// ============================================================================

function DecorationsSection({
  decorations,
  onDecorationClick,
  selectedId,
  onSelect
}: {
  readonly decorations: LibraryRuntime.IConfectionBase['decorations'] & {};
  readonly onDecorationClick?: (id: DecorationId) => void;
  readonly selectedId?: DecorationId;
  readonly onSelect?: (id: DecorationId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    return decorations.options.map((d) => ({
      id: d.id,
      label: d.decoration.name,
      sublabel: d.decoration.description
    }));
  }, [decorations]);

  return (
    <DetailSection title="Decorations">
      <EntityRow<DecorationId>
        items={items}
        preferredId={decorations.preferredId}
        selectedId={selectedId}
        onSelect={onSelect}
        onClick={onDecorationClick}
      />
    </DetailSection>
  );
}

// ============================================================================
// Filling Slots Section
// ============================================================================

function FillingSlotRow({
  slot,
  onFillingClick,
  onIngredientClick,
  selectedOptionId,
  onSelect,
  scaledTargetWeight,
  confectionId
}: {
  readonly slot: LibraryRuntime.IResolvedFillingSlot;
  readonly onFillingClick?: (
    id: FillingId,
    targetWeight?: number,
    sourceConfectionId?: string,
    sourceSlotId?: string
  ) => void;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly selectedOptionId?: string;
  readonly onSelect?: (id: string) => void;
  readonly scaledTargetWeight?: number;
  readonly confectionId?: string;
}): React.ReactElement {
  const items = useMemo(() => {
    return slot.filling.options.map((opt) => ({
      id: opt.id,
      label: opt.type === 'recipe' ? opt.filling.name : opt.ingredient.name,
      sublabel: opt.type
    }));
  }, [slot]);

  const handleClick = useMemo(() => {
    if (!onFillingClick && !onIngredientClick) {
      return undefined;
    }
    return (id: string): void => {
      const opt = slot.filling.options.find((o) => o.id === id);
      if (opt?.type === 'recipe' && onFillingClick) {
        onFillingClick(id as FillingId, scaledTargetWeight, confectionId, slot.slotId);
      } else if (opt?.type === 'ingredient' && onIngredientClick) {
        onIngredientClick(id as IngredientId);
      }
    };
  }, [slot, onFillingClick, onIngredientClick, scaledTargetWeight, confectionId]);

  return (
    <div className="mb-1">
      <div className="text-xs text-gray-400 mb-0.5 pl-[22px]">{slot.name ?? slot.slotId}</div>
      <EntityRow
        items={items}
        preferredId={slot.filling.preferredId}
        selectedId={selectedOptionId}
        onSelect={onSelect}
        onClick={handleClick}
      />
    </div>
  );
}

function FillingSlotsSection({
  fillings,
  onFillingClick,
  onIngredientClick,
  fillingSelections,
  onFillingSelect,
  scaledSlotWeights,
  confectionId
}: {
  readonly fillings: ReadonlyArray<LibraryRuntime.IResolvedFillingSlot>;
  readonly onFillingClick?: (
    id: FillingId,
    targetWeight?: number,
    sourceConfectionId?: string,
    sourceSlotId?: string
  ) => void;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly fillingSelections?: Readonly<Record<string, string>>;
  readonly onFillingSelect?: (slotId: string, optionId: string) => void;
  readonly scaledSlotWeights?: Readonly<Record<string, number>>;
  readonly confectionId?: string;
}): React.ReactElement | null {
  if (fillings.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Fillings">
      {fillings.map((slot) => (
        <FillingSlotRow
          key={slot.slotId}
          slot={slot}
          onFillingClick={onFillingClick}
          onIngredientClick={onIngredientClick}
          selectedOptionId={fillingSelections?.[slot.slotId]}
          onSelect={onFillingSelect ? (id): void => onFillingSelect(slot.slotId, id) : undefined}
          scaledTargetWeight={scaledSlotWeights?.[slot.slotId]}
          confectionId={confectionId}
        />
      ))}
    </DetailSection>
  );
}

// ============================================================================
// Procedures Section
// ============================================================================

function ProceduresSection({
  procedures,
  onProcedureClick,
  selectedId,
  onSelect
}: {
  readonly procedures: Model.IOptionsWithPreferred<LibraryRuntime.IResolvedConfectionProcedure, ProcedureId>;
  readonly onProcedureClick?: (id: ProcedureId) => void;
  readonly selectedId?: ProcedureId;
  readonly onSelect?: (id: ProcedureId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    return procedures.options.map((p) => ({
      id: p.id,
      label: p.procedure.name,
      sublabel: p.procedure.category
    }));
  }, [procedures]);

  return (
    <DetailSection title="Procedures">
      <EntityRow<ProcedureId>
        items={items}
        preferredId={procedures.preferredId}
        selectedId={selectedId}
        onSelect={onSelect}
        onClick={onProcedureClick}
      />
    </DetailSection>
  );
}

// ============================================================================
// Chocolate Spec Section
// ============================================================================

function ChocolateSpecSection({
  title,
  spec,
  onIngredientClick,
  selectedId,
  onSelect
}: {
  readonly title: string;
  readonly spec: LibraryRuntime.IResolvedChocolateSpec;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly selectedId?: IngredientId;
  readonly onSelect?: (id: IngredientId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    const result: ISelectableItem<IngredientId>[] = [{ id: spec.chocolate.id, label: spec.chocolate.name }];
    for (const alt of spec.alternates) {
      result.push({ id: alt.id, label: alt.name });
    }
    return result;
  }, [spec]);

  return (
    <DetailSection title={title}>
      <EntityRow<IngredientId>
        items={items}
        preferredId={spec.chocolate.id}
        selectedId={selectedId}
        onSelect={onSelect}
        onClick={onIngredientClick}
      />
    </DetailSection>
  );
}

// ============================================================================
// Molded BonBon Sections
// ============================================================================

function MoldsSection({
  molds,
  onMoldClick,
  selectedId,
  onSelect
}: {
  readonly molds: Model.IOptionsWithPreferred<LibraryRuntime.IResolvedConfectionMoldRef, MoldId>;
  readonly onMoldClick?: (id: MoldId) => void;
  readonly selectedId?: MoldId;
  readonly onSelect?: (id: MoldId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    return molds.options.map((m) => ({
      id: m.id,
      label: m.mold.displayName,
      sublabel: m.mold.format
    }));
  }, [molds]);

  return (
    <DetailSection title="Molds">
      <EntityRow<MoldId>
        items={items}
        preferredId={molds.preferredId}
        selectedId={selectedId}
        onSelect={onSelect}
        onClick={onMoldClick}
      />
    </DetailSection>
  );
}

function AdditionalChocolatesSection({
  chocolates,
  onIngredientClick
}: {
  readonly chocolates: ReadonlyArray<LibraryRuntime.IResolvedAdditionalChocolate>;
  readonly onIngredientClick?: (id: IngredientId) => void;
}): React.ReactElement | null {
  if (chocolates.length === 0) {
    return null;
  }
  return (
    <>
      {chocolates.map((ac, i) => (
        <ChocolateSpecSection
          key={i}
          title={`${ac.purpose} Chocolate`}
          spec={ac.chocolate}
          onIngredientClick={onIngredientClick}
        />
      ))}
    </>
  );
}

// ============================================================================
// Bar Truffle Sections
// ============================================================================

function DimensionsSection({
  frameDimensions,
  bonBonDimensions
}: {
  readonly frameDimensions: Entities.Confections.IFrameDimensions;
  readonly bonBonDimensions: Entities.Confections.IBonBonDimensions;
}): React.ReactElement {
  return (
    <DetailSection title="Dimensions">
      <DetailRow
        label="Frame"
        value={`${frameDimensions.width} × ${frameDimensions.height} × ${frameDimensions.depth}mm`}
      />
      <DetailRow label="BonBon" value={`${bonBonDimensions.width} × ${bonBonDimensions.height}mm`} />
    </DetailSection>
  );
}

// ============================================================================
// Scaling Section
// ============================================================================

function ScalingSection({
  variation,
  viewSettings,
  onSettingChange
}: {
  readonly variation: LibraryRuntime.AnyConfectionRecipeVariation;
  readonly viewSettings?: IConfectionViewSettings;
  readonly onSettingChange?: (patch: Partial<IConfectionViewSettings>) => void;
}): React.ReactElement | null {
  if (!onSettingChange) return null;

  if (variation.isMoldedBonBonVariation()) {
    const frames = viewSettings?.targetFrames;
    const buffer = viewSettings?.bufferPercentage ?? 0.1;
    const cavityCount = variation.preferredMold?.mold.cavityCount;
    const effectiveCount =
      frames !== undefined && cavityCount !== undefined ? frames * cavityCount : undefined;
    return (
      <DetailSection title="Scale to Yield">
        <div className="flex items-center gap-3 px-1 py-1">
          <label className="text-xs text-gray-500 w-16 shrink-0">Frames</label>
          <input
            type="number"
            min={1}
            step={1}
            value={frames ?? ''}
            placeholder="—"
            onChange={(e): void => {
              const v = parseInt(e.target.value, 10);
              onSettingChange({ targetFrames: isNaN(v) || v <= 0 ? undefined : v });
            }}
            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-choco-primary"
          />
          <label className="text-xs text-gray-500 w-16 shrink-0">Buffer %</label>
          <input
            type="number"
            min={0}
            max={100}
            step={5}
            value={Math.round(buffer * 100)}
            onChange={(e): void => {
              const v = parseInt(e.target.value, 10);
              onSettingChange({ bufferPercentage: isNaN(v) ? 0.1 : v / 100 });
            }}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-choco-primary"
          />
        </div>
        {effectiveCount !== undefined && <DetailRow label="Pieces" value={`${effectiveCount} pieces`} />}
      </DetailSection>
    );
  }

  const count = viewSettings?.targetCount;
  return (
    <DetailSection title="Scale to Yield">
      <div className="flex items-center gap-3 px-1 py-1">
        <label className="text-xs text-gray-500 w-16 shrink-0">Pieces</label>
        <input
          type="number"
          min={1}
          step={1}
          value={count ?? ''}
          placeholder="—"
          onChange={(e): void => {
            const v = parseInt(e.target.value, 10);
            onSettingChange({ targetCount: isNaN(v) || v <= 0 ? undefined : v });
          }}
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-choco-primary"
        />
      </div>
    </DetailSection>
  );
}

// ============================================================================
// Coatings Section (Rolled Truffle)
// ============================================================================

function CoatingsSection({
  coatings,
  onIngredientClick,
  selectedId,
  onSelect
}: {
  readonly coatings: LibraryRuntime.IResolvedCoatings;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly selectedId?: IngredientId;
  readonly onSelect?: (id: IngredientId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    return coatings.options.map((c) => ({
      id: c.id,
      label: c.ingredient.name
    }));
  }, [coatings]);

  return (
    <DetailSection title="Coatings">
      <EntityRow<IngredientId>
        items={items}
        preferredId={coatings.preferred?.id}
        selectedId={selectedId}
        onSelect={onSelect}
        onClick={onIngredientClick}
      />
    </DetailSection>
  );
}

// ============================================================================
// Subtype-Specific Content
// ============================================================================

function MoldedBonBonContent({
  confection,
  variation,
  onIngredientClick,
  onMoldClick,
  viewSettings,
  onSettingChange
}: {
  readonly confection: LibraryRuntime.IMoldedBonBonRecipe;
  readonly variation: LibraryRuntime.IMoldedBonBonRecipeVariation;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly onMoldClick?: (id: MoldId) => void;
  readonly viewSettings?: IConfectionViewSettings;
  readonly onSettingChange?: (patch: Partial<IConfectionViewSettings>) => void;
}): React.ReactElement {
  return (
    <>
      <MoldsSection
        molds={variation.molds}
        onMoldClick={onMoldClick}
        selectedId={viewSettings?.moldId}
        onSelect={onSettingChange ? (id): void => onSettingChange({ moldId: id }) : undefined}
      />
      <ChocolateSpecSection
        title="Shell Chocolate"
        spec={variation.shellChocolate}
        onIngredientClick={onIngredientClick}
        selectedId={viewSettings?.shellChocolateId}
        onSelect={onSettingChange ? (id): void => onSettingChange({ shellChocolateId: id }) : undefined}
      />
      {variation.additionalChocolates && (
        <AdditionalChocolatesSection
          chocolates={variation.additionalChocolates}
          onIngredientClick={onIngredientClick}
        />
      )}
    </>
  );
}

function BarTruffleContent({
  variation,
  onIngredientClick,
  viewSettings,
  onSettingChange
}: {
  readonly variation: LibraryRuntime.IBarTruffleRecipeVariation;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly viewSettings?: IConfectionViewSettings;
  readonly onSettingChange?: (patch: Partial<IConfectionViewSettings>) => void;
}): React.ReactElement {
  return (
    <>
      <DimensionsSection
        frameDimensions={variation.frameDimensions}
        bonBonDimensions={variation.singleBonBonDimensions}
      />
      {variation.enrobingChocolate && (
        <ChocolateSpecSection
          title="Enrobing Chocolate"
          spec={variation.enrobingChocolate}
          onIngredientClick={onIngredientClick}
          selectedId={viewSettings?.enrobingChocolateId}
          onSelect={onSettingChange ? (id): void => onSettingChange({ enrobingChocolateId: id }) : undefined}
        />
      )}
    </>
  );
}

function RolledTruffleContent({
  variation,
  onIngredientClick,
  viewSettings,
  onSettingChange
}: {
  readonly variation: LibraryRuntime.IRolledTruffleRecipeVariation;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly viewSettings?: IConfectionViewSettings;
  readonly onSettingChange?: (patch: Partial<IConfectionViewSettings>) => void;
}): React.ReactElement {
  return (
    <>
      {variation.enrobingChocolate && (
        <ChocolateSpecSection
          title="Enrobing Chocolate"
          spec={variation.enrobingChocolate}
          onIngredientClick={onIngredientClick}
          selectedId={viewSettings?.enrobingChocolateId}
          onSelect={onSettingChange ? (id): void => onSettingChange({ enrobingChocolateId: id }) : undefined}
        />
      )}
      {variation.coatings && (
        <CoatingsSection
          coatings={variation.coatings}
          onIngredientClick={onIngredientClick}
          selectedId={viewSettings?.coatingId}
          onSelect={onSettingChange ? (id): void => onSettingChange({ coatingId: id }) : undefined}
        />
      )}
    </>
  );
}

// ============================================================================
// ConfectionDetail Component
// ============================================================================

/**
 * Read-only detail view for a confection entity.
 *
 * Displays:
 * - Header with name, confection type badge, description
 * - Variation selector (if multiple variations)
 * - Yield information
 * - Filling slots with drill-down to filling recipes or ingredients
 * - Subtype-specific sections:
 *   - Molded bonbon: molds, shell chocolate, additional chocolates
 *   - Bar truffle: frame/bonbon dimensions, enrobing chocolate
 *   - Rolled truffle: enrobing chocolate, coatings
 * - Decorations, procedures, notes, URLs, tags
 *
 * @public
 */
export function ConfectionDetail(props: IConfectionDetailProps): React.ReactElement {
  const {
    confection,
    onFillingClick,
    onIngredientClick,
    onMoldClick,
    onProcedureClick,
    onDecorationClick,
    onCompareVariations,
    onEdit,
    onPreview,
    viewSettings,
    onViewSettingsChange
  } = props;

  const { onVariationChange } = props;
  const [selectedSpec, setSelectedSpec] = useState<ConfectionRecipeVariationSpec>(
    props.defaultVariationSpec ?? confection.goldenVariationSpec
  );

  const handleVariationSelect = React.useCallback(
    (spec: ConfectionRecipeVariationSpec): void => {
      setSelectedSpec(spec);
      onVariationChange?.(spec);
    },
    [onVariationChange]
  );

  const selectedVariation = useMemo(() => {
    const result = confection.getVariation(selectedSpec);
    return result.isSuccess() ? result.value : confection.goldenVariation;
  }, [confection, selectedSpec]);

  const variationItems = useMemo(() => {
    return confection.variations.map((v) => ({
      id: v.variationSpec,
      label: v.name ?? v.variationSpec
    }));
  }, [confection]);

  const handleSettingChange = useCallback(
    (patch: Partial<IConfectionViewSettings>): void => {
      if (onViewSettingsChange) {
        onViewSettingsChange({ ...viewSettings, ...patch });
      }
    },
    [viewSettings, onViewSettingsChange]
  );

  const handleFillingSelect = useCallback(
    (slotId: string, optionId: string): void => {
      handleSettingChange({
        fillingSelections: { ...viewSettings?.fillingSelections, [slotId]: optionId }
      });
    },
    [viewSettings, handleSettingChange]
  );

  // Copy JSON: recipe metadata + selected variation only
  const handleCopyJson = useCallback((): void => {
    copyJsonToClipboard({
      ...confection.entity,
      variations: [selectedVariation.entity],
      goldenVariationSpec: selectedSpec
    });
  }, [confection, selectedVariation, selectedSpec]);

  const scaledSlotWeights = useMemo((): Readonly<Record<string, number>> | undefined => {
    if (!viewSettings) return undefined;
    const target: LR.IConfectionScalingTarget = {
      targetFrames: viewSettings.targetFrames,
      bufferPercentage: viewSettings.bufferPercentage,
      targetCount: viewSettings.targetCount,
      selectedMoldId: viewSettings.moldId,
      fillingSelections: viewSettings.fillingSelections
    };
    if (!LR.canScale(selectedVariation, target)) return undefined;
    const result = LR.computeScaledFillings(selectedVariation, target);
    if (!result.isSuccess()) return undefined;
    const weights: Record<string, number> = {};
    for (const slot of result.value.slots) {
      weights[slot.slotId] = slot.targetWeight;
    }
    return weights;
  }, [selectedVariation, viewSettings]);

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader
        title={confection.name}
        description={confection.description}
        badge={{ label: confection.confectionType, colorClass: 'bg-choco-primary/10 text-choco-primary' }}
        subtitle={confection.id}
        extraIndicators={
          confection.entity.derivedFrom && (
            <DerivedFromIndicator
              sourceVariationId={confection.entity.derivedFrom.sourceVariationId}
              derivedDate={confection.entity.derivedFrom.derivedDate}
            />
          )
        }
        onCopyJson={handleCopyJson}
        onPreview={onPreview}
        onEdit={onEdit ? (): void => onEdit(selectedSpec) : undefined}
      />

      {/* Variation selector */}
      {confection.variations.length > 1 && (
        <div className="mb-4">
          <EntityRow<ConfectionRecipeVariationSpec>
            items={variationItems}
            selectedId={selectedSpec}
            preferredId={confection.goldenVariationSpec}
            onSelect={handleVariationSelect}
            onCompare={onCompareVariations}
            label="Variations"
          />
        </div>
      )}

      {/* Variation spec subtitle */}
      <p className="text-[10px] text-gray-400 font-mono -mt-3 mb-4">{selectedVariation.variationSpec}</p>

      {/* Yield */}
      <YieldSection yieldSpec={selectedVariation.yield} />

      {/* Scale to Yield */}
      <ScalingSection
        variation={selectedVariation}
        viewSettings={viewSettings}
        onSettingChange={onViewSettingsChange ? handleSettingChange : undefined}
      />

      {/* Filling slots */}
      {selectedVariation.fillings && selectedVariation.fillings.length > 0 && (
        <FillingSlotsSection
          fillings={selectedVariation.fillings}
          onFillingClick={onFillingClick}
          onIngredientClick={onIngredientClick}
          fillingSelections={viewSettings?.fillingSelections}
          onFillingSelect={onViewSettingsChange ? handleFillingSelect : undefined}
          scaledSlotWeights={scaledSlotWeights}
          confectionId={confection.id}
        />
      )}

      {/* Subtype-specific content */}
      {selectedVariation.isMoldedBonBonVariation() && (
        <MoldedBonBonContent
          confection={confection as LibraryRuntime.IMoldedBonBonRecipe}
          variation={selectedVariation}
          onIngredientClick={onIngredientClick}
          onMoldClick={onMoldClick}
          viewSettings={viewSettings}
          onSettingChange={onViewSettingsChange ? handleSettingChange : undefined}
        />
      )}
      {selectedVariation.isBarTruffleVariation() && (
        <BarTruffleContent
          variation={selectedVariation}
          onIngredientClick={onIngredientClick}
          viewSettings={viewSettings}
          onSettingChange={onViewSettingsChange ? handleSettingChange : undefined}
        />
      )}
      {selectedVariation.isRolledTruffleVariation() && (
        <RolledTruffleContent
          variation={selectedVariation}
          onIngredientClick={onIngredientClick}
          viewSettings={viewSettings}
          onSettingChange={onViewSettingsChange ? handleSettingChange : undefined}
        />
      )}

      {/* Decorations */}
      {selectedVariation.decorations && (
        <DecorationsSection
          decorations={selectedVariation.decorations}
          onDecorationClick={onDecorationClick}
          selectedId={viewSettings?.decorationId}
          onSelect={
            onViewSettingsChange ? (id): void => handleSettingChange({ decorationId: id }) : undefined
          }
        />
      )}

      {/* Procedures */}
      {selectedVariation.procedures && (
        <ProceduresSection
          procedures={selectedVariation.procedures}
          onProcedureClick={onProcedureClick}
          selectedId={viewSettings?.procedureId}
          onSelect={onViewSettingsChange ? (id): void => handleSettingChange({ procedureId: id }) : undefined}
        />
      )}

      {/* Notes */}
      <NotesSection notes={selectedVariation.notes ?? []} />

      {/* URLs */}
      <UrlsSection urls={confection.effectiveUrls} />

      {/* Tags */}
      <TagList tags={selectedVariation.effectiveTags} />

      {/* Variation count summary */}
      {confection.variations.length > 1 && (
        <p className="text-xs text-gray-400 mt-2">
          {confection.variations.length} variations · golden: {confection.goldenVariationSpec}
        </p>
      )}
    </div>
  );
}
