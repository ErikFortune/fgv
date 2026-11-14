[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICheckTaskPromptParams

# Interface: ICheckTaskPromptParams

Parameters for [checkTaskPrompt](../functions/checkTaskPrompt.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachehints"></a> `cacheHints?` | `readonly` | `IToCacheRequestHints` | Passed to `toCacheRequest`. |
| <a id="property-composition"></a> `composition?` | `readonly` | `IPromptCompositionOptions` | Passed to the resolve's composition request. Supply a tokenizer `measure` and a `cacheDiagnostics.minCacheablePrefixTokens` to get a threshold verdict; without them the threshold is classified `unknown`. |
| <a id="property-context"></a> `context` | `readonly` | [`ITaskContext`](ITaskContext.md) | A rendered context — from `TaskContextRenderer.render` or a delivery's `prepare`. |
| <a id="property-library"></a> `library` | `readonly` | [`ITaskPromptLibrary`](ITaskPromptLibrary.md) | - |
| <a id="property-request"></a> `request` | `readonly` | [`ITaskPromptRequest`](ITaskPromptRequest.md) | - |
| <a id="property-taskslot"></a> `taskSlot?` | `readonly` | `SlotName` | Defaults to [defaultTaskContextSlotName](../variables/defaultTaskContextSlotName.md). |
