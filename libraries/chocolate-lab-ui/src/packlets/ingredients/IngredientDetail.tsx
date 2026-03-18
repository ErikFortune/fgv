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
 * Read-only ingredient detail view.
 * @packageDocumentation
 */

import React, { useCallback } from 'react';

import { DetailSection, DetailRow, TagList } from '@fgv/ts-app-shell';
import type { LibraryRuntime } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection, copyJsonToClipboard } from '../common';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the IngredientDetail component.
 * @public
 */
export interface IIngredientDetailProps {
  /** The resolved runtime ingredient to display */
  readonly ingredient: LibraryRuntime.AnyIngredient;
  /** Optional callback to switch to edit mode */
  readonly onEdit?: () => void;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
}

// ============================================================================
// Category Colors
// ============================================================================

const INGREDIENT_CATEGORY_COLORS: Record<string, string> = {
  chocolate: 'bg-cat-chocolate-bg text-cat-chocolate-text',
  dairy: 'bg-cat-dairy-bg text-cat-dairy-text',
  sugar: 'bg-cat-sugar-bg text-cat-sugar-text',
  fat: 'bg-cat-fat-bg text-cat-fat-text',
  alcohol: 'bg-cat-alcohol-bg text-cat-alcohol-text',
  liquid: 'bg-cat-liquid-bg text-cat-liquid-text',
  flavor: 'bg-cat-flavor-bg text-cat-flavor-text',
  other: 'bg-surface-raised text-primary'
};

// ============================================================================
// Ganache Characteristics
// ============================================================================

function GanacheSection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.AnyIngredient;
}): React.ReactElement {
  const gc = ingredient.ganacheCharacteristics;
  return (
    <DetailSection title="Ganache Characteristics">
      <DetailRow label="Cacao Fat" value={`${gc.cacaoFat}%`} />
      <DetailRow label="Sugar" value={`${gc.sugar}%`} />
      <DetailRow label="Milk Fat" value={`${gc.milkFat}%`} />
      <DetailRow label="Water" value={`${gc.water}%`} />
      <DetailRow label="Solids" value={`${gc.solids}%`} />
      <DetailRow label="Other Fats" value={`${gc.otherFats}%`} />
    </DetailSection>
  );
}

// ============================================================================
// Chocolate-Specific Section
// ============================================================================

function ChocolateSection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.ChocolateIngredient;
}): React.ReactElement {
  return (
    <DetailSection title="Chocolate Properties">
      <DetailRow label="Type" value={ingredient.chocolateType} />
      <DetailRow label="Cacao %" value={`${ingredient.cacaoPercentage}%`} />
      <DetailRow
        label="Fluidity"
        value={ingredient.fluidityStars !== undefined ? `${ingredient.fluidityStars} stars` : undefined}
      />
      <DetailRow
        label="Viscosity"
        value={ingredient.viscosityMcM !== undefined ? `${ingredient.viscosityMcM} McM` : undefined}
      />
      {ingredient.beanVarieties && ingredient.beanVarieties.length > 0 && (
        <DetailRow label="Bean Varieties" value={ingredient.beanVarieties.join(', ')} />
      )}
      {ingredient.origins && ingredient.origins.length > 0 && (
        <DetailRow label="Origins" value={ingredient.origins.join(', ')} />
      )}
      {ingredient.applications && ingredient.applications.length > 0 && (
        <DetailRow label="Applications" value={ingredient.applications.join(', ')} />
      )}
    </DetailSection>
  );
}

// ============================================================================
// Dairy-Specific Section
// ============================================================================

function DairySection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.DairyIngredient;
}): React.ReactElement {
  return (
    <DetailSection title="Dairy Properties">
      <DetailRow
        label="Fat Content"
        value={ingredient.fatContent !== undefined ? `${ingredient.fatContent}%` : undefined}
      />
      <DetailRow
        label="Water Content"
        value={ingredient.waterContent !== undefined ? `${ingredient.waterContent}%` : undefined}
      />
    </DetailSection>
  );
}

// ============================================================================
// Alcohol-Specific Section
// ============================================================================

function AlcoholSection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.AlcoholIngredient;
}): React.ReactElement {
  return (
    <DetailSection title="Alcohol Properties">
      <DetailRow
        label="ABV"
        value={ingredient.alcoholByVolume !== undefined ? `${ingredient.alcoholByVolume}%` : undefined}
      />
      <DetailRow label="Flavor Profile" value={ingredient.flavorProfile} />
    </DetailSection>
  );
}

// ============================================================================
// Sugar-Specific Section
// ============================================================================

function SugarSection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.SugarIngredient;
}): React.ReactElement {
  return (
    <DetailSection title="Sugar Properties">
      <DetailRow
        label="Hydration Number"
        value={ingredient.hydrationNumber !== undefined ? String(ingredient.hydrationNumber) : undefined}
      />
      <DetailRow
        label="Sweetness Potency"
        value={
          ingredient.sweetnessPotency !== undefined ? `${ingredient.sweetnessPotency}x sucrose` : undefined
        }
      />
    </DetailSection>
  );
}

// ============================================================================
// Fat-Specific Section
// ============================================================================

function FatSection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.FatIngredient;
}): React.ReactElement {
  return (
    <DetailSection title="Fat Properties">
      <DetailRow
        label="Melting Point"
        value={ingredient.meltingPoint !== undefined ? `${ingredient.meltingPoint} °C` : undefined}
      />
    </DetailSection>
  );
}

// ============================================================================
// IngredientDetail Component
// ============================================================================

/**
 * Read-only detail view for an ingredient.
 *
 * Displays:
 * - Header with name, category badge, manufacturer
 * - Description
 * - Ganache characteristics
 * - Category-specific properties (chocolate type, cacao %, etc.)
 * - Tags, allergens, certifications
 *
 * @public
 */
export function IngredientDetail(props: IIngredientDetailProps): React.ReactElement {
  const { ingredient, onEdit, onClose } = props;

  const handleCopyJson = useCallback((): void => {
    copyJsonToClipboard(ingredient.entity);
  }, [ingredient]);

  return (
    <div className="flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <EntityDetailHeader
        title={ingredient.name}
        description={ingredient.description}
        badge={{
          label: ingredient.category,
          colorClass: INGREDIENT_CATEGORY_COLORS[ingredient.category] ?? INGREDIENT_CATEGORY_COLORS.other
        }}
        subtitle={ingredient.id}
        extraIndicators={
          ingredient.manufacturer ? (
            <span className="text-xs text-muted">{ingredient.manufacturer}</span>
          ) : undefined
        }
        onCopyJson={handleCopyJson}
        onEdit={onEdit}
        onClose={onClose}
      />

      {/* Ganache Characteristics */}
      <GanacheSection ingredient={ingredient} />

      {/* Category-specific properties */}
      {ingredient.isChocolate() && <ChocolateSection ingredient={ingredient} />}
      {ingredient.isDairy() && <DairySection ingredient={ingredient} />}
      {ingredient.isAlcohol() && <AlcoholSection ingredient={ingredient} />}
      {ingredient.isSugar() && <SugarSection ingredient={ingredient} />}
      {ingredient.isFat() && <FatSection ingredient={ingredient} />}

      {/* Tags */}
      {ingredient.tags.length > 0 && (
        <DetailSection title="Tags">
          <TagList tags={ingredient.tags} />
        </DetailSection>
      )}

      {/* Allergens */}
      {ingredient.allergens.length > 0 && (
        <DetailSection title="Allergens">
          <TagList tags={ingredient.allergens} />
        </DetailSection>
      )}

      {/* Trace Allergens */}
      {ingredient.traceAllergens.length > 0 && (
        <DetailSection title="Trace Allergens">
          <TagList tags={ingredient.traceAllergens} />
        </DetailSection>
      )}

      {/* Certifications */}
      {ingredient.certifications.length > 0 && (
        <DetailSection title="Certifications">
          <TagList tags={ingredient.certifications} />
        </DetailSection>
      )}

      {/* Vegan */}
      {ingredient.vegan !== undefined && <DetailRow label="Vegan" value={ingredient.vegan ? 'Yes' : 'No'} />}

      {/* Notes */}
      <NotesSection notes={ingredient.notes} />
    </div>
  );
}
