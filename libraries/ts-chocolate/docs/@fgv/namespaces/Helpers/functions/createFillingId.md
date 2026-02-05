[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createFillingId

# Function: createFillingId()

> **createFillingId**(`collectionId`, `baseId`): [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:122](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/helpers.ts#L122)

Creates a composite FillingId from collection ID and base ID

## Parameters

### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection identifier

### baseId

[`BaseFillingId`](../../../../type-aliases/BaseFillingId.md)

The base filling identifier

## Returns

[`FillingId`](../../../../type-aliases/FillingId.md)

Composite filling ID in format "collectionId.baseId"
