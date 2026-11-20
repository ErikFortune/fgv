[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useKeyboardShortcuts

# Function: useKeyboardShortcuts()

> **useKeyboardShortcuts**(`shortcuts`): `void`

Registers one or more keyboard shortcuts for the lifetime of the component.
Shortcuts are automatically unregistered on unmount.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `shortcuts` | readonly [`IShortcut`](../interfaces/IShortcut.md)[] | Array of shortcuts to register |

## Returns

`void`

## Example

```tsx
useKeyboardShortcuts([
  {
    binding: { key: 'k', meta: true },
    description: 'Open command palette',
    handler: () => { setCommandPaletteOpen(true); }
  },
  {
    binding: { key: 'z', meta: true },
    description: 'Undo',
    handler: () => { workspace.undo(); }
  }
]);
```
