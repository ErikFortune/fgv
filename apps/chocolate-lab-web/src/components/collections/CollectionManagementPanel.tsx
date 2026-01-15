/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useChocolate } from '../../contexts/ChocolateContext';
import { useEditing, useCollectionManager, useIngredientEditor } from '../../contexts/EditingContext';
import { CollectionManagementPanelBase, type ICollectionInfo } from './CollectionManagementPanelBase';
import {
  type SourceId,
  type IngredientCategory,
  type Allergen,
  type Certification,
  allAllergens,
  allCertifications,
  allIngredientCategories,
  Converters as ChocolateConverters,
  Editing
} from '@fgv/ts-chocolate';

/**
 * Props for CollectionManagementPanel
 */
export interface ICollectionManagementPanelProps {
  /** Optional class name */
  className?: string;
  toolId?: string;
  selectedCollectionIds?: ReadonlyArray<string>;
  onToggleSelected?: (collectionId: string) => void;
  showHeader?: boolean;
  headerTitle?: string | null;
}

/**
 * Panel for managing ingredient collections
 */
export function CollectionManagementPanel({
  className = '',
  toolId = 'ingredients',
  selectedCollectionIds,
  onToggleSelected,
  showHeader = true,
  headerTitle = toolId === 'ingredients' ? 'Ingredient Collections' : 'Collections'
}: ICollectionManagementPanelProps): React.ReactElement {
  const { runtime, collections } = useChocolate();
  const { dirtyCollections, editingVersion } = useEditing();
  const { createCollection, deleteCollection, renameCollection, exportCollection, importCollection } =
    useCollectionManager();
  const [showAddIngredient, setShowAddIngredient] = useState<SourceId | null>(null);

  // Get collection info directly from the runtime library
  // This ensures newly created collections are visible immediately
  const collectionInfos = useMemo((): ICollectionInfo[] => {
    if (!runtime) return [];

    const infos: ICollectionInfo[] = [];

    const ctxCollections = collections.filter((c) => c.subLibraries.includes('ingredients'));
    const allIds = new Set<string>();
    for (const c of ctxCollections) {
      allIds.add(c.id);
    }
    for (const id of runtime.library.ingredients.collections.keys()) {
      allIds.add(id as string);
    }

    for (const id of allIds) {
      const collectionId = id as SourceId;
      const collectionCtx = ctxCollections.find((c) => c.id === id);
      const isProtected = collectionCtx?.isProtected ?? false;
      const isUnlocked = collectionCtx?.isUnlocked ?? true;
      const isLocked = isProtected && !isUnlocked;

      const collectionResult = runtime.library.ingredients.collections.get(collectionId);
      const runtimeCollection = collectionResult.isSuccess() ? collectionResult.value : undefined;
      const isLoaded = !!runtimeCollection;
      const metadata = runtimeCollection?.metadata;

      infos.push({
        id: collectionId,
        name: metadata?.name ?? collectionCtx?.name ?? collectionId,
        description: metadata?.description,
        isMutable: runtimeCollection?.isMutable ?? false,
        isProtected,
        isLocked,
        isLoaded,
        isDirty: dirtyCollections.includes(collectionId),
        itemCount: runtimeCollection?.items.size ?? 0
      });
    }

    // Sort: mutable first, then by name
    return infos.sort((a, b) => {
      if (a.isMutable !== b.isMutable) return a.isMutable ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [runtime, collections, dirtyCollections, editingVersion]);

  return (
    <>
      <CollectionManagementPanelBase
        className={className}
        toolId={toolId}
        collectionInfos={collectionInfos}
        createCollection={createCollection}
        deleteCollection={deleteCollection}
        renameCollection={renameCollection}
        exportCollection={exportCollection}
        importCollection={importCollection}
        selectedCollectionIds={selectedCollectionIds}
        onToggleSelected={onToggleSelected}
        showHeader={showHeader}
        headerTitle={headerTitle}
        itemLabelSingular="ingredient"
        itemLabelPlural="ingredients"
        addItemTitle="Add ingredient"
        onAddItem={(collectionId) => setShowAddIngredient(collectionId)}
      />

      {showAddIngredient && (
        <AddIngredientDialog collectionId={showAddIngredient} onClose={() => setShowAddIngredient(null)} />
      )}
    </>
  );
}

/**
 * Category options for select field
 */
const categoryOptions = allIngredientCategories.map((cat) => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1)
}));

/**
 * Ganache field type - stores string for form, empty string means undefined/unknown
 */
type GanacheFields = {
  cacaoFat: string;
  sugar: string;
  milkFat: string;
  water: string;
  solids: string;
  otherFats: string;
};

/**
 * Default ganache characteristics by category (as strings for form input)
 * Empty string means "unknown" - will be sent as 0 to the API
 */
function getDefaultGanacheCharacteristics(category: IngredientCategory): GanacheFields {
  switch (category) {
    case 'chocolate':
      return { cacaoFat: '35', sugar: '30', milkFat: '0', water: '0', solids: '35', otherFats: '0' };
    case 'sugar':
      return { cacaoFat: '0', sugar: '100', milkFat: '0', water: '0', solids: '0', otherFats: '0' };
    case 'dairy':
      return { cacaoFat: '0', sugar: '0', milkFat: '35', water: '60', solids: '5', otherFats: '0' };
    case 'fat':
      return { cacaoFat: '0', sugar: '0', milkFat: '0', water: '0', solids: '0', otherFats: '100' };
    case 'liquid':
      return { cacaoFat: '0', sugar: '0', milkFat: '0', water: '100', solids: '0', otherFats: '0' };
    case 'alcohol':
      return { cacaoFat: '0', sugar: '15', milkFat: '0', water: '60', solids: '0', otherFats: '0' };
    case 'flavor':
      return { cacaoFat: '0', sugar: '0', milkFat: '0', water: '0', solids: '100', otherFats: '0' };
    default:
      // Empty strings = unknown
      return { cacaoFat: '', sugar: '', milkFat: '', water: '', solids: '', otherFats: '' };
  }
}

/**
 * Convert ganache form fields to API format
 * Empty string becomes 0 (API requires all fields)
 */
function ganacheToApi(fields: GanacheFields): {
  cacaoFat: number;
  sugar: number;
  milkFat: number;
  water: number;
  solids: number;
  otherFats: number;
} {
  const toNum = (s: string): number => (s === '' ? 0 : parseFloat(s) || 0);
  return {
    cacaoFat: toNum(fields.cacaoFat),
    sugar: toNum(fields.sugar),
    milkFat: toNum(fields.milkFat),
    water: toNum(fields.water),
    solids: toNum(fields.solids),
    otherFats: toNum(fields.otherFats)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumberString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? value : '';
  }
  return '';
}

function ganacheFromApi(value: unknown): GanacheFields | null {
  if (!isRecord(value)) {
    return null;
  }

  const cacaoFat = toNumberString(value.cacaoFat);
  const sugar = toNumberString(value.sugar);
  const milkFat = toNumberString(value.milkFat);
  const water = toNumberString(value.water);
  const solids = toNumberString(value.solids);
  const otherFats = toNumberString(value.otherFats);

  return {
    cacaoFat,
    sugar,
    milkFat,
    water,
    solids,
    otherFats
  };
}

/**
 * Calculate total of ganache fields (for display)
 */
function ganacheTotal(fields: GanacheFields): number {
  const api = ganacheToApi(fields);
  return api.cacaoFat + api.sugar + api.milkFat + api.water + api.solids + api.otherFats;
}

/**
 * Dialog for adding a new ingredient to a collection
 */
export function AddIngredientDialog({
  collectionId,
  onClose
}: {
  collectionId: SourceId;
  onClose: () => void;
}): React.ReactElement {
  const { runtime } = useChocolate();
  const { markDirty, commitCollection } = useEditing();

  const [targetCollectionId, setTargetCollectionId] = useState<SourceId>(collectionId);
  const { editor, error: editorError } = useIngredientEditor(targetCollectionId);

  const mutableCollectionIds = useMemo((): ReadonlyArray<SourceId> => {
    if (!runtime) {
      return [];
    }

    const ids = Array.from(runtime.library.ingredients.collections.keys()) as SourceId[];
    return ids.filter((id) => {
      const result = runtime.library.ingredients.collections.get(id);
      return result.isSuccess() && !!result.value && result.value.isMutable;
    });
  }, [runtime]);

  useEffect(() => {
    if (mutableCollectionIds.length === 0) {
      return;
    }

    // Ensure we never point at an immutable collection (which would cause editor load failures)
    if (!mutableCollectionIds.includes(targetCollectionId)) {
      setTargetCollectionId(mutableCollectionIds[0]);
    }
  }, [mutableCollectionIds, targetCollectionId]);

  // Basic info
  const [ingredientId, setIngredientId] = useState('');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('other');
  const [description, setDescription] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [density, setDensity] = useState('');

  const [tags, setTags] = useState('');
  const [vegan, setVegan] = useState(false);
  const [certifications, setCertifications] = useState<ReadonlyArray<Certification>>([]);
  const [allergens, setAllergens] = useState<ReadonlyArray<Allergen>>([]);
  const [traceAllergens, setTraceAllergens] = useState<ReadonlyArray<Allergen>>([]);

  const [urls, setUrls] = useState<ReadonlyArray<{ category: string; url: string }>>([]);

  // Ganache characteristics (required for all ingredients)
  const [ganache, setGanache] = useState(() => getDefaultGanacheCharacteristics('other'));

  // Category-specific fields
  const [alcoholByVolume, setAlcoholByVolume] = useState('');
  const [flavorProfile, setFlavorProfile] = useState('');
  const [fatContent, setFatContent] = useState('');
  const [waterContent, setWaterContent] = useState('');
  const [meltingPoint, setMeltingPoint] = useState('');
  const [hydrationNumber, setHydrationNumber] = useState('');
  const [sweetnessPotency, setSweetnessPotency] = useState('');

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCommonAdvanced, setShowCommonAdvanced] = useState(false);

  const [agentJsonError, setAgentJsonError] = useState<string | null>(null);
  const [agentJsonInfo, setAgentJsonInfo] = useState<string | null>(null);

  const [showCopyInstructionsDialog, setShowCopyInstructionsDialog] = useState(false);
  const [copyInstructionsQuery, setCopyInstructionsQuery] = useState('');

  // Update ganache defaults when category changes
  const handleCategoryChange = (newCategory: IngredientCategory): void => {
    setCategory(newCategory);
    setGanache(getDefaultGanacheCharacteristics(newCategory));
  };

  const updateGanache = (field: keyof typeof ganache, value: string): void => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setGanache((prev) => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
  };

  const existingBaseIds = useMemo((): ReadonlyArray<string> => {
    if (!runtime) {
      return [];
    }

    const collectionResult = runtime.library.ingredients.collections.get(targetCollectionId);
    if (!collectionResult.isSuccess() || !collectionResult.value) {
      return [];
    }

    return Array.from(collectionResult.value.items.keys());
  }, [runtime, targetCollectionId]);

  const derivedBaseId = useMemo((): string => {
    if (name.trim().length === 0) {
      return '';
    }
    const deriveResult = Editing.Helpers.generateUniqueBaseIdFromName(name, existingBaseIds);
    return deriveResult.isSuccess() ? deriveResult.value : '';
  }, [existingBaseIds, name]);

  const applyIngredientJson = useCallback(
    (json: unknown): void => {
      setAgentJsonError(null);
      setAgentJsonInfo(null);

      const obj = isRecord(json) && isRecord(json.ingredient) ? json.ingredient : json;
      if (!isRecord(obj)) {
        setAgentJsonError('Expected a JSON object.');
        return;
      }

      const requestedCollectionId = obj.collectionId;
      if (
        typeof requestedCollectionId === 'string' &&
        mutableCollectionIds.includes(requestedCollectionId as SourceId)
      ) {
        setTargetCollectionId(requestedCollectionId as SourceId);
      }

      const nextCategoryRaw = obj.category;
      const nextCategory: IngredientCategory | null =
        typeof nextCategoryRaw === 'string' &&
        (allIngredientCategories as ReadonlyArray<string>).includes(nextCategoryRaw)
          ? (nextCategoryRaw as IngredientCategory)
          : null;

      if (nextCategory) {
        setCategory(nextCategory);
        setGanache(getDefaultGanacheCharacteristics(nextCategory));
      }

      if (typeof obj.name === 'string') {
        setName(obj.name);
      }
      if (typeof obj.description === 'string') {
        setDescription(obj.description);
      }
      if (typeof obj.manufacturer === 'string') {
        setManufacturer(obj.manufacturer);
      }
      if (typeof obj.density === 'number' && Number.isFinite(obj.density)) {
        setDensity(String(obj.density));
      }

      const baseIdRaw = obj.baseId;
      if (typeof baseIdRaw === 'string' && baseIdRaw.trim().length > 0) {
        setIngredientId(baseIdRaw.trim().toLowerCase());
        setIsIdManuallyEdited(true);
      } else {
        setIsIdManuallyEdited(false);
      }

      if (typeof obj.vegan === 'boolean') {
        setVegan(obj.vegan);
      }

      const tagsRaw = obj.tags;
      if (Array.isArray(tagsRaw) && tagsRaw.every((t) => typeof t === 'string')) {
        setTags(tagsRaw.join(', '));
      } else if (typeof tagsRaw === 'string') {
        setTags(tagsRaw);
      }

      const ganacheRaw = obj.ganacheCharacteristics;
      const ganacheFromJson = ganacheFromApi(ganacheRaw);
      if (ganacheFromJson) {
        setGanache(ganacheFromJson);
      }

      const certsRaw = obj.certifications;
      if (Array.isArray(certsRaw)) {
        const normalized = certsRaw.filter((c) => typeof c === 'string') as string[];
        const allowed = new Set(allCertifications as ReadonlyArray<string>);
        const filtered = normalized.filter((c) => allowed.has(c)) as Certification[];
        setCertifications(filtered);
      }

      const allergensRaw = obj.allergens;
      if (Array.isArray(allergensRaw)) {
        const normalized = allergensRaw.filter((a) => typeof a === 'string') as string[];
        const allowed = new Set(allAllergens as ReadonlyArray<string>);
        const filtered = normalized.filter((a) => allowed.has(a)) as Allergen[];
        setAllergens(filtered);
      }

      const traceAllergensRaw = obj.traceAllergens;
      if (Array.isArray(traceAllergensRaw)) {
        const normalized = traceAllergensRaw.filter((a) => typeof a === 'string') as string[];
        const allowed = new Set(allAllergens as ReadonlyArray<string>);
        const filtered = normalized.filter((a) => allowed.has(a)) as Allergen[];
        setTraceAllergens(filtered);
      }

      const urlsRaw = obj.urls;
      if (Array.isArray(urlsRaw)) {
        const normalized = urlsRaw
          .map((u) => {
            if (!isRecord(u)) {
              return null;
            }
            const category = typeof u.category === 'string' ? u.category : '';
            const url = typeof u.url === 'string' ? u.url : '';
            return { category, url };
          })
          .filter((u): u is { category: string; url: string } => u !== null);
        setUrls(normalized);
      }

      if (typeof obj.alcoholByVolume === 'number' && Number.isFinite(obj.alcoholByVolume)) {
        setAlcoholByVolume(String(obj.alcoholByVolume));
      }
      if (typeof obj.flavorProfile === 'string') {
        setFlavorProfile(obj.flavorProfile);
      }
      if (typeof obj.fatContent === 'number' && Number.isFinite(obj.fatContent)) {
        setFatContent(String(obj.fatContent));
      }
      if (typeof obj.waterContent === 'number' && Number.isFinite(obj.waterContent)) {
        setWaterContent(String(obj.waterContent));
      }
      if (typeof obj.meltingPoint === 'number' && Number.isFinite(obj.meltingPoint)) {
        setMeltingPoint(String(obj.meltingPoint));
      }
      if (typeof obj.hydrationNumber === 'number' && Number.isFinite(obj.hydrationNumber)) {
        setHydrationNumber(String(obj.hydrationNumber));
      }
      if (typeof obj.sweetnessPotency === 'number' && Number.isFinite(obj.sweetnessPotency)) {
        setSweetnessPotency(String(obj.sweetnessPotency));
      }

      setAgentJsonInfo('Applied ingredient JSON to the form.');
    },
    [mutableCollectionIds]
  );

  const applyIngredientJsonText = useCallback(
    (text: string): void => {
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        setAgentJsonError('No JSON provided.');
        setAgentJsonInfo(null);
        return;
      }
      try {
        const parsed: unknown = JSON.parse(trimmed);
        applyIngredientJson(parsed);
      } catch (e) {
        setAgentJsonError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
        setAgentJsonInfo(null);
      }
    },
    [applyIngredientJson]
  );

  const copyAgentInstructions = useCallback(async (searchTerm: string): Promise<void> => {
    setAgentJsonError(null);
    setAgentJsonInfo(null);

    const template = {
      name: 'Example Ingredient',
      category: 'other',
      description: 'Optional',
      manufacturer: 'Optional',
      density: 1.0,
      tags: ['optional', 'comma-or-array'],
      vegan: false,
      certifications: ['optional'],
      allergens: ['optional'],
      traceAllergens: ['optional'],
      urls: [{ category: 'datasheet', url: 'https://example.com' }],
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 0,
        milkFat: 0,
        water: 0,
        solids: 0,
        otherFats: 0
      },
      alcoholByVolume: 0,
      flavorProfile: 'Optional',
      fatContent: 0,
      waterContent: 0,
      meltingPoint: 0,
      hydrationNumber: 0,
      sweetnessPotency: 0
    };

    const instructions =
      `Ingredient to search for: ${searchTerm.length > 0 ? `"${searchTerm}"` : '(not specified)'}\n` +
      `Return a single JSON object for one ingredient.\n` +
      `Required: name, category, ganacheCharacteristics (all fields).\n` +
      `Optional: baseId (kebab-case), description, manufacturer, density, tags, vegan, certifications, allergens, traceAllergens, urls, and category-specific fields.\n` +
      `Allowed categories: ${allIngredientCategories.join(', ')}\n` +
      `Allowed certifications: ${allCertifications.join(', ')}\n` +
      `Allowed allergens: ${allAllergens.join(', ')}\n\n` +
      JSON.stringify(template, null, 2);

    try {
      await navigator.clipboard.writeText(instructions);
      setAgentJsonInfo('Copied JSON instructions to clipboard.');
    } catch (e) {
      setAgentJsonError(`Failed to copy to clipboard: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  useEffect(() => {
    if (isIdManuallyEdited) {
      return;
    }

    setIngredientId(derivedBaseId);
  }, [derivedBaseId, isIdManuallyEdited]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!editor) {
      setSaveError('Editor not available');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // Validate ingredient ID format
    const idResult = ChocolateConverters.baseIngredientId.convert(ingredientId);
    if (idResult.isFailure()) {
      setSaveError(`Invalid ingredient ID: ${idResult.message}`);
      setIsSaving(false);
      return;
    }

    const baseId = idResult.value;

    // Build the ingredient object with all required fields
    const newIngredient: Record<string, unknown> = {
      baseId, // Required: include in entity data
      name: name.trim(),
      category,
      ganacheCharacteristics: ganacheToApi(ganache), // Required for all ingredients - convert strings to numbers
      description: description.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      density: density && parseFloat(density) >= 0.1 ? parseFloat(density) : undefined
    };

    const normalizedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (normalizedTags.length > 0) {
      newIngredient.tags = normalizedTags;
    }

    if (vegan) {
      newIngredient.vegan = true;
    }

    if (certifications.length > 0) {
      newIngredient.certifications = certifications;
    }

    if (allergens.length > 0) {
      newIngredient.allergens = allergens;
    }

    if (traceAllergens.length > 0) {
      newIngredient.traceAllergens = traceAllergens;
    }

    const normalizedUrls = urls
      .map((u) => ({ category: u.category.trim(), url: u.url.trim() }))
      .filter((u) => u.category.length > 0 && u.url.length > 0);
    if (normalizedUrls.length > 0) {
      newIngredient.urls = normalizedUrls;
    }

    // Add category-specific fields
    switch (category) {
      case 'alcohol':
        if (alcoholByVolume) newIngredient.alcoholByVolume = parseFloat(alcoholByVolume);
        if (flavorProfile.trim()) newIngredient.flavorProfile = flavorProfile.trim();
        break;
      case 'dairy':
        if (fatContent) newIngredient.fatContent = parseFloat(fatContent);
        if (waterContent) newIngredient.waterContent = parseFloat(waterContent);
        break;
      case 'fat':
        if (meltingPoint) newIngredient.meltingPoint = parseFloat(meltingPoint);
        break;
      case 'sugar':
        if (hydrationNumber) newIngredient.hydrationNumber = parseFloat(hydrationNumber);
        if (sweetnessPotency) newIngredient.sweetnessPotency = parseFloat(sweetnessPotency);
        break;
    }

    // Use the validating accessor to create the ingredient
    const result = editor.validating.create(baseId, newIngredient);

    if (result.isFailure()) {
      setSaveError(result.message);
      setIsSaving(false);
      return;
    }

    markDirty(targetCollectionId);

    const commitResult = commitCollection(targetCollectionId);
    if (commitResult.isFailure()) {
      setSaveError(commitResult.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onClose();
  };

  const ganacheTotalValue = ganacheTotal(ganache);
  const isValid =
    ingredientId.trim().length > 0 &&
    /^[a-z0-9-]+$/.test(ingredientId) &&
    name.trim().length > 0 &&
    name.trim().length <= 200 &&
    ganacheTotalValue >= 0 &&
    ganacheTotalValue <= 100;

  if (!runtime) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">Runtime not loaded</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (mutableCollectionIds.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              No editable ingredient collections available. Create or import a mutable collection first.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (editorError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load editor: {editorError}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>

        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent-assisted entry</div>
            <button
              type="button"
              onClick={() => {
                setCopyInstructionsQuery(name.trim());
                setShowCopyInstructionsDialog(true);
              }}
              disabled={isSaving}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Copy instructions
            </button>
          </div>

          <textarea
            rows={4}
            placeholder="Paste ingredient JSON here (or drop a .json file / JSON text)"
            disabled={isSaving}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text.trim().length > 0) {
                e.preventDefault();
                applyIngredientJsonText(text);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const text = e.dataTransfer.getData('text/plain');
              if (text.trim().length > 0) {
                applyIngredientJsonText(text);
                return;
              }
              const file = e.dataTransfer.files?.[0];
              if (file) {
                void file.text().then((t) => applyIngredientJsonText(t));
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
          />

          {agentJsonError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{agentJsonError}</p>
            </div>
          )}

          {agentJsonInfo && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                {agentJsonInfo}
              </p>
            </div>
          )}
        </div>

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{saveError}</p>
          </div>
        )}

        {showCopyInstructionsDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Copy agent instructions
              </h4>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ingredient name / search term
              </label>
              <input
                type="text"
                value={copyInstructionsQuery}
                onChange={(e) => setCopyInstructionsQuery(e.target.value)}
                placeholder="e.g. Valrhona Guanaja 70%"
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCopyInstructionsDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCopyInstructionsDialog(false);
                    void copyAgentInstructions(copyInstructionsQuery.trim());
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Basic Info
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Collection <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetCollectionId}
                  onChange={(e) => {
                    setTargetCollectionId(e.target.value as SourceId);
                    setSaveError(null);
                  }}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                >
                  {mutableCollectionIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as IngredientCategory)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Ingredient"
                maxLength={200}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
              />
            </div>

            {/* Ingredient ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ingredient ID <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientId}
                  onChange={(e) => {
                    const next = e.target.value.toLowerCase().replace(/\s+/g, '-');
                    setIngredientId(next);
                    setIsIdManuallyEdited(next.trim().length > 0);
                  }}
                  placeholder="derived-from-name"
                  disabled={isSaving}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsIdManuallyEdited(false);
                    setIngredientId(derivedBaseId);
                    setSaveError(null);
                  }}
                  disabled={isSaving || derivedBaseId.length === 0}
                  title="Reset to derived value"
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  X
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowCommonAdvanced(!showCommonAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
              >
                <span>{showCommonAdvanced ? '▼' : '▶'}</span>
                Additional Properties
              </button>

              {showCommonAdvanced && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        placeholder="Optional"
                        maxLength={200}
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Density (g/mL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={density}
                          onChange={(e) => setDensity(e.target.value)}
                          placeholder="0.1 - 5.0"
                          min="0.1"
                          max="5.0"
                          step="0.01"
                          disabled={isSaving}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                        />
                        {density && (
                          <button
                            type="button"
                            onClick={() => setDensity('')}
                            disabled={isSaving}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Clear"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Tags
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="comma-separated"
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vegan}
                      onChange={(e) => setVegan(e.target.checked)}
                      disabled={isSaving}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Vegan</label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Certifications
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {allCertifications.map((c) => (
                          <label
                            key={c}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={certifications.includes(c)}
                              onChange={() =>
                                setCertifications((prev) =>
                                  prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                                )
                              }
                              disabled={isSaving}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                            />
                            <span className="truncate" title={c}>
                              {c}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Allergens
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {allAllergens.map((a) => (
                          <label
                            key={a}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={allergens.includes(a)}
                              onChange={() =>
                                setAllergens((prev) =>
                                  prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                                )
                              }
                              disabled={isSaving}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                            />
                            <span className="truncate" title={a}>
                              {a}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Trace Allergens
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      {allAllergens.map((a) => (
                        <label
                          key={a}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={traceAllergens.includes(a)}
                            onChange={() =>
                              setTraceAllergens((prev) =>
                                prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                              )
                            }
                            disabled={isSaving}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                          />
                          <span className="truncate" title={a}>
                            {a}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        URLs
                      </h5>
                      <button
                        type="button"
                        onClick={() => setUrls((prev) => [...prev, { category: '', url: '' }])}
                        disabled={isSaving}
                        className="text-xs font-medium text-chocolate-600 dark:text-chocolate-400 hover:underline disabled:opacity-50"
                      >
                        Add URL
                      </button>
                    </div>

                    {urls.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No URLs</p>
                    ) : (
                      <div className="space-y-2">
                        {urls.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={row.category}
                              onChange={(e) => {
                                const next = e.target.value;
                                setUrls((prev) =>
                                  prev.map((u, i) => (i === idx ? { ...u, category: next } : u))
                                );
                              }}
                              placeholder="category (e.g., manufacturer)"
                              disabled={isSaving}
                              className="col-span-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                            />
                            <input
                              type="url"
                              value={row.url}
                              onChange={(e) => {
                                const next = e.target.value;
                                setUrls((prev) => prev.map((u, i) => (i === idx ? { ...u, url: next } : u)));
                              }}
                              placeholder="https://..."
                              disabled={isSaving}
                              className="col-span-7 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setUrls((prev) => prev.filter((_, i) => i !== idx))}
                              disabled={isSaving}
                              className="col-span-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                              title="Remove"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category-Specific Fields */}
          {category === 'alcohol' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Alcohol Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ABV (%)
                  </label>
                  <input
                    type="number"
                    value={alcoholByVolume}
                    onChange={(e) => setAlcoholByVolume(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Flavor Profile
                  </label>
                  <input
                    type="text"
                    value={flavorProfile}
                    onChange={(e) => setFlavorProfile(e.target.value)}
                    placeholder="e.g., Cream liqueur"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'dairy' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Dairy Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fat Content (%)
                  </label>
                  <input
                    type="number"
                    value={fatContent}
                    onChange={(e) => setFatContent(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Water Content (%)
                  </label>
                  <input
                    type="number"
                    value={waterContent}
                    onChange={(e) => setWaterContent(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'fat' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Fat Properties
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Melting Point (C)
                </label>
                <input
                  type="number"
                  value={meltingPoint}
                  onChange={(e) => setMeltingPoint(e.target.value)}
                  placeholder="Temperature in Celsius"
                  min="-40"
                  max="100"
                  step="0.1"
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                />
              </div>
            </div>
          )}

          {category === 'sugar' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Sugar Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hydration Number
                  </label>
                  <input
                    type="number"
                    value={hydrationNumber}
                    onChange={(e) => setHydrationNumber(e.target.value)}
                    placeholder="Water molecules per sugar"
                    min="0"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sweetness Potency
                  </label>
                  <input
                    type="number"
                    value={sweetnessPotency}
                    onChange={(e) => setSweetnessPotency(e.target.value)}
                    placeholder="1.0 = sucrose"
                    min="0"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ganache Characteristics (Collapsible) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              Ganache Characteristics
              <span className="normal-case text-xs font-normal">(for recipe calculations)</span>
            </button>

            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  These percentages define how the ingredient affects ganache calculations. Total should
                  ideally equal 100%.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Cacao Fat (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.cacaoFat}
                      onChange={(e) => updateGanache('cacaoFat', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Sugar (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.sugar}
                      onChange={(e) => updateGanache('sugar', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Milk Fat (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.milkFat}
                      onChange={(e) => updateGanache('milkFat', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Water (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.water}
                      onChange={(e) => updateGanache('water', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Solids (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.solids}
                      onChange={(e) => updateGanache('solids', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Other Fats (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.otherFats}
                      onChange={(e) => updateGanache('otherFats', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>
                <div
                  className={`text-xs ${
                    ganacheTotalValue >= 90 && ganacheTotalValue <= 110
                      ? 'text-green-600 dark:text-green-400'
                      : ganacheTotalValue >= 80 && ganacheTotalValue <= 120
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  Total: {ganacheTotalValue.toFixed(1)}%
                  {ganacheTotalValue < 90 || ganacheTotalValue > 110
                    ? ' (should be close to 100%)'
                    : ganacheTotalValue >= 90 && ganacheTotalValue <= 110
                    ? ' ✓'
                    : ' (acceptable range: 80-120%)'}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Adding...' : 'Add Ingredient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
