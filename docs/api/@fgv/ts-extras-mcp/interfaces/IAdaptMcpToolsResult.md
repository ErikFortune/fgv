[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IAdaptMcpToolsResult

# Interface: IAdaptMcpToolsResult

The result of [adaptMcpTools](../functions/adaptMcpTools.md): cleanly-adapted client tools plus the structurally-surfaced
set of tools that could not be adapted (graceful degradation, Constraint 1).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-skipped"></a> `skipped` | `readonly` | readonly [`IMcpSkippedTool`](IMcpSkippedTool.md)[] | Tools excluded from `tools`, each with the [McpSkipKind](../type-aliases/McpSkipKind.md) of why. |
| <a id="property-tools"></a> `tools` | `readonly` | readonly [`IAiClientTool`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`unknown`\>[] | Tools adapted into `IAiClientTool` — safe to hand to `AiAssist.executeClientToolTurn`. |
