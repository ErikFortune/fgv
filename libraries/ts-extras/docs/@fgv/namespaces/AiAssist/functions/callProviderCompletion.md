[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / callProviderCompletion

# Function: callProviderCompletion()

> **callProviderCompletion**(`params`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

Calls the appropriate chat completion API for a given provider.

Routes based on the provider descriptor's `apiFormat` field:
- `'openai'` for xAI, OpenAI, Groq, Mistral
- `'anthropic'` for Anthropic Claude
- `'gemini'` for Google Gemini

When tools are provided and the provider supports them:
- OpenAI-format providers switch to the Responses API
- Anthropic includes tools in the Messages API request
- Gemini includes Google Search grounding

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IProviderCompletionParams`](../interfaces/IProviderCompletionParams.md) | Request parameters including descriptor, API key, prompt, and optional tools |

## Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

The completion response with content and truncation status, or a failure
