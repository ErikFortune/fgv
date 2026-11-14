[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / DEFAULT\_RESULT\_CONCURRENCY

# Variable: DEFAULT\_RESULT\_CONCURRENCY

> `const` **DEFAULT\_RESULT\_CONCURRENCY**: `number` = `8`

The default maximum number of operations which the asynchronous members of this family
will allow in flight at once, used when [IAsyncResultOptions.concurrency](../interfaces/IAsyncResultOptions.md#property-concurrency) is not
supplied.

## Remarks

The default is deliberately finite - an unbounded default would reproduce the exact problem
these helpers exist to prevent for any caller who does not think about it. Callers can read
and reference this value rather than guessing at it.
