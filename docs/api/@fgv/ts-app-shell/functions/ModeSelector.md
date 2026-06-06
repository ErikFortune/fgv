[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ModeSelector

# Function: ModeSelector()

> **ModeSelector**\<`TMode`\>(`props`): `ReactElement`

Top-level mode selector bar.
Renders the application title, mode toggle buttons, and optional right-side content.
When [onMenuToggle](../interfaces/IModeSelectorProps.md#onmenutoggle) is provided, a hamburger
menu button is shown at the left edge (for compact/mobile layouts).

## Type Parameters

| Type Parameter |
| ------ |
| `TMode` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`IModeSelectorProps`](../interfaces/IModeSelectorProps.md)\<`TMode`\> |

## Returns

`ReactElement`
