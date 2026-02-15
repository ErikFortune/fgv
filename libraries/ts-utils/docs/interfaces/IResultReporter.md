[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / IResultReporter

# Interface: IResultReporter\<T, TD\>

Interface for reporting a result.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` | `unknown` |

## Methods

### reportFailure()

> **reportFailure**(`level`, `message`, `detail?`): `void`

Reports a failed result at the specified log level.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `level` | [`MessageLogLevel`](../type-aliases/MessageLogLevel.md) |
| `message` | `string` |
| `detail?` | `TD` |

#### Returns

`void`

***

### reportSuccess()

> **reportSuccess**(`level`, `value`, `detail?`, `message?`): `void`

Reports a successful result at the specified log level.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `level` | [`MessageLogLevel`](../type-aliases/MessageLogLevel.md) |
| `value` | `T` |
| `detail?` | `TD` |
| `message?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`TD`\> |

#### Returns

`void`
