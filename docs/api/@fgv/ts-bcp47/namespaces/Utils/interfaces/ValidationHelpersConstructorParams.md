[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Utils](../README.md) / ValidationHelpersConstructorParams

# Interface: ValidationHelpersConstructorParams\<T, TC\>

Initializer for [validation helpers](../classes/ValidationHelpers.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | - |
| `TC` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="description"></a> `description` | `string` |
| <a id="iscanonical"></a> `isCanonical` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> |
| <a id="iswellformed"></a> `isWellFormed` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> |
| <a id="tocanonical"></a> `toCanonical?` | [`Normalizer`](../type-aliases/Normalizer.md)\<`T`, `TC`\> |
