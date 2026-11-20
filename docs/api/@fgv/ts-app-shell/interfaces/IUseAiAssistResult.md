[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IUseAiAssistResult

# Interface: IUseAiAssistResult

Return type of the useAiAssist hook.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-actions"></a> `actions` | `readonly` | readonly [`IAiAssistAction`](IAiAssistAction.md)[] | Available actions based on settings + keystore state |
| <a id="property-copyprompt"></a> `copyPrompt` | `readonly` | (`prompt`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`"copied"`\>\> | Execute a copy-paste action: copies the combined prompt to clipboard. |
| <a id="property-generatedirect"></a> `generateDirect` | `readonly` | \<`TEntity`\>(`provider`, `prompt`, `convert`, `tools?`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiAssistResult`](IAiAssistResult.md)\<`TEntity`\>\>\> | Execute a direct API action: calls the provider, validates the response, returns the entity. |
| <a id="property-generateimages"></a> `generateImages` | `readonly` | (`provider`, `params`, `signal?`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiImageGenerationResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\> | Execute an image-generation action: calls the provider's image API and returns the generated images. |
| <a id="property-isworking"></a> `isWorking` | `readonly` | `boolean` | Whether a direct assist call is in progress |
| <a id="property-listmodels"></a> `listModels` | `readonly` | (`provider`, `capability?`, `signal?`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IAiModelInfo`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)[]\>\> | List the models available from a provider, optionally filtered by capability. |
| <a id="property-streamdirect"></a> `streamDirect` | `readonly` | (`provider`, `prompt`, `onEvent`, `options?`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\{ `fullText`: `string`; `truncated`: `boolean`; \}\>\> | Stream a chat completion from the provider. The `onEvent` callback fires for every event (text deltas, tool progress, errors); the returned promise resolves with the aggregated final text and truncation flag on success, or with `Result.fail` when the stream couldn't be started or ended in a terminal error event. |
