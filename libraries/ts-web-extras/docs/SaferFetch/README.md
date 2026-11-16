[Home](../README.md) > SaferFetch

# Namespace: SaferFetch

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

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IBrowserSaferFetchJsonOptions](./interfaces/IBrowserSaferFetchJsonOptions.md)

</td><td>

Options for the validating form of `browserSaferFetchJson`.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IBrowserSaferFetchOptions](./type-aliases/IBrowserSaferFetchOptions.md)

</td><td>

Options for the browser entry points.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[browserSaferFetchBytes](./functions/browserSaferFetchBytes.md)

</td><td>

Fetches a URL in a browser and returns the raw response bytes.

</td></tr>
<tr><td>

[browserSaferFetchJson](./functions/browserSaferFetchJson.md)

</td><td>

Fetches a URL in a browser and parses the response body as JSON, yielding the raw `JsonValue`.

</td></tr>
<tr><td>

[browserSaferFetchText](./functions/browserSaferFetchText.md)

</td><td>

Fetches a URL in a browser and decodes the response body as text.

</td></tr>
</tbody></table>
