[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptComposeContributorObservation

# Interface: IPromptComposeContributorObservation

One nested contributor within an [IPromptComposeObservation](IPromptComposeObservation.md): the
composer-layer `provenance` a contributor was tagged with, plus the id and
full resolve `trace` of its independently-resolved prompt.

## Remarks

The `trace` is the direct analogue of
[resourceBindingResolutions\[\].innerTrace](IResourceBindingTraceEntry.md#property-innertrace)
— nesting each contributor's full [IPromptResolveTrace](IPromptResolveTrace.md) is what ties the
composed output back to the N independent contributor resolves an audit trail
would otherwise see disconnected from the composition.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-promptid"></a> `promptId` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | Id of the contributor's independently-resolved prompt. |
| <a id="property-provenance"></a> `provenance` | `readonly` | `number` | Composer-layer provenance the contributor was tagged with. |
| <a id="property-trace"></a> `trace` | `readonly` | [`IPromptResolveTrace`](IPromptResolveTrace.md) | The contributor's full resolve trace (the `innerTrace` analogue). |
