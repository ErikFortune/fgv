[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / getPreferredIdOrFirst

# Function: getPreferredIdOrFirst()

> **getPreferredIdOrFirst**\<`TId`\>(`collection`): `TId` \| `undefined`

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:395](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/helpers.ts#L395)

Gets the preferred ID from a simple ID collection, falling back to the first ID.

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

The preferred ID, or the first ID, or undefined if empty
