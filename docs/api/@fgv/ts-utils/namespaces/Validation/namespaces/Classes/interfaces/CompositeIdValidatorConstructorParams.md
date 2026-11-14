[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-utils](../../../../../README.md) / [Validation](../../../README.md) / [Classes](../README.md) / CompositeIdValidatorConstructorParams

# Interface: CompositeIdValidatorConstructorParams\<T, TCOLLECTIONID, TITEMID, TC\>

Parameters used to construct a [StringValidator](../classes/StringValidator.md).

## Extends

- [`ValidatorBaseConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* `string` | `string` |
| <a id="type-parameter-tcollectionid"></a> `TCOLLECTIONID` *extends* `string` | `string` |
| <a id="type-parameter-titemid"></a> `TITEMID` *extends* `string` | `string` |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-collectionid"></a> `collectionId` | `readonly` | [`Validator`](../../../interfaces/Validator.md)\<`TCOLLECTIONID`, `TC`\> | - |
| <a id="property-itemid"></a> `itemId` | `readonly` | [`Validator`](../../../interfaces/Validator.md)\<`TITEMID`, `TC`\> | - |
| <a id="property-options"></a> `options?` | `public` | [`ValidatorOptions`](../../../interfaces/ValidatorOptions.md)\<`TC`\> | - |
| <a id="property-separator"></a> `separator` | `readonly` | `string` | - |
| <a id="property-split"></a> `split?` | `readonly` | `"exact"` \| `"first"` \| `"last"` | How to split the composite ID string. Defaults to `'exact'`; see `CompositeIdSplitMode`. |
| <a id="property-traits"></a> `traits?` | `public` | `Partial`\<[`ValidatorTraits`](../../../classes/ValidatorTraits.md)\> | - |
