/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import { Crypto, LibraryData } from '@fgv/ts-chocolate';
import type { Result } from '@fgv/ts-utils';
import { fail, succeed } from '@fgv/ts-utils';
import { useObservability } from '@fgv/ts-chocolate-ui';
import { useRuntime, type SubLibraryType } from './RuntimeContext';
import { useSecrets } from './SecretsContext';

// Default PBKDF2 iterations for password derivation
const DEFAULT_PBKDF2_ITERATIONS = 100000;

/**
 * Metadata about a collection
 */
export interface ICollectionMetadata {
  /** Collection ID (e.g., 'common', 'felchlin') */
  id: string;
  /** Display name */
  name: string;
  /** Whether the collection is protected (encrypted) */
  isProtected: boolean;
  /** Whether the collection is currently unlocked */
  isUnlocked: boolean;
  /** Whether the collection is currently loaded */
  isLoaded: boolean;
  /** Which sub-libraries this collection contains data for */
  subLibraries: SubLibraryType[];
}

/**
 * Options for unlocking a collection
 */
export interface IUnlockOptions {
  /** Mode of key input */
  mode: 'password' | 'key';
  /** Password (if mode is 'password') */
  password?: string;
  /** Base64-encoded key (if mode is 'key') */
  keyBase64?: string;
  /** PBKDF2 salt (base64, optional - uses default if not provided) */
  salt?: string;
  /** PBKDF2 iterations (optional - uses default if not provided) */
  iterations?: number;
}

/**
 * Collections context interface
 */
export interface ICollectionsContext {
  /** Collection metadata for all known collections */
  collections: readonly ICollectionMetadata[];
  /** Attempt to unlock a protected collection */
  unlockCollection: (collectionId: string, options: IUnlockOptions) => Promise<Result<void>>;
}

/**
 * Default context value
 */
const defaultCollectionsContext: ICollectionsContext = {
  collections: [],
  unlockCollection: async () => fail('No CollectionsProvider')
};

/**
 * React context for collections management
 */
export const CollectionsContext = createContext<ICollectionsContext>(defaultCollectionsContext);

// Crypto provider singleton
let cryptoProviderInstance: Crypto.BrowserCryptoProvider | null = null;
function getCryptoProvider(): Result<Crypto.BrowserCryptoProvider> {
  if (cryptoProviderInstance) {
    return succeed(cryptoProviderInstance);
  }
  const result = Crypto.createBrowserCryptoProvider();
  if (result.isSuccess()) {
    cryptoProviderInstance = result.value;
  }
  return result;
}

/**
 * Format a collection ID into a display name
 */
function formatCollectionName(collectionId: string): string {
  return collectionId
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Props for the CollectionsProvider component
 */
export interface ICollectionsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages collection metadata and unlock
 */
export function CollectionsProvider({ children }: ICollectionsProviderProps): React.ReactElement {
  const { user, diag } = useObservability();
  const { runtime, dataVersion, notifyLibraryChanged } = useRuntime();
  const { setSecret } = useSecrets();

  const [collections, setCollections] = useState<ICollectionMetadata[]>([]);

  // Rebuild collections list from runtime
  const rebuildCollectionsList = useCallback(() => {
    if (!runtime) return;

    const collectionSubLibraries = new Map<string, Set<SubLibraryType>>();

    const addSubLibrary = (collectionId: string, subLib: SubLibraryType): void => {
      if (!collectionSubLibraries.has(collectionId)) {
        collectionSubLibraries.set(collectionId, new Set());
      }
      collectionSubLibraries.get(collectionId)!.add(subLib);
    };

    // Get source IDs from loaded items
    for (const [id] of runtime.ingredients.entries()) {
      const sourceId = id.split('.')[0];
      if (sourceId) addSubLibrary(sourceId, 'ingredients');
    }
    for (const collectionId of runtime.library.ingredients.collections.keys()) {
      addSubLibrary(collectionId, 'ingredients');
    }

    for (const [id] of runtime.fillings.entries()) {
      const sourceId = id.split('.')[0];
      if (sourceId) addSubLibrary(sourceId, 'fillings');
    }
    for (const collectionId of runtime.library.fillings.collections.keys()) {
      addSubLibrary(collectionId, 'fillings');
    }

    for (const collectionId of runtime.library.molds.collections.keys()) {
      addSubLibrary(collectionId, 'molds');
    }

    for (const collectionId of runtime.library.procedures.collections.keys()) {
      addSubLibrary(collectionId, 'procedures');
    }

    for (const collectionId of runtime.library.tasks.collections.keys()) {
      addSubLibrary(collectionId, 'tasks');
    }

    for (const collectionId of runtime.library.confections.collections.keys()) {
      addSubLibrary(collectionId, 'confections');
    }

    // Track protected collections
    const protectedIngredientIds = new Set<string>(
      runtime.library.ingredients.protectedCollections.map((pc) => pc.collectionId as string)
    );
    const protectedFillingIds = new Set<string>(
      runtime.library.fillings.protectedCollections.map((pc) => pc.collectionId as string)
    );
    const protectedMoldIds = new Set<string>(
      runtime.library.molds.protectedCollections.map((pc) => pc.collectionId as string)
    );
    const protectedProcedureIds = new Set<string>(
      runtime.library.procedures.protectedCollections.map((pc) => pc.collectionId as string)
    );
    const protectedTaskIds = new Set<string>(
      runtime.library.tasks.protectedCollections.map((pc) => pc.collectionId as string)
    );

    // Add protected collections to the map
    for (const collectionId of protectedIngredientIds) addSubLibrary(collectionId, 'ingredients');
    for (const collectionId of protectedFillingIds) addSubLibrary(collectionId, 'fillings');
    for (const collectionId of protectedMoldIds) addSubLibrary(collectionId, 'molds');
    for (const collectionId of protectedProcedureIds) addSubLibrary(collectionId, 'procedures');
    for (const collectionId of protectedTaskIds) addSubLibrary(collectionId, 'tasks');

    // Build collection metadata
    const collectionMeta: ICollectionMetadata[] = [];
    for (const [collectionId, subLibs] of collectionSubLibraries) {
      const isProtectedIngredients = protectedIngredientIds.has(collectionId);
      const isProtectedFillings = protectedFillingIds.has(collectionId);
      const isProtectedMolds = protectedMoldIds.has(collectionId);
      const isProtectedProcedures = protectedProcedureIds.has(collectionId);
      const isProtectedTasks = protectedTaskIds.has(collectionId);
      const isProtected =
        isProtectedIngredients ||
        isProtectedFillings ||
        isProtectedMolds ||
        isProtectedProcedures ||
        isProtectedTasks;

      const hasLoadedIngredients = !isProtectedIngredients && subLibs.has('ingredients');
      const hasLoadedFillings = !isProtectedFillings && subLibs.has('fillings');
      const hasLoadedMolds = !isProtectedMolds && subLibs.has('molds');
      const hasLoadedProcedures = !isProtectedProcedures && subLibs.has('procedures');
      const hasLoadedTasks = !isProtectedTasks && subLibs.has('tasks');
      const isLoaded =
        hasLoadedIngredients || hasLoadedFillings || hasLoadedMolds || hasLoadedProcedures || hasLoadedTasks;

      collectionMeta.push({
        id: collectionId,
        name: formatCollectionName(collectionId),
        isProtected,
        isUnlocked: !isProtected || isLoaded,
        isLoaded,
        subLibraries: Array.from(subLibs)
      });
    }

    setCollections(collectionMeta);
  }, [runtime]);

  // Rebuild collections when runtime or dataVersion changes
  useEffect(() => {
    rebuildCollectionsList();
  }, [rebuildCollectionsList, dataVersion]);

  // Unlock a protected collection
  const unlockCollection = useCallback(
    async (collectionId: string, options: IUnlockOptions): Promise<Result<void>> => {
      if (!runtime) {
        return fail('Runtime not loaded');
      }

      diag.info(`Attempting to unlock collection: ${collectionId}`);

      // Get the crypto provider
      const cryptoResult = getCryptoProvider();
      if (cryptoResult.isFailure()) {
        const msg = `Crypto not available: ${cryptoResult.message}`;
        user.error(msg);
        return fail(msg);
      }
      const cryptoProvider = cryptoResult.value;

      // Find the protected collection info
      const ingredientProtected = runtime.library.ingredients.protectedCollections.find(
        (pc) => pc.collectionId === collectionId
      );
      const fillingProtected = runtime.library.fillings.protectedCollections.find(
        (pc) => pc.collectionId === collectionId
      );
      const moldProtected = runtime.library.molds.protectedCollections.find(
        (pc) => pc.collectionId === collectionId
      );
      const taskProtected = runtime.library.tasks.protectedCollections.find(
        (pc) => pc.collectionId === collectionId
      );
      const procedureProtected = runtime.library.procedures.protectedCollections.find(
        (pc) => pc.collectionId === collectionId
      );

      const protectedInfo =
        ingredientProtected ?? fillingProtected ?? moldProtected ?? taskProtected ?? procedureProtected;

      if (!protectedInfo) {
        return fail(`Collection "${collectionId}" is not a protected collection or is already unlocked`);
      }

      const secretName = protectedInfo.secretName;

      // Get the key
      let key: Uint8Array;

      if (options.mode === 'key') {
        if (!options.keyBase64) {
          return fail('Key is required when mode is "key"');
        }
        try {
          const buffer = Uint8Array.from(atob(options.keyBase64), (c) => c.charCodeAt(0));
          if (buffer.length !== 32) {
            return fail(`Key must be 32 bytes (got ${buffer.length})`);
          }
          key = buffer;
        } catch (e) {
          return fail(`Invalid base64 key: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        if (!options.password) {
          return fail('Password is required when mode is "password"');
        }

        const keyDerivation = protectedInfo.keyDerivation;

        if (!keyDerivation || keyDerivation.kdf !== 'pbkdf2' || !keyDerivation.salt) {
          return fail(
            'This collection was not encrypted with a password. Use "Enter Key" mode with the raw encryption key instead.'
          );
        }

        const iterations = keyDerivation?.iterations ?? options.iterations ?? DEFAULT_PBKDF2_ITERATIONS;
        const saltBase64 = options.salt ?? keyDerivation.salt;

        let salt: Uint8Array;
        try {
          salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
        } catch (e) {
          return fail(`Invalid salt: ${e instanceof Error ? e.message : String(e)}`);
        }

        user.info(`Deriving key for ${collectionId}...`);
        const keyResult = await cryptoProvider.deriveKey(options.password, salt, iterations);
        if (keyResult.isFailure()) {
          const msg = `Key derivation failed: ${keyResult.message}`;
          user.error(msg);
          return fail(msg);
        }
        key = keyResult.value;
      }

      // Create encryption config
      const encryptionConfig: LibraryData.IEncryptionConfig = {
        secrets: [{ name: secretName, key }],
        cryptoProvider,
        onMissingKey: 'fail',
        onDecryptionError: 'fail'
      };

      // Try to unlock in all libraries
      const ingredientsResult = await runtime.library.ingredients.loadProtectedCollectionAsync(
        encryptionConfig,
        [collectionId, secretName]
      );
      const fillingsResult = await runtime.library.fillings.loadProtectedCollectionAsync(encryptionConfig, [
        collectionId,
        secretName
      ]);
      const moldsResult = await runtime.library.molds.loadProtectedCollectionAsync(encryptionConfig, [
        collectionId,
        secretName
      ]);
      const proceduresResult = await runtime.library.procedures.loadProtectedCollectionAsync(
        encryptionConfig,
        [collectionId, secretName]
      );
      const tasksResult = await runtime.library.tasks.loadProtectedCollectionAsync(encryptionConfig, [
        collectionId,
        secretName
      ]);

      // Check results
      const ingredientCount = ingredientsResult.isSuccess() ? ingredientsResult.value.length : 0;
      const fillingCount = fillingsResult.isSuccess() ? fillingsResult.value.length : 0;
      const moldCount = moldsResult.isSuccess() ? moldsResult.value.length : 0;
      const procedureCount = proceduresResult.isSuccess() ? proceduresResult.value.length : 0;
      const taskCount = tasksResult.isSuccess() ? tasksResult.value.length : 0;

      if (
        ingredientCount === 0 &&
        fillingCount === 0 &&
        moldCount === 0 &&
        procedureCount === 0 &&
        taskCount === 0
      ) {
        const errors: string[] = [];
        if (ingredientsResult.isFailure()) errors.push(`ingredients: ${ingredientsResult.message}`);
        if (fillingsResult.isFailure()) errors.push(`fillings: ${fillingsResult.message}`);
        if (moldsResult.isFailure()) errors.push(`molds: ${moldsResult.message}`);
        if (proceduresResult.isFailure()) errors.push(`procedures: ${proceduresResult.message}`);
        if (tasksResult.isFailure()) errors.push(`tasks: ${tasksResult.message}`);
        if (errors.length === 0) errors.push('no matching collections found');
        const msg = `Failed to unlock collection ${collectionId}: ${errors.join('; ')}`;
        user.error(msg);
        return fail(msg);
      }

      // Store the key for future encrypted writes
      try {
        const raw = Array.from(key)
          .map((b) => String.fromCharCode(b))
          .join('');
        const keyBase64 = btoa(raw);
        setSecret(secretName, {
          keyBase64,
          ...(options.mode === 'password' && protectedInfo.keyDerivation
            ? { keyDerivation: protectedInfo.keyDerivation }
            : {})
        });
      } catch {
        // ignore
      }

      // Update collection metadata
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, isUnlocked: true, isLoaded: true } : c))
      );

      // Notify that library changed to trigger cache clear and version increment
      notifyLibraryChanged();

      // Build success message
      const parts: string[] = [];
      if (ingredientCount > 0) parts.push(`${ingredientCount} ingredient${ingredientCount !== 1 ? 's' : ''}`);
      if (fillingCount > 0) parts.push(`${fillingCount} filling${fillingCount !== 1 ? 's' : ''}`);
      if (moldCount > 0) parts.push(`${moldCount} mold${moldCount !== 1 ? 's' : ''}`);
      if (procedureCount > 0) parts.push(`${procedureCount} procedure${procedureCount !== 1 ? 's' : ''}`);
      if (taskCount > 0) parts.push(`${taskCount} task${taskCount !== 1 ? 's' : ''}`);
      user.success(`Unlocked ${collectionId}: ${parts.join(', ')}`);

      return succeed(undefined);
    },
    [runtime, notifyLibraryChanged, setSecret, user, diag]
  );

  const contextValue = useMemo(
    (): ICollectionsContext => ({
      collections,
      unlockCollection
    }),
    [collections, unlockCollection]
  );

  return <CollectionsContext.Provider value={contextValue}>{children}</CollectionsContext.Provider>;
}

/**
 * Hook to access the collections context
 */
export function useCollections(): ICollectionsContext {
  return useContext(CollectionsContext);
}
