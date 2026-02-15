[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / DiscriminatedObjectConverters

# Type Alias: DiscriminatedObjectConverters\<T, TD, TC\>

> **DiscriminatedObjectConverters**\<`T`, `TD`, `TC`\> = `Record`\<`TD`, [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\>\>

A string-keyed `Record<string, Converter>` which maps specific [converters](../../Conversion/interfaces/Converter.md) or
[Validators](../../Validation/interfaces/Validator.md) to the value of a discriminator property.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` *extends* `string` | `string` |
| `TC` | `unknown` |
