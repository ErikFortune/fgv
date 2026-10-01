# ts-extras-mcp: session close observation and a failure kind

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#673](https://github.com/ErikFortune/personaility/issues/673) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:00Z. No comments.
- **Long form:** [`ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M3](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`.

## The request, in their terms

Two parts (issue):

> "**Failure kinds:** classify call failures (tool error, timeout, aborted, not connected or session expired, protocol, transport, unauthorized) instead of leaving the consumer to parse message text."
>
> "**Close notification:** let the consumer observe when a session closes."

Proposed shape (note): "(a) A `DetailedResult` (or a `kind` on the failure) distinguishing at least `tool-error` · `timeout` · `aborted` · `not-connected` / `session-expired` · `protocol` · `transport` · `unauthorized`; (b) an observable close — an `onClose` callback on `connectMcpSession`, or an `isConnected` / `status` read on the session."

## Stated motivation

> "A dead session is discovered only when the next call fails, and a consumer cannot tell *why* a call failed without parsing message text."

Note: "`callMcpTool` prefixes transport and protocol failures with `callMcpTool '<name>':` but leaves a tool's own `isError` text unprefixed … — deliberately, for the model's sake — so the prefix is the only signal."

Evidence (note): "[spike] after `SIGKILL` of the stdio child: `callMcpTool 'echo': Not connected`, `listMcpTools: Not connected`. After an HTTP server restart: `Streamable HTTP error … \"Bad Request: No valid session ID provided\"`. Neither is reported until a call is made; neither re-initializes. No test covers either."

## Stated constraints or acceptance

- > "Reconnect policy stays with the consumer; we only need to know when to apply it."
- Requester-stated priority: "**P1.** It retires the hub-side message-prefix check the MCP plan uses in its first phase."
- Interim: "the hub's session pool treats any failure whose message starts with `callMcpTool '` as a suspect session. It reconnects before the next call and never retries the failed one."
- Verified against `@fgv/ts-extras-mcp` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`.

## Stated dependencies

- M1 ([#671](https://github.com/ErikFortune/personaility/issues/671)) and M7 ([#677](https://github.com/ErikFortune/personaility/issues/677)) both refer to this ask's failure kinds (`timeout`/`aborted`, `unauthorized`).
- Note "What we are *not* asking for": "A reconnect/pool manager in the package. Lifecycle policy (idle close, reconnect-once, per-credential sessions) is the host's; M1/M3 give us what we need to build it on the boundary."

## Observations (intake agent's, not the requester's)

- None.
