[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / FieldTransformers

# Type Alias: FieldTransformers\<TSRC, TDEST, TC\>

> **FieldTransformers**\<`TSRC`, `TDEST`, `TC`\> = \{ \[key in keyof TDEST\]: \{ converter: Converter\<TDEST\[key\], TC\> \| Validator\<TDEST\[key\], TC\>; from: keyof TSRC; optional?: boolean \} \}

Per-property converters and configuration for each field in the destination object of
a [Converters.transformObject](../functions/transformObject.md) call.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TSRC` | - |
| `TDEST` | - |
| `TC` | `unknown` |
