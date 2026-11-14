[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDueTaskQuery

# Interface: IDueTaskQuery

A due-candidate page request: waiting tasks whose `notBefore` is present and at or before
`cutoff`. Querying never starts, resumes or otherwise changes a task.

## Extends

- [`ITaskQuery`](ITaskQuery.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-cursor"></a> `cursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-cutoff"></a> `cutoff` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` |
| <a id="property-selection"></a> `selection` | `readonly` | [`ITaskSelection`](ITaskSelection.md) |
