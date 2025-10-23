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

import { useEffect } from 'react';

/**
 * Options for keyboard shortcut configuration
 * @public
 */
export interface IKeyboardShortcutOptions {
  readonly ctrl?: boolean;
  readonly meta?: boolean;
  readonly shift?: boolean;
  readonly preventDefault?: boolean;
}

/**
 * Hook for registering global keyboard shortcuts
 * @param key - The key to listen for (e.g., 'k', 'Escape')
 * @param callback - Function to call when shortcut is activated
 * @param options - Optional modifier keys and behavior
 * @public
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: IKeyboardShortcutOptions
): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const matchesKey = event.key.toLowerCase() === key.toLowerCase();

      // Check modifier keys if specified
      const matchesCtrl = options?.ctrl ? event.ctrlKey : !event.ctrlKey;
      const matchesMeta = options?.meta ? event.metaKey : !event.metaKey;
      const matchesShift = options?.shift ? event.shiftKey : !event.shiftKey;

      // For cross-platform support, treat Ctrl+K on Windows/Linux as Cmd+K on Mac
      const isPlatformShortcut =
        options?.ctrl && options?.meta
          ? (event.ctrlKey || event.metaKey) && !event.shiftKey
          : matchesCtrl && matchesMeta && matchesShift;

      if (matchesKey && isPlatformShortcut) {
        if (options?.preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options]);
}
