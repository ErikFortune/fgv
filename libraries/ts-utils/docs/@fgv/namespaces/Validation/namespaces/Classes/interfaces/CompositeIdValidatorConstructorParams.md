[**@fgv/ts-utils**](../../../../../../README.md)

***

[@fgv/ts-utils](../../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / CompositeIdValidatorConstructorParams

# Interface: CompositeIdValidatorConstructorParams\<T, TCOLLECTIONID, TITEMID, TC\>

Parameters used to construct a [StringValidator](../classes/StringValidator.md).

## Extends

- [`ValidatorBaseConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | `string` |
| `TCOLLECTIONID` *extends* `string` | `string` |
| `TITEMID` *extends* `string` | `string` |
| `TC` | `unknown` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="collectionid"></a> `collectionId` | `readonly` | [`Validator`](../../../interfaces/Validator.md)\<`TCOLLECTIONID`, `TC`\> |
| <a id="itemid"></a> `itemId` | `readonly` | [`Validator`](../../../interfaces/Validator.md)\<`TITEMID`, `TC`\> |
| <a id="options"></a> `options?` | `public` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> |
| <a id="separator"></a> `separator` | `readonly` | `string` |
| <a id="traits"></a> `traits?` | `public` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> |
