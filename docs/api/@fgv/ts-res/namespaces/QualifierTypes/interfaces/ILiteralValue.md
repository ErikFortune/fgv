[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / ILiteralValue

# Interface: ILiteralValue\<T\>

Describes a single valid literal value including optional parent and child values.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="children"></a> `children?` | `readonly` | readonly `T`[] |
| <a id="name"></a> `name` | `readonly` | `T` |
| <a id="parent"></a> `parent?` | `readonly` | `ILiteralValue`\<`T`\> |
