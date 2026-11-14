[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IPrepareTaskPromptParams

# Interface: IPrepareTaskPromptParams

Parameters for [prepareTaskPrompt](../functions/prepareTaskPrompt.md): a checked prompt's parameters, with the context prepared
from a bound delivery rather than supplied.

## Extends

- `Omit`\<[`ICheckTaskPromptParams`](ICheckTaskPromptParams.md), `"context"`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget?` | `readonly` | [`ITaskContextBudget`](ITaskContextBudget.md) | Passed to the delivery's `prepare`. |
| <a id="property-cachehints"></a> `cacheHints?` | `readonly` | `IToCacheRequestHints` | Passed to `toCacheRequest`. |
| <a id="property-composition"></a> `composition?` | `readonly` | `IPromptCompositionOptions` | Passed to the resolve's composition request. Supply a tokenizer `measure` and a `cacheDiagnostics.minCacheablePrefixTokens` to get a threshold verdict; without them the threshold is classified `unknown`. |
| <a id="property-delivery"></a> `delivery` | `readonly` | [`IBoundTaskDelivery`](IBoundTaskDelivery.md) | - |
| <a id="property-library"></a> `library` | `readonly` | [`ITaskPromptLibrary`](ITaskPromptLibrary.md) | - |
| <a id="property-request"></a> `request` | `readonly` | [`ITaskPromptRequest`](ITaskPromptRequest.md) | - |
| <a id="property-taskslot"></a> `taskSlot?` | `readonly` | `SlotName` | Defaults to [defaultTaskContextSlotName](../variables/defaultTaskContextSlotName.md). |
