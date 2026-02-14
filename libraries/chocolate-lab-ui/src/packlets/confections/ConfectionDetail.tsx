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

import React, { useMemo, useState } from 'react';

import { EntityRow } from '@fgv/ts-app-shell';
import type { ISelectableItem } from '@fgv/ts-app-shell';
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
import { Entities } from '@fgv/ts-chocolate';

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
  /** Callback when a filling recipe is clicked for drill-down */
  readonly onFillingClick?: (id: FillingId) => void;
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
}

// ============================================================================
// Shared Helpers
// ============================================================================

function DetailSection({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between py-0.5 text-sm">
      <span className="text-gray-500 shrink-0 mr-2">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function CategoryBadge({ label }: { readonly label: string }): React.ReactElement {
  return (
    <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-choco-primary/10 text-choco-primary">
      {label}
    </span>
  );
}

function TagList({ tags }: { readonly tags: ReadonlyArray<string> }): React.ReactElement | null {
  if (tags.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Tags">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
            {tag}
          </span>
        ))}
      </div>
    </DetailSection>
  );
}

function NotesSection({
  notes
}: {
  readonly notes: ReadonlyArray<Model.ICategorizedNote>;
}): React.ReactElement | null {
  if (notes.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Notes">
      {notes.map((note, i) => (
        <div key={i} className="text-sm text-gray-700 mb-1">
          <span className="text-xs text-gray-400 mr-1">[{note.category}]</span>
          {note.note}
        </div>
      ))}
    </DetailSection>
  );
}

function UrlsSection({
  urls
}: {
  readonly urls: ReadonlyArray<Model.ICategorizedUrl>;
}): React.ReactElement | null {
  if (urls.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Links">
      {urls.map((u, i) => (
        <div key={i} className="text-sm mb-1">
          <span className="text-xs text-gray-400 mr-1">[{u.category}]</span>
          <a
            href={u.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-choco-primary hover:underline"
          >
            {u.url}
          </a>
        </div>
      ))}
    </DetailSection>
  );
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
  onDecorationClick
}: {
  readonly decorations: LibraryRuntime.IConfectionBase['decorations'] & {};
  readonly onDecorationClick?: (id: DecorationId) => void;
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
  onIngredientClick
}: {
  readonly slot: LibraryRuntime.IResolvedFillingSlot;
  readonly onFillingClick?: (id: FillingId) => void;
  readonly onIngredientClick?: (id: IngredientId) => void;
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
        onFillingClick(id as FillingId);
      } else if (opt?.type === 'ingredient' && onIngredientClick) {
        onIngredientClick(id as IngredientId);
      }
    };
  }, [slot, onFillingClick, onIngredientClick]);

  return (
    <div className="mb-1">
      <div className="text-xs text-gray-400 mb-0.5 pl-[22px]">{slot.name ?? slot.slotId}</div>
      <EntityRow items={items} preferredId={slot.filling.preferredId} onClick={handleClick} />
    </div>
  );
}

function FillingSlotsSection({
  fillings,
  onFillingClick,
  onIngredientClick
}: {
  readonly fillings: ReadonlyArray<LibraryRuntime.IResolvedFillingSlot>;
  readonly onFillingClick?: (id: FillingId) => void;
  readonly onIngredientClick?: (id: IngredientId) => void;
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
  onProcedureClick
}: {
  readonly procedures: Model.IOptionsWithPreferred<LibraryRuntime.IResolvedConfectionProcedure, ProcedureId>;
  readonly onProcedureClick?: (id: ProcedureId) => void;
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
      <EntityRow<ProcedureId> items={items} preferredId={procedures.preferredId} onClick={onProcedureClick} />
    </DetailSection>
  );
}

// ============================================================================
// Chocolate Spec Section
// ============================================================================

function ChocolateSpecSection({
  title,
  spec,
  onIngredientClick
}: {
  readonly title: string;
  readonly spec: LibraryRuntime.IResolvedChocolateSpec;
  readonly onIngredientClick?: (id: IngredientId) => void;
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
      <EntityRow<IngredientId> items={items} preferredId={spec.chocolate.id} onClick={onIngredientClick} />
    </DetailSection>
  );
}

// ============================================================================
// Molded BonBon Sections
// ============================================================================

function MoldsSection({
  molds,
  onMoldClick
}: {
  readonly molds: Model.IOptionsWithPreferred<LibraryRuntime.IResolvedConfectionMoldRef, MoldId>;
  readonly onMoldClick?: (id: MoldId) => void;
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
      <EntityRow<MoldId> items={items} preferredId={molds.preferredId} onClick={onMoldClick} />
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
// Coatings Section (Rolled Truffle)
// ============================================================================

function CoatingsSection({
  coatings,
  onIngredientClick
}: {
  readonly coatings: LibraryRuntime.IResolvedCoatings;
  readonly onIngredientClick?: (id: IngredientId) => void;
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
  onMoldClick
}: {
  readonly confection: LibraryRuntime.IMoldedBonBonRecipe;
  readonly variation: LibraryRuntime.IMoldedBonBonRecipeVariation;
  readonly onIngredientClick?: (id: IngredientId) => void;
  readonly onMoldClick?: (id: MoldId) => void;
}): React.ReactElement {
  return (
    <>
      <MoldsSection molds={variation.molds} onMoldClick={onMoldClick} />
      <ChocolateSpecSection
        title="Shell Chocolate"
        spec={variation.shellChocolate}
        onIngredientClick={onIngredientClick}
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
  onIngredientClick
}: {
  readonly variation: LibraryRuntime.IBarTruffleRecipeVariation;
  readonly onIngredientClick?: (id: IngredientId) => void;
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
        />
      )}
    </>
  );
}

function RolledTruffleContent({
  variation,
  onIngredientClick
}: {
  readonly variation: LibraryRuntime.IRolledTruffleRecipeVariation;
  readonly onIngredientClick?: (id: IngredientId) => void;
}): React.ReactElement {
  return (
    <>
      {variation.enrobingChocolate && (
        <ChocolateSpecSection
          title="Enrobing Chocolate"
          spec={variation.enrobingChocolate}
          onIngredientClick={onIngredientClick}
        />
      )}
      {variation.coatings && (
        <CoatingsSection coatings={variation.coatings} onIngredientClick={onIngredientClick} />
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
    onCompareVariations
  } = props;

  const [selectedSpec, setSelectedSpec] = useState<ConfectionRecipeVariationSpec>(
    props.defaultVariationSpec ?? confection.goldenVariationSpec
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

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{confection.name}</h2>
          <CategoryBadge label={confection.confectionType} />
        </div>
        {confection.description && <p className="text-sm text-gray-600">{confection.description}</p>}
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{confection.id}</p>
      </div>

      {/* Variation selector */}
      {confection.variations.length > 1 && (
        <div className="mb-4">
          <EntityRow<ConfectionRecipeVariationSpec>
            items={variationItems}
            selectedId={selectedSpec}
            preferredId={confection.goldenVariationSpec}
            onSelect={setSelectedSpec}
            onCompare={onCompareVariations}
            label="Variations"
          />
        </div>
      )}

      {/* Variation spec subtitle */}
      <p className="text-[10px] text-gray-400 font-mono -mt-3 mb-4">{selectedVariation.variationSpec}</p>

      {/* Yield */}
      <YieldSection yieldSpec={selectedVariation.yield} />

      {/* Filling slots */}
      {selectedVariation.fillings && selectedVariation.fillings.length > 0 && (
        <FillingSlotsSection
          fillings={selectedVariation.fillings}
          onFillingClick={onFillingClick}
          onIngredientClick={onIngredientClick}
        />
      )}

      {/* Subtype-specific content */}
      {selectedVariation.isMoldedBonBonVariation() && (
        <MoldedBonBonContent
          confection={confection as LibraryRuntime.IMoldedBonBonRecipe}
          variation={selectedVariation}
          onIngredientClick={onIngredientClick}
          onMoldClick={onMoldClick}
        />
      )}
      {selectedVariation.isBarTruffleVariation() && (
        <BarTruffleContent variation={selectedVariation} onIngredientClick={onIngredientClick} />
      )}
      {selectedVariation.isRolledTruffleVariation() && (
        <RolledTruffleContent variation={selectedVariation} onIngredientClick={onIngredientClick} />
      )}

      {/* Decorations */}
      {selectedVariation.decorations && (
        <DecorationsSection
          decorations={selectedVariation.decorations}
          onDecorationClick={onDecorationClick}
        />
      )}

      {/* Procedures */}
      {selectedVariation.procedures && (
        <ProceduresSection procedures={selectedVariation.procedures} onProcedureClick={onProcedureClick} />
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
