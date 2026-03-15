/*
 * Copyright (c) 2026 Erik Fortune
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

/**
 * React context and hooks for the keyboard shortcut registry.
 * @packageDocumentation
 */

import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { KeyboardShortcutRegistry, type IShortcut } from './registry';

// ============================================================================
// Context
// ============================================================================

const KeyboardContext: React.Context<KeyboardShortcutRegistry | undefined> = React.createContext<
  KeyboardShortcutRegistry | undefined
>(undefined);

// ============================================================================
// Provider
// ============================================================================

/**
 * Props for the KeyboardShortcutProvider.
 * @public
 */
export interface IKeyboardShortcutProviderProps {
  readonly children: React.ReactNode;
}

/**
 * Provides a KeyboardShortcutRegistry to the component tree.
 * Should be mounted once at the app root.
 * @public
 */
export function KeyboardShortcutProvider(props: IKeyboardShortcutProviderProps): React.ReactElement {
  const registry = useMemo(() => new KeyboardShortcutRegistry(), []);

  useEffect(() => {
    return (): void => registry.dispose();
  }, [registry]);

  return <KeyboardContext.Provider value={registry}>{props.children}</KeyboardContext.Provider>;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Returns the keyboard shortcut registry.
 * Must be used within a KeyboardShortcutProvider.
 * @public
 */
export function useKeyboardRegistry(): KeyboardShortcutRegistry {
  const ctx = useContext(KeyboardContext);
  if (ctx === undefined) {
    throw new Error('useKeyboardRegistry must be used within a KeyboardShortcutProvider');
  }
  return ctx;
}

/**
 * Registers one or more keyboard shortcuts for the lifetime of the component.
 * Shortcuts are automatically unregistered on unmount.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     binding: { key: 'k', meta: true },
 *     description: 'Open command palette',
 *     handler: () => { setCommandPaletteOpen(true); }
 *   },
 *   {
 *     binding: { key: 'z', meta: true },
 *     description: 'Undo',
 *     handler: () => { workspace.undo(); }
 *   }
 * ]);
 * ```
 *
 * @param shortcuts - Array of shortcuts to register
 * @public
 */
export function useKeyboardShortcuts(shortcuts: ReadonlyArray<IShortcut>): void {
  const registry = useKeyboardRegistry();
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    // Register stable wrapper shortcuts that delegate to the current ref entries.
    // This means the effect only runs when the registry changes or the number of
    // shortcuts changes — not on every render when the array identity changes.
    const registrations = shortcutsRef.current.map((__item, index) =>
      registry.register({
        get binding() {
          return shortcutsRef.current[index]?.binding ?? { key: '' };
        },
        get description() {
          return shortcutsRef.current[index]?.description ?? '';
        },
        get priority() {
          return shortcutsRef.current[index]?.priority;
        },
        handler: (): boolean | void => {
          return shortcutsRef.current[index]?.handler();
        }
      })
    );
    return (): void => {
      for (const reg of registrations) {
        reg.unregister();
      }
    };
    // Re-register only when the registry instance or the number of shortcuts changes.
    // Handler/binding updates are picked up via the ref without re-registration.
  }, [registry, shortcuts.length]);
}
