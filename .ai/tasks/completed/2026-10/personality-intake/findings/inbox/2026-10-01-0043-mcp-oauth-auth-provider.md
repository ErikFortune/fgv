# ts-extras-mcp: OAuth authProvider passthrough and unauthorized classification

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#677](https://github.com/ErikFortune/personaility/issues/677) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:18Z. No comments.
- **Long form:** [`ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M7](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`.

## The request, in their terms

> "pass the SDK's `authProvider` (`OAuthClientProvider`) through on `createHttpTransport`. Also add an `unauthorized` failure kind (see the M3 ask) that carries the resource-metadata URL from `WWW-Authenticate`."

Note problem: "Remote MCP servers increasingly require OAuth 2.1 per the MCP authorization spec … The SDK implements the client side behind `authProvider?: OAuthClientProvider` … and raises `UnauthorizedError`; the package exposes neither. fgv's own FUTURE entry already notes \"the SDK has an auth provider abstraction\" (`docs/FUTURE.md:397`)."

## Stated motivation

> "servers that require OAuth can't be reached through the package. The only alternative would be using the SDK directly, which the package exists to avoid."

## Stated constraints or acceptance

- Note: "Minimum: `authProvider?` passthrough on `createHttpTransport`, and an `unauthorized` failure kind (M3) that carries the `WWW-Authenticate` resource-metadata URL."
- > "A Result-wrapped helper around the SDK's `auth()` flow would be welcome but is not required."
- Note: "we would implement `OAuthClientProvider` over our keystore either way (tokens and client registration persist there)."
- Requester-stated priority: "**P2.** It blocks MCP plan P4 (OAuth servers)."
- Verified against `@fgv/ts-extras-mcp` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`.

## Stated dependencies

- Depends on the failure-kind vocabulary asked for in M3 ([#673](https://github.com/ErikFortune/personaility/issues/673)).

## Observations (intake agent's, not the requester's)

- fgv `docs/FUTURE.md:397` already notes: "Slice 1 supports static headers only … The SDK has an auth provider abstraction for OAuth flows."
