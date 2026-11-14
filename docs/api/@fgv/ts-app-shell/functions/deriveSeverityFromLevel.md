[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / deriveSeverityFromLevel

# Function: deriveSeverityFromLevel()

> **deriveSeverityFromLevel**(`level`): [`MessageSeverity`](../type-aliases/MessageSeverity.md)

Derives a display [MessageSeverity](../type-aliases/MessageSeverity.md) from a canonical
@fgv/ts-utils#MessageLogLevel \| log level, used when a message carries no explicit
`severity` styling override. `'success'` is never derived — it is a UI-only affordance.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The canonical log level. |

## Returns

[`MessageSeverity`](../type-aliases/MessageSeverity.md)

The styling severity to use for display.
