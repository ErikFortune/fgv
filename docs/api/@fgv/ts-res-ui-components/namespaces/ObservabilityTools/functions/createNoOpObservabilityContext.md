[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ObservabilityTools](../README.md) / createNoOpObservabilityContext

# Function: createNoOpObservabilityContext()

> **createNoOpObservabilityContext**(`diagLogLevel`, `userLogLevel`): [`IObservabilityContext`](../interfaces/IObservabilityContext.md)

Creates a no-op observability context that suppresses all logging.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `diagLogLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'silent'` | Log level for diagnostic messages. |
| `userLogLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'silent'` | Log level for user messages. |

## Returns

[`IObservabilityContext`](../interfaces/IObservabilityContext.md)

A new observability context with no-op loggers.
