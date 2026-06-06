[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ISidebarLayoutProps

# Interface: ISidebarLayoutProps

Props for the SidebarLayout component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="children"></a> `children` | `readonly` | `ReactNode` | Main content area |
| <a id="issidebaropen"></a> `isSidebarOpen?` | `readonly` | `boolean` | Whether the sidebar drawer is open (compact/mobile only). |
| <a id="onsidebarclose"></a> `onSidebarClose?` | `readonly` | () => `void` | Called when the drawer should close (backdrop click, etc.). |
| <a id="sidebar"></a> `sidebar` | `readonly` | `ReactNode` | Sidebar content (filter bar, collection section, etc.) |
| <a id="sidebarwidth"></a> `sidebarWidth?` | `readonly` | `string` | Sidebar width in CSS units (default: '280px') |
