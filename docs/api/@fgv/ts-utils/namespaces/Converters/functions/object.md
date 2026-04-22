[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Converters](../README.md) / object

# Function: object()

**`Internal`**

Concrete implementation of Converters.(object:1) \| Converters.object(fields, options)
and Converters.(object:2) \| Converters.objects(fields, optionalKeys).

## Call Signature

> **object**\<`T`, `TC`\>(`properties`, `options?`): [`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

Helper function to create a [ObjectConverter\<T, TC\>](../../Conversion/classes/ObjectConverter.md) which converts an object
without changing shape, given a [FieldConverters\<T, TC\>](../../Conversion/type-aliases/FieldConverters.md) and an optional
[ObjectConverterOptions\<T\>](../../Conversion/interfaces/ObjectConverterOptions.md) to further refine conversion behavior.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | [`FieldConverters`](../../Conversion/type-aliases/FieldConverters.md)\<`T`, `TC`\> | An [FieldConverters\<T, TC\>](../../Conversion/type-aliases/FieldConverters.md) defining the shape of the source object and [converters](../../Conversion/interfaces/Converter.md) to be applied to each properties. |
| `options?` | [`ObjectConverterOptions`](../../Conversion/interfaces/ObjectConverterOptions.md)\<`T`\> | An [ObjectConverterOptions\<T\>](../../Conversion/interfaces/ObjectConverterOptions.md) containing options for the object converter. |

### Returns

[`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

A new [ObjectConverter](../../Conversion/classes/ObjectConverter.md) which applies the specified conversions.

### Remarks

By default, if all of the requested fields exist and can be converted, returns [Success](../../../classes/Success.md)
with a new object that contains the converted values under the original key names.  If any required properties
do not exist or cannot be converted, the entire conversion fails, returning [Failure](../../../classes/Failure.md) with additional
error information.

Fields that succeed but convert to undefined are omitted from the result object but do not
fail the conversion.

## Call Signature

> **object**\<`T`, `TC`\>(`properties`, `optional`): [`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

Helper function to create a [ObjectConverter\<T, TC\>](../../Conversion/classes/ObjectConverter.md) which converts an object
without changing shape, given a [FieldConverters\<T, TC\>](../../Conversion/type-aliases/FieldConverters.md) and a set of
optional properties.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | [`FieldConverters`](../../Conversion/type-aliases/FieldConverters.md)\<`T`, `TC`\> | An [FieldConverters\<T, TC\>](../../Conversion/type-aliases/FieldConverters.md) defining the shape of the source object and [converters](../../Conversion/interfaces/Converter.md) to be applied to each properties. |
| `optional` | keyof `T`[] | An array of `(keyof T)` listing the keys to be considered optional. |

### Returns

[`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

A new [ObjectConverter](../../Conversion/classes/ObjectConverter.md) which applies the specified conversions.

### Remarks

By default, if all of the requested fields exist and can be converted, returns [Success](../../../classes/Success.md)
with a new object that contains the converted values under the original key names.  If any required properties
do not exist or cannot be converted, the entire conversion fails, returning [Failure](../../../classes/Failure.md) with additional
error information.

Fields that succeed but convert to undefined are omitted from the result object but do not
fail the conversion.

### Deprecated

Use Converters.(object:1) \| Converters.object(fields, options) instead.
