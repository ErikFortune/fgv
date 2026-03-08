[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / IResultReportOptions

# Interface: IResultReportOptions\<TD\>

Options for reporting a result.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TD` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="failure"></a> `failure?` | [`MessageLogLevel`](../type-aliases/MessageLogLevel.md) \| [`IMessageReportDetail`](IMessageReportDetail.md)\<`TD`\> | The level of reporting to be used for failure results. Default is 'error'. |
| <a id="success"></a> `success?` | [`MessageLogLevel`](../type-aliases/MessageLogLevel.md) \| [`IMessageReportDetail`](IMessageReportDetail.md)\<`TD`\> | The level of reporting to be used for success results. Default is 'quiet'. |
