[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeferral

# Interface: IDeferral

What [DeferredObligations.defer](../classes/DeferredObligations.md#defer) records.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-attention"></a> `attention?` | `readonly` | readonly [`ITaskReference`](ITaskReference.md)[] | The host's references for the wait reason. None may use the change namespace. |
| <a id="property-key"></a> `key` | `readonly` | [`IDeferredObligationKey`](IDeferredObligationKey.md) | - |
| <a id="property-notbefore"></a> `notBefore` | `readonly` | `number` | When it is first due, in epoch milliseconds. See [DeferredObligations.firstNotBefore](../classes/DeferredObligations.md#firstnotbefore). |
| <a id="property-scopes"></a> `scopes?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] | Scopes the task carries beside the helper's own — a room, a document. A replay after a crash must name the same ones: a task left `pending` is set waiting only when it carries exactly the helper's scope plus these, and a pending registration is resumed with them. |
| <a id="property-summary"></a> `summary?` | `readonly` | `string` | The wait reason's summary. Defaults to a fixed sentence. |
| <a id="property-title"></a> `title` | `readonly` | `string` | The obligation task's title. Used only when the task is created. |
