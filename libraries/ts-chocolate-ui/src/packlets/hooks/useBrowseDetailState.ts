/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useState } from 'react';

/**
 * State for browse/detail navigation
 * @public
 */
export interface IBrowseDetailState<TId extends string> {
  /**
   * Current view mode - 'browse' shows list, 'detail' shows single item
   */
  viewMode: 'browse' | 'detail';
  /**
   * Currently selected item ID, or null if none selected
   */
  selectedId: TId | null;
}

/**
 * Actions for browse/detail navigation
 * @public
 */
export interface IBrowseDetailActions<TId extends string> {
  /**
   * Select an item and switch to detail view
   */
  select: (id: TId) => void;
  /**
   * Go back to browse view (keeps selectedId for highlight)
   */
  back: () => void;
  /**
   * Reset to initial state (browse view, no selection)
   */
  reset: () => void;
}

/**
 * Return type for useBrowseDetailState hook
 * @public
 */
export interface IUseBrowseDetailStateResult<TId extends string> {
  state: IBrowseDetailState<TId>;
  actions: IBrowseDetailActions<TId>;
}

/**
 * Hook for managing browse/detail view state.
 *
 * Provides a consistent pattern for tools that have a list view (browse)
 * and a detail view for individual items.
 *
 * @example
 * ```tsx
 * function MyTool() {
 *   const { state, actions } = useBrowseDetailState<ItemId>();
 *
 *   if (state.viewMode === 'detail' && state.selectedId) {
 *     return <DetailView id={state.selectedId} onBack={actions.back} />;
 *   }
 *   return <BrowseView onSelect={actions.select} />;
 * }
 * ```
 *
 * @returns Object containing state and actions for browse/detail navigation
 * @public
 */
export function useBrowseDetailState<TId extends string>(): IUseBrowseDetailStateResult<TId> {
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');
  const [selectedId, setSelectedId] = useState<TId | null>(null);

  const select = useCallback((id: TId): void => {
    setSelectedId(id);
    setViewMode('detail');
  }, []);

  const back = useCallback((): void => {
    setViewMode('browse');
  }, []);

  const reset = useCallback((): void => {
    setViewMode('browse');
    setSelectedId(null);
  }, []);

  return {
    state: { viewMode, selectedId },
    actions: { select, back, reset }
  };
}
