[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useResponsiveLayout

# Function: useResponsiveLayout()

> **useResponsiveLayout**(`forceLayoutMode?`): [`IResponsiveLayout`](../interfaces/IResponsiveLayout.md)

Hook that tracks responsive layout information for the current viewport.

Listens to `resize` and `orientationchange` events and recomputes layout
on every change. Use the `layoutMode` field to drive structural rendering
decisions (e.g., sidebar as drawer vs. fixed panel).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `forceLayoutMode?` | [`LayoutMode`](../type-aliases/LayoutMode.md) | Optional override for testing or storybook use. |

## Returns

[`IResponsiveLayout`](../interfaces/IResponsiveLayout.md)
