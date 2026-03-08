[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / shouldLog

# Function: shouldLog()

> **shouldLog**(`message`, `reporter`): `boolean`

Compares two log levels.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | [`MessageLogLevel`](../../../../type-aliases/MessageLogLevel.md) | The first log level. |
| `reporter` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | The second log level. |

## Returns

`boolean`

`true` if the message should be logged, `false` if it should be suppressed.
