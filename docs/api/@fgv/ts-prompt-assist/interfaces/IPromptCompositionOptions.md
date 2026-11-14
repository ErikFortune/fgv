[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptCompositionOptions

# Interface: IPromptCompositionOptions

Options requesting a [IPromptComposition](IPromptComposition.md) from a resolve. Presence opts in.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachediagnostics"></a> `cacheDiagnostics?` | `readonly` | [`IPromptCacheDiagnosticOptions`](IPromptCacheDiagnosticOptions.md) | Options for the prompt-cache stability diagnostic run alongside the composition. See [IPromptComposition.cacheFindings](IPromptComposition.md#property-cachefindings) and `design.md` §9. |
| <a id="property-measure"></a> `measure?` | `readonly` | [`PromptSectionMeasure`](../type-aliases/PromptSectionMeasure.md) | Optional second measure per section — typically a tokenizer. See [PromptSectionMeasure](../type-aliases/PromptSectionMeasure.md). |
