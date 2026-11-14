[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / IResultReportOptions

# Interface: IResultReportOptions\<TD\>

Options for reporting a result.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-td"></a> `TD` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-failure"></a> `failure?` | [`MessageLogLevel`](../type-aliases/MessageLogLevel.md) \| [`IMessageReportDetail`](IMessageReportDetail.md)\<`TD`\> | The level of reporting to be used for failure results. Default is 'error'. |
| <a id="property-success"></a> `success?` | [`MessageLogLevel`](../type-aliases/MessageLogLevel.md) \| [`IMessageReportDetail`](IMessageReportDetail.md)\<`TD`\> | The level of reporting to be used for success results. Default is 'quiet'. |
