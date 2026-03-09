[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / modelSpec

# Variable: modelSpec

> `const` **modelSpec**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ModelSpec`](../type-aliases/ModelSpec.md)\>

Recursive converter for [ModelSpec](../type-aliases/ModelSpec.md).
Accepts a string or an object whose values are themselves ModelSpec values,
with keys constrained to known [ModelSpecKey](../type-aliases/ModelSpecKey.md) values.
Uses the `self` parameter from `Converters.generic` for recursion.
