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
import {
  BuiltIn,
  Crypto,
  Runtime,
  type IngredientId,
  type FillingId,
  type LibraryData
} from '@fgv/ts-chocolate';
import { FileTree, type JsonObject } from '@fgv/ts-json-base';

// Aliases for cleaner code
type ChocolateRuntimeContext = Runtime.RuntimeContext;
type AnyRuntimeIngredient = Runtime.AnyRuntimeIngredient;
type RuntimeFillingRecipe = Runtime.RuntimeRecipe;
import type { Result } from '@fgv/ts-utils';
import { fail, succeed } from '@fgv/ts-utils';
import { useObservability } from '@fgv/ts-chocolate-ui';

// Default PBKDF2 iterations for password derivation (used only if keyDerivation is missing)
const DEFAULT_PBKDF2_ITERATIONS = 100000;

const LOCAL_INGREDIENT_COLLECTIONS_KEY = 'chocolate-lab-web:ingredients:collections:v1';

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readLocalIngredientCollectionFiles(): FileTree.IInMemoryFile[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_INGREDIENT_COLLECTIONS_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isJsonObject(parsed)) {
      return [];
    }

    const files: FileTree.IInMemoryFile[] = [];
    for (const [collectionId, contents] of Object.entries(parsed)) {
      if (!isJsonObject(contents)) {
        continue;
      }
      files.push({
        path: `/data/ingredients/${collectionId}.json`,
        contents
      });
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * Sub-library type for tracking which libraries a collection belongs to
 */
export type SubLibraryType = 'ingredients' | 'fillings' | 'molds' | 'confections';

/**
 * Collection metadata for UI display
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
 * Loading state for the chocolate library
 */
export type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

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
 * Chocolate context value
 */
export interface IChocolateContext {
  /** Loading state */
  loadingState: LoadingState;
  /** Error message if loading failed */
  error?: string;
  /** The RuntimeContext (null if not loaded) */
  runtime: ChocolateRuntimeContext | null;
  /** Collection metadata for all known collections */
  collections: readonly ICollectionMetadata[];
  /** Attempt to unlock a protected collection */
  unlockCollection: (collectionId: string, options: IUnlockOptions) => Promise<Result<void>>;
  /** Reload the library */
  reload: () => Promise<void>;
  /** Notify that library data has changed (clears runtime cache and updates collection metadata / counts) */
  notifyLibraryChanged: () => Result<void>;
  /** Count of loaded ingredients */
  ingredientCount: number;
  /** Count of loaded fillings */
  fillingCount: number;
  /** Count of loaded molds */
  moldCount: number;
  /** Count of loaded confections */
  confectionCount: number;
  /** Data version - changes when library data is modified (e.g., after unlock) */
  dataVersion: number;
}

/**
 * Default context value (for use outside provider)
 */
const defaultChocolateContext: IChocolateContext = {
  loadingState: 'idle',
  runtime: null,
  collections: [],
  unlockCollection: async () => fail('No ChocolateProvider'),
  reload: async () => Promise.resolve(),
  notifyLibraryChanged: () => fail('No ChocolateProvider'),
  ingredientCount: 0,
  fillingCount: 0,
  moldCount: 0,
  confectionCount: 0,
  dataVersion: 0
};

/**
 * Creates a BrowserCryptoProvider instance (lazy singleton)
 */
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
 * React context for chocolate library access
 */
export const ChocolateContext = createContext<IChocolateContext>(defaultChocolateContext);

/**
 * Props for the ChocolateProvider component
 */
export interface IChocolateProviderProps {
  /** Child components */
  children: ReactNode;
  /** Whether to pre-warm indexes on load (default: false) */
  preWarm?: boolean;
}

/**
 * Provider component that manages the chocolate library
 */
export function ChocolateProvider({
  children,
  preWarm = false
}: IChocolateProviderProps): React.ReactElement {
  const { user, diag } = useObservability();

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | undefined>();
  const [runtime, setRuntime] = useState<ChocolateRuntimeContext | null>(null);
  const [collections, setCollections] = useState<ICollectionMetadata[]>([]);
  // Version counter to force re-render when library data changes (e.g., after unlock)
  const [dataVersion, setDataVersion] = useState(0);

  // Load the library
  const loadLibrary = useCallback(async () => {
    setLoadingState('loading');
    setError(undefined);
    diag.info('Loading chocolate library...');

    try {
      // Get the built-in library tree
      const treeResult = BuiltIn.BuiltInData.getLibraryTree();
      if (treeResult.isFailure()) {
        throw new Error(`Failed to get library tree: ${treeResult.message}`);
      }

      const localFiles = readLocalIngredientCollectionFiles();

      const localTreeResult = localFiles.length > 0 ? FileTree.inMemory(localFiles) : undefined;
      let localRootDir: FileTree.IFileTreeDirectoryItem | undefined;
      if (localTreeResult?.isSuccess() === true) {
        const rootResult = localTreeResult.value.getItem('/');
        if (rootResult.isSuccess() && rootResult.value.type === 'directory') {
          localRootDir = rootResult.value;
        }
      }

      const fileSources: ReadonlyArray<LibraryData.ILibraryFileTreeSource> = [
        {
          directory: treeResult.value
        },
        ...(localRootDir
          ? [
              {
                directory: localRootDir,
                load: { ingredients: true, fillings: false },
                mutable: true
              }
            ]
          : [])
      ];

      // Create RuntimeContext with built-in data
      const runtimeResult = Runtime.RuntimeContext.create({
        libraryParams: {
          builtin: false,
          fileSources
        },
        preWarm
      });

      if (runtimeResult.isFailure()) {
        throw new Error(`Failed to create runtime: ${runtimeResult.message}`);
      }

      const ctx = runtimeResult.value;
      setRuntime(ctx);

      // Extract collection metadata from the library
      // Track which sub-libraries each collection ID belongs to
      const collectionSubLibraries = new Map<string, Set<SubLibraryType>>();

      // Helper to add a sub-library type to a collection
      const addSubLibrary = (collectionId: string, subLib: SubLibraryType): void => {
        if (!collectionSubLibraries.has(collectionId)) {
          collectionSubLibraries.set(collectionId, new Set());
        }
        collectionSubLibraries.get(collectionId)!.add(subLib);
      };

      // Get source IDs from loaded ingredients
      for (const [id] of ctx.ingredients.entries()) {
        const sourceId = id.split('.')[0];
        if (sourceId) {
          addSubLibrary(sourceId, 'ingredients');
        }
      }

      // Include empty ingredient collections
      for (const collectionId of ctx.library.ingredients.collections.keys()) {
        addSubLibrary(collectionId, 'ingredients');
      }

      // Get source IDs from loaded fillings
      for (const [id] of ctx.fillings.entries()) {
        const sourceId = id.split('.')[0];
        if (sourceId) {
          addSubLibrary(sourceId, 'fillings');
        }
      }

      // Include empty filling collections
      for (const collectionId of ctx.library.fillings.collections.keys()) {
        addSubLibrary(collectionId, 'fillings');
      }

      // Track which collections are protected (per sub-library)
      // The library now properly captures protected collection metadata during synchronous loading
      const protectedIngredientIds = new Set<string>(
        ctx.library.ingredients.protectedCollections.map((pc) => pc.collectionId as string)
      );
      const protectedFillingIds = new Set<string>(
        ctx.library.fillings.protectedCollections.map((pc) => pc.collectionId as string)
      );

      // Debug: log protected collections found
      diag.info(`Protected ingredients: ${Array.from(protectedIngredientIds).join(', ') || 'none'}`);
      diag.info(`Protected fillings: ${Array.from(protectedFillingIds).join(', ') || 'none'}`);

      // Add protected ingredient collections (not yet loaded)
      for (const collectionId of protectedIngredientIds) {
        addSubLibrary(collectionId, 'ingredients');
      }

      // Add protected filling collections (not yet loaded)
      for (const collectionId of protectedFillingIds) {
        addSubLibrary(collectionId, 'fillings');
      }

      // Build collection metadata from the map
      const collectionMeta: ICollectionMetadata[] = [];
      for (const [collectionId, subLibs] of collectionSubLibraries) {
        const isProtectedIngredients = protectedIngredientIds.has(collectionId);
        const isProtectedFillings = protectedFillingIds.has(collectionId);
        const isProtected = isProtectedIngredients || isProtectedFillings;

        // A collection is loaded if it has items in the runtime (not just protected entries)
        const hasLoadedIngredients = !isProtectedIngredients && subLibs.has('ingredients');
        const hasLoadedFillings = !isProtectedFillings && subLibs.has('fillings');
        const isLoaded = hasLoadedIngredients || hasLoadedFillings;

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
      setLoadingState('ready');

      const ingredientCount = ctx.ingredients.size;
      const fillingCount = ctx.fillings.size;
      user.success(`Loaded ${ingredientCount} ingredients and ${fillingCount} fillings`);
      diag.info(`Library loaded: ${ingredientCount} ingredients, ${fillingCount} fillings`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setLoadingState('error');
      user.error(`Failed to load library: ${message}`);
      diag.error('Library load failed:', e);
    }
  }, [preWarm, user, diag]);

  // Rebuild collections list from current runtime (for editing updates)
  const rebuildCollectionsList = useCallback(() => {
    if (!runtime) return;

    // Similar logic to loadLibrary but without recreating runtime
    const collectionSubLibraries = new Map<string, Set<SubLibraryType>>();

    const addSubLibrary = (collectionId: string, subLib: SubLibraryType): void => {
      if (!collectionSubLibraries.has(collectionId)) {
        collectionSubLibraries.set(collectionId, new Set());
      }
      collectionSubLibraries.get(collectionId)!.add(subLib);
    };

    // Get source IDs from loaded ingredients
    for (const [id] of runtime.ingredients.entries()) {
      const sourceId = id.split('.')[0];
      if (sourceId) {
        addSubLibrary(sourceId, 'ingredients');
      }
    }

    for (const collectionId of runtime.library.ingredients.collections.keys()) {
      addSubLibrary(collectionId, 'ingredients');
    }

    // Get source IDs from loaded fillings
    for (const [id] of runtime.fillings.entries()) {
      const sourceId = id.split('.')[0];
      if (sourceId) {
        addSubLibrary(sourceId, 'fillings');
      }
    }

    for (const collectionId of runtime.library.fillings.collections.keys()) {
      addSubLibrary(collectionId, 'fillings');
    }

    // Track protected collections
    const protectedIngredientIds = new Set<string>(
      runtime.library.ingredients.protectedCollections.map((pc) => pc.collectionId as string)
    );
    const protectedFillingIds = new Set<string>(
      runtime.library.fillings.protectedCollections.map((pc) => pc.collectionId as string)
    );

    // Add protected collections
    for (const collectionId of protectedIngredientIds) {
      addSubLibrary(collectionId, 'ingredients');
    }

    for (const collectionId of protectedFillingIds) {
      addSubLibrary(collectionId, 'fillings');
    }

    // Build collection metadata
    const collectionMeta: ICollectionMetadata[] = [];
    for (const [collectionId, subLibs] of collectionSubLibraries) {
      const isProtectedIngredients = protectedIngredientIds.has(collectionId);
      const isProtectedFillings = protectedFillingIds.has(collectionId);
      const isProtected = isProtectedIngredients || isProtectedFillings;

      const hasLoadedIngredients = !isProtectedIngredients && subLibs.has('ingredients');
      const hasLoadedFillings = !isProtectedFillings && subLibs.has('fillings');
      const isLoaded = hasLoadedIngredients || hasLoadedFillings;

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
    setDataVersion((prev) => prev + 1);
  }, [runtime]);

  const notifyLibraryChanged = useCallback((): Result<void> => {
    if (!runtime) {
      return fail('Runtime not loaded');
    }

    runtime.clearCache();
    rebuildCollectionsList();
    return succeed(undefined);
  }, [rebuildCollectionsList, runtime]);

  // Load on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

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

      // Get the key
      let key: Uint8Array;

      if (options.mode === 'key') {
        // Direct key input
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
        // Derive key from password
        if (!options.password) {
          return fail('Password is required when mode is "password"');
        }

        // Look for keyDerivation params from the protected collection metadata
        // Check both ingredients and fillings libraries for this collection
        const ingredientProtected = runtime.library.ingredients.protectedCollections.find(
          (pc) => pc.collectionId === collectionId || pc.secretName === collectionId
        );
        const fillingProtected = runtime.library.fillings.protectedCollections.find(
          (pc) => pc.collectionId === collectionId || pc.secretName === collectionId
        );

        const keyDerivation = ingredientProtected?.keyDerivation ?? fillingProtected?.keyDerivation;

        // Require keyDerivation params for password-based decryption
        // Files encrypted with a raw key (no keyDerivation) must use key mode instead
        const saltBase64 = keyDerivation?.salt ?? options.salt;
        if (!saltBase64) {
          return fail(
            'This collection was not encrypted with a password. ' +
              'Use "Enter Key" mode with the raw encryption key instead.'
          );
        }

        const iterations = keyDerivation?.iterations ?? options.iterations ?? DEFAULT_PBKDF2_ITERATIONS;
        diag.info(`Using keyDerivation: kdf=${keyDerivation?.kdf ?? 'pbkdf2'}, iterations=${iterations}`);

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
        secrets: [{ name: collectionId, key }],
        cryptoProvider,
        onMissingKey: 'fail',
        onDecryptionError: 'fail'
      };

      // Try to unlock in ingredients library
      const ingredientsResult = await runtime.library.ingredients.loadProtectedCollectionAsync(
        encryptionConfig,
        [collectionId]
      );

      // Try to unlock in fillings library
      const fillingsResult = await runtime.library.fillings.loadProtectedCollectionAsync(encryptionConfig, [
        collectionId
      ]);

      // Check results and get counts
      const ingredientCount = ingredientsResult.isSuccess() ? ingredientsResult.value.length : 0;
      const fillingCount = fillingsResult.isSuccess() ? fillingsResult.value.length : 0;

      // Log results
      if (ingredientsResult.isFailure()) {
        diag.info(`Unlock ${collectionId} ingredients: ${ingredientsResult.message}`);
      } else {
        diag.info(`Unlock ${collectionId} ingredients: loaded ${ingredientCount} collection(s)`);
      }
      if (fillingsResult.isFailure()) {
        diag.info(`Unlock ${collectionId} fillings: ${fillingsResult.message}`);
      } else {
        diag.info(`Unlock ${collectionId} fillings: loaded ${fillingCount} collection(s)`);
      }

      // Check for errors - report if both failed or neither loaded anything
      if (ingredientCount === 0 && fillingCount === 0) {
        // Build error message from failures
        const errors: string[] = [];
        if (ingredientsResult.isFailure()) {
          errors.push(`ingredients: ${ingredientsResult.message}`);
        }
        if (fillingsResult.isFailure()) {
          errors.push(`fillings: ${fillingsResult.message}`);
        }
        if (errors.length === 0) {
          errors.push('no matching collections found');
        }
        const msg = `Failed to unlock collection ${collectionId}: ${errors.join('; ')}`;
        user.error(msg);
        return fail(msg);
      }

      // Clear the RuntimeContext cache so it rebuilds with the newly loaded data
      runtime.clearCache();

      // Increment data version to trigger re-render with new counts
      setDataVersion((v) => v + 1);

      // Update collection metadata
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, isUnlocked: true, isLoaded: true } : c))
      );

      // Build detailed success message
      const parts: string[] = [];
      if (ingredientCount > 0) parts.push(`${ingredientCount} ingredient${ingredientCount !== 1 ? 's' : ''}`);
      if (fillingCount > 0) parts.push(`${fillingCount} filling${fillingCount !== 1 ? 's' : ''}`);
      user.success(`Unlocked ${collectionId}: ${parts.join(', ')}`);

      return succeed(undefined);
    },
    [runtime, user, diag]
  );

  // Calculate counts - dataVersion dependency ensures recalculation after unlock
  const { ingredientCount, fillingCount, moldCount, confectionCount } = useMemo(() => {
    // dataVersion is used to trigger recalculation when library data changes
    void dataVersion;
    return {
      ingredientCount: runtime?.ingredients.size ?? 0,
      fillingCount: runtime?.fillings.size ?? 0,
      moldCount: runtime?.library.molds.size ?? 0,
      confectionCount: runtime?.confections.size ?? 0
    };
  }, [runtime, dataVersion]);

  const value = useMemo(
    (): IChocolateContext => ({
      loadingState,
      error,
      runtime,
      collections,
      unlockCollection,
      reload: loadLibrary,
      notifyLibraryChanged,
      ingredientCount,
      fillingCount,
      moldCount,
      confectionCount,
      dataVersion
    }),
    [
      loadingState,
      error,
      runtime,
      collections,
      unlockCollection,
      loadLibrary,
      notifyLibraryChanged,
      ingredientCount,
      fillingCount,
      moldCount,
      confectionCount,
      dataVersion
    ]
  );

  return <ChocolateContext.Provider value={value}>{children}</ChocolateContext.Provider>;
}

/**
 * Hook to access the chocolate context
 */
export function useChocolate(): IChocolateContext {
  return useContext(ChocolateContext);
}

/**
 * Hook for ingredient-specific operations
 */
export function useIngredients(): {
  ingredients:
    | Runtime.IReadOnlyValidatingLibrary<
        IngredientId,
        AnyRuntimeIngredient,
        Runtime.Indexers.IIngredientQuerySpec
      >
    | undefined;
  getIngredient: (id: IngredientId) => Result<AnyRuntimeIngredient> | undefined;
  isLoading: boolean;
} {
  const { runtime, loadingState } = useChocolate();

  const getIngredient = useCallback(
    (id: IngredientId): Result<AnyRuntimeIngredient> | undefined => {
      return runtime ? runtime.ingredients.get(id).asResult : undefined;
    },
    [runtime]
  );

  return useMemo(
    () => ({
      ingredients: runtime?.ingredients,
      getIngredient,
      isLoading: loadingState === 'loading'
    }),
    [getIngredient, loadingState, runtime]
  );
}

/**
 * Hook for filling-specific operations
 */
export function useFillings(): {
  fillings:
    | Runtime.IReadOnlyValidatingLibrary<
        FillingId,
        RuntimeFillingRecipe,
        Runtime.Indexers.IFillingRecipeQuerySpec
      >
    | undefined;
  getFilling: (id: FillingId) => Result<RuntimeFillingRecipe> | undefined;
  isLoading: boolean;
} {
  const { runtime, loadingState } = useChocolate();

  const getFilling = useCallback(
    (id: FillingId): Result<RuntimeFillingRecipe> | undefined => {
      return runtime ? runtime.fillings.get(id).asResult : undefined;
    },
    [runtime]
  );

  return useMemo(
    () => ({
      fillings: runtime?.fillings,
      getFilling,
      isLoading: loadingState === 'loading'
    }),
    [getFilling, loadingState, runtime]
  );
}

/**
 * Format a collection source ID for display
 */
function formatCollectionName(sourceId: string): string {
  // Convert kebab-case or snake_case to Title Case
  return sourceId
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
