[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IContextConverters

# Interface: IContextConverters

Converters for task summaries, updates and the pure context surface.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskContextBudget`](ITaskContextBudget.md)\> | Shape only. The renderer additionally rejects a `maxChars` below its framing reserve. |
| <a id="property-completeness"></a> `completeness` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TaskInputCompleteness`](../type-aliases/TaskInputCompleteness.md)\> | - |
| <a id="property-contextunresolvedreference"></a> `contextUnresolvedReference` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IContextUnresolvedReference`](../type-aliases/IContextUnresolvedReference.md)\> | An unresolved reference as the renderer accepts it: the same fields, with the binding optional. The renderer never presents a binding, so a bound view's projected reference — which has none — converts here. Storage uses `unresolvedReference` instead, where the binding stays required; the two are separate so the renderer's leniency can never reach a persisted record. |
| <a id="property-inclusionentry"></a> `inclusionEntry` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IInclusionEntry`](IInclusionEntry.md)\> | - |
| <a id="property-input"></a> `input` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskContextInput`](ITaskContextInput.md)\> | - |
| <a id="property-presentable"></a> `presentable` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSummary`](ITaskSummary.md)\> | A summary, or a snapshot reduced to one. `details` is accepted and discarded — the one place a snapshot's details are dropped, and they are dropped because they are never implicitly model-visible. |
| <a id="property-receipt"></a> `receipt` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskInclusionReceipt`](ITaskInclusionReceipt.md)\> | - |
| <a id="property-summary"></a> `summary` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSummary`](ITaskSummary.md)\> | A strict `{ envelope }` summary. A `details` field is a failure here. |
| <a id="property-unresolvedreference"></a> `unresolvedReference` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IUnresolvedTaskReference`](IUnresolvedTaskReference.md)\> | - |
| <a id="property-update"></a> `update` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskUpdate`](ITaskUpdate.md)\> | - |
| <a id="property-updatecategory"></a> `updateCategory` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`UpdateCategory`](../type-aliases/UpdateCategory.md)\> | - |
