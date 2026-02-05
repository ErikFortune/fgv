[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createFillingVersionId

# Function: createFillingVersionId()

> **createFillingVersionId**(`fillingId`, `versionSpec`): [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:258](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/helpers.ts#L258)

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
