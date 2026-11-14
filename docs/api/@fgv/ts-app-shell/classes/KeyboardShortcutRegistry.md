[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / KeyboardShortcutRegistry

# Class: KeyboardShortcutRegistry

Centralized keyboard shortcut registry.

Components register shortcuts via `register()` and receive a handle
to unregister when they unmount. The registry attaches a single global
keydown listener that dispatches to the highest-priority matching handler.

## Constructors

### Constructor

> **new KeyboardShortcutRegistry**(): `KeyboardShortcutRegistry`

#### Returns

`KeyboardShortcutRegistry`

## Methods

### dispatch()

> **dispatch**(`event`): `boolean`

Dispatches a keyboard event to the highest-priority matching handler.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | `KeyboardEvent` | The keyboard event |

#### Returns

`boolean`

true if a handler consumed the event

***

### dispose()

> **dispose**(): `void`

Removes all shortcuts and the global listener.

#### Returns

`void`

***

### getAll()

> **getAll**(): readonly [`IShortcut`](../interfaces/IShortcut.md)[]

Returns all currently registered shortcuts (for command palette / help display).

#### Returns

readonly [`IShortcut`](../interfaces/IShortcut.md)[]

***

### register()

> **register**(`shortcut`): [`IShortcutRegistration`](../interfaces/IShortcutRegistration.md)

Registers a keyboard shortcut.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `shortcut` | [`IShortcut`](../interfaces/IShortcut.md) | The shortcut to register |

#### Returns

[`IShortcutRegistration`](../interfaces/IShortcutRegistration.md)

A registration handle with an `unregister()` method
