[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IModeSelectorProps

# Interface: IModeSelectorProps\<TMode\>

Props for the ModeSelector component.

## Type Parameters

| Type Parameter |
| ------ |
| `TMode` *extends* `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="activemode"></a> `activeMode` | `readonly` | `TMode` | Currently active mode |
| <a id="modes"></a> `modes` | `readonly` | readonly [`IModeConfig`](IModeConfig.md)\<`TMode`\>[] | Available modes |
| <a id="onmenutoggle"></a> `onMenuToggle?` | `readonly` | () => `void` | Optional callback to toggle sidebar drawer (shows hamburger icon when provided). |
| <a id="onmodechange"></a> `onModeChange` | `readonly` | (`mode`) => `void` | Callback when a mode is selected |
| <a id="rightcontent"></a> `rightContent?` | `readonly` | `ReactNode` | Optional right-side content (e.g., settings gear icon) |
| <a id="title"></a> `title` | `readonly` | `string` | Application title |
