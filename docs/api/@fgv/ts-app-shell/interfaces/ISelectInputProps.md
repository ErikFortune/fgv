[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ISelectInputProps

# Interface: ISelectInputProps\<T\>

Props for the SelectInput component.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="onchange"></a> `onChange` | `readonly` | (`value`) => `void` | Called when selection changes |
| <a id="options"></a> `options` | `readonly` | readonly `T`[] | Available options |
| <a id="value"></a> `value` | `readonly` | `T` | Currently selected value |
