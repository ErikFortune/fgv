[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IUseAiAssistResult

# Interface: IUseAiAssistResult

Return type of the useAiAssist hook.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="actions"></a> `actions` | `readonly` | readonly [`IAiAssistAction`](IAiAssistAction.md)[] | Available actions based on settings + keystore state |
| <a id="copyprompt"></a> `copyPrompt` | `readonly` | (`prompt`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`"copied"`\>\> | Execute a copy-paste action: copies the combined prompt to clipboard. |
| <a id="generatedirect"></a> `generateDirect` | `readonly` | \<`TEntity`\>(`provider`, `prompt`, `convert`, `tools?`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiAssistResult`](IAiAssistResult.md)\<`TEntity`\>\>\> | Execute a direct API action: calls the provider, validates the response, returns the entity. |
| <a id="isworking"></a> `isWorking` | `readonly` | `boolean` | Whether a direct assist call is in progress |
