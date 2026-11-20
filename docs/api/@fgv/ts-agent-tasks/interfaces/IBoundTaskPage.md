[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskPage

# Interface: IBoundTaskPage

One page of a bound view's query.

## Remarks

Holds only tasks the principal may read, projected. Denied candidates are dropped before
inclusion and never counted, so a page can be short or empty and still carry a cursor. It has
no repository generation: a change counter over the whole repository would leak activity on
hidden tasks. `issues` never names a task.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-completeness"></a> `completeness` | `readonly` | `"complete"` \| `"partial"` |
| <a id="property-freshness"></a> `freshness` | `readonly` | `"native-current"` \| `"source-projection"` |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] |
| <a id="property-items"></a> `items` | `readonly` | readonly [`IProjectedTaskSummary`](IProjectedTaskSummary.md)[] |
| <a id="property-nextcursor"></a> `nextCursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-unresolved"></a> `unresolved` | `readonly` | readonly [`IProjectedUnresolvedReference`](../type-aliases/IProjectedUnresolvedReference.md)[] |
