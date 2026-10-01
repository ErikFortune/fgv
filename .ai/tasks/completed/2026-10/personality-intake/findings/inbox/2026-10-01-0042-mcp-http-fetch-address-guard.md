# ts-extras-mcp: injectable fetch / address guard on `createHttpTransport`

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#672](https://github.com/ErikFortune/personaility/issues/672) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:42:56Z. No comments.
- **Long form:** [`ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M2](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`.

## The request, in their terms

> "let a consumer supply the HTTP transport's `fetch`, or a `SaferFetch` address guard plus a redirect policy. The goal is that MCP egress gets the same private-network protection as every other outbound path in the hub."

Note § M2 problem: "`createHttpTransport` forwards only `requestInit.headers` (`sdk.ts:150-153`). The SDK then uses global `fetch`: no private-address guard, default redirect following, no way to route through a metered or pinned egress path. The SDK already accepts `fetch?: FetchLike` …; the package does not expose it."

Proposed shape (note): "Either `IMcpHttpTransportParams.fetch?` passed through to the SDK, or — more in the package's style — `addressGuard?: SaferFetch.IAddressGuard` plus a redirect policy, so the consumer hands over the same guard it uses for `saferFetchJson`. We would use whichever you prefer; the guard form keeps SSRF policy in one fgv primitive."

## Stated motivation

> "An MCP server URL is the same SSRF surface with credentials attached, and custom credential headers (an `x-api-key`, unlike `Authorization`) are **not** stripped by `fetch` on a cross-origin redirect."

The note cites personaility's other outbound paths going through `SaferFetch` with `blockPrivateNetworks` (`services/personaility-hub/src/hub/addressedIngestService.ts:101-123`).

## Stated constraints or acceptance

- > "The guarded path must not buffer the response, because Streamable HTTP and SSE replies are long-lived streams."
- Note: "a guard that reads the body to completion before returning would break every streaming call."
- Requester-stated priority: "**P1.** It blocks MCP plan P3 (servers registered by a non-admin) and custom-header credentials in P2."
- Interim (issue): "Only the admin can author an MCP server, and only once the hub has an admin password." / "The URL is checked when it is saved: `https:` only, private address ranges refused." / "Credentials can only go in the `Authorization` header." / "Accepted residual risk: DNS rebinding between that check and the connection, and redirects to private addresses."
- Verified against `@fgv/ts-extras-mcp` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`; the guard form references `SaferFetch` from `@fgv/ts-extras`.

## Stated dependencies

None stated beyond the plan phases it blocks (P2, P3).

## Observations (intake agent's, not the requester's)

- `saferFetchJson` / `saferFetchBytes` + `addressGuard` / `blockPrivateNetworks` exist in `ts-extras` (LIBRARY_CAPABILITIES index). They return a buffered JSON or bytes result; the request's stated constraint is that the guarded path must not buffer.
