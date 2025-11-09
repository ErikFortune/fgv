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

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('event listener registration', () => {
    test('should register keydown event listener on mount', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should remove event listener on unmount', () => {
      const callback = jest.fn();
      const { unmount } = renderHook(() => useKeyboardShortcut('k', callback));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should re-register listener when dependencies change', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(({ key, callback }) => useKeyboardShortcut(key, callback), {
        initialProps: { key: 'k', callback: callback1 }
      });

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      rerender({ key: 'k', callback: callback2 });

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('basic key matching', () => {
    test('should trigger callback when matching key is pressed', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback));

      const event = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not trigger callback when different key is pressed', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback));

      const event = new KeyboardEvent('keydown', { key: 'j' });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('should be case insensitive for key matching', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback));

      const event1 = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(event1);

      const event2 = new KeyboardEvent('keydown', { key: 'K' });
      window.dispatchEvent(event2);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('should handle special keys like Escape', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('Escape', callback));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('modifier keys', () => {
    test('should trigger with Ctrl modifier when specified', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not trigger without Ctrl when Ctrl is required', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: false });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('should trigger with Meta modifier when specified', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { meta: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not trigger without Meta when Meta is required', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { meta: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: false });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('should trigger with Shift modifier when specified', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { shift: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', shiftKey: true });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not trigger with unwanted modifiers', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true }));

      // Should not trigger with Shift or Meta when only Ctrl is required
      const event1 = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true });
      window.dispatchEvent(event1);

      expect(callback).not.toHaveBeenCalled();

      const event2 = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true });
      window.dispatchEvent(event2);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cross-platform shortcuts', () => {
    test('should support Ctrl+K on Windows/Linux (ctrl and meta both true)', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true, meta: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should support Cmd+K on Mac (ctrl and meta both true)', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true, meta: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not trigger with Shift when ctrl and meta are both true', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true, meta: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('should trigger with only one of Ctrl or Meta when ctrl and meta are both true', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true, meta: true }));

      // Should trigger when only Ctrl is pressed
      const eventCtrl = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      window.dispatchEvent(eventCtrl);

      expect(callback).toHaveBeenCalledTimes(1);

      // Should trigger when only Meta is pressed
      const eventMeta = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      window.dispatchEvent(eventMeta);

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('preventDefault option', () => {
    test('should call preventDefault when option is true', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { preventDefault: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    test('should not call preventDefault when option is false', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { preventDefault: false }));

      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    test('should not call preventDefault when option is undefined', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback));

      const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('multiple combinations', () => {
    test('should handle multiple modifiers together', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true, shift: true }));

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not trigger without all required modifiers', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback, { ctrl: true, shift: true }));

      // Only Ctrl, missing Shift
      const event1 = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      window.dispatchEvent(event1);

      expect(callback).not.toHaveBeenCalled();

      // Only Shift, missing Ctrl
      const event2 = new KeyboardEvent('keydown', { key: 'k', shiftKey: true });
      window.dispatchEvent(event2);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('callback invocation', () => {
    test('should call callback with no arguments', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback));

      const event = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith();
    });

    test('should call callback multiple times for multiple key presses', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('k', callback));

      for (let i = 0; i < 5; i++) {
        const event = new KeyboardEvent('keydown', { key: 'k' });
        window.dispatchEvent(event);
      }

      expect(callback).toHaveBeenCalledTimes(5);
    });

    test('should use updated callback after rerender', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(({ callback }) => useKeyboardShortcut('k', callback), {
        initialProps: { callback: callback1 }
      });

      const event1 = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(event1);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      rerender({ callback: callback2 });

      const event2 = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(event2);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    test('should handle empty string key gracefully', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('', callback));

      const event = new KeyboardEvent('keydown', { key: '' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should handle numeric keys', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('1', callback));

      const event = new KeyboardEvent('keydown', { key: '1' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should handle space key', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut(' ', callback));

      const event = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should handle arrow keys', () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut('ArrowUp', callback));

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    test('should properly clean up event listeners on unmount', () => {
      const callback = jest.fn();
      const { unmount } = renderHook(() => useKeyboardShortcut('k', callback));

      unmount();

      const event = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(event);

      // Callback should not be called after unmount
      expect(callback).not.toHaveBeenCalled();
    });

    test('should clean up old listener when key changes', () => {
      const callback = jest.fn();
      const { rerender } = renderHook(({ key }) => useKeyboardShortcut(key, callback), {
        initialProps: { key: 'k' }
      });

      rerender({ key: 'j' });

      const eventK = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(eventK);

      expect(callback).not.toHaveBeenCalled();

      const eventJ = new KeyboardEvent('keydown', { key: 'j' });
      window.dispatchEvent(eventJ);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
