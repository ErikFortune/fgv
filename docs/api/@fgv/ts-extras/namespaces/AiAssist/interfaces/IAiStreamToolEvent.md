[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStreamToolEvent

# Interface: IAiStreamToolEvent

A server-side tool progress event arriving during a streaming completion.
Surfaced for providers that emit explicit tool-progress markers (OpenAI
Responses API, Anthropic). Gemini's grounding doesn't emit these.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-detail"></a> `detail?` | `readonly` | `string` | Optional provider-specific detail. For web_search this is typically the search query when available; format varies by provider. |
| <a id="property-phase"></a> `phase` | `readonly` | `"completed"` \| `"started"` | Tool lifecycle phase. |
| <a id="property-tooltype"></a> `toolType` | `readonly` | `"web_search"` | Which server-side tool this event describes. |
| <a id="property-type"></a> `type` | `readonly` | `"tool-event"` | - |
