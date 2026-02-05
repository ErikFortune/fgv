[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / parseSessionId

# Function: parseSessionId()

> **parseSessionId**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ParsedSessionId`](../../Converters/type-aliases/ParsedSessionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:223](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/helpers.ts#L223)

Parses a composite [SessionId](../../../../type-aliases/SessionId.md) into its component parts

## Parameters

### id

[`SessionId`](../../../../type-aliases/SessionId.md)

The composite session ID to parse

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ParsedSessionId`](../../Converters/type-aliases/ParsedSessionId.md)\>

Result with parsed composite ID or error
