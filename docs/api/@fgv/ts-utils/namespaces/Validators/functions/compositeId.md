[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Validators](../README.md) / compositeId

# Function: compositeId()

> **compositeId**\<`T`, `TCOLLECTIONID`, `TITEMID`, `TC`\>(`params`): [`CompositeIdValidator`](../../Validation/namespaces/Classes/classes/CompositeIdValidator.md)\<`T`, `TCOLLECTIONID`, `TITEMID`, `TC`\>

Helper function to create a [Validator](../../Validation/interfaces/Validator.md) which validates a
strongly-typed composite ID.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* `string` | `string` |
| <a id="type-parameter-tcollectionid"></a> `TCOLLECTIONID` *extends* `string` | `string` |
| <a id="type-parameter-titemid"></a> `TITEMID` *extends* `string` | `string` |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`CompositeIdValidatorConstructorParams`](../../Validation/namespaces/Classes/interfaces/CompositeIdValidatorConstructorParams.md)\<`T`, `TCOLLECTIONID`, `TITEMID`, `TC`\> | [params](../../Validation/namespaces/Classes/interfaces/CompositeIdValidatorConstructorParams.md) used to construct the validator. |

## Returns

[`CompositeIdValidator`](../../Validation/namespaces/Classes/classes/CompositeIdValidator.md)\<`T`, `TCOLLECTIONID`, `TITEMID`, `TC`\>

A new [Validator](../../Validation/interfaces/Validator.md) which validates the desired
composite ID in place.
