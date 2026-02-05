[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createFillingVersionId

# Function: createFillingVersionId()

> **createFillingVersionId**(`fillingId`, `versionSpec`): [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:258](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/helpers.ts#L258)

Creates a composite FillingVersionId from filling ID and version spec

## Parameters

### fillingId

[`FillingId`](../../../../type-aliases/FillingId.md)

The filling identifier

### versionSpec

[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

The version specifier

## Returns

[`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Composite filling version ID in format "fillingId@versionSpec"
