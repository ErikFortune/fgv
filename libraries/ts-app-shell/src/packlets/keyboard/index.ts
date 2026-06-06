/**
 * Keyboard shortcut packlet - registry, context, and hooks.
 * @packageDocumentation
 */

export {
  type IKeyBinding,
  type IShortcut,
  type IShortcutRegistration,
  KeyboardShortcutRegistry,
  matchesBinding
} from './registry';

export {
  type IKeyboardShortcutProviderProps,
  KeyboardShortcutProvider,
  useKeyboardRegistry,
  useKeyboardShortcuts
} from './useKeyboardShortcuts';
