[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_errorMessage

# Function: \_errorMessage()

> **\_errorMessage**(`err`): `string`

**`Internal`**

Extracts a message string from an unknown thrown/rejected value. Total: an `Error` whose
`message` is not a string is converted to text, and a value whose inspection or conversion to
text throws (a throwing `message` accessor or `toString`, or a Proxy trap) yields fixed text
instead, so a capture never throws while reporting a failure.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `err` | `unknown` | The caught error value. |

## Returns

`string`

The error message string.
