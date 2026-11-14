[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStreamDone

# Interface: IAiStreamDone

Terminal success event for a streaming completion. Carries the aggregated
full text and truncation status for callers that want both the progressive
UI and the complete result.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fulltext"></a> `fullText` | `readonly` | `string` | The full concatenated text from all `text-delta` events. |
| <a id="property-incompletereason"></a> `incompleteReason?` | `readonly` | `string` | Provider-reported reason a truncated response was cut short (e.g. `'max_output_tokens'`, `'content_filter'`), when the provider supplies one. Currently populated only by the OpenAI / xAI Responses adapter, from the completed payload's `incomplete_details.reason`. Meaningful only when `truncated === true`; `undefined` otherwise (and whenever the provider reports truncation without a reason). |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | Whether the response was truncated due to token limits. |
| <a id="property-type"></a> `type` | `readonly` | `"done"` | - |
| <a id="property-usage"></a> `usage?` | `readonly` | [`IAiCompletionUsage`](IAiCompletionUsage.md) | Token usage, when the provider reports it on this stream. |
