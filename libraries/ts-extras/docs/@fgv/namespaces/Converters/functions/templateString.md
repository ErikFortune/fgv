[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Converters](../README.md) / templateString

# Function: templateString()

> **templateString**(`defaultContext?`): [`StringConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `unknown`\>

Helper function to create a `StringConverter` which converts
`unknown` to `string`, applying template conversions supplied at construction time or at
runtime as context.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `defaultContext?` | `unknown` | Optional default context to use for template values. |

## Returns

[`StringConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `unknown`\>

A new `Converter` returning `string`.

## Remarks

Template conversions are applied using `mustache` syntax.
