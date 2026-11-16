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
exports.ValidationDisplay = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
/**
 * Component to display validation errors and puzzle status
 * @public
 */
const ValidationDisplay = ({ errors, isValid, isSolved, className }) => {
  // Calculate display classes
  const displayClasses = (0, react_1.useMemo)(() => {
    const classes = ['w-full max-w-lg mx-auto mt-4 p-3 text-center text-sm'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);
  // Group errors by type for better display
  const errorsByType = (0, react_1.useMemo)(() => {
    const grouped = {
      'duplicate-row': [],
      'duplicate-column': [],
      'duplicate-section': [],
      'duplicate-diagonal': [],
      'invalid-value': []
    };
    errors.forEach((error) => {
      if (error.type in grouped) {
        grouped[error.type].push(error);
      }
    });
    return grouped;
  }, [errors]);
  // Get status message
  const statusMessage = (0, react_1.useMemo)(() => {
    if (isSolved) return 'Puzzle solved! 🎉';
    if (isValid) return 'Puzzle is valid';
    return `${errors.length} validation error${errors.length === 1 ? '' : 's'}`;
  }, [isValid, isSolved, errors.length]);
  // Calculate status container classes
  const statusContainerClasses = (0, react_1.useMemo)(() => {
    const classes = ['p-2 mb-2 rounded-lg border'];
    if (isSolved) classes.push('bg-green-50 border-green-500 text-green-800');
    else if (isValid) classes.push('bg-blue-50 border-blue-500 text-blue-800');
    else classes.push('bg-red-50 border-red-500 text-red-800');
    return classes.join(' ');
  }, [isSolved, isValid, errors.length]);
  if (errors.length === 0 && !isSolved) {
    return react_1.default.createElement(
      'div',
      { className: displayClasses, 'data-testid': 'validation-display' },
      react_1.default.createElement(
        'div',
        { className: statusContainerClasses },
        react_1.default.createElement('div', { className: 'font-semibold' }, statusMessage)
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: displayClasses, 'data-testid': 'validation-display' },
    react_1.default.createElement(
      'div',
      { className: statusContainerClasses },
      react_1.default.createElement('div', { className: 'font-semibold' }, statusMessage)
    ),
    errors.length > 0 &&
      react_1.default.createElement(
        'div',
        { className: 'mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-left' },
        react_1.default.createElement(
          'div',
          { className: 'font-bold mb-2 text-gray-900' },
          'Validation Errors:'
        ),
        Object.entries(errorsByType).map(([type, typeErrors]) => {
          if (typeErrors.length === 0) return null;
          const typeLabel = type.replace('duplicate-', '').replace('-', ' ');
          return react_1.default.createElement(
            'div',
            { key: type, className: 'mb-3 last:mb-0' },
            react_1.default.createElement(
              'div',
              { className: 'font-semibold text-gray-700 mb-1 capitalize' },
              typeLabel,
              ' (',
              typeErrors.length,
              ')'
            ),
            react_1.default.createElement(
              'ul',
              { className: 'list-disc list-inside space-y-1 text-xs text-gray-600' },
              typeErrors.map((error, index) =>
                react_1.default.createElement(
                  'li',
                  { key: `${error.cellId}-${index}`, className: 'leading-relaxed' },
                  error.message
                )
              )
            )
          );
        })
      )
  );
};
exports.ValidationDisplay = ValidationDisplay;
//# sourceMappingURL=ValidationDisplay.js.map
