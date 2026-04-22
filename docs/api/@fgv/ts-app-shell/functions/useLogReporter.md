[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useLogReporter

# Function: useLogReporter()

> **useLogReporter**(`options?`): [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

React hook that creates a @fgv/ts-utils#Logging.LogReporter \| LogReporter
backed by the MessagesContext.

The returned reporter implements both `ILogger` and `IResultReporter<unknown>`,
so it can be used with `Result.report()` and direct logging calls.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IUseLogReporterOptions`](../interfaces/IUseLogReporterOptions.md) | Optional configuration |

## Returns

[`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

A LogReporter that routes messages into the toast/log system
