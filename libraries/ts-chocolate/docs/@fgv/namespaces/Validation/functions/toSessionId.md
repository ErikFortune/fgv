[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toSessionId

# Function: toSessionId()

> **toSessionId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionId`](../../../../type-aliases/SessionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:475](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/validation.ts#L475)

Validates unknown value is a [SessionId](../../../../type-aliases/SessionId.md) (composite).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SessionId`](../../../../type-aliases/SessionId.md)\>

`Success` with [SessionId](../../../../type-aliases/SessionId.md) or `Failure` with an error
message if validation fails.
