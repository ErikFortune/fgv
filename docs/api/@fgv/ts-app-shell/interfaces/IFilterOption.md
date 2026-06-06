[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IFilterOption

# Interface: IFilterOption\<TValue\>

A single selectable filter option.
Generic over the value type so apps can use string IDs, enums, etc.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="count"></a> `count?` | `readonly` | `number` | Optional count badge |
| <a id="label"></a> `label` | `readonly` | `string` | Display label |
| <a id="value"></a> `value` | `readonly` | `TValue` | Unique value for this option |
