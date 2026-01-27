/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { createContext, useContext, useCallback, useMemo, useRef, ReactNode } from 'react';
import { LibraryData } from '@fgv/ts-chocolate';
import { FileTree } from '@fgv/ts-json-base';
import { ZipFileTree as ZipFileTreeModule } from '@fgv/ts-extras';
import {
  FileApiTreeAccessors,
  safeShowDirectoryPicker,
  type FileSystemDirectoryHandle
} from '@fgv/ts-web-extras';
import type { Result } from '@fgv/ts-utils';
import { fail, succeed } from '@fgv/ts-utils';
import { useObservability } from '@fgv/ts-chocolate-ui';
import { useRuntime, type SubLibraryType } from './RuntimeContext';

/**
 * File-backed collection target info
 */
interface IFileBackedCollectionTarget {
  readonly baseDir: FileSystemDirectoryHandle;
  readonly relativePath: string;
  readonly exportFormat: 'yaml' | 'json';
}

function getFileBackedTargetKey(subLibrary: SubLibraryType, collectionId: string): string {
  return `${subLibrary}:${collectionId}`;
}

async function getDirectoryHandleAtPath(
  root: FileSystemDirectoryHandle,
  relativePath: string
): Promise<FileSystemDirectoryHandle> {
  const trimmed = relativePath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (trimmed.length === 0) return root;
  const parts = trimmed.split('/').filter((p) => p.length > 0);
  let cur = root;
  for (const p of parts) {
    cur = await cur.getDirectoryHandle(p, { create: false });
  }
  return cur;
}

async function writeTextFileAtRelativePath(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  contents: string
): Promise<void> {
  const parts = relativePath.split('/').filter((p) => p.length > 0);
  if (parts.length === 0) throw new Error('Empty relative path');
  const fileName = parts.pop()!;
  let curDir = root;
  for (const p of parts) {
    curDir = await curDir.getDirectoryHandle(p, { create: true });
  }
  const fileHandle = await curDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(contents);
  } finally {
    await writable.close();
  }
}

/**
 * Virtual directory item for creating synthetic roots
 */
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

/**
 * Library import context interface
 */
export interface ILibraryImportContext {
  /** Load a sublibrary from a zip file */
  loadSubLibraryFromZip: (subLibrary: SubLibraryType, file: File) => Promise<Result<void>>;
  /** Load a sublibrary from a folder */
  loadSubLibraryFromFolder: (subLibrary: SubLibraryType) => Promise<Result<void>>;
  /** Load a full library from a zip file */
  loadLibraryFromZip: (file: File) => Promise<Result<void>>;
  /** Load a full library from a folder */
  loadLibraryFromFolder: () => Promise<Result<void>>;
  /** Clear external sources */
  clearExternalSources: () => Promise<Result<void>>;
  /** Get the export format for a file-backed collection */
  getFileBackedCollectionExportFormat: (
    subLibrary: SubLibraryType,
    collectionId: string
  ) => 'yaml' | 'json' | undefined;
  /** Try to write to a file-backed collection */
  tryWriteFileBackedCollection: (
    subLibrary: SubLibraryType,
    collectionId: string,
    contents: string
  ) => Promise<Result<boolean>>;
}

/**
 * Default context value
 */
const defaultLibraryImportContext: ILibraryImportContext = {
  loadSubLibraryFromZip: async () => fail('No LibraryImportProvider'),
  loadSubLibraryFromFolder: async () => fail('No LibraryImportProvider'),
  loadLibraryFromZip: async () => fail('No LibraryImportProvider'),
  loadLibraryFromFolder: async () => fail('No LibraryImportProvider'),
  clearExternalSources: async () => fail('No LibraryImportProvider'),
  getFileBackedCollectionExportFormat: () => undefined,
  tryWriteFileBackedCollection: async () => fail('No LibraryImportProvider')
};

/**
 * React context for library import/export
 */
export const LibraryImportContext = createContext<ILibraryImportContext>(defaultLibraryImportContext);

/**
 * Props for the LibraryImportProvider component
 */
export interface ILibraryImportProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages library imports
 */
export function LibraryImportProvider({ children }: ILibraryImportProviderProps): React.ReactElement {
  const { user, diag } = useObservability();
  const { setExternalSources, getExternalSources, clearExternalSources: runtimeClearExternal } = useRuntime();

  // File-backed targets ref
  const fileBackedTargetsRef = useRef(new Map<string, IFileBackedCollectionTarget>());

  // Get export format for a file-backed collection
  const getFileBackedCollectionExportFormat = useCallback(
    (subLibrary: SubLibraryType, collectionId: string): 'yaml' | 'json' | undefined => {
      const key = getFileBackedTargetKey(subLibrary, collectionId);
      return fileBackedTargetsRef.current.get(key)?.exportFormat;
    },
    []
  );

  // Try to write to a file-backed collection
  const tryWriteFileBackedCollection = useCallback(
    async (subLibrary: SubLibraryType, collectionId: string, contents: string): Promise<Result<boolean>> => {
      const key = getFileBackedTargetKey(subLibrary, collectionId);
      const target = fileBackedTargetsRef.current.get(key);
      if (!target) {
        return succeed(false);
      }

      try {
        const perm = await target.baseDir.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          const requested = await target.baseDir.requestPermission({ mode: 'readwrite' });
          if (requested !== 'granted') {
            return fail(`Permission denied to write to folder for "${subLibrary}"`);
          }
        }

        await writeTextFileAtRelativePath(target.baseDir, target.relativePath, contents);
        return succeed(true);
      } catch (e) {
        return fail(`Failed to write file-backed collection: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    []
  );

  // Clear external sources
  const clearExternalSources = useCallback(async (): Promise<Result<void>> => {
    try {
      fileBackedTargetsRef.current.clear();
      await runtimeClearExternal();
      user.success('Detached external imports');
      return succeed(undefined);
    } catch (e) {
      return fail(`Failed to detach external imports: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [runtimeClearExternal, user]);

  // Load sublibrary from zip
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
      const expectedSubDirName = subLibrary;

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

      const nextSource: LibraryData.ILibraryFileTreeSource = {
        directory: libraryRoot,
        load: {
          default: false,
          ingredients: subLibrary === 'ingredients',
          fillings: subLibrary === 'fillings',
          journals: subLibrary === 'journals',
          molds: subLibrary === 'molds',
          procedures: subLibrary === 'procedures',
          tasks: subLibrary === 'tasks',
          confections: subLibrary === 'confections'
        },
        mutable: true
      };

      const nextExternal = [...getExternalSources(), nextSource];
      await setExternalSources(nextExternal);
      user.success(`Imported ${subLibrary} from zip: ${file.name}`);
      return succeed(undefined);
    },
    [getExternalSources, setExternalSources, diag, user]
  );

  // Load library from zip
  const loadLibraryFromZip = useCallback(
    async (file: File): Promise<Result<void>> => {
      diag.info(`Loading library from zip: ${file.name} (${file.size} bytes)`);
      user.info(`Importing library from zip: ${file.name}`);

      const accessorsResult = await ZipFileTreeModule.ZipFileTreeAccessors.fromFile(file);
      if (accessorsResult.isFailure()) {
        user.error(`Failed to open zip: ${accessorsResult.message}`);
        return fail(accessorsResult.message);
      }

      const accessors = accessorsResult.value;
      const zipRoot: FileTree.IFileTreeDirectoryItem = new ZipFileTreeModule.ZipDirectoryItem('', accessors);

      // Find library root
      const resolveResult = LibraryData.resolveImportRootForLibrary(zipRoot, {
        maxDepth: 3,
        visitLimit: 1000,
        matchLimit: 10
      });

      if (resolveResult.isFailure()) {
        user.error(`Failed to find library root: ${resolveResult.message}`);
        return fail(resolveResult.message);
      }

      if (resolveResult.value.matches > 1) {
        user.warn('Multiple possible library roots found; using the first match');
      }

      const libraryRoot = resolveResult.value.root;

      const nextSource: LibraryData.ILibraryFileTreeSource = {
        directory: libraryRoot,
        load: true,
        mutable: true
      };

      const nextExternal = [...getExternalSources(), nextSource];
      await setExternalSources(nextExternal);
      user.success(`Imported library from zip: ${file.name}`);
      return succeed(undefined);
    },
    [getExternalSources, setExternalSources, diag, user]
  );

  // Load sublibrary from folder
  const loadSubLibraryFromFolder = useCallback(
    async (subLibrary: SubLibraryType): Promise<Result<void>> => {
      diag.info(`Loading sublibrary from folder: ${subLibrary}`);

      let dirHandle: Awaited<ReturnType<typeof safeShowDirectoryPicker>>;
      try {
        dirHandle = await safeShowDirectoryPicker(globalThis.window, {
          id: `choco-${subLibrary}-imp-folder`,
          mode: 'readwrite'
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

      const resolveResult = LibraryData.resolveImportRootForSubLibrary(
        rootResult.value,
        subLibrary as LibraryData.SubLibraryId,
        { maxDepth: 2, visitLimit: 500, matchLimit: 10, allowLooseFiles: true }
      );
      if (resolveResult.isFailure()) {
        return fail(resolveResult.message);
      }

      if (resolveResult.value.matches > 1) {
        user.warn(`Multiple possible roots found for ${subLibrary}; using the first match`);
      }

      const libraryRoot = resolveResult.value.root;

      // Record file-backed targets
      try {
        const matchAbs = libraryRoot.absolutePath || '';
        const basePrefix = `/${dirHandle.name}`;
        const withoutBase = matchAbs.startsWith(basePrefix) ? matchAbs.slice(basePrefix.length) : matchAbs;
        const matchRel = withoutBase.replace(/^\/+/, '');

        const childrenResult = libraryRoot.getChildren();
        if (childrenResult.isSuccess()) {
          const dataDir = childrenResult.value.find(
            (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
              c.type === 'directory' && c.name === 'data'
          );

          let fileDir: FileTree.IFileTreeDirectoryItem | undefined;
          let fileDirRel = '';

          if (dataDir) {
            const dataChildrenResult = dataDir.getChildren();
            if (dataChildrenResult.isSuccess()) {
              const subDir = dataChildrenResult.value.find(
                (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
                  c.type === 'directory' && c.name === subLibrary
              );
              if (subDir) {
                fileDir = subDir;
                fileDirRel = [matchRel, 'data', subLibrary].filter((p) => p.length > 0).join('/');
              }
            }
          }

          if (!fileDir) {
            const subDir = childrenResult.value.find(
              (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
                c.type === 'directory' && c.name === subLibrary
            );
            if (subDir) {
              fileDir = subDir;
              fileDirRel = [matchRel, subLibrary].filter((p) => p.length > 0).join('/');
            }
          }

          if (fileDir) {
            const fileChildrenResult = fileDir.getChildren();
            if (fileChildrenResult.isSuccess()) {
              for (const child of fileChildrenResult.value) {
                if (child.type !== 'file') continue;
                const name = child.name;
                const dot = name.lastIndexOf('.');
                const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
                if (ext !== 'json' && ext !== 'yaml' && ext !== 'yml') continue;
                const exportFormat: 'yaml' | 'json' = ext === 'yaml' || ext === 'yml' ? 'yaml' : 'json';
                const collectionId = dot >= 0 ? name.slice(0, dot) : name;
                if (collectionId.length === 0) continue;
                const relativePath = [fileDirRel, name].filter((p) => p.length > 0).join('/');
                fileBackedTargetsRef.current.set(getFileBackedTargetKey(subLibrary, collectionId), {
                  baseDir: dirHandle,
                  relativePath,
                  exportFormat
                });
              }
            }
          }
        }
      } catch (e) {
        diag.warn(`Failed to record file-backed targets: ${e instanceof Error ? e.message : String(e)}`);
      }

      const nextSource: LibraryData.ILibraryFileTreeSource = {
        directory: libraryRoot,
        load: {
          default: false,
          ingredients: subLibrary === 'ingredients',
          fillings: subLibrary === 'fillings',
          journals: subLibrary === 'journals',
          molds: subLibrary === 'molds',
          procedures: subLibrary === 'procedures',
          tasks: subLibrary === 'tasks',
          confections: subLibrary === 'confections'
        },
        mutable: true
      };

      const nextExternal = [...getExternalSources(), nextSource];
      await setExternalSources(nextExternal);
      user.success(`Imported ${subLibrary} from folder: ${dirHandle.name}`);
      return succeed(undefined);
    },
    [getExternalSources, setExternalSources, diag, user]
  );

  // Load library from folder
  const loadLibraryFromFolder = useCallback(async (): Promise<Result<void>> => {
    diag.info('Loading full library from folder');

    let dirHandle: Awaited<ReturnType<typeof safeShowDirectoryPicker>>;
    try {
      dirHandle = await safeShowDirectoryPicker(globalThis.window, {
        id: 'choco-library-imp-folder',
        mode: 'readwrite'
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

    user.info(`Importing library from folder: ${dirHandle.name}`);

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
    ): { root: FileTree.IFileTreeDirectoryItem; matchDir: FileTree.IFileTreeDirectoryItem } | undefined => {
      const childrenResult = dir.getChildren();
      if (childrenResult.isFailure()) return undefined;

      const dataDir = childrenResult.value.find(
        (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'data'
      );

      if (dataDir) {
        const dataChildrenResult = dataDir.getChildren();
        if (dataChildrenResult.isSuccess()) {
          const hasAnyExpected = dataChildrenResult.value.some(
            (c) => c.type === 'directory' && expectedSubDirNames.includes(c.name)
          );
          if (hasAnyExpected) {
            return { root: dir, matchDir: dir };
          }
        }
      }

      const directSubDirs = childrenResult.value.filter(
        (c): c is FileTree.IFileTreeDirectoryItem =>
          c.type === 'directory' && expectedSubDirNames.includes(c.name)
      );

      if (directSubDirs.length === 0) return undefined;

      const virtualData = new VirtualDirectoryItem('data', '/data', () => succeed(directSubDirs));
      const virtualRoot = new VirtualDirectoryItem('', '/', () => succeed([virtualData]));
      return { root: virtualRoot, matchDir: dir };
    };

    const matchingRoots: Array<{
      root: FileTree.IFileTreeDirectoryItem;
      matchDir: FileTree.IFileTreeDirectoryItem;
    }> = [];
    const queue: FileTree.IFileTreeDirectoryItem[] = [rootResult.value];
    let visited = 0;
    const VISIT_LIMIT = 800;

    while (queue.length > 0 && visited < VISIT_LIMIT && matchingRoots.length < 10) {
      const current = queue.shift();
      if (!current) break;
      visited += 1;

      const libraryRoot = getLibraryRoot(current);
      if (libraryRoot) {
        matchingRoots.push(libraryRoot);
        continue;
      }

      const childrenResult = current.getChildren();
      if (childrenResult.isSuccess()) {
        for (const child of childrenResult.value) {
          if (child.type === 'directory') queue.push(child);
        }
      }
    }

    if (matchingRoots.length === 0) {
      user.error('Folder import failed: could not find a library root');
      return fail('Folder does not contain a recognizable library root');
    }

    if (matchingRoots.length > 1) {
      user.warn('Multiple possible library roots found; using the first match');
    }

    const selected = matchingRoots[0];

    // Clear and record file-backed targets
    fileBackedTargetsRef.current.clear();

    try {
      const matchAbs = selected.matchDir.absolutePath || '';
      const basePrefix = `/${dirHandle.name}`;
      const withoutBase = matchAbs.startsWith(basePrefix) ? matchAbs.slice(basePrefix.length) : matchAbs;
      const matchRel = withoutBase.replace(/^\/+/, '');

      const matchChildrenResult = selected.matchDir.getChildren();
      if (matchChildrenResult.isSuccess()) {
        const matchChildren = matchChildrenResult.value;
        const dataDir = matchChildren.find(
          (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
            c.type === 'directory' && c.name === 'data'
        );

        const subLibrarySpecs: Array<{ id: SubLibraryType; folderName: string }> = [
          { id: 'ingredients', folderName: 'ingredients' },
          { id: 'fillings', folderName: 'fillings' },
          { id: 'journals', folderName: 'journals' },
          { id: 'molds', folderName: 'molds' },
          { id: 'procedures', folderName: 'procedures' },
          { id: 'tasks', folderName: 'tasks' },
          { id: 'confections', folderName: 'confections' }
        ];

        for (const spec of subLibrarySpecs) {
          let fileDir: FileTree.IFileTreeDirectoryItem | undefined;
          let fileDirRel = '';

          if (dataDir) {
            const dataChildrenResult = dataDir.getChildren();
            if (dataChildrenResult.isSuccess()) {
              const subDir = dataChildrenResult.value.find(
                (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
                  c.type === 'directory' && c.name === spec.folderName
              );
              if (subDir) {
                fileDir = subDir;
                fileDirRel = [matchRel, 'data', spec.folderName].filter((p) => p.length > 0).join('/');
              }
            }
          }

          if (!fileDir) {
            const subDir = matchChildren.find(
              (c: FileTree.FileTreeItem): c is FileTree.IFileTreeDirectoryItem =>
                c.type === 'directory' && c.name === spec.folderName
            );
            if (subDir) {
              fileDir = subDir;
              fileDirRel = [matchRel, spec.folderName].filter((p) => p.length > 0).join('/');
            }
          }

          if (!fileDir) continue;

          // Verify directory handle path
          void (await getDirectoryHandleAtPath(dirHandle, fileDirRel));

          const fileChildrenResult = fileDir.getChildren();
          if (fileChildrenResult.isFailure()) continue;

          for (const child of fileChildrenResult.value) {
            if (child.type !== 'file') continue;
            const name = child.name;
            const dot = name.lastIndexOf('.');
            const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
            if (ext !== 'json' && ext !== 'yaml' && ext !== 'yml') continue;
            const exportFormat: 'yaml' | 'json' = ext === 'yaml' || ext === 'yml' ? 'yaml' : 'json';
            const collectionId = dot >= 0 ? name.slice(0, dot) : name;
            if (collectionId.length === 0) continue;
            const relativePath = [fileDirRel, name].filter((p) => p.length > 0).join('/');
            fileBackedTargetsRef.current.set(getFileBackedTargetKey(spec.id, collectionId), {
              baseDir: dirHandle,
              relativePath,
              exportFormat
            });
          }
        }
      }
    } catch (e) {
      diag.warn(`Failed to record file-backed targets: ${e instanceof Error ? e.message : String(e)}`);
    }

    const nextSource: LibraryData.ILibraryFileTreeSource = {
      directory: selected.root,
      load: true,
      mutable: true
    };

    const nextExternal = [...getExternalSources(), nextSource];
    await setExternalSources(nextExternal);
    user.success(`Imported library from folder: ${dirHandle.name}`);
    return succeed(undefined);
  }, [getExternalSources, setExternalSources, diag, user]);

  const contextValue = useMemo(
    (): ILibraryImportContext => ({
      loadSubLibraryFromZip,
      loadSubLibraryFromFolder,
      loadLibraryFromZip,
      loadLibraryFromFolder,
      clearExternalSources,
      getFileBackedCollectionExportFormat,
      tryWriteFileBackedCollection
    }),
    [
      loadSubLibraryFromZip,
      loadSubLibraryFromFolder,
      loadLibraryFromZip,
      loadLibraryFromFolder,
      clearExternalSources,
      getFileBackedCollectionExportFormat,
      tryWriteFileBackedCollection
    ]
  );

  return <LibraryImportContext.Provider value={contextValue}>{children}</LibraryImportContext.Provider>;
}

/**
 * Hook to access the library import context
 */
export function useLibraryImport(): ILibraryImportContext {
  return useContext(LibraryImportContext);
}
