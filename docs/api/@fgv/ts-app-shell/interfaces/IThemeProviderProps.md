[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IThemeProviderProps

# Interface: IThemeProviderProps

Props for [ThemeProvider](../functions/ThemeProvider.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="children"></a> `children` | `readonly` | `ReactNode` | Children |
| <a id="customthemes"></a> `customThemes?` | `readonly` | readonly [`IThemeOption`](IThemeOption.md)[] | Additional custom themes beyond the built-in light/dark/system. |
| <a id="initialtheme"></a> `initialTheme?` | `readonly` | `string` | Initial theme ID (typically from persisted settings). Defaults to 'light'. |
| <a id="onthemechange"></a> `onThemeChange?` | `readonly` | (`theme`) => `void` | Called when the user changes the theme. Use this to persist the choice. |
