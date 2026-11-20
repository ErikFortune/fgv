[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IStatusBarProps

# Interface: IStatusBarProps

Props for the StatusBar component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-defaultexpanded"></a> `defaultExpanded?` | `readonly` | `boolean` | Whether the panel is expanded on mount. Defaults to `false` (collapsed). |
| <a id="property-initialfilterlevel"></a> `initialFilterLevel?` | `readonly` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Initial filter level for the log panel. Defaults to 'all'. |
| <a id="property-maxexpandedheight"></a> `maxExpandedHeight?` | `readonly` | `string` | Maximum height of the expanded panel as a CSS length (e.g. `'40vh'`, `'320px'`). The panel is bounded to this height on both desktop and mobile; the message list scrolls within the bound while the header and filter controls stay fixed. Defaults to `'40vh'`. |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`IMessage`](IMessage.md)[] | - |
| <a id="property-onclear"></a> `onClear` | `readonly` | () => `void` | - |
