[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IDEMPOTENT\_METHODS

# Variable: IDEMPOTENT\_METHODS

> `const` **IDEMPOTENT\_METHODS**: `ReadonlyArray`\<`string`\>

Methods retried without an explicit opt-in.

## Remarks

A timeout does not tell you whether the server processed the request, so a retried `POST`
can double-charge. `retryNonIdempotent` opts out, per call, visibly.
