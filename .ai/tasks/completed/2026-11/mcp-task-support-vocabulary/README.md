# mcp-task-support-vocabulary — MCP's taskSupport vocabulary, declared once and browser-safe

**Shipped**: 2026-11-14 into `integration/asks` via #783.
Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`), `@fgv/ts-extras-mcp` (change file
`none`). Origin: personaility#725 (fgv-ask).

## Summary

`MCP_TASK_SUPPORT_VALUES` / `McpTaskSupport` — MCP's `Tool.execution.taskSupport` vocabulary,
`'forbidden' | 'optional' | 'required'`, absent meaning `'forbidden'` — were declared in
`@fgv/ts-extras-mcp`, which depends on the MCP SDK and is Node-only. A browser consumer that already
depends on `@fgv/ts-extras` had to redeclare them.

They are now declared in `@fgv/ts-extras`'s `ai-assist` packlet beside `IAiToolAnnotations`, with a
new `AiAssist.mcpTaskSupport` converter. `@fgv/ts-extras-mcp` binds the same declarations under its
existing names and converts with the shared converter. No behaviour change.

## What a reader should know

- **One declaration.** `TsExtrasMcp.MCP_TASK_SUPPORT_VALUES` *is* `AiAssist.MCP_TASK_SUPPORT_VALUES`;
  a test asserts identity (`toBe`), not equality.
- **The converter takes a present value only.** `undefined` fails like any other non-member;
  applying the absent-means-`'forbidden'` default stays the caller's decision.
- **The converter is `AiAssist.mcpTaskSupport`, not `AiAssist.Converters.mcpTaskSupport`** — the
  packlet exports converters flat (`state.md` decision 1).
- **No task semantics in ai-assist.** `IAiClientToolConfig` has no `taskSupport` field; that was out
  of scope.

## Artifacts

`brief.md` (frozen contract), `state.md` (decisions), `result.md` (outcome and tests), `meta.yaml`.
