/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Converters as ChocolateConverters,
  Editing,
  Entities,
  allMoldFormats,
  type MoldFormat,
  type SourceId
} from '@fgv/ts-chocolate';
import { useChocolate } from '../../contexts/ChocolateContext';
import { useEditing, useMoldCollectionManager } from '../../contexts/EditingContext';
import { CollectionManagementPanelBase, type ICollectionInfo } from './CollectionManagementPanelBase';

export interface IMoldCollectionManagementPanelProps {
  className?: string;
  toolId?: string;
  selectedCollectionIds?: ReadonlyArray<string>;
  onToggleSelected?: (collectionId: string) => void;
  showHeader?: boolean;
  headerTitle?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function AddMoldDialog({
  collectionId,
  onClose
}: {
  collectionId: SourceId;
  onClose: () => void;
}): React.ReactElement {
  const { runtime } = useChocolate();
  const { commitMoldCollection } = useEditing();

  const [targetCollectionId, setTargetCollectionId] = useState<SourceId>(collectionId);

  const mutableCollectionIds = useMemo((): ReadonlyArray<SourceId> => {
    if (!runtime) {
      return [];
    }
    const ids = Array.from(runtime.library.molds.collections.keys()) as SourceId[];
    return ids.filter((id) => {
      const result = runtime.library.molds.collections.get(id);
      return result.isSuccess() && !!result.value && result.value.isMutable;
    });
  }, [runtime]);

  useEffect(() => {
    if (mutableCollectionIds.length === 0) {
      return;
    }

    if (!mutableCollectionIds.includes(targetCollectionId)) {
      setTargetCollectionId(mutableCollectionIds[0]);
    }
  }, [mutableCollectionIds, targetCollectionId]);

  const [baseId, setBaseId] = useState('');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [manufacturer, setManufacturer] = useState('');
  const [productNumber, setProductNumber] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<MoldFormat>('other');

  const [cavityColumns, setCavityColumns] = useState('1');
  const [cavityRows, setCavityRows] = useState('1');
  const [cavityWeight, setCavityWeight] = useState('');
  const [cavityWidth, setCavityWidth] = useState('');
  const [cavityLength, setCavityLength] = useState('');
  const [cavityDepth, setCavityDepth] = useState('');

  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showBasic, setShowBasic] = useState(true);
  const [showCavities, setShowCavities] = useState(true);
  const [showAdditional, setShowAdditional] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [agentJsonError, setAgentJsonError] = useState<string | null>(null);
  const [agentJsonInfo, setAgentJsonInfo] = useState<string | null>(null);
  const [showCopyInstructionsDialog, setShowCopyInstructionsDialog] = useState(false);
  const [copyInstructionsQuery, setCopyInstructionsQuery] = useState('');

  const existingBaseIds = useMemo((): ReadonlyArray<string> => {
    if (!runtime) {
      return [];
    }
    const collectionResult = runtime.library.molds.collections.get(targetCollectionId);
    if (!collectionResult.isSuccess() || !collectionResult.value) {
      return [];
    }
    return Array.from(collectionResult.value.items.keys());
  }, [runtime, targetCollectionId]);

  const derivedBaseId = useMemo((): string => {
    const name = `${manufacturer} ${productNumber}`.trim();
    if (name.length === 0) {
      return '';
    }
    const deriveResult = Editing.Helpers.generateUniqueBaseIdFromName(name, existingBaseIds);
    return deriveResult.isSuccess() ? deriveResult.value : '';
  }, [existingBaseIds, manufacturer, productNumber]);

  useEffect(() => {
    if (isIdManuallyEdited) {
      return;
    }
    setBaseId(derivedBaseId);
  }, [derivedBaseId, isIdManuallyEdited]);

  const applyMoldJson = useCallback(
    (json: unknown): void => {
      setAgentJsonError(null);
      setAgentJsonInfo(null);

      let hasBlockingError = false;

      const obj = isRecord(json) && isRecord(json.mold) ? json.mold : json;
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

      if (typeof obj.baseId === 'string' && obj.baseId.trim().length > 0) {
        setBaseId(obj.baseId.trim().toLowerCase());
        setIsIdManuallyEdited(true);
      } else {
        setIsIdManuallyEdited(false);
      }

      if (typeof obj.manufacturer === 'string') {
        setManufacturer(obj.manufacturer);
      }
      if (typeof obj.productNumber === 'string') {
        setProductNumber(obj.productNumber);
      }
      if (typeof obj.description === 'string') {
        setDescription(obj.description);
      }

      const formatRaw = obj.format;
      if (typeof formatRaw === 'string' && (allMoldFormats as ReadonlyArray<string>).includes(formatRaw)) {
        setFormat(formatRaw as MoldFormat);
      }

      const cavitiesRaw = obj.cavities;
      if (isRecord(cavitiesRaw) && typeof cavitiesRaw.kind === 'string') {
        if (cavitiesRaw.kind === 'count') {
          setAgentJsonError(
            'Agent JSON used cavities.kind="count". Please provide cavities.kind="grid" with columns and rows.'
          );
          hasBlockingError = true;
        } else if (cavitiesRaw.kind === 'grid') {
          if (typeof cavitiesRaw.columns === 'number' && Number.isFinite(cavitiesRaw.columns)) {
            setCavityColumns(String(cavitiesRaw.columns));
          }
          if (typeof cavitiesRaw.rows === 'number' && Number.isFinite(cavitiesRaw.rows)) {
            setCavityRows(String(cavitiesRaw.rows));
          }
        }

        const infoRaw = cavitiesRaw.info;
        if (isRecord(infoRaw)) {
          if (typeof infoRaw.weight === 'number' && Number.isFinite(infoRaw.weight)) {
            setCavityWeight(String(infoRaw.weight));
          }
          const dimsRaw = infoRaw.dimensions;
          if (isRecord(dimsRaw)) {
            if (typeof dimsRaw.width === 'number' && Number.isFinite(dimsRaw.width)) {
              setCavityWidth(String(dimsRaw.width));
            }
            if (typeof dimsRaw.length === 'number' && Number.isFinite(dimsRaw.length)) {
              setCavityLength(String(dimsRaw.length));
            }
            if (typeof dimsRaw.depth === 'number' && Number.isFinite(dimsRaw.depth)) {
              setCavityDepth(String(dimsRaw.depth));
            }
          }
        }
      }

      const tagsRaw = obj.tags;
      if (Array.isArray(tagsRaw) && tagsRaw.every((t) => typeof t === 'string')) {
        setTags(tagsRaw.join(', '));
      } else if (typeof tagsRaw === 'string') {
        setTags(tagsRaw);
      }

      if (typeof obj.notes === 'string') {
        setNotes(obj.notes);
      }

      if (!hasBlockingError) {
        setAgentJsonInfo('Applied mold JSON to the form.');
      }
    },
    [mutableCollectionIds]
  );

  const applyMoldJsonText = useCallback(
    (text: string): void => {
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        setAgentJsonError('No JSON provided.');
        setAgentJsonInfo(null);
        return;
      }
      try {
        const parsed: unknown = JSON.parse(trimmed);
        applyMoldJson(parsed);
      } catch (e) {
        setAgentJsonError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
        setAgentJsonInfo(null);
      }
    },
    [applyMoldJson]
  );

  const copyAgentInstructions = useCallback(async (searchTerm: string): Promise<void> => {
    setAgentJsonError(null);
    setAgentJsonInfo(null);

    const template = {
      manufacturer: 'Chocolate World',
      productNumber: 'CW 0000',
      description: 'Optional',
      format: 'other',
      cavities: {
        kind: 'grid',
        columns: 4,
        rows: 6,
        info: {
          weight: 10,
          dimensions: { width: 25, length: 25, depth: 15 }
        }
      },
      tags: ['optional'],
      notes: 'Optional'
    };

    const instructions =
      `Mold to search for: ${searchTerm.length > 0 ? `"${searchTerm}"` : '(not specified)'}\n` +
      `Return a single JSON object for one mold.\n` +
      `Required: manufacturer, productNumber, format, cavities.\n` +
      `Format guidance (choose based on the mold frame size):\n` +
      `- series-1000: 275x135mm\n` +
      `- series-2000: 275x175mm\n` +
      `- other: unknown / non-standard / not a CW series\n` +
      `Cavities: Provide kind="grid" with columns and rows (cavity layout).\n` +
      `Optional: baseId (kebab-case), description, tags, notes, related, urls.\n` +
      `Allowed formats: ${allMoldFormats.join(', ')}\n\n` +
      JSON.stringify(template, null, 2);

    try {
      await navigator.clipboard.writeText(instructions);
      setAgentJsonInfo('Copied JSON instructions to clipboard.');
    } catch (e) {
      setAgentJsonError(`Failed to copy to clipboard: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();

      if (!runtime) {
        setSaveError('Runtime not loaded');
        return;
      }

      setIsSaving(true);
      setSaveError(null);

      const idResult = ChocolateConverters.baseMoldId.convert(baseId);
      if (idResult.isFailure()) {
        setSaveError(`Invalid mold ID: ${idResult.message}`);
        setIsSaving(false);
        return;
      }
      const validatedBaseId = idResult.value;

      const collectionResult = runtime.library.molds.collections.get(targetCollectionId).asResult;
      if (collectionResult.isFailure()) {
        setSaveError(`Collection "${targetCollectionId}" not found`);
        setIsSaving(false);
        return;
      }
      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        setSaveError(`Collection "${targetCollectionId}" is not mutable`);
        setIsSaving(false);
        return;
      }
      if (collectionEntry.items.has(validatedBaseId)) {
        setSaveError(`Mold ID "${validatedBaseId}" already exists in "${targetCollectionId}"`);
        setIsSaving(false);
        return;
      }

      const cavities: Record<string, unknown> = {
        kind: 'grid',
        columns: Number(cavityColumns),
        rows: Number(cavityRows)
      };

      const info: Record<string, unknown> = {};
      if (cavityWeight.trim().length > 0) {
        info.weight = Number(cavityWeight);
      }
      const hasDimensions =
        cavityWidth.trim().length > 0 || cavityLength.trim().length > 0 || cavityDepth.trim().length > 0;
      if (hasDimensions) {
        info.dimensions = {
          width: Number(cavityWidth),
          length: Number(cavityLength),
          depth: Number(cavityDepth)
        };
      }
      if (Object.keys(info).length > 0) {
        cavities.info = info;
      }

      const newMold: Record<string, unknown> = {
        baseId: validatedBaseId,
        manufacturer: manufacturer.trim(),
        productNumber: productNumber.trim(),
        description: description.trim() || undefined,
        format,
        cavities
      };

      const normalizedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (normalizedTags.length > 0) {
        newMold.tags = normalizedTags;
      }
      if (notes.trim().length > 0) {
        newMold.notes = notes.trim();
      }

      const validateResult = Entities.Molds.Converters.moldData.convert(newMold);
      if (validateResult.isFailure()) {
        setSaveError(validateResult.message);
        setIsSaving(false);
        return;
      }

      const addResult = collectionEntry.items.validating.add(baseId, validateResult.value).asResult;
      if (addResult.isFailure()) {
        setSaveError(addResult.message);
        setIsSaving(false);
        return;
      }

      const commitResult = commitMoldCollection(targetCollectionId);
      if (commitResult.isFailure()) {
        setSaveError(commitResult.message);
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      onClose();
    },
    [
      baseId,
      cavityColumns,
      cavityDepth,
      cavityLength,
      cavityRows,
      cavityWeight,
      cavityWidth,
      commitMoldCollection,
      description,
      format,
      manufacturer,
      notes,
      onClose,
      productNumber,
      runtime,
      tags,
      targetCollectionId
    ]
  );

  const isValid =
    baseId.trim().length > 0 &&
    /^[a-z0-9-]+$/.test(baseId) &&
    manufacturer.trim().length > 0 &&
    productNumber.trim().length > 0 &&
    Number.isFinite(Number(cavityColumns)) &&
    Number(cavityColumns) > 0 &&
    Number.isFinite(Number(cavityRows)) &&
    Number(cavityRows) > 0;

  if (!runtime) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Mold</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Mold</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              No editable mold collections available. Create or import a mutable collection first.
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Mold</h3>

        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent-assisted entry</div>
            <button
              type="button"
              onClick={() => {
                setCopyInstructionsQuery(`${manufacturer} ${productNumber}`.trim());
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
            placeholder="Paste mold JSON here (or drop a .json file / JSON text)"
            disabled={isSaving}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text.trim().length > 0) {
                e.preventDefault();
                applyMoldJsonText(text);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const text = e.dataTransfer.getData('text/plain');
              if (text.trim().length > 0) {
                applyMoldJsonText(text);
                return;
              }
              const file = e.dataTransfer.files?.[0];
              if (file) {
                void file.text().then((t) => applyMoldJsonText(t));
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
                Mold name / search term
              </label>
              <input
                type="text"
                value={copyInstructionsQuery}
                onChange={(e) => setCopyInstructionsQuery(e.target.value)}
                placeholder="e.g. Chocolate World CW 2227"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <button
              type="button"
              onClick={() => setShowBasic(!showBasic)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span>{showBasic ? '▼' : '▶'}</span>
              Basic Info
            </button>

            {showBasic && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Collection
                    </label>
                    <select
                      value={targetCollectionId as string}
                      onChange={(e) => setTargetCollectionId(e.target.value as SourceId)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      {mutableCollectionIds.map((id) => (
                        <option key={id as string} value={id as string}>
                          {id as string}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Product #
                    </label>
                    <input
                      type="text"
                      value={productNumber}
                      onChange={(e) => setProductNumber(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as MoldFormat)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      {allMoldFormats.map((f) => (
                        <option key={f} value={f}>
                          {f === 'series-1000'
                            ? 'series-1000 (275x135mm)'
                            : f === 'series-2000'
                            ? 'series-2000 (275x175mm)'
                            : f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowCavities(!showCavities)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span>{showCavities ? '▼' : '▶'}</span>
              Cavities
            </button>

            {showCavities && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Columns
                    </label>
                    <input
                      type="number"
                      value={cavityColumns}
                      onChange={(e) => setCavityColumns(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rows
                    </label>
                    <input
                      type="number"
                      value={cavityRows}
                      onChange={(e) => setCavityRows(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weight (g/cavity)
                  </label>
                  <input
                    type="number"
                    value={cavityWeight}
                    onChange={(e) => setCavityWeight(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdditional(!showAdditional)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span>{showAdditional ? '▼' : '▶'}</span>
              Additional Properties
            </button>

            {showAdditional && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cavity Dimensions (mm) - width / length / depth
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={cavityWidth}
                      onChange={(e) => setCavityWidth(e.target.value)}
                      disabled={isSaving}
                      placeholder="width"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      value={cavityLength}
                      onChange={(e) => setCavityLength(e.target.value)}
                      disabled={isSaving}
                      placeholder="length"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      value={cavityDepth}
                      onChange={(e) => setCavityDepth(e.target.value)}
                      disabled={isSaving}
                      placeholder="depth"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={isSaving}
                    placeholder="comma-separated"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              Advanced
            </button>

            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mold ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={baseId}
                      onChange={(e) => {
                        const next = e.target.value.toLowerCase().replace(/\s+/g, '-');
                        setBaseId(next);
                        setIsIdManuallyEdited(next.trim().length > 0);
                      }}
                      disabled={isSaving}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="derived-from-manufacturer-and-product"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsIdManuallyEdited(false);
                        setBaseId(derivedBaseId);
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
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
            >
              Add Mold
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MoldCollectionManagementPanel({
  className = '',
  toolId = 'molds',
  selectedCollectionIds,
  onToggleSelected,
  showHeader = true,
  headerTitle = toolId === 'molds' ? 'Mold Collections' : 'Collections'
}: IMoldCollectionManagementPanelProps): React.ReactElement {
  const { runtime, collections } = useChocolate();
  const { editingVersion } = useEditing();
  const { createCollection, deleteCollection, renameCollection, exportCollection, importCollection } =
    useMoldCollectionManager();

  const [showAddMold, setShowAddMold] = useState<SourceId | null>(null);

  const collectionInfos = useMemo((): ICollectionInfo[] => {
    if (!runtime) return [];

    const infos: ICollectionInfo[] = [];

    const ctxCollections = collections.filter((c) => c.subLibraries.includes('molds'));
    const allIds = new Set<string>();
    for (const c of ctxCollections) {
      allIds.add(c.id);
    }
    for (const id of runtime.library.molds.collections.keys()) {
      allIds.add(id as string);
    }

    for (const id of allIds) {
      const collectionId = id as SourceId;
      const collectionCtx = ctxCollections.find((c) => c.id === id);
      const isProtected = collectionCtx?.isProtected ?? false;
      const isUnlocked = collectionCtx?.isUnlocked ?? true;
      const isLocked = isProtected && !isUnlocked;

      const collectionResult = runtime.library.molds.collections.get(collectionId);
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
        isDirty: false,
        itemCount: runtimeCollection?.items.size ?? 0
      });
    }

    return infos.sort((a, b) => {
      if (a.isMutable !== b.isMutable) return a.isMutable ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [runtime, collections, editingVersion]);

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
        itemLabelSingular="mold"
        itemLabelPlural="molds"
        addItemTitle="Add mold"
        onAddItem={(collectionId) => setShowAddMold(collectionId)}
      />

      {showAddMold && <AddMoldDialog collectionId={showAddMold} onClose={() => setShowAddMold(null)} />}
    </>
  );
}
