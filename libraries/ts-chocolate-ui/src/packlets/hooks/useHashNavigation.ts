/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Options for useHashNavigation hook
 * @public
 */
export interface IHashNavigationOptions {
  /**
   * Prefix for the hash URL (e.g., 'confections' for \#confections/id)
   */
  prefix: string;
}

/**
 * Return type for useHashNavigation hook
 * @public
 */
export interface IUseHashNavigationResult<TId extends string> {
  /**
   * Currently selected ID from hash, or null if none
   */
  currentId: TId | null;
  /**
   * Update the hash with a new ID (or clear it with null)
   */
  setId: (id: TId | null) => void;
}

/**
 * Hook for syncing navigation state with URL hash.
 *
 * Enables deep linking to specific items via hash URLs like #confections/my-item.
 * Listens for hash changes and updates state accordingly.
 *
 * @example
 * ```tsx
 * function MyTool() {
 *   const { currentId, setId } = useHashNavigation<ItemId>({ prefix: 'items' });
 *   const { state, actions } = useBrowseDetailState<ItemId>();
 *
 *   // Sync hash to browse/detail state
 *   useEffect(() => {
 *     if (currentId) {
 *       actions.select(currentId);
 *     }
 *   }, [currentId, actions]);
 *
 *   // Update hash when selecting
 *   const handleSelect = (id: ItemId) => {
 *     setId(id);
 *     actions.select(id);
 *   };
 *
 *   return <BrowseView onSelect={handleSelect} />;
 * }
 * ```
 *
 * @param options - Configuration including the hash prefix
 * @returns Object with currentId and setId function
 * @public
 */
export function useHashNavigation<TId extends string>(
  options: IHashNavigationOptions
): IUseHashNavigationResult<TId> {
  const { prefix } = options;
  const hashPrefix = `#${prefix}/`;

  const parseHash = useCallback((): TId | null => {
    const hash = window.location.hash;
    if (!hash.startsWith(hashPrefix)) {
      return null;
    }
    const rawId = hash.slice(hashPrefix.length);
    if (rawId.length === 0) {
      return null;
    }
    return rawId as TId;
  }, [hashPrefix]);

  const [currentId, setCurrentId] = useState<TId | null>(() => parseHash());

  useEffect(() => {
    const handleHashChange = (): void => {
      setCurrentId(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [parseHash]);

  const setId = useCallback(
    (id: TId | null): void => {
      if (id === null) {
        // Clear hash without causing a hashchange event loop
        if (window.location.hash.startsWith(hashPrefix)) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        window.location.hash = `${prefix}/${id}`;
      }
      setCurrentId(id);
    },
    [prefix, hashPrefix]
  );

  return { currentId, setId };
}
