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
import type { IWorkspace } from '@fgv/ts-chocolate';

// ============================================================================
// ReactiveWorkspace
// ============================================================================

/**
 * Listener callback type for workspace change subscriptions.
 * @public
 */
export type WorkspaceListener = () => void;

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

export class ReactiveWorkspace {
  private readonly _workspace: IWorkspace;
  private readonly _listeners: Set<WorkspaceListener> = new Set();
  private _version: number = 0;
  private readonly _persistentTrees: Map<string, IPersistentTreeEntry> = new Map();

  public constructor(workspace: IWorkspace) {
    this._workspace = workspace;
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
