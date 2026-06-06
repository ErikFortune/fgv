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
 * Keyboard shortcut registry infrastructure.
 *
 * Provides a centralized registry for keyboard shortcuts with:
 * - Modifier-aware key matching (Cmd/Ctrl, Shift, Alt)
 * - Priority-based handler resolution (higher priority wins)
 * - React hook for component-scoped shortcut registration
 * - Global listener that dispatches to registered handlers
 *
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Describes a keyboard shortcut binding.
 * @public
 */
export interface IKeyBinding {
  /** The key (e.g., 'k', 'z', 'Escape'). Case-insensitive. */
  readonly key: string;
  /** Require Cmd (Mac) / Ctrl (Windows/Linux) */
  readonly meta?: boolean;
  /** Require Shift */
  readonly shift?: boolean;
  /** Require Alt/Option */
  readonly alt?: boolean;
}

/**
 * A registered keyboard shortcut.
 * @public
 */
export interface IShortcut {
  /** The key binding */
  readonly binding: IKeyBinding;
  /** Human-readable description (for command palette / help) */
  readonly description: string;
  /** Handler function. Return true to indicate the event was handled. */
  readonly handler: () => boolean | void;
  /** Priority (higher wins when multiple shortcuts match). Default: 0 */
  readonly priority?: number;
}

/**
 * A registration handle returned when a shortcut is registered.
 * Call `unregister()` to remove the shortcut.
 * @public
 */
export interface IShortcutRegistration {
  readonly unregister: () => void;
}

// ============================================================================
// Key Matching
// ============================================================================

/**
 * Tests whether a keyboard event matches a key binding.
 * @param event - The keyboard event
 * @param binding - The binding to match against
 * @returns true if the event matches
 * @public
 */
export function matchesBinding(event: KeyboardEvent, binding: IKeyBinding): boolean {
  const keyMatch = event.key.toLowerCase() === binding.key.toLowerCase();
  const metaMatch = (binding.meta ?? false) === (event.metaKey || event.ctrlKey);
  const shiftMatch = (binding.shift ?? false) === event.shiftKey;
  const altMatch = (binding.alt ?? false) === event.altKey;
  return keyMatch && metaMatch && shiftMatch && altMatch;
}

// ============================================================================
// Registry
// ============================================================================

/**
 * Centralized keyboard shortcut registry.
 *
 * Components register shortcuts via `register()` and receive a handle
 * to unregister when they unmount. The registry attaches a single global
 * keydown listener that dispatches to the highest-priority matching handler.
 *
 * @public
 */
export class KeyboardShortcutRegistry {
  private readonly _shortcuts: Map<string, IShortcut> = new Map();
  private _listener: ((e: KeyboardEvent) => void) | undefined;
  private _nextId: number = 0;

  /**
   * Registers a keyboard shortcut.
   * @param shortcut - The shortcut to register
   * @returns A registration handle with an `unregister()` method
   */
  public register(shortcut: IShortcut): IShortcutRegistration {
    const id = `ks-${++this._nextId}`;
    this._shortcuts.set(id, shortcut);
    this._ensureListener();

    return {
      unregister: (): void => {
        this._shortcuts.delete(id);
        if (this._shortcuts.size === 0) {
          this._removeListener();
        }
      }
    };
  }

  /**
   * Returns all currently registered shortcuts (for command palette / help display).
   */
  public getAll(): ReadonlyArray<IShortcut> {
    return Array.from(this._shortcuts.values());
  }

  /**
   * Dispatches a keyboard event to the highest-priority matching handler.
   * @param event - The keyboard event
   * @returns true if a handler consumed the event
   */
  public dispatch(event: KeyboardEvent): boolean {
    // Skip if the event target is an input/textarea/contenteditable
    const target = event.target as HTMLElement | null;
    if (target) {
      const tagName = target.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
        return false;
      }
    }

    // Find all matching shortcuts, sorted by priority (highest first)
    const matches = Array.from(this._shortcuts.values())
      .filter((s) => matchesBinding(event, s.binding))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const shortcut of matches) {
      const result = shortcut.handler();
      if (result !== false) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }

    return false;
  }

  /**
   * Removes all shortcuts and the global listener.
   */
  public dispose(): void {
    this._shortcuts.clear();
    this._removeListener();
  }

  private _ensureListener(): void {
    if (this._listener) {
      return;
    }
    this._listener = (e: KeyboardEvent): void => {
      this.dispatch(e);
    };
    document.addEventListener('keydown', this._listener);
  }

  private _removeListener(): void {
    if (this._listener) {
      document.removeEventListener('keydown', this._listener);
      this._listener = undefined;
    }
  }
}
