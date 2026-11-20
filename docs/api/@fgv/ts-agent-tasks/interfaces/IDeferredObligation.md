[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeferredObligation

# Interface: IDeferredObligation

A waiting obligation, as read from its task.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-attention"></a> `attention` | `readonly` | readonly [`ITaskReference`](ITaskReference.md)[] | The host's own references on its wait reason, without the change references. |
| <a id="property-changedat"></a> `changedAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) | - |
| <a id="property-changes"></a> `changes` | `readonly` | readonly `string`[] | The changes it owes, the one it was created for first. A merge adds others' changes. |
| <a id="property-createdat"></a> `createdAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) | - |
| <a id="property-key"></a> `key` | `readonly` | [`IDeferredObligationKey`](IDeferredObligationKey.md) | What its id names: the change it was created for, and its role. |
| <a id="property-notbefore"></a> `notBefore?` | `readonly` | [`Instant`](../type-aliases/Instant.md) | - |
| <a id="property-reason"></a> `reason` | `readonly` | [`IWaitingReason`](IWaitingReason.md) | Its wait reason, as stored. |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) | The task's revision — the precondition of its next write. |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
| <a id="property-waitsremaining"></a> `waitsRemaining` | `readonly` | `number` | How many more waits it can be written before its per-task operation budget, less the closeout slots the repository holds for its terminal command and archive, is spent. See [DeferredObligations.wait](../classes/DeferredObligations.md#wait). |
