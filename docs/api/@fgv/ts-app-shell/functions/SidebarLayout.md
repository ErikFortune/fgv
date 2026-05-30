[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / SidebarLayout

# Function: SidebarLayout()

> **SidebarLayout**(`props`): `ReactElement`

Layout component that renders a persistent left sidebar alongside a main content area.

On `full` layout mode, the sidebar is a fixed-width panel.
On `compact` and `mobile` layout modes, the sidebar becomes a slide-out drawer
controlled by [isSidebarOpen](../interfaces/ISidebarLayoutProps.md#issidebaropen) and
[onSidebarClose](../interfaces/ISidebarLayoutProps.md#onsidebarclose).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`ISidebarLayoutProps`](../interfaces/ISidebarLayoutProps.md) |

## Returns

`ReactElement`
