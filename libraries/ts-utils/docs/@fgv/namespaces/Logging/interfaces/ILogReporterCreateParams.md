[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / ILogReporterCreateParams

# Interface: ILogReporterCreateParams\<T, TD\>

Parameters for creating a [LogReporter](../classes/LogReporter.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="logger"></a> `logger?` | [`ILogger`](ILogger.md) |
| <a id="messageformatter"></a> `messageFormatter?` | [`LogMessageFormatter`](../type-aliases/LogMessageFormatter.md)\<`TD`\> |
| <a id="valueformatter"></a> `valueFormatter?` | [`LogValueFormatter`](../type-aliases/LogValueFormatter.md)\<`T`, `TD`\> |
