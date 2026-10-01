# ts-extras ai-assist: pass the turn's AbortSignal to `IAiClientTool.execute`

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#684](https://github.com/ErikFortune/personaility/issues/684) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-10-01T00:43:52Z. No comments.
- **Long form:** [`.ai/notes/fgv-share/ASK-2026-09-29-client-tool-execute-signal.md`](https://github.com/ErikFortune/personaility/blob/design/mcp-tools/.ai/notes/fgv-share/ASK-2026-09-29-client-tool-execute-signal.md) on branch `design/mcp-tools`.

## The request, in their terms

> "pass the turn's `signal` through to the tool as an optional second argument, `IAiClientTool.execute(args, context?: { signal?: AbortSignal })`. Today a cancelled or timed-out turn stops the provider stream, but the tool keeps running."

Note, cited code: "`IExecuteClientToolTurnParams.signal` aborts the provider stream, but `execute: (args) => Promise<Result<unknown>>` (`toolTypes.ts:185`) receives no signal, and the builder calls `tool.execute(validationResult.value)` (`clientToolContinuationBuilder.ts:953`)."

## Stated motivation

> "For an MCP tool that means a third-party request that may have side effects or bill per call."

Note: "Until now our tools were in-process reads; an orphaned call cost nothing." and "When the host's deadline fires mid-tool — personaility's `AiAssistProvider` aborts at 10 minutes … — the provider request stops and the tool keeps running."

## Stated constraints or acceptance

- > "The change is additive, so every existing tool stays valid."
- Note: "fgv decides."
- Requester-stated priority: "**P2.** It blocks nothing."
- Interim: "the hub's MCP tool adapter races each call against its own timeout. An orphaned call keeps running until the MCP SDK's 60 s timeout, or until M1 lands."
- Verified against `@fgv/ts-extras` 5.1.0-57.

## Package(s) it appears to touch

`@fgv/ts-extras` (ai-assist packlet: `IAiClientTool`, `executeClientToolTurn`).

## Stated dependencies

- > "It pairs with the M1 ask on ts-extras-mcp (per-call timeout and `AbortSignal`)." — [#671](https://github.com/ErikFortune/personaility/issues/671).

## Observations (intake agent's, not the requester's)

- `IAiClientTool.execute` is still `(args: TParams) => Promise<Result<unknown>>` at `libraries/ts-extras/src/packlets/ai-assist/toolTypes.ts:185` on `integration/agent-tasks-v1` @ `2a95fbb2`. `ts-agent-tasks`' `createTaskTools` yields `IAiClientTool`s, so it is an in-repo implementer of this interface.
