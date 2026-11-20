[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskChildState

# Interface: ITaskChildState

The state of one child, as the authoritative graph holds it.

## Remarks

Every retained child is listed — archived, unresolved and quarantined ones too — so list
completion and relationship checks never see a filtered tree.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-archived"></a> `archived` | `readonly` | `boolean` | - |
| <a id="property-id"></a> `id` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
| <a id="property-state"></a> `state` | `readonly` | `"unresolved"` \| `"resolved"` \| `"quarantined"` | - |
| <a id="property-status"></a> `status?` | `readonly` | [`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md) | The lifecycle status of a resolved child; archived children keep their final status. |
