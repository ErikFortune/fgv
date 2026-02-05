[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / serializeToJson

# Function: serializeToJson()

> **serializeToJson**\<`T`\>(`data`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:528](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/helpers.ts#L528)

Serialize an object to JSON string.

## Type Parameters

### T

`T`

## Parameters

### data

`T`

Object to serialize

### options?

[`ISerializationOptions`](../interfaces/ISerializationOptions.md)

Optional serialization options

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing JSON string or failure
