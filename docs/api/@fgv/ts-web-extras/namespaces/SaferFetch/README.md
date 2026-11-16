[**@fgv Monorepo API Documentation**](../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../README.md) / [@fgv/ts-web-extras](../../README.md) / SaferFetch

# SaferFetch

The browser entry points for `@fgv/ts-extras`'s safer-fetch primitive.

The runtime-agnostic core lives in `@fgv/ts-extras` and is shared verbatim: the overall and
headers deadlines, the streaming size cap enforced during the read, the content-type gate
before the body is touched, the scheme refusal, the structured failure taxonomy, and retry all
behave here exactly as they do on Node.

**Three guarantees are absent, and the reasons are structural.** There is no resolved-address
(private-IP) guard, because no browser API returns a hostname's A/AAAA records and nothing in
`fetch` or `Response` exposes the peer address. There is no per-hop revalidation of redirects,
because a manual redirect is opaque — no readable `Location`, `status` of `0`. And credential
stripping on a cross-origin hop is the platform's doing rather than this code's, since this
package never follows a redirect. See the README's guarantee table, which states the whole
per-runtime split in one place.

This package **states** those gaps rather than degrading quietly around them:
`redirectPolicy: 'validate-each-hop'` is refused at option resolution with a message naming
the runtime, not accepted and failed at the first redirect. And `addressGuard` stays required,
so a browser call site spells `allowAnyAddress()` and a reviewer can grep for it.

## Interfaces

- [IBrowserSaferFetchJsonOptions](interfaces/IBrowserSaferFetchJsonOptions.md)

## Type Aliases

- [IBrowserSaferFetchOptions](type-aliases/IBrowserSaferFetchOptions.md)

## Functions

- [browserSaferFetchBytes](functions/browserSaferFetchBytes.md)
- [browserSaferFetchJson](functions/browserSaferFetchJson.md)
- [browserSaferFetchText](functions/browserSaferFetchText.md)
