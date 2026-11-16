[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / allowContentTypes

# Function: allowContentTypes()

> **allowContentTypes**(`types`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResponseHeadersGuard`](../interfaces/IResponseHeadersGuard.md)\>

A response-headers guard that accepts only the listed media types.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `types` | readonly `string`[] | Accepted media types. Must be non-empty. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResponseHeadersGuard`](../interfaces/IResponseHeadersGuard.md)\>

## Remarks

Rejecting on `Content-Type` is strictly cheaper than capping mid-read — a header comparison
instead of a partial body transfer — so a consumer ingesting URLs wants it on every call. It
is also what keeps an HTML error page served with a `200` from being parsed as JSON twenty
frames away from where it went wrong.

Entries are media types, optionally with a wildcard subtype (`text/*`); a wildcard type
requires a wildcard subtype. Matching is case-insensitive and ignores parameters, so
`text/html` accepts `text/html; charset=utf-8`. A response with **no** `Content-Type` is
rejected: an untyped response has not satisfied a content-type allowlist.

Construction is fallible because a malformed entry in a security-adjacent allowlist must be
reported to its author rather than silently compiled into a pattern that never matches.
