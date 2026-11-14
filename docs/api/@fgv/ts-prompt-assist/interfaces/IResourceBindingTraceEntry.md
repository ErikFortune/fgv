[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IResourceBindingTraceEntry

# Interface: IResourceBindingTraceEntry

Recursive trace entry for a resource binding inner resolve.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-depth"></a> `depth` | `readonly` | `number` | 1-based recursion depth (outer is 0; first inner is 1). |
| <a id="property-innertrace"></a> `innerTrace` | `readonly` | [`IPromptResolveTrace`](IPromptResolveTrace.md) | Full inner-resolve trace (recursive). |
| <a id="property-resourceid"></a> `resourceId` | `readonly` | [`ResourceId`](../type-aliases/ResourceId.md) | Inner prompt id (treated as a `PromptId` for the inner resolve). |
| <a id="property-slot"></a> `slot` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | Outer slot whose binding referenced an inner prompt. |
| <a id="property-substitutionmode"></a> `substitutionMode` | `readonly` | [`ResourceSubstitutionMode`](../type-aliases/ResourceSubstitutionMode.md) | `'replace'` when the binding supplied its own substitutions; `'inherit'` otherwise. |
