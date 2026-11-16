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
exports.SudokuControls = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const useResponsiveLayout_1 = require('../hooks/useResponsiveLayout');
/**
 * Control panel for grid-wide operations
 * @public
 */
const SudokuControls = ({
  canUndo,
  canRedo,
  canReset,
  isValid,
  isSolved,
  onUndo,
  onRedo,
  onReset,
  onExport,
  className
}) => {
  const [showResetConfirm, setShowResetConfirm] = (0, react_1.useState)(false);
  const responsiveLayout = (0, useResponsiveLayout_1.useResponsiveLayout)();
  // Handle reset with confirmation
  const handleResetClick = (0, react_1.useCallback)(() => {
    if (showResetConfirm) {
      onReset();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  }, [showResetConfirm, onReset]);
  // Cancel reset confirmation
  const handleCancelReset = (0, react_1.useCallback)(() => {
    setShowResetConfirm(false);
  }, []);
  // Calculate control classes
  const controlClasses = (0, react_1.useMemo)(() => {
    const classes = ['sudoku-controls'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);
  // Button base styles
  const buttonStyle = {
    padding: '8px 16px',
    margin: '4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  };
  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f5f5f5',
    color: '#999',
    cursor: 'not-allowed'
  };
  // Removed unused primaryButtonStyle variable
  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: '#fff',
    border: '1px solid #d32f2f'
  };
  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4caf50',
    color: '#fff',
    border: '1px solid #388e3c'
  };
  // Calculate if we should use compact layout
  const isCompactMode =
    responsiveLayout.deviceType === 'mobile' &&
    (responsiveLayout.keypadLayoutMode === 'side-by-side' || responsiveLayout.keypadLayoutMode === 'stacked');
  return react_1.default.createElement(
    'div',
    { className: controlClasses, 'data-testid': 'sudoku-controls' },
    react_1.default.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: isCompactMode ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isCompactMode ? '8px' : '16px',
          padding: isCompactMode ? '8px' : '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
          flexWrap: isCompactMode ? 'wrap' : 'nowrap'
        }
      },
      react_1.default.createElement(
        'div',
        { style: { display: 'flex', gap: '8px' } },
        react_1.default.createElement(
          'button',
          {
            type: 'button',
            onClick: onUndo,
            disabled: !canUndo,
            style: canUndo ? buttonStyle : disabledButtonStyle,
            'data-testid': 'undo-button',
            title: 'Undo last move'
          },
          '\u21B6 Undo'
        ),
        react_1.default.createElement(
          'button',
          {
            type: 'button',
            onClick: onRedo,
            disabled: !canRedo,
            style: canRedo ? buttonStyle : disabledButtonStyle,
            'data-testid': 'redo-button',
            title: 'Redo last undone move'
          },
          '\u21B7 Redo'
        )
      ),
      !showResetConfirm
        ? react_1.default.createElement(
            'button',
            {
              type: 'button',
              onClick: handleResetClick,
              disabled: !canReset,
              style: canReset ? dangerButtonStyle : disabledButtonStyle,
              'data-testid': 'reset-button',
              title: 'Clear all entries'
            },
            '\uD83D\uDDD1\uFE0F Reset Puzzle'
          )
        : react_1.default.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: isCompactMode ? 'row' : 'column',
                alignItems: 'center',
                gap: '8px'
              }
            },
            !isCompactMode &&
              react_1.default.createElement(
                'div',
                { style: { fontSize: '12px', color: '#666', textAlign: 'center' } },
                'Are you sure? This will clear all entries.'
              ),
            react_1.default.createElement(
              'div',
              { style: { display: 'flex', gap: '8px' } },
              react_1.default.createElement(
                'button',
                {
                  type: 'button',
                  onClick: handleResetClick,
                  style: dangerButtonStyle,
                  'data-testid': 'confirm-reset-button',
                  title: isCompactMode ? 'Are you sure? This will clear all entries.' : undefined
                },
                'Yes, Reset'
              ),
              react_1.default.createElement(
                'button',
                {
                  type: 'button',
                  onClick: handleCancelReset,
                  style: buttonStyle,
                  'data-testid': 'cancel-reset-button'
                },
                'Cancel'
              )
            )
          ),
      react_1.default.createElement(
        'button',
        {
          type: 'button',
          onClick: onExport,
          style: successButtonStyle,
          'data-testid': 'export-button',
          title: 'Export puzzle in compatible format'
        },
        '\uD83D\uDCE4 Export Puzzle'
      ),
      !(
        responsiveLayout.deviceType === 'mobile' &&
        (responsiveLayout.keypadLayoutMode === 'side-by-side' ||
          responsiveLayout.keypadLayoutMode === 'stacked')
      ) &&
        react_1.default.createElement(
          'div',
          {
            style: {
              fontSize: '12px',
              color: '#666',
              textAlign: 'center',
              maxWidth: '300px',
              lineHeight: '1.4'
            }
          },
          react_1.default.createElement(
            'div',
            { style: { fontWeight: 'bold', marginBottom: '4px' } },
            'Instructions:'
          ),
          react_1.default.createElement('div', null, '\u2022 Click a cell to select it'),
          react_1.default.createElement('div', null, '\u2022 Type 1-9 to enter numbers'),
          react_1.default.createElement('div', null, '\u2022 Press Delete/Backspace to clear'),
          react_1.default.createElement('div', null, '\u2022 Use arrow keys to navigate')
        ),
      react_1.default.createElement(
        'div',
        {
          style: {
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: isSolved ? '#e8f5e8' : isValid ? '#e3f2fd' : '#ffebee',
            color: isSolved ? '#2e7d32' : isValid ? '#1565c0' : '#c62828',
            border: `1px solid ${isSolved ? '#4caf50' : isValid ? '#2196f3' : '#f44336'}`
          }
        },
        isSolved ? '✅ Solved!' : isValid ? '✓ Valid' : '⚠ Has Errors'
      )
    )
  );
};
exports.SudokuControls = SudokuControls;
//# sourceMappingURL=SudokuControls.js.map
