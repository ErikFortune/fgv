[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Conversion](../README.md) / ObjectConverterOptions

# Interface: ObjectConverterOptions\<T\>

Options for an [ObjectConverter](../classes/ObjectConverter.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `string` | Optional description to be included in error messages. |
| <a id="property-modifier"></a> `modifier?` | `"required"` \| `"partial"` | Optional modifier to apply to the converter. |
| <a id="property-optionalfields"></a> `optionalFields?` | (keyof `T`)[] | If present, lists optional fields. Missing non-optional fields cause an error. |
| <a id="property-strict"></a> `strict?` | `boolean` | If true, unrecognized fields yield an error. If false or undefined (default), unrecognized fields are ignored. |
