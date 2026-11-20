[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IContributorSpec

# Interface: IContributorSpec

One contributor to a horizontal composition. The consumer resolves each
contributor independently via `PromptLibrary.resolve()` before passing it
to the composer. The composer does not resolve — it composes resolved
outputs, reading each contributor's per-slot values off
[IResolvedPrompt.slots](IResolvedPrompt.md#property-slots).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-provenance"></a> `provenance` | `readonly` | `number` | Provenance priority for this contributor. Higher numbers take precedence for `'overwrite'`-strategy slots. For `'concatenate'` slots, contributions are joined in ascending provenance order (lowest-priority first — the "later instructions take precedence" LLM reading convention, matching the existing partial-fragment join order in the resolver). **Remarks** Provenance is a composer-layer concept only. It never participates in ts-res candidate selection — by the time a contributor reaches the composer it is already fully resolved (own qualifiers, own candidates, own substitutions). |
| <a id="property-resolved"></a> `resolved` | `readonly` | [`IResolvedPrompt`](IResolvedPrompt.md) | The independently-resolved prompt this contributor brings to the composition. |
