/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useCallback, useMemo } from 'react';
import { TextField, TextAreaField, NumberField, SelectField } from '../../../components/form';
import {
  allAllergens,
  allCacaoVarieties,
  allCertifications,
  allChocolateApplications,
  allChocolateTypes,
  allFluidityStars,
  allIngredientCategories,
  allIngredientPhases,
  type Allergen,
  type CacaoVariety,
  type Certification,
  type ChocolateApplication,
  type ChocolateType,
  type FluidityStars,
  type IngredientCategory,
  type IngredientPhase,
  Entities
} from '@fgv/ts-chocolate';
import type { Result } from '@fgv/ts-utils';

// Type alias for Ingredient
type Ingredient = Entities.Ingredients.Ingredient;

/**
 * Form data for editing an ingredient
 */
export interface IIngredientFormData {
  name: string;
  description: string;
  manufacturer: string;
  category: IngredientCategory;
  density: number | undefined;
  phase: IngredientPhase | '';
  tagsText: string;

  vegan: boolean;
  certifications: Certification[];
  allergens: Allergen[];
  traceAllergens: Allergen[];

  urls: Array<{ category: string; url: string }>;

  ganacheCharacteristics: {
    cacaoFat: number;
    sugar: number;
    milkFat: number;
    water: number;
    solids: number;
    otherFats: number;
  };

  chocolateType: ChocolateType;
  cacaoPercentage: number | undefined;
  fluidityStars: FluidityStars | '';
  viscosityMcM: number | undefined;
  temperatureCurveMelt: number | undefined;
  temperatureCurveCool: number | undefined;
  temperatureCurveWorking: number | undefined;
  beanVarieties: CacaoVariety[];
  applications: ChocolateApplication[];
  originsText: string;

  hydrationNumber: number | undefined;
  sweetnessPotency: number | undefined;

  fatContent: number | undefined;
  waterContent: number | undefined;

  meltingPoint: number | undefined;

  alcoholByVolume: number | undefined;
  flavorProfile: string;
}

/**
 * Props for IngredientEditForm
 */
export interface IIngredientEditFormProps {
  /** Initial ingredient data */
  ingredient: Ingredient;
  /** Save handler - returns Result with validation errors */
  onSave: (data: IIngredientFormData) => Result<void> | Promise<Result<void>>;
  /** Cancel handler */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

/**
 * Convert ingredient to form data
 */
function ingredientToFormData(ingredient: Ingredient): IIngredientFormData {
  const urls = (ingredient.urls ?? []).map((u) => ({ category: u.category, url: u.url }));

  const base: IIngredientFormData = {
    name: ingredient.name,
    description: ingredient.description ?? '',
    manufacturer: ingredient.manufacturer ?? '',
    category: ingredient.category,
    density: ingredient.density,
    phase: ingredient.phase ?? '',
    tagsText: (ingredient.tags ?? []).join(', '),
    vegan: ingredient.vegan ?? false,
    certifications: [...(ingredient.certifications ?? [])],
    allergens: [...(ingredient.allergens ?? [])],
    traceAllergens: [...(ingredient.traceAllergens ?? [])],
    urls,
    ganacheCharacteristics: {
      cacaoFat: ingredient.ganacheCharacteristics.cacaoFat,
      sugar: ingredient.ganacheCharacteristics.sugar,
      milkFat: ingredient.ganacheCharacteristics.milkFat,
      water: ingredient.ganacheCharacteristics.water,
      solids: ingredient.ganacheCharacteristics.solids,
      otherFats: ingredient.ganacheCharacteristics.otherFats
    },
    chocolateType: 'dark',
    cacaoPercentage: undefined,
    fluidityStars: '',
    viscosityMcM: undefined,
    temperatureCurveMelt: undefined,
    temperatureCurveCool: undefined,
    temperatureCurveWorking: undefined,
    beanVarieties: [],
    applications: [],
    originsText: '',
    hydrationNumber: undefined,
    sweetnessPotency: undefined,
    fatContent: undefined,
    waterContent: undefined,
    meltingPoint: undefined,
    alcoholByVolume: undefined,
    flavorProfile: ''
  };

  if (Entities.Ingredients.isChocolateIngredient(ingredient)) {
    const tc = ingredient.temperatureCurve;
    return {
      ...base,
      chocolateType: ingredient.chocolateType,
      cacaoPercentage: ingredient.cacaoPercentage,
      fluidityStars: ingredient.fluidityStars ?? '',
      viscosityMcM: ingredient.viscosityMcM,
      temperatureCurveMelt: tc?.melt,
      temperatureCurveCool: tc?.cool,
      temperatureCurveWorking: tc?.working,
      beanVarieties: [...(ingredient.beanVarieties ?? [])],
      applications: [...(ingredient.applications ?? [])],
      originsText: (ingredient.origins ?? []).join(', ')
    };
  }

  if (Entities.Ingredients.isSugarIngredient(ingredient)) {
    return {
      ...base,
      hydrationNumber: ingredient.hydrationNumber,
      sweetnessPotency: ingredient.sweetnessPotency
    };
  }

  if (Entities.Ingredients.isDairyIngredient(ingredient)) {
    return {
      ...base,
      fatContent: ingredient.fatContent,
      waterContent: ingredient.waterContent
    };
  }

  if (Entities.Ingredients.isFatIngredient(ingredient)) {
    return {
      ...base,
      meltingPoint: ingredient.meltingPoint
    };
  }

  if (Entities.Ingredients.isAlcoholIngredient(ingredient)) {
    return {
      ...base,
      alcoholByVolume: ingredient.alcoholByVolume,
      flavorProfile: ingredient.flavorProfile ?? ''
    };
  }

  return base;
}

/**
 * Category options for select field
 */
const categoryOptions = allIngredientCategories.map((cat) => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1)
}));

const phaseOptions = [
  { value: '', label: 'None' },
  ...allIngredientPhases.map((p) => ({ value: p, label: p }))
];

const chocolateTypeOptions = allChocolateTypes.map((t) => ({ value: t, label: t }));

const fluidityStarsOptions = [
  { value: '', label: 'None' },
  ...allFluidityStars.map((s) => ({ value: String(s), label: String(s) }))
];

/**
 * Form for editing ingredient properties
 */
export function IngredientEditForm({
  ingredient,
  onSave,
  onCancel,
  isSaving = false
}: IIngredientEditFormProps): React.ReactElement {
  const [formData, setFormData] = useState<IIngredientFormData>(() => ingredientToFormData(ingredient));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateGanacheField = useCallback(
    (field: keyof IIngredientFormData['ganacheCharacteristics'], value: number) => {
      setFormData((prev) => ({
        ...prev,
        ganacheCharacteristics: {
          ...prev.ganacheCharacteristics,
          [field]: value
        }
      }));
      setSaveError(null);
    },
    []
  );

  const toggleArrayValue = useCallback(<T extends string>(field: keyof IIngredientFormData, value: T) => {
    setFormData((prev) => {
      const current = prev[field] as unknown as T[];
      const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
      return { ...prev, [field]: next } as IIngredientFormData;
    });
    setSaveError(null);
  }, []);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    const normalize = (data: IIngredientFormData): string => {
      const sorted = {
        ...data,
        tagsText: data.tagsText
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .sort()
          .join(','),
        certifications: [...data.certifications].sort(),
        allergens: [...data.allergens].sort(),
        traceAllergens: [...data.traceAllergens].sort(),
        beanVarieties: [...data.beanVarieties].sort(),
        applications: [...data.applications].sort(),
        originsText: data.originsText
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .sort()
          .join(','),
        urls: data.urls
          .map((u) => ({ category: u.category.trim(), url: u.url.trim() }))
          .filter((u) => u.category.length > 0 || u.url.length > 0)
          .sort((a, b) => `${a.category}|${a.url}`.localeCompare(`${b.category}|${b.url}`))
      };
      return JSON.stringify(sorted);
    };

    return normalize(formData) !== normalize(ingredientToFormData(ingredient));
  }, [formData, ingredient]);

  // Update a single field
  const updateField = useCallback(
    <K extends keyof IIngredientFormData>(field: K, value: IIngredientFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field error when user edits
      setErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
      setSaveError(null);
    },
    []
  );

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be 200 characters or less';
    }

    if (formData.description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }

    if (formData.manufacturer.length > 200) {
      newErrors.manufacturer = 'Manufacturer must be 200 characters or less';
    }

    if (formData.density !== undefined && (formData.density < 0.1 || formData.density > 5.0)) {
      newErrors.density = 'Density must be between 0.1 and 5.0';
    }

    const g = formData.ganacheCharacteristics;
    const gTotal = g.cacaoFat + g.sugar + g.milkFat + g.water + g.solids + g.otherFats;
    const gFields: Array<[keyof typeof g, string]> = [
      ['cacaoFat', 'Cacao Fat'],
      ['sugar', 'Sugar'],
      ['milkFat', 'Milk Fat'],
      ['water', 'Water'],
      ['solids', 'Solids'],
      ['otherFats', 'Other Fats']
    ];
    for (const [field, label] of gFields) {
      const v = g[field];
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        newErrors[`ganache_${String(field)}`] = `${label} must be between 0 and 100`;
      }
    }
    if (gTotal < 0 || gTotal > 100) {
      newErrors.ganache_total = 'Ganache characteristic totals must be between 0 and 100';
    }

    if (formData.category === 'chocolate') {
      if (!formData.chocolateType) {
        newErrors.chocolateType = 'Chocolate type is required';
      }
      if (formData.cacaoPercentage === undefined || !Number.isFinite(formData.cacaoPercentage)) {
        newErrors.cacaoPercentage = 'Cacao percentage is required';
      } else if (formData.cacaoPercentage < 0 || formData.cacaoPercentage > 100) {
        newErrors.cacaoPercentage = 'Cacao percentage must be between 0 and 100';
      }

      const tcAny =
        formData.temperatureCurveMelt !== undefined ||
        formData.temperatureCurveCool !== undefined ||
        formData.temperatureCurveWorking !== undefined;
      const tcAll =
        formData.temperatureCurveMelt !== undefined &&
        formData.temperatureCurveCool !== undefined &&
        formData.temperatureCurveWorking !== undefined;
      if (tcAny && !tcAll) {
        newErrors.temperatureCurve =
          'If set, temperature curve requires melt, cool, and working temperatures';
      }
    }

    if (formData.category === 'dairy') {
      if (formData.fatContent !== undefined && (formData.fatContent < 0 || formData.fatContent > 100)) {
        newErrors.fatContent = 'Fat content must be between 0 and 100';
      }
      if (formData.waterContent !== undefined && (formData.waterContent < 0 || formData.waterContent > 100)) {
        newErrors.waterContent = 'Water content must be between 0 and 100';
      }
    }

    if (formData.category === 'alcohol') {
      if (
        formData.alcoholByVolume !== undefined &&
        (formData.alcoholByVolume < 0 || formData.alcoholByVolume > 100)
      ) {
        newErrors.alcoholByVolume = 'Alcohol by volume must be between 0 and 100';
      }
      if (formData.flavorProfile.length > 500) {
        newErrors.flavorProfile = 'Flavor profile must be 500 characters or less';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validate()) {
      return;
    }

    const result = await onSave(formData);
    if (result.isFailure()) {
      setSaveError(result.message);
    }
  }, [formData, validate, onSave]);

  // Handle cancel with confirmation if dirty
  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    onCancel();
  }, [isDirty, onCancel]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Ingredient</h2>

      {saveError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={(v) => updateField('name', v)}
            error={errors.name}
            required
            maxLength={200}
            disabled={isSaving}
          />

          <SelectField
            label="Category"
            name="category"
            value={formData.category}
            onChange={(v) => updateField('category', v as IngredientCategory)}
            options={categoryOptions}
            error={errors.category}
            required
            disabled={isSaving}
          />

          <TextField
            label="Manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={(v) => updateField('manufacturer', v)}
            error={errors.manufacturer}
            maxLength={200}
            disabled={isSaving}
          />

          <NumberField
            label="Density"
            name="density"
            value={formData.density}
            onChange={(v) => updateField('density', v)}
            error={errors.density}
            min={0.1}
            max={5}
            step={0.01}
            unit="g/mL"
            disabled={isSaving}
          />

          <SelectField
            label="Phase"
            name="phase"
            value={formData.phase}
            onChange={(v) => updateField('phase', v as IngredientPhase | '')}
            options={phaseOptions}
            error={errors.phase}
            disabled={isSaving}
          />

          <TextField
            label="Tags (comma-separated)"
            name="tagsText"
            value={formData.tagsText}
            onChange={(v) => updateField('tagsText', v)}
            error={errors.tagsText}
            disabled={isSaving}
          />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          value={formData.description}
          onChange={(v) => updateField('description', v)}
          error={errors.description}
          rows={3}
          maxLength={2000}
          disabled={isSaving}
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Diet & certifications</div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.vegan}
                onChange={() => updateField('vegan', !formData.vegan)}
                disabled={isSaving}
              />
              Vegan
            </label>

            <div className="grid grid-cols-2 gap-2">
              {allCertifications.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.certifications.includes(c)}
                    onChange={() => toggleArrayValue<Certification>('certifications', c)}
                    disabled={isSaving}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Allergens</div>

            <div className="grid grid-cols-2 gap-2">
              {allAllergens.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.allergens.includes(a)}
                    onChange={() => toggleArrayValue<Allergen>('allergens', a)}
                    disabled={isSaving}
                  />
                  {a}
                </label>
              ))}
            </div>

            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Trace allergens</div>
            <div className="grid grid-cols-2 gap-2">
              {allAllergens.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.traceAllergens.includes(a)}
                    onChange={() => toggleArrayValue<Allergen>('traceAllergens', a)}
                    disabled={isSaving}
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ganache characteristics (%)
          </div>
          {errors.ganache_total && (
            <div className="text-sm text-red-600 dark:text-red-400 mb-2">{errors.ganache_total}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberField
              label="Cacao fat"
              name="ganache_cacaoFat"
              value={formData.ganacheCharacteristics.cacaoFat}
              onChange={(v) => updateGanacheField('cacaoFat', v ?? 0)}
              error={errors.ganache_cacaoFat}
              min={0}
              max={100}
              step={0.1}
              disabled={isSaving}
            />
            <NumberField
              label="Sugar"
              name="ganache_sugar"
              value={formData.ganacheCharacteristics.sugar}
              onChange={(v) => updateGanacheField('sugar', v ?? 0)}
              error={errors.ganache_sugar}
              min={0}
              max={100}
              step={0.1}
              disabled={isSaving}
            />
            <NumberField
              label="Milk fat"
              name="ganache_milkFat"
              value={formData.ganacheCharacteristics.milkFat}
              onChange={(v) => updateGanacheField('milkFat', v ?? 0)}
              error={errors.ganache_milkFat}
              min={0}
              max={100}
              step={0.1}
              disabled={isSaving}
            />
            <NumberField
              label="Water"
              name="ganache_water"
              value={formData.ganacheCharacteristics.water}
              onChange={(v) => updateGanacheField('water', v ?? 0)}
              error={errors.ganache_water}
              min={0}
              max={100}
              step={0.1}
              disabled={isSaving}
            />
            <NumberField
              label="Solids"
              name="ganache_solids"
              value={formData.ganacheCharacteristics.solids}
              onChange={(v) => updateGanacheField('solids', v ?? 0)}
              error={errors.ganache_solids}
              min={0}
              max={100}
              step={0.1}
              disabled={isSaving}
            />
            <NumberField
              label="Other fats"
              name="ganache_otherFats"
              value={formData.ganacheCharacteristics.otherFats}
              onChange={(v) => updateGanacheField('otherFats', v ?? 0)}
              error={errors.ganache_otherFats}
              min={0}
              max={100}
              step={0.1}
              disabled={isSaving}
            />
          </div>
        </div>

        {formData.category === 'chocolate' && (
          <div className="mt-6 space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Chocolate details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Chocolate type"
                name="chocolateType"
                value={formData.chocolateType}
                onChange={(v) => updateField('chocolateType', v as ChocolateType)}
                options={chocolateTypeOptions}
                error={errors.chocolateType}
                disabled={isSaving}
              />
              <NumberField
                label="Cacao percentage"
                name="cacaoPercentage"
                value={formData.cacaoPercentage}
                onChange={(v) => updateField('cacaoPercentage', v)}
                error={errors.cacaoPercentage}
                min={0}
                max={100}
                step={0.1}
                disabled={isSaving}
              />
              <SelectField
                label="Fluidity stars"
                name="fluidityStars"
                value={formData.fluidityStars === '' ? '' : String(formData.fluidityStars)}
                onChange={(v) =>
                  updateField('fluidityStars', v === '' ? '' : (parseInt(v, 10) as FluidityStars))
                }
                options={fluidityStarsOptions}
                error={errors.fluidityStars}
                disabled={isSaving}
              />
              <NumberField
                label="Viscosity (McM)"
                name="viscosityMcM"
                value={formData.viscosityMcM}
                onChange={(v) => updateField('viscosityMcM', v)}
                error={errors.viscosityMcM}
                min={0}
                step={1}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField
                label="Temp melt (°C)"
                name="temperatureCurveMelt"
                value={formData.temperatureCurveMelt}
                onChange={(v) => updateField('temperatureCurveMelt', v)}
                error={errors.temperatureCurve}
                step={0.1}
                disabled={isSaving}
              />
              <NumberField
                label="Temp cool (°C)"
                name="temperatureCurveCool"
                value={formData.temperatureCurveCool}
                onChange={(v) => updateField('temperatureCurveCool', v)}
                error={errors.temperatureCurve}
                step={0.1}
                disabled={isSaving}
              />
              <NumberField
                label="Temp working (°C)"
                name="temperatureCurveWorking"
                value={formData.temperatureCurveWorking}
                onChange={(v) => updateField('temperatureCurveWorking', v)}
                error={errors.temperatureCurve}
                step={0.1}
                disabled={isSaving}
              />
            </div>

            <TextField
              label="Origins (comma-separated)"
              name="originsText"
              value={formData.originsText}
              onChange={(v) => updateField('originsText', v)}
              error={errors.originsText}
              disabled={isSaving}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Bean varieties</div>
                <div className="grid grid-cols-2 gap-2">
                  {allCacaoVarieties.map((v) => (
                    <label
                      key={v}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={formData.beanVarieties.includes(v)}
                        onChange={() => toggleArrayValue<CacaoVariety>('beanVarieties', v)}
                        disabled={isSaving}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Applications</div>
                <div className="grid grid-cols-2 gap-2">
                  {allChocolateApplications.map((a) => (
                    <label
                      key={a}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={formData.applications.includes(a)}
                        onChange={() => toggleArrayValue<ChocolateApplication>('applications', a)}
                        disabled={isSaving}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.category === 'sugar' && (
          <div className="mt-6 space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Sugar details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField
                label="Hydration number"
                name="hydrationNumber"
                value={formData.hydrationNumber}
                onChange={(v) => updateField('hydrationNumber', v)}
                error={errors.hydrationNumber}
                step={0.1}
                disabled={isSaving}
              />
              <NumberField
                label="Sweetness potency"
                name="sweetnessPotency"
                value={formData.sweetnessPotency}
                onChange={(v) => updateField('sweetnessPotency', v)}
                error={errors.sweetnessPotency}
                step={0.1}
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        {formData.category === 'dairy' && (
          <div className="mt-6 space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Dairy details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField
                label="Fat content (%)"
                name="fatContent"
                value={formData.fatContent}
                onChange={(v) => updateField('fatContent', v)}
                error={errors.fatContent}
                min={0}
                max={100}
                step={0.1}
                disabled={isSaving}
              />
              <NumberField
                label="Water content (%)"
                name="waterContent"
                value={formData.waterContent}
                onChange={(v) => updateField('waterContent', v)}
                error={errors.waterContent}
                min={0}
                max={100}
                step={0.1}
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        {formData.category === 'fat' && (
          <div className="mt-6 space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Fat details</div>
            <NumberField
              label="Melting point (°C)"
              name="meltingPoint"
              value={formData.meltingPoint}
              onChange={(v) => updateField('meltingPoint', v)}
              error={errors.meltingPoint}
              step={0.1}
              disabled={isSaving}
            />
          </div>
        )}

        {formData.category === 'alcohol' && (
          <div className="mt-6 space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Alcohol details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField
                label="Alcohol by volume (%)"
                name="alcoholByVolume"
                value={formData.alcoholByVolume}
                onChange={(v) => updateField('alcoholByVolume', v)}
                error={errors.alcoholByVolume}
                min={0}
                max={100}
                step={0.1}
                disabled={isSaving}
              />
              <TextField
                label="Flavor profile"
                name="flavorProfile"
                value={formData.flavorProfile}
                onChange={(v) => updateField('flavorProfile', v)}
                error={errors.flavorProfile}
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Links</div>
            <button
              type="button"
              onClick={() => updateField('urls', [...formData.urls, { category: '', url: '' }])}
              disabled={isSaving}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Add link
            </button>
          </div>
          <div className="space-y-2">
            {formData.urls.map((u, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end">
                <TextField
                  label={idx === 0 ? 'Category' : ''}
                  name={`url_category_${idx}`}
                  value={u.category}
                  onChange={(v) =>
                    updateField(
                      'urls',
                      formData.urls.map((x, i) => (i === idx ? { ...x, category: v } : x))
                    )
                  }
                  disabled={isSaving}
                />
                <TextField
                  label={idx === 0 ? 'URL' : ''}
                  name={`url_url_${idx}`}
                  value={u.url}
                  onChange={(v) =>
                    updateField(
                      'urls',
                      formData.urls.map((x, i) => (i === idx ? { ...x, url: v } : x))
                    )
                  }
                  type="url"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      'urls',
                      formData.urls.filter((_, i) => i !== idx)
                    )
                  }
                  disabled={isSaving}
                  className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-chocolate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 rounded-md hover:bg-chocolate-700 focus:outline-none focus:ring-2 focus:ring-chocolate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
