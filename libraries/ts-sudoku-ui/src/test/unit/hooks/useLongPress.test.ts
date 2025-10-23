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

import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '../../../hooks/useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    test('should trigger onLongPress after default delay (500ms)', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      // Create mock mouse event
      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      // Start long press
      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Verify callback not called yet
      expect(onLongPress).not.toHaveBeenCalled();

      // Advance time by default delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verify callback was called
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledWith(mouseEvent);
    });

    test('should trigger onLongPress after custom delay', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress, delay: 1000 }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Should not trigger after 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onLongPress).not.toHaveBeenCalled();

      // Should trigger after 1000ms
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    test('should work with touch events', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const touchEvent = {
        preventDefault: jest.fn()
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledWith(touchEvent);
    });
  });

  describe('Prevent Default Behavior', () => {
    test('should call preventDefault when shouldPreventDefault is true (default)', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      expect(mouseEvent.preventDefault).toHaveBeenCalled();
    });

    test('should call preventDefault when shouldPreventDefault is explicitly true', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress, shouldPreventDefault: true }));

      const touchEvent = {
        preventDefault: jest.fn()
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchEvent);
      });

      expect(touchEvent.preventDefault).toHaveBeenCalled();
    });

    test('should not call preventDefault when shouldPreventDefault is false', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress, shouldPreventDefault: false }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      expect(mouseEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Cancellation', () => {
    test('should cancel long press on mouseUp before delay completes', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      // Start long press
      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Release before delay completes
      act(() => {
        jest.advanceTimersByTime(250);
      });

      let wasLongPress: boolean | undefined;
      act(() => {
        wasLongPress = result.current.onMouseUp(mouseEvent);
      });

      // Should not have triggered long press
      expect(wasLongPress).toBe(false);
      expect(onLongPress).not.toHaveBeenCalled();

      // Even after full delay, should not trigger
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onLongPress).not.toHaveBeenCalled();
    });

    test('should cancel long press on mouseLeave', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Mouse leaves before delay completes
      act(() => {
        jest.advanceTimersByTime(250);
        result.current.onMouseLeave(mouseEvent);
      });

      // Should not trigger even after full delay
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onLongPress).not.toHaveBeenCalled();
    });

    test('should cancel long press on touchEnd before delay completes', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const touchEvent = {
        preventDefault: jest.fn()
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchEvent);
      });

      // Touch ends before delay completes
      act(() => {
        jest.advanceTimersByTime(250);
      });

      let wasLongPress: boolean | undefined;
      act(() => {
        wasLongPress = result.current.onTouchEnd(touchEvent);
      });

      expect(wasLongPress).toBe(false);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    test('should handle multiple cancel calls safely', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Cancel multiple times
      act(() => {
        result.current.onMouseLeave(mouseEvent);
        result.current.onMouseLeave(mouseEvent);
        result.current.onMouseUp(mouseEvent);
      });

      // Should not throw and should not trigger callback
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Return Value', () => {
    test('should return true from onMouseUp after long press completes', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Wait for long press to complete
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // onLongPress should have been called
      expect(onLongPress).toHaveBeenCalledTimes(1);

      // end() should return true to indicate long press occurred
      let wasLongPress: boolean | undefined;
      act(() => {
        wasLongPress = result.current.onMouseUp(mouseEvent);
      });

      expect(wasLongPress).toBe(true);
    });

    test('should return false from onMouseUp if cancelled before completion', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Release early
      let wasLongPress: boolean | undefined;
      act(() => {
        wasLongPress = result.current.onMouseUp(mouseEvent);
      });

      expect(wasLongPress).toBe(false);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    test('should return true from onTouchEnd after long press completes', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const touchEvent = {
        preventDefault: jest.fn()
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // onLongPress should have been called
      expect(onLongPress).toHaveBeenCalledTimes(1);

      // Should return true to indicate long press occurred
      let wasLongPress: boolean | undefined;
      act(() => {
        wasLongPress = result.current.onTouchEnd(touchEvent);
      });

      expect(wasLongPress).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid start/cancel cycles', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      // Rapid press and release
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.onMouseDown(mouseEvent);
          jest.advanceTimersByTime(100);
          result.current.onMouseUp(mouseEvent);
        });
      }

      // Should not have triggered
      expect(onLongPress).not.toHaveBeenCalled();

      // Final long press that completes
      act(() => {
        result.current.onMouseDown(mouseEvent);
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    test('should use most recent event in callback', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const firstEvent = {
        preventDefault: jest.fn(),
        target: 'first'
      } as unknown as React.MouseEvent;

      const secondEvent = {
        preventDefault: jest.fn(),
        target: 'second'
      } as unknown as React.MouseEvent;

      // Start with first event
      act(() => {
        result.current.onMouseDown(firstEvent);
      });

      // Quickly cancel and restart with second event
      act(() => {
        result.current.onMouseUp(firstEvent);
        result.current.onMouseDown(secondEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should use second event
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledWith(secondEvent);
    });

    test('should use callback from when start was called (closure behavior)', () => {
      const firstCallback = jest.fn();
      const secondCallback = jest.fn();

      const { result, rerender } = renderHook(({ callback }) => useLongPress({ onLongPress: callback }), {
        initialProps: { callback: firstCallback }
      });

      const mouseEvent = {
        preventDefault: jest.fn()
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.onMouseDown(mouseEvent);
      });

      // Change callback mid-press
      rerender({ callback: secondCallback });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Uses the callback from when start was called (closure captures it)
      expect(firstCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).not.toHaveBeenCalled();
    });
  });
});
