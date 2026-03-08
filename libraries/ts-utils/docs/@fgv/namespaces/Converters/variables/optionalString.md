[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / optionalString

# Variable: optionalString

> `const` **optionalString**: [`Converter`](../../Conversion/interfaces/Converter.md)\<`string` \| `undefined`, `unknown`\>

A [Converter](../../Conversion/interfaces/Converter.md) which converts an optional `string` value. Values of type
`string` are returned.  Anything else returns [Success](../../../../classes/Success.md) with value `undefined`.
