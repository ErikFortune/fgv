[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ObservabilityTools](../README.md) / createConsoleObservabilityContext

# Function: createConsoleObservabilityContext()

> **createConsoleObservabilityContext**(`diagLogLevel`, `userLogLevel`): [`IObservabilityContext`](../interfaces/IObservabilityContext.md)

Creates a console-based observability context for development and debugging.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `diagLogLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'info'` | Log level for diagnostic messages. |
| `userLogLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'info'` | Log level for user messages. |

## Returns

[`IObservabilityContext`](../interfaces/IObservabilityContext.md)

A new observability context with console loggers.
