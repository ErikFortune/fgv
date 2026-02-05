[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / getPreferred

# Function: getPreferred()

> **getPreferred**\<`TOption`, `TId`\>(`collection`): `TOption` \| `undefined`

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:348](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/helpers.ts#L348)

Gets the preferred option from a collection, if one is specified and exists.

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

The preferred option, or undefined if not specified or not found
