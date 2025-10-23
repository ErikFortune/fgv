/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
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

import { renderHook, act } from '@testing-library/react';
import { useCombinationElimination } from '../../../hooks/useCombinationElimination';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('useCombinationElimination', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
  });

  describe('initialization', () => {
    test('should initialize with empty set when no storage exists', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      expect(result.current.eliminatedSignatures).toBeInstanceOf(Set);
      expect(result.current.eliminatedSignatures.size).toBe(0);
      expect(typeof result.current.toggleElimination).toBe('function');
      expect(typeof result.current.clearAll).toBe('function');
    });

    test('should initialize with empty set when puzzleId is undefined', () => {
      const { result } = renderHook(() => useCombinationElimination(undefined, 'cage-1'));

      expect(result.current.eliminatedSignatures.size).toBe(0);
    });

    test('should initialize with empty set when cageId is undefined', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', undefined));

      expect(result.current.eliminatedSignatures.size).toBe(0);
    });

    test('should load from session storage when available', () => {
      const key = 'killer-combinations-puzzle-1-cage-1';
      const stored = ['1,2', '3,4', '5,6'];
      mockSessionStorage.setItem(key, JSON.stringify(stored));

      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      expect(result.current.eliminatedSignatures.size).toBe(3);
      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);
      expect(result.current.eliminatedSignatures.has('3,4')).toBe(true);
      expect(result.current.eliminatedSignatures.has('5,6')).toBe(true);
    });

    test('should handle corrupted session storage gracefully', () => {
      const key = 'killer-combinations-puzzle-1-cage-1';
      mockSessionStorage.setItem(key, 'invalid-json{');

      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      expect(result.current.eliminatedSignatures.size).toBe(0);
    });
  });

  describe('toggleElimination', () => {
    test('should add signature when not present', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
      });

      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);
      expect(result.current.eliminatedSignatures.size).toBe(1);
    });

    test('should remove signature when already present', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
      });

      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);

      act(() => {
        result.current.toggleElimination('1,2');
      });

      expect(result.current.eliminatedSignatures.has('1,2')).toBe(false);
      expect(result.current.eliminatedSignatures.size).toBe(0);
    });

    test('should toggle multiple signatures independently', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
        result.current.toggleElimination('3,4');
        result.current.toggleElimination('5,6');
      });

      expect(result.current.eliminatedSignatures.size).toBe(3);
      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);
      expect(result.current.eliminatedSignatures.has('3,4')).toBe(true);
      expect(result.current.eliminatedSignatures.has('5,6')).toBe(true);

      act(() => {
        result.current.toggleElimination('3,4');
      });

      expect(result.current.eliminatedSignatures.size).toBe(2);
      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);
      expect(result.current.eliminatedSignatures.has('3,4')).toBe(false);
      expect(result.current.eliminatedSignatures.has('5,6')).toBe(true);
    });

    test('should persist to session storage when toggling', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
        result.current.toggleElimination('3,4');
      });

      const key = 'killer-combinations-puzzle-1-cage-1';
      const stored = JSON.parse(mockSessionStorage.getItem(key) || '[]') as string[];

      expect(stored).toContain('1,2');
      expect(stored).toContain('3,4');
      expect(stored).toHaveLength(2);
    });

    test('should update session storage when toggling off', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
        result.current.toggleElimination('3,4');
      });

      act(() => {
        result.current.toggleElimination('1,2');
      });

      const key = 'killer-combinations-puzzle-1-cage-1';
      const stored = JSON.parse(mockSessionStorage.getItem(key) || '[]') as string[];

      expect(stored).not.toContain('1,2');
      expect(stored).toContain('3,4');
      expect(stored).toHaveLength(1);
    });

    test('should not persist when puzzleId is undefined', () => {
      const { result } = renderHook(() => useCombinationElimination(undefined, 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
      });

      const key = 'killer-combinations-undefined-cage-1';
      expect(mockSessionStorage.getItem(key)).toBeNull();
    });

    test('should not persist when cageId is undefined', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', undefined));

      act(() => {
        result.current.toggleElimination('1,2');
      });

      const key = 'killer-combinations-puzzle-1-undefined';
      expect(mockSessionStorage.getItem(key)).toBeNull();
    });

    test('should handle session storage errors gracefully', () => {
      // Mock setItem to throw
      const originalSetItem = mockSessionStorage.setItem;
      mockSessionStorage.setItem = (): void => {
        throw new Error('Storage quota exceeded');
      };

      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      // Should not throw
      expect(() => {
        act(() => {
          result.current.toggleElimination('1,2');
        });
      }).not.toThrow();

      // State should still update
      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);

      // Restore original
      mockSessionStorage.setItem = originalSetItem;
    });
  });

  describe('clearAll', () => {
    test('should clear all eliminated signatures', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
        result.current.toggleElimination('3,4');
        result.current.toggleElimination('5,6');
      });

      expect(result.current.eliminatedSignatures.size).toBe(3);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.eliminatedSignatures.size).toBe(0);
    });

    test('should remove from session storage when clearing', () => {
      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      act(() => {
        result.current.toggleElimination('1,2');
        result.current.toggleElimination('3,4');
      });

      const key = 'killer-combinations-puzzle-1-cage-1';
      expect(mockSessionStorage.getItem(key)).toBeTruthy();

      act(() => {
        result.current.clearAll();
      });

      expect(mockSessionStorage.getItem(key)).toBeNull();
    });

    test('should not throw when clearing with undefined puzzleId', () => {
      const { result } = renderHook(() => useCombinationElimination(undefined, 'cage-1'));

      expect(() => {
        act(() => {
          result.current.clearAll();
        });
      }).not.toThrow();
    });

    test('should handle session storage errors when clearing', () => {
      // Mock removeItem to throw
      const originalRemoveItem = mockSessionStorage.removeItem;
      mockSessionStorage.removeItem = (): void => {
        throw new Error('Storage error');
      };

      const { result } = renderHook(() => useCombinationElimination('puzzle-1', 'cage-1'));

      // Should not throw
      expect(() => {
        act(() => {
          result.current.clearAll();
        });
      }).not.toThrow();

      // Restore original
      mockSessionStorage.removeItem = originalRemoveItem;
    });
  });

  describe('updates on prop changes', () => {
    test('should reload from storage when puzzleId changes', () => {
      mockSessionStorage.setItem('killer-combinations-puzzle-1-cage-1', JSON.stringify(['1,2', '3,4']));
      mockSessionStorage.setItem('killer-combinations-puzzle-2-cage-1', JSON.stringify(['5,6', '7,8']));

      const { result, rerender } = renderHook(
        ({ puzzleId, cageId }) => useCombinationElimination(puzzleId, cageId),
        { initialProps: { puzzleId: 'puzzle-1', cageId: 'cage-1' } }
      );

      expect(result.current.eliminatedSignatures.size).toBe(2);
      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);

      rerender({ puzzleId: 'puzzle-2', cageId: 'cage-1' });

      expect(result.current.eliminatedSignatures.size).toBe(2);
      expect(result.current.eliminatedSignatures.has('5,6')).toBe(true);
      expect(result.current.eliminatedSignatures.has('1,2')).toBe(false);
    });

    test('should reload from storage when cageId changes', () => {
      mockSessionStorage.setItem('killer-combinations-puzzle-1-cage-1', JSON.stringify(['1,2']));
      mockSessionStorage.setItem('killer-combinations-puzzle-1-cage-2', JSON.stringify(['3,4']));

      const { result, rerender } = renderHook(
        ({ puzzleId, cageId }) => useCombinationElimination(puzzleId, cageId),
        { initialProps: { puzzleId: 'puzzle-1', cageId: 'cage-1' } }
      );

      expect(result.current.eliminatedSignatures.has('1,2')).toBe(true);

      rerender({ puzzleId: 'puzzle-1', cageId: 'cage-2' });

      expect(result.current.eliminatedSignatures.has('3,4')).toBe(true);
      expect(result.current.eliminatedSignatures.has('1,2')).toBe(false);
    });

    test('should clear when puzzleId becomes undefined', () => {
      const { result, rerender } = renderHook(
        ({ puzzleId, cageId }: { puzzleId: string | undefined; cageId: string | undefined }) =>
          useCombinationElimination(puzzleId, cageId),
        {
          initialProps: { puzzleId: 'puzzle-1' as string | undefined, cageId: 'cage-1' as string | undefined }
        }
      );

      act(() => {
        result.current.toggleElimination('1,2');
      });

      expect(result.current.eliminatedSignatures.size).toBe(1);

      rerender({ puzzleId: undefined, cageId: 'cage-1' });

      expect(result.current.eliminatedSignatures.size).toBe(0);
    });

    test('should clear when cageId becomes undefined', () => {
      const { result, rerender } = renderHook(
        ({ puzzleId, cageId }: { puzzleId: string | undefined; cageId: string | undefined }) =>
          useCombinationElimination(puzzleId, cageId),
        {
          initialProps: { puzzleId: 'puzzle-1' as string | undefined, cageId: 'cage-1' as string | undefined }
        }
      );

      act(() => {
        result.current.toggleElimination('1,2');
      });

      expect(result.current.eliminatedSignatures.size).toBe(1);

      rerender({ puzzleId: 'puzzle-1', cageId: undefined });

      expect(result.current.eliminatedSignatures.size).toBe(0);
    });
  });

  describe('callback stability', () => {
    test('should maintain stable toggleElimination callback reference', () => {
      const { result, rerender } = renderHook(
        ({ puzzleId, cageId }) => useCombinationElimination(puzzleId, cageId),
        { initialProps: { puzzleId: 'puzzle-1', cageId: 'cage-1' } }
      );

      const firstCallback = result.current.toggleElimination;

      rerender({ puzzleId: 'puzzle-1', cageId: 'cage-1' });

      expect(result.current.toggleElimination).toBe(firstCallback);
    });

    test('should update toggleElimination when puzzleId changes', () => {
      const { result, rerender } = renderHook(
        ({ puzzleId, cageId }) => useCombinationElimination(puzzleId, cageId),
        { initialProps: { puzzleId: 'puzzle-1', cageId: 'cage-1' } }
      );

      const firstCallback = result.current.toggleElimination;

      rerender({ puzzleId: 'puzzle-2', cageId: 'cage-1' });

      expect(result.current.toggleElimination).not.toBe(firstCallback);
    });

    test('should maintain stable clearAll callback reference', () => {
      const { result, rerender } = renderHook(
        ({ puzzleId, cageId }) => useCombinationElimination(puzzleId, cageId),
        { initialProps: { puzzleId: 'puzzle-1', cageId: 'cage-1' } }
      );

      const firstCallback = result.current.clearAll;

      rerender({ puzzleId: 'puzzle-1', cageId: 'cage-1' });

      expect(result.current.clearAll).toBe(firstCallback);
    });
  });
});
