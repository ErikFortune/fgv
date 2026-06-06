[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ITabBarProps

# Interface: ITabBarProps\<TTab\>

Props for the TabBar component.

## Type Parameters

| Type Parameter |
| ------ |
| `TTab` *extends* `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="activetab"></a> `activeTab` | `readonly` | `TTab` | Currently active tab |
| <a id="ontabchange"></a> `onTabChange` | `readonly` | (`tab`) => `void` | Callback when a tab is selected |
| <a id="rightcontent"></a> `rightContent?` | `readonly` | `ReactNode` | Optional content pinned to the far right of the tab bar |
| <a id="tabs"></a> `tabs` | `readonly` | readonly [`ITabConfig`](ITabConfig.md)\<`TTab`\>[] | Available tabs |
