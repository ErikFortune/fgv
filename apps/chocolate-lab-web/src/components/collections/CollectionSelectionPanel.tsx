import * as React from 'react';
import { useMemo, useState } from 'react';
import { KeyIcon, LockClosedIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useRuntime, type SubLibraryType } from '../../contexts/RuntimeContext';
import { useCollections } from '../../contexts/CollectionsContext';
import { useSettings } from '../../contexts/SettingsContext';
import { UnlockCollectionModal } from '../common';

export interface ICollectionSelectionPanelProps {
  toolId: string;
  subLibrary: SubLibraryType;
  selectedCollectionIds: ReadonlyArray<string>;
  onToggleSelected: (collectionId: string) => void;
  className?: string;
}

interface ICollectionRowInfo {
  id: string;
  name: string;
  isProtected: boolean;
  isLocked: boolean;
  isMutable: boolean;
}

export function CollectionSelectionPanel({
  toolId,
  subLibrary,
  selectedCollectionIds,
  onToggleSelected,
  className = ''
}: ICollectionSelectionPanelProps): React.ReactElement {
  const { runtime } = useRuntime();
  const { collections } = useCollections();
  const { settings, setDefaultCollection } = useSettings();

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [collectionToUnlock, setCollectionToUnlock] = useState<string | null>(null);

  const rows = useMemo((): ICollectionRowInfo[] => {
    return collections
      .filter((c) => c.subLibraries.includes(subLibrary))
      .map((c) => {
        const isLocked = c.isProtected && !c.isUnlocked;

        let isMutable = false;
        if (!isLocked && runtime) {
          if (subLibrary === 'fillings') {
            const r = runtime.library.fillings.collections.get(c.id as unknown as never);
            isMutable =
              r.isSuccess() &&
              !!r.value &&
              (r.value as unknown as { isMutable?: boolean }).isMutable === true;
          } else if (subLibrary === 'ingredients') {
            const r = runtime.library.ingredients.collections.get(c.id as unknown as never);
            isMutable =
              r.isSuccess() &&
              !!r.value &&
              (r.value as unknown as { isMutable?: boolean }).isMutable === true;
          } else if (subLibrary === 'molds') {
            const r = runtime.library.molds.collections.get(c.id as unknown as never);
            isMutable =
              r.isSuccess() &&
              !!r.value &&
              (r.value as unknown as { isMutable?: boolean }).isMutable === true;
          } else if (subLibrary === 'confections') {
            const r = runtime.library.confections.collections.get(c.id as unknown as never);
            isMutable =
              r.isSuccess() &&
              !!r.value &&
              (r.value as unknown as { isMutable?: boolean }).isMutable === true;
          }
        }

        return {
          id: c.id,
          name: c.name,
          isProtected: c.isProtected,
          isLocked,
          isMutable
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [collections, runtime, subLibrary]);

  return (
    <div className={className}>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No collections loaded</p>
        ) : (
          rows.map((row) => {
            const isSelected = selectedCollectionIds.includes(row.id);
            const isDefault =
              row.isMutable && !row.isLocked && settings.defaultCollections?.[toolId] === row.id;

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  if (row.isLocked) {
                    setCollectionToUnlock(row.id);
                    setUnlockModalOpen(true);
                    return;
                  }
                  onToggleSelected(row.id);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md border text-left transition-colors ${
                  row.isLocked
                    ? 'opacity-60 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    : isSelected
                    ? 'border-chocolate-400 bg-chocolate-50 dark:border-chocolate-600 dark:bg-chocolate-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                title={row.isLocked ? `Click to unlock ${row.name}` : row.name}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {row.isProtected ? (
                    <KeyIcon className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  ) : null}
                  {row.isLocked ? (
                    <LockClosedIcon className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  ) : null}
                  <span className="truncate text-sm text-gray-700 dark:text-gray-200">{row.name}</span>
                </span>

                <span className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs ${
                      row.isLocked
                        ? 'text-gray-400 dark:text-gray-500'
                        : isSelected
                        ? 'text-chocolate-700 dark:text-chocolate-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {row.id}
                  </span>
                  {row.isMutable && !row.isLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultCollection(toolId, isDefault ? null : row.id);
                      }}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      title={isDefault ? 'Default collection' : 'Set as default collection'}
                    >
                      {isDefault ? (
                        <StarIconSolid className="w-4 h-4 text-chocolate-600 dark:text-chocolate-400" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      {collectionToUnlock && (
        <UnlockCollectionModal
          isOpen={unlockModalOpen}
          onClose={() => {
            setUnlockModalOpen(false);
            setCollectionToUnlock(null);
          }}
          collectionId={collectionToUnlock}
        />
      )}
    </div>
  );
}
