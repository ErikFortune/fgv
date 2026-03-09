[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / TransformObjectOptions

# Interface: TransformObjectOptions\<TSRC\>

Options for a [Converters.transformObject](../functions/transformObject.md) call.

## Type Parameters

| Type Parameter |
| ------ |
| `TSRC` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="description"></a> `description?` | `string` | An optional description of this transform to be used for error messages. |
| <a id="ignore"></a> `ignore?` | keyof `TSRC`[] | An optional list of source properties to be ignored when strict mode is enabled. |
| <a id="strict"></a> `strict` | `true` | If `strict` is `true` then unused properties in the source object cause an error, otherwise they are ignored. |
