[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPage

# Interface: ITaskPage

One page of tasks.

## Remarks

Ordinary pages are ordered by task id; due pages by `(notBefore, taskId)`. `unresolved`
references matched the selection's scopes, parent and responsibility but have no lifecycle to
classify; they consume the same page budget, and their presence makes the page `partial`, as
does a matching task whose kind is not registered (named in `issues`).

`nextCursor` is present whenever the query may have more — including when the page's
candidate budget ran out before the page filled, which can return a short or even empty page
that is **not** the end. A cursor is valid only at the returned `generation`: any committed
change restarts paging.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-completeness"></a> `completeness` | `readonly` | [`TaskInputCompleteness`](../type-aliases/TaskInputCompleteness.md) | - |
| <a id="property-freshness"></a> `freshness` | `readonly` | `"native-current"` \| `"source-projection"` | `source-projection` when any item is bound to an external source. |
| <a id="property-generation"></a> `generation` | `readonly` | `number` | - |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] | - |
| <a id="property-items"></a> `items` | `readonly` | readonly [`ITaskSummary`](ITaskSummary.md)[] | - |
| <a id="property-nextcursor"></a> `nextCursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) | - |
| <a id="property-unresolved"></a> `unresolved` | `readonly` | readonly [`IUnresolvedTaskReference`](IUnresolvedTaskReference.md)[] | - |
