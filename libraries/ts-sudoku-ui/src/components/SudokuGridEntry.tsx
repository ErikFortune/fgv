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

import React, { useCallback, useEffect, useMemo } from 'react';
import { CellId, NavigationDirection } from '@fgv/ts-sudoku-lib';
import { ISudokuGridEntryProps } from '../types';
import { usePuzzleSession } from '../hooks/usePuzzleSession';
import { SudokuGrid } from './SudokuGrid';
import { SudokuControls } from './SudokuControls';
import { ValidationDisplay } from './ValidationDisplay';

/**
 * Main container component that orchestrates puzzle entry
 * @public
 */
export const SudokuGridEntry: React.FC<ISudokuGridEntryProps> = ({
  initialPuzzleDescription,
  onStateChange,
  onValidationErrors,
  className
}) => {
  const {
    session,
    selectedCell,
    setSelectedCell,
    cellDisplayInfo,
    validationErrors,
    isValid,
    isSolved,
    canUndo,
    canRedo,
    error,
    updateCellValue,
    navigateToCell,
    undo,
    redo,
    reset,
    exportPuzzle
  } = usePuzzleSession(initialPuzzleDescription);

  // Handle cell selection
  const handleCellSelect = useCallback(
    (cellId: CellId) => {
      setSelectedCell(cellId);
    },
    [setSelectedCell]
  );

  // Handle cell value changes
  const handleCellValueChange = useCallback(
    (cellId: CellId, value: number | undefined) => {
      updateCellValue(cellId, value);
    },
    [updateCellValue]
  );

  // Handle navigation
  const handleNavigate = useCallback(
    (direction: NavigationDirection) => {
      navigateToCell(direction);
    },
    [navigateToCell]
  );

  // Handle export
  const handleExport = useCallback(() => {
    const exported = exportPuzzle();
    if (exported) {
      // Export puzzle to file - exported object contains the puzzle data

      // Create a downloadable file
      const dataStr = JSON.stringify(exported, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exported.id || 'sudoku-puzzle'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [exportPuzzle]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(isValid, isSolved);
    }
  }, [isValid, isSolved, onStateChange]);

  // Notify parent of validation errors
  useEffect(() => {
    if (onValidationErrors) {
      onValidationErrors(validationErrors);
    }
  }, [validationErrors, onValidationErrors]);

  // Calculate container classes
  const containerClasses = useMemo(() => {
    const classes = ['sudoku-grid-entry'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);

  // Show error state if session failed to initialize
  if (error) {
    return (
      <div className={containerClasses} data-testid="sudoku-grid-entry-error">
        <div
          style={{
            padding: '20px',
            border: '1px solid #f44336',
            borderRadius: '8px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            textAlign: 'center'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  // Show loading state while session is initializing
  if (!session) {
    return (
      <div className={containerClasses} data-testid="sudoku-grid-entry-loading">
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666'
          }}
        >
          Loading puzzle...
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} data-testid="sudoku-grid-entry">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px'
        }}
      >
        {/* Puzzle title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '10px'
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>{session.description}</h2>
          {session.id && <div style={{ fontSize: '14px', color: '#666' }}>ID: {session.id}</div>}
        </div>

        {/* Main grid */}
        <SudokuGrid
          numRows={session.numRows}
          numColumns={session.numColumns}
          cells={cellDisplayInfo}
          selectedCell={selectedCell}
          onCellSelect={handleCellSelect}
          onCellValueChange={handleCellValueChange}
          onNavigate={handleNavigate}
        />

        {/* Validation display */}
        <ValidationDisplay errors={validationErrors} isValid={isValid} isSolved={isSolved} />

        {/* Controls */}
        <SudokuControls
          canUndo={canUndo}
          canRedo={canRedo}
          canReset={true}
          isValid={isValid}
          isSolved={isSolved}
          onUndo={undo}
          onRedo={redo}
          onReset={reset}
          onExport={handleExport}
        />
      </div>
    </div>
  );
};
