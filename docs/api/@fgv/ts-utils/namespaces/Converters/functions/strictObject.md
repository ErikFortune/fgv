[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Converters](../README.md) / strictObject

# Function: strictObject()

**`Internal`**

Concrete implementation for Converters.strictObject(fields, options)
and Converters.strictObject(fields, optional).

## Call Signature

> **strictObject**\<`T`, `TC`\>(`properties`, `options?`): [`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

Helper function to create a [ObjectConverter](../../Conversion/classes/ObjectConverter.md) which converts an object
without changing shape, a [FieldConverters\<T, TC\>](../../Conversion/type-aliases/FieldConverters.md) and an optional
[StrictObjectConverterOptions\<T\>](../type-aliases/StrictObjectConverterOptions.md) to further refine
conversion behavior.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | [`FieldConverters`](../../Conversion/type-aliases/FieldConverters.md)\<`T`, `TC`\> | An object containing defining the shape and converters to be applied. |
| `options?` | [`StrictObjectConverterOptions`](../type-aliases/StrictObjectConverterOptions.md)\<`T`\> | An optional |

### Returns

[`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

A new [ObjectConverter](../../Conversion/classes/ObjectConverter.md) which applies the specified conversions.

### Remarks

Fields that succeed but convert to undefined are omitted from the result object but do not
fail the conversion.

The conversion fails if any unexpected fields are encountered.

### See

StrictObjectConverterOptions<T> containing options for the object converter.

## Call Signature

> **strictObject**\<`T`, `TC`\>(`properties`, `optional`): [`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

Helper function to create a [ObjectConverter](../../Conversion/classes/ObjectConverter.md) which converts an object
without changing shape, a [FieldConverters\<T, TC\>](../../Conversion/type-aliases/FieldConverters.md) and an optional
[StrictObjectConverterOptions\<T\>](../type-aliases/StrictObjectConverterOptions.md) to further refine
conversion behavior.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | [`FieldConverters`](../../Conversion/type-aliases/FieldConverters.md)\<`T`, `TC`\> | An object containing defining the shape and converters to be applied. |
| `optional` | keyof `T`[] | An array of `keyof T` containing keys to be considered optional. |

### Returns

[`ObjectConverter`](../../Conversion/classes/ObjectConverter.md)\<`T`, `TC`\>

A new [ObjectConverter](../../Conversion/classes/ObjectConverter.md) which applies the specified conversions.

### Remarks

Fields that succeed but convert to undefined are omitted from the result object but do not
fail the conversion.

The conversion fails if any unexpected fields are encountered.

### Deprecated

Use Converters.strictObject(options) instead.
