[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptStoreListFilter

# Interface: IPromptStoreListFilter

Filter for [IPromptStore.list](IPromptStore.md#list).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | Restrict to records carrying this prompt id (across all scopes). |
| <a id="property-scope"></a> `scope?` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | Restrict to records in this scope. |
