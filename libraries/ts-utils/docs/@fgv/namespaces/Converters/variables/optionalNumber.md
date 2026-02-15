[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / optionalNumber

# Variable: optionalNumber

> `const` **optionalNumber**: [`Converter`](../../Conversion/interfaces/Converter.md)\<`number` \| `undefined`, `unknown`\>

A [Converter](../../Conversion/interfaces/Converter.md) which converts an optional `number` value.

## Remarks

Values of type `number` or numeric strings are converted and returned.
Anything else returns [Success](../../../../classes/Success.md) with value `undefined`.
