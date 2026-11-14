[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProviderCompletion

# Function: callProviderCompletion()

> **callProviderCompletion**(`params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

Calls the appropriate chat completion API for a given provider. Routes by
`apiFormat`: `'openai'` (xAI/OpenAI/Groq/Mistral — switches to Responses API
when tools are set), `'anthropic'`, or `'gemini'`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IProviderCompletionParams`](../interfaces/IProviderCompletionParams.md) |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>
