[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validation](../README.md) / Constraint

# Type Alias: Constraint()\<T\>

> **Constraint**\<`T`\> = (`val`) => `boolean` \| [`Failure`](../../../../classes/Failure.md)\<`T`\>

A Constraint\<T\> function returns
`true` if the supplied value meets the constraint. Can return
[Failure](../../../../classes/Failure.md) with an error message or simply return `false`
for a default message.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `val` | `T` |

## Returns

`boolean` \| [`Failure`](../../../../classes/Failure.md)\<`T`\>
