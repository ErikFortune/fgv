[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / ConverterResultType

# Type Alias: ConverterResultType\<C\>

> **ConverterResultType**\<`C`\> = `C` *extends* [`Converter`](../interfaces/Converter.md)\<infer T, `unknown`\> ? [`T`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) : `never`

Helper type to extract the result type from a [Converter](../interfaces/Converter.md).
For simple single-level extraction. For complex nested types, use [Infer](Infer.md).

## Type Parameters

| Type Parameter |
| ------ |
| `C` |
