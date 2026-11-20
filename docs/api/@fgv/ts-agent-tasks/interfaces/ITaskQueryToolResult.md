[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskQueryToolResult

# Interface: ITaskQueryToolResult

What `task_query` returns to the model.

## Remarks

`context` is the rendered page. A task on the page that the rendering left out is named in
`omitted`, and one it shortened in `abbreviated`, so the model can inspect it: `nextCursor`
continues after the whole page, including what the text did not show. `completeness`,
`freshness` and `issues` are the view's own.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-abbreviated"></a> `abbreviated` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] |
| <a id="property-completeness"></a> `completeness` | `readonly` | `"complete"` \| `"partial"` |
| <a id="property-context"></a> `context` | `readonly` | `string` |
| <a id="property-freshness"></a> `freshness` | `readonly` | `"native-current"` \| `"source-projection"` |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] |
| <a id="property-nextcursor"></a> `nextCursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-omitted"></a> `omitted` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] |
