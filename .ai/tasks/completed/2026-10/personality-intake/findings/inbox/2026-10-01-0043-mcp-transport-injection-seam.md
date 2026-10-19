# ts-extras-mcp: public transport-injection seam for consumer tests

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#678](https://github.com/ErikFortune/personaility/issues/678) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:22Z. No comments.
- **Long form:** [`ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M8](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`.

## The request, in their terms

> "let a consumer test the session and adapter against an in-memory server. Two ways would work: accept a pre-built SDK transport, or export a `createInMemoryTransportPair`. fgv already tracks this in its own `docs/FUTURE.md`; this issue records that a consumer needs it."

Note problem: "Consumers cannot drive the session/adapter against an in-memory server in their own tests; the package's own e2e reaches the internal `McpTransport` (`test/unit/endToEnd.test.ts:56`). Already tracked as fgv `docs/FUTURE.md:400`."

## Stated motivation

> "the hub's tests start the reference MCP server (`server-everything`) over HTTP on a temporary loopback port."

Note: "slower, binds a port, needs a dev dependency on the reference server."

## Stated constraints or acceptance

- Note: "As fgv's entry says: accept a pre-built SDK transport, or an exported `createInMemoryTransportPair` for tests."
- Requester-stated priority: "**P2.** It blocks nothing."
- Verified against `@fgv/ts-extras-mcp` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`.

## Stated dependencies

None stated.

## Observations (intake agent's, not the requester's)

- Confirmed: fgv `docs/FUTURE.md:400` ("Transport-injection testability seam") already records this gap, surfaced by the ErikFortune/fgv#471 verification.
