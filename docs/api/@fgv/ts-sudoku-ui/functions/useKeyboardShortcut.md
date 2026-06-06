[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / useKeyboardShortcut

# Function: useKeyboardShortcut()

> **useKeyboardShortcut**(`key`, `callback`, `options?`): `void`

Hook for registering global keyboard shortcuts

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to listen for (e.g., 'k', 'Escape') |
| `callback` | () => `void` | Function to call when shortcut is activated |
| `options?` | [`IKeyboardShortcutOptions`](../interfaces/IKeyboardShortcutOptions.md) | Optional modifier keys and behavior |

## Returns

`void`
