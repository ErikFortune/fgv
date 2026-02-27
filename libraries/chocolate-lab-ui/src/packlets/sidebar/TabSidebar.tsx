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
 * Chocolate-specific sidebar content per tab.
 *
 * Wires the generic FilterBar/FilterRow from ts-app-shell with
 * the navigation store's filter state and the per-tab filter definitions.
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  CollectionSection,
  ConfirmDialog,
  FilterBar,
  FilterRow,
  type IFilterOption
} from '@fgv/ts-app-shell';

import type { LibraryData, LibraryRuntime } from '@fgv/ts-chocolate';
import { CryptoUtils } from '@fgv/ts-extras';

import {
  type AppTab,
  type IFilterState,
  countActiveSelections,
  useNavigationStore,
  selectActiveTab,
  selectCurrentFilter
} from '../navigation';

import { useReactiveWorkspace, useWorkspace, useWorkspaceState } from '../workspace';

import { useCollectionInfo } from './collectionInfo';
import { CreateCollectionDialog, type ICreateCollectionData } from './CreateCollectionDialog';
import { ImportCollisionDialog, type ImportCollisionResolution } from './ImportCollisionDialog';
import { SetSecretPasswordDialog } from './SetSecretPasswordDialog';
import { UnlockCollectionDialog, type UnlockCollectionMode } from './UnlockCollectionDialog';
import { type IPendingSecretSetup } from './useCollectionActions';

import { TAB_FILTER_DEFINITIONS, type IFilterDefinition } from './filterConfigs';

// ============================================================================
// Filter Option Provider
// ============================================================================

/**
 * Provides filter options for a given tab and filter key.
 *
 * In Phase 2, this returns static placeholder options.
 * In Phase 3+, this will be wired to the workspace data to provide
 * dynamic options with counts.
 *
 * @public
 */
export interface IFilterOptionProvider {
  readonly getOptions: (tab: AppTab, filterKey: string) => ReadonlyArray<IFilterOption<string>>;
}

/**
 * Default filter option provider that returns placeholder options.
 * @internal
 */
const PLACEHOLDER_PROVIDER: IFilterOptionProvider = {
  getOptions: (): ReadonlyArray<IFilterOption<string>> => {
    return [];
  }
};

// ============================================================================
// Sub-Library Accessor
// ============================================================================

/**
 * Returns the entity-layer sub-library for a given tab, or undefined for
 * tabs that don't have sub-libraries (e.g., production tabs).
 * @internal
 */
function getSubLibraryForTab(
  entities: LibraryRuntime.ChocolateEntityLibrary,
  tab: AppTab
): LibraryData.SubLibraryBase<string, string, unknown> | undefined {
  switch (tab) {
    case 'ingredients':
      return entities.ingredients;
    case 'fillings':
      return entities.fillings;
    case 'confections':
      return entities.confections;
    case 'decorations':
      return entities.decorations;
    case 'molds':
      return entities.molds;
    case 'procedures':
      return entities.procedures;
    case 'tasks':
      return entities.tasks;
    default:
      return undefined;
  }
}

// ============================================================================
// TabSidebar Props
// ============================================================================

/**
 * Props for the TabSidebar component.
 * @public
 */
export interface ITabSidebarProps {
  /** Optional filter option provider (defaults to placeholder) */
  readonly optionProvider?: IFilterOptionProvider;
  /** Callback when "Add Directory" is clicked in the collection section */
  readonly onAddDirectory?: () => void;
  /** Callback when the user confirms creation of a new collection */
  readonly onCreateCollection?: (data: ICreateCollectionData) => void;
  /** Callback when delete is clicked for a mutable collection */
  readonly onDeleteCollection?: (collectionId: string) => void;
  /** Callback when the star/default is clicked for a collection */
  readonly onSetDefaultCollection?: (collectionId: string) => void;
  /** Callback when export is clicked for a mutable collection */
  readonly onExportCollection?: (collectionId: string) => void;
  /** Callback when "Export All" zip is clicked in the collection section header */
  readonly onExportAllAsZip?: () => void;
  /** Callback when "Import Collection" is clicked in the collection section header */
  readonly onImportCollection?: () => void;
  /** Callback when "Open from File" is clicked (File System Access API, write-back) */
  readonly onOpenCollectionFromFile?: () => void;
  /** Non-null when an import collision is awaiting resolution */
  readonly pendingImport?: { collectionId: string; itemCount: number } | null;
  /** Resolve a pending import collision */
  readonly onResolveImportCollision?: (resolution: ImportCollisionResolution) => void;
  /** Secret names available from the keystore for typeahead in the create dialog */
  readonly existingSecretNames?: ReadonlyArray<string>;
  /** Non-null when a new secret password is needed during collection creation */
  readonly pendingSecretSetup?: IPendingSecretSetup | null;
  /** Called by the password dialog with the entered password */
  readonly onResolveSecretSetup?: (password: string) => Promise<string | undefined>;
  /** Called when the user skips encryption during collection creation */
  readonly onSkipSecretSetup?: () => void;
}

// ============================================================================
// TabSidebar Component
// ============================================================================

/**
 * Chocolate-specific sidebar content that renders the appropriate
 * filter bar for the currently active tab.
 *
 * Reads the active tab and filter state from the navigation store,
 * renders FilterBar + FilterRow components from ts-app-shell,
 * and writes filter changes back to the store.
 *
 * @public
 */
export function TabSidebar(props: ITabSidebarProps): React.ReactElement {
  const {
    optionProvider = PLACEHOLDER_PROVIDER,
    onAddDirectory,
    onCreateCollection,
    onDeleteCollection,
    onSetDefaultCollection,
    onExportCollection,
    onExportAllAsZip,
    onImportCollection,
    onOpenCollectionFromFile,
    pendingImport,
    onResolveImportCollision,
    existingSecretNames,
    pendingSecretSetup,
    onResolveSecretSetup,
    onSkipSecretSetup
  } = props;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [unlockCollectionId, setUnlockCollectionId] = useState<string | null>(null);

  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const { unlock: workspaceUnlock } = useWorkspaceState();

  const activeTab = useNavigationStore(selectActiveTab);
  const filterState = useNavigationStore(selectCurrentFilter);
  const setFilter = useNavigationStore((s) => s.setFilter);
  const clearFilter = useNavigationStore((s) => s.clearFilter);
  const toggleCollectionVisibility = useNavigationStore((s) => s.toggleCollectionVisibility);

  const collectionInfos = useCollectionInfo();

  const filterDefs = TAB_FILTER_DEFINITIONS[activeTab];

  const handleSearchChange = useCallback(
    (search: string): void => {
      setFilter(activeTab, { search });
    },
    [activeTab, setFilter]
  );

  const handleSelectionChange = useCallback(
    (filterKey: string, selected: ReadonlyArray<string>): void => {
      setFilter(activeTab, {
        selections: { ...filterState.selections, [filterKey]: selected }
      });
    },
    [activeTab, filterState.selections, setFilter]
  );

  const handleClearAll = useCallback((): void => {
    clearFilter(activeTab);
  }, [activeTab, clearFilter]);

  const handleToggleCollectionVisibility = useCallback(
    (collectionId: string): void => {
      toggleCollectionVisibility(activeTab, collectionId);
    },
    [activeTab, toggleCollectionVisibility]
  );

  const handleRequestDeleteCollection = useCallback((collectionId: string): void => {
    setCollectionToDelete(collectionId);
  }, []);

  const handleConfirmDeleteCollection = useCallback((): void => {
    if (collectionToDelete) {
      onDeleteCollection?.(collectionToDelete);
    }
    setCollectionToDelete(null);
  }, [collectionToDelete, onDeleteCollection]);

  const handleCancelDeleteCollection = useCallback((): void => {
    setCollectionToDelete(null);
  }, []);

  const handleOpenCreateDialog = useCallback((): void => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback((): void => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleCreateCollection = useCallback(
    (data: ICreateCollectionData): void => {
      onCreateCollection?.(data);
    },
    [onCreateCollection]
  );

  // --------------------------------------------------------------------------
  // Unlock Collection
  // --------------------------------------------------------------------------

  const handleRequestUnlockCollection = useCallback(
    (collectionId: string): void => {
      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) return;

      const protectedInfo = subLibrary.protectedCollections.find((pc) => pc.collectionId === collectionId);
      if (!protectedInfo) return;

      // If keystore is unlocked and has the secret, try loading directly
      if (workspace.state === 'unlocked' && workspace.keyStore) {
        const secretResult = workspace.keyStore.getSecret(protectedInfo.secretName);
        if (secretResult.isSuccess()) {
          const encConfig = workspace.keyStore.getEncryptionConfig();
          if (encConfig.isSuccess()) {
            const encryption: LibraryData.IEncryptionConfig = {
              ...encConfig.value,
              onMissingKey: 'warn'
            };
            const lib = subLibrary;
            async function loadDirect(): Promise<void> {
              await lib.loadProtectedCollectionAsync(encryption, [collectionId]);
              workspace.data.clearCache();
              reactiveWorkspace.notifyChange();
            }
            loadDirect().catch(() => undefined);
            return;
          }
        }
      }

      // Otherwise show dialog
      setUnlockCollectionId(collectionId);
    },
    [workspace, activeTab, reactiveWorkspace]
  );

  // Compute dialog props from the unlock state
  const unlockDialogInfo = useMemo(() => {
    if (!unlockCollectionId) return undefined;

    const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
    if (!subLibrary) return undefined;

    const protectedInfo = subLibrary.protectedCollections.find(
      (pc) => pc.collectionId === unlockCollectionId
    );
    if (!protectedInfo) return undefined;

    const modes: UnlockCollectionMode[] = [];
    if (workspace.state === 'locked') {
      modes.push('keystore');
    }
    if (protectedInfo.keyDerivation) {
      modes.push('collection');
    }
    // If keystore is unlocked but secret is missing — only collection mode
    if (workspace.state === 'unlocked' && modes.length === 0 && protectedInfo.keyDerivation) {
      modes.push('collection');
    }

    if (modes.length === 0) return undefined;

    return {
      collectionName: protectedInfo.description ?? protectedInfo.collectionId,
      secretName: protectedInfo.secretName,
      availableModes: modes as ReadonlyArray<UnlockCollectionMode>,
      protectedInfo
    };
  }, [unlockCollectionId, workspace, activeTab]);

  const handleUnlockCollectionSubmit = useCallback(
    async (
      password: string,
      mode: UnlockCollectionMode,
      saveToKeystore: boolean
    ): Promise<string | undefined> => {
      if (!unlockCollectionId || !unlockDialogInfo) return 'No collection selected';

      const subLibrary = getSubLibraryForTab(workspace.data.entities, activeTab);
      if (!subLibrary) return 'No sub-library for tab';

      const { protectedInfo } = unlockDialogInfo;

      if (mode === 'keystore') {
        // Unlock workspace (keystore + load all protected collections)
        const errorMsg = await workspaceUnlock(password);
        if (errorMsg) return errorMsg;

        // Check if the collection was loaded by workspace.unlock()
        const stillProtected = subLibrary.protectedCollections.find(
          (pc) => pc.collectionId === unlockCollectionId
        );
        if (stillProtected) {
          return `Secret '${protectedInfo.secretName}' not found in keystore. Try using a collection password.`;
        }

        setUnlockCollectionId(null);
        return undefined;
      }

      // Collection password mode — derive key from password using stored keyDerivation params
      const keyDerivation = protectedInfo.keyDerivation;
      if (!keyDerivation) return 'Collection does not support password-based decryption';

      const keyStore = workspace.keyStore;
      if (!keyStore) return 'No keystore available';

      const cryptoProvider = keyStore.cryptoProvider;
      const saltBytes = CryptoUtils.fromBase64(keyDerivation.salt);
      const keyResult = await cryptoProvider.deriveKey(password, saltBytes, keyDerivation.iterations);
      if (keyResult.isFailure()) return `Key derivation failed: ${keyResult.message}`;

      // Build encryption config with the derived key
      const encryption: LibraryData.IEncryptionConfig = {
        secrets: [{ name: protectedInfo.secretName, key: keyResult.value }],
        cryptoProvider
      };

      const loadResult = await subLibrary.loadProtectedCollectionAsync(encryption, [unlockCollectionId]);
      if (loadResult.isFailure()) return `Failed to load collection: ${loadResult.message}`;

      // Optionally save the derived secret to the keystore
      if (saveToKeystore && keyStore.isUnlocked) {
        keyStore.importSecret(protectedInfo.secretName, keyResult.value);
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setUnlockCollectionId(null);
      return undefined;
    },
    [unlockCollectionId, unlockDialogInfo, workspace, activeTab, workspaceUnlock, reactiveWorkspace]
  );

  const handleCancelUnlockCollection = useCallback((): void => {
    setUnlockCollectionId(null);
  }, []);

  // --------------------------------------------------------------------------

  const existingCollectionIds = useMemo(() => new Set(collectionInfos.map((c) => c.id)), [collectionInfos]);

  const activeFilterCount = useMemo(() => countActiveSelections(filterState), [filterState]);

  return (
    <div className="flex flex-col">
      <FilterBar
        search={{
          value: filterState.search,
          onChange: handleSearchChange,
          placeholder: `Search ${activeTab}...`
        }}
        activeFilterCount={activeFilterCount}
        onClearAll={handleClearAll}
      >
        {filterDefs.map((def: IFilterDefinition) => (
          <FilterRow<string>
            key={def.key}
            label={def.label}
            options={optionProvider.getOptions(activeTab, def.key)}
            selected={getSelections(filterState, def.key)}
            onSelectionChange={(selected): void => handleSelectionChange(def.key, selected)}
            multiple={def.multiple}
          />
        ))}
      </FilterBar>

      <CollectionSection
        collections={collectionInfos}
        onToggleVisibility={handleToggleCollectionVisibility}
        onAddDirectory={onAddDirectory}
        onCreateCollection={onCreateCollection ? handleOpenCreateDialog : undefined}
        onDeleteCollection={onDeleteCollection ? handleRequestDeleteCollection : undefined}
        onSetDefaultCollection={onSetDefaultCollection}
        onExportCollection={onExportCollection}
        onExportAllAsZip={onExportAllAsZip}
        onImportCollection={onImportCollection}
        onOpenCollectionFromFile={onOpenCollectionFromFile}
        onUnlockCollection={handleRequestUnlockCollection}
      />

      {onCreateCollection && (
        <CreateCollectionDialog
          isOpen={isCreateDialogOpen}
          onClose={handleCloseCreateDialog}
          onCreate={handleCreateCollection}
          existingIds={existingCollectionIds}
          existingSecretNames={existingSecretNames}
        />
      )}

      <ConfirmDialog
        isOpen={collectionToDelete !== null}
        title="Delete Collection"
        message={
          <>
            Delete <strong>{collectionToDelete}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        severity="danger"
        onConfirm={handleConfirmDeleteCollection}
        onCancel={handleCancelDeleteCollection}
      />

      {onResolveImportCollision && pendingImport && (
        <ImportCollisionDialog
          isOpen={true}
          collectionId={pendingImport.collectionId}
          itemCount={pendingImport.itemCount}
          onResolve={onResolveImportCollision}
        />
      )}

      {onResolveSecretSetup && onSkipSecretSetup && (
        <SetSecretPasswordDialog
          isOpen={!!pendingSecretSetup}
          secretName={pendingSecretSetup?.secretName ?? ''}
          onSetPassword={onResolveSecretSetup}
          onSkip={onSkipSecretSetup}
        />
      )}

      {unlockDialogInfo && (
        <UnlockCollectionDialog
          isOpen={unlockCollectionId !== null}
          collectionName={unlockDialogInfo.collectionName}
          secretName={unlockDialogInfo.secretName}
          availableModes={unlockDialogInfo.availableModes}
          onUnlock={handleUnlockCollectionSubmit}
          onCancel={handleCancelUnlockCollection}
        />
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getSelections(state: IFilterState, key: string): ReadonlyArray<string> {
  return state.selections[key] ?? [];
}
