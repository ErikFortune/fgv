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
import { BuiltIn, Runtime, type IngredientId, type RecipeId } from '@fgv/ts-chocolate';

// Aliases for cleaner code
type ChocolateRuntimeContext = Runtime.RuntimeContext;
type AnyRuntimeIngredient = Runtime.AnyRuntimeIngredient;
type RuntimeRecipe = Runtime.RuntimeRecipe;
import type { Result } from '@fgv/ts-utils';
import { fail, succeed } from '@fgv/ts-utils';
import { useObservability } from '@fgv/ts-chocolate-ui';

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
}

/**
 * Loading state for the chocolate library
 */
export type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

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
  unlockCollection: (collectionId: string, password: string) => Promise<Result<void>>;
  /** Reload the library */
  reload: () => Promise<void>;
  /** Count of loaded ingredients */
  ingredientCount: number;
  /** Count of loaded recipes */
  recipeCount: number;
  /** Count of loaded molds */
  moldCount: number;
  /** Count of loaded confections */
  confectionCount: number;
}

/**
 * Default context value (for use outside provider)
 */
const defaultChocolateContext: IChocolateContext = {
  loadingState: 'idle',
  runtime: null,
  collections: [],
  unlockCollection: async () => fail('No ChocolateProvider'),
  reload: async () => {},
  ingredientCount: 0,
  recipeCount: 0,
  moldCount: 0,
  confectionCount: 0
};

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

      // Create RuntimeContext with built-in data
      const runtimeResult = Runtime.RuntimeContext.create({
        libraryParams: {
          libraryRoot: treeResult.value
        },
        preWarm
      });

      if (runtimeResult.isFailure()) {
        throw new Error(`Failed to create runtime: ${runtimeResult.message}`);
      }

      const ctx = runtimeResult.value;
      setRuntime(ctx);

      // Extract collection metadata from the library
      const collectionMeta: ICollectionMetadata[] = [];

      // Get unique source IDs from ingredients
      const sourceIds = new Set<string>();
      for (const [id] of ctx.ingredients.entries()) {
        const sourceId = id.split('.')[0];
        if (sourceId) {
          sourceIds.add(sourceId);
        }
      }

      // Create metadata for each collection
      for (const sourceId of sourceIds) {
        collectionMeta.push({
          id: sourceId,
          name: formatCollectionName(sourceId),
          isProtected: false,
          isUnlocked: true,
          isLoaded: true
        });
      }

      setCollections(collectionMeta);
      setLoadingState('ready');

      const ingredientCount = ctx.ingredients.size;
      const recipeCount = ctx.recipes.size;
      user.success(`Loaded ${ingredientCount} ingredients and ${recipeCount} recipes`);
      diag.info(`Library loaded: ${ingredientCount} ingredients, ${recipeCount} recipes`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setLoadingState('error');
      user.error(`Failed to load library: ${message}`);
      diag.error('Library load failed:', e);
    }
  }, [preWarm, user, diag]);

  // Load on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Unlock a protected collection (placeholder for future encryption support)
  const unlockCollection = useCallback(
    async (collectionId: string, _password: string): Promise<Result<void>> => {
      diag.info(`Attempting to unlock collection: ${collectionId}`);
      // All built-in collections are unprotected
      user.info(`Collection ${collectionId} is not encrypted`);
      return succeed(undefined);
    },
    [user, diag]
  );

  // Calculate counts
  const ingredientCount = runtime?.ingredients.size ?? 0;
  const recipeCount = runtime?.recipes.size ?? 0;
  const moldCount = runtime?.library.molds.size ?? 0;
  const confectionCount = runtime?.confections.size ?? 0;

  const value = useMemo(
    (): IChocolateContext => ({
      loadingState,
      error,
      runtime,
      collections,
      unlockCollection,
      reload: loadLibrary,
      ingredientCount,
      recipeCount,
      moldCount,
      confectionCount
    }),
    [
      loadingState,
      error,
      runtime,
      collections,
      unlockCollection,
      loadLibrary,
      ingredientCount,
      recipeCount,
      moldCount,
      confectionCount
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
  ingredients: ReadonlyMap<IngredientId, AnyRuntimeIngredient> | undefined;
  getIngredient: (id: IngredientId) => Result<AnyRuntimeIngredient> | undefined;
  isLoading: boolean;
} {
  const { runtime, loadingState } = useChocolate();

  return useMemo(
    () => ({
      ingredients: runtime?.ingredients as ReadonlyMap<IngredientId, AnyRuntimeIngredient> | undefined,
      getIngredient: runtime ? (id: IngredientId) => runtime.ingredients.get(id).asResult : undefined,
      isLoading: loadingState === 'loading'
    }),
    [runtime, loadingState]
  );
}

/**
 * Hook for recipe-specific operations
 */
export function useRecipes(): {
  recipes: ReadonlyMap<RecipeId, RuntimeRecipe> | undefined;
  getRecipe: (id: RecipeId) => Result<RuntimeRecipe> | undefined;
  isLoading: boolean;
} {
  const { runtime, loadingState } = useChocolate();

  return useMemo(
    () => ({
      recipes: runtime?.recipes as ReadonlyMap<RecipeId, RuntimeRecipe> | undefined,
      getRecipe: runtime ? (id: RecipeId) => runtime.recipes.get(id).asResult : undefined,
      isLoading: loadingState === 'loading'
    }),
    [runtime, loadingState]
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
