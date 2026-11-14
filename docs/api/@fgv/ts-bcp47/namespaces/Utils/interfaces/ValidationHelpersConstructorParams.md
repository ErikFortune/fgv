[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Utils](../README.md) / ValidationHelpersConstructorParams

# Interface: ValidationHelpersConstructorParams\<T, TC\>

Initializer for [validation helpers](../classes/ValidationHelpers.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* `string` | - |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-description"></a> `description` | `string` |
| <a id="property-iscanonical"></a> `isCanonical` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> |
| <a id="property-iswellformed"></a> `isWellFormed` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> |
| <a id="property-tocanonical"></a> `toCanonical?` | [`Normalizer`](../type-aliases/Normalizer.md)\<`T`, `TC`\> |
