[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / IResultLogger

# Interface: IResultLogger\<TD\>

Simple logger interface used by [orThrow(logger)](IResult.md#orthrow) and [orThrow(formatter)](IResult.md#orthrow).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TD` | `unknown` |

## Methods

### error()

> **error**(`message`, `detail?`): `void`

Log an error message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The message to be logged. |
| `detail?` | `TD` | - |

#### Returns

`void`
