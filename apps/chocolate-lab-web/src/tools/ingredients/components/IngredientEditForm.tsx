/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useCallback, useMemo } from 'react';
import { TextField, TextAreaField, NumberField, SelectField } from '../../../components/form';
import { allIngredientCategories, type IngredientCategory, type Entities } from '@fgv/ts-chocolate';
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
  tags: string[];
}

/**
 * Props for IngredientEditForm
 */
export interface IIngredientEditFormProps {
  /** Initial ingredient data */
  ingredient: Ingredient;
  /** Save handler - returns Result with validation errors */
  onSave: (data: IIngredientFormData) => Result<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

/**
 * Convert ingredient to form data
 */
function ingredientToFormData(ingredient: Ingredient): IIngredientFormData {
  return {
    name: ingredient.name,
    description: ingredient.description ?? '',
    manufacturer: ingredient.manufacturer ?? '',
    category: ingredient.category,
    density: ingredient.density,
    tags: [...(ingredient.tags ?? [])]
  };
}

/**
 * Category options for select field
 */
const categoryOptions = allIngredientCategories.map((cat) => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1)
}));

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

  // Check if form has been modified
  const isDirty = useMemo(() => {
    const original = ingredientToFormData(ingredient);
    return (
      formData.name !== original.name ||
      formData.description !== original.description ||
      formData.manufacturer !== original.manufacturer ||
      formData.category !== original.category ||
      formData.density !== original.density ||
      formData.tags.join(',') !== original.tags.join(',')
    );
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

    if (formData.density !== undefined && (formData.density < 0 || formData.density > 10)) {
      newErrors.density = 'Density must be between 0 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validate()) {
      return;
    }

    const result = onSave(formData);
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
          handleSave();
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
            min={0}
            max={10}
            step={0.01}
            unit="g/mL"
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
