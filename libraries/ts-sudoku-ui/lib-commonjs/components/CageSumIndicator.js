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
exports.CageSumIndicator = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
/**
 * Component for displaying the target sum of a cage in Killer Sudoku
 * @public
 */
const CageSumIndicator = ({ cage, currentSum, isComplete, isValid, position, className }) => {
  // Calculate display classes based on state
  const displayClasses = (0, react_1.useMemo)(() => {
    const classes = ['cage-sum-indicator'];
    /* c8 ignore next 1 - defense in depth */
    if (className) classes.push(className);
    if (!isValid) {
      classes.push('cage-sum-indicator--invalid');
    } else if (isComplete) {
      classes.push('cage-sum-indicator--complete');
    } else if (currentSum !== undefined) {
      classes.push('cage-sum-indicator--partial');
    }
    return classes.join(' ');
  }, [className, isValid, isComplete, currentSum]);
  return react_1.default.createElement(
    'div',
    {
      className: `
        ${displayClasses}
        absolute z-20 pointer-events-none
        text-xs font-bold
        bg-white border border-gray-400 rounded px-1
        min-w-[20px] text-center
        shadow-sm
      `,
      style: {
        top: `${position.top}%`,
        left: `${position.left}%`,
        fontSize: '10px',
        lineHeight: '16px'
      },
      'data-testid': `cage-sum-${cage.id}`
    },
    react_1.default.createElement('div', { className: 'text-gray-700' }, cage.total),
    currentSum !== undefined &&
      react_1.default.createElement(
        'div',
        {
          className: `
            text-xs
            ${isValid ? 'text-blue-600' : 'text-red-600'}
          `,
          style: { fontSize: '8px', lineHeight: '10px' }
        },
        currentSum
      )
  );
};
exports.CageSumIndicator = CageSumIndicator;
//# sourceMappingURL=CageSumIndicator.js.map
