# @fgv/ts-web-extras

Browser-compatible utilities for the `@fgv/*` family: Web Crypto providers, `FileTree`
implementations over browser storage APIs, URL helpers, and the browser entry points for
`@fgv/ts-extras`'s safer-fetch primitive.

Each of these is the browser half of a cross-runtime interface whose Node half lives in
`@fgv/ts-extras`. Code against the interface; pick the implementation at the composition root.

## Installation

```bash
rush add -p @fgv/ts-web-extras
```

## Contents

| Packlet | What it provides |
|---|---|
| `crypto-utils` | `BrowserCryptoProvider` (Web Crypto implementation of `ICryptoProvider`), `BrowserHashProvider`, `IdbPrivateKeyStorage` (IndexedDB-backed `IPrivateKeyStorage`), and `HpkeProvider` re-exported for browser callers |
| `file-tree` | `FileTree` over the File System Access API, `localStorage`, and an HTTP source |
| `file-api-types` | Types for the File System Access API |
| `helpers` | Browser file-tree convenience helpers |
| `url-utils` | `urlParams` parsing and serialization |
| `safer-fetch` | The browser entry points for the safer-fetch primitive — see below |

## Safer fetch (browser)

```typescript
import { SaferFetch } from '@fgv/ts-web-extras';
import { allowAnyAddress } from '@fgv/ts-extras/safer-fetch';

const result = await SaferFetch.browserSaferFetchJson('https://api.example.com/thing', {
  // Required, with no default — and deliberately still required here. In a browser the honest
  // answer is `allowAnyAddress()`, and spelling it at the call site is what keeps the absence of
  // the guarantee visible to a reviewer instead of implied by a wrapper.
  addressGuard: allowAnyAddress(),
  timeoutMs: 10_000,
  maxResponseBytes: 1024 * 1024
});
```

The runtime-agnostic core lives in `@fgv/ts-extras` and is shared verbatim: the overall and
headers deadlines, the streaming size cap enforced during the read, the content-type gate before
the body is touched, the scheme refusal, the structured failure taxonomy, and retry all behave
here exactly as they do on Node.

### The guarantee table

Reproduced verbatim from `@fgv/ts-extras`'s README. It is the artifact that keeps the primitive
honest, and the right-hand column is the one to read before adopting this package.

| Property | Node (`@fgv/ts-extras/safer-fetch`) | Browser (`@fgv/ts-web-extras`) |
|---|---|---|
| Overall + headers deadline | ✅ | ✅ |
| Streaming size cap, enforced during read | ✅ | ✅ |
| Content-type gate before body read | ✅ | ✅ |
| Structured failure taxonomy | ✅ | ✅ |
| Retry with idempotency + budget rules | ✅ | ✅ |
| Scheme allowlist on URL₀ | ✅ | ✅ |
| Host / port allowlist on URL₀ | ✅ (`blockPrivateNetworks({ allowHosts, allowPorts })`) | ✅ (caller-supplied guard) |
| **Resolved-address (private-IP) guard** | ✅ | ❌ **impossible** — no DNS API |
| **Per-hop revalidation of redirects** | ✅ | ❌ **impossible** — opaque redirect |
| **Credential stripping on cross-origin hop** | ✅ | n/a — platform does it |
| Reject-all-redirects mode | ✅ | ✅ (enforced; surfaces as `'redirect-opaque'`) |
| DNS-rebinding resistance | ❌ **documented limit** | ❌ |

### What this does not protect against

The three absent guarantees are **structural, not unimplemented**. A browser-side `saferFetch`
that accepted an `addressGuard` and quietly did nothing with it would be the worst possible
artifact: it would read at the call site as protection, and reviewers would stop looking.

- **No resolved-address (private-IP) guard.** No browser API returns a hostname's A/AAAA records,
  and nothing in `fetch` or `Response` exposes the peer address. The SSRF check at the heart of
  the Node guard has no inputs here. `allowAnyAddress()` is the honest posture and its name says
  so. A caller can still write a guard that checks scheme, host and port on the URL it is handed
  — `classifyAddress` and the pure policies are exported from `@fgv/ts-extras/safer-fetch` for the
  IP-literal case — but no browser guard can resolve a hostname, so none of them closes this gap.
- **No per-hop revalidation of redirects.** A manual redirect is opaque in a browser: `type` is
  `'opaqueredirect'`, `status` is `0`, and `Location` is not readable. The hop cannot be
  inspected, guarded, or followed. `redirectPolicy: 'validate-each-hop'` is therefore **refused
  at option resolution** with a message naming the runtime, rather than accepted and failed at
  the first redirect — a caller whose URLs happen not to redirect would otherwise ship believing
  per-hop revalidation was in force. `'reject'`, the default, is fully enforced.
- **Credential stripping is the platform's.** Browsers strip credential headers on a cross-origin
  redirect themselves. Since this package never follows a redirect, the core's `sensitiveHeaders`
  machinery never runs here. The guarantee holds; it is simply not this code keeping it.

The browser's real controls are **CORS and network position**, and they are not nothing: a fetch
to `169.254.169.254` from a public origin is already constrained in a way a server-side fetch is
not. They are different controls from the ones the Node guard offers, not weaker versions of them.

**The failure detail is an information-disclosure surface.** Log it; do not echo it, or any
string derived from it, to an untrusted caller.

## Dependencies

- `@fgv/ts-utils` — Result pattern and core primitives (peer)
- `@fgv/ts-extras` — the cross-runtime interfaces this package implements the browser half of
  (peer)
- `@fgv/ts-json-base` — `FileTree` and JSON types (peer)
- `idb-keyval` — IndexedDB access
