[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ThemeProvider

# Function: ThemeProvider()

> **ThemeProvider**(`__namedParameters`): `Element`

Provides theme context to the application and manages the CSS class on `<html>`.

Wrap your app (or a subtree) with this provider. Components use [useTheme](useTheme.md)
to read or change the active theme.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | [`IThemeProviderProps`](../interfaces/IThemeProviderProps.md) |

## Returns

`Element`

## Example

```tsx
<ThemeProvider initialTheme={settings.appearance?.theme} onThemeChange={saveTheme}>
  <App />
</ThemeProvider>
```
