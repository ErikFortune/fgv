[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptStoreEvent

# Interface: IPromptStoreEvent

Pinned store-change event shape (per OQ-3). No v0.1 adapter emits these;
the shape is fixed now so a future watch-implementing adapter doesn't
churn the type surface.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | Set for `descriptor-changed` / `descriptor-removed`; undefined for the scope-scoped events. |
| <a id="property-kind"></a> `kind` | `readonly` | [`PromptStoreEventKind`](../type-aliases/PromptStoreEventKind.md) | Discriminator. |
| <a id="property-scope"></a> `scope` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | - |
