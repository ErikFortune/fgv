# mcp-task-support-vocabulary — result

**Shipped:** MCP's `Tool.execution.taskSupport` vocabulary is now declared once, in `@fgv/ts-extras`'s browser-safe `ai-assist` packlet — `AiAssist.MCP_TASK_SUPPORT_VALUES`, `AiAssist.McpTaskSupport` and a new `AiAssist.mcpTaskSupport` converter — and `@fgv/ts-extras-mcp` binds those same declarations under its existing names.

## What landed

- `libraries/ts-extras/src/packlets/ai-assist/toolTypes.ts` — `MCP_TASK_SUPPORT_VALUES`
  (`['forbidden', 'optional', 'required'] as const`) and `McpTaskSupport`
  (`StringOneOf<typeof MCP_TASK_SUPPORT_VALUES>`), beside `IAiToolAnnotations`. TSDoc says they
  mirror MCP's `Tool.execution.taskSupport` and that absent means `'forbidden'`.
- `converters.ts` — `mcpTaskSupport: Converter<McpTaskSupport>`, built with
  `Converters.enumeratedValue`. Present values only; the absent default stays the caller's.
- `model.ts` / `index.ts` — re-exported; reachable as `AiAssist.*`.
- `libraries/ts-extras-mcp/src/packlets/mcp/model.ts` — the local declarations are gone;
  `MCP_TASK_SUPPORT_VALUES` and `McpTaskSupport` are bound from `AiAssist`. `operations.ts` drops its
  private `_taskSupport` converter and uses `AiAssist.mcpTaskSupport`.
- `.api.md` regenerated for both packages; CAPABILITIES.md updated for both; change files
  (`ts-extras` `minor`, `ts-extras-mcp` `none`).

## Behaviour

Unchanged: same three values in the same order, same drop-and-log handling of an unknown or
non-object `execution` in `listMcpTools`, same fixed log text. `ts-extras-mcp`'s existing taskSupport
tests pass unmodified.

## Tests added

- `libraries/ts-extras/src/test/unit/ai-assist/mcpTaskSupport.test.ts` (15 tests, via the public
  barrel): the exact array; the converter accepts each of the three values; refuses wrong-case,
  unknown, empty and padded strings; refuses `undefined`, `null`, a number, a boolean, an object and
  an array (`toFailWith`).
- `libraries/ts-extras-mcp/src/test/unit/index.test.ts` (+1): `TsExtrasMcp.MCP_TASK_SUPPORT_VALUES`
  is **identical** (`toBe`) to `AiAssist.MCP_TASK_SUPPORT_VALUES`, and the two type names are
  mutually assignable. Identity rather than deep equality because the decision is "one declaration":
  an equal copy would pass `toEqual` and still be a second source.

## Judgement calls

See `state.md` § Decisions (converter placement/naming, the lint-required annotation on the
`ts-extras-mcp` binding, code spans over `{@link}`, change-file types).

## Gates

Recorded in the stream's report and the PR description.
