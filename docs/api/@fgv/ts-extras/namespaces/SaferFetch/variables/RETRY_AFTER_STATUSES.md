[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / RETRY\_AFTER\_STATUSES

# Variable: RETRY\_AFTER\_STATUSES

> `const` **RETRY\_AFTER\_STATUSES**: `ReadonlyArray`\<`number`\>

Statuses whose `Retry-After` header is honored.

## Remarks

`429` and `503` are the two the header is specified for and the two where it carries real
scheduling information. Honoring it on a `500` would let any failing endpoint dictate the
caller's schedule for no benefit.
