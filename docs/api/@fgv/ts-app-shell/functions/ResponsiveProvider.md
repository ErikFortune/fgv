[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ResponsiveProvider

# Function: ResponsiveProvider()

> **ResponsiveProvider**(`__namedParameters`): `Element`

Provides responsive layout information to the component tree via context.

Wrap your app (or a subtree) with this provider. Descendants use
[useResponsive](useResponsive.md) to read the current layout mode, device type, etc.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | [`IResponsiveProviderProps`](../interfaces/IResponsiveProviderProps.md) |

## Returns

`Element`

## Example

```tsx
<ResponsiveProvider>
  <App />
</ResponsiveProvider>
```
