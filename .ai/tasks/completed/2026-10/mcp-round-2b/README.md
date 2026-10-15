# mcp-round-2b — guarded MCP egress and OAuth

**Shipped**: 2026-10-14 into `integration/asks` via #729.
Packages: `@fgv/ts-extras` (safer-fetch), `@fgv/ts-extras-mcp`.

## Summary

Two PersonAIlity asks:

- **#672.** A streaming guarded fetch, `SaferFetch.createGuardedFetch`, in `@fgv/ts-extras`. Every
  request runs the same hop walk as the buffered entry points; the response comes back with its body
  unread. `createHttpTransport({ fetch })` routes every MCP HTTP request through it, and a refusal is
  the new `egress-blocked` failure kind.
- **#677.** `createHttpTransport({ authProvider })` takes the SDK's `OAuthClientProvider`
  (`McpOAuthClientProvider`). Interactive authorization runs only inside `connectMcpSession`.
  `unauthorized` carries `resourceMetadataUrl`.

## The facts the design rests on

- **The SDK sends every request through the transport's `fetch`** — including every OAuth
  discovery, registration and token request, with the consumer's static headers merged in. So the
  package always installs its own wrapper, which also drops static headers from other origins.
- **OAuth token requests carry a `URLSearchParams` body**, so the guarded fetch accepts one.
- **The SDK treats a `TypeError` from `fetch` as CORS** during discovery, so `GuardedFetchError`
  extends `Error`, never `TypeError`.
- **The SDK's standalone `GET` starts `auth()` on a 401**, from a detached start and from its own
  reconnect timer. The provider is therefore gated (`state`, `saveCodeVerifier`,
  `redirectToAuthorization`) rather than the paths.
- **The SDK exports `extractWWWAuthenticateParams`**, so `resource_metadata` is read through a
  supported API in the package wrapper; `_resourceMetadataUrl` is never touched.

## Files changed

- `libraries/ts-extras/src/packlets/safer-fetch/`: `saferFetch.ts` (shared walk, streaming entry),
  `deadline.ts` (optional overall deadline), new `guardedFetchError.ts`, `model.ts`, `guards.ts`, both
  barrels; tests in `src/test/unit/safer-fetch/guardedFetch.test.ts`.
- `libraries/ts-extras-mcp/src/packlets/mcp/`: new `egress.ts`; `model.ts`, `sdk.ts`, `session.ts`,
  `operations.ts`, `request.ts`, `transports.ts`; tests `egress`, `oauth`, `realHttpServer` helper,
  and updates to `sdk`, `mcp`, `httpFailures`, `terminate`.
- `etc/*.api.md`, both packages' `CAPABILITIES.md`, the MCP `README.md`,
  `.ai/instructions/LIBRARY_CAPABILITIES.md` (one shortcut), `docs/FUTURE.md`, three change files
  (`minor`).

## Read next

`result.md`: belief verdicts, the SDK behaviour tables, the check-then-act table, the 28-row revert
matrix (R7 not isolatable), the review dispositions, the gate counts, and what the brief got wrong.

## Open

- A helper around the SDK's `auth()` flow (FUTURE.md, with a proposed shape). Until it exists the
  consumer exchanges the authorization code with the SDK's `auth()` and **must pass its guarded fetch
  as `fetchFn`**, or that exchange bypasses the guard and the static-header rule.
- One residual on the interactive gate: the SDK's standalone `GET` is started inside `connect`, so a
  401 on it before `connect` settles still reaches the interactive steps. After `connect`, never.
- The secrets proof does not cover an authorization code: no code exchange runs through the package.
- TECH_DEBT's `__proto__`-in-`tools/list` entry named this stream as its trigger; passed on and
  retargeted to the SDK v2 rename.
- Pinned connect, to close DNS rebinding for MCP egress (FUTURE.md). `createGuardedFetch` takes a
  `transport`, so it inherits the fix without a signature change.
- PersonAIlity #672 and #677 can close against the merge commit.
