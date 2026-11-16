'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.useCombinationElimination = useCombinationElimination;
const react_1 = require('react');
/**
 * Generate session storage key for a cage's eliminated combinations
 */
function getStorageKey(puzzleId, cageId) {
  return `killer-combinations-${puzzleId}-${cageId}`;
}
/**
 * Load eliminated combinations from session storage
 */
function loadFromSessionStorage(puzzleId, cageId) {
  try {
    const key = getStorageKey(puzzleId, cageId);
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
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
function saveToSessionStorage(puzzleId, cageId, eliminated) {
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
function clearFromSessionStorage(puzzleId, cageId) {
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
function useCombinationElimination(puzzleId, cageId) {
  const [eliminated, setEliminated] = (0, react_1.useState)(() => {
    if (!puzzleId || !cageId) {
      return new Set();
    }
    return loadFromSessionStorage(puzzleId, cageId);
  });
  // Update state when puzzleId or cageId changes
  (0, react_1.useEffect)(() => {
    if (!puzzleId || !cageId) {
      setEliminated(new Set());
      return;
    }
    setEliminated(loadFromSessionStorage(puzzleId, cageId));
  }, [puzzleId, cageId]);
  const toggleElimination = (0, react_1.useCallback)(
    (signature) => {
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
  const clearAll = (0, react_1.useCallback)(() => {
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
//# sourceMappingURL=useCombinationElimination.js.map
