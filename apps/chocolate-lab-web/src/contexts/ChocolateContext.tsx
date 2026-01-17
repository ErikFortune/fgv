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
import { BuiltIn, Crypto, Runtime, type IngredientId, type FillingId, LibraryData } from '@fgv/ts-chocolate';
import { FileTree, type JsonObject } from '@fgv/ts-json-base';
import { ZipFileTree as ZipFileTreeModule } from '@fgv/ts-extras';
import { FileApiTreeAccessors, safeShowDirectoryPicker } from '@fgv/ts-web-extras';

// Aliases for cleaner code
type ChocolateRuntimeContext = Runtime.RuntimeContext;
type AnyRuntimeIngredient = Runtime.AnyRuntimeIngredient;
type RuntimeFillingRecipe = Runtime.RuntimeRecipe;
import type { Result } from '@fgv/ts-utils';
import { fail, succeed } from '@fgv/ts-utils';
import { useObservability } from '@fgv/ts-chocolate-ui';
import { useSettings } from './SettingsContext';
import { useSecrets } from './SecretsContext';

// Default PBKDF2 iterations for password derivation (used only if keyDerivation is missing)
const DEFAULT_PBKDF2_ITERATIONS = 100000;

const LOCAL_INGREDIENT_COLLECTIONS_KEY = 'chocolate-lab-web:ingredients:collections:v1';
const LOCAL_FILLING_COLLECTIONS_KEY = 'chocolate-lab-web:fillings:collections:v1';
const LOCAL_MOLD_COLLECTIONS_KEY = 'chocolate-lab-web:molds:collections:v1';
const LOCAL_TASK_COLLECTIONS_KEY = 'chocolate-lab-web:tasks:collections:v1';
const LOCAL_PROCEDURE_COLLECTIONS_KEY = 'chocolate-lab-web:procedures:collections:v1';

function getStartupLoadFlags(): { suppressBuiltIn: boolean; suppressLocal: boolean } {
  const params = new URLSearchParams(window.location.search);

  const suppressBuiltIn =
    params.get('noBuiltin') === '1' ||
    params.get('noBuiltin') === 'true' ||
    params.get('builtin') === '0' ||
    params.get('builtin') === 'false';

  const suppressLocal =
    params.get('noLocal') === '1' ||
    params.get('noLocal') === 'true' ||
    params.get('local') === '0' ||
    params.get('local') === 'false';

  return { suppressBuiltIn, suppressLocal };
}

class VirtualDirectoryItem implements FileTree.IFileTreeDirectoryItem {
  public readonly type: 'directory' = 'directory';
  public readonly absolutePath: string;
  public readonly name: string;
  private readonly _getChildren: () => Result<ReadonlyArray<FileTree.FileTreeItem>>;

  public constructor(
    name: string,
    absolutePath: string,
    getChildren: () => Result<ReadonlyArray<FileTree.FileTreeItem>>
  ) {
    this.name = name;
    this.absolutePath = absolutePath;
    this._getChildren = getChildren;
  }

  public getChildren(): Result<ReadonlyArray<FileTree.FileTreeItem>> {
    return this._getChildren();
  }
}

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

      const isEncrypted = Crypto.isEncryptedCollectionFile(contents);
      if (!isEncrypted) {
        if (!('items' in contents) || !isJsonObject(contents.items)) {
          continue;
        }
        if ('metadata' in contents && contents.metadata !== undefined && !isJsonObject(contents.metadata)) {
          continue;
        }
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

function readLocalFillingCollectionFiles(): FileTree.IInMemoryFile[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_FILLING_COLLECTIONS_KEY);
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

      const isEncrypted = Crypto.isEncryptedCollectionFile(contents);
      if (!isEncrypted) {
        if (!('items' in contents) || !isJsonObject(contents.items)) {
          continue;
        }
        if ('metadata' in contents && contents.metadata !== undefined && !isJsonObject(contents.metadata)) {
          continue;
        }
      }
      files.push({
        path: `/data/fillings/${collectionId}.json`,
        contents
      });
    }
    return files;
  } catch {
    return [];
  }
}

function readLocalProcedureCollectionFiles(): FileTree.IInMemoryFile[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_PROCEDURE_COLLECTIONS_KEY);
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

      const isEncrypted = Crypto.isEncryptedCollectionFile(contents);
      if (!isEncrypted) {
        if (!('items' in contents) || !isJsonObject(contents.items)) {
          continue;
        }
        if ('metadata' in contents && contents.metadata !== undefined && !isJsonObject(contents.metadata)) {
          continue;
        }
      }
      files.push({
        path: `/data/procedures/${collectionId}.json`,
        contents
      });
    }
    return files;
  } catch {
    return [];
  }
}

function readLocalTaskCollectionFiles(): FileTree.IInMemoryFile[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_TASK_COLLECTIONS_KEY);
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

      const isEncrypted = Crypto.isEncryptedCollectionFile(contents);
      if (!isEncrypted) {
        if (!('items' in contents) || !isJsonObject(contents.items)) {
          continue;
        }
        if ('metadata' in contents && contents.metadata !== undefined && !isJsonObject(contents.metadata)) {
          continue;
        }
      }
      files.push({
        path: `/data/tasks/${collectionId}.json`,
        contents
      });
    }
    return files;
  } catch {
    return [];
  }
}

function readLocalMoldCollectionFiles(): FileTree.IInMemoryFile[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_MOLD_COLLECTIONS_KEY);
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

      const isEncrypted = Crypto.isEncryptedCollectionFile(contents);
      if (!isEncrypted) {
        if (!('items' in contents) || !isJsonObject(contents.items)) {
          continue;
        }
        if ('metadata' in contents && contents.metadata !== undefined && !isJsonObject(contents.metadata)) {
          continue;
        }
      }
      files.push({
        path: `/data/molds/${collectionId}.json`,
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
export type SubLibraryType = 'ingredients' | 'fillings' | 'procedures' | 'tasks' | 'molds' | 'confections';

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
  /** Count of loaded procedures */
  procedureCount: number;
  /** Count of loaded tasks */
  taskCount: number;
  /** Count of loaded confections */
  confectionCount: number;
  /** Data version - changes when library data is modified (e.g., after unlock) */
  dataVersion: number;

  loadSubLibraryFromZip: (subLibrary: SubLibraryType, file: File) => Promise<Result<void>>;
  loadSubLibraryFromFolder: (subLibrary: SubLibraryType) => Promise<Result<void>>;
  loadLibraryFromZip: (file: File) => Promise<Result<void>>;
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
  procedureCount: 0,
  taskCount: 0,
  confectionCount: 0,
  dataVersion: 0,
  loadSubLibraryFromZip: async () => fail('No ChocolateProvider'),
  loadSubLibraryFromFolder: async () => fail('No ChocolateProvider'),
  loadLibraryFromZip: async () => fail('No ChocolateProvider')
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
  const { settings } = useSettings();
  const { setSecret } = useSecrets();

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | undefined>();
  const [runtime, setRuntime] = useState<ChocolateRuntimeContext | null>(null);
  const [collections, setCollections] = useState<ICollectionMetadata[]>([]);
  // Version counter to force re-render when library data changes (e.g., after unlock)
  const [dataVersion, setDataVersion] = useState(0);
  const [externalFileSources, setExternalFileSources] = useState<
    ReadonlyArray<LibraryData.ILibraryFileTreeSource>
  >([]);

  // Load the library
  const loadLibrary = useCallback(
    async (externalOverride?: ReadonlyArray<LibraryData.ILibraryFileTreeSource>) => {
      setLoadingState('loading');
      setError(undefined);
      diag.info('Loading chocolate library...');
      user.info('Loading library...');

      try {
        const { suppressBuiltIn, suppressLocal } = getStartupLoadFlags();
        diag.info(
          `Library load flags: suppressBuiltIn=${suppressBuiltIn ? 'true' : 'false'}, suppressLocal=${
            suppressLocal ? 'true' : 'false'
          }`
        );
        user.info(
          `Load flags: built-ins ${suppressBuiltIn ? 'disabled' : 'enabled'}, local ${
            suppressLocal ? 'disabled' : 'enabled'
          }`
        );

        // Get the built-in library tree
        const treeResult = !suppressBuiltIn ? BuiltIn.BuiltInData.getLibraryTree() : undefined;
        if (treeResult?.isFailure() === true) {
          throw new Error(`Failed to get library tree: ${treeResult.message}`);
        }

        const localFiles = suppressLocal
          ? []
          : [
              ...readLocalIngredientCollectionFiles(),
              ...readLocalFillingCollectionFiles(),
              ...readLocalMoldCollectionFiles(),
              ...readLocalTaskCollectionFiles(),
              ...readLocalProcedureCollectionFiles()
            ];

        diag.info(`Local collection files: ${localFiles.length}`);

        const localTreeResult = localFiles.length > 0 ? FileTree.inMemory(localFiles) : undefined;
        let localRootDir: FileTree.IFileTreeDirectoryItem | undefined;
        let localHasIngredients = false;
        let localHasFillings = false;
        let localHasMolds = false;
        let localHasTasks = false;
        let localHasProcedures = false;
        if (localTreeResult?.isSuccess() === true) {
          const ingredientsDirResult = localTreeResult.value.getItem('/data/ingredients');
          localHasIngredients =
            ingredientsDirResult.isSuccess() && ingredientsDirResult.value.type === 'directory';

          const fillingsDirResult = localTreeResult.value.getItem('/data/fillings');
          localHasFillings = fillingsDirResult.isSuccess() && fillingsDirResult.value.type === 'directory';

          const moldsDirResult = localTreeResult.value.getItem('/data/molds');
          localHasMolds = moldsDirResult.isSuccess() && moldsDirResult.value.type === 'directory';

          const tasksDirResult = localTreeResult.value.getItem('/data/tasks');
          localHasTasks = tasksDirResult.isSuccess() && tasksDirResult.value.type === 'directory';

          const proceduresDirResult = localTreeResult.value.getItem('/data/procedures');
          localHasProcedures =
            proceduresDirResult.isSuccess() && proceduresDirResult.value.type === 'directory';

          const rootResult = localTreeResult.value.getItem('/');
          if (rootResult.isSuccess() && rootResult.value.type === 'directory') {
            localRootDir = rootResult.value;
          }
        }

        const baseFileSources: ReadonlyArray<LibraryData.ILibraryFileTreeSource> = [
          ...(!suppressBuiltIn && treeResult?.isSuccess() === true
            ? [
                {
                  directory: treeResult.value
                }
              ]
            : []),
          ...(localRootDir &&
          (localHasIngredients || localHasFillings || localHasMolds || localHasTasks || localHasProcedures)
            ? [
                {
                  directory: localRootDir,
                  load: {
                    default: false,
                    ingredients: localHasIngredients,
                    fillings: localHasFillings,
                    molds: localHasMolds,
                    procedures: localHasProcedures,
                    tasks: localHasTasks
                  },
                  mutable: true
                }
              ]
            : [])
        ];

        const fileSources: ReadonlyArray<LibraryData.ILibraryFileTreeSource> = [
          ...baseFileSources,
          ...(externalOverride ?? externalFileSources)
        ];

        diag.info(
          `File sources: ${fileSources.length} (external: ${
            (externalOverride ?? externalFileSources).length
          })`
        );
        fileSources.forEach((s, i) => {
          diag.info(
            `  source[${i}]: dir=${s.directory.absolutePath || '/'} load=${JSON.stringify(
              s.load ?? true
            )} mutable=${JSON.stringify(s.mutable ?? false)}`
          );
        });

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

        // Include empty mold collections
        for (const collectionId of ctx.library.molds.collections.keys()) {
          addSubLibrary(collectionId, 'molds');
        }

        // Include empty procedure collections
        for (const collectionId of ctx.library.procedures.collections.keys()) {
          addSubLibrary(collectionId, 'procedures');
        }

        // Include empty task collections
        for (const collectionId of ctx.library.tasks.collections.keys()) {
          addSubLibrary(collectionId, 'tasks');
        }

        // Track which collections are protected (per sub-library)
        // The library now properly captures protected collection metadata during synchronous loading
        const protectedIngredientIds = new Set<string>(
          ctx.library.ingredients.protectedCollections.map((pc) => pc.collectionId as string)
        );
        const protectedFillingIds = new Set<string>(
          ctx.library.fillings.protectedCollections.map((pc) => pc.collectionId as string)
        );
        const protectedMoldIds = new Set<string>(
          ctx.library.molds.protectedCollections.map((pc) => pc.collectionId as string)
        );

        const protectedProcedureIds = new Set<string>(
          ctx.library.procedures.protectedCollections.map((pc) => pc.collectionId as string)
        );

        const protectedTaskIds = new Set<string>(
          ctx.library.tasks.protectedCollections.map((pc) => pc.collectionId as string)
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

        // Add protected mold collections (not yet loaded)
        for (const collectionId of protectedMoldIds) {
          addSubLibrary(collectionId, 'molds');
        }

        // Add protected procedure collections (not yet loaded)
        for (const collectionId of protectedProcedureIds) {
          addSubLibrary(collectionId, 'procedures');
        }

        // Add protected task collections (not yet loaded)
        for (const collectionId of protectedTaskIds) {
          addSubLibrary(collectionId, 'tasks');
        }

        // Build collection metadata from the map
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

          // A collection is loaded if it has items in the runtime (not just protected entries)
          const hasLoadedIngredients = !isProtectedIngredients && subLibs.has('ingredients');
          const hasLoadedFillings = !isProtectedFillings && subLibs.has('fillings');
          const hasLoadedMolds = !isProtectedMolds && subLibs.has('molds');
          const hasLoadedProcedures = !isProtectedProcedures && subLibs.has('procedures');
          const hasLoadedTasks = !isProtectedTasks && subLibs.has('tasks');
          const isLoaded =
            hasLoadedIngredients ||
            hasLoadedFillings ||
            hasLoadedMolds ||
            hasLoadedProcedures ||
            hasLoadedTasks;

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
        const moldCount = ctx.library.molds.size;
        const procedureCount = ctx.library.procedures.size;
        const taskCount = ctx.library.tasks.size;
        const confectionCount = ctx.confections.size;

        const ingredientCollectionCount = ctx.library.ingredients.collections.size;
        const fillingCollectionCount = ctx.library.fillings.collections.size;
        const moldCollectionCount = ctx.library.molds.collections.size;
        const procedureCollectionCount = ctx.library.procedures.collections.size;
        const taskCollectionCount = ctx.library.tasks.collections.size;

        const protectedIngredientCount = ctx.library.ingredients.protectedCollections.length;
        const protectedFillingCount = ctx.library.fillings.protectedCollections.length;
        const protectedMoldCount = ctx.library.molds.protectedCollections.length;
        const protectedProcedureCount = ctx.library.procedures.protectedCollections.length;
        const protectedTaskCount = ctx.library.tasks.protectedCollections.length;

        user.success(
          `Loaded ${ingredientCount} ingredients, ${fillingCount} fillings, ${moldCount} molds, ${procedureCount} procedures, ${taskCount} tasks`
        );
        diag.info(
          `Library loaded: ingredients=${ingredientCount}, fillings=${fillingCount}, molds=${moldCount}, procedures=${procedureCount}, tasks=${taskCount}, confections=${confectionCount}`
        );
        diag.info(
          `Collection sets: ingredients=${ingredientCollectionCount}, fillings=${fillingCollectionCount}, molds=${moldCollectionCount}, procedures=${procedureCollectionCount}, tasks=${taskCollectionCount}`
        );
        diag.info(
          `Protected collections: ingredients=${protectedIngredientCount}, fillings=${protectedFillingCount}, molds=${protectedMoldCount}, procedures=${protectedProcedureCount}, tasks=${protectedTaskCount}`
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        setLoadingState('error');
        user.error(`Failed to load library: ${message}`);
        diag.error('Library load failed:', e);
      }
    },
    [externalFileSources, preWarm, user, diag]
  );

  const loadSubLibraryFromZip = useCallback(
    async (subLibrary: SubLibraryType, file: File): Promise<Result<void>> => {
      diag.info(`Loading sublibrary from zip: ${subLibrary}, file=${file.name} (${file.size} bytes)`);
      user.info(`Importing ${subLibrary} from zip: ${file.name}`);
      const accessorsResult = await ZipFileTreeModule.ZipFileTreeAccessors.fromFile(file);
      if (accessorsResult.isFailure()) {
        user.error(`Failed to open zip: ${accessorsResult.message}`);
        return fail(accessorsResult.message);
      }

      const accessors = accessorsResult.value;

      const expectedSubDirName: string =
        subLibrary === 'ingredients'
          ? 'ingredients'
          : subLibrary === 'fillings'
          ? 'fillings'
          : subLibrary === 'molds'
          ? 'molds'
          : subLibrary === 'procedures'
          ? 'procedures'
          : subLibrary === 'tasks'
          ? 'tasks'
          : 'confections';

      // ZipFileTreeAccessors does not materialize '/' as an item, so we create a synthetic root.
      const zipRoot: FileTree.IFileTreeDirectoryItem = new ZipFileTreeModule.ZipDirectoryItem('', accessors);

      const resolveResult = LibraryData.resolveImportRootForSubLibrary(
        zipRoot,
        expectedSubDirName as LibraryData.SubLibraryId,
        { maxDepth: 2, visitLimit: 500, matchLimit: 10, allowLooseFiles: true }
      );
      if (resolveResult.isFailure()) {
        return fail(resolveResult.message);
      }

      if (resolveResult.value.matches > 1) {
        user.warn(`Multiple possible roots found for ${subLibrary}; using the first match`);
      }

      const libraryRoot = resolveResult.value.root;
      diag.info(
        `Resolved import root for ${subLibrary}: kind=${resolveResult.value.kind} path=${
          libraryRoot.absolutePath || '/'
        } (visited=${resolveResult.value.visited}, matches=${resolveResult.value.matches})`
      );

      const nextSource: LibraryData.ILibraryFileTreeSource = {
        directory: libraryRoot,
        load: {
          default: false,
          ingredients: subLibrary === 'ingredients',
          fillings: subLibrary === 'fillings',
          molds: subLibrary === 'molds',
          procedures: subLibrary === 'procedures',
          tasks: subLibrary === 'tasks'
        },
        mutable: true
      };

      const nextExternal = [...externalFileSources, nextSource];
      await loadLibrary(nextExternal);
      setExternalFileSources(nextExternal);
      user.success(`Imported ${subLibrary} from zip: ${file.name}`);
      return succeed(undefined);
    },
    [externalFileSources, loadLibrary]
  );

  const loadSubLibraryFromFolder = useCallback(
    async (subLibrary: SubLibraryType): Promise<Result<void>> => {
      diag.info(`Loading sublibrary from folder: ${subLibrary}`);

      let dirHandle: Awaited<ReturnType<typeof safeShowDirectoryPicker>>;
      try {
        dirHandle = await safeShowDirectoryPicker(globalThis.window, {
          id: `choco-${subLibrary}-imp-folder`,
          mode: 'read'
        });
      } catch (e) {
        const name = e instanceof Error ? e.name : '';
        if (name === 'AbortError') {
          user.info('Folder import canceled');
          return succeed(undefined);
        }
        const message = e instanceof Error ? e.message : String(e);
        user.error(`Failed to open folder picker: ${message}`);
        return fail(`Failed to open folder picker: ${message}`);
      }

      if (!dirHandle) {
        user.error('Folder import is not supported in this browser');
        return fail('Folder import is not supported in this browser');
      }

      user.info(`Importing ${subLibrary} from folder: ${dirHandle.name}`);

      const treeResult = await FileApiTreeAccessors.create([{ dirHandles: [dirHandle] }], {
        inferContentType: FileTree.FileItem.defaultAcceptContentType
      });
      if (treeResult.isFailure()) {
        user.error(`Failed to read folder: ${treeResult.message}`);
        return fail(treeResult.message);
      }

      const rootResult = treeResult.value.getItem('/');
      if (rootResult.isFailure() || rootResult.value.type !== 'directory') {
        const msg = rootResult.isFailure() ? rootResult.message : 'Root is not a directory';
        user.error(`Failed to resolve folder root: ${msg}`);
        return fail(`Failed to resolve folder root: ${msg}`);
      }

      const expectedSubDirName: string =
        subLibrary === 'ingredients'
          ? 'ingredients'
          : subLibrary === 'fillings'
          ? 'fillings'
          : subLibrary === 'molds'
          ? 'molds'
          : subLibrary === 'procedures'
          ? 'procedures'
          : subLibrary === 'tasks'
          ? 'tasks'
          : 'confections';

      const resolveResult = LibraryData.resolveImportRootForSubLibrary(
        rootResult.value,
        expectedSubDirName as LibraryData.SubLibraryId,
        { maxDepth: 2, visitLimit: 800, matchLimit: 10, allowLooseFiles: true }
      );
      if (resolveResult.isFailure()) {
        user.error(`Folder import failed: ${resolveResult.message}`);
        return fail(resolveResult.message);
      }

      if (resolveResult.value.matches > 1) {
        user.warn(`Multiple possible roots found for ${subLibrary}; using the first match`);
      }

      const libraryRoot = resolveResult.value.root;
      diag.info(
        `Resolved folder import root for ${subLibrary}: kind=${resolveResult.value.kind} path=${
          libraryRoot.absolutePath || '/'
        } (visited=${resolveResult.value.visited}, matches=${resolveResult.value.matches})`
      );

      const nextSource: LibraryData.ILibraryFileTreeSource = {
        directory: libraryRoot,
        load: {
          default: false,
          ingredients: subLibrary === 'ingredients',
          fillings: subLibrary === 'fillings',
          molds: subLibrary === 'molds',
          procedures: subLibrary === 'procedures',
          tasks: subLibrary === 'tasks'
        },
        mutable: true
      };

      const nextExternal = [...externalFileSources, nextSource];
      await loadLibrary(nextExternal);
      setExternalFileSources(nextExternal);
      user.success(`Imported ${subLibrary} from folder: ${dirHandle.name}`);
      return succeed(undefined);
    },
    [diag, user, externalFileSources, loadLibrary]
  );

  const loadLibraryFromZip = useCallback(
    async (file: File): Promise<Result<void>> => {
      diag.info(`Loading full library from zip: file=${file.name} (${file.size} bytes)`);
      user.info(`Importing library from zip: ${file.name}`);

      const accessorsResult = await ZipFileTreeModule.ZipFileTreeAccessors.fromFile(file);
      if (accessorsResult.isFailure()) {
        diag.error(`Failed to open zip: ${accessorsResult.message}`);
        user.error(`Failed to open zip: ${accessorsResult.message}`);
        return fail(accessorsResult.message);
      }

      const accessors = accessorsResult.value;
      const zipRoot: FileTree.IFileTreeDirectoryItem = new ZipFileTreeModule.ZipDirectoryItem('', accessors);

      const expectedSubDirNames = [
        'ingredients',
        'fillings',
        'molds',
        'procedures',
        'tasks',
        'confections',
        'journals'
      ];

      const getLibraryRoot = (
        dir: FileTree.IFileTreeDirectoryItem
      ): FileTree.IFileTreeDirectoryItem | undefined => {
        const childrenResult = dir.getChildren();
        if (childrenResult.isFailure()) {
          return undefined;
        }

        const dataDir = childrenResult.value.find(
          (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'data'
        );

        if (dataDir) {
          const dataChildrenResult = dataDir.getChildren();
          if (dataChildrenResult.isFailure()) {
            return undefined;
          }
          const hasAnyExpected = dataChildrenResult.value.some(
            (c) => c.type === 'directory' && expectedSubDirNames.includes(c.name)
          );
          if (hasAnyExpected) {
            return dir;
          }
        }

        const directSubDirs = childrenResult.value.filter(
          (c): c is FileTree.IFileTreeDirectoryItem =>
            c.type === 'directory' && expectedSubDirNames.includes(c.name)
        );

        if (directSubDirs.length === 0) {
          return undefined;
        }

        const virtualData = new VirtualDirectoryItem('data', '/data', () => succeed(directSubDirs));
        const virtualRoot = new VirtualDirectoryItem('', '/', () => succeed([virtualData]));
        return virtualRoot;
      };

      const matchingRoots: FileTree.IFileTreeDirectoryItem[] = [];
      const queue: FileTree.IFileTreeDirectoryItem[] = [zipRoot];
      let visited = 0;
      const VISIT_LIMIT = 800;

      while (queue.length > 0 && visited < VISIT_LIMIT && matchingRoots.length < 10) {
        const current = queue.shift();
        if (!current) {
          break;
        }
        visited += 1;

        const libraryRoot = getLibraryRoot(current);
        if (libraryRoot) {
          matchingRoots.push(libraryRoot);
          continue;
        }

        const childrenResult = current.getChildren();
        if (childrenResult.isFailure()) {
          continue;
        }
        for (const child of childrenResult.value) {
          if (child.type === 'directory') {
            queue.push(child);
          }
        }
      }

      if (matchingRoots.length === 0) {
        user.error('Zip import failed: could not find a library root');
        return fail(
          'Zip does not contain a recognizable library root (expected data/<sublibrary> folders or direct sublibrary folders)'
        );
      }

      if (matchingRoots.length > 1) {
        diag.info(
          `Zip contains multiple possible library roots; selecting first match. matches=${matchingRoots
            .map((r) => r.absolutePath || '/')
            .join(', ')}`
        );
        user.warn('Multiple possible library roots found; using the first match');
      }

      const libraryRoot = matchingRoots[0];
      diag.info(
        `Selected zip library root: ${libraryRoot.absolutePath || '/'} (visited=${visited}, matches=${
          matchingRoots.length
        })`
      );

      const nextSource: LibraryData.ILibraryFileTreeSource = {
        directory: libraryRoot,
        load: true,
        mutable: true
      };

      const nextExternal = [...externalFileSources, nextSource];
      await loadLibrary(nextExternal);
      setExternalFileSources(nextExternal);
      user.success(`Imported library from zip: ${file.name}`);
      return succeed(undefined);
    },
    [externalFileSources, loadLibrary]
  );

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

    for (const collectionId of runtime.library.molds.collections.keys()) {
      addSubLibrary(collectionId, 'molds');
    }

    for (const collectionId of runtime.library.procedures.collections.keys()) {
      addSubLibrary(collectionId, 'procedures');
    }

    for (const collectionId of runtime.library.tasks.collections.keys()) {
      addSubLibrary(collectionId, 'tasks');
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

    // Add protected collections
    for (const collectionId of protectedIngredientIds) {
      addSubLibrary(collectionId, 'ingredients');
    }

    for (const collectionId of protectedFillingIds) {
      addSubLibrary(collectionId, 'fillings');
    }

    for (const collectionId of protectedMoldIds) {
      addSubLibrary(collectionId, 'molds');
    }

    for (const collectionId of protectedProcedureIds) {
      addSubLibrary(collectionId, 'procedures');
    }

    for (const collectionId of protectedTaskIds) {
      addSubLibrary(collectionId, 'tasks');
    }

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

      // Identify the protected collection and its secret
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

        const password = options.password;

        const keyDerivation = protectedInfo.keyDerivation;

        if (!keyDerivation || keyDerivation.kdf !== 'pbkdf2' || !keyDerivation.salt) {
          return fail(
            'This collection was not encrypted with a password. ' +
              'Use "Enter Key" mode with the raw encryption key instead.'
          );
        }

        const iterations = keyDerivation?.iterations ?? options.iterations ?? DEFAULT_PBKDF2_ITERATIONS;
        diag.info(`Using keyDerivation: kdf=${keyDerivation?.kdf ?? 'pbkdf2'}, iterations=${iterations}`);

        const saltBase64 = options.salt ?? keyDerivation.salt;

        let salt: Uint8Array;
        try {
          salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
        } catch (e) {
          return fail(`Invalid salt: ${e instanceof Error ? e.message : String(e)}`);
        }

        user.info(`Deriving key for ${collectionId}...`);
        const keyResult = await cryptoProvider.deriveKey(password, salt, iterations);
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

      // Try to unlock in ingredients library
      const ingredientsResult = await runtime.library.ingredients.loadProtectedCollectionAsync(
        encryptionConfig,
        [collectionId, secretName]
      );

      // Try to unlock in fillings library
      const fillingsResult = await runtime.library.fillings.loadProtectedCollectionAsync(encryptionConfig, [
        collectionId,
        secretName
      ]);

      // Try to unlock in molds library
      const moldsResult = await runtime.library.molds.loadProtectedCollectionAsync(encryptionConfig, [
        collectionId,
        secretName
      ]);

      // Try to unlock in procedures library
      const proceduresResult = await runtime.library.procedures.loadProtectedCollectionAsync(
        encryptionConfig,
        [collectionId, secretName]
      );

      // Try to unlock in tasks library
      const tasksResult = await runtime.library.tasks.loadProtectedCollectionAsync(encryptionConfig, [
        collectionId,
        secretName
      ]);

      // Check results and get counts
      const ingredientCount = ingredientsResult.isSuccess() ? ingredientsResult.value.length : 0;
      const fillingCount = fillingsResult.isSuccess() ? fillingsResult.value.length : 0;
      const moldCount = moldsResult.isSuccess() ? moldsResult.value.length : 0;
      const procedureCount = proceduresResult.isSuccess() ? proceduresResult.value.length : 0;
      const taskCount = tasksResult.isSuccess() ? tasksResult.value.length : 0;

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

      if (moldsResult.isFailure()) {
        diag.info(`Unlock ${collectionId} molds: ${moldsResult.message}`);
      } else {
        diag.info(`Unlock ${collectionId} molds: loaded ${moldCount} collection(s)`);
      }

      if (proceduresResult.isFailure()) {
        diag.info(`Unlock ${collectionId} procedures: ${proceduresResult.message}`);
      } else {
        diag.info(`Unlock ${collectionId} procedures: loaded ${procedureCount} collection(s)`);
      }

      if (tasksResult.isFailure()) {
        diag.info(`Unlock ${collectionId} tasks: ${tasksResult.message}`);
      } else {
        diag.info(`Unlock ${collectionId} tasks: loaded ${taskCount} collection(s)`);
      }

      // Check for errors - report if both failed or neither loaded anything
      if (
        ingredientCount === 0 &&
        fillingCount === 0 &&
        moldCount === 0 &&
        procedureCount === 0 &&
        taskCount === 0
      ) {
        // Build error message from failures
        const errors: string[] = [];
        if (ingredientsResult.isFailure()) {
          errors.push(`ingredients: ${ingredientsResult.message}`);
        }
        if (fillingsResult.isFailure()) {
          errors.push(`fillings: ${fillingsResult.message}`);
        }
        if (moldsResult.isFailure()) {
          errors.push(`molds: ${moldsResult.message}`);
        }
        if (proceduresResult.isFailure()) {
          errors.push(`procedures: ${proceduresResult.message}`);
        }
        if (tasksResult.isFailure()) {
          errors.push(`tasks: ${tasksResult.message}`);
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

      // Store the key for future encrypted writes
      try {
        const raw = Array.from(key)
          .map((b) => String.fromCharCode(b))
          .join('');
        const keyBase64 = btoa(raw);

        // Store session-only (we don't want to persist keys in cleartext).
        setSecret(secretName, {
          keyBase64,
          ...(options.mode === 'password' && protectedInfo.keyDerivation
            ? { keyDerivation: protectedInfo.keyDerivation }
            : {})
        });
      } catch {
        // ignore
      }

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
      if (moldCount > 0) parts.push(`${moldCount} mold${moldCount !== 1 ? 's' : ''}`);
      if (procedureCount > 0) parts.push(`${procedureCount} procedure${procedureCount !== 1 ? 's' : ''}`);
      if (taskCount > 0) parts.push(`${taskCount} task${taskCount !== 1 ? 's' : ''}`);
      user.success(`Unlocked ${collectionId}: ${parts.join(', ')}`);

      return succeed(undefined);
    },
    [runtime, settings.secrets, setSecret, user, diag]
  );

  // Calculate counts - dataVersion dependency ensures recalculation after unlock
  const { ingredientCount, fillingCount, moldCount, procedureCount, taskCount, confectionCount } =
    useMemo(() => {
      // dataVersion is used to trigger recalculation when library data changes
      void dataVersion;
      return {
        ingredientCount: runtime?.ingredients.size ?? 0,
        fillingCount: runtime?.fillings.size ?? 0,
        moldCount: runtime?.library.molds.size ?? 0,
        procedureCount: runtime?.library.procedures.size ?? 0,
        taskCount: runtime?.library.tasks.size ?? 0,
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
      procedureCount,
      taskCount,
      confectionCount,
      dataVersion,
      loadSubLibraryFromZip,
      loadSubLibraryFromFolder,
      loadLibraryFromZip
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
      procedureCount,
      taskCount,
      confectionCount,
      dataVersion,
      loadSubLibraryFromZip,
      loadSubLibraryFromFolder,
      loadLibraryFromZip
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
