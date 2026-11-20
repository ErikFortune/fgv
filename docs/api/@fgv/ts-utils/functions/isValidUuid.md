[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / isValidUuid

# Function: isValidUuid()

> **isValidUuid**(`value`): `value is Uuid`

Type guard that returns `true` when the input is a canonical UUIDv4 string.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string to test. |

## Returns

`value is Uuid`

`true` if `value` is a canonical UUIDv4, narrowing it to [Uuid](../type-aliases/Uuid.md).
