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
 * React context and hook for accessing the ReactiveWorkspace.
 *
 * Components use `useWorkspace()` to get the underlying IWorkspace.
 * The hook subscribes to the ReactiveWorkspace's version counter
 * via useSyncExternalStore, so components re-render when the
 * workspace data changes.
 *
 * @packageDocumentation
 */

import React, { createContext, useContext, useSyncExternalStore } from 'react';

import type { IWorkspace } from '@fgv/ts-chocolate';

import { ReactiveWorkspace } from './reactiveWorkspace';

// ============================================================================
// Context
// ============================================================================

const WorkspaceContext: React.Context<ReactiveWorkspace | undefined> = createContext<
  ReactiveWorkspace | undefined
>(undefined);

// ============================================================================
// Provider
// ============================================================================

/**
 * Props for the WorkspaceProvider component.
 * @public
 */
export interface IWorkspaceProviderProps {
  /** The ReactiveWorkspace instance to provide */
  readonly reactiveWorkspace: ReactiveWorkspace;
  /** Child components */
  readonly children: React.ReactNode;
}

/**
 * Provides the ReactiveWorkspace to the component tree.
 * @public
 */
export function WorkspaceProvider(props: IWorkspaceProviderProps): React.ReactElement {
  const { reactiveWorkspace, children } = props;
  return <WorkspaceContext.Provider value={reactiveWorkspace}>{children}</WorkspaceContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Returns the underlying IWorkspace from the nearest WorkspaceProvider.
 *
 * Subscribes to the ReactiveWorkspace's version counter so the calling
 * component re-renders whenever workspace data changes.
 *
 * @throws Error if called outside a WorkspaceProvider.
 * @public
 */
export function useWorkspace(): IWorkspace {
  const reactive = useContext(WorkspaceContext);
  if (!reactive) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }

  // Subscribe to version changes — the snapshot value itself is unused,
  // but useSyncExternalStore will trigger a re-render when it changes.
  useSyncExternalStore(reactive.subscribe, reactive.getSnapshot);

  return reactive.workspace;
}

/**
 * Returns the ReactiveWorkspace instance for advanced use cases
 * (e.g., calling notifyChange after mutations).
 *
 * @throws Error if called outside a WorkspaceProvider.
 * @public
 */
export function useReactiveWorkspace(): ReactiveWorkspace {
  const reactive = useContext(WorkspaceContext);
  if (!reactive) {
    throw new Error('useReactiveWorkspace must be used within a WorkspaceProvider');
  }
  return reactive;
}
