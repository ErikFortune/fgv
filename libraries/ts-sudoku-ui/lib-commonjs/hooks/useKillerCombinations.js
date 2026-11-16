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
exports.useKillerCombinations = useKillerCombinations;
const react_1 = require('react');
const ts_utils_1 = require('@fgv/ts-utils');
const ts_sudoku_lib_1 = require('@fgv/ts-sudoku-lib');
/**
 * Generate signature for a combination (sorted numbers joined by commas)
 */
function getCombinationSignature(combination) {
  return [...combination].sort((a, b) => a - b).join(',');
}
/**
 * Hook to get all valid killer cage combinations for a selected cage
 * @param cage - The selected killer cage
 * @returns Result containing combination display information
 * @public
 */
function useKillerCombinations(cage) {
  return (0, react_1.useMemo)(() => {
    if (!cage) {
      return (0, ts_utils_1.fail)('No cage selected');
    }
    if (cage.cageType !== 'killer') {
      return (0, ts_utils_1.fail)('Cage is not a killer cage');
    }
    if (!cage.total) {
      return (0, ts_utils_1.fail)('Killer cage does not have a total');
    }
    // For now, we don't apply constraints based on current values
    // This can be enhanced later to exclude numbers already in the cage
    const constraints = {
      excludedNumbers: []
    };
    return ts_sudoku_lib_1.Puzzles.KillerCombinations.getCombinations(
      cage.numCells,
      cage.total,
      constraints
    ).onSuccess((combinations) => {
      const displayInfo = combinations.map((combo) => ({
        combination: combo,
        signature: getCombinationSignature(combo),
        isEliminated: false
      }));
      return (0, ts_utils_1.succeed)(displayInfo);
    });
  }, [cage]);
}
//# sourceMappingURL=useKillerCombinations.js.map
