[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Logging](../README.md) / ILogReporterCreateParams

# Interface: ILogReporterCreateParams\<T, TD\>

Parameters for creating a [LogReporter](../classes/LogReporter.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | - |
| <a id="type-parameter-td"></a> `TD` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-logger"></a> `logger?` | [`ILogger`](ILogger.md) |
| <a id="property-messageformatter"></a> `messageFormatter?` | [`LogMessageFormatter`](../type-aliases/LogMessageFormatter.md)\<`TD`\> |
| <a id="property-valueformatter"></a> `valueFormatter?` | [`LogValueFormatter`](../type-aliases/LogValueFormatter.md)\<`T`, `TD`\> |
