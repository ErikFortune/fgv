[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / SaferFetchRedirectPolicy

# Type Alias: SaferFetchRedirectPolicy

> **SaferFetchRedirectPolicy** = `"reject"` \| `"validate-each-hop"`

How redirects are handled.

## Remarks

`'reject'` fails on any redirect status. It is the default, and the only mode with an
equivalent guarantee on every runtime — a browser cannot inspect a redirect hop at all, so a
per-hop revalidating mode is not implementable there.

The *guarantee* is equivalent on both runtimes; the failure **reason** is not. Every call uses
`redirect: 'manual'`, so on Node a rejected redirect surfaces as `'redirect-rejected'` carrying
the status, while in a browser the response is opaque — `type` is `'opaqueredirect'` and
`status` is `0`, so there is no status to report — and the same redirect surfaces as
`'redirect-opaque'`. Callers that branch on the reason under `'reject'` must handle both.

`'validate-each-hop'` follows redirects with `redirect: 'manual'` and runs the **full address
guard on every hop before any connection is made**, resolving `Location` against the hop that
sent it. Redirect handling and the address check are one mechanism, not two: a guard that
validated only the caller's URL is defeated by a single `302` to `http://169.254.169.254/`.
Following hops also makes this primitive responsible for credential stripping — see
`ISaferFetchOptions.sensitiveHeaders`.

**`'validate-each-hop'` is accepted by the browser barrel but cannot succeed there, and fails
loudly rather than degrading.** The type is shared because one core serves both runtimes; the
runtime is not. A browser's `redirect: 'manual'` yields an opaque response — `type` is
`'opaqueredirect'`, `status` is `0`, and `Location` is not readable — so the first redirect
fails as `'redirect-opaque'`. That is the honest outcome: the hop information does not exist
on the browser side of the API, so there is nothing to guard and nothing to follow. Use
`'reject'` there, or handle `'redirect-opaque'`.

A mode that defers to the platform's own redirect following is deliberately absent on Node:
it would put hops on the wire that the guard never saw.
