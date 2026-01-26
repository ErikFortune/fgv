/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { renderHook, act } from '@testing-library/react';
import { useBrowseDetailState } from '../../../packlets/hooks';

describe('useBrowseDetailState', () => {
  describe('initial state', () => {
    test('starts in browse mode with no selection', () => {
      const { result } = renderHook(() => useBrowseDetailState<string>());

      expect(result.current.state.viewMode).toBe('browse');
      expect(result.current.state.selectedId).toBeNull();
    });
  });

  describe('select action', () => {
    test('switches to detail view and sets selectedId', () => {
      const { result } = renderHook(() => useBrowseDetailState<string>());

      act(() => {
        result.current.actions.select('item-1');
      });

      expect(result.current.state.viewMode).toBe('detail');
      expect(result.current.state.selectedId).toBe('item-1');
    });

    test('updates selectedId when already in detail view', () => {
      const { result } = renderHook(() => useBrowseDetailState<string>());

      act(() => {
        result.current.actions.select('item-1');
      });
      act(() => {
        result.current.actions.select('item-2');
      });

      expect(result.current.state.viewMode).toBe('detail');
      expect(result.current.state.selectedId).toBe('item-2');
    });
  });

  describe('back action', () => {
    test('switches to browse mode while keeping selectedId', () => {
      const { result } = renderHook(() => useBrowseDetailState<string>());

      act(() => {
        result.current.actions.select('item-1');
      });
      act(() => {
        result.current.actions.back();
      });

      expect(result.current.state.viewMode).toBe('browse');
      expect(result.current.state.selectedId).toBe('item-1');
    });

    test('is safe to call from browse mode', () => {
      const { result } = renderHook(() => useBrowseDetailState<string>());

      act(() => {
        result.current.actions.back();
      });

      expect(result.current.state.viewMode).toBe('browse');
      expect(result.current.state.selectedId).toBeNull();
    });
  });

  describe('reset action', () => {
    test('clears selectedId and returns to browse mode', () => {
      const { result } = renderHook(() => useBrowseDetailState<string>());

      act(() => {
        result.current.actions.select('item-1');
      });
      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.state.viewMode).toBe('browse');
      expect(result.current.state.selectedId).toBeNull();
    });

    test('is idempotent from initial state', () => {
      const { result } = renderHook(() => useBrowseDetailState<string>());

      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.state.viewMode).toBe('browse');
      expect(result.current.state.selectedId).toBeNull();
    });
  });

  describe('action stability', () => {
    test('actions maintain referential identity across renders', () => {
      const { result, rerender } = renderHook(() => useBrowseDetailState<string>());

      const initialSelect = result.current.actions.select;
      const initialBack = result.current.actions.back;
      const initialReset = result.current.actions.reset;

      rerender();

      expect(result.current.actions.select).toBe(initialSelect);
      expect(result.current.actions.back).toBe(initialBack);
      expect(result.current.actions.reset).toBe(initialReset);
    });
  });

  describe('type safety', () => {
    test('works with branded string types', () => {
      type TestId = string & { readonly __brand: 'TestId' };

      const { result } = renderHook(() => useBrowseDetailState<TestId>());

      act(() => {
        result.current.actions.select('test-id' as TestId);
      });

      expect(result.current.state.selectedId).toBe('test-id');
    });
  });
});
