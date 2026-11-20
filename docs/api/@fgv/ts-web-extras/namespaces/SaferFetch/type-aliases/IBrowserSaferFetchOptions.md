[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras](../../../README.md) / [SaferFetch](../README.md) / IBrowserSaferFetchOptions

# Type Alias: IBrowserSaferFetchOptions

> **IBrowserSaferFetchOptions** = [`SaferFetch.ISaferFetchOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)

Options for the browser entry points.

## Remarks

The same options the Node entry points take, including the **required** `addressGuard`. It
stays required here rather than being wired to `allowAnyAddress()` internally, because the
requirement is the primitive's strongest honesty mechanism: a browser call site that reads
`addressGuard: allowAnyAddress()` says out loud that no SSRF guarantee is in force, and a
reviewer greps one identifier to find every such site. Silently supplying the guard would make
a browser call look protected.

`allowAnyAddress()` is the correct choice in a browser almost always. A caller who wants a
genuine URL-zero restriction can write a guard that checks scheme, host and port on the URL it
is handed — `classifyAddress` is exported from `@fgv/ts-extras/safer-fetch` for the IP-literal
case — but no browser guard can resolve a hostname, so none of them closes the gap this
package documents.
