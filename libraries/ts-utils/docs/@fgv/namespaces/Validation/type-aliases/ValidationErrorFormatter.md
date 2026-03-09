[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validation](../README.md) / ValidationErrorFormatter

# Type Alias: ValidationErrorFormatter()\<TC\>

> **ValidationErrorFormatter**\<`TC`\> = (`val`, `message?`, `context?`) => `string`

Formats an incoming error message and value that failed validation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `unknown` | The value that failed validation. |
| `message?` | `string` | The default error message, if any. |
| `context?` | `TC` | Optional validation context. |

## Returns

`string`

The formatted error message.
