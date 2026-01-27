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
  useRef,
  ReactNode
} from 'react';
import { BuiltIn, Runtime, LibraryData, LibraryPersistence } from '@fgv/ts-chocolate';
import { FileTree } from '@fgv/ts-json-base';
import { useObservability } from '@fgv/ts-chocolate-ui';
import { useSettings } from './SettingsContext';

// Aliases for cleaner code
type ChocolateRuntimeContext = Runtime.RuntimeContext;

/**
 * Loading state for the runtime
 */
export type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Sub-library type for tracking which libraries a collection belongs to
 */
export type SubLibraryType =
  | 'ingredients'
  | 'fillings'
  | 'journals'
  | 'procedures'
  | 'tasks'
  | 'molds'
  | 'confections';

/**
 * Helper to read local collection files for a sublibrary
 */
function readLocalCollectionFiles(
  subLibrary: LibraryPersistence.SubLibraryStorageKey
): FileTree.IInMemoryFile[] {
  const storageKey = LibraryPersistence.getStorageKey(subLibrary);
  const rawJson = window.localStorage.getItem(storageKey) ?? undefined;
  return LibraryPersistence.parseSubLibraryStorageData(subLibrary, rawJson);
}

function getStartupLoadFlags(): { suppressBuiltIn: boolean; suppressLocal: boolean } {
  const params = new URLSearchParams(window.location.search);

  const isTruthy = (value: string | null): boolean => {
    if (value === null) return false;
    const v = value.trim().toLowerCase();
    return v === '' || v === '1' || v === 'true' || v === 'yes' || v === 'on';
  };

  const isFalsy = (value: string | null): boolean => {
    if (value === null) return false;
    const v = value.trim().toLowerCase();
    return v === '0' || v === 'false' || v === 'no' || v === 'off';
  };

  const hasTruthyFlag = (key: string): boolean => {
    if (!params.has(key)) return false;
    return isTruthy(params.get(key));
  };

  const suppressBuiltIn =
    hasTruthyFlag('noBuiltin') || hasTruthyFlag('noBuiltIn') || isFalsy(params.get('builtin'));
  const suppressLocal =
    hasTruthyFlag('noLocal') ||
    hasTruthyFlag('nolocal') ||
    hasTruthyFlag('no_local') ||
    isFalsy(params.get('local'));

  return { suppressBuiltIn, suppressLocal };
}

/**
 * Runtime context interface - core runtime access and lifecycle
 */
export interface IRuntimeContext {
  /** Loading state */
  loadingState: LoadingState;
  /** Error message if loading failed */
  error?: string;
  /** The RuntimeContext (null if not loaded) */
  runtime: ChocolateRuntimeContext | null;
  /** Data version - changes when library data is modified */
  dataVersion: number;
  /** Reload the library with optional external sources */
  reload: (externalSources?: ReadonlyArray<LibraryData.ILibraryFileTreeSource>) => Promise<void>;
  /** Notify that library data has changed (clears cache, increments version) */
  notifyLibraryChanged: () => void;
  /** Get current external file sources */
  getExternalSources: () => ReadonlyArray<LibraryData.ILibraryFileTreeSource>;
  /** Set external file sources and reload */
  setExternalSources: (sources: ReadonlyArray<LibraryData.ILibraryFileTreeSource>) => Promise<void>;
  /** Clear external file sources and reload */
  clearExternalSources: () => Promise<void>;
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
}

/**
 * Default context value
 */
const defaultRuntimeContext: IRuntimeContext = {
  loadingState: 'idle',
  runtime: null,
  dataVersion: 0,
  reload: async () => Promise.resolve(),
  notifyLibraryChanged: () => {},
  getExternalSources: () => [],
  setExternalSources: async () => Promise.resolve(),
  clearExternalSources: async () => Promise.resolve(),
  ingredientCount: 0,
  fillingCount: 0,
  moldCount: 0,
  procedureCount: 0,
  taskCount: 0,
  confectionCount: 0
};

/**
 * React context for runtime access
 */
export const RuntimeContext = createContext<IRuntimeContext>(defaultRuntimeContext);

/**
 * Props for the RuntimeProvider component
 */
export interface IRuntimeProviderProps {
  children: ReactNode;
  preWarm?: boolean;
}

/**
 * Provider component that manages the runtime lifecycle
 */
export function RuntimeProvider({ children, preWarm = false }: IRuntimeProviderProps): React.ReactElement {
  const { user, diag } = useObservability();
  const { settings } = useSettings();

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | undefined>();
  const [runtime, setRuntime] = useState<ChocolateRuntimeContext | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  // Use ref for external sources to avoid circular dependency in loadLibrary
  const externalSourcesRef = useRef<ReadonlyArray<LibraryData.ILibraryFileTreeSource>>([]);

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

        // Get the built-in library tree
        const treeResult = !suppressBuiltIn ? BuiltIn.BuiltInData.getLibraryTree() : undefined;
        if (treeResult?.isFailure() === true) {
          throw new Error(`Failed to get library tree: ${treeResult.message}`);
        }

        // Read local storage files
        let localFiles = suppressLocal
          ? []
          : [
              ...readLocalCollectionFiles('ingredients'),
              ...readLocalCollectionFiles('fillings'),
              ...readLocalCollectionFiles('journals'),
              ...readLocalCollectionFiles('molds'),
              ...readLocalCollectionFiles('tasks'),
              ...readLocalCollectionFiles('procedures'),
              ...readLocalCollectionFiles('confections')
            ];

        // Evict conflicting locals if built-ins are enabled
        if (!suppressBuiltIn && treeResult?.isSuccess() === true && localFiles.length > 0) {
          localFiles = evictConflictingLocals(treeResult.value, localFiles, diag, user);
        }

        diag.info(`Local collection files: ${localFiles.length}`);

        // Build local tree
        const localTreeResult = localFiles.length > 0 ? FileTree.inMemory(localFiles) : undefined;
        let localRootDir: FileTree.IFileTreeDirectoryItem | undefined;
        let localHasIngredients = false;
        let localHasFillings = false;
        let localHasJournals = false;
        let localHasMolds = false;
        let localHasTasks = false;
        let localHasProcedures = false;
        let localHasConfections = false;

        if (localTreeResult?.isSuccess() === true) {
          const checkDir = (path: string): boolean => {
            const result = localTreeResult.value.getItem(path);
            return result.isSuccess() && result.value.type === 'directory';
          };

          localHasIngredients = checkDir('/data/ingredients');
          localHasFillings = checkDir('/data/fillings');
          localHasJournals = checkDir('/data/journals');
          localHasMolds = checkDir('/data/molds');
          localHasTasks = checkDir('/data/tasks');
          localHasProcedures = checkDir('/data/procedures');
          localHasConfections = checkDir('/data/confections');

          const rootResult = localTreeResult.value.getItem('/');
          if (rootResult.isSuccess() && rootResult.value.type === 'directory') {
            localRootDir = rootResult.value;
          }
        }

        // Build file sources
        const baseFileSources: LibraryData.ILibraryFileTreeSource[] = [];

        if (!suppressBuiltIn && treeResult?.isSuccess() === true) {
          baseFileSources.push({ directory: treeResult.value });
        }

        if (
          localRootDir &&
          (localHasIngredients ||
            localHasFillings ||
            localHasJournals ||
            localHasMolds ||
            localHasTasks ||
            localHasProcedures ||
            localHasConfections)
        ) {
          baseFileSources.push({
            directory: localRootDir,
            load: {
              default: false,
              ingredients: localHasIngredients,
              fillings: localHasFillings,
              journals: localHasJournals,
              molds: localHasMolds,
              procedures: localHasProcedures,
              tasks: localHasTasks,
              confections: localHasConfections
            },
            mutable: true
          });
        }

        // Add external sources
        const effectiveExternal = externalOverride ?? externalSourcesRef.current;
        if (externalOverride) {
          externalSourcesRef.current = externalOverride;
        }

        const fileSources: ReadonlyArray<LibraryData.ILibraryFileTreeSource> = [
          ...baseFileSources,
          ...effectiveExternal
        ];

        diag.info(`File sources: ${fileSources.length} (external: ${effectiveExternal.length})`);

        // Create RuntimeContext
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
        setLoadingState('ready');
        setDataVersion((v) => v + 1);

        diag.info('Library loaded successfully');
        user.info('Library ready');
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        setLoadingState('error');
        diag.error(`Failed to load library: ${message}`);
        user.error(`Failed to load: ${message}`);
      }
    },
    [preWarm, diag, user]
  );

  // Notify that library data has changed
  const notifyLibraryChanged = useCallback((): void => {
    if (runtime) {
      runtime.clearCache();
    }
    setDataVersion((v) => v + 1);
  }, [runtime]);

  // Get external sources
  const getExternalSources = useCallback((): ReadonlyArray<LibraryData.ILibraryFileTreeSource> => {
    return externalSourcesRef.current;
  }, []);

  // Set external sources and reload
  const setExternalSources = useCallback(
    async (sources: ReadonlyArray<LibraryData.ILibraryFileTreeSource>): Promise<void> => {
      externalSourcesRef.current = sources;
      await loadLibrary(sources);
    },
    [loadLibrary]
  );

  // Clear external sources and reload
  const clearExternalSourcesCallback = useCallback(async (): Promise<void> => {
    externalSourcesRef.current = [];
    await loadLibrary([]);
  }, [loadLibrary]);

  // Auto-load on mount
  useEffect(() => {
    if (loadingState === 'idle' && settings !== undefined) {
      loadLibrary();
    }
  }, [loadingState, loadLibrary, settings]);

  // Compute counts
  const ingredientCount = runtime?.ingredients.size ?? 0;
  const fillingCount = runtime?.fillings.size ?? 0;
  const moldCount = runtime?.library.molds.size ?? 0;
  const procedureCount = runtime?.library.procedures.size ?? 0;
  const taskCount = runtime?.library.tasks.size ?? 0;
  const confectionCount = runtime?.confections.size ?? 0;

  const contextValue = useMemo(
    (): IRuntimeContext => ({
      loadingState,
      error,
      runtime,
      dataVersion,
      reload: loadLibrary,
      notifyLibraryChanged,
      getExternalSources,
      setExternalSources,
      clearExternalSources: clearExternalSourcesCallback,
      ingredientCount,
      fillingCount,
      moldCount,
      procedureCount,
      taskCount,
      confectionCount
    }),
    [
      loadingState,
      error,
      runtime,
      dataVersion,
      loadLibrary,
      notifyLibraryChanged,
      getExternalSources,
      setExternalSources,
      clearExternalSourcesCallback,
      ingredientCount,
      fillingCount,
      moldCount,
      procedureCount,
      taskCount,
      confectionCount
    ]
  );

  return <RuntimeContext.Provider value={contextValue}>{children}</RuntimeContext.Provider>;
}

/**
 * Hook to access the runtime context
 */
export function useRuntime(): IRuntimeContext {
  return useContext(RuntimeContext);
}

// Helper function to evict local collections that conflict with built-ins
function evictConflictingLocals(
  builtInRoot: FileTree.IFileTreeDirectoryItem,
  localFiles: FileTree.IInMemoryFile[],
  diag: { info: (msg: string) => void; warn: (msg: string) => void },
  user: { warn: (msg: string) => void }
): FileTree.IInMemoryFile[] {
  try {
    const subLibraries: ReadonlyArray<{ folder: string }> = [
      { folder: 'ingredients' },
      { folder: 'fillings' },
      { folder: 'journals' },
      { folder: 'molds' },
      { folder: 'procedures' },
      { folder: 'tasks' },
      { folder: 'confections' }
    ];

    const rootChildrenResult = builtInRoot.getChildren();
    const dataDir = rootChildrenResult.isSuccess()
      ? rootChildrenResult.value.find(
          (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
            c.type === 'directory' && c.name === 'data'
        )
      : undefined;

    const dataChildrenResult = dataDir?.getChildren();
    const dataChildren = dataChildrenResult?.isSuccess() ? dataChildrenResult.value : [];

    const builtInIdsBySub = new Map<string, Set<string>>();
    for (const sub of subLibraries) {
      const ids = new Set<string>();
      const subDir = dataChildren.find(
        (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
          c.type === 'directory' && c.name === sub.folder
      );
      if (subDir) {
        const childrenResult = subDir.getChildren();
        if (childrenResult.isSuccess()) {
          for (const child of childrenResult.value) {
            if (child.type !== 'file') continue;
            const name = child.name;
            const dot = name.lastIndexOf('.');
            const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
            if (ext !== 'json' && ext !== 'yaml' && ext !== 'yml') continue;
            const id = dot >= 0 ? name.slice(0, dot) : name;
            if (id.length > 0) ids.add(id);
          }
        }
      }
      builtInIdsBySub.set(sub.folder, ids);
    }

    const before = localFiles.length;
    const filtered = localFiles.filter((f) => {
      const m = /^\/data\/([^/]+)\/([^/.]+)\./.exec(f.path);
      if (!m) return true;
      const folder = m[1];
      const id = m[2];
      const builtInIds = builtInIdsBySub.get(folder);
      return !(builtInIds && builtInIds.has(id));
    });

    const evicted = before - filtered.length;
    if (evicted > 0) {
      diag.info(`Evicted ${evicted} local collection file(s) due to built-in conflicts`);
      user.warn(`Ignored ${evicted} local collection(s) because built-ins are enabled`);
    }

    return filtered;
  } catch (e) {
    diag.warn(`Failed to evict conflicting locals: ${e instanceof Error ? e.message : String(e)}`);
    return localFiles;
  }
}
