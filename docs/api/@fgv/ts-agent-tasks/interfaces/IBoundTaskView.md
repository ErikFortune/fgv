[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskView

# Interface: IBoundTaskView

A read-only view bound to one principal.

## Extended by

- [`IBoundTaskWriter`](IBoundTaskWriter.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-principal"></a> `principal` | `readonly` | `string` |

## Methods

### inspect()

> **inspect**(`id`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskInspection`](../type-aliases/TaskInspection.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskInspection`](../type-aliases/TaskInspection.md)\>\>

***

### inspectStop()

> **inspectStop**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

One cascade stop's current result, as this principal may see it: the root must be visible, and
only visible targets are listed. Reading it performs no effect. (T9.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStopInspectRequest`](IStopInspectRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

***

### query()

> **query**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IBoundTaskQuery`](IBoundTaskQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>

***

### queryDue()

> **queryDue**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>

The waiting tasks within this view that are due at `cutoff`, from the repository's due index,
authorized and projected exactly as [IBoundTaskView.query](#query) answers: denied candidates are
dropped, and the cursor is bound to this view and policy epoch. Querying never starts or
changes a task.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IBoundTaskDueQuery`](IBoundTaskDueQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>
