[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IThemeContext

# Interface: IThemeContext

Value exposed by ThemeContext.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="availablethemes"></a> `availableThemes` | `readonly` | readonly [`IThemeOption`](IThemeOption.md)[] | All available theme options |
| <a id="isdark"></a> `isDark` | `readonly` | `boolean` | Whether the resolved (effective) appearance is dark |
| <a id="settheme"></a> `setTheme` | `readonly` | (`theme`) => `void` | Set the active theme |
| <a id="theme"></a> `theme` | `readonly` | `string` | The currently active theme ID |
