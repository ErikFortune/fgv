[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskEnvelope

# Interface: ITaskEnvelope

The common, bounded envelope carried by every task regardless of its kind.

## Remarks

Four things version independently and are spelled separately here: `schemaVersion`
(this envelope), `detailVersion` (the kind's detail schema), the source binding's
own `referenceVersion`, and the repository storage format. V1 writes only
`schemaVersion: 1`.

Metadata ownership is likewise explicit: `parentId`, `responsibility`, `scopes`,
`stopPolicy` and `binding` are catalog-owned, while `lifecycle`, `progress` and
`attention` are execution fields a source projection may carry.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-attention"></a> `attention` | `readonly` | readonly [`ITaskReference`](ITaskReference.md)[] |
| <a id="property-binding"></a> `binding?` | `readonly` | [`ISourceBinding`](ISourceBinding.md) |
| <a id="property-changedat"></a> `changedAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-description"></a> `description?` | `readonly` | `string` |
| <a id="property-detailversion"></a> `detailVersion` | `readonly` | `number` |
| <a id="property-id"></a> `id` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-kind"></a> `kind` | `readonly` | [`TaskKind`](../type-aliases/TaskKind.md) |
| <a id="property-lifecycle"></a> `lifecycle` | `readonly` | [`TaskLifecycle`](../type-aliases/TaskLifecycle.md) |
| <a id="property-observation"></a> `observation` | `readonly` | [`ObservationHealth`](../type-aliases/ObservationHealth.md) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-progress"></a> `progress?` | `readonly` | [`ITaskProgress`](ITaskProgress.md) |
| <a id="property-recovery"></a> `recovery` | `readonly` | [`RecoveryDeclaration`](../type-aliases/RecoveryDeclaration.md) |
| <a id="property-responsibility"></a> `responsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-schemaversion"></a> `schemaVersion` | `readonly` | `1` |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-stoppolicy"></a> `stopPolicy` | `readonly` | [`ParentStopPolicy`](../type-aliases/ParentStopPolicy.md) |
| <a id="property-title"></a> `title` | `readonly` | `string` |
