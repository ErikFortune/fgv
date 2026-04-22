[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Conversion](../README.md) / ConverterResultType

# Type Alias: ConverterResultType\<C\>

> **ConverterResultType**\<`C`\> = `C` *extends* [`Converter`](../interfaces/Converter.md)\<infer T, `unknown`\> ? `T` : `never`

Helper type to extract the result type from a [Converter](../interfaces/Converter.md).
For simple single-level extraction. For complex nested types, use [Infer](Infer.md).

## Type Parameters

| Type Parameter |
| ------ |
| `C` |
