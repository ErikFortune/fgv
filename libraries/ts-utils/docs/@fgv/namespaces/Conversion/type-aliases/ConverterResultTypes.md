[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / ConverterResultTypes

# Type Alias: ConverterResultTypes\<T\>

> **ConverterResultTypes**\<`T`\> = `{ [K in keyof T]: T[K] extends Converter<infer R, unknown> ? R : never }`

Helper type to map a tuple of [Converters](../interfaces/Converter.md) to a tuple of their result types.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* readonly [`Converter`](../interfaces/Converter.md)\<`unknown`, `unknown`\>[] |
