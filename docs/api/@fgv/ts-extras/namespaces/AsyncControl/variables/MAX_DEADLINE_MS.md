[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / MAX\_DEADLINE\_MS

# Variable: MAX\_DEADLINE\_MS

> `const` **MAX\_DEADLINE\_MS**: `number` = `2147483647`

The largest delay a platform timer honours. `setTimeout` treats anything larger, and
`Infinity`, as about 1 ms, which is why an out-of-range deadline is refused rather than passed on.
