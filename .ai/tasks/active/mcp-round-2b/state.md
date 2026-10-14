# mcp-round-2b — working state

## Progress

- [x] 1. safer-fetch refactor: one hop walk, a per-entry-point finisher (no behaviour change)
- [ ] 2. streaming guarded fetch (`createGuardedFetch`)
- [ ] 3. MCP `fetch` wiring + `egress-blocked` classification
- [ ] 4. OAuth (`authProvider`, `resourceMetadataUrl`, interactive gate)
- [ ] code-reviewer, coverage, gates, finalize

## Findings so far (SDK 1.29.0, read from `dist/esm`)

- Every transport request (`POST` in `send`, `GET` in `_startOrAuthSse`, `DELETE` in
  `terminateSession`) is `(this._fetch ?? fetch)(this._url, init)`: `url` is a `URL`, `init.headers`
  a `Headers`, `init.body` a `string` (POST) or absent.
- `auth()` is called with `fetchFn: this._fetchWithInit` (= `createFetchWithInit(opts.fetch,
  requestInit)`), so OAuth discovery, dynamic registration and the token endpoint also go through
  the injected fetch. Token requests send a **`URLSearchParams`** body, so the guarded fetch must
  accept it (the brief's string/Uint8Array list is incomplete).
- `createFetchWithInit` merges `requestInit.headers` (our static `headers`) into every auth
  request — including requests to the authorization server, a different origin chosen by the MCP
  server's metadata. A static `x-api-key` would be sent there. The package fetch wrapper strips the
  consumer's static headers from requests to any origin other than the MCP endpoint's.
- `fetchWithCorsRetry` (auth discovery) treats a rejected fetch whose error is a `TypeError` as
  CORS and retries/swallows it. `GuardedFetchError` therefore must **not** extend `TypeError`.
- `extractWWWAuthenticateParams` is exported from `@modelcontextprotocol/sdk/client/auth.js` (a
  public subpath) — the supported route to `resource_metadata`; no reach into `_resourceMetadataUrl`.
- The standalone SSE `GET` answers a 401 with `_authThenStart()` → `auth()`, which can call
  `saveCodeVerifier` + `redirectToAuthorization`. That `GET` is started detached after
  `notifications/initialized` and by the reconnect timer — paths the consumer did not start.
  `terminateSession()` never calls `auth()` (a 401 there is a `StreamableHTTPError`), but reads
  `tokens()` via `_commonHeaders()`.

## Decisions

- Streaming path: no overall deadline; headers deadline per hop; non-2xx responses are returned,
  not failed (a fetch-shaped caller — the SDK — branches on 401/404/405); the response-headers guard
  runs on every final response.
