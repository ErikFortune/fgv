[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Validation](../README.md) / ValidatorFunc

# Type Alias: ValidatorFunc\<T, TC\>

> **ValidatorFunc**\<`T`, `TC`\> = (`from`, `context?`, `self?`) => `boolean` \| [`Failure`](../../../classes/Failure.md)\<`T`\>

Type for a validation function, which validates that a supplied `unknown`
value is a valid value of type `<T>`, possibly as influenced by
an optionally-supplied validation context of type `<TC>`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-tc"></a> `TC` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |
| `context?` | `TC` |
| `self?` | [`Validator`](../interfaces/Validator.md)\<`T`, `TC`\> |

## Returns

`boolean` \| [`Failure`](../../../classes/Failure.md)\<`T`\>
