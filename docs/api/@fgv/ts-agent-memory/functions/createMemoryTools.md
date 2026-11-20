[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / createMemoryTools

# Function: createMemoryTools()

> **createMemoryTools**(`params`): readonly [`IAiClientTool`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`unknown`\>[]

Build the selected suite of memory `AiAssist.IAiClientTool`s over a
pre-scoped store — ready to hand to `AiAssist.executeClientToolTurn` (and, via
the shared `JsonSchema.object(...)` schemas, `@fgv/ts-extras-mcp`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ICreateMemoryToolsParams`](../interfaces/ICreateMemoryToolsParams.md) |

## Returns

readonly [`IAiClientTool`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`unknown`\>[]

## Remarks

**Scope isolation is make-or-break.** The returned tools close over the
pre-scoped [store](../interfaces/ICreateMemoryToolsParams.md#property-store); no tool's
`parametersSchema` declares a `scope` (or any scope-widening) property, so an
LLM cannot steer a tool at another actor's memory. The store instance is the
sole scope authority.

The default selection is [DEFAULT\_MEMORY\_TOOLS](../variables/DEFAULT_MEMORY_TOOLS.md) (the read-only set) —
`memory_write` / `memory_delete` are included only when named in
[tools](../interfaces/ICreateMemoryToolsParams.md#property-tools).
