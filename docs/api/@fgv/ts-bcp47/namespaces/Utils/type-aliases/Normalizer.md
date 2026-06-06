[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Utils](../README.md) / Normalizer

# Type Alias: Normalizer()\<T, TC\>

> **Normalizer**\<`T`, `TC`\> = (`val`, `context?`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

A function which accepts a value of the expected type and reformats it to match
the canonical presentation form.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `val` | `T` |
| `context?` | `TC` |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>
