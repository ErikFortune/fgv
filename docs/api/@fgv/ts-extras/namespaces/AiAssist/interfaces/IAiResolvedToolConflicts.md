[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiResolvedToolConflicts

# Interface: IAiResolvedToolConflicts

The outcome of [AiAssist.resolveToolConflicts](../functions/resolveToolConflicts.md): the tools that survived,
plus the report of what did not.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-clienttools"></a> `clientTools` | `readonly` | readonly [`IAiClientTool`](IAiClientTool.md)\<`unknown`\>[] | Client tools to send, after the policy was applied. |
| <a id="property-report"></a> `report` | `readonly` | [`IAiToolConflictReport`](IAiToolConflictReport.md) | What the resolution did. Always populated; empty arrays mean nothing conflicted. |
| <a id="property-servertools"></a> `serverTools` | `readonly` | readonly [`IAiWebSearchToolConfig`](IAiWebSearchToolConfig.md)[] | Server tools to send, after the policy was applied. |
