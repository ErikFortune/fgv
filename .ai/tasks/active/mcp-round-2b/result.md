# mcp-round-2b — result

Guarded MCP egress (personaility#672) and OAuth (personaility#677). Branch `mcp-round-2b`, cut from
`integration/asks` at `42b5822b` (brief commit `b11d387e`).

## What shipped

### #672 — a streaming guarded fetch, and MCP egress through it

- **`@fgv/ts-extras` safer-fetch: `createGuardedFetch(options): Result<GuardedFetch>`**, exported from
  both barrels with `GuardedFetch`, `IGuardedFetchOptions` and `GuardedFetchError`.
  - `GuardedFetch` is `(url: string | URL, init?: RequestInit) => Promise<Response>`, structurally the
    SDK's `FetchLike`.
  - Every call runs the **same hop walk** as the buffered entry points (commit 1 made it shared):
    scheme check, request guard, address guard on every hop, redirect policy (`'reject'` default),
    loop detection on guard-cleared URLs, monotonic credential stripping, per-hop headers deadline.
    The response-headers guard runs on the final head. The final hop's platform `Response` is
    returned **with its body unread** — non-2xx included, since the SDK branches on 401/404/405.
  - `init.signal` stops guard evaluation, the connect, a redirect walk, and (via `AbortSignal.any`
    composed into the transport signal) the body after return. An already-aborted signal fails
    before any guard runs. No abort listener is left on the caller's signal once the response is
    returned (tested with `getEventListeners`): the SDK uses one signal for a whole session.
  - No overall/body deadline, no size cap, no body guard, no retry: each is **refused at creation**
    (as are `method`/`headers`/`body`/`signal`, which belong on the call), not silently ignored.
  - Request inputs: string or `URL` (a `Request` is refused); methods in `SaferFetchMethod`
    (case-normalized); headers as `Headers`, pairs or record (lowercased via `Headers`); body
    `string`, `Uint8Array`, `ArrayBuffer` or **`URLSearchParams`** (the SDK's token requests send
    one — the brief's list missed it); a stream/`FormData` is refused.
  - Failures reject with **`GuardedFetchError extends Error`** (deliberately not `TypeError` — the
    SDK's `fetchWithCorsRetry` treats a `TypeError` as CORS and retries/swallows it). `message` is
    `guarded fetch failed: <kind>`; `reason` is the `FetchFailureReason` (documented as URL-bearing).
- **`@fgv/ts-extras-mcp`:** `IMcpHttpTransportParams.fetch?: McpFetch`. The SDK transport is
  **always** built with the package's `McpHttpEgress.fetch` wrapper, which delegates to the
  consumer's `fetch` or `globalThis.fetch`. New kind `{ kind: 'egress-blocked'; reason:
  FetchFailureReason['kind'] }`. README, CAPABILITIES and TSDoc lead with
  `createGuardedFetch` + `blockPrivateNetworks` and say an unguarded `fetch` gets no protection.

### #677 — OAuth

- `IMcpHttpTransportParams.authProvider?: McpOAuthClientProvider` (= the SDK's `OAuthClientProvider`,
  aliased in `sdk.ts`, which stays the single SDK import site; the `.api.md` shows
  `import { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'` and
  `export type McpOAuthClientProvider = OAuthClientProvider`).
- **Interactive gate.** The provider is wrapped in a `Proxy` whose `saveCodeVerifier` and
  `redirectToAuthorization` are forwarded only while the consumer's `connectMcpSession` is running,
  and otherwise reject with the SDK's own `UnauthorizedError` (→ `'unauthorized'`). Everything else
  is forwarded bound to the consumer's object (private fields work; absent optional members stay
  absent).
- `unauthorized` gains `resourceMetadataUrl?: string`. **Route taken:** the package's fetch wrapper
  (the same one with or without a consumer `fetch`) reads each endpoint 401/403 with the SDK's
  **exported** `extractWWWAuthenticateParams` (`@modelcontextprotocol/sdk/client/auth.js`), then
  keeps it only if `http:`/`https:` and one line of printable ASCII. `_resourceMetadataUrl` is not
  touched.
- Hardening found while building it (disclosed, not asked for):
  - **Static headers are dropped from requests to another origin.** The SDK's `createFetchWithInit`
    merges `requestInit.headers` into every OAuth request, including those to the authorization
    server the MCP server names — a static `x-api-key` would be sent there. Only a header whose value
    is the consumer's own is removed (the SDK's client-auth `Authorization` survives).
  - **An `'unauthorized'` failure's message is fixed text** (`unauthorized (HTTP 401)`), not the
    SDK error text: a 401 body or an OAuth `error_description` may repeat a credential (the test
    servers do exactly that). This changed one existing assertion in `httpFailures.test.ts`.
  - **`OAuthError` classifies as `'unauthorized'`** (was the `'transport'` catch-all).
- `docs/FUTURE.md`: the OAuth entry is marked partly shipped; new entries for the `auth()` helper
  (with its shape) and for pinned connect for MCP egress.

## Belief verdicts (SDK 1.29.0, `dist/esm`; source at `42b5822b`)

| # | belief | verdict | evidence |
|---|---|---|---|
| 1 | `createHttpTransport` validates the scheme and passes only `requestInit.headers` | **True** | `transports.ts` / `sdk.ts` `makeHttpTransport` at base |
| 2 | transport takes `fetch?: FetchLike`, `authProvider?`; `fetch` used for every request incl. `DELETE` and SSE `GET` | **True, and wider** | `client/streamableHttp.js`: `(this._fetch ?? fetch)` in `send`, `_startOrAuthSse`, `terminateSession`. Also every OAuth request: `auth()` gets `fetchFn: this._fetchWithInit` (which merges `requestInit` — the static-header leak), and the 403 upscope path passes `this._fetch`. `FetchLike` is in `shared/transport.d.ts:2` |
| 3a | buffered entry points all buffer | **True** | `_readCappedBody` |
| 3b | hop walk private to `saferFetch.ts` | **True** | as listed |
| 3c | `rewriteForRedirect` strips monotonically | **True** | headers carried from the previous hop, not the caller's set |
| 3d | `IAddressGuard` on every hop | **True** | `_clearAddress` per loop turn |
| 3e | `IFetchTransport.fetch` returns the platform `Response` | **True, inside a `Result`** | `Promise<Result<Response>>` |
| 3f | `pinnedAddress` reserved, rebinding open | **True** | `platformFetchTransport` fails on a pin |
| 4 | `FetchFailureReason` carries URLs; "never echo" | **True** | `failureReason.ts`, `saferFetchBytes` TSDoc |
| 5 | `UnauthorizedError` carries no fields; `_resourceMetadataUrl` private, set via `extractWWWAuthenticateParams` at `streamableHttp.js:319` | **True**; and the function **is exported** | `client/auth.js` exports `extractWWWAuthenticateParams` (and the deprecated `extractResourceMetadataUrl`); `./*` subpath export in `package.json` |
| 6 | `unauthorized { status? }` exists; `ts-extras-mcp` depends on `@fgv/ts-extras` | **True; as a peer (and dev) dependency**, not a direct one | `package.json` |
| 7 | FUTURE "OAuth / managed auth" around line 420 | **True** (line 420) | |

### How the SDK surfaces a rejected `fetch`

| where | how | classification here |
|---|---|---|
| connect (`initialize`, `notifications/initialized`) | `send` rejects as-is → `Protocol.request`/`notification` rejects as-is → `Client.connect` rethrows as-is | `egress-blocked` |
| a call (`tools/list`, `tools/call`) | as-is via `Protocol.request` | `egress-blocked` |
| standalone SSE `GET` | detached: `_startOrAuthSse` → `onerror` only, no operation fails (and the reconnect timer wraps it in a new `Error` text for `onerror`) | logged at `detail` by the package wrapper: `mcp: the server event stream was refused by the egress guard (<kind>)` |
| close (`terminateSession`) | as-is | the close resolves; logged `session termination failed; closing anyway (egress-blocked): …` |
| OAuth discovery / token | `fetchWithCorsRetry` rethrows a non-`TypeError` as-is; `auth()` rethrows | `egress-blocked` |

**Disagreement with the brief (recorded):** "A `GuardedFetchError` from any call becomes the new
kind" would label a guarded fetch's `network`, `timeout` and `aborted` failures "retrying cannot
help", which is false for all three. Those classify exactly as the same failure through an unguarded
`fetch` would (`transport` / `not-connected`); every other kind is `egress-blocked`.

### Where the SDK can start authorization (verified)

| path | does the SDK call `auth()`? | what now happens |
|---|---|---|
| `terminateSession()` | **No.** It calls `tokens()` (via `_commonHeaders`) only; a 401 is a `StreamableHTTPError` | logged at `detail` as `unauthorized`; close resolves; bounded by the 2 s termination bound regardless |
| standalone SSE `GET` (after `initialized`, and on the SDK's reconnect timer) | **Yes**: a 401 → `_authThenStart()` → `auth()` → discovery, refresh, registration, then `saveCodeVerifier` + `redirectToAuthorization` | interactive steps **refused** (outside the connect window); refresh/registration/`saveTokens` still run (non-interactive) |
| a `listChanged`-triggered request | the package never re-lists itself; the consumer's `onToolsChanged` callback may call `listMcpTools` → `send` → 401 → `auth()` | consumer-started, but after connect: interactive steps **refused** → `unauthorized`; refresh still runs |
| any call after connect | `send` 401 → `auth()` | as above |
| the 403 `insufficient_scope` upscope in `send` | `auth()` with `fetchFn: this._fetch` | same gate; same wrapper |

So **interactive authorization runs only inside `connectMcpSession`**. A consumer whose token cannot
be refreshed mid-session gets `unauthorized` (with `resourceMetadataUrl`) and reconnects to authorize.

## New option and failure shapes

```ts
// @fgv/ts-extras SaferFetch
type GuardedFetch = (url: string | URL, init?: RequestInit) => Promise<Response>;
interface IGuardedFetchOptions {
  addressGuard: IAddressGuard;              // required, no default
  requestGuard?; responseHeadersGuard?; redirectPolicy?; maxRedirects?;
  sensitiveHeaders?; headersTimeoutMs?; transport?; logger?;
}
function createGuardedFetch(options: IGuardedFetchOptions): Result<GuardedFetch>;
class GuardedFetchError extends Error { readonly reason: FetchFailureReason } // message: 'guarded fetch failed: <kind>'

// @fgv/ts-extras-mcp
type McpFetch = (url: string | URL, init?: RequestInit) => Promise<Response>;
type McpOAuthClientProvider = OAuthClientProvider; // the SDK's
interface IMcpHttpTransportParams { url; headers?; fetch?: McpFetch; authProvider?: McpOAuthClientProvider }
type McpFailureReason = …
  | { kind: 'unauthorized'; status?: number; resourceMetadataUrl?: string }
  | { kind: 'egress-blocked'; reason: SaferFetch.FetchFailureReason['kind'] }
```

**`mcp-session-id` in safer-fetch's default `sensitiveHeaders`? No.** safer-fetch is
protocol-agnostic and its always-stripped set is shared by every buffered call; adding an MCP header
there would be a silent change for every other caller. Redirects are rejected by default, and the
MCP README, CAPABILITIES and `IMcpHttpTransportParams.fetch` TSDoc tell a consumer who allows them
to list `mcp-session-id` with their custom credential headers.

## Check-then-act table

Every `await` between a guard or authorization decision and the act it guards, and what re-checks
after it.

| # | decision | `await`s before the act | act | re-check after the window |
|---|---|---|---|---|
| 1 | request guard clears hop *n* | address guard (`_clearAddress`) | connect | the address guard runs **after** the request guard, on the request guard's (possibly replaced) URL — it is the last word |
| 2 | address guard clears hop *n* | none in our code between `_clearAddress` resolving and `transport.fetch` (loop detection is synchronous) | connect | DNS: **not re-checked** — the platform re-resolves at connect. This is the documented rebinding residual (see below) |
| 3 | caller signal not aborted (entry) | request guard, address guard, connect, each hop | each guard call / connect | every `_raced` call first checks `watch.cause` and **does not start** the guard or transport if the call has stopped (new in commit 2); `watch.race` then answers a stop mid-flight. The watch's controller aborts the in-flight fetch |
| 4 | hop *n* redirected | `_nextHop` (sync), then hop *n+1*'s request and address guards | hop *n+1* connect | full re-walk of both guards on hop *n+1*; loop detection on guard-cleared URLs; headers stripped from the previous hop's set, never restored |
| 5 | response-headers guard accepts | none: `_succeed(response)` follows synchronously | response returned | a refusal releases the body; after return, the caller's signal reaches the body through `AbortSignal.any` (the watch has been disposed) |
| 6 | interactive window open (`egress.interactive`) | the whole SDK connect | `saveCodeVerifier` / `redirectToAuthorization` | `isOpen()` is read **at the moment each interactive method is called**, not when the window opened; the window closes in a `finally` the instant the connect race settles, so a flow that outlives a lost/timed-out connect is refused |
| 7 | endpoint 401 recorded (`resourceMetadataUrl`) | SDK auth flow, retries | attached to a later `unauthorized` | not re-checked: it is the **latest** valid challenge from that endpoint, overwritten by each newer one, never cleared. Disclosed in the TSDoc ("most recent") |
| 8 | static-header strip decision (origin ≠ endpoint) | none | request sent | computed per request from that request's URL |
| 9 | `closeMcpSession` begins | `terminate()` (≤ 2 s) | `client.close()` | termination never calls `auth()`; the gate is closed after connect anyway; the 2 s bound covers a slow `tokens()` |

Not a window but worth stating: the gate is per transport (single-use), so two sessions cannot open
each other's window. Within one session, nothing of the consumer's can run before the connect returns
it — but **the SDK's own standalone `GET` can**: it is started detached when `notifications/initialized`
is accepted, which is still inside `connect`. If that `GET` drew a 401 before `connect` settled, its
interactive steps would be forwarded. That is still inside the consumer's connect call (the request
the consumer made), and in practice the `GET` carries the token the `POST`s just used successfully.
After `connect` settles, a 401 on that stream — including on every reconnect — is refused.

## Revert matrix

*(filled in below after the runs)*

## DNS-rebinding residual, now

Unchanged in kind, narrower in where it applies. MCP egress through `createGuardedFetch` +
`blockPrivateNetworks` now has the per-hop address check, redirect refusal and credential stripping
that it had none of before. What remains: the guard resolves the host and the platform transport
resolves it again at connect, so a hostile resolver can answer differently. Nothing in this stream
claims otherwise; the TSDoc of `createGuardedFetch`, the MCP README and FUTURE.md say so. The fix is
the pinned-connect stream: `createGuardedFetch` already takes a `transport`, so a pinning transport
drops in without a signature change.

## Gate counts

*(filled in after the final gate run)*

## code-reviewer findings

*(filled in after the review)*

## What the brief got wrong

- **Body shapes:** the SDK sends a `URLSearchParams` body on every OAuth token request; "string,
  `Uint8Array` or absent" would have refused all of them.
- **"A `GuardedFetchError` from any call becomes the new kind"** — see the disagreement above:
  `network`/`timeout`/`aborted` are not configuration refusals.
- **Belief 2 is wider than stated:** the injected `fetch` also carries every OAuth discovery,
  registration and token request, with the consumer's static headers merged in by the SDK — which is
  why static headers are now stripped from other origins.
- **Belief 6:** the dependency on `@fgv/ts-extras` is a peer dependency.
- **"`GuardedFetchError extends Error`"** was right, and needed to be exactly that: the SDK treats a
  `TypeError` from `fetch` as CORS during discovery.
- **The interactive-flow question** had a definite answer — the SDK *can* start it from the
  standalone `GET` and its reconnect timer — and it was preventable without touching the SDK: gate
  the provider rather than the paths.
