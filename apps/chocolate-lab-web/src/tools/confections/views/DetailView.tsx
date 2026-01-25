/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftIcon, BeakerIcon, CubeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { useEditing } from '../../../contexts/EditingContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { LoadingSpinner } from '../../../components/common';
import { CollectionBadge, TagBadge, DetailSection, ConfectionTypeBadge } from '@fgv/ts-chocolate-ui';
import {
  Entities,
  type ConfectionId,
  type ConfectionType,
  type FillingId,
  type IngredientId,
  type MoldId,
  type Runtime,
  type SourceId
} from '@fgv/ts-chocolate';

/**
 * Extract source ID from composite confection ID
 * @internal
 */
function getSourceId(id: ConfectionId): string {
  return id.split('.')[0] ?? '';
}

/**
 * Autocomplete input for selecting ingredients (chocolates, etc.)
 */
function IngredientAutocompleteInput({
  value,
  onChange,
  disabled,
  placeholder,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}): React.ReactElement {
  const { runtime, dataVersion } = useChocolate();
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 360
  });

  const ingredients = React.useMemo(() => {
    void dataVersion;
    if (!runtime) return [];
    return Array.from(runtime.ingredients.entries()).map(([id, ingredient]) => {
      const idString = id as unknown as string;
      const baseId = idString.split('.')[1] ?? idString;
      return {
        id: idString,
        baseId,
        name: ingredient.name,
        description: ingredient.description
      };
    });
  }, [dataVersion, runtime]);

  const suggestions = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];

    const score = (item: { id: string; baseId: string; name: string }): number => {
      const id = item.id.toLowerCase();
      const base = item.baseId.toLowerCase();
      const name = item.name.toLowerCase();

      if (base === q) return 0;
      if (id === q) return 1;
      if (name === q) return 2;
      if (base.startsWith(q)) return 3;
      if (name.startsWith(q)) return 4;
      if (base.includes(q)) return 5;
      if (name.includes(q)) return 6;
      if (id.includes(q)) return 7;
      return 100;
    };

    return ingredients
      .map((item) => ({ item, s: score(item) }))
      .filter((x) => x.s < 100)
      .sort((a, b) => a.s - b.s || a.item.name.localeCompare(b.item.name))
      .slice(0, 10)
      .map((x) => x.item);
  }, [ingredients, value]);

  // Get the display name for the current value
  const displayInfo = React.useMemo(() => {
    if (!value || !runtime) return null;
    const ingredient = ingredients.find((i) => i.id === value);
    return ingredient ? { name: ingredient.name, id: ingredient.id } : null;
  }, [ingredients, runtime, value]);

  const isOpen = hasFocus && !disabled && suggestions.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const update = (): void => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const left = Math.max(8, rect.left);
      const top = rect.bottom + 6;
      const maxWidth = Math.max(240, window.innerWidth - left - 8);
      const width = Math.min(520, maxWidth);
      setDropdownPos({ left, top, width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {!hasFocus && displayInfo ? (
        <button
          type="button"
          onClick={() => {
            setHasFocus(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          disabled={disabled}
          className={`${className} text-left cursor-text`}
        >
          <div className="text-gray-900 dark:text-gray-100">{displayInfo.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{displayInfo.id}</div>
        </button>
      ) : (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setHasFocus(true)}
          onBlur={() => {
            window.setTimeout(() => setHasFocus(false), 120);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
      )}
      {isOpen &&
        createPortal(
          <div
            className="z-[1000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width
            }}
          >
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((sugg) => (
                <li key={sugg.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(sugg.id);
                      setHasFocus(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="text-sm text-gray-900 dark:text-gray-100">{sugg.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{sugg.id}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Autocomplete input for selecting molds
 */
function MoldAutocompleteInput({
  value,
  onChange,
  disabled,
  placeholder,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}): React.ReactElement {
  const { runtime, dataVersion } = useChocolate();
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 360
  });

  const molds = React.useMemo(() => {
    void dataVersion;
    if (!runtime) return [];
    return Array.from(runtime.library.molds.entries()).map(([id, mold]) => {
      const idString = id as unknown as string;
      const baseId = idString.split('.')[1] ?? idString;
      const displayName = `${mold.manufacturer} ${mold.productNumber}`;
      const cavityCount =
        mold.cavities.kind === 'grid' ? mold.cavities.columns * mold.cavities.rows : mold.cavities.count;
      return {
        id: idString,
        baseId,
        displayName,
        manufacturer: mold.manufacturer,
        productNumber: mold.productNumber,
        format: mold.format,
        cavityCount
      };
    });
  }, [dataVersion, runtime]);

  const suggestions = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];

    const score = (item: {
      id: string;
      baseId: string;
      displayName: string;
      manufacturer: string;
      productNumber: string;
    }): number => {
      const id = item.id.toLowerCase();
      const base = item.baseId.toLowerCase();
      const name = item.displayName.toLowerCase();
      const mfr = item.manufacturer.toLowerCase();
      const prod = item.productNumber.toLowerCase();

      if (base === q) return 0;
      if (id === q) return 1;
      if (name === q) return 2;
      if (prod === q) return 3;
      if (base.startsWith(q)) return 4;
      if (name.startsWith(q)) return 5;
      if (prod.startsWith(q)) return 6;
      if (mfr.startsWith(q)) return 7;
      if (base.includes(q)) return 8;
      if (name.includes(q)) return 9;
      if (prod.includes(q)) return 10;
      if (mfr.includes(q)) return 11;
      if (id.includes(q)) return 12;
      return 100;
    };

    return molds
      .map((item) => ({ item, s: score(item) }))
      .filter((x) => x.s < 100)
      .sort((a, b) => a.s - b.s || a.item.displayName.localeCompare(b.item.displayName))
      .slice(0, 10)
      .map((x) => x.item);
  }, [molds, value]);

  const displayInfo = React.useMemo(() => {
    if (!value || !runtime) return null;
    const mold = molds.find((m) => m.id === value);
    return mold
      ? { name: mold.displayName, id: mold.id, format: mold.format, cavityCount: mold.cavityCount }
      : null;
  }, [molds, runtime, value]);

  const isOpen = hasFocus && !disabled && suggestions.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const update = (): void => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const left = Math.max(8, rect.left);
      const top = rect.bottom + 6;
      const maxWidth = Math.max(240, window.innerWidth - left - 8);
      const width = Math.min(520, maxWidth);
      setDropdownPos({ left, top, width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {!hasFocus && displayInfo ? (
        <button
          type="button"
          onClick={() => {
            setHasFocus(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          disabled={disabled}
          className={`${className} text-left cursor-text`}
        >
          <div className="text-gray-900 dark:text-gray-100">{displayInfo.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {displayInfo.format} • {displayInfo.cavityCount} cavities
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{displayInfo.id}</div>
        </button>
      ) : (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setHasFocus(true)}
          onBlur={() => {
            window.setTimeout(() => setHasFocus(false), 120);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
      )}
      {isOpen &&
        createPortal(
          <div
            className="z-[1000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width
            }}
          >
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((sugg) => (
                <li key={sugg.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(sugg.id);
                      setHasFocus(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="text-sm text-gray-900 dark:text-gray-100">{sugg.displayName}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {sugg.format} • {sugg.cavityCount} cavities
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{sugg.id}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Autocomplete input for selecting fillings
 */
function FillingAutocompleteInput({
  value,
  onChange,
  disabled,
  placeholder,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}): React.ReactElement {
  const { runtime, dataVersion } = useChocolate();
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 360
  });

  const fillings = React.useMemo(() => {
    void dataVersion;
    if (!runtime) return [];
    return Array.from(runtime.fillings.entries()).map(([id, filling]) => {
      const idString = id as unknown as string;
      const baseId = idString.split('.')[1] ?? idString;
      return {
        id: idString,
        baseId,
        name: filling.name,
        category: filling.category,
        description: filling.description
      };
    });
  }, [dataVersion, runtime]);

  const suggestions = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];

    const score = (item: { id: string; baseId: string; name: string }): number => {
      const id = item.id.toLowerCase();
      const base = item.baseId.toLowerCase();
      const name = item.name.toLowerCase();

      if (base === q) return 0;
      if (id === q) return 1;
      if (name === q) return 2;
      if (base.startsWith(q)) return 3;
      if (name.startsWith(q)) return 4;
      if (base.includes(q)) return 5;
      if (name.includes(q)) return 6;
      if (id.includes(q)) return 7;
      return 100;
    };

    return fillings
      .map((item) => ({ item, s: score(item) }))
      .filter((x) => x.s < 100)
      .sort((a, b) => a.s - b.s || a.item.name.localeCompare(b.item.name))
      .slice(0, 10)
      .map((x) => x.item);
  }, [fillings, value]);

  const displayInfo = React.useMemo(() => {
    if (!value || !runtime) return null;
    const filling = fillings.find((f) => f.id === value);
    return filling ? { name: filling.name, id: filling.id, category: filling.category } : null;
  }, [fillings, runtime, value]);

  const isOpen = hasFocus && !disabled && suggestions.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const update = (): void => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const left = Math.max(8, rect.left);
      const top = rect.bottom + 6;
      const maxWidth = Math.max(240, window.innerWidth - left - 8);
      const width = Math.min(520, maxWidth);
      setDropdownPos({ left, top, width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {!hasFocus && displayInfo ? (
        <button
          type="button"
          onClick={() => {
            setHasFocus(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          disabled={disabled}
          className={`${className} text-left cursor-text`}
        >
          <div className="text-gray-900 dark:text-gray-100">{displayInfo.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{displayInfo.category}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{displayInfo.id}</div>
        </button>
      ) : (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setHasFocus(true)}
          onBlur={() => {
            window.setTimeout(() => setHasFocus(false), 120);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
      )}
      {isOpen &&
        createPortal(
          <div
            className="z-[1000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width
            }}
          >
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((sugg) => (
                <li key={sugg.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(sugg.id);
                      setHasFocus(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="text-sm text-gray-900 dark:text-gray-100">{sugg.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{sugg.category}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{sugg.id}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Props for the DetailView component
 */
export interface IDetailViewProps {
  /** Confection ID to display */
  confectionId: ConfectionId;
  /** Back button handler */
  onBack: () => void;
}

/**
 * Detail view for a single confection
 */
export function DetailView({ confectionId, onBack }: IDetailViewProps): React.ReactElement {
  const { runtime, loadingState } = useChocolate();
  const { commitConfectionCollection } = useEditing();
  const { settings } = useSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftTagsText, setDraftTagsText] = useState('');

  // Version-specific draft state
  const [draftYieldCount, setDraftYieldCount] = useState('');
  const [draftYieldUnit, setDraftYieldUnit] = useState('');
  const [draftNotes, setDraftNotes] = useState('');

  // Filling slots draft - array of {slotName, preferredFillingId}
  const [draftFillings, setDraftFillings] = useState<Array<{ slotName: string; preferredId: string }>>([]);

  // Molded bonbon specific
  const [draftPreferredMoldId, setDraftPreferredMoldId] = useState('');
  const [draftShellChocolateId, setDraftShellChocolateId] = useState('');

  // Bar truffle specific
  const [draftFrameLength, setDraftFrameLength] = useState('');
  const [draftFrameWidth, setDraftFrameWidth] = useState('');
  const [draftFrameDepth, setDraftFrameDepth] = useState('');
  const [draftBonbonLength, setDraftBonbonLength] = useState('');
  const [draftBonbonWidth, setDraftBonbonWidth] = useState('');
  const [draftEnrobingChocolateId, setDraftEnrobingChocolateId] = useState('');

  // Rolled truffle specific (enrobing chocolate shared with bar truffle)
  const [draftCoatingsText, setDraftCoatingsText] = useState('');

  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  const confectionResult = runtime.getRuntimeConfection(confectionId);
  if (!confectionResult.isSuccess || !confectionResult.value) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">Confection not found</p>
        <button
          type="button"
          onClick={onBack}
          className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const confection = confectionResult.value;
  const sourceId = getSourceId(confectionId);
  const goldenVersion = confection.goldenVersion;

  const canEdit = (() => {
    if (!runtime) return false;
    const unlocked = settings.collections[sourceId]?.unlocked !== false;
    if (!unlocked) return false;

    const collectionResult = runtime.library.confections.collections.get(sourceId as SourceId);
    if (!collectionResult.isSuccess() || !collectionResult.value) return false;
    return collectionResult.value.isMutable;
  })();

  const beginEdit = (): void => {
    if (!canEdit) return;
    setSaveError(null);

    // Base confection properties
    setDraftName(confection.name);
    setDraftDescription(confection.description ?? '');
    setDraftTagsText((confection.effectiveTags ?? []).join(', '));

    // Version common properties
    setDraftYieldCount(String(confection.yield.count));
    setDraftYieldUnit(confection.yield.unit ?? '');
    setDraftNotes(goldenVersion.notes ?? '');

    // Filling slots
    const fillingSlots = goldenVersion.fillings ?? [];
    setDraftFillings(
      fillingSlots.map((slot) => ({
        slotName: slot.name,
        preferredId: (slot.filling.preferredId as unknown as string) ?? ''
      }))
    );

    // Type-specific properties
    if (confection.isMoldedBonBon()) {
      const mbVersion = goldenVersion as Entities.Confections.IMoldedBonBonVersion;
      setDraftPreferredMoldId((mbVersion.molds?.preferredId as unknown as string) ?? '');
      setDraftShellChocolateId((mbVersion.shellChocolate?.preferredId as unknown as string) ?? '');
    }

    if (confection.isBarTruffle()) {
      const btVersion = goldenVersion as Entities.Confections.IBarTruffleVersion;
      setDraftFrameLength(String(btVersion.frameDimensions?.length ?? ''));
      setDraftFrameWidth(String(btVersion.frameDimensions?.width ?? ''));
      setDraftFrameDepth(String(btVersion.frameDimensions?.depth ?? ''));
      setDraftBonbonLength(String(btVersion.singleBonBonDimensions?.length ?? ''));
      setDraftBonbonWidth(String(btVersion.singleBonBonDimensions?.width ?? ''));
      setDraftEnrobingChocolateId((btVersion.enrobingChocolate?.preferredId as unknown as string) ?? '');
    }

    if (confection.isRolledTruffle()) {
      const rtVersion = goldenVersion as Entities.Confections.IRolledTruffleVersion;
      setDraftEnrobingChocolateId((rtVersion.enrobingChocolate?.preferredId as unknown as string) ?? '');
      // Coatings are ingredient IDs - join them into a comma-separated string
      const coatingIds = rtVersion.coatings?.ids ?? [];
      setDraftCoatingsText((coatingIds as unknown as string[]).join(', '));
    }

    setIsEditing(true);
  };

  const saveDraft = (): void => {
    if (!runtime) return;
    if (!canEdit) return;

    setIsSaving(true);
    setSaveError(null);

    const collectionResult = runtime.library.confections.collections.get(sourceId as SourceId).asResult;
    if (collectionResult.isFailure()) {
      setSaveError(collectionResult.message);
      setIsSaving(false);
      return;
    }
    const collectionEntry = collectionResult.value;
    if (!collectionEntry.isMutable) {
      setSaveError(`Collection "${sourceId}" is not mutable`);
      setIsSaving(false);
      return;
    }

    const normalizedTags = draftTagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Build the updated version based on confection type
    const rawVersion = goldenVersion.raw as unknown as Record<string, unknown>;
    const updatedVersion: Record<string, unknown> = {
      ...rawVersion,
      yield: {
        count: Number(draftYieldCount) || 1,
        ...(draftYieldUnit.trim().length > 0 ? { unit: draftYieldUnit.trim() } : {})
      },
      ...(draftNotes.trim().length > 0 ? { notes: draftNotes.trim() } : {})
    };

    // Update filling slots if there are any
    if (draftFillings.length > 0) {
      const existingFillings = goldenVersion.fillings ?? [];
      const updatedFillings = draftFillings
        .map((draft, idx) => {
          const existing = existingFillings[idx];
          if (!existing) return null;
          const existingRaw = existing.raw as unknown as Record<string, unknown>;
          const fillingSpec = existingRaw.filling as Record<string, unknown>;
          return {
            ...existingRaw,
            filling: {
              ...fillingSpec,
              preferredId: draft.preferredId
            }
          };
        })
        .filter((f): f is Record<string, unknown> => f !== null);

      if (updatedFillings.length > 0) {
        updatedVersion.fillings = updatedFillings;
      }
    }

    // Type-specific version updates
    const confectionType = confection.confectionType;

    if (confectionType === 'molded-bonbon') {
      // Update molds preferred ID
      if (draftPreferredMoldId.trim().length > 0) {
        const existingMolds = rawVersion.molds as Record<string, unknown> | undefined;
        if (existingMolds) {
          updatedVersion.molds = {
            ...existingMolds,
            preferredId: draftPreferredMoldId.trim()
          };
        }
      }
      // Update shell chocolate
      if (draftShellChocolateId.trim().length > 0) {
        const existingShell = rawVersion.shellChocolate as Record<string, unknown> | undefined;
        if (existingShell) {
          updatedVersion.shellChocolate = {
            ...existingShell,
            preferredId: draftShellChocolateId.trim()
          };
        } else {
          updatedVersion.shellChocolate = {
            ids: [draftShellChocolateId.trim()],
            preferredId: draftShellChocolateId.trim()
          };
        }
      }
    }

    if (confectionType === 'bar-truffle') {
      // Update frame dimensions
      const frameLength = Number(draftFrameLength);
      const frameWidth = Number(draftFrameWidth);
      const frameDepth = Number(draftFrameDepth);
      if (Number.isFinite(frameLength) && Number.isFinite(frameWidth) && Number.isFinite(frameDepth)) {
        updatedVersion.frameDimensions = {
          length: frameLength,
          width: frameWidth,
          depth: frameDepth
        };
      }
      // Update bonbon dimensions
      const bonbonLength = Number(draftBonbonLength);
      const bonbonWidth = Number(draftBonbonWidth);
      if (Number.isFinite(bonbonLength) && Number.isFinite(bonbonWidth)) {
        updatedVersion.singleBonBonDimensions = {
          length: bonbonLength,
          width: bonbonWidth
        };
      }
      // Update enrobing chocolate
      if (draftEnrobingChocolateId.trim().length > 0) {
        const existingEnrobing = rawVersion.enrobingChocolate as Record<string, unknown> | undefined;
        if (existingEnrobing) {
          updatedVersion.enrobingChocolate = {
            ...existingEnrobing,
            preferredId: draftEnrobingChocolateId.trim()
          };
        } else {
          updatedVersion.enrobingChocolate = {
            ids: [draftEnrobingChocolateId.trim()],
            preferredId: draftEnrobingChocolateId.trim()
          };
        }
      } else {
        updatedVersion.enrobingChocolate = undefined;
      }
    }

    if (confectionType === 'rolled-truffle') {
      // Update enrobing chocolate
      if (draftEnrobingChocolateId.trim().length > 0) {
        const existingEnrobing = rawVersion.enrobingChocolate as Record<string, unknown> | undefined;
        if (existingEnrobing) {
          updatedVersion.enrobingChocolate = {
            ...existingEnrobing,
            preferredId: draftEnrobingChocolateId.trim()
          };
        } else {
          updatedVersion.enrobingChocolate = {
            ids: [draftEnrobingChocolateId.trim()],
            preferredId: draftEnrobingChocolateId.trim()
          };
        }
      } else {
        updatedVersion.enrobingChocolate = undefined;
      }
      // Update coatings
      const coatingIds = draftCoatingsText
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (coatingIds.length > 0) {
        updatedVersion.coatings = {
          ids: coatingIds,
          preferredId: coatingIds[0]
        };
      } else {
        updatedVersion.coatings = undefined;
      }
    }

    // Build the updated confection with the modified version
    const rawConfection = confection.raw as unknown as Record<string, unknown>;
    const existingVersions = rawConfection.versions as unknown as Array<Record<string, unknown>>;
    const updatedVersions = existingVersions.map((v) => {
      if (v.versionSpec === goldenVersion.versionSpec) {
        return updatedVersion;
      }
      return v;
    });

    const updatedConfection: Record<string, unknown> = {
      ...rawConfection,
      name: draftName.trim(),
      description: draftDescription.trim().length > 0 ? draftDescription.trim() : undefined,
      tags: normalizedTags.length > 0 ? normalizedTags : undefined,
      versions: updatedVersions
    };

    const validateResult = Entities.Confections.Converters.confectionData.convert(updatedConfection);
    if (validateResult.isFailure()) {
      setSaveError(validateResult.message);
      setIsSaving(false);
      return;
    }

    const baseId = confection.baseId;
    const setResult = collectionEntry.items.validating.set(baseId, validateResult.value).asResult;
    if (setResult.isFailure()) {
      setSaveError(setResult.message);
      setIsSaving(false);
      return;
    }

    void (async () => {
      const commitResult = await commitConfectionCollection(sourceId as SourceId);
      if (commitResult.isFailure()) {
        setSaveError(commitResult.message);
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      setIsEditing(false);
    })();
  };

  return (
    <div className="w-full max-w-6xl">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to browse
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {confection.name}
                </h1>
                {confection.description && (
                  <p className="text-gray-600 dark:text-gray-400">{confection.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <ConfectionTypeBadge confectionType={confection.confectionType} size="lg" />
                {canEdit ? (
                  <button
                    type="button"
                    onClick={beginEdit}
                    disabled={isEditing}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-500">Read-only</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CollectionBadge name={sourceId} size="md" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Version: {confection.goldenVersionSpec}
              </span>
              {confection.versions.length > 1 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({confection.versions.length} versions)
                </span>
              )}
            </div>

            {/* Tags */}
            {confection.effectiveTags && confection.effectiveTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {confection.effectiveTags.map((tag: string) => (
                  <TagBadge key={tag} tag={tag} size="md" />
                ))}
              </div>
            )}
          </div>

          {/* Editing Form */}
          {isEditing && (
            <div className="mb-6">
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{saveError}</p>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <PencilIcon className="w-5 h-5" />
                    Edit Confection
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSaveError(null);
                      }}
                      disabled={isSaving}
                      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={isSaving}
                      className="px-3 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Basic Properties */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Basic Properties
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={draftTagsText}
                        onChange={(e) => setDraftTagsText(e.target.value)}
                        placeholder="comma-separated"
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        rows={2}
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Yield */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Yield</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Count
                      </label>
                      <input
                        type="number"
                        value={draftYieldCount}
                        onChange={(e) => setDraftYieldCount(e.target.value)}
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit (optional)
                      </label>
                      <input
                        type="text"
                        value={draftYieldUnit}
                        onChange={(e) => setDraftYieldUnit(e.target.value)}
                        placeholder="pieces"
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Fillings */}
                {draftFillings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Fillings</h3>
                    <div className="space-y-3">
                      {draftFillings.map((slot, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[100px] pt-2">
                            {slot.slotName}:
                          </span>
                          <FillingAutocompleteInput
                            value={slot.preferredId}
                            onChange={(value) => {
                              const newFillings = [...draftFillings];
                              newFillings[idx] = { ...slot, preferredId: value };
                              setDraftFillings(newFillings);
                            }}
                            placeholder="Search fillings..."
                            disabled={isSaving}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Molded Bonbon Specific */}
                {confection.confectionType === 'molded-bonbon' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Molded Bonbon Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Preferred Mold
                        </label>
                        <MoldAutocompleteInput
                          value={draftPreferredMoldId}
                          onChange={setDraftPreferredMoldId}
                          placeholder="Search molds..."
                          disabled={isSaving}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Shell Chocolate
                        </label>
                        <IngredientAutocompleteInput
                          value={draftShellChocolateId}
                          onChange={setDraftShellChocolateId}
                          placeholder="Search chocolates..."
                          disabled={isSaving}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bar Truffle Specific */}
                {confection.confectionType === 'bar-truffle' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Bar Truffle Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Frame Dimensions (mm)
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Length
                            </label>
                            <input
                              type="number"
                              value={draftFrameLength}
                              onChange={(e) => setDraftFrameLength(e.target.value)}
                              disabled={isSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Width
                            </label>
                            <input
                              type="number"
                              value={draftFrameWidth}
                              onChange={(e) => setDraftFrameWidth(e.target.value)}
                              disabled={isSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Depth
                            </label>
                            <input
                              type="number"
                              value={draftFrameDepth}
                              onChange={(e) => setDraftFrameDepth(e.target.value)}
                              disabled={isSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bonbon Dimensions (mm)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Length
                            </label>
                            <input
                              type="number"
                              value={draftBonbonLength}
                              onChange={(e) => setDraftBonbonLength(e.target.value)}
                              disabled={isSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Width
                            </label>
                            <input
                              type="number"
                              value={draftBonbonWidth}
                              onChange={(e) => setDraftBonbonWidth(e.target.value)}
                              disabled={isSaving}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Enrobing Chocolate (optional)
                        </label>
                        <IngredientAutocompleteInput
                          value={draftEnrobingChocolateId}
                          onChange={setDraftEnrobingChocolateId}
                          placeholder="Search chocolates..."
                          disabled={isSaving}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Rolled Truffle Specific */}
                {confection.confectionType === 'rolled-truffle' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Rolled Truffle Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Enrobing Chocolate (optional)
                        </label>
                        <IngredientAutocompleteInput
                          value={draftEnrobingChocolateId}
                          onChange={setDraftEnrobingChocolateId}
                          placeholder="Search chocolates..."
                          disabled={isSaving}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Coatings (comma-separated ingredient IDs)
                        </label>
                        <input
                          type="text"
                          value={draftCoatingsText}
                          onChange={(e) => setDraftCoatingsText(e.target.value)}
                          placeholder="source.cocoa-powder, source.chopped-nuts"
                          disabled={isSaving}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Enter multiple ingredient IDs separated by commas
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Version Notes
                  </label>
                  <textarea
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    rows={2}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Confection Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={<CubeIcon className="w-5 h-5" />}
              label="Yields"
              value={String(confection.yield.count)}
            />
            {goldenVersion.fillings && goldenVersion.fillings.length > 0 && (
              <StatCard
                icon={<BeakerIcon className="w-5 h-5" />}
                label="Fillings"
                value={String(goldenVersion.fillings.length)}
              />
            )}
          </div>

          {/* Type-specific details (mold, shell, etc.) */}
          {confection.isMoldedBonBon() && <MoldedBonBonDetails confection={confection} runtime={runtime} />}
          {confection.isBarTruffle() && <BarTruffleDetails confection={confection} />}
          {confection.isRolledTruffle() && <RolledTruffleDetails confection={confection} />}

          {/* Fillings */}
          {confection.fillings && confection.fillings.length > 0 && (
            <DetailSection title="Fillings" defaultCollapsed={false} className="mb-6">
              <FillingSlotsList slots={confection.fillings} />
            </DetailSection>
          )}

          {/* Procedures */}
          {confection.procedures && confection.procedures.options.length > 0 && (
            <DetailSection title="Procedures" defaultCollapsed={true} className="mb-6">
              <ul className="space-y-2">
                {confection.procedures.options.map((proc) => (
                  <li
                    key={proc.id}
                    className={`p-3 rounded-md ${
                      proc.id === confection.procedures?.preferredId
                        ? 'bg-chocolate-50 dark:bg-chocolate-900/20 border border-chocolate-200 dark:border-chocolate-800'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {proc.procedure.name}
                      </span>
                      {proc.id === confection.procedures?.preferredId && (
                        <span className="text-xs px-2 py-0.5 bg-chocolate-100 dark:bg-chocolate-900/40 text-chocolate-700 dark:text-chocolate-300 rounded">
                          Preferred
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {proc.id as unknown as string}
                    </span>
                    {proc.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{proc.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {/* Decorations */}
          {confection.decorations && confection.decorations.length > 0 && (
            <DetailSection title="Decorations" defaultCollapsed={true} className="mb-6">
              <ul className="space-y-2">
                {confection.decorations.map((decoration, idx) => (
                  <li key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{decoration.name}</span>
                    {decoration.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {decoration.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {/* URLs */}
          {confection.effectiveUrls && confection.effectiveUrls.length > 0 && (
            <DetailSection title="Links" defaultCollapsed={true} className="mb-6">
              <ul className="space-y-2">
                {confection.effectiveUrls.map((url, idx) => (
                  <li key={idx}>
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
                    >
                      {url.category}
                    </a>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {/* Version History */}
          {confection.versions.length > 1 && (
            <DetailSection title="Version History" defaultCollapsed={true} className="mb-6">
              <ul className="space-y-2">
                {confection.versions.map((version) => (
                  <li
                    key={version.versionSpec}
                    className={`flex items-center justify-between p-2 rounded ${
                      version.versionSpec === confection.goldenVersionSpec
                        ? 'bg-chocolate-50 dark:bg-chocolate-900/20 border border-chocolate-200 dark:border-chocolate-800'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <span className="text-gray-700 dark:text-gray-300">{version.versionSpec}</span>
                    {version.versionSpec === confection.goldenVersionSpec && (
                      <span className="text-xs px-2 py-0.5 bg-chocolate-100 dark:bg-chocolate-900/40 text-chocolate-700 dark:text-chocolate-300 rounded">
                        Golden
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}
        </div>

        {/* Right Column - Summary Card */}
        <div className="xl:sticky xl:top-4 self-start">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {confection.name}
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono break-all">
                  {confectionId as unknown as string}
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Source:</span> {sourceId}
              </div>
              <div>
                <span className="font-medium">Version:</span> {confection.goldenVersionSpec}
              </div>
              <div>
                <span className="font-medium">Type:</span> {confection.confectionType}
              </div>
              <div>
                <span className="font-medium">Yield:</span> {confection.yield.count}{' '}
                {confection.yield.unit ?? 'pieces'}
              </div>

              {/* Filling Slots Summary */}
              {confection.fillings && confection.fillings.length > 0 && (
                <div>
                  <span className="font-medium">Fillings:</span>
                  <ul className="mt-1 ml-4 list-disc text-gray-500 dark:text-gray-400">
                    {confection.fillings.map((slot) => {
                      const preferred = slot.filling.options.find(
                        (opt) => opt.id === slot.filling.preferredId
                      );
                      const name =
                        preferred?.type === 'recipe'
                          ? preferred.filling.name
                          : preferred?.type === 'ingredient'
                          ? preferred.ingredient.name
                          : slot.name;
                      return (
                        <li key={slot.slotId}>
                          {slot.name}: {name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  icon,
  label,
  value
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

/**
 * Filling slots list component
 */
function FillingSlotsList({
  slots
}: {
  slots: ReadonlyArray<Runtime.IResolvedFillingSlot>;
}): React.ReactElement {
  return (
    <ul className="space-y-3">
      {slots.map((slot) => {
        const preferred = slot.filling.options.find((opt) => opt.id === slot.filling.preferredId);
        const alternates = slot.filling.options.filter((opt) => opt.id !== slot.filling.preferredId);

        return (
          <li
            key={slot.slotId}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700"
          >
            <div className="font-medium text-gray-900 dark:text-gray-100">{slot.name}</div>

            {/* Preferred filling */}
            {preferred && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Preferred: </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {preferred.type === 'recipe' ? preferred.filling.name : preferred.ingredient.name}
                </span>
                {preferred.notes && (
                  <span className="text-gray-500 dark:text-gray-400"> - {preferred.notes}</span>
                )}
              </div>
            )}

            {/* Alternate fillings */}
            {alternates.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Alternates:</span>
                <ul className="mt-1 ml-4 text-sm space-y-1">
                  {alternates.map((alt) => (
                    <li key={alt.id as unknown as string} className="text-gray-600 dark:text-gray-400">
                      {alt.type === 'recipe' ? alt.filling.name : alt.ingredient.name}
                      {alt.notes && <span> - {alt.notes}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Molded bonbon specific details
 */
function MoldedBonBonDetails({
  confection,
  runtime
}: {
  confection: Runtime.RuntimeMoldedBonBon;
  runtime: Runtime.RuntimeContext | null;
}): React.ReactElement {
  const version = confection.goldenVersion;

  return (
    <>
      {/* Molds */}
      {confection.molds && (
        <DetailSection title="Molds" defaultCollapsed={false} className="mb-6">
          <ul className="space-y-2">
            {confection.molds.options.map((moldRef) => {
              const displayName =
                (moldRef.mold as unknown as { name?: string; displayName?: string })?.name ??
                (moldRef.mold as unknown as { displayName?: string })?.displayName ??
                (moldRef.id as unknown as string);
              return (
                <li
                  key={moldRef.id as unknown as string}
                  className={`p-3 rounded-md ${
                    moldRef.id === confection.molds?.preferredId
                      ? 'bg-chocolate-50 dark:bg-chocolate-900/20 border border-chocolate-200 dark:border-chocolate-800'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {displayName}
                    </span>
                    {moldRef.id === confection.molds?.preferredId && (
                      <span className="text-xs px-2 py-0.5 bg-chocolate-100 dark:bg-chocolate-900/40 text-chocolate-700 dark:text-chocolate-300 rounded">
                        Preferred
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {moldRef.id as unknown as string}
                  </span>
                </li>
              );
            })}
          </ul>
        </DetailSection>
      )}

      {/* Shell Chocolate */}
      {confection.shellChocolate && (
        <DetailSection title="Shell Chocolate" defaultCollapsed={true} className="mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {confection.shellChocolate.chocolate.name}
            </span>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
              {confection.shellChocolate.raw.preferredId as unknown as string}
            </div>
          </div>
        </DetailSection>
      )}

      {/* Additional Chocolates */}
      {version.additionalChocolates && version.additionalChocolates.length > 0 && (
        <DetailSection title="Additional Chocolates" defaultCollapsed={true} className="mb-6">
          <ul className="space-y-2">
            {version.additionalChocolates.map((choc, idx) => {
              const resolved = confection.additionalChocolates?.[idx];
              return (
                <li key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {resolved?.ingredient?.name ?? 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Purpose: {choc.purpose}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                    {choc.chocolate.preferredId as unknown as string}
                  </div>
                </li>
              );
            })}
          </ul>
        </DetailSection>
      )}
    </>
  );
}

/**
 * Bar truffle specific details
 */
function BarTruffleDetails({ confection }: { confection: Runtime.RuntimeBarTruffle }): React.ReactElement {
  const version = confection.goldenVersion;

  return (
    <>
      {/* Frame Dimensions */}
      {version.frameDimensions && (
        <DetailSection title="Frame Dimensions" defaultCollapsed={true} className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Length</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {version.frameDimensions.length}mm
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Width</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {version.frameDimensions.width}mm
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Depth</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {version.frameDimensions.depth}mm
              </div>
            </div>
          </div>
        </DetailSection>
      )}

      {/* Bonbon Dimensions */}
      {version.singleBonBonDimensions && (
        <DetailSection title="Bonbon Dimensions" defaultCollapsed={true} className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Length</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {version.singleBonBonDimensions.length}mm
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Width</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {version.singleBonBonDimensions.width}mm
              </div>
            </div>
          </div>
        </DetailSection>
      )}

      {/* Enrobing Chocolate */}
      {version.enrobingChocolate && (
        <DetailSection title="Enrobing Chocolate" defaultCollapsed={true} className="mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {confection.enrobingChocolate?.ingredient?.name ?? 'Unknown'}
            </span>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
              {version.enrobingChocolate.preferredId as unknown as string}
            </div>
          </div>
        </DetailSection>
      )}
    </>
  );
}

/**
 * Rolled truffle specific details
 */
function RolledTruffleDetails({
  confection
}: {
  confection: Runtime.RuntimeRolledTruffle;
}): React.ReactElement {
  const version = confection.goldenVersion;

  return (
    <>
      {/* Enrobing Chocolate */}
      {version.enrobingChocolate && (
        <DetailSection title="Enrobing Chocolate" defaultCollapsed={true} className="mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {confection.enrobingChocolate?.ingredient?.name ?? 'Unknown'}
            </span>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
              {version.enrobingChocolate.preferredId as unknown as string}
            </div>
          </div>
        </DetailSection>
      )}

      {/* Coatings */}
      {version.coatings && version.coatings.length > 0 && (
        <DetailSection title="Coatings" defaultCollapsed={true} className="mb-6">
          <ul className="space-y-2">
            {version.coatings.map((coating, idx) => {
              const resolved = confection.coatings?.[idx];
              return (
                <li key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {resolved?.ingredient?.name ?? 'Unknown'}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                    {coating.ingredient.preferredId as unknown as string}
                  </div>
                </li>
              );
            })}
          </ul>
        </DetailSection>
      )}
    </>
  );
}
