[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IModeSelectorProps

# Interface: IModeSelectorProps\<TMode\>

Props for the ModeSelector component.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tmode"></a> `TMode` *extends* `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-activemode"></a> `activeMode` | `readonly` | `TMode` | Currently active mode |
| <a id="property-modes"></a> `modes` | `readonly` | readonly [`IModeConfig`](IModeConfig.md)\<`TMode`\>[] | Available modes |
| <a id="property-onmenutoggle"></a> `onMenuToggle?` | `readonly` | () => `void` | Optional callback to toggle sidebar drawer (shows hamburger icon when provided). |
| <a id="property-onmodechange"></a> `onModeChange` | `readonly` | (`mode`) => `void` | Callback when a mode is selected |
| <a id="property-rightcontent"></a> `rightContent?` | `readonly` | `ReactNode` | Optional right-side content (e.g., settings gear icon) |
| <a id="property-title"></a> `title` | `readonly` | `string` | Application title |
