[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / Result

# Type Alias: Result\<T\>

> **Result**\<`T`\> = [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> \| [`Failure`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Represents the [result](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) of some operation or sequence of operations.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Remarks

[Success\<T\>](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) and [Failure\<T\>](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) share the common
contract [IResult](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), enabling commingled discriminated usage.
