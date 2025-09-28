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

import { useRef, useCallback } from 'react';

/**
 * Options for the useLongPress hook
 * @public
 */
export interface IUseLongPressOptions {
  /** Callback to execute on long press */
  readonly onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;

  /** Delay before long press is triggered (ms) */
  readonly delay?: number;

  /** Whether to prevent default behavior during long press */
  readonly shouldPreventDefault?: boolean;
}

/**
 * Result of the useLongPress hook
 * @public
 */
export interface ILongPressHandlers {
  readonly onMouseDown: (event: React.MouseEvent) => void;
  readonly onMouseUp: (event: React.MouseEvent) => boolean;
  readonly onMouseLeave: (event: React.MouseEvent) => void;
  readonly onTouchStart: (event: React.TouchEvent) => void;
  readonly onTouchEnd: (event: React.TouchEvent) => boolean;
}

/**
 * Hook to detect long press gestures on touch and mouse devices
 * @param options - Configuration options for long press detection
 * @returns Event handlers to spread on target element
 * @public
 */
export function useLongPress(options: IUseLongPressOptions): ILongPressHandlers {
  const { onLongPress, delay = 500, shouldPreventDefault = true } = options;

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isLongPressRef = useRef<boolean>(false);
  const eventRef = useRef<React.TouchEvent | React.MouseEvent | undefined>(undefined);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      eventRef.current = event;
      isLongPressRef.current = false;

      if (shouldPreventDefault) {
        event.preventDefault();
      }

      timeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        if (eventRef.current) {
          onLongPress(eventRef.current);
        }
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    isLongPressRef.current = false;
  }, []);

  const end = useCallback(() => {
    cancel();
    return isLongPressRef.current;
  }, [cancel]);

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end
  };
}
