[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskStopToolResult

# Interface: ITaskStopToolResult

What `task_stop` and `task_stop_inspect` return to the model: one stop as this principal may see
it, its targets a page at a time.

## Remarks

`intentId` names the stop; `task_stop_inspect` takes it back. `taskId` is the stop's root.

`counts` counts every target this principal may see, by state — states with none are left out —
over the whole stop, not the page. `targets` is one page of those targets, in the stop's own order
(root first, then breadth-first), at most the tool budget's `context.maxItems`. `remaining` is how
many visible targets follow the page; when there are any, `nextAfter` names the page's last target,
and `task_stop_inspect` continues after it. Within one stop as it stands, nothing is dropped: every
visible target is on some page. Each page is a fresh read, so a target that became visible since an
earlier page, before its continuation, is on no later page — `counts` then grows, which says to
start again without `after`.

`restrictedWorkRemains` says, without counts or identities, that some target this principal cannot
see is not confirmed. A host capacity refusal the stop met is never returned: it goes to the host's
logger, and the affected target's own state (`unavailable`) says it could not be attempted.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-counts"></a> `counts` | `readonly` | `Readonly`\<`Partial`\<`Record`\<[`StopTargetState`](../type-aliases/StopTargetState.md), `number`\>\>\> |
| <a id="property-intentid"></a> `intentId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-mode"></a> `mode` | `readonly` | [`StopMode`](../type-aliases/StopMode.md) |
| <a id="property-nextafter"></a> `nextAfter?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-remaining"></a> `remaining` | `readonly` | `number` |
| <a id="property-restrictedworkremains"></a> `restrictedWorkRemains` | `readonly` | `boolean` |
| <a id="property-state"></a> `state` | `readonly` | [`StopIntentState`](../type-aliases/StopIntentState.md) |
| <a id="property-targets"></a> `targets` | `readonly` | readonly [`ITaskStopToolTarget`](ITaskStopToolTarget.md)[] |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
