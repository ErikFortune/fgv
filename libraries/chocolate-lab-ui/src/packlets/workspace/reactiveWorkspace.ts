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
 * ReactiveWorkspace — wraps an IWorkspace and emits coarse-grained events
 * so React components can subscribe via useSyncExternalStore.
 *
 * Start coarse (single version counter) and refine to per-entity-type
 * events later if profiling shows unnecessary re-renders.
 *
 * @packageDocumentation
 */

import { type Result, succeed, fail } from '@fgv/ts-utils';
import { type FileTree } from '@fgv/ts-json-base';
import type { ISettingsValidationWarning, IWorkspace } from '@fgv/ts-chocolate';

// ============================================================================
// ReactiveWorkspace
// ============================================================================

/**
 * Listener callback type for workspace change subscriptions.
 * @public
 */
export type WorkspaceListener = () => void;

/**
 * A registered persistent file tree with its accessors.
 * @public
 */
export interface IPersistentTreeEntry {
  /** The FileTree instance */
  readonly tree: FileTree.FileTree;
  /** The persistent accessors (for syncToDisk, isDirty, etc.) */
  readonly accessors: FileTree.IPersistentFileTreeAccessors;
  /** Label for display (e.g., directory name) */
  readonly label: string;
}

/**
 * Categories of data that a storage root holds or can hold.
 * @public
 */
export type StorageCategory = 'library' | 'user-data' | 'settings';

/**
 * Summary of a single active storage root.
 * @public
 */
export interface IStorageRootSummary {
  /** Unique identifier for this storage root */
  readonly id: string;
  /** Human-readable label */
  readonly label: string;
  /** The sourceName stamped on collections loaded from this root (matches ICollectionRuntimeMetadata.sourceName) */
  readonly sourceName: string;
  /** Whether this is the built-in embedded library */
  readonly isBuiltIn: boolean;
  /** Whether this storage root is mutable (user can write to it) */
  readonly isMutable: boolean;
  /** Whether this is a local directory opened via the File System Access API */
  readonly isLocal: boolean;
  /** Categories of data held or manageable in this root */
  readonly categories: ReadonlyArray<StorageCategory>;
}

/**
 * Summary of all active storage roots in the workspace.
 * Used by the UI to display storage status.
 * @public
 */
export interface IStorageSummary {
  /** All active storage roots, in display order (built-in first, then local) */
  readonly roots: ReadonlyArray<IStorageRootSummary>;
  /** Whether the built-in library is currently loaded */
  readonly hasBuiltIn: boolean;
  /** Number of local directories currently open */
  readonly localDirectoryCount: number;
}

/**
 * A reactive wrapper around IWorkspace that provides a subscription model
 * compatible with React's useSyncExternalStore.
 *
 * Maintains a monotonically increasing version counter that is bumped
 * whenever the workspace data changes. React components subscribe to
 * the version and re-render when it changes.
 *
 * @public
 */
export class ReactiveWorkspace {
  private readonly _workspace: IWorkspace;
  private readonly _listeners: Set<WorkspaceListener> = new Set();
  private _version: number = 0;
  private readonly _persistentTrees: Map<string, IPersistentTreeEntry> = new Map();
  private _builtInLoaded: boolean = false;
  private _localStorageLabel: string | undefined = undefined;
  private _localStorageRootDir: FileTree.IFileTreeDirectoryItem | undefined = undefined;
  private _mitigatedRoots: ReadonlySet<string> = new Set();
  private _validationWarnings: ReadonlyArray<ISettingsValidationWarning> = [];
  private _masterPassword: string | undefined = undefined;

  public constructor(workspace: IWorkspace, builtInLoaded: boolean = false) {
    this._workspace = workspace;
    this._builtInLoaded = builtInLoaded;
  }

  // ============================================================================
  // Workspace Access
  // ============================================================================

  /**
   * The underlying workspace instance.
   */
  public get workspace(): IWorkspace {
    return this._workspace;
  }

  /**
   * Current version counter. Incremented on every notifyChange().
   * Used as the snapshot for useSyncExternalStore.
   */
  public get version(): number {
    return this._version;
  }

  /**
   * Whether the built-in embedded library is currently loaded.
   */
  public get builtInLoaded(): boolean {
    return this._builtInLoaded;
  }

  /**
   * The set of storage root IDs currently in mitigated state.
   * Writes targeting these roots are blocked to prevent data loss.
   */
  public get mitigatedRoots(): ReadonlySet<string> {
    return this._mitigatedRoots;
  }

  /**
   * Whether any storage roots are in mitigated state.
   */
  public get isMitigated(): boolean {
    return this._mitigatedRoots.size > 0;
  }

  /**
   * The validation warnings from the most recent settings validation.
   */
  public get validationWarnings(): ReadonlyArray<ISettingsValidationWarning> {
    return this._validationWarnings;
  }

  /**
   * Records validation warnings and marks affected roots as mitigated.
   * Call this after post-construction validation when using 'proceed mitigated' recovery.
   * @param warnings - The validation warnings to record
   */
  public applyMitigation(warnings: ReadonlyArray<ISettingsValidationWarning>): void {
    this._validationWarnings = warnings;
    const mitigated = new Set<string>();
    for (const warning of warnings) {
      if (warning.kind === 'missing-root') {
        mitigated.add(warning.rootId);
      }
    }
    this._mitigatedRoots = mitigated;
  }

  /**
   * Clears all mitigated state and validation warnings.
   * Call this when the user resolves the mitigation (e.g., reconnects a drive).
   */
  public clearMitigation(): void {
    this._mitigatedRoots = new Set();
    this._validationWarnings = [];
  }

  /**
   * Checks whether a write to the given storage root is blocked due to mitigation.
   * @param rootId - The storage root ID to check
   * @returns Failure with a descriptive message if blocked, Success otherwise
   */
  public checkWriteAllowed(rootId: string): Result<void> {
    if (this._mitigatedRoots.has(rootId)) {
      return fail(
        `Write to '${rootId}' is blocked: this storage root is unavailable (mitigated state). ` +
          `Reconnect the storage root or reset the configuration to resume writes.`
      );
    }
    return succeed(undefined);
  }

  /**
   * Sets the built-in loaded flag. Does not notify subscribers.
   * Call notifyChange() after updating if UI should re-render.
   */
  public setBuiltInLoaded(loaded: boolean): void {
    this._builtInLoaded = loaded;
  }

  /**
   * Registers the localStorage root as a named storage root for display.
   * Does not notify subscribers — call notifyChange() if needed.
   */
  public registerLocalStorageRoot(label: string, rootDir?: FileTree.IFileTreeDirectoryItem): void {
    this._localStorageLabel = label;
    this._localStorageRootDir = rootDir;
  }

  /**
   * The localStorage root directory item, if registered.
   */
  public get localStorageRootDir(): FileTree.IFileTreeDirectoryItem | undefined {
    return this._localStorageRootDir;
  }

  /**
   * The retained master password for keystore operations.
   * Set during unlock/initialize, cleared on lock.
   */
  public get masterPassword(): string | undefined {
    return this._masterPassword;
  }

  public set masterPassword(value: string | undefined) {
    this._masterPassword = value;
  }

  /**
   * A summary of all active storage roots for UI display.
   * Built-in root (if loaded) appears first, followed by local directories.
   */
  public get storageSummary(): IStorageSummary {
    const roots: IStorageRootSummary[] = [];

    if (this._builtInLoaded) {
      roots.push({
        id: 'builtin',
        label: 'Built-in Library',
        sourceName: 'builtin',
        isBuiltIn: true,
        isMutable: false,
        isLocal: false,
        categories: ['library']
      });
    }

    if (this._localStorageLabel !== undefined) {
      roots.push({
        id: 'localStorage',
        label: this._localStorageLabel,
        sourceName: 'localStorage',
        isBuiltIn: false,
        isMutable: true,
        isLocal: false,
        categories: ['library', 'user-data', 'settings']
      });
    }

    for (const [id, entry] of this._persistentTrees) {
      roots.push({
        id,
        label: entry.label,
        sourceName: id,
        isBuiltIn: false,
        isMutable: true,
        isLocal: true,
        categories: ['library']
      });
    }

    return {
      roots,
      hasBuiltIn: this._builtInLoaded,
      localDirectoryCount: this._persistentTrees.size
    };
  }

  // ============================================================================
  // Subscription (useSyncExternalStore compatible)
  // ============================================================================

  /**
   * Subscribe to workspace changes.
   * Returns an unsubscribe function.
   *
   * Designed to be passed directly to useSyncExternalStore's subscribe parameter.
   */
  public subscribe = (listener: WorkspaceListener): (() => void) => {
    this._listeners.add(listener);
    return (): void => {
      this._listeners.delete(listener);
    };
  };

  /**
   * Get the current snapshot (version counter).
   *
   * Designed to be passed directly to useSyncExternalStore's getSnapshot parameter.
   */
  public getSnapshot = (): number => {
    return this._version;
  };

  // ============================================================================
  // Change Notification
  // ============================================================================

  /**
   * Notify all subscribers that the workspace data has changed.
   * Call this after any mutation to the underlying workspace.
   */
  public notifyChange(): void {
    this._version++;
    for (const listener of this._listeners) {
      listener();
    }
  }

  // ============================================================================
  // Persistent Tree Registry
  // ============================================================================

  /**
   * Register a persistent FileTree for dirty tracking and save-in-place.
   * @param id - Unique identifier for this tree (e.g., directory handle name)
   * @param entry - The tree entry with accessors and label
   */
  public registerPersistentTree(id: string, entry: IPersistentTreeEntry): void {
    this._persistentTrees.set(id, entry);
  }

  /**
   * Unregister a persistent FileTree by id.
   * @param id - The id previously passed to registerPersistentTree
   */
  public unregisterPersistentTree(id: string): void {
    this._persistentTrees.delete(id);
  }

  /**
   * Get all registered persistent trees.
   */
  public get persistentTrees(): ReadonlyMap<string, IPersistentTreeEntry> {
    return this._persistentTrees;
  }

  /**
   * Whether any registered persistent tree has unsaved changes.
   */
  public get hasDirtyTrees(): boolean {
    for (const entry of this._persistentTrees.values()) {
      if (entry.accessors.isDirty()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sync all dirty persistent trees to disk.
   * @returns Success if all syncs succeeded, Failure with aggregated errors otherwise.
   */
  public async syncAllToDisk(): Promise<Result<void>> {
    const errors: string[] = [];
    for (const [id, entry] of this._persistentTrees) {
      if (entry.accessors.isDirty()) {
        const result = await entry.accessors.syncToDisk();
        if (result.isFailure()) {
          errors.push(`${id}: ${result.message}`);
        }
      }
    }
    if (errors.length > 0) {
      return fail(`Failed to sync ${errors.length} tree(s):\n${errors.join('\n')}`);
    }
    return succeed(undefined);
  }
}
