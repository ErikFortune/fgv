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

import { useState, useCallback, useEffect } from 'react';
import { IEliminationState } from '../types';

/**
 * Generate session storage key for a cage's eliminated combinations
 */
function getStorageKey(puzzleId: string, cageId: string): string {
  return `killer-combinations-${puzzleId}-${cageId}`;
}

/**
 * Load eliminated combinations from session storage
 */
function loadFromSessionStorage(puzzleId: string, cageId: string): Set<string> {
  try {
    const key = getStorageKey(puzzleId, cageId);
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      return new Set(parsed);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

/**
 * Save eliminated combinations to session storage
 */
function saveToSessionStorage(puzzleId: string, cageId: string, eliminated: Set<string>): void {
  try {
    const key = getStorageKey(puzzleId, cageId);
    const array = Array.from(eliminated);
    sessionStorage.setItem(key, JSON.stringify(array));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear eliminated combinations from session storage
 */
function clearFromSessionStorage(puzzleId: string, cageId: string): void {
  try {
    const key = getStorageKey(puzzleId, cageId);
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing combination elimination state with session storage persistence
 * @param puzzleId - Unique identifier for the puzzle
 * @param cageId - Unique identifier for the cage
 * @returns Elimination state with toggle and clear operations
 * @public
 */
export function useCombinationElimination(
  puzzleId: string | undefined,
  cageId: string | undefined
): IEliminationState {
  const [eliminated, setEliminated] = useState<Set<string>>(() => {
    if (!puzzleId || !cageId) {
      return new Set();
    }
    return loadFromSessionStorage(puzzleId, cageId);
  });

  // Update state when puzzleId or cageId changes
  useEffect(() => {
    if (!puzzleId || !cageId) {
      setEliminated(new Set());
      return;
    }
    setEliminated(loadFromSessionStorage(puzzleId, cageId));
  }, [puzzleId, cageId]);

  const toggleElimination = useCallback(
    (signature: string) => {
      setEliminated((prev) => {
        const next = new Set(prev);
        if (next.has(signature)) {
          next.delete(signature);
        } else {
          next.add(signature);
        }

        // Persist to session storage
        if (puzzleId && cageId) {
          saveToSessionStorage(puzzleId, cageId, next);
        }

        return next;
      });
    },
    [puzzleId, cageId]
  );

  const clearAll = useCallback(() => {
    setEliminated(new Set());
    if (puzzleId && cageId) {
      clearFromSessionStorage(puzzleId, cageId);
    }
  }, [puzzleId, cageId]);

  return {
    eliminatedSignatures: eliminated,
    toggleElimination,
    clearAll
  };
}
