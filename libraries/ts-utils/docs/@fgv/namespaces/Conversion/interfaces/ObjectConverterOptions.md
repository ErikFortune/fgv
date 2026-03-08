[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / ObjectConverterOptions

# Interface: ObjectConverterOptions\<T\>

Options for an [ObjectConverter](../classes/ObjectConverter.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="description"></a> `description?` | `string` | Optional description to be included in error messages. |
| <a id="modifier"></a> `modifier?` | `"required"` \| `"partial"` | Optional modifier to apply to the converter. |
| <a id="optionalfields"></a> `optionalFields?` | keyof `T`[] | If present, lists optional fields. Missing non-optional fields cause an error. |
| <a id="strict"></a> `strict?` | `boolean` | If true, unrecognized fields yield an error. If false or undefined (default), unrecognized fields are ignored. |
