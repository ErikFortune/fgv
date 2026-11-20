[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITrackedTaskPatch

# Interface: ITrackedTaskPatch

A patch of a tracked task's presentable fields. An absent member is left alone; `clear` names
the optional fields to remove, and may not name a field the patch also sets.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-attention"></a> `attention?` | `readonly` | readonly [`ITaskReference`](ITaskReference.md)[] |
| <a id="property-clear"></a> `clear?` | `readonly` | readonly (`"progress"` \| `"description"`)[] |
| <a id="property-description"></a> `description?` | `readonly` | `string` |
| <a id="property-progress"></a> `progress?` | `readonly` | [`ITaskProgress`](ITaskProgress.md) |
| <a id="property-title"></a> `title?` | `readonly` | `string` |
