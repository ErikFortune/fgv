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

import React, { useCallback, useMemo, useState } from 'react';
import { ISudokuControlsProps } from '../types';

/**
 * Control panel for grid-wide operations
 * @public
 */
export const SudokuControls: React.FC<ISudokuControlsProps> = ({
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle reset with confirmation
  const handleResetClick = useCallback(() => {
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
  const handleCancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // Calculate control classes
  const controlClasses = useMemo(() => {
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

  return (
    <div className={controlClasses} data-testid="sudoku-controls">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fafafa'
        }}
      >
        {/* Undo/Redo controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            style={canUndo ? buttonStyle : disabledButtonStyle}
            data-testid="undo-button"
            title="Undo last move"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            style={canRedo ? buttonStyle : disabledButtonStyle}
            data-testid="redo-button"
            title="Redo last undone move"
          >
            ↷ Redo
          </button>
        </div>

        {/* Reset control with confirmation */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={handleResetClick}
              disabled={!canReset}
              style={canReset ? dangerButtonStyle : disabledButtonStyle}
              data-testid="reset-button"
              title="Clear all entries"
            >
              🗑️ Reset Puzzle
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                Are you sure? This will clear all entries.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleResetClick}
                  style={dangerButtonStyle}
                  data-testid="confirm-reset-button"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={handleCancelReset}
                  style={buttonStyle}
                  data-testid="cancel-reset-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export control */}
        <button
          type="button"
          onClick={onExport}
          style={successButtonStyle}
          data-testid="export-button"
          title="Export puzzle in compatible format"
        >
          📤 Export Puzzle
        </button>

        {/* Instructions */}
        <div
          style={{
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            maxWidth: '300px',
            lineHeight: '1.4'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Instructions:</div>
          <div>• Click a cell to select it</div>
          <div>• Type 1-9 to enter numbers</div>
          <div>• Press Delete/Backspace to clear</div>
          <div>• Use arrow keys to navigate</div>
        </div>

        {/* Status indicator */}
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: isSolved ? '#e8f5e8' : isValid ? '#e3f2fd' : '#ffebee',
            color: isSolved ? '#2e7d32' : isValid ? '#1565c0' : '#c62828',
            border: `1px solid ${isSolved ? '#4caf50' : isValid ? '#2196f3' : '#f44336'}`
          }}
        >
          {isSolved ? '✅ Solved!' : isValid ? '✓ Valid' : '⚠ Has Errors'}
        </div>
      </div>
    </div>
  );
};
