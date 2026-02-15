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
 * Editable ingredient view wired to EditedIngredient with undo/redo support.
 * @packageDocumentation
 */

import React, { useCallback } from 'react';

import {
  Entities,
  LibraryRuntime,
  IngredientCategory,
  Percentage,
  Model as CommonModel,
  type Allergen,
  type Certification,
  type ChocolateType,
  type FluidityStars,
  type DegreesMacMichael,
  type CacaoVariety,
  type ChocolateApplication,
  type Celsius
} from '@fgv/ts-chocolate';

type EditedIngredient = LibraryRuntime.EditedIngredient;
type IGanacheCharacteristics = Entities.Ingredients.IGanacheCharacteristics;
type IngredientEntity = Entities.Ingredients.IngredientEntity;

import { EditingToolbar, useEditingContext } from '../editing';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the IngredientEditView component.
 * @public
 */
export interface IIngredientEditViewProps {
  /** The EditedIngredient wrapper to edit. */
  readonly wrapper: EditedIngredient;
  /** Called when the user requests save. */
  readonly onSave: (wrapper: EditedIngredient) => void;
  /** Called when the user requests "save to" another collection. */
  readonly onSaveAs?: (wrapper: EditedIngredient) => void;
  /** Called when the user cancels editing. */
  readonly onCancel: () => void;
  /** If true, the source entity is read-only (e.g. built-in collection). */
  readonly readOnly?: boolean;
}

// ============================================================================
// Field Helpers
// ============================================================================

const ALL_CATEGORIES: ReadonlyArray<IngredientCategory> = [
  'chocolate',
  'sugar',
  'dairy',
  'fat',
  'alcohol',
  'liquid',
  'flavor',
  'other'
];

function EditField({
  label,
  children
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <label className="text-xs text-gray-500 w-32 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}): React.ReactElement {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    />
  );
}

function OptionalTextInput({
  value,
  onChange,
  placeholder
}: {
  readonly value: string | undefined;
  readonly onChange: (value: string | undefined) => void;
  readonly placeholder?: string;
}): React.ReactElement {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    />
  );
}

function TextAreaInput({
  value,
  onChange,
  placeholder
}: {
  readonly value: string | undefined;
  readonly onChange: (value: string | undefined) => void;
  readonly placeholder?: string;
}): React.ReactElement {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary resize-y"
    />
  );
}

function PercentageInput({
  value,
  onChange,
  label
}: {
  readonly value: Percentage;
  readonly onChange: (value: Percentage) => void;
  readonly label: string;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          if (!isNaN(num)) {
            onChange(Math.max(0, Math.min(100, num)) as Percentage);
          }
        }}
        min={0}
        max={100}
        step={0.1}
        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary text-right"
        aria-label={label}
      />
      <span className="text-xs text-gray-500">%</span>
    </div>
  );
}

function SelectInput<T extends string>({
  value,
  options,
  onChange
}: {
  readonly value: T;
  readonly options: ReadonlyArray<T>;
  readonly onChange: (value: T) => void;
}): React.ReactElement {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder
}: {
  readonly value: ReadonlyArray<string> | undefined;
  readonly onChange: (value: ReadonlyArray<string> | undefined) => void;
  readonly placeholder?: string;
}): React.ReactElement {
  const text = value?.join(', ') ?? '';
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw.trim()) {
          onChange(undefined);
        } else {
          onChange(
            raw
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          );
        }
      }}
      placeholder={placeholder ?? 'comma-separated values'}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
    />
  );
}

function NumberInput({
  value,
  onChange,
  label,
  min,
  max,
  step
}: {
  readonly value: number | undefined;
  readonly onChange: (value: number | undefined) => void;
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}): React.ReactElement {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw.trim()) {
          onChange(undefined);
        } else {
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            onChange(num);
          }
        }
      }}
      min={min}
      max={max}
      step={step ?? 0.1}
      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary text-right"
      aria-label={label}
    />
  );
}

function CheckboxInput({
  value,
  onChange,
  label
}: {
  readonly value: boolean | undefined;
  readonly onChange: (value: boolean | undefined) => void;
  readonly label: string;
}): React.ReactElement {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked || undefined)}
        className="rounded border-gray-300 text-choco-primary focus:ring-choco-primary"
      />
      {label}
    </label>
  );
}

// ============================================================================
// Section Helpers
// ============================================================================

function EditSection({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{title}</h4>
      {children}
    </div>
  );
}

// ============================================================================
// Category-Specific Constants
// ============================================================================

const ALL_CHOCOLATE_TYPES: ReadonlyArray<ChocolateType> = CommonModel.Enums.allChocolateTypes;
const ALL_CACAO_VARIETIES: ReadonlyArray<CacaoVariety> = CommonModel.Enums.allCacaoVarieties;
const ALL_CHOCOLATE_APPLICATIONS: ReadonlyArray<ChocolateApplication> =
  CommonModel.Enums.allChocolateApplications;
const ALL_FLUIDITY_STARS: ReadonlyArray<FluidityStars> = CommonModel.Enums.allFluidityStars;

// ============================================================================
// Ganache Characteristics Editor
// ============================================================================

function GanacheEditor({
  gc,
  onChange
}: {
  readonly gc: IGanacheCharacteristics;
  readonly onChange: (gc: IGanacheCharacteristics) => void;
}): React.ReactElement {
  const update = useCallback(
    (field: keyof IGanacheCharacteristics, value: Percentage) => {
      onChange({ ...gc, [field]: value });
    },
    [gc, onChange]
  );

  return (
    <EditSection title="Ganache Characteristics">
      <EditField label="Cacao Fat">
        <PercentageInput value={gc.cacaoFat} onChange={(v) => update('cacaoFat', v)} label="Cacao Fat %" />
      </EditField>
      <EditField label="Sugar">
        <PercentageInput value={gc.sugar} onChange={(v) => update('sugar', v)} label="Sugar %" />
      </EditField>
      <EditField label="Milk Fat">
        <PercentageInput value={gc.milkFat} onChange={(v) => update('milkFat', v)} label="Milk Fat %" />
      </EditField>
      <EditField label="Water">
        <PercentageInput value={gc.water} onChange={(v) => update('water', v)} label="Water %" />
      </EditField>
      <EditField label="Solids">
        <PercentageInput value={gc.solids} onChange={(v) => update('solids', v)} label="Solids %" />
      </EditField>
      <EditField label="Other Fats">
        <PercentageInput value={gc.otherFats} onChange={(v) => update('otherFats', v)} label="Other Fats %" />
      </EditField>
    </EditSection>
  );
}

// ============================================================================
// Category-Specific Editors
// ============================================================================

function ChocolateFieldsEditor({
  entity,
  onUpdate
}: {
  readonly entity: Entities.Ingredients.IChocolateIngredientEntity;
  readonly onUpdate: (update: Partial<IngredientEntity>) => void;
}): React.ReactElement {
  return (
    <EditSection title="Chocolate Properties">
      <EditField label="Chocolate Type">
        <SelectInput
          value={entity.chocolateType}
          options={ALL_CHOCOLATE_TYPES}
          onChange={(v) => onUpdate({ chocolateType: v })}
        />
      </EditField>
      <EditField label="Cacao %">
        <PercentageInput
          value={entity.cacaoPercentage}
          onChange={(v) => onUpdate({ cacaoPercentage: v })}
          label="Cacao %"
        />
      </EditField>
      <EditField label="Fluidity Stars">
        <select
          value={entity.fluidityStars ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate({ fluidityStars: val ? (parseInt(val, 10) as FluidityStars) : undefined });
          }}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
        >
          <option value="">—</option>
          {ALL_FLUIDITY_STARS.map((s) => (
            <option key={s} value={s}>
              {'★'.repeat(s)}
            </option>
          ))}
        </select>
      </EditField>
      <EditField label="Viscosity (McM)">
        <NumberInput
          value={entity.viscosityMcM}
          onChange={(v) => onUpdate({ viscosityMcM: v as DegreesMacMichael | undefined })}
          label="Viscosity McM"
          min={0}
          step={1}
        />
      </EditField>
      <EditField label="Tempering">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs text-gray-500">Melt</span>
          <NumberInput
            value={entity.temperatureCurve?.melt}
            onChange={(v) => {
              const tc = entity.temperatureCurve ?? {
                melt: 0 as Celsius,
                cool: 0 as Celsius,
                working: 0 as Celsius
              };
              onUpdate({ temperatureCurve: v !== undefined ? { ...tc, melt: v as Celsius } : undefined });
            }}
            label="Melt °C"
            step={0.5}
          />
          <span className="text-xs text-gray-500">Cool</span>
          <NumberInput
            value={entity.temperatureCurve?.cool}
            onChange={(v) => {
              const tc = entity.temperatureCurve ?? {
                melt: 0 as Celsius,
                cool: 0 as Celsius,
                working: 0 as Celsius
              };
              onUpdate({ temperatureCurve: v !== undefined ? { ...tc, cool: v as Celsius } : undefined });
            }}
            label="Cool °C"
            step={0.5}
          />
          <span className="text-xs text-gray-500">Work</span>
          <NumberInput
            value={entity.temperatureCurve?.working}
            onChange={(v) => {
              const tc = entity.temperatureCurve ?? {
                melt: 0 as Celsius,
                cool: 0 as Celsius,
                working: 0 as Celsius
              };
              onUpdate({ temperatureCurve: v !== undefined ? { ...tc, working: v as Celsius } : undefined });
            }}
            label="Working °C"
            step={0.5}
          />
        </div>
      </EditField>
      <EditField label="Bean Varieties">
        <TagsInput
          value={entity.beanVarieties}
          onChange={(v) => onUpdate({ beanVarieties: v as ReadonlyArray<CacaoVariety> | undefined })}
          placeholder={ALL_CACAO_VARIETIES.join(', ')}
        />
      </EditField>
      <EditField label="Applications">
        <TagsInput
          value={entity.applications}
          onChange={(v) => onUpdate({ applications: v as ReadonlyArray<ChocolateApplication> | undefined })}
          placeholder={ALL_CHOCOLATE_APPLICATIONS.join(', ')}
        />
      </EditField>
      <EditField label="Origins">
        <TagsInput
          value={entity.origins}
          onChange={(v) => onUpdate({ origins: v !== undefined ? [...v] : undefined })}
          placeholder="Ghana, Ivory Coast, ..."
        />
      </EditField>
    </EditSection>
  );
}

function SugarFieldsEditor({
  entity,
  onUpdate
}: {
  readonly entity: Entities.Ingredients.ISugarIngredientEntity;
  readonly onUpdate: (update: Partial<IngredientEntity>) => void;
}): React.ReactElement {
  return (
    <EditSection title="Sugar Properties">
      <EditField label="Sweetness">
        <NumberInput
          value={entity.sweetnessPotency}
          onChange={(v) => onUpdate({ sweetnessPotency: v })}
          label="Sweetness potency (1.0 = sucrose)"
          min={0}
          step={0.05}
        />
      </EditField>
      <EditField label="Hydration #">
        <NumberInput
          value={entity.hydrationNumber}
          onChange={(v) => onUpdate({ hydrationNumber: v })}
          label="Hydration number"
          min={0}
          step={0.1}
        />
      </EditField>
    </EditSection>
  );
}

function DairyFieldsEditor({
  entity,
  onUpdate
}: {
  readonly entity: Entities.Ingredients.IDairyIngredientEntity;
  readonly onUpdate: (update: Partial<IngredientEntity>) => void;
}): React.ReactElement {
  return (
    <EditSection title="Dairy Properties">
      <EditField label="Fat Content">
        <PercentageInput
          value={entity.fatContent ?? (0 as Percentage)}
          onChange={(v) => onUpdate({ fatContent: v || undefined })}
          label="Fat content %"
        />
      </EditField>
      <EditField label="Water Content">
        <PercentageInput
          value={entity.waterContent ?? (0 as Percentage)}
          onChange={(v) => onUpdate({ waterContent: v || undefined })}
          label="Water content %"
        />
      </EditField>
    </EditSection>
  );
}

function FatFieldsEditor({
  entity,
  onUpdate
}: {
  readonly entity: Entities.Ingredients.IFatIngredientEntity;
  readonly onUpdate: (update: Partial<IngredientEntity>) => void;
}): React.ReactElement {
  return (
    <EditSection title="Fat Properties">
      <EditField label="Melting Point">
        <div className="flex items-center gap-1">
          <NumberInput
            value={entity.meltingPoint}
            onChange={(v) => onUpdate({ meltingPoint: v as Celsius | undefined })}
            label="Melting point °C"
            step={0.5}
          />
          <span className="text-xs text-gray-500">°C</span>
        </div>
      </EditField>
    </EditSection>
  );
}

function AlcoholFieldsEditor({
  entity,
  onUpdate
}: {
  readonly entity: Entities.Ingredients.IAlcoholIngredientEntity;
  readonly onUpdate: (update: Partial<IngredientEntity>) => void;
}): React.ReactElement {
  return (
    <EditSection title="Alcohol Properties">
      <EditField label="ABV">
        <PercentageInput
          value={entity.alcoholByVolume ?? (0 as Percentage)}
          onChange={(v) => onUpdate({ alcoholByVolume: v || undefined })}
          label="Alcohol by volume %"
        />
      </EditField>
      <EditField label="Flavor Profile">
        <OptionalTextInput
          value={entity.flavorProfile}
          onChange={(v) => onUpdate({ flavorProfile: v })}
          placeholder="e.g. citrus, herbal, smoky"
        />
      </EditField>
    </EditSection>
  );
}

function CategorySpecificFields({
  entity,
  onUpdate
}: {
  readonly entity: IngredientEntity;
  readonly onUpdate: (update: Partial<IngredientEntity>) => void;
}): React.ReactElement | null {
  if (Entities.Ingredients.isChocolateIngredientEntity(entity)) {
    return <ChocolateFieldsEditor entity={entity} onUpdate={onUpdate} />;
  }
  if (Entities.Ingredients.isSugarIngredientEntity(entity)) {
    return <SugarFieldsEditor entity={entity} onUpdate={onUpdate} />;
  }
  if (Entities.Ingredients.isDairyIngredientEntity(entity)) {
    return <DairyFieldsEditor entity={entity} onUpdate={onUpdate} />;
  }
  if (Entities.Ingredients.isFatIngredientEntity(entity)) {
    return <FatFieldsEditor entity={entity} onUpdate={onUpdate} />;
  }
  if (Entities.Ingredients.isAlcoholIngredientEntity(entity)) {
    return <AlcoholFieldsEditor entity={entity} onUpdate={onUpdate} />;
  }
  return null;
}

// ============================================================================
// IngredientEditView Component
// ============================================================================

/**
 * Editable ingredient view with undo/redo toolbar.
 *
 * Renders form fields for all common ingredient properties, wired to
 * an {@link EditedIngredient} wrapper via {@link useEditingContext}.
 *
 * Each field change calls the appropriate setter on the wrapper, then
 * calls `notifyMutation()` to trigger a React re-render.
 *
 * @public
 */
export function IngredientEditView(props: IIngredientEditViewProps): React.ReactElement {
  const { wrapper, onSave, onSaveAs, onCancel, readOnly } = props;

  const ctx = useEditingContext({
    wrapper,
    onSave,
    onSaveAs,
    onCancel,
    readOnly
  });

  const w = ctx.wrapper;
  const current = w.current;

  // ---- Field change handlers ----

  const handleNameChange = useCallback(
    (name: string) => {
      w.setName(name);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleDescriptionChange = useCallback(
    (description: string | undefined) => {
      w.setDescription(description);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleManufacturerChange = useCallback(
    (manufacturer: string | undefined) => {
      w.setManufacturer(manufacturer);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleCategoryChange = useCallback(
    (category: IngredientCategory) => {
      w.applyUpdate({ category });
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleGanacheChange = useCallback(
    (gc: IGanacheCharacteristics) => {
      w.setGanacheCharacteristics(gc);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleTagsChange = useCallback(
    (tags: ReadonlyArray<string> | undefined) => {
      w.setTags(tags);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleAllergensChange = useCallback(
    (allergens: ReadonlyArray<string> | undefined) => {
      w.setAllergens(allergens as ReadonlyArray<Allergen> | undefined);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleTraceAllergensChange = useCallback(
    (traceAllergens: ReadonlyArray<string> | undefined) => {
      w.setTraceAllergens(traceAllergens as ReadonlyArray<Allergen> | undefined);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleCertificationsChange = useCallback(
    (certifications: ReadonlyArray<string> | undefined) => {
      w.setCertifications(certifications as ReadonlyArray<Certification> | undefined);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleVeganChange = useCallback(
    (vegan: boolean | undefined) => {
      w.setVegan(vegan);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  const handleCategoryFieldUpdate = useCallback(
    (update: Partial<IngredientEntity>) => {
      w.applyUpdate(update);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  // ---- Render ----

  return (
    <div className="flex flex-col h-full">
      <EditingToolbar context={ctx} />

      <div className="flex flex-col p-4 overflow-y-auto flex-1">
        {/* Header / Identity */}
        <EditSection title="Identity">
          <EditField label="Name">
            <TextInput value={current.name} onChange={handleNameChange} placeholder="Ingredient name" />
          </EditField>
          <EditField label="Category">
            <SelectInput value={current.category} options={ALL_CATEGORIES} onChange={handleCategoryChange} />
          </EditField>
          <EditField label="Manufacturer">
            <OptionalTextInput
              value={current.manufacturer}
              onChange={handleManufacturerChange}
              placeholder="Manufacturer"
            />
          </EditField>
          <EditField label="Description">
            <TextAreaInput
              value={current.description}
              onChange={handleDescriptionChange}
              placeholder="Description"
            />
          </EditField>
          <p className="text-xs text-gray-400 mt-1 font-mono">{current.baseId}</p>
        </EditSection>

        {/* Category-Specific Fields */}
        <CategorySpecificFields entity={current} onUpdate={handleCategoryFieldUpdate} />

        {/* Ganache Characteristics */}
        <GanacheEditor gc={current.ganacheCharacteristics} onChange={handleGanacheChange} />

        {/* Tags */}
        <EditSection title="Tags">
          <TagsInput value={current.tags} onChange={handleTagsChange} placeholder="tag1, tag2, ..." />
        </EditSection>

        {/* Allergens */}
        <EditSection title="Allergens">
          <EditField label="Allergens">
            <TagsInput
              value={current.allergens}
              onChange={handleAllergensChange}
              placeholder="dairy, nuts, ..."
            />
          </EditField>
          <EditField label="Trace">
            <TagsInput
              value={current.traceAllergens}
              onChange={handleTraceAllergensChange}
              placeholder="soy, wheat, ..."
            />
          </EditField>
        </EditSection>

        {/* Certifications */}
        <EditSection title="Certifications">
          <TagsInput
            value={current.certifications}
            onChange={handleCertificationsChange}
            placeholder="organic, fair-trade, ..."
          />
        </EditSection>

        {/* Vegan */}
        <EditSection title="Dietary">
          <CheckboxInput value={current.vegan} onChange={handleVeganChange} label="Vegan" />
        </EditSection>
      </div>
    </div>
  );
}
