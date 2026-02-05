[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / getPreferredOrFirst

# Function: getPreferredOrFirst()

> **getPreferredOrFirst**\<`TOption`, `TId`\>(`collection`): `TOption` \| `undefined`

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:366](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/helpers.ts#L366)

Gets the preferred option from a collection, falling back to the first option.

## Type Parameters

### TOption

`TOption` *extends* [`IHasId`](../../Model/interfaces/IHasId.md)\<`TId`\>

The option object type

### TId

`TId` *extends* `string`

The ID type

## Parameters

### collection

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<`TOption`, `TId`\>

The options collection

## Returns

`TOption` \| `undefined`

The preferred option, or the first option, or undefined if empty
