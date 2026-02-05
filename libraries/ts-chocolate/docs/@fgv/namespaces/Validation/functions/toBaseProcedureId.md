[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toBaseProcedureId

# Function: toBaseProcedureId()

> **toBaseProcedureId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseProcedureId`](../../../../type-aliases/BaseProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:193](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L193)

Validates unknown value is a [BaseProcedureId](../../../../type-aliases/BaseProcedureId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseProcedureId`](../../../../type-aliases/BaseProcedureId.md)\>

`Success` with [BaseProcedureId](../../../../type-aliases/BaseProcedureId.md) or `Failure` with an error
message if validation fails.
