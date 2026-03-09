[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Conversion](../README.md) / Infer

# Type Alias: Infer\<TCONV\>

> **Infer**\<`TCONV`\> = `TCONV` *extends* [`Converter`](../interfaces/Converter.md)\<infer TTO, `unknown`\> ? [`InnerInferredType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TTO`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\> : `never`

Infers the type that will be returned by an instantiated converter. Works
for complex as well as simple types, including nested arrays.

## Type Parameters

| Type Parameter |
| ------ |
| `TCONV` |

## Example

```ts
`Infer<typeof Converters.mapOf(Converters.stringArray)>` is `Map<string, string[]>`
@public
```
