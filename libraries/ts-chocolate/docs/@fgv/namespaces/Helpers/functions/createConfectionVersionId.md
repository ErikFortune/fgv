[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createConfectionVersionId

# Function: createConfectionVersionId()

> **createConfectionVersionId**(`parts`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:302](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/helpers.ts#L302)

Creates and validates a confection version ID from component parts.
Uses converter to ensure the formatted ID is valid.

## Parameters

### parts

Object with collectionId (ConfectionId) and itemId (ConfectionVersionSpec)

#### collectionId

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

#### itemId

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)\>

Result with validated confection version ID or error
