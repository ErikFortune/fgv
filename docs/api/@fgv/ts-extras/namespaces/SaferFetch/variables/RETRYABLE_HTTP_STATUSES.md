[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / RETRYABLE\_HTTP\_STATUSES

# Variable: RETRYABLE\_HTTP\_STATUSES

> `const` **RETRYABLE\_HTTP\_STATUSES**: `ReadonlyArray`\<`number`\>

HTTP statuses a [retry policy](../interfaces/IRetryPolicy.md) will retry.

## Remarks

Every other status — including every other 4xx — is terminal. A `401`, a `403` and a `404`
mean the same thing on the second attempt as on the first, and retrying them turns a client
bug into load against a service that already said no.
