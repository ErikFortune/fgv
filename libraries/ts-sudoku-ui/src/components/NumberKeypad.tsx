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

import React, { useCallback, useMemo } from 'react';
import { InputMode } from '../types';

/**
 * Props for the NumberKeypad component
 * @public
 */
export interface INumberKeypadProps {
  /** Type of keypad - affects styling and behavior */
  readonly keypadType: 'notes' | 'values';

  /** Current input mode */
  readonly inputMode: InputMode;

  /** Whether this keypad is currently active */
  readonly isActive: boolean;

  /** Callback when a number is pressed */
  readonly onNumberPress: (number: number) => void;

  /** Callback when clear is pressed */
  readonly onClear: () => void;

  /** Whether the keypad is disabled */
  readonly disabled?: boolean;

  /** Additional CSS class name */
  readonly className?: string;

  /** Compact mode for smaller screens */
  readonly compact?: boolean;
}

/**
 * Reusable number keypad component for sudoku input
 * @public
 */
export const NumberKeypad: React.FC<INumberKeypadProps> = ({
  keypadType,
  inputMode,
  isActive,
  onNumberPress,
  onClear,
  disabled = false,
  className,
  compact = false
}) => {
  // Handle number button press with haptic feedback if available
  const handleNumberPress = useCallback(
    (number: number) => {
      /* c8 ignore next 1 - not reachable in practice */
      if (disabled) return;

      // Trigger haptic feedback on touch devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10); // 10ms vibration
      }

      onNumberPress(number);
    },
    [disabled, onNumberPress]
  );

  // Handle clear button press
  const handleClear = useCallback(() => {
    /* c8 ignore next 1 - not reachable in practice */
    if (disabled) return;

    // Trigger haptic feedback on touch devices
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // 15ms vibration for clear
    }

    onClear();
  }, [disabled, onClear]);

  // Calculate keypad classes
  const keypadClasses = useMemo(() => {
    const classes = ['bg-white border border-gray-300 rounded-lg p-3 flex flex-col gap-3'];

    // Keypad type specific styles
    if (keypadType === 'notes') {
      classes.push('border-blue-500');
    } else {
      classes.push('border-green-500');
    }

    // Active/inactive styles
    if (isActive) {
      classes.push('shadow-md');
    } else {
      classes.push('opacity-75');
    }

    // Compact mode
    if (compact) {
      classes.push('p-2 gap-2');
    }

    // Disabled state
    if (disabled) {
      classes.push('opacity-50 pointer-events-none');
    }

    if (className) classes.push(className);

    return classes.join(' ');
  }, [keypadType, isActive, disabled, className, compact]);

  // Calculate title and button classes
  const titleClasses = useMemo(() => {
    const classes = ['text-center font-semibold text-gray-800'];

    if (isActive) {
      classes.push('text-gray-900');
    } else {
      classes.push('text-gray-600');
    }

    if (compact) {
      classes.push('text-sm');
    } else {
      classes.push('text-base');
    }

    return classes.join(' ');
  }, [isActive, compact]);

  const buttonClasses = useMemo(() => {
    const classes = [
      'border-2',
      'rounded-lg',
      'font-bold',
      'transition-all',
      'duration-150',
      'flex',
      'items-center',
      'justify-center',
      'touch-manipulation'
    ];

    if (compact) {
      classes.push('w-8', 'h-8', 'text-sm');
    } else {
      classes.push('w-12', 'h-12', 'text-lg');
    }

    if (isActive) {
      classes.push('bg-blue-500', 'text-white', 'border-blue-600', 'hover:bg-blue-600', 'active:bg-blue-700');
    } else {
      classes.push('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-200');
    }

    if (disabled) {
      classes.push('opacity-50', 'cursor-not-allowed');
    } else {
      classes.push('cursor-pointer');
    }

    return classes.join(' ');
  }, [compact, isActive, disabled]);

  const clearButtonClasses = useMemo(() => {
    const classes = [
      'border-2',
      'rounded-lg',
      'font-bold',
      'transition-all',
      'duration-150',
      'flex',
      'items-center',
      'justify-center',
      'touch-manipulation',
      'col-span-2'
    ];

    if (compact) {
      classes.push('h-8', 'text-sm');
    } else {
      classes.push('h-12', 'text-lg');
    }

    if (isActive) {
      classes.push('bg-red-500', 'text-white', 'border-red-600', 'hover:bg-red-600', 'active:bg-red-700');
    } else {
      classes.push('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-200');
    }

    if (disabled) {
      classes.push('opacity-50', 'cursor-not-allowed');
    } else {
      classes.push('cursor-pointer');
    }

    return classes.join(' ');
  }, [compact, isActive, disabled]);

  const gridClasses = useMemo(() => {
    const classes = ['grid grid-cols-3 auto-rows-fr'];

    if (compact) {
      classes.push('gap-1');
    } else {
      classes.push('gap-2');
    }

    return classes.join(' ');
  }, [compact]);

  // Keypad title
  const title = keypadType === 'notes' ? '📝 Notes' : '✏️ Values';

  return (
    <div
      className={keypadClasses}
      role="grid"
      aria-label={`${keypadType} number keypad`}
      data-testid={`number-keypad-${keypadType}`}
    >
      {/* Keypad title */}
      <div className={titleClasses}>{title}</div>

      {/* Number grid */}
      <div className={gridClasses} role="grid">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => handleNumberPress(number)}
            disabled={disabled}
            className={buttonClasses}
            aria-label={`Enter ${number} ${keypadType === 'notes' ? 'as note' : 'as value'}`}
            data-testid={`keypad-${keypadType}-${number}`}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus on click
          >
            {number}
          </button>
        ))}

        {/* Clear button spanning 2 columns */}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={clearButtonClasses}
          aria-label={`Clear ${keypadType}`}
          data-testid={`keypad-${keypadType}-clear`}
          onMouseDown={(e) => e.preventDefault()} // Prevent focus on click
        >
          Clear
        </button>
      </div>
    </div>
  );
};
