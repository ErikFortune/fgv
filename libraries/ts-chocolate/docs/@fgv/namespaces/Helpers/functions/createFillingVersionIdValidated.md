[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createFillingVersionIdValidated

# Function: createFillingVersionIdValidated()

> **createFillingVersionIdValidated**(`parts`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:327](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/helpers.ts#L327)

Creates and validates a filling version ID from component parts.
Uses converter to ensure the formatted ID is valid.

## Parameters

### parts

Object with collectionId (FillingId) and itemId (FillingVersionSpec)

#### collectionId

[`FillingId`](../../../../type-aliases/FillingId.md)

#### itemId

[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)\>

Result with validated filling version ID or error
