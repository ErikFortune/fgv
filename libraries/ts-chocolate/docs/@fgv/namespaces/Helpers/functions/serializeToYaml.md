[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / serializeToYaml

# Function: serializeToYaml()

> **serializeToYaml**\<`T`\>(`data`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:509](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/helpers.ts#L509)

Serialize an object to YAML string.

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

Result containing YAML string or failure
