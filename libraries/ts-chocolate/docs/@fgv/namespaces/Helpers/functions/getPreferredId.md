[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / getPreferredId

# Function: getPreferredId()

> **getPreferredId**\<`TId`\>(`collection`): `TId` \| `undefined`

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:380](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/helpers.ts#L380)

Gets the preferred ID from a simple ID collection, if specified and valid.

## Type Parameters

### TId

`TId` *extends* `string`

The ID type

## Parameters

### collection

[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>

The IDs collection

## Returns

`TId` \| `undefined`

The preferred ID if it exists in the collection, otherwise undefined
