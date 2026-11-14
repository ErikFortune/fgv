# ts-extras-mcp: per-call timeout and AbortSignal on `callMcpTool`

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#671](https://github.com/ErikFortune/personaility/issues/671) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:42:50Z. No comments.
- **Long form (linked from the issue):** [`.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md` § M1](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-ts-extras-mcp-hub-readiness.md) on branch `design/mcp-tools`. Plan it serves: `.ai/tasks/active/mcp-tools-plan/design.md` (same branch).

## The request, in their terms

> "an optional options bag on `callMcpTool` (timeout, `AbortSignal`, progress), mapped onto the MCP SDK's `RequestOptions`, so a call is not stuck at the SDK's fixed 60 s timeout and can be cancelled."

Note § M1 problem statement: "`callMcpTool` (`operations.ts:159-181`) passes no `RequestOptions`, so every call gets the SDK's fixed `DEFAULT_REQUEST_TIMEOUT_MSEC = 60000` … and nothing can cancel it."

Proposed shape (note): "An optional options bag on `callMcpTool` (and forwarded by the adapter's `execute`), e.g. `{ timeoutMs?, signal?, onProgress?, resetTimeoutOnProgress?, maxTotalTimeoutMs? }`, mapped 1:1 onto the SDK's `RequestOptions` … Likewise optional on `listMcpTools` / `connectMcpSession`."

Evidence cited (note): "[spike] a 70 s `trigger-long-running-operation` fails at **60 001 ms** with `MCP error -32001: Request timed out`; there is no parameter to lengthen, shorten or abort it."

## Stated motivation

> "Our turn has its own deadline and an `AbortSignal`; neither can reach the MCP request."

> "The MCP request keeps running on the server until the SDK's 60 s fires — an orphaned call we cannot cancel, which matters for any tool with side effects and for per-call-billed servers."

## Stated constraints or acceptance

- > "A timed-out or aborted call should be distinguishable from a tool error (see M3)."
- Requester-stated priority: "**P1.** It blocks nothing, and it would remove the hub-side timeout race the MCP plan uses in its first phase."
- Interim: "the hub races each call against its own timeout. The orphaned request keeps running on the server until the SDK's 60 s timeout fires."
- Note template: "fgv decides the interface; the note proposes a shape only."
- Verified against: `@fgv/ts-extras-mcp` 5.1.0-57 / fgv `release` @ `30713277`.

## Package(s) it appears to touch

`@fgv/ts-extras-mcp`.

## Stated dependencies

- References M3 ([#673](https://github.com/ErikFortune/personaility/issues/673)) for the timeout/aborted failure distinction.
- Named as the MCP-side companion of the ai-assist signal ask ([#684](https://github.com/ErikFortune/personaility/issues/684)).

## Observations (intake agent's, not the requester's)

- On `integration/agent-tasks-v1` @ `2a95fbb2`, `callMcpTool(session, name, args)` (`libraries/ts-extras-mcp/src/packlets/mcp/operations.ts:159`) still takes no options argument.
