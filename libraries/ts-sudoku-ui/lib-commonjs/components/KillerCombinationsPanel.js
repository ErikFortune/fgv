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
exports.KillerCombinationsPanel = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const CombinationGrid_1 = require('./CombinationGrid');
/**
 * Desktop panel variant for killer combinations explorer
 * @public
 */
const KillerCombinationsPanel = ({ cage, combinations, onToggle, onClose, isOpen, className }) => {
  // Handle Escape key to close
  (0, react_1.useEffect)(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);
  const panelClasses = [
    'fixed right-0 top-0 bottom-0',
    'w-96 max-w-md',
    'bg-white dark:bg-gray-900',
    'border-l border-gray-200 dark:border-gray-700',
    'shadow-2xl',
    'transform transition-transform duration-300 ease-in-out',
    isOpen ? 'translate-x-0' : 'translate-x-full',
    'z-[9999]',
    'flex flex-col',
    className
  ]
    .filter(Boolean)
    .join(' ');
  const activeCount = combinations.filter((c) => !c.isEliminated).length;
  const totalCount = combinations.length;
  return react_1.default.createElement(
    'aside',
    { className: panelClasses, role: 'complementary', 'aria-label': 'Killer Sudoku Combinations Explorer' },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700' },
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h2',
          { className: 'text-lg font-semibold text-gray-900 dark:text-gray-100' },
          'Combinations'
        ),
        react_1.default.createElement(
          'p',
          { className: 'text-sm text-gray-500 dark:text-gray-400' },
          cage.numCells,
          ' cells, sum ',
          cage.total
        )
      ),
      react_1.default.createElement(
        'button',
        {
          type: 'button',
          onClick: onClose,
          className: 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
          'aria-label': 'Close combinations panel'
        },
        react_1.default.createElement(
          'svg',
          { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
          react_1.default.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M6 18L18 6M6 6l12 12'
          })
        )
      )
    ),
    react_1.default.createElement(
      'div',
      { className: 'px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700' },
      react_1.default.createElement(
        'p',
        { className: 'text-xs text-gray-600 dark:text-gray-400' },
        activeCount,
        ' of ',
        totalCount,
        ' combinations possible'
      )
    ),
    react_1.default.createElement(
      'div',
      { className: 'flex-1 overflow-hidden' },
      react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
        combinations: combinations,
        onToggle: onToggle,
        mode: 'panel'
      })
    )
  );
};
exports.KillerCombinationsPanel = KillerCombinationsPanel;
//# sourceMappingURL=KillerCombinationsPanel.js.map
