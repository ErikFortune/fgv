[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / DEFAULT\_MAX\_RESPONSE\_BYTES

# Variable: DEFAULT\_MAX\_RESPONSE\_BYTES

> `const` **DEFAULT\_MAX\_RESPONSE\_BYTES**: `number`

Default cap on decoded response bytes (5 MiB) — roughly an order of magnitude above a
realistic JSON API response and well below a size that threatens a Node heap.

## Remarks

Raising it is a per-call option, not a construction-time setting, precisely because real
documents clear this. See `ISaferFetchOptions.maxResponseBytes`.
