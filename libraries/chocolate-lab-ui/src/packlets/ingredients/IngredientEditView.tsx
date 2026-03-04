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

import React, { useCallback, useMemo, useState } from 'react';
import {
  TagIcon,
  DocumentTextIcon,
  HashtagIcon,
  FolderIcon,
  BeakerIcon,
  BuildingOfficeIcon,
  SparklesIcon
} from '@heroicons/react/20/solid';

import {
  EditField,
  EditSection,
  TextInput,
  OptionalTextInput,
  TextAreaInput,
  NumberInput,
  SelectInput,
  TagsInput,
  CheckboxInput
} from '@fgv/ts-app-shell';

import {
  Entities,
  LibraryRuntime,
  IngredientCategory,
  Percentage,
  Model as CommonModel,
  type NoteCategory,
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

import type { Result } from '@fgv/ts-utils';

import { AiAssist } from '@fgv/ts-extras';

import { EditingToolbar, useEditingContext, AiRerollDialog, type IChangeIndicator } from '../editing';
import { useWorkspace } from '../workspace';

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
  /** Optional callback invoked after every mutation (undo, redo, or field edit). */
  readonly onMutation?: () => void;
  /** If true, the source entity is read-only (e.g. built-in collection). */
  readonly readOnly?: boolean;
  /** Optional AI prompt builder for re-roll. */
  readonly buildPrompt?: (name: string, additionalInstructions?: string) => AiAssist.AiPrompt;
  /** Optional converter for AI re-roll results. */
  readonly convert?: (from: unknown) => Result<IngredientEntity>;
}

// ============================================================================
// Constants & Chocolate-Specific Helpers
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

// ============================================================================
// Notes Editor
// ============================================================================

function NotesEditor({
  notes,
  onChange
}: {
  readonly notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined;
  readonly onChange: (notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined) => void;
}): React.ReactElement {
  const items = notes ?? [];

  const handleNoteTextChange = useCallback(
    (index: number, text: string) => {
      const updated = items.map((n, i) => (i === index ? { ...n, note: text } : n));
      onChange(updated.length > 0 ? updated : undefined);
    },
    [items, onChange]
  );

  const handleNoteCategoryChange = useCallback(
    (index: number, category: string) => {
      const updated = items.map((n, i) => (i === index ? { ...n, category: category as NoteCategory } : n));
      onChange(updated.length > 0 ? updated : undefined);
    },
    [items, onChange]
  );

  const handleRemoveNote = useCallback(
    (index: number) => {
      const updated = items.filter((__n, i) => i !== index);
      onChange(updated.length > 0 ? updated : undefined);
    },
    [items, onChange]
  );

  const handleAddNote = useCallback(() => {
    onChange([...items, { category: 'general' as NoteCategory, note: '' }]);
  }, [items, onChange]);

  return (
    <div className="space-y-2">
      {items.map((note, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            type="text"
            value={note.category}
            onChange={(e) => handleNoteCategoryChange(i, e.target.value)}
            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
            placeholder="category"
          />
          <textarea
            value={note.note}
            onChange={(e) => handleNoteTextChange(i, e.target.value)}
            rows={2}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary resize-y"
            placeholder="Note text"
          />
          <button
            onClick={() => handleRemoveNote(i)}
            className="px-1.5 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            title="Remove note"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={handleAddNote}
        className="text-xs text-choco-primary hover:text-choco-primary/80 transition-colors"
      >
        + Add note
      </button>
    </div>
  );
}

// ============================================================================
// Category-Specific Editors
// ============================================================================

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
  const { wrapper, onSave, onSaveAs, onCancel, onMutation, readOnly, buildPrompt, convert } = props;
  const [showReroll, setShowReroll] = useState(false);
  const {
    data: { logger }
  } = useWorkspace();

  const ctx = useEditingContext({
    wrapper,
    onSave,
    onSaveAs,
    onCancel,
    onMutation,
    readOnly,
    logger,
    checkHasChanges: (w) => w.hasChanges(w.initial)
  });

  const w = ctx.wrapper;
  const current = w.current;

  // ---- Change indicators ----

  const changes = useMemo(() => w.getChanges(w.initial), [w, ctx.version]);

  const changeIndicators: ReadonlyArray<IChangeIndicator> = useMemo(
    () => [
      { key: 'name', label: 'Name', icon: <TagIcon />, changed: changes.nameChanged },
      { key: 'category', label: 'Category', icon: <FolderIcon />, changed: changes.categoryChanged },
      {
        key: 'ganache',
        label: 'Ganache',
        icon: <BeakerIcon />,
        changed: changes.ganacheCharacteristicsChanged
      },
      {
        key: 'description',
        label: 'Description',
        icon: <DocumentTextIcon />,
        changed: changes.descriptionChanged
      },
      {
        key: 'manufacturer',
        label: 'Manufacturer',
        icon: <BuildingOfficeIcon />,
        changed: changes.manufacturerChanged
      },
      { key: 'notes', label: 'Notes', icon: <DocumentTextIcon />, changed: changes.notesChanged },
      { key: 'tags', label: 'Tags', icon: <HashtagIcon />, changed: changes.tagsChanged }
    ],
    [changes]
  );

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

  const handleNotesChange = useCallback(
    (notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined) => {
      w.setNotes(notes);
      ctx.notifyMutation();
    },
    [w, ctx]
  );

  // ---- Render ----

  return (
    <div className="flex flex-col h-full">
      <EditingToolbar
        context={ctx}
        changeIndicators={changeIndicators}
        extraButtons={
          buildPrompt && convert ? (
            <button
              type="button"
              onClick={(): void => setShowReroll(!showReroll)}
              title="Re-generate with AI"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>AI</span>
            </button>
          ) : undefined
        }
      />

      {/* AI Re-roll dialog */}
      {showReroll && buildPrompt && convert && (
        <div className="px-4 pt-3">
          <AiRerollDialog
            entityName={current.name}
            entityLabel="Ingredient"
            buildPrompt={buildPrompt}
            convert={convert}
            onResult={(generated): void => {
              w.applyUpdate(generated);
              ctx.notifyMutation();
              setShowReroll(false);
            }}
            onCancel={(): void => setShowReroll(false)}
          />
        </div>
      )}

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

        {/* Notes */}
        <EditSection title="Notes">
          <NotesEditor notes={current.notes} onChange={handleNotesChange} />
        </EditSection>
      </div>
    </div>
  );
}
