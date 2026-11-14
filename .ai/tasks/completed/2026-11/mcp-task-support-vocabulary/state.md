# mcp-task-support-vocabulary — state

Worker-owned. Brief is frozen; judgement calls the brief left open are recorded here.

## Decisions

1. **Converter name and placement: `AiAssist.mcpTaskSupport`, not `AiAssist.Converters.mcpTaskSupport`.**
   The `ai-assist` packlet has no `Converters` sub-namespace: every converter in
   `src/packlets/ai-assist/converters.ts` (`aiToolAnnotations`, `aiClientToolConfig`,
   `geminiThinkingLevel`, …) is exported flat from the packlet barrel. The brief said to follow the
   packlet's convention, so the converter sits in `converters.ts` beside `aiToolAnnotations` and is
   exported flat. It is typed `Converter<McpTaskSupport>` like the file's other enumerated
   converters (`aiProviderId`, `geminiThinkingLevel`), not with the `ReadonlyArray<…>` context type
   `ts-extras-mcp`'s private `_taskSupport` carried.
2. **Re-export path inside `ts-extras`.** The values and type are declared in `toolTypes.ts` and
   re-exported through `model.ts`, which the file header names as "the single import site every
   consumer already uses"; the barrel imports them from `./model` with the other tool types. The
   const needs a value `export { … } from './toolTypes'` because `model.ts`'s existing tool-type
   re-export is `export type { … }`.
3. **`ts-extras-mcp` binding carries an explicit annotation.** The brief's example
   (`export const MCP_TASK_SUPPORT_VALUES = AiAssist.MCP_TASK_SUPPORT_VALUES;`) fails lint
   (`@rushstack/typedef-var`, which the build surfaces as a warning and CI treats as blocking), so
   it is `export const MCP_TASK_SUPPORT_VALUES: typeof AiAssist.MCP_TASK_SUPPORT_VALUES = …`. The
   `.api.md` line therefore reads `typeof AiAssist.MCP_TASK_SUPPORT_VALUES` rather than the literal
   tuple; the resolved type is identical. Restating the tuple literally would have been a second
   declaration, which is what the stream removes.
4. **`operations.ts` uses `AiAssist` directly** for both the converter and the error-text list,
   rather than importing the re-bound `MCP_TASK_SUPPORT_VALUES` from `./model`. Same array either
   way; this keeps the function reading from the one declaration. The error text is unchanged
   (`forbidden, optional, required`), and the existing `mcp.test.ts` assertion on it still passes.
5. **The identity test is `toBe`, not `toEqual`.** "One declaration" is the decision; deep equality
   would pass for a drifted-but-currently-equal copy, identity fails for any copy. The same test
   also checks, at compile time, that the two type names are assignable in both directions.
6. **`ts-extras` tests go through the public barrel** (`import { AiAssist } from '../../..'`) in a
   new `mcpTaskSupport.test.ts`, so the test pins the exports as well as the behaviour.
7. **TSDoc uses code spans for the new symbols, not `{@link AiAssist.…}`.** A first build with
   `{@link AiAssist.McpTaskSupport}` etc. baked six `ae-unresolved-link` warnings into
   `ts-extras.api.md` ("This type of declaration is not supported yet by the resolver" — the
   resolver handles namespace-member interfaces but not these consts/type aliases). Code spans
   leave the `.api.md` clean.
8. **Change-file types:** `@fgv/ts-extras` `minor` (additive public surface). `@fgv/ts-extras-mcp`
   `none`: the names, values, order and resolved types on its surface are unchanged and there is no
   behaviour change — only the location of the declaration moved. `patch` would claim a fix that
   did not happen. (`.api.md` text changed for two lines because the declarations are now
   expressed through `AiAssist`, and the unused `StringOneOf` import dropped.)
9. **No router shortcut.** `LIBRARY_CAPABILITIES.md` measured 23,999 / 24,000 before this stream, so
   the shortcut lives only in `libraries/ts-extras/CAPABILITIES.md`, per the brief.

## Repo-wide grep

`grep -rn 'MCP_TASK_SUPPORT_VALUES\|McpTaskSupport' libraries tools samples` (excluding `lib/`,
`node_modules`) before the change: hits only in `libraries/ts-extras-mcp` (`model.ts`,
`operations.ts`, `etc/ts-extras-mcp.api.md`, `CAPABILITIES.md`). All updated. No hits in `tools/`
or `samples/`.
