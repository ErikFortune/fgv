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
exports.useLongPress = useLongPress;
const react_1 = require('react');
/**
 * Hook to detect long press gestures on touch and mouse devices
 * @param options - Configuration options for long press detection
 * @returns Event handlers to spread on target element
 * @public
 */
function useLongPress(options) {
  const { onLongPress, delay = 500, shouldPreventDefault = true } = options;
  const timeoutRef = (0, react_1.useRef)(undefined);
  const isLongPressRef = (0, react_1.useRef)(false);
  const eventRef = (0, react_1.useRef)(undefined);
  const start = (0, react_1.useCallback)(
    (event) => {
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
  const cancel = (0, react_1.useCallback)(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    isLongPressRef.current = false;
  }, []);
  const end = (0, react_1.useCallback)(() => {
    const wasLongPress = isLongPressRef.current;
    cancel();
    return wasLongPress;
  }, [cancel]);
  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end
  };
}
//# sourceMappingURL=useLongPress.js.map
