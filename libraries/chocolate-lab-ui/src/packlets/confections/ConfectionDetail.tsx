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

import React, { useState, useMemo } from 'react';

import type {
  LibraryRuntime,
  Model,
  ConfectionRecipeVariationSpec,
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
// Clickable Row Helper
// ============================================================================

function ClickableRow({
  label,
  sublabel,
  preferred,
  onClick
}: {
  readonly label: string;
  readonly sublabel?: string;
  readonly preferred?: boolean;
  readonly onClick?: () => void;
}): React.ReactElement {
  return (
    <div
      className={`flex items-center gap-2 py-1.5 px-2 rounded-md text-sm ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={onClick}
    >
      <span className="flex-1 min-w-0 truncate text-gray-800">
        {label}
        {preferred && <span className="ml-1 text-xs text-amber-500">★</span>}
      </span>
      {sublabel && <span className="text-xs text-gray-400 shrink-0">{sublabel}</span>}
      {onClick && <span className="text-gray-300 text-xs shrink-0">›</span>}
    </div>
  );
}

// ============================================================================
// Variation Selector
// ============================================================================

function VariationSelector({
  variations,
  goldenSpec,
  selectedSpec,
  onSelect
}: {
  readonly variations: ReadonlyArray<LibraryRuntime.AnyConfectionRecipeVariation>;
  readonly goldenSpec: ConfectionRecipeVariationSpec;
  readonly selectedSpec: ConfectionRecipeVariationSpec;
  readonly onSelect: (spec: ConfectionRecipeVariationSpec) => void;
}): React.ReactElement | null {
  if (variations.length <= 1) {
    return null;
  }
  return (
    <DetailSection title="Variations">
      <div className="flex flex-wrap gap-1">
        {variations.map((v) => {
          const isSelected = v.variationSpec === selectedSpec;
          const isGolden = v.variationSpec === goldenSpec;
          return (
            <button
              key={v.variationSpec}
              onClick={(): void => {
                onSelect(v.variationSpec);
              }}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                isSelected
                  ? 'bg-choco-primary text-white border-choco-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-choco-primary/40'
              }`}
            >
              {v.variationSpec}
              {isGolden ? ' ★' : ''}
            </button>
          );
        })}
      </div>
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
  decorations
}: {
  readonly decorations: ReadonlyArray<Entities.Confections.IConfectionDecoration>;
}): React.ReactElement | null {
  if (decorations.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Decorations">
      {decorations.map((d, i) => (
        <div key={i} className="text-sm text-gray-700 py-0.5">
          {d.description}
          {d.preferred && <span className="ml-1 text-xs text-amber-500">★ preferred</span>}
        </div>
      ))}
    </DetailSection>
  );
}

// ============================================================================
// Filling Slots Section
// ============================================================================

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
        <div key={slot.slotId} className="mb-2">
          <div className="text-xs text-gray-400 mb-0.5">{slot.name ?? slot.slotId}</div>
          {slot.filling.options.map((opt) => {
            const isPreferred = opt.id === slot.filling.preferredId;
            if (opt.type === 'recipe') {
              return (
                <ClickableRow
                  key={opt.id}
                  label={opt.filling.name}
                  sublabel="recipe"
                  preferred={isPreferred}
                  onClick={onFillingClick ? (): void => onFillingClick(opt.id as FillingId) : undefined}
                />
              );
            }
            return (
              <ClickableRow
                key={opt.id}
                label={opt.ingredient.name}
                sublabel="ingredient"
                preferred={isPreferred}
                onClick={
                  onIngredientClick ? (): void => onIngredientClick(opt.id as IngredientId) : undefined
                }
              />
            );
          })}
        </div>
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
  return (
    <DetailSection title="Procedures">
      {procedures.options.map((p) => (
        <ClickableRow
          key={p.id}
          label={p.procedure.name}
          sublabel={p.procedure.category}
          preferred={p.id === procedures.preferredId}
          onClick={onProcedureClick ? (): void => onProcedureClick(p.id) : undefined}
        />
      ))}
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
  return (
    <DetailSection title={title}>
      <ClickableRow
        label={spec.chocolate.name}
        sublabel="preferred"
        onClick={onIngredientClick ? (): void => onIngredientClick(spec.chocolate.id) : undefined}
      />
      {spec.alternates.map((alt) => (
        <ClickableRow
          key={alt.id}
          label={alt.name}
          sublabel="alternate"
          onClick={onIngredientClick ? (): void => onIngredientClick(alt.id) : undefined}
        />
      ))}
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
  return (
    <DetailSection title="Molds">
      {molds.options.map((m) => (
        <ClickableRow
          key={m.id}
          label={m.mold.displayName}
          sublabel={m.mold.format}
          preferred={m.id === molds.preferredId}
          onClick={onMoldClick ? (): void => onMoldClick(m.id) : undefined}
        />
      ))}
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
  return (
    <DetailSection title="Coatings">
      {coatings.options.map((c) => (
        <ClickableRow
          key={c.id}
          label={c.ingredient.name}
          preferred={coatings.preferred?.id === c.id}
          onClick={onIngredientClick ? (): void => onIngredientClick(c.id) : undefined}
        />
      ))}
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
  const { confection, onFillingClick, onIngredientClick, onMoldClick, onProcedureClick } = props;

  const [selectedSpec, setSelectedSpec] = useState<ConfectionRecipeVariationSpec>(
    confection.goldenVariationSpec
  );

  const selectedVariation = useMemo(() => {
    const result = confection.getVariation(selectedSpec);
    return result.isSuccess() ? result.value : confection.goldenVariation;
  }, [confection, selectedSpec]);

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
      <VariationSelector
        variations={confection.variations}
        goldenSpec={confection.goldenVariationSpec}
        selectedSpec={selectedSpec}
        onSelect={setSelectedSpec}
      />

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
      {selectedVariation.decorations && <DecorationsSection decorations={selectedVariation.decorations} />}

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
