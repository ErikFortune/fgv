[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IRegisterExternalTask

# Interface: IRegisterExternalTask

A trusted host registration of an externally executed task.

## Remarks

Not a bound-view operation: the host supplies scopes, the source binding and the recovery
declaration directly. Without an `initialObservation` the task is recorded unresolved, with no
lifecycle invented. The binding is catalog metadata and never changes afterwards.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-binding"></a> `binding` | `readonly` | [`ISourceBinding`](ISourceBinding.md) | - |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - |
| <a id="property-detailversion"></a> `detailVersion` | `readonly` | `number` | - |
| <a id="property-history"></a> `history?` | `readonly` | [`SourceHistoryDeclaration`](../type-aliases/SourceHistoryDeclaration.md) | The history guarantee this registration relies on. Absent means `observed-state`. A `source-replay` declaration states the finite remaining envelope the task needs to reach a terminal state; it is reserved at registration (design § 8.6) and is refused unless the broker has the source attached and that source is `source-replay`. A `source-replay` registration takes no `initialObservation`: its first state comes from the feed, never from an independent latest read that could jump owed history. |
| <a id="property-initialobservation"></a> `initialObservation?` | `readonly` | [`ISourceProjection`](ISourceProjection.md) | - |
| <a id="property-kind"></a> `kind` | `readonly` | [`TaskKind`](../type-aliases/TaskKind.md) | - |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| <a id="property-parentid"></a> `parentId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
| <a id="property-recovery"></a> `recovery` | `readonly` | [`RecoveryDeclaration`](../type-aliases/RecoveryDeclaration.md) | - |
| <a id="property-responsibility"></a> `responsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) | - |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] | - |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
| <a id="property-title"></a> `title` | `readonly` | `string` | - |
