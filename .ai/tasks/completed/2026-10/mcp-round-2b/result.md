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
  aliased in `sdkTypes.ts`, a type-only leaf exported from the packlet barrel — `sdk.ts` stays the
  single runtime SDK import site, and the leaf avoids a `model.ts`↔`sdk.ts` type cycle; the `.api.md` shows
  `import { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'` and
  `export type McpOAuthClientProvider = OAuthClientProvider`).
- **Interactive gate.** The provider is wrapped in a `Proxy` whose `state`, `saveCodeVerifier`
  and `redirectToAuthorization` are forwarded only while the consumer's `connectMcpSession` is running,
  and otherwise reject with the SDK's own `UnauthorizedError` (→ `'unauthorized'`).
  `redirectToAuthorization` is also refused, even inside the window, for a URL that is neither
  `https:` nor `http:` on a loopback host (OAuth 2.1).
  Discovery, registration, refresh, `saveTokens` and `invalidateCredentials` are not gated, and can
  run from the SDK's background reconnect. Everything else
  is forwarded bound to the consumer's object (private fields work; absent optional members stay
  absent).
- `unauthorized` gains `resourceMetadataUrl?: string`. **Route taken:** the package's fetch wrapper
  (the same one with or without a consumer `fetch`) reads each endpoint 401/403 with the SDK's
  **exported** `extractWWWAuthenticateParams` (`@modelcontextprotocol/sdk/client/auth.js`), then
  keeps it only if `http:`/`https:` and one line of printable ASCII. `_resourceMetadataUrl` is not
  touched.
- Hardening found while building it (disclosed, not asked for):
  - **Static headers reach only the MCP endpoint's origin.** The SDK's `createFetchWithInit` merges
    `requestInit.headers` into every OAuth request, including those to the authorization server the
    MCP server names — a static `x-api-key` would be sent there. *As shipped after Copilot round 3:*
    the SDK is given no static headers; the egress wrapper applies them, with `set`, only to requests
    for the endpoint's origin. (Until round 3 they were stripped off-origin by value; that was
    defeated by a case-split merge — see the round 3 table.)
  - **Failure messages never carry server-authored text.** Every `'unauthorized'` failure, and any
    failure from a `StreamableHTTPError`, `SseError` or `OAuthError`, reads as kind + status
    (`unauthorized (HTTP 401)`, `transport (HTTP 500)`, `session-expired`): a response body, status
    text or `error_description` may repeat a credential (the test servers do exactly that). This
    changed four existing assertions that matched server text (three in `httpFailures.test.ts`, one
    in `terminate.test.ts`).
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

**Classification of the guarded fetch's own failures (after the orchestrator review):** `timeout`
(its headers deadline) → `'timeout'`; `network`, `aborted`, `unknown` (an internal failure or a
throwing logger) → as a plain `fetch` failure (`'transport'`, `'not-connected'` once closed); every
other kind → `'egress-blocked'`.

**Disagreement with the brief (recorded):** "A `GuardedFetchError` from any call becomes the new
kind" would label a guarded fetch's `network`, `timeout` and `aborted` failures "retrying cannot
help", which is false for all three. Those classify exactly as the same failure through an unguarded
`fetch` would (`transport` / `not-connected`); every other kind is `egress-blocked`.

### Where the SDK can start authorization (verified)

| path | does the SDK call `auth()`? | what now happens |
|---|---|---|
| `terminateSession()` | **No.** It calls `tokens()` (via `_commonHeaders`) only; a 401 is a `StreamableHTTPError` | logged at `detail` as `unauthorized`; close resolves; bounded by the 2 s termination bound regardless |
| standalone SSE `GET` (after `initialized`, and on the SDK's reconnect timer) | **Yes**: a 401 → `_authThenStart()` → `auth()` → discovery, refresh, registration, then `state` + `saveCodeVerifier` + `redirectToAuthorization` | interactive steps **refused** (`state` first, so nothing of the consumer's in-progress flow is overwritten) (outside the connect window); refresh/registration/`saveTokens` still run (non-interactive) |
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
| 5 | response-headers guard accepts | microtasks only (the walk unwinding) | response returned | the headers deadline runs until this guard accepts (streaming has no other bound on it); `watch.cause` is re-read after the walk, so an abort that landed meanwhile rejects and releases the body; after return, the caller's signal reaches the body through `AbortSignal.any` (the watch has been disposed). A few microtasks remain between that re-read and the caller — see R7 |
| 6 | interactive window open (`egress.interactive`) | the whole SDK connect | `state` / `saveCodeVerifier` / `redirectToAuthorization` | `isOpen()` is read **at the moment each interactive method is called**, not when the window opened; the window closes in a `finally` the instant the connect race settles, so a flow that outlives a lost/timed-out connect is refused |
| 6b | an `auth()` flow started inside the window, then the connect times out or is aborted | discovery, refresh/registration, `state()`, `saveCodeVerifier()` — each an `await` | `redirectToAuthorization` | each step re-reads `isOpen()` when called, so whichever step runs after the window closes is refused. If `state` and `saveCodeVerifier` had already run inside it, **they have run** (and persisted whatever the provider persists there); only the redirect is refused. Documented in the `authProvider` TSDoc, README and CAPABILITIES |
| 6c | authorization URL accepted (`https:`, or `http:` with a loopback host) | none | `redirectToAuthorization` forwarded | the URL is the one passed to that call; no re-resolution — the consumer opens it |
| 6d | which optional provider members exist (Copilot round 1: the `Proxy` became a forwarding facade) | none — read once, when the transport is built | the SDK's feature detection (`provider.state ? …`) | **not re-checked**: a member the consumer adds or removes after `createHttpTransport` is not seen. Data members (`redirectUrl`, `clientMetadata`, `clientMetadataUrl`) are read at use. `isOpen()` is still read when each interactive method is called (rows 6, 6b), and the late-window tests now pin it: a connect that times out or is aborted while the flow is parked before any interactive step lets nothing interactive through afterwards, and one parked in `saveCodeVerifier` has its redirect refused |
| 7 | endpoint 401 recorded (`resourceMetadataUrl`) | SDK auth flow, retries | attached to a later `unauthorized` | not re-checked: it is the **latest** valid challenge from that endpoint, overwritten by each newer one, never cleared. Disclosed in the TSDoc ("most recent") |
| 8 | static headers applied (request origin = endpoint origin) | none | request sent | computed per request from that request's URL; off-origin requests are never given them (since Copilot round 3 — the SDK no longer holds them at all). The check sees only the first URL: a redirect is the `fetch`'s. Since the gate-time review, a request carrying them through `globalThis.fetch` sets `redirect: 'error'`; a guarded fetch keeps its own policy (`'reject'` by default; under `'validate-each-hop'` only `sensitiveHeaders` are stripped) |
| 9 | `closeMcpSession` begins | `terminate()` (≤ 2 s) | `client.close()` | termination never calls `auth()`; the gate is closed after connect anyway; the 2 s bound covers a slow `tokens()` |

Not a window but worth stating: the gate is per transport (single-use), so two sessions cannot open
each other's window. Within one session, nothing of the consumer's can run before the connect returns
it — but **the SDK's own standalone `GET` can**: it is started detached when `notifications/initialized`
is accepted, which is still inside `connect`. If that `GET` drew a 401 before `connect` settled, its
interactive steps would be forwarded. That is still inside the consumer's connect call (the request
the consumer made), and in practice the `GET` carries the token the `POST`s just used successfully.
After `connect` settles, a 401 on that stream — including on every reconnect — is refused.

## Revert matrix

Each protection reverted on its own (source patched, `tsc`, the named test run, source restored).
"red" = the named test failed. Script: the session scratchpad's `revert.py`; reproduce by hand from
the "revert" column.

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R1 | a stopped watch starts no guard/transport work (`_raced`) | skip the pre-check | `an abort between hops stops the walk before the next hop is guarded or sent` | red |
| R2 | address guard on every hop | guard hop 0 only | `runs the address guard on every hop, and refuses a hop to a private address` | red |
| R3 | monotonic credential stripping | re-derive headers from the caller's set when back on the origin | `…stays gone on A → B → A` | red |
| R4 | a returned stream is not cut off (headers timer retired *and* watch disposed — two independent layers) | remove both | `a stream that outlives the headers deadline is not cut off` | red |
| R5 | headers deadline bounds the streaming head guard | retire it on arrival | `the headers deadline also bounds a response-headers guard that never settles` | red |
| R6 | caller's signal reaches the body after return (`AbortSignal.any`) | transport gets `watch.signal` only | `an abort after return cancels the body mid-stream` | red |
| R6b | no listener left on the caller's signal | don't dispose the watch on success | `leaves no abort listener on the caller's signal…` | red |
| R7 | an abort landing after the last guard is reported | drop the post-walk `watch.cause` check | `an abort at any point after the last guard accepts…` | **green — not isolated** (see below) |
| R8 | a `Request` input is refused | accept it | `refuses a Request object, sending nothing` | red |
| R9 | body-needing options refused at creation | drop `timeoutMs` from the refused set | `refuses every option that needs the body read…` | red |
| R10 | the package wrapper is installed even with a consumer `fetch` | hand the SDK the consumer's `fetch` | `a refused standalone GET is logged by kind, and calls still work` | red |
| R11 | `GuardedFetchError` → `egress-blocked` | skip the branch | `a refusal on a call classifies as egress-blocked…` | red |
| R12 | interactive gate (all three steps) | forward always | `the SDK's background reconnect of the event stream never starts interactive authorization` | red |
| R13 | `state` gated | forward `state` always | `after connect, a token that cannot be refreshed fails a call unauthorized…` | red |
| R14 | the window closes after connect | leave it open | same as R13 | red |
| R15 | `resource_metadata` scheme validation | accept any URL | `a resource_metadata that is … is omitted` | red (2 of 3) |
| R16 | static headers dropped off-origin | never drop | `an expired token is refreshed…; static headers never reach the authorization server` | red |
| R17 | server-authored error text redacted | redact `unauthorized` only | `a non-401 error whose body echoes the credentials never surfaces them` | red |
| R18 | non-http(s) authorization URL refused | forward any | `inside the window, an authorization URL that is not http(s) is still refused` | red |

R8, R11, R12 and R13's reverts also produced `tsc` type errors (emit still happened, and the named
test ran against the emitted code).

**R7 is not isolated, and cannot be.** The interval between the response-headers guard accepting and
the caller's continuation running is microtasks only, with no I/O. The sweep test schedules the
abort at 40 microtask depths and asserts each outcome is coherent (an `aborted` rejection with the
body released, or a response returned before the abort). With the check removed, earlier stop
points still produce rejections at most depths, so the test stays green; with it in place, an abort
can still land in the last few microtasks after the check, exactly as with platform `fetch`. The
check narrows that window; it is kept, and covered, but no test isolates it.

### Rows added after the orchestrator review

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R19 | a guarded headers timeout classifies as `'timeout'` | drop the branch | `a slow tool on a JSON-response server outlives the guarded fetch's headers deadline: timeout, not transport` | red |
| R20 | a guarded `unknown` is not `egress-blocked` | drop `unknown` from the non-refusal set | `maps a guarded-fetch unknown (internal) failure as a plain fetch failure, not a refusal` | red |
| R21 | authorization URL: `http:` only on a loopback host | accept any `http:` | `inside the window, an authorization URL that is plain http to a remote host is still refused` | red |

R18's test was replaced by the two `test.each` tables that pin R21 (forwarded: `https`, `http` on
`127.0.0.1`, `[::1]`, `localhost`; refused: remote `http`, private-address `http`, `file:`).

### Rows added after Copilot round 1

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R22 | the gate is a forwarding facade, not a `Proxy` | return a `Proxy` over the consumer whose `get` reads the facade | `a frozen object-literal provider works through the gate` | red |
| R23 | static headers normalized through `Headers` | lowercase the raw record instead | `case-variant duplicate static headers, combined as the SDK sends them, are not sent to another origin` | red |
| R24 | case-variant duplicate header names refused | never refuse | `createHttpTransport refuses case-variant duplicate header names` | red |
| R25 | the egress (headers, provider) is built inside the capture | build it before the capture | `a provider getter that throws fails createHttpTransport with fixed text` | red |
| R26 | the window closes when a connect that parked the auth flow fails | leave it open | `a connect that times out / is aborted while auth is parked…` | red (both) |
| R27 | a late redirect after a pending `saveCodeVerifier` is refused | same | `a connect that times out while saveCodeVerifier is pending: the late redirect is refused` | red |

### Row added after Copilot round 2

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R28 | the SDK and the egress share one private, frozen copy of `headers` | hand the SDK the caller's record | `headers are copied at createHttpTransport: a caller's later changes reach neither server` | red |

### Rows added after Copilot round 3

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R29 | static headers only on the endpoint's origin | apply them on every origin | `a static Authorization with client_secret_basic: the authorization server sees only the Basic credential` | red |
| R30 | a static header overrides a same-named one (`set`) | `append` | `a static Authorization overrides the provider's Bearer on MCP-origin requests` | red |
| R31 | `params.fetch` read inside the capture | read it outside | `a fetch getter that throws fails createHttpTransport with fixed text` | red |
| R32 | guarded `Uint8Array` body copied | pass it through | `createGuardedFetch: a Uint8Array mutated while the address guard runs is sent as approved` | red |
| R33 | guarded `ArrayBuffer` body copied | `new Uint8Array(buffer)` (a view) | `…an ArrayBuffer mutated…` | red |
| R34 | buffered body copied before the walk | keep the caller's array | `saferFetchBytes: a body mutated while the guards run…` | red |
| R35 | the copy is not a `Buffer` view | `bytes.slice()` | `…a Node Buffer (whose slice() is a view)…` | red |

### Rows added after Copilot round 4

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R36 | every `egress-blocked` refusal is logged, whatever its URL or method | log only the endpoint's event-stream `GET` | `a guard refusal in the SDK's background authorization is logged by kind, with no URL` | red |
| R37 | buffered `timeoutMs` bounded by 2147483647 | no upper bound | `bounds timeoutMs by what a timer honours: 2147483647 is accepted, 2147483648 refused` | red |
| R38 | buffered `headersTimeoutMs` bounded | no upper bound | `bounds headersTimeoutMs by what a timer honours…` | red |
| R39 | `retry.baseDelayMs` bounded | exempt it from the bound | `bounds retry.baseDelayMs by what a timer honours…` | red |
| R40 | `retry.maxDelayMs` bounded | exempt it from the bound | `bounds retry.maxDelayMs by what a timer honours…` | red |
| R41 | guarded `headersTimeoutMs` bounded, at creation | no upper bound | `bounds the headers timeout by what a timer honours: 2147483647 is accepted, 2147483648 refused` | red |

### Rows added after the gate-time deep review

| # | protection | revert | named test | result |
|---|---|---|---|---|
| R42 | `redirect: 'error'` on a request carrying static headers through `globalThis.fetch` | return the init without it | `a 307 from the MCP origin to another origin is refused, and the static header never reaches it` | red |
| R43 | a `resource_metadata` URL with userinfo is dropped | skip the username / password check | `acceptResourceMetadataUrl drops a URL that carries a username or password` | red |
| R44 | the facade's member list covers `keyof McpOAuthClientProvider` | remove `discoveryState` from the list | build (`TS2741`), and `every member forwards to the consumer…` | red (compile error first) |

## `AbortSignal.any` and a long-lived source signal (orchestrator review)

Supported Node is `>=22.22.0 <23 || >=24.15.0 <25` (`rush.json`). Measured on **22.22.0** (24.15 is
not installed in this environment, so it is **untested**), with one long-lived source signal — the
SDK's per-session controller — and 100 000 short-lived composites, each carrying an 8 KB payload:

| composite's abort listener | heap growth |
|---|---|
| attached and never removed | +883 MiB — the composite is retained through the source |
| none | +22.9 MiB (~0.23 KiB per composite: bookkeeping on the source, freed with it) |
| attached, then removed | +25.7 MiB |

With **real `fetch`** against a local server (`AbortSignal.any([watch, long])`, as the guarded
fetch builds), 12 000 requests: +2.8 MiB with bodies read, +3.9 MiB with bodies cancelled, flat from
9 000 to 12 000; a plain signal +1.7 MiB. undici removes its listener when a request finishes, so
the retaining case needs a body that is neither read nor cancelled — which already holds its
connection, and which the SDK never leaves (it reads or cancels every body). **No workaround:**
22.22.0 is not affected for the access pattern this package has. The ~0.2 KiB-per-request residual
is bounded by the source signal's lifetime (one MCP session) and is recorded here rather than
worked around; a workaround would need the body wrapped, which the brief rules out.

## Secrets proof — its scope

`oauth.test.ts` greps every log line (session logger and the guarded fetch's logger at `detail`),
every failure message and every serialized `McpFailureReason` from each test for seven values: the
access token, a refreshed token, two refresh tokens, a stale token, the client secret and a static
API key. The test servers echo tokens in a 401 body, an `invalid_grant` description and a 500 body.
**An authorization code is not in the list**: no code exchange runs through the package — after
`redirectToAuthorization` the consumer exchanges the code with the SDK's `auth()` (the helper is
deferred to FUTURE.md), and should pass its guarded fetch as `fetchFn`.

## DNS-rebinding residual, now

Unchanged in kind, narrower in where it applies. MCP egress through `createGuardedFetch` +
`blockPrivateNetworks` now has the per-hop address check, redirect refusal and credential stripping
that it had none of before. What remains: the guard resolves the host and the platform transport
resolves it again at connect, so a hostile resolver can answer differently. Nothing in this stream
claims otherwise; the TSDoc of `createGuardedFetch`, the MCP README and FUTURE.md say so. The fix is
the pinned-connect stream: `createGuardedFetch` already takes a `transport`, so a pinning transport
drops in without a signature change.

## Gate counts

Final run, after the orchestrator-review fixes, on the code as pushed. Each log graded with
`grep -ci error` / `grep -ci warning`, not by exit code.

| gate | exit | `error` lines | `warning` lines | notes |
|---|---|---|---|---|
| `ts-extras` `rushx fixlint` / `build` / `lint` | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | |
| `ts-extras` `rushx test` | 0 | 1 | 0 | the one match is the `guardedFetchError.ts` row of the coverage table; 97 suites, 3149 passed, 0 failed; 100 % on all four |
| `ts-extras-mcp` `rushx fixlint` / `build` / `lint` | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | |
| `ts-extras-mcp` `rushx test` | 0 | 0 | 0 | 14 suites, 236 passed, 0 failed; 100 % on all four. After Copilot round 1: 248 passed, 0 failed; 100 %; build and lint 0 errors, 0 warnings. `ts-extras` untouched in that round, so the repo-wide test was not re-run |
| `install-run-rush.js rebuild` | 0 | 0 | 1 | `SUCCESS: 38 operations`; the warning is Rush's existing "1 Git-tracked symlink" repo-state notice |
| `install-run-rush.js test` | 0 | 0 | 1 | `SUCCESS: 37 operations`; same notice |
| `change --verify --target-branch origin/integration/asks` | 0 | 0 | 0 | change files: `@fgv/ts-extras` ×1, `@fgv/ts-extras-mcp` ×2, all `minor` |
| `verify-capability-docs.mjs` | 0 | — | — | router 22,585/24,000 chars, 0 failed; the capability feed is current (0 updated) |

After Copilot round 4 (graded the same way): both packages' `fixlint` / `build` / `lint` exit 0 with
0 `error` and 0 `warning` lines. `ts-extras` `rushx test`: 97 suites, 3158 passed, 0 failed, 100 % on
all four, and the one `error` match is still the `guardedFetchError.ts` coverage row.
`ts-extras-mcp` `rushx test`: 14 suites, 254 passed, 0 failed, 100 % on all four. `rebuild`:
`SUCCESS: 38 operations`, 0 errors, 1 warning (the symlink notice). `test`: `SUCCESS: 37 operations`,
0 errors, 1 warning (the same notice). `change --verify`: 0 / 0. `verify-capability-docs`: 0 failed;
feed: 0 updated.

Prettier: the repo's 2.8.8 (`rush-prettier` autoinstaller) and the pre-commit `rush prettier` hook;
no global prettier was used.

## code-reviewer findings

Run once on the full diff after the functional tests (commits 1–4 + docs). Honest sequencing note:
the per-package coverage runs during steps 2 and 3 had already prompted two small tests
(an abort as the final response arrives; a rejected consumer `fetch`) before the reviewer ran; no
`c8 ignore` was added anywhere. No P1s. Every P2 and P3 was acted on:

| # | pri | finding | disposition |
|---|---|---|---|
| 1 | P2 | streaming head guard had no deadline (headers timer cleared before it ran; no overall timer) | **fixed** — the streaming finisher retires the headers deadline only after the guard accepts; TSDoc corrected; test with a never-settling guard |
| 2 | P2 | `state()` runs before `saveCodeVerifier`, so the gate's "nothing persisted" claim was false; other off-window writes undocumented | **fixed** — `state` gated too (when implemented); TSDoc and docs list what does run off-window (discovery, registration, refresh, `saveTokens`, `invalidateCredentials`); tests count `state()` calls |
| 3 | P2 | non-401 HTTP errors put server body text (possibly an echoed token) in messages | **fixed** — any failure from `StreamableHTTPError`/`SseError`/`OAuthError`, and every `unauthorized`, reads as kind + status; test with a 500 echoing the bearer token and API key; four existing assertions on server text updated (three in `httpFailures.test.ts`, one in `terminate.test.ts`; a fourth `httpFailures` assertion was only tightened) |
| 4 | P3 | `redirectToAuthorization` forwarded a server-chosen URL of any scheme | **fixed** — non-`http(s)` refused even inside the window; test |
| 5 | P3 | `resourceMetadataUrl` TSDoc didn't say it is server-chosen / may be stale | **fixed** in TSDoc, README, CAPABILITIES |
| 6 | P3 | static-header drop compared untrimmed values | **fixed** — compares the trimmed configured value; test uses a padded value |
| 7 | P3 | 403 `insufficient_scope` path untested | **fixed** — test: no interactive step, `unauthorized` with `resourceMetadataUrl` |
| 8 | P3 | a consumer `fetch` that throws synchronously skipped the refusal log | **fixed** — called inside `then`; test |
| 9 | P3 | `instanceof GuardedFetchError` fails across duplicate installs | **documented** (peer dependency; a second copy classifies as `transport`). Matching on `name` would let any error named so claim to be a refusal |
| 10 | P3 | an abort after the head guard still resolved the response | **fixed (narrowed)** — post-walk `watch.cause` check rejects and releases the body; see R7 for why the window cannot be fully closed |

The reviewer's reference to `operations.ts:109` logging an error message was checked: that line logs
a refused JSON field, not an error text — no change.

## Orchestrator review (after push)

No blocking findings. Each item and what was done:

| # | finding | disposition |
|---|---|---|
| P2-1 | a JSON-response server holds a slow `tools/call`'s headers past the guarded fetch's 10 s default; it failed as `transport` | **fixed** — a guarded `timeout` is `'timeout'`; README example, `fetch` TSDoc and CAPABILITIES tell consumers to set `headersTimeoutMs` ≥ their longest MCP `timeoutMs`; real JSON-response-server test (R19). **Decided: no warning or refusal at connect** — the package receives the guarded fetch as an opaque function and cannot read its `headersTimeoutMs`, and a per-call heuristic (comparing `timeoutMs` to an observed headers timeout) would warn only after the failure it should prevent. Documentation is the clean signal available |
| P2-2 | `_prepareGuardedFetch` / `_executeGuarded` were `isFailure` ladders | **fixed** — Result chains, with `_asOutcome` for the one plain-`Result` re-type; the older `_walk`/`_execute` untouched; safer-fetch suite unchanged |
| P3 | "before any of the three has run" was too strong | **fixed** in the `authProvider` TSDoc, README, CAPABILITIES; check-then-act row 6b |
| P3 | `auth()` needs `fetchFn` | **fixed** in the `authProvider` TSDoc and README |
| P3 | a guarded `unknown` classified as `egress-blocked` | **fixed** → `transport`; kind table updated (R20) |
| P3 | plain `http:` authorization URLs | **fixed** — refused unless the host is loopback (`localhost`, or a literal that `SaferFetch.classifyAddress` calls loopback) (R21) |
| P3 | `McpOAuthClientProvider` re-exported from `model.ts`, model↔sdk type cycle | **fixed** — type-only leaf `sdkTypes.ts`, exported from the barrel with `export *` (so it is loaded and covered like `model.ts`); `.api.md` unchanged |
| P3 | `AbortSignal.any` leak on supported Node | **measured** — see the section above; not affected, no workaround |

## Copilot round 1 (PR #729)

Each finding was reproduced with a failing test before it was fixed.

| # | sev | finding | reproduced | disposition |
|---|---|---|---|---|
| 1 | high | the gate's `Proxy` returned wrapped/bound functions, violating the invariant for a frozen provider's non-writable, non-configurable properties: reading `tokens` threw `TypeError` | yes — `'get' on proxy: property 'tokens' is a read-only and non-configurable data property…` | **fixed** — an explicit forwarding facade: every member calls through with the consumer's object as the receiver; data members read at use; optional methods read once and absent when the consumer lacks them. Tests: a frozen provider through the gate and through a real connect; every member's receiver; absent optionals stay absent; the existing private-field class (`TestProvider`) runs every real-server test. R22 |
| 2 | high | `{ 'X-Api-Key': 'a', 'x-api-key': 'b' }`: `Headers` sends `a, b`, but the snapshot kept only `b`, so the off-origin strip missed it | yes — the combined header reached the other origin | **fixed** — the snapshot is built through `Headers`, so it holds the same combined value the SDK sends (R23). **Decision: `createHttpTransport` also refuses case-variant duplicate names** (R24): header names are case-insensitive, so the two entries can only ever go out as one combined value — almost certainly not what was meant — and refusing names the mistake at the call site instead of on the wire |
| 3 | medium | the late-authorization windows were untested | the tests passed on the existing gate (no reproduction of an open window) | **tested, no gate change** — connect timing out and, separately, aborted while the auth flow is parked in `clientInformation`, then released: no `state`, `saveCodeVerifier` or redirect reaches the consumer (R26); parked in `saveCodeVerifier` then released: the redirect is refused (R27) |
| 4 | medium | the egress wrapper was built outside `captureResult` and read `authProvider` members at construction, so a throwing getter escaped `createHttpTransport` | yes — the call threw | **fixed** — the egress (header normalization, the facade) and the SDK transport are built inside one `captureResult` with fixed text; reading `headers`' keys is captured too. One existing assertion that matched the SDK constructor's thrown text now expects the fixed text. R25 |

## Copilot round 2 (PR #729)

| # | sev | finding | reproduced | disposition |
|---|---|---|---|---|
| 1 | high | the egress snapshotted `params.headers`, but the SDK was handed the caller's own record and reads it on every request, so a value changed or added after construction reached the authorization server unstripped | yes — the regression fails with the SDK given the caller's record (R28) | **fixed** — `createHttpTransport` copies `headers` once (each key and value read once, inside a capture) into a private frozen object, and that copy is the only one the SDK, the egress and the duplicate-name check see. `headers` TSDoc and the CAPABILITIES row say later changes have no effect |

Other caller-owned objects checked: the SDK transport keeps `_requestInit` (the package's object,
holding the copy), `_fetch` (the egress function), `_authProvider` (the facade — its data members are
read at use, by design) and `_url` (the package's own `URL`); the egress keeps its own `URL`, its
own `Map` of normalized headers, the consumer's `fetch` function reference, and the facade's closure
over the consumer's provider (by design). The `params` object itself is not retained.

## Copilot round 3 (PR #729)

Each finding was reproduced with a failing test before it was fixed.

| # | sev | finding | reproduced | disposition |
|---|---|---|---|---|
| 1 | high | a case-split merge leaked static headers to the authorization server: the SDK's `createFetchWithInit` spreads the caller-cased static record beside the SDK's lowercased token-request headers, so a static `Authorization: Bearer …` and the `client_secret_basic` `authorization: Basic …` became two keys that `Headers` joined, and the exact-value strip missed the joined value | yes — R29's revert reproduces the leak in the `client_secret_basic` test | **fixed** — the SDK is given no static headers (`makeHttpTransport` takes none); the egress applies them with `set`, only when the request's origin is the endpoint's, so on that origin a static header still overrides the SDK's same-named one (as `_commonHeaders`' merge did) and on any other origin they never appear. The value-comparison strip is gone. Lowercasing the copy was rejected, as the finding said: it would stop a static `Authorization` overriding the provider's `Bearer` and join the two instead. Tests: `client_secret_basic` with a static `Authorization` (the authorization server sees only Basic; the MCP server sees the static value), a static `Authorization` overriding the provider's `Bearer`, and the off-origin / case-variant unit tests rewritten for apply-on-origin. R29, R30 |
| 2 | medium | `params.fetch` was read outside a capture | yes — a throwing getter escaped (R31) | **fixed** — read inside `captureResult` with fixed text; regression asserts the thrown text is not echoed |
| 3 | medium | `_guardedBody` aliased the caller's bytes | yes — mutating the buffer while the address guard ran changed the bytes sent, for a `Uint8Array`, an `ArrayBuffer` (`new Uint8Array(buffer)` is a view) and a Node `Buffer` | **fixed** — copied before the first `await`: `new Uint8Array(bytes)` (not `.slice()`, which on a `Buffer` is a view — R35) and `new Uint8Array(buffer.slice(0))`. **The buffered entry points had the same aliasing** (`options.body` was copied only at connect, after the guards had awaited, so the request guard approved bytes that could then change) — fixed the same way in `_resolveCallOptions`. R32–R35. The existing safer-fetch suite is unchanged |

The CI failure on `f3b88357` (`ERR_PNPM_CACHE_MISSING_AFTER_304` during install) was not this PR's.

## Copilot round 4 (PR #729)

Both fixed findings were listed under "previously missed" in the round's summary. Each was reproduced
with a failing test before it was fixed.

| # | sev | finding | reproduced | disposition |
|---|---|---|---|---|
| 1 | medium | `_noteRefusal` logged only a refusal of the endpoint's event-stream `GET`; the OAuth discovery, refresh and registration the SDK runs after a 401 on its background reconnect have no operation to fail, so a guard refusing one of them was reported nowhere | yes — the new test sees no log line before the fix (R36) | **fixed** — every `egress-blocked` refusal is logged at `detail`, whatever its URL or method, by kind only and never with a URL. The endpoint `GET` keeps its event-stream line; anything else is `mcp: an HTTP request was refused by the egress guard (<kind>)`. A refusal that also fails an operation is now logged as well as classified. TSDoc on `_noteRefusal` and `IHttpTransportParams.fetch`, and the README, updated. Test: the event-stream `GET` gets a 401 on reconnect, the guard blocks the authorization-server request, and the session logger records the refusal with no URL in any line. R36 |
| 2 | medium | `headersTimeoutMs` above 2³¹−1 was accepted; Node fires such a timer after 1 ms, so the call timed out at once | yes — R41 | **fixed** — refused at creation above 2147483647 (`MAX_TIMER_DELAY_MS`, internal, the same bound as `ts-extras-mcp`'s `MAX_TIMEOUT_MS`). The sweep found three more options that reach `setTimeout`: the buffered `timeoutMs` and `headersTimeoutMs`, and `retry.baseDelayMs` / `retry.maxDelayMs` (a backoff, and an honoured `Retry-After`, is clamped to `maxDelayMs`, so bounding it bounds both). All now refused above the bound. The guarded path takes no other timer option (`timeoutMs` and `retry` are refused there). Tests: 2147483647 accepted and 2147483648 refused for each of the five. R37–R41 |
| 3 | — | redact `McpError` text | — | **declined**, per the orchestrator; not changed |

## Gate-time deep review (PR #729)

No code defects. Fifteen items, all applied:

| # | item | disposition |
|---|---|---|
| 1 | static headers can follow a redirect: the egress sees only a request's first URL, native `fetch` follows with custom headers to any origin, and a guarded fetch under `validate-each-hop` does unless the header is in `sensitiveHeaders` | **fixed** — a request carrying static headers through `globalThis.fetch` sets `redirect: 'error'`. The exact guarantee is now stated in `headers`/`authProvider` TSDoc, the README, CAPABILITIES and the oauth change file. Test: a 307 from the MCP origin to another origin (with a no-headers control showing the other origin is reachable) fails and the other origin sees nothing. R42 |
| 2 | "messages never carry server-authored text" was too broad | **narrowed** to HTTP-error and OAuth-error text, with `tool-error` / `protocol` carrying server text by design and the SDK's other auth errors able to name a server-chosen URL (model.ts, CAPABILITIES, README, change file) |
| 3 | stacked `isFailure` checks in `createHttpTransport` | **chained** with `.onSuccess`; same messages; every read of the caller's objects still inside its capture; the build step moved to `_buildHttpTransport` |
| 4 | stacked checks in `_resolveCallOptions` | **chained** (redirect, then retry), as `_prepareGuardedFetch` does. `_walk` / `_execute` untouched (D1 in `personality-asks-2026-10/followups.md`) |
| 5 | `_reasonOf` re-spelled the unexpected-error wrapping | both now build it from `_unexpectedReason` |
| 6 | `GUARDED_FETCH_METHODS` hand-copied the method union | `SAFER_FETCH_METHODS` (`as const`, exported) and `SaferFetchMethod` derived from it; the union is unchanged |
| 7 | temporal markers | both `describe`s renamed after their behaviour; the "now … used to need" comment rewritten |
| 8 | inline `await import` in a test | moved to a top-level import |
| 9 | userinfo in `resource_metadata` | `acceptResourceMetadataUrl` drops it; test. R43. The existing forged-URL fixture gained empty `username` / `password` so it still reaches the line check |
| 10 | the secrets sweep missed the code verifier and `state` | `TestProvider` records both into `GENERATED_SECRETS`, which `afterEach` scans with `SECRETS` and then clears; `state` values made distinctive (`state-<n>-csrf-e2f1`) |
| 11 | "`authProvider` is passed through" | now "wrapped, with the interactive steps gated; a different object from your provider" (index.ts, README, FUTURE.md, model.ts, CAPABILITIES, change file) |
| 12 | indexed access on `FetchFailureReason['kind']` | `SaferFetch.FetchFailureKind` exported and used in `model.ts` and `sdk.ts`; `.api.md` regenerated by the build |
| 13 | facade coverage | `FORWARDED_PROVIDER_MEMBERS: Record<keyof McpOAuthClientProvider, true>` (compile-time), and the forwarding test asserts the facade's keys equal it. R44 |
| 14 | change-file wording | the buffered paths take `string \| Uint8Array`, so only a `Uint8Array` is copied there; the stray ",." removed |
| 15 | `NON_REFUSAL_FETCH_FAILURES` | one line added on the SDK's CORS-retry fallback not running through a guarded fetch |

## What the brief got wrong

- **Body shapes:** the SDK sends a `URLSearchParams` body on every OAuth token request; "string,
  `Uint8Array` or absent" would have refused all of them.
- **"A `GuardedFetchError` from any call becomes the new kind"** — see the disagreement above:
  `network`/`timeout`/`aborted`/`unknown` are not configuration refusals (and a guarded `timeout`
  is `'timeout'`, after the orchestrator review).
- **Belief 2 is wider than stated:** the injected `fetch` also carries every OAuth discovery,
  registration and token request, with the consumer's static headers merged in by the SDK — which is
  why static headers now reach only the endpoint's origin.
- **Belief 6:** the dependency on `@fgv/ts-extras` is a peer dependency.
- **"`GuardedFetchError extends Error`"** was right, and needed to be exactly that: the SDK treats a
  `TypeError` from `fetch` as CORS during discovery.
- **The interactive-flow question** had a definite answer — the SDK *can* start it from the
  standalone `GET` and its reconnect timer — and it was preventable without touching the SDK: gate
  the provider rather than the paths.
