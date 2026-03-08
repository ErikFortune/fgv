[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / FieldConverters

# Type Alias: FieldConverters\<T, TC\>

> **FieldConverters**\<`T`, `TC`\> = \{ \[key in keyof T\]: Converter\<T\[key\], TC \| unknown\> \| Validator\<T\[key\], TC\> \}

Per-property converters or validators for each of the properties in type T.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Remarks

Used to construct a [ObjectConverter](../classes/ObjectConverter.md)
