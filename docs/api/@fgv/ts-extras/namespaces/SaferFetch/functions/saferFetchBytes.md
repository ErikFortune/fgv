[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / saferFetchBytes

# Function: saferFetchBytes()

> **saferFetchBytes**(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

Fetches a URL and returns the raw response bytes, subject to the scheme check, the address
guard, the request and response guards, the deadlines, and the response size cap.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. Only `http:` and `https:` are ever requested; every other scheme fails as `'invalid-url'`. |
| `options` | [`ISaferFetchOptions`](../interfaces/ISaferFetchOptions.md) | Call options. `addressGuard` is required and has no default — use `blockPrivateNetworks()` on Node, or `allowAnyAddress()` to name the absence of the guarantee at the call site. `maxResponseBytes` defaults to 5 MiB and is meant to be tuned per call: real documents clear that, and raising it for the calls that need it is the intended use, not a workaround. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

## Remarks

**What this does not protect against.** It is not a sandbox: a caller who wants to reach
`127.0.0.1` can call `globalThis.fetch` directly, so this guards untrusted *data*, never
untrusted *code in the same process*. It does no certificate pinning and adds nothing
against a network-position attacker — TLS is that control. It does not resist DNS rebinding:
an address guard validates a resolved address and the transport then re-resolves, so a
hostile resolver can answer the two lookups differently. And it inspects nothing in the
response body. If your deployment has an egress proxy or firewall, that control is strictly
stronger than this one; this is defense in depth for deployments that do not.

**The failure detail is an internal-network scanning oracle.** Log it; do not echo it, or
any string derived from it, to an untrusted caller. The detail is structured precisely so
that mapping it to a coarse public code is trivial.

**Redirects are rejected unless you ask for them.** `redirectPolicy: 'validate-each-hop'`
follows them, runs the address guard on every hop before any connection, and drops credential
headers the first time the chain leaves an origin — and never restores them, so an
`A` → `B` → `A` chain does not hand the token back to `A`.
