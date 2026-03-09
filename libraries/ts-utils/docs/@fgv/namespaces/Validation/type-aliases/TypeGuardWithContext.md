[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validation](../README.md) / TypeGuardWithContext

# Type Alias: TypeGuardWithContext()\<T, TC\>

> **TypeGuardWithContext**\<`T`, `TC`\> = (`from`, `context?`) => `from is T`

A type guard function which validates a specific type, with an optional context
that can be used to shape the validation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |
| `context?` | `TC` |

## Returns

`from is T`
