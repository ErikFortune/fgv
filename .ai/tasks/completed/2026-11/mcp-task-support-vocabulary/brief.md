# mcp-task-support-vocabulary — brief

**Base:** `integration/asks` @ 1cb9dc701. **Branch:** `mcp-task-support-vocabulary`.
**Source ask:** personaility#725 (`fgv-ask`), detail note
`.ai/notes/fgv-share/ASK-2026-11-14-mcp-task-support-vocabulary.md` on personaility `working` @ `0d3e95ef`.
**Shape:** small stream, one worker. Orchestrator-owned; record questions in `state.md`, do not edit
this file.

## Problem

`MCP_TASK_SUPPORT_VALUES` (`['forbidden', 'optional', 'required'] as const`) and
`McpTaskSupport` (`StringOneOf<typeof MCP_TASK_SUPPORT_VALUES>`) live in
`libraries/ts-extras-mcp/src/packlets/mcp/model.ts` (~565–572). `ts-extras-mcp` depends on
`@modelcontextprotocol/sdk` and is Node-only, so a platform-neutral consumer (PersonAIlity's core,
which runs in the browser and already depends on `@fgv/ts-extras`) cannot import them and has to
redeclare a local copy. The vocabulary is MCP-spec-level (`Tool.execution.taskSupport`; absent
means `'forbidden'`), not SDK- or transport-level.

## Decisions (made; do not reopen)

1. **Home:** `@fgv/ts-extras`, `ai-assist` packlet, in `toolTypes.ts` beside `IAiToolAnnotations`,
   which already mirrors MCP's `ToolAnnotations` 1:1 and ships in both the Node and browser
   builds. Exported through the packlet barrel, so consumers reach it as
   `AiAssist.MCP_TASK_SUPPORT_VALUES` / `AiAssist.McpTaskSupport`. Keep the MCP names: the values
   are MCP's, and the name says so.
2. **Converter:** add `AiAssist.Converters.mcpTaskSupport` (or the packlet's equivalent
   converter-naming convention — check how `ai-assist` exposes converters and follow it) built with
   `Converters.enumeratedValue<McpTaskSupport>(MCP_TASK_SUPPORT_VALUES)`. It converts a present
   value only; the "absent means `'forbidden'`" rule is documented on the type, not folded into the
   converter (absent-vs-present stays the caller's to decide, as `ts-extras-mcp` does today).
3. **One declaration.** `ts-extras-mcp` stops declaring the values and type and uses the
   `ts-extras` ones. Its public surface keeps both names (consumers of `@fgv/ts-extras-mcp` must not
   break): bind them from `AiAssist` in `model.ts` (e.g. `export const MCP_TASK_SUPPORT_VALUES =
   AiAssist.MCP_TASK_SUPPORT_VALUES;` and `export type McpTaskSupport = AiAssist.McpTaskSupport;`)
   with TSDoc saying they are the `@fgv/ts-extras` declarations. Its `operations.ts` converter
   should use the new `ts-extras` converter rather than building its own.
4. **No behaviour change** anywhere: same three values, same order, same drop-and-log handling of
   unknown values in `ts-extras-mcp`'s listing.

## Out of scope

Adding a `taskSupport` field to `IAiClientToolConfig` or any ai-assist runtime behaviour around
tasks. This stream moves a vocabulary; it does not give ai-assist task semantics.

## Requirements

- TSDoc on the new exports: what the values are, that they mirror MCP's
  `Tool.execution.taskSupport`, and that an absent value means `'forbidden'`. No cross-package
  `{@link}` (code spans instead).
- Tests in `ts-extras`: the values (exact array), the converter accepting each value and refusing
  others (`toFailWith`). `ts-extras-mcp`'s existing taskSupport tests must still pass unchanged;
  add one asserting `TsExtrasMcp`'s `MCP_TASK_SUPPORT_VALUES` is the same array the `ts-extras`
  one is (identity or deep-equal — say which and why).
- 100% coverage both packages; no `c8 ignore`.
- `.api.md` regenerated for both packages.
- Docs: `libraries/ts-extras/CAPABILITIES.md` entry for the new exports;
  `libraries/ts-extras-mcp/CAPABILITIES.md` updated to say where the vocabulary is declared. Do not
  add a router shortcut unless one fits the 24,000-char cap (`verify-capability-docs.mjs`).
- Change files: `@fgv/ts-extras` `minor` (additive); `@fgv/ts-extras-mcp` `none` or `patch`
  (surface unchanged — pick and justify).
- Repo-wide grep for `MCP_TASK_SUPPORT_VALUES` / `McpTaskSupport` across `libraries/ tools/
  samples/` and update every hit.

## Process

- Do not spawn subagents or a code-reviewer; the orchestrator runs the independent review.
- Commit before gating; run gates in the foreground and wait for them.
- Gate from the worktree root, logs under
  `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/mcpvocab/`:
  `node common/scripts/install-run-rush.js install`, `change --verify --target-branch
  origin/integration/asks`, `rebuild`, `lint`, `test`. Grade by grep: `not met|Operations
  failed|error TS|Jest tests? failed|ERR_PNPM` = 0; the only allowed warning is the tracked-symlink
  notice. `rushx fixlint` in each touched package before the final commit; `npx -y prettier@2.8.8
  --check` on touched `.md`; `node common/scripts/generate-capability-feed.mjs --check` and
  `node common/scripts/verify-capability-docs.mjs`.
- Close out per the `finalize-task` skill into
  `.ai/tasks/completed/2026-11/mcp-task-support-vocabulary/` (README, `state.md`, `result.md`,
  `meta.yaml` with `prs: []` and PR `#TBD`), with a ledger entry in `docs/workstreams/2026-11.md`
  and the `WORKSTREAMS.md` index.
- Push to `origin/mcp-task-support-vocabulary`. Do not open a PR. Never force-push, rebase, or
  delete branches.
- Report: head SHA, files changed, tests added, gate grep results, anything decided in `state.md`.
