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
import { DualKeypad } from './DualKeypad';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

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
    selectedCells,
    inputMode,
    setSelectedCell,
    setSelectedCells,
    setInputMode,
    cellDisplayInfo,
    validationErrors,
    isValid,
    isSolved,
    canUndo,
    canRedo,
    error,
    updateCellValue,
    toggleCellNote,
    clearCellNotes,
    navigateToCell,
    undo,
    redo,
    reset,
    exportPuzzle
  } = usePuzzleSession(initialPuzzleDescription);

  // Get responsive layout information
  const responsiveLayout = useResponsiveLayout();

  // Handle cell selection with multi-select support
  const handleCellSelect = useCallback(
    (cellId: CellId, event?: React.MouseEvent) => {
      if (event && (event.ctrlKey || event.metaKey)) {
        // Multi-select mode: add/remove from selection
        const currentIndex = selectedCells.indexOf(cellId);
        if (currentIndex >= 0) {
          // Remove from selection
          const newSelection = selectedCells.filter((id) => id !== cellId);
          setSelectedCells(newSelection);
          // If we removed the primary selected cell, set new primary
          if (selectedCell === cellId && newSelection.length > 0) {
            setSelectedCell(newSelection[0]);
          } else if (newSelection.length === 0) {
            setSelectedCell(null);
          }
        } else {
          // Add to selection
          setSelectedCells([...selectedCells, cellId]);
          setSelectedCell(cellId); // Make this the primary selection
        }
      } else {
        // Single select mode
        setSelectedCell(cellId);
        setSelectedCells([cellId]);
      }
    },
    [selectedCell, selectedCells, setSelectedCell, setSelectedCells]
  );

  // Handle cell value changes
  const handleCellValueChange = useCallback(
    (cellId: CellId, value: number | undefined) => {
      updateCellValue(cellId, value);
    },
    [updateCellValue]
  );

  // Handle note toggle (supports multi-select)
  const handleNoteToggle = useCallback(
    (cellId: CellId, note: number) => {
      // If multiple cells are selected and this is one of them, apply to all
      if (selectedCells.length > 1 && selectedCells.includes(cellId)) {
        selectedCells.forEach((id) => {
          toggleCellNote(id, note);
        });
      } else {
        toggleCellNote(cellId, note);
      }
    },
    [toggleCellNote, selectedCells]
  );

  // Handle clear all notes (supports multi-select)
  const handleClearAllNotes = useCallback(
    (cellId: CellId) => {
      // If multiple cells are selected and this is one of them, apply to all
      if (selectedCells.length > 1 && selectedCells.includes(cellId)) {
        selectedCells.forEach((id) => {
          clearCellNotes(id);
        });
      } else {
        clearCellNotes(cellId);
      }
    },
    [clearCellNotes, selectedCells]
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

  // Handle dual keypad note press (applies to all selected cells)
  const handleKeypadNotePress = useCallback(
    (number: number) => {
      if (selectedCells.length > 0) {
        selectedCells.forEach((cellId) => {
          toggleCellNote(cellId, number);
        });
      }
    },
    [selectedCells, toggleCellNote]
  );

  // Handle dual keypad value press (applies to all selected cells)
  const handleKeypadValuePress = useCallback(
    (number: number) => {
      if (selectedCells.length > 0) {
        selectedCells.forEach((cellId) => {
          updateCellValue(cellId, number);
        });
      }
    },
    [selectedCells, updateCellValue]
  );

  // Handle dual keypad clear notes (applies to all selected cells)
  const handleKeypadClearNotes = useCallback(() => {
    if (selectedCells.length > 0) {
      selectedCells.forEach((cellId) => {
        clearCellNotes(cellId);
      });
    }
  }, [selectedCells, clearCellNotes]);

  // Handle dual keypad clear values (applies to all selected cells)
  const handleKeypadClearValues = useCallback(() => {
    if (selectedCells.length > 0) {
      selectedCells.forEach((cellId) => {
        updateCellValue(cellId, undefined);
      });
    }
  }, [selectedCells, updateCellValue]);

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
    const classes = ['w-full min-h-screen font-sans'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);

  // Determine if we should show traditional input mode toggle - moved before conditionals
  const showTraditionalModeToggle =
    responsiveLayout.keypadLayoutMode === 'hidden' || !responsiveLayout.isTouchDevice;

  // Calculate main container classes - moved before conditionals
  const mainContainerClasses = useMemo(() => {
    const classes = ['flex items-start gap-5 mx-auto p-5'];

    // Desktop or landscape tablet with stacked keypad layout
    if (responsiveLayout.keypadLayoutMode === 'stacked' && responsiveLayout.orientation === 'landscape') {
      classes.push('flex-row max-w-screen-lg justify-center');
    } else if (responsiveLayout.keypadLayoutMode === 'side-by-side') {
      classes.push('flex-row max-w-screen-lg justify-center');
    } else {
      // Default vertical layout
      classes.push('flex-col items-center max-w-2xl');
    }

    return classes.join(' ');
  }, [responsiveLayout.keypadLayoutMode, responsiveLayout.orientation]);

  // Calculate game area classes
  const gameAreaClasses = useMemo(() => {
    const classes = ['flex flex-col items-center gap-5'];

    if (responsiveLayout.keypadLayoutMode === 'stacked' && responsiveLayout.orientation === 'landscape') {
      classes.push('flex-none');
    } else {
      classes.push('flex-1');
    }

    return classes.join(' ');
  }, [responsiveLayout.keypadLayoutMode, responsiveLayout.orientation]);

  // Show error state if session failed to initialize
  if (error) {
    return (
      <div className={containerClasses} data-testid="sudoku-grid-entry-error">
        <div className="p-5 border border-red-500 rounded-lg bg-red-50 text-red-800 text-center mx-5 my-5 max-w-md">
          <div className="font-semibold mb-2 text-lg">Error</div>
          <div className="text-sm leading-relaxed">{error}</div>
        </div>
      </div>
    );
  }

  // Show loading state while session is initializing
  if (!session) {
    return (
      <div className={containerClasses} data-testid="sudoku-grid-entry-loading">
        <div className="p-5 text-center text-gray-600 mx-5 my-5 max-w-md">
          <div className="text-lg">Loading puzzle...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} data-testid="sudoku-grid-entry">
      <div className={mainContainerClasses}>
        {/* Game area container */}
        <div className={gameAreaClasses}>
          {/* Puzzle title */}
          <div className="text-center mb-3">
            <h2 className="m-0 mb-2 text-2xl font-semibold text-gray-900">{session.description}</h2>
            {session.id && <div className="text-sm text-gray-600 m-0">ID: {session.id}</div>}
          </div>

          {/* Traditional input mode toggle - only show if keypads are hidden/overlay */}
          {showTraditionalModeToggle && (
            <div className="flex items-center gap-3 p-2 px-4 bg-gray-100 rounded-lg border border-gray-300 sm:flex-row flex-col sm:gap-3 gap-2 sm:p-2 sm:px-4 p-2">
              <span className="text-sm font-semibold text-gray-900 sm:text-sm text-xs">Input Mode:</span>
              <button
                type="button"
                onClick={() => setInputMode('notes')}
                className={`px-3 py-1 border border-gray-300 rounded text-gray-900 text-xs cursor-pointer font-semibold transition-all duration-150 min-h-11 flex items-center justify-center ${
                  inputMode === 'notes'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-50 hover:bg-blue-100 hover:border-blue-500'
                } sm:min-w-40 min-w-30 sm:px-4 px-2`}
              >
                📝 Notes (Default)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('value')}
                className={`px-3 py-1 border border-gray-300 rounded text-gray-900 text-xs cursor-pointer font-semibold transition-all duration-150 min-h-11 flex items-center justify-center ${
                  inputMode === 'value'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-50 hover:bg-blue-100 hover:border-blue-500'
                } sm:min-w-40 min-w-30 sm:px-4 px-2`}
              >
                ✏️ Values (Hold Shift/Ctrl/Cmd)
              </button>
            </div>
          )}

          {/* Multi-select hint */}
          {selectedCells.length > 1 && (
            <div className="px-3 py-1 bg-green-50 rounded border border-green-500 text-xs text-green-800 text-center font-normal">
              {selectedCells.length} cells selected - Operations will apply to all selected cells
            </div>
          )}

          {/* Main grid */}
          <SudokuGrid
            numRows={session.numRows}
            numColumns={session.numColumns}
            cells={cellDisplayInfo}
            selectedCell={selectedCell}
            selectedCells={selectedCells}
            inputMode={inputMode}
            onCellSelect={handleCellSelect}
            onCellValueChange={handleCellValueChange}
            onNoteToggle={handleNoteToggle}
            onClearAllNotes={handleClearAllNotes}
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

          {/* Help text - only show if using traditional input */}
          {showTraditionalModeToggle && (
            <div className="text-xs text-gray-600 text-center leading-normal max-w-md mx-auto sm:text-xs text-2xs sm:max-w-lg max-w-80">
              <div className="font-semibold mb-1 text-gray-900">Notes-First Input System:</div>
              <div className="mb-0.5">• Numbers add/remove notes by default</div>
              <div className="mb-0.5">• Hold Shift/Ctrl/Cmd + number to place value</div>
              <div className="mb-0.5">• Double-tap cell to clear all notes</div>
              <div className="mb-0.5">• Ctrl/Cmd + click to select multiple cells</div>
              <div className="mb-0">• Smart notes: placing values removes conflicting notes</div>
            </div>
          )}
        </div>

        {/* Dual Keypad - positioned based on layout mode */}
        {responsiveLayout.keypadLayoutMode === 'side-by-side' && (
          <DualKeypad
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            onNotePress={handleKeypadNotePress}
            onValuePress={handleKeypadValuePress}
            onClearNotes={handleKeypadClearNotes}
            onClearValues={handleKeypadClearValues}
            hasCellSelection={selectedCells.length > 0}
            selectedCellCount={selectedCells.length}
            showOverlayToggle={false}
          />
        )}

        {/* Stacked keypad for landscape layout */}
        {responsiveLayout.keypadLayoutMode === 'stacked' && (
          <DualKeypad
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            onNotePress={handleKeypadNotePress}
            onValuePress={handleKeypadValuePress}
            onClearNotes={handleKeypadClearNotes}
            onClearValues={handleKeypadClearValues}
            hasCellSelection={selectedCells.length > 0}
            selectedCellCount={selectedCells.length}
            showOverlayToggle={false}
          />
        )}
      </div>

      {/* Overlay keypad - rendered outside main container */}
      {(responsiveLayout.keypadLayoutMode === 'overlay' ||
        responsiveLayout.keypadLayoutMode === 'hidden') && (
        <DualKeypad
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          onNotePress={handleKeypadNotePress}
          onValuePress={handleKeypadValuePress}
          onClearNotes={handleKeypadClearNotes}
          onClearValues={handleKeypadClearValues}
          hasCellSelection={selectedCells.length > 0}
          selectedCellCount={selectedCells.length}
          showOverlayToggle={true}
        />
      )}
    </div>
  );
};
