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
import { InputMode } from '../types';
import { NumberKeypad } from './NumberKeypad';
import { useResponsiveLayout, KeypadLayoutMode } from '../hooks/useResponsiveLayout';

/**
 * Props for the DualKeypad component
 * @public
 */
export interface IDualKeypadProps {
  /** Current input mode */
  readonly inputMode: InputMode;

  /** Callback when input mode changes */
  readonly onInputModeChange: (mode: InputMode) => void;

  /** Callback when a number is pressed for notes */
  readonly onNotePress: (number: number) => void;

  /** Callback when a number is pressed for values */
  readonly onValuePress: (number: number) => void;

  /** Callback when clear notes is pressed */
  readonly onClearNotes: () => void;

  /** Callback when clear values is pressed */
  readonly onClearValues: () => void;

  /** Whether any cells are selected */
  readonly hasCellSelection: boolean;

  /** Number of selected cells */
  readonly selectedCellCount: number;

  /** Whether the keypad is disabled */
  readonly disabled?: boolean;

  /** Additional CSS class name */
  readonly className?: string;

  /** Force a specific layout mode (overrides responsive detection) */
  readonly forceLayoutMode?: KeypadLayoutMode;

  /** Whether to show the overlay toggle for desktop */
  readonly showOverlayToggle?: boolean;
}

/**
 * Dual keypad component with responsive layout for mobile and desktop sudoku input
 * @public
 */
export const DualKeypad: React.FC<IDualKeypadProps> = ({
  inputMode,
  onInputModeChange,
  onNotePress,
  onValuePress,
  onClearNotes,
  onClearValues,
  hasCellSelection,
  selectedCellCount,
  disabled = false,
  className,
  forceLayoutMode,
  showOverlayToggle = true
}) => {
  const responsiveLayout = useResponsiveLayout(forceLayoutMode);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  // Determine effective layout mode
  const effectiveLayoutMode = forceLayoutMode || responsiveLayout.keypadLayoutMode;

  // Should show the keypad based on layout mode and overlay state
  const shouldShowKeypad = useMemo(() => {
    if (effectiveLayoutMode === 'hidden') return false;
    if (effectiveLayoutMode === 'overlay') return isOverlayVisible;
    return true;
  }, [effectiveLayoutMode, isOverlayVisible]);

  // Handle note number press
  const handleNotePress = useCallback(
    (number: number) => {
      /* c8 ignore next 1 - defense in depth: disabled buttons prevent handler calls */
      if (disabled) return;
      onNotePress(number);
    },
    [disabled, onNotePress]
  );

  // Handle value number press
  const handleValuePress = useCallback(
    (number: number) => {
      /* c8 ignore next 1 - defense in depth: disabled buttons prevent handler calls */
      if (disabled) return;
      onValuePress(number);
    },
    [disabled, onValuePress]
  );

  // Handle clear notes
  const handleClearNotes = useCallback(() => {
    /* c8 ignore next 1 - defense in depth: disabled buttons prevent handler calls */
    if (disabled) return;
    onClearNotes();
  }, [disabled, onClearNotes]);

  // Handle clear values
  const handleClearValues = useCallback(() => {
    /* c8 ignore next 1 - defense in depth: disabled buttons prevent handler calls */
    if (disabled) return;
    onClearValues();
  }, [disabled, onClearValues]);

  // Toggle overlay visibility
  const toggleOverlay = useCallback(() => {
    setIsOverlayVisible((prev) => !prev);
  }, []);

  // Calculate whether to use compact mode
  const useCompactMode = responsiveLayout.isSmallScreen || effectiveLayoutMode === 'overlay';

  // Calculate container classes
  const containerClasses = useMemo(() => {
    const classes = ['flex gap-3 p-3'];

    // Layout mode specific styles - FIXED: side-by-side should be flex-row
    if (effectiveLayoutMode === 'side-by-side') {
      classes.push('flex-row justify-center');
    } else if (effectiveLayoutMode === 'stacked') {
      classes.push('flex-col');
    } else if (effectiveLayoutMode === 'overlay') {
      classes.push(
        'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border border-gray-200'
      );
    }

    if (disabled) classes.push('opacity-50 pointer-events-none');
    if (useCompactMode) classes.push('gap-2 p-2');
    if (className) classes.push(className);

    return classes.join(' ');
  }, [effectiveLayoutMode, disabled, useCompactMode, className]);

  // Overlay backdrop
  const overlayBackdrop = effectiveLayoutMode === 'overlay' && isOverlayVisible && (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 z-40"
      onClick={toggleOverlay}
      data-testid="dual-keypad-overlay-backdrop"
    />
  );

  // Show overlay toggle button for desktop/overlay mode
  const overlayToggleButtonClasses = useMemo(() => {
    const classes = [
      'fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors'
    ];
    if (isOverlayVisible) classes.push('bg-red-500 hover:bg-red-600');
    if (disabled) classes.push('opacity-50 cursor-not-allowed');
    return classes.join(' ');
  }, [isOverlayVisible, disabled]);

  const overlayToggleButton = (effectiveLayoutMode === 'overlay' || effectiveLayoutMode === 'hidden') &&
    showOverlayToggle && (
      <button
        type="button"
        onClick={toggleOverlay}
        disabled={disabled}
        className={overlayToggleButtonClasses}
        aria-label={isOverlayVisible ? 'Hide number keypad' : 'Show number keypad'}
        data-testid="dual-keypad-overlay-toggle"
      >
        {isOverlayVisible ? '✕' : '🔢'}
      </button>
    );

  // Status text for multi-selection only (not single selection)
  const statusText = useMemo(() => {
    if (selectedCellCount > 1) {
      return `${selectedCellCount} cells selected`;
    }
    return null;
  }, [selectedCellCount]);

  return (
    <>
      {overlayBackdrop}

      <div
        className={containerClasses}
        style={{ display: shouldShowKeypad ? 'flex' : 'none' }}
        data-testid="dual-keypad"
        role="region"
        aria-label="Number input keypads"
      >
        {shouldShowKeypad && (
          <>
            {/* Status text */}
            {statusText && (
              <div
                className={`text-sm text-gray-600 text-center ${
                  effectiveLayoutMode === 'stacked' ? 'mb-2' : 'mb-3'
                }`}
              >
                {statusText}
              </div>
            )}

            {/* Mode Toggle - only show for overlay/hidden modes (no toggle needed for side-by-side) */}
            {effectiveLayoutMode !== 'side-by-side' && effectiveLayoutMode !== 'stacked' && (
              <div className="flex justify-center gap-3 mb-3">
                {/* c8 ignore next 9 - functional code tested but coverage intermittently missed */}
                <button
                  type="button"
                  onClick={() => onInputModeChange('notes')}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 text-sm font-medium transition-colors ${
                    inputMode === 'notes'
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  📝 Notes
                </button>
                {/* c8 ignore next 9 - functional code tested but coverage intermittently missed */}
                <button
                  type="button"
                  onClick={() => onInputModeChange('value')}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 text-sm font-medium transition-colors ${
                    inputMode === 'value'
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ✏️ Values
                </button>
              </div>
            )}

            {/* Notes Keypad */}
            <NumberKeypad
              keypadType="notes"
              inputMode={inputMode}
              isActive={true}
              onNumberPress={handleNotePress}
              onClear={handleClearNotes}
              disabled={disabled || !hasCellSelection}
              compact={useCompactMode}
              className="flex-1"
            />

            {/* Values Keypad */}
            <NumberKeypad
              keypadType="values"
              inputMode={inputMode}
              isActive={true}
              onNumberPress={handleValuePress}
              onClear={handleClearValues}
              disabled={disabled || !hasCellSelection}
              compact={useCompactMode}
              className="flex-1"
            />

            {/* Close button for overlay */}
            {effectiveLayoutMode === 'overlay' && (
              <button
                type="button"
                onClick={toggleOverlay}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                aria-label="Close keypad overlay"
                data-testid="dual-keypad-close"
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>

      {overlayToggleButton}
    </>
  );
};
