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
exports.SudokuGridEntry = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const usePuzzleSession_1 = require('../hooks/usePuzzleSession');
const SudokuGrid_1 = require('./SudokuGrid');
const CompactControlRibbon_1 = require('./CompactControlRibbon');
const DualKeypad_1 = require('./DualKeypad');
const useResponsiveLayout_1 = require('../hooks/useResponsiveLayout');
const KillerCombinationsExplorer_1 = require('./KillerCombinationsExplorer');
const useKeyboardShortcut_1 = require('../hooks/useKeyboardShortcut');
/**
 * Main container component that orchestrates puzzle entry
 * @public
 */
const SudokuGridEntry = ({
  initialPuzzleDescription,
  onStateChange,
  onValidationErrors,
  className,
  forceLayoutMode
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
    cageDisplayInfo,
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
  } = (0, usePuzzleSession_1.usePuzzleSession)(initialPuzzleDescription);
  // Drag-to-add multiselect state
  const [isDragging, setIsDragging] = (0, react_1.useState)(false);
  const dragStartCellRef = (0, react_1.useRef)(null);
  // Killer Combinations Explorer state
  const [isCombinationsExplorerOpen, setIsCombinationsExplorerOpen] = (0, react_1.useState)(false);
  // Get responsive layout information
  const responsiveLayout = (0, useResponsiveLayout_1.useResponsiveLayout)(forceLayoutMode);
  // Determine selected cage for killer sudoku
  const selectedCage = (0, react_1.useMemo)(() => {
    if (
      initialPuzzleDescription?.type === 'killer-sudoku' &&
      selectedCells.length > 0 &&
      cageDisplayInfo &&
      cageDisplayInfo.length > 0
    ) {
      // Find all cages that contain selected cells
      const cagesContainingSelection = cageDisplayInfo.filter((cageInfo) =>
        selectedCells.some((cellId) => cageInfo.cage.containsCell(cellId))
      );
      // Only return a cage if all selected cells are in the same cage
      if (cagesContainingSelection.length === 1) {
        // Verify all selected cells are in this cage
        const cage = cagesContainingSelection[0].cage;
        const allInSameCage = selectedCells.every((cellId) => cage.containsCell(cellId));
        if (allInSameCage) {
          return cage;
        }
      }
    }
    return null;
  }, [initialPuzzleDescription?.type, selectedCells, cageDisplayInfo]);
  // Keyboard shortcut for combinations explorer
  (0, useKeyboardShortcut_1.useKeyboardShortcut)(
    'k',
    () => {
      if (selectedCage) {
        setIsCombinationsExplorerOpen((prev) => !prev);
      }
    },
    { ctrl: true, meta: true, preventDefault: true }
  );
  // Handle cell selection with multi-select support
  const handleCellSelect = (0, react_1.useCallback)(
    (cellId, event) => {
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
  const handleCellValueChange = (0, react_1.useCallback)(
    (cellId, value) => {
      updateCellValue(cellId, value);
    },
    [updateCellValue]
  );
  // Handle note toggle (supports multi-select with normalize-to-same-state logic)
  const handleNoteToggle = (0, react_1.useCallback)(
    (cellId, note) => {
      // If multiple cells are selected and this is one of them, apply normalize logic to all
      if (selectedCells.length > 1 && selectedCells.includes(cellId)) {
        // Get all selected cell display info to check current note states
        const selectedCellsInfo = cellDisplayInfo.filter((cell) => selectedCells.includes(cell.id));
        // Count how many selected cells currently have this note
        const cellsWithNote = selectedCellsInfo.filter((cell) => cell.contents.notes.includes(note));
        const allSelected = selectedCellsInfo.length;
        const withNote = cellsWithNote.length;
        // Normalize logic:
        // - If ALL have note: Remove from all
        // - If SOME have note: Add to all (normalize to "all have")
        // - If NONE have note: Add to all
        if (withNote === allSelected) {
          // ALL have the note → remove from all
          selectedCells.forEach((id) => {
            // Only remove if the cell actually has the note (safety check)
            const cellInfo = cellDisplayInfo.find((c) => c.id === id);
            if (cellInfo && cellInfo.contents.notes.includes(note)) {
              toggleCellNote(id, note);
            }
          });
        } else {
          // SOME or NONE have the note → add to all
          selectedCells.forEach((id) => {
            // Only add if the cell doesn't already have the note
            const cellInfo = cellDisplayInfo.find((c) => c.id === id);
            if (cellInfo && !cellInfo.contents.notes.includes(note)) {
              toggleCellNote(id, note);
            }
          });
        }
      } else {
        // Single cell selection - normal toggle behavior
        toggleCellNote(cellId, note);
      }
    },
    [toggleCellNote, selectedCells, cellDisplayInfo]
  );
  // Handle clear all notes (supports multi-select)
  const handleClearAllNotes = (0, react_1.useCallback)(
    (cellId) => {
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
  // Handle long press toggle for multiselect
  const handleLongPressToggle = (0, react_1.useCallback)(
    (cellId, event) => {
      event.preventDefault();
      // Toggle cell in selection: if not in selection, add it; if in selection, remove it
      const currentIndex = selectedCells.indexOf(cellId);
      if (currentIndex >= 0) {
        // Remove from selection
        const newSelection = selectedCells.filter((id) => id !== cellId);
        setSelectedCells(newSelection);
        // If we removed the primary selected cell, set new primary or clear
        if (selectedCell === cellId) {
          if (newSelection.length > 0) {
            setSelectedCell(newSelection[0]);
          } else {
            setSelectedCell(null);
          }
        }
      } else {
        // Add to selection
        const newSelection = [...selectedCells, cellId];
        setSelectedCells(newSelection);
        setSelectedCell(cellId); // Make this the primary selection
      }
      // Enter drag mode for potential drag-to-add functionality
      setIsDragging(true);
      dragStartCellRef.current = cellId;
    },
    [selectedCell, selectedCells, setSelectedCell, setSelectedCells]
  );
  // Handle drag over cell during drag-to-add
  const handleDragOver = (0, react_1.useCallback)(
    (cellId) => {
      if (!isDragging || dragStartCellRef.current === null) return;
      // Only add cells to selection during drag (don't toggle/remove)
      if (!selectedCells.includes(cellId)) {
        const newSelection = [...selectedCells, cellId];
        setSelectedCells(newSelection);
        // Don't change primary selection during drag
      }
    },
    [isDragging, selectedCells, setSelectedCells]
  );
  // Handle end of drag operation
  const handleDragEnd = (0, react_1.useCallback)(() => {
    setIsDragging(false);
    dragStartCellRef.current = null;
  }, []);
  // Handle navigation
  const handleNavigate = (0, react_1.useCallback)(
    (direction) => {
      navigateToCell(direction);
    },
    [navigateToCell]
  );
  // Handle export
  const handleExport = (0, react_1.useCallback)(() => {
    const exported = exportPuzzle();
    if (exported) {
      // Export puzzle to file - exported object contains the puzzle data
      // Create a downloadable file
      const dataStr = JSON.stringify(exported, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      /* c8 ignore next 1 - defensive in depth */
      link.download = `${exported.id ?? 'sudoku-puzzle'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [exportPuzzle]);
  // Handle dual keypad note press (applies to all selected cells)
  const handleKeypadNotePress = (0, react_1.useCallback)(
    (number) => {
      if (selectedCells.length > 0) {
        selectedCells.forEach((cellId) => {
          toggleCellNote(cellId, number);
        });
      }
    },
    [selectedCells, toggleCellNote]
  );
  // Handle dual keypad value press (applies to all selected cells)
  const handleKeypadValuePress = (0, react_1.useCallback)(
    (number) => {
      if (selectedCells.length > 0) {
        selectedCells.forEach((cellId) => {
          updateCellValue(cellId, number);
        });
      }
    },
    [selectedCells, updateCellValue]
  );
  // Handle dual keypad clear notes (applies to all selected cells)
  const handleKeypadClearNotes = (0, react_1.useCallback)(() => {
    if (selectedCells.length > 0) {
      selectedCells.forEach((cellId) => {
        clearCellNotes(cellId);
      });
    }
  }, [selectedCells, clearCellNotes]);
  // Handle dual keypad clear values (applies to all selected cells)
  const handleKeypadClearValues = (0, react_1.useCallback)(() => {
    if (selectedCells.length > 0) {
      selectedCells.forEach((cellId) => {
        updateCellValue(cellId, undefined);
      });
    }
  }, [selectedCells, updateCellValue]);
  // Notify parent of state changes
  (0, react_1.useEffect)(() => {
    if (onStateChange) {
      onStateChange(isValid, isSolved);
    }
  }, [isValid, isSolved, onStateChange]);
  // Notify parent of validation errors
  (0, react_1.useEffect)(() => {
    if (onValidationErrors) {
      onValidationErrors(validationErrors);
    }
  }, [validationErrors, onValidationErrors]);
  // Calculate container classes
  const containerClasses = (0, react_1.useMemo)(() => {
    const classes = ['w-full min-h-screen font-sans'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);
  // Check if we're in mobile mode with visible keypads (side-by-side or stacked)
  const isMobileWithVisibleKeypads = (0, react_1.useMemo)(
    () =>
      /* c8 ignore next 3 - defense in depth */
      responsiveLayout.deviceType === 'mobile' &&
      (responsiveLayout.keypadLayoutMode === 'side-by-side' ||
        responsiveLayout.keypadLayoutMode === 'stacked'),
    [responsiveLayout.deviceType, responsiveLayout.keypadLayoutMode]
  );
  // Determine if we should show traditional input mode toggle - only when keypads are not visible
  const showTraditionalModeToggle =
    responsiveLayout.keypadLayoutMode === 'hidden' || responsiveLayout.keypadLayoutMode === 'overlay';
  // Calculate main container classes - mobile-optimized spacing
  const mainContainerClasses = (0, react_1.useMemo)(() => {
    const classes = ['flex items-start mx-auto'];
    // Optimize spacing for mobile with visible keypads
    if (isMobileWithVisibleKeypads) {
      classes.push('gap-2 p-2');
    } else {
      classes.push('gap-5 p-5');
    }
    // Layout based on device and orientation
    if (responsiveLayout.keypadLayoutMode === 'stacked' && responsiveLayout.orientation === 'landscape') {
      // Landscape: keypads beside grid
      classes.push('flex-row max-w-screen-lg justify-center');
    } else if (responsiveLayout.keypadLayoutMode === 'side-by-side') {
      // Portrait mobile: keypads BELOW grid
      classes.push('flex-col items-center max-w-2xl');
    } else {
      // Default vertical layout
      classes.push('flex-col items-center max-w-2xl');
    }
    return classes.join(' ');
  }, [responsiveLayout.keypadLayoutMode, responsiveLayout.orientation, isMobileWithVisibleKeypads]);
  // Calculate game area classes
  const gameAreaClasses = (0, react_1.useMemo)(() => {
    const classes = ['flex flex-col items-center'];
    // Optimize spacing for mobile with visible keypads
    if (isMobileWithVisibleKeypads) {
      classes.push('gap-2');
    } else {
      classes.push('gap-5');
    }
    if (responsiveLayout.keypadLayoutMode === 'stacked' && responsiveLayout.orientation === 'landscape') {
      classes.push('flex-none');
    } else {
      classes.push('flex-1');
    }
    return classes.join(' ');
  }, [responsiveLayout.keypadLayoutMode, responsiveLayout.orientation, isMobileWithVisibleKeypads]);
  // Show error state if session failed to initialize
  if (error) {
    return react_1.default.createElement(
      'div',
      { className: containerClasses, 'data-testid': 'sudoku-grid-entry-error' },
      react_1.default.createElement(
        'div',
        {
          className:
            'p-5 border border-red-500 rounded-lg bg-red-50 text-red-800 text-center mx-5 my-5 max-w-md'
        },
        react_1.default.createElement('div', { className: 'font-semibold mb-2 text-lg' }, 'Error'),
        react_1.default.createElement('div', { className: 'text-sm leading-relaxed' }, error)
      )
    );
  }
  // Show loading state while session is initializing
  if (!session) {
    return react_1.default.createElement(
      'div',
      { className: containerClasses, 'data-testid': 'sudoku-grid-entry-loading' },
      react_1.default.createElement(
        'div',
        { className: 'p-5 text-center text-gray-600 mx-5 my-5 max-w-md' },
        react_1.default.createElement('div', { className: 'text-lg' }, 'Loading puzzle...')
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: containerClasses, 'data-testid': 'sudoku-grid-entry' },
    react_1.default.createElement(
      'div',
      { className: mainContainerClasses },
      react_1.default.createElement(
        'div',
        { className: gameAreaClasses },
        react_1.default.createElement(
          'div',
          { className: `text-center ${isMobileWithVisibleKeypads ? 'mb-1' : 'mb-3'}` },
          react_1.default.createElement(
            'h2',
            {
              className: `m-0 font-semibold text-gray-900 ${
                isMobileWithVisibleKeypads ? 'mb-1 text-lg' : 'mb-2 text-2xl'
              }`
            },
            session.description
          ),
          session.id &&
            react_1.default.createElement(
              'div',
              { className: `text-gray-600 m-0 ${isMobileWithVisibleKeypads ? 'text-xs' : 'text-sm'}` },
              'ID: ',
              session.id
            )
        ),
        showTraditionalModeToggle &&
          react_1.default.createElement(
            'div',
            {
              className:
                'flex items-center gap-3 p-2 px-4 bg-gray-100 rounded-lg border border-gray-300 sm:flex-row flex-col sm:gap-3 gap-2 sm:p-2 sm:px-4 p-2'
            },
            react_1.default.createElement(
              'span',
              { className: 'text-sm font-semibold text-gray-900 sm:text-sm text-xs' },
              'Input Mode:'
            ),
            react_1.default.createElement(
              'button',
              {
                type: 'button',
                onClick: () => setInputMode('notes'),
                className: `px-3 py-1 border border-gray-300 rounded text-gray-900 text-xs cursor-pointer font-semibold transition-all duration-150 min-h-11 flex items-center justify-center ${
                  inputMode === 'notes'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-50 hover:bg-blue-100 hover:border-blue-500'
                } sm:min-w-40 min-w-30 sm:px-4 px-2`
              },
              '\uD83D\uDCDD Notes (Default)'
            ),
            react_1.default.createElement(
              'button',
              {
                type: 'button',
                onClick: () => setInputMode('value'),
                className: `px-3 py-1 border border-gray-300 rounded text-gray-900 text-xs cursor-pointer font-semibold transition-all duration-150 min-h-11 flex items-center justify-center ${
                  inputMode === 'value'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-50 hover:bg-blue-100 hover:border-blue-500'
                } sm:min-w-40 min-w-30 sm:px-4 px-2`
              },
              '\u270F\uFE0F Values (Hold Shift/Ctrl/Cmd)'
            )
          ),
        react_1.default.createElement(
          'div',
          { className: 'h-6 flex items-center justify-center' },
          selectedCells.length > 1 &&
            react_1.default.createElement(
              'div',
              {
                className:
                  'px-3 py-1 bg-green-50 rounded border border-green-500 text-xs text-green-800 text-center font-normal'
              },
              selectedCells.length,
              ' cells selected - Operations will apply to all selected cells'
            )
        ),
        react_1.default.createElement(SudokuGrid_1.SudokuGrid, {
          numRows: session.numRows,
          numColumns: session.numColumns,
          cells: cellDisplayInfo,
          cages: cageDisplayInfo,
          selectedCell: selectedCell,
          selectedCells: selectedCells,
          inputMode: inputMode,
          puzzleType: initialPuzzleDescription?.type,
          puzzleDimensions: session.puzzle.dimensions,
          onCellSelect: handleCellSelect,
          onLongPressToggle: handleLongPressToggle,
          onCellValueChange: handleCellValueChange,
          onNoteToggle: handleNoteToggle,
          onClearAllNotes: handleClearAllNotes,
          onNavigate: handleNavigate,
          onDragOver: handleDragOver,
          onDragEnd: handleDragEnd,
          isDragging: isDragging
        }),
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          canUndo: canUndo,
          canRedo: canRedo,
          canReset: true,
          isValid: isValid,
          isSolved: isSolved,
          validationErrors: validationErrors,
          onUndo: undo,
          onRedo: redo,
          onReset: reset,
          onExport: handleExport,
          showCombinations: initialPuzzleDescription?.type === 'killer-sudoku',
          canShowCombinations: selectedCage !== null,
          onCombinations: () => setIsCombinationsExplorerOpen(true),
          className: 'mt-3 mb-2'
        }),
        showTraditionalModeToggle &&
          responsiveLayout.deviceType !== 'mobile' &&
          react_1.default.createElement(
            'div',
            {
              className:
                'text-xs text-gray-600 text-center leading-normal max-w-md mx-auto sm:text-xs text-2xs sm:max-w-lg max-w-80'
            },
            react_1.default.createElement(
              'div',
              { className: 'font-semibold mb-1 text-gray-900' },
              'Notes-First Input System:'
            ),
            react_1.default.createElement(
              'div',
              { className: 'mb-0.5' },
              '\u2022 Numbers add/remove notes by default'
            ),
            react_1.default.createElement(
              'div',
              { className: 'mb-0.5' },
              '\u2022 Hold Shift/Ctrl/Cmd + number to place value'
            ),
            react_1.default.createElement(
              'div',
              { className: 'mb-0.5' },
              '\u2022 Double-tap cell to clear all notes'
            ),
            react_1.default.createElement(
              'div',
              { className: 'mb-0.5' },
              '\u2022 Ctrl/Cmd + click to select multiple cells'
            ),
            react_1.default.createElement(
              'div',
              { className: 'mb-0' },
              '\u2022 Smart notes: placing values removes conflicting notes'
            )
          )
      ),
      responsiveLayout.keypadLayoutMode === 'side-by-side' &&
        react_1.default.createElement(DualKeypad_1.DualKeypad, {
          inputMode: inputMode,
          onInputModeChange: setInputMode,
          onNotePress: handleKeypadNotePress,
          onValuePress: handleKeypadValuePress,
          onClearNotes: handleKeypadClearNotes,
          onClearValues: handleKeypadClearValues,
          hasCellSelection: selectedCells.length > 0,
          selectedCellCount: selectedCells.length,
          showOverlayToggle: false
        }),
      responsiveLayout.keypadLayoutMode === 'stacked' &&
        react_1.default.createElement(DualKeypad_1.DualKeypad, {
          inputMode: inputMode,
          onInputModeChange: setInputMode,
          onNotePress: handleKeypadNotePress,
          onValuePress: handleKeypadValuePress,
          onClearNotes: handleKeypadClearNotes,
          onClearValues: handleKeypadClearValues,
          hasCellSelection: selectedCells.length > 0,
          selectedCellCount: selectedCells.length,
          showOverlayToggle: false,
          forceLayoutMode: forceLayoutMode
        })
    ),
    (responsiveLayout.keypadLayoutMode === 'overlay' || responsiveLayout.keypadLayoutMode === 'hidden') &&
      react_1.default.createElement(DualKeypad_1.DualKeypad, {
        inputMode: inputMode,
        onInputModeChange: setInputMode,
        onNotePress: handleKeypadNotePress,
        onValuePress: handleKeypadValuePress,
        onClearNotes: handleKeypadClearNotes,
        onClearValues: handleKeypadClearValues,
        hasCellSelection: selectedCells.length > 0,
        selectedCellCount: selectedCells.length,
        showOverlayToggle: true
      }),
    initialPuzzleDescription?.type === 'killer-sudoku' &&
      selectedCage &&
      react_1.default.createElement(KillerCombinationsExplorer_1.KillerCombinationsExplorer, {
        selectedCage: selectedCage,
        puzzleId: /* c8 ignore next 1 - defense in depth */ initialPuzzleDescription.id ?? 'default',
        isOpen: isCombinationsExplorerOpen,
        onClose: /* c8 ignore next 1 - defense in depth */ () => setIsCombinationsExplorerOpen(false)
      })
  );
};
exports.SudokuGridEntry = SudokuGridEntry;
//# sourceMappingURL=SudokuGridEntry.js.map
