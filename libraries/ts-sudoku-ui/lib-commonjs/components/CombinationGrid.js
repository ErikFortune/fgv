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
exports.CombinationGrid = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importDefault(require('react'));
const CombinationCard_1 = require('./CombinationCard');
/**
 * Grid layout component for displaying combination cards
 * @public
 */
const CombinationGrid = ({ combinations, onToggle, mode, className }) => {
  const gridClasses = ['flex flex-wrap gap-2 p-4', 'overflow-y-auto', 'justify-start', className]
    .filter(Boolean)
    .join(' ');
  if (combinations.length === 0) {
    return react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-center p-8 text-gray-500 dark:text-gray-400' },
      react_1.default.createElement('p', null, 'No combinations available for this cage')
    );
  }
  // Sort combinations: valid ones first, then by numeric value
  const sortedCombinations = [...combinations].sort((a, b) => {
    // First sort by elimination status (valid ones first)
    if (a.isEliminated !== b.isEliminated) {
      return a.isEliminated ? 1 : -1;
    }
    // Then sort by the numeric value of the combination
    const aValue = parseInt(a.combination.join(''), 10);
    const bValue = parseInt(b.combination.join(''), 10);
    return aValue - bValue;
  });
  return react_1.default.createElement(
    'div',
    { className: gridClasses },
    sortedCombinations.map((combo) =>
      react_1.default.createElement(CombinationCard_1.CombinationCard, {
        key: combo.signature,
        combination: combo,
        onToggle: onToggle
      })
    )
  );
};
exports.CombinationGrid = CombinationGrid;
//# sourceMappingURL=CombinationGrid.js.map
