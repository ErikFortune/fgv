[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskQuery

# Interface: ITaskQuery

A page request. `limit` defaults to 50 and may not exceed 200.

## Extended by

- [`IDueTaskQuery`](IDueTaskQuery.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-cursor"></a> `cursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` |
| <a id="property-selection"></a> `selection` | `readonly` | [`ITaskSelection`](ITaskSelection.md) |
