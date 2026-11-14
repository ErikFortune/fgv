[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Logging](../README.md) / stringifyLogValue

# Function: stringifyLogValue()

> **stringifyLogValue**(`value`, `maxLength?`): `string`

Stringifies an arbitrary value for logging. Never throws.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to stringify. |
| `maxLength?` | `number` | The maximum length of the stringified value. |

## Returns

`string`

The stringified value.

## Remarks

A string is returned as is, and anything else as `String(value)` unless that is
`"[object Object]"` or throws. Those are rendered with [formatValueForMessage](../../../functions/formatValueForMessage.md) — the
`JSON.stringify` text, with a cycle as `"[Circular]"`, a `BigInt` as `"123n"` and an unreadable
member as `[Unreadable]` — and cut to `maxLength` with `...`. A value whose rendering is nothing
at all (a throwing or empty `toJSON`) falls back to `"[object Object]"`.
