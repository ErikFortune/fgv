[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras](../../../README.md) / [SaferFetch](../README.md) / browserSaferFetchBytes

# Function: browserSaferFetchBytes()

> **browserSaferFetchBytes**(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

Fetches a URL in a browser and returns the raw response bytes.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. Only `http:` and `https:` are ever requested. |
| `options` | [`ISaferFetchOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) | Call options. `addressGuard` is required and has no default — use `allowAnyAddress()` to name the absence of the guarantee at the call site. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

## Remarks

The runtime-agnostic half of `@fgv/ts-extras`'s safer-fetch primitive, wired for the browser
and refusing the options the browser cannot honor. The deadlines, the streaming size cap, the
content-type gate, the scheme refusal, the failure taxonomy and retry all behave exactly as
they do on Node.

**What this does not protect against — the three gaps are structural, not unimplemented.**

- **No resolved-address (private-IP) guard.** No browser API returns a hostname's A/AAAA
  records and nothing in `fetch` or `Response` exposes the peer address, so the SSRF check at
  the heart of the Node guard has no inputs here. `allowAnyAddress()` is the honest posture
  and its name says so.
- **No per-hop revalidation of redirects.** A manual redirect is opaque in a browser, so the
  hop cannot be inspected, guarded, or followed. `'validate-each-hop'` is refused up front
  rather than degraded; `'reject'` — the default — is fully enforced.
- **Credential stripping is the platform's.** Browsers strip credential headers on a
  cross-origin redirect themselves. Since this package never follows a redirect, the
  `sensitiveHeaders` machinery in the core never runs here; the guarantee holds, but it is not
  this code keeping it.

The browser's real controls are CORS and network position, and they are not nothing: a fetch
to `169.254.169.254` from a public origin is already constrained in a way a server-side fetch
is not. They are simply different controls from the ones the Node guard offers.

**The failure detail is an information-disclosure surface.** Log it; do not echo it, or any
string derived from it, to an untrusted caller.
