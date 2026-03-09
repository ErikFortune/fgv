[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / Result

# Type Alias: Result\<T\>

> **Result**\<`T`\> = [`Success`](../classes/Success.md)\<`T`\> \| [`Failure`](../classes/Failure.md)\<`T`\>

Represents the [result](../interfaces/IResult.md) of some operation or sequence of operations.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Remarks

[Success\<T\>](../classes/Success.md) and [Failure\<T\>](../classes/Failure.md) share the common
contract [IResult](../interfaces/IResult.md), enabling commingled discriminated usage.
