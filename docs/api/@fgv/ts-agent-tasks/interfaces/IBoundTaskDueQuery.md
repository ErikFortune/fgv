[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskDueQuery

# Interface: IBoundTaskDueQuery

A bound view's due query: the waiting tasks within the view whose `notBefore` is at or before
`cutoff`, answered from the repository's due index — never by scanning.

## Remarks

The same narrowing filter as [IBoundTaskQuery](IBoundTaskQuery.md); `lifecycleClass` may not be `terminal` and
`statuses`, when given, must include `waiting`. Pages are ordered by `(notBefore, taskId)`.

## Extends

- [`IBoundTaskQuery`](IBoundTaskQuery.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-cursor"></a> `cursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-cutoff"></a> `cutoff` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-filter"></a> `filter?` | `readonly` | [`IBoundTaskQueryFilter`](IBoundTaskQueryFilter.md) |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` |
