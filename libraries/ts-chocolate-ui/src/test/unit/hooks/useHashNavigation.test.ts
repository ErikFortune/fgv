/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useHashNavigation } from '../../../packlets/hooks';

describe('useHashNavigation', () => {
  beforeEach(() => {
    // Reset hash before each test
    window.location.hash = '';
  });

  afterEach(() => {
    // Clean up hash after each test
    window.location.hash = '';
  });

  describe('initial state', () => {
    test('returns null when hash is empty', () => {
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      expect(result.current.currentId).toBeNull();
    });

    test('returns null when hash does not match prefix', () => {
      window.location.hash = '#other/item-1';
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      expect(result.current.currentId).toBeNull();
    });

    test('parses ID from matching hash', () => {
      window.location.hash = '#items/item-1';
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      expect(result.current.currentId).toBe('item-1');
    });

    test('returns null when hash prefix matches but no ID', () => {
      window.location.hash = '#items/';
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      expect(result.current.currentId).toBeNull();
    });
  });

  describe('setId', () => {
    test('updates hash with ID', () => {
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      act(() => {
        result.current.setId('item-2');
      });

      expect(window.location.hash).toBe('#items/item-2');
      expect(result.current.currentId).toBe('item-2');
    });

    test('clears hash when setting null', () => {
      window.location.hash = '#items/item-1';
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      act(() => {
        result.current.setId(null);
      });

      expect(window.location.hash).toBe('');
      expect(result.current.currentId).toBeNull();
    });

    test('does not clear hash for different prefix', () => {
      window.location.hash = '#other/item-1';
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      act(() => {
        result.current.setId(null);
      });

      expect(window.location.hash).toBe('#other/item-1');
    });

    test('handles IDs with special characters', () => {
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      act(() => {
        result.current.setId('item-with-dash_underscore');
      });

      expect(result.current.currentId).toBe('item-with-dash_underscore');
    });
  });

  describe('hash change events', () => {
    test('updates currentId when hash changes externally', async () => {
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      expect(result.current.currentId).toBeNull();

      // Simulate external hash change
      act(() => {
        window.location.hash = '#items/item-3';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.currentId).toBe('item-3');
      });
    });

    test('clears currentId when hash is cleared externally', async () => {
      window.location.hash = '#items/item-1';
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      expect(result.current.currentId).toBe('item-1');

      act(() => {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.currentId).toBeNull();
      });
    });

    test('ignores hash changes for different prefix', async () => {
      const { result } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      act(() => {
        window.location.hash = '#other/item-1';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.currentId).toBeNull();
      });
    });
  });

  describe('cleanup', () => {
    test('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('different prefixes', () => {
    test('works with various prefix values', () => {
      const prefixes = ['confections', 'ingredients', 'fillings', 'molds', 'tasks', 'procedures'];

      for (const prefix of prefixes) {
        window.location.hash = `#${prefix}/test-id`;
        const { result, unmount } = renderHook(() => useHashNavigation<string>({ prefix }));

        expect(result.current.currentId).toBe('test-id');
        unmount();
      }
    });
  });

  describe('setId stability', () => {
    test('setId maintains referential identity across renders', () => {
      const { result, rerender } = renderHook(() => useHashNavigation<string>({ prefix: 'items' }));

      const initialSetId = result.current.setId;
      rerender();

      expect(result.current.setId).toBe(initialSetId);
    });
  });

  describe('type safety', () => {
    test('works with branded string types', () => {
      type ItemId = string & { readonly __brand: 'ItemId' };

      window.location.hash = '#items/branded-id';
      const { result } = renderHook(() => useHashNavigation<ItemId>({ prefix: 'items' }));

      expect(result.current.currentId).toBe('branded-id');

      act(() => {
        result.current.setId('new-branded' as ItemId);
      });

      expect(result.current.currentId).toBe('new-branded');
    });
  });
});
