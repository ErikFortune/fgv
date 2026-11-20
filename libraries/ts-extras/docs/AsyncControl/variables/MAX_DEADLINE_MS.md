[Home](../../README.md) > [AsyncControl](../README.md) > MAX_DEADLINE_MS

# Variable: MAX_DEADLINE_MS

The largest delay a platform timer honours. `setTimeout` treats anything larger, and
`Infinity`, as about 1 ms, which is why an out-of-range deadline is refused rather than passed on.

## Type

`number`
