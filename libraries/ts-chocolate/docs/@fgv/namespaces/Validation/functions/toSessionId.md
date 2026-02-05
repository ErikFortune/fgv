[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toSessionId

# Function: toSessionId()

> **toSessionId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionId`](../../../../type-aliases/SessionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:475](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L475)

Validates unknown value is a [SessionId](../../../../type-aliases/SessionId.md) (composite).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionId`](../../../../type-aliases/SessionId.md)\>

`Success` with [SessionId](../../../../type-aliases/SessionId.md) or `Failure` with an error
message if validation fails.
