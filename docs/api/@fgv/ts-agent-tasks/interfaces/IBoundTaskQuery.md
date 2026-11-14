[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskQuery

# Interface: IBoundTaskQuery

A bound view's query. Scopes are the view's own; a filter only narrows.

## Remarks

`lifecycleClass` defaults to `all`. There is no `scopes` member, and the converter is strict:
a caller-supplied scope filter is refused, never merged.

## Extended by

- [`IBoundTaskDueQuery`](IBoundTaskDueQuery.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-cursor"></a> `cursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-filter"></a> `filter?` | `readonly` | [`IBoundTaskQueryFilter`](IBoundTaskQueryFilter.md) |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` |
