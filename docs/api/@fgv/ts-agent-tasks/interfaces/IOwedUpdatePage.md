[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IOwedUpdatePage

# Interface: IOwedUpdatePage

One page of owed updates, ordered by task, revision and category.

## Remarks

Owed-update lookup is independent of every lifecycle index: a terminal or archived task's
obligations remain listed after it leaves open work.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-completeness"></a> `completeness` | `readonly` | [`TaskInputCompleteness`](../type-aliases/TaskInputCompleteness.md) |
| <a id="property-generation"></a> `generation` | `readonly` | `number` |
| <a id="property-nextcursor"></a> `nextCursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-updates"></a> `updates` | `readonly` | readonly [`ITaskUpdate`](ITaskUpdate.md)[] |
