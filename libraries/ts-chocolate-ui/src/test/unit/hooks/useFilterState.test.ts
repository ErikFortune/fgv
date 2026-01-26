/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { renderHook, act } from '@testing-library/react';
import { useFilterState, createInitialFilterState, type IBaseFilterState } from '../../../packlets/hooks';

describe('createInitialFilterState', () => {
  test('returns empty filter state', () => {
    const state = createInitialFilterState();

    expect(state.search).toBe('');
    expect(state.collections).toEqual([]);
    expect(state.tags).toEqual([]);
  });
});

describe('useFilterState', () => {
  describe('initial state', () => {
    test('uses provided initial state', () => {
      const initial = createInitialFilterState();
      const { result } = renderHook(() => useFilterState(initial));

      expect(result.current.state).toEqual(initial);
    });

    test('preserves extended filter properties', () => {
      interface IExtendedFilters extends IBaseFilterState {
        category: string | null;
      }

      const initial: IExtendedFilters = {
        ...createInitialFilterState(),
        category: 'chocolate'
      };

      const { result } = renderHook(() => useFilterState(initial));

      expect(result.current.state.category).toBe('chocolate');
    });
  });

  describe('setSearch', () => {
    test('updates search value', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      act(() => {
        result.current.actions.setSearch('ganache');
      });

      expect(result.current.state.search).toBe('ganache');
    });

    test('preserves other filter values', () => {
      const initial: IBaseFilterState = {
        search: '',
        collections: ['coll-1'],
        tags: ['tag-1']
      };
      const { result } = renderHook(() => useFilterState(initial));

      act(() => {
        result.current.actions.setSearch('chocolate');
      });

      expect(result.current.state.collections).toEqual(['coll-1']);
      expect(result.current.state.tags).toEqual(['tag-1']);
    });
  });

  describe('toggleCollection', () => {
    test('adds collection when not present', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      act(() => {
        result.current.actions.toggleCollection('coll-1');
      });

      expect(result.current.state.collections).toEqual(['coll-1']);
    });

    test('removes collection when present', () => {
      const initial: IBaseFilterState = {
        search: '',
        collections: ['coll-1', 'coll-2'],
        tags: []
      };
      const { result } = renderHook(() => useFilterState(initial));

      act(() => {
        result.current.actions.toggleCollection('coll-1');
      });

      expect(result.current.state.collections).toEqual(['coll-2']);
    });

    test('preserves other filter values', () => {
      const initial: IBaseFilterState = {
        search: 'test',
        collections: [],
        tags: ['tag-1']
      };
      const { result } = renderHook(() => useFilterState(initial));

      act(() => {
        result.current.actions.toggleCollection('coll-1');
      });

      expect(result.current.state.search).toBe('test');
      expect(result.current.state.tags).toEqual(['tag-1']);
    });
  });

  describe('toggleTag', () => {
    test('adds tag when not present', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      act(() => {
        result.current.actions.toggleTag('dark');
      });

      expect(result.current.state.tags).toEqual(['dark']);
    });

    test('removes tag when present', () => {
      const initial: IBaseFilterState = {
        search: '',
        collections: [],
        tags: ['dark', 'milk']
      };
      const { result } = renderHook(() => useFilterState(initial));

      act(() => {
        result.current.actions.toggleTag('dark');
      });

      expect(result.current.state.tags).toEqual(['milk']);
    });

    test('preserves other filter values', () => {
      const initial: IBaseFilterState = {
        search: 'test',
        collections: ['coll-1'],
        tags: []
      };
      const { result } = renderHook(() => useFilterState(initial));

      act(() => {
        result.current.actions.toggleTag('tag-1');
      });

      expect(result.current.state.search).toBe('test');
      expect(result.current.state.collections).toEqual(['coll-1']);
    });
  });

  describe('clearFilters', () => {
    test('resets to initial state', () => {
      const initial = createInitialFilterState();
      const { result } = renderHook(() => useFilterState(initial));

      act(() => {
        result.current.actions.setSearch('test');
        result.current.actions.toggleCollection('coll-1');
        result.current.actions.toggleTag('tag-1');
      });

      act(() => {
        result.current.actions.clearFilters();
      });

      expect(result.current.state).toEqual(initial);
    });

    test('restores extended filter properties', () => {
      interface IExtendedFilters extends IBaseFilterState {
        category: string | null;
      }

      const initial: IExtendedFilters = {
        ...createInitialFilterState(),
        category: 'chocolate'
      };

      const { result } = renderHook(() => useFilterState(initial));

      act(() => {
        result.current.actions.setSearch('test');
      });
      act(() => {
        result.current.actions.clearFilters();
      });

      expect(result.current.state.category).toBe('chocolate');
    });
  });

  describe('setFilters', () => {
    test('replaces all filter values', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      const newFilters: IBaseFilterState = {
        search: 'ganache',
        collections: ['coll-1', 'coll-2'],
        tags: ['dark', 'milk']
      };

      act(() => {
        result.current.actions.setFilters(newFilters);
      });

      expect(result.current.state).toEqual(newFilters);
    });
  });

  describe('hasActiveFilters', () => {
    test('is false when no filters active', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      expect(result.current.actions.hasActiveFilters).toBe(false);
    });

    test('is true when search has value', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      act(() => {
        result.current.actions.setSearch('test');
      });

      expect(result.current.actions.hasActiveFilters).toBe(true);
    });

    test('is true when collections selected', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      act(() => {
        result.current.actions.toggleCollection('coll-1');
      });

      expect(result.current.actions.hasActiveFilters).toBe(true);
    });

    test('is true when tags selected', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      act(() => {
        result.current.actions.toggleTag('tag-1');
      });

      expect(result.current.actions.hasActiveFilters).toBe(true);
    });

    test('updates when filters change', () => {
      const { result } = renderHook(() => useFilterState(createInitialFilterState()));

      expect(result.current.actions.hasActiveFilters).toBe(false);

      act(() => {
        result.current.actions.setSearch('test');
      });
      expect(result.current.actions.hasActiveFilters).toBe(true);

      act(() => {
        result.current.actions.clearFilters();
      });
      expect(result.current.actions.hasActiveFilters).toBe(false);
    });
  });

  describe('action stability', () => {
    test('action functions maintain referential identity', () => {
      const { result, rerender } = renderHook(() => useFilterState(createInitialFilterState()));

      const initial = result.current.actions;
      rerender();

      expect(result.current.actions.setSearch).toBe(initial.setSearch);
      expect(result.current.actions.toggleCollection).toBe(initial.toggleCollection);
      expect(result.current.actions.toggleTag).toBe(initial.toggleTag);
      expect(result.current.actions.setFilters).toBe(initial.setFilters);
    });
  });
});
