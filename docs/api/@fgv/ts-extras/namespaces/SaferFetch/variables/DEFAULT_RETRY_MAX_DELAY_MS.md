[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / DEFAULT\_RETRY\_MAX\_DELAY\_MS

# Variable: DEFAULT\_RETRY\_MAX\_DELAY\_MS

> `const` **DEFAULT\_RETRY\_MAX\_DELAY\_MS**: `number` = `5_000`

Default ceiling on a single [retry](../interfaces/IRetryPolicy.md) delay, in milliseconds.

## Remarks

It bounds the computed backoff **and** a server-supplied `Retry-After`. That second role is
the security-relevant one: `Retry-After` is a header an attacker-controlled server chooses
freely, so an unclamped `Retry-After: 86400` is a denial of service on the caller.
