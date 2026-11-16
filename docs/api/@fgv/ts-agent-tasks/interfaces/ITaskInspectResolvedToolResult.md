[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskInspectResolvedToolResult

# Interface: ITaskInspectResolvedToolResult

What `task_inspect` returns to the model for a resolved task.

## Remarks

`revision` is the revision the view read. A mutation tool takes it back as `expectedRevision`,
and the writer refuses the change if the task has moved since: a stale inspection is the model's
to refresh, never overwritten by the tool.
`commands` are those the view reports available for this call. `details` appears only when the
view's projector exposes details and their serialized text fits the budget; when it does not fit,
`detailsOmitted` says so and no part of them is returned. The details budget is independent of
the context budget, so details can be returned for a task whose text was omitted. Details are
task data exactly like the prose in `context`: one line of JSON text, every string in it escaped
as the renderer escapes task prose (`serializeTaskData`), never structured data a host's JSON
passes through unescaped.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-archived"></a> `archived` | `readonly` | `boolean` |
| <a id="property-commands"></a> `commands` | `readonly` | readonly `string`[] |
| <a id="property-context"></a> `context` | `readonly` | `string` |
| <a id="property-details"></a> `details?` | `readonly` | `string` |
| <a id="property-detailsomitted"></a> `detailsOmitted?` | `readonly` | `"too-large"` |
| <a id="property-presentation"></a> `presentation` | `readonly` | [`TaskToolPresentation`](../type-aliases/TaskToolPresentation.md) |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-state"></a> `state` | `readonly` | `"resolved"` |
