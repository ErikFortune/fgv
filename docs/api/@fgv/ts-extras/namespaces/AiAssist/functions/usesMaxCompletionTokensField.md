[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / usesMaxCompletionTokensField

# Function: usesMaxCompletionTokensField()

> **usesMaxCompletionTokensField**(`descriptor`): `boolean`

Determines whether a provider's OpenAI-compatible Chat Completions request
should use the modern `max_completion_tokens` field instead of the legacy
`max_tokens` field for capping output length.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor. |

## Returns

`boolean`

`true` when the descriptor declares `'max_completion_tokens'`.

## Remarks

Reads the descriptor's [AiAssist.IAiProviderDescriptor.chatOutputTokensField](../interfaces/IAiProviderDescriptor.md#property-chatoutputtokensfield) declaration.
In the shipped registry OpenAI, Groq and xAI Grok declare `'max_completion_tokens'` (each
API reference marks `max_tokens` deprecated in its favor); Mistral, Ollama and self-hosted
`openai-compat` servers declare nothing and keep `max_tokens`. Consulted
by both the completion (`callProviderCompletion`) and streaming
(`callProviderCompletionStream`) chat-completions dispatch branches. Not
consulted on the Responses API path — `max_output_tokens` applies uniformly
there for both OpenAI and xAI (see `isResponsesOnlyModel`) —
nor by any non-`'openai'`-format provider (Anthropic, Gemini).
