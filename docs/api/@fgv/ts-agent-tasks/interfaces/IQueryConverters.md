[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IQueryConverters

# Interface: IQueryConverters

Converters for repository queries.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-duequery"></a> `dueQuery` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IDueTaskQuery`](IDueTaskQuery.md)\> | A due query: its selection must admit `waiting`. |
| <a id="property-lifecycleclass"></a> `lifecycleClass` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TaskLifecycleClass`](../type-aliases/TaskLifecycleClass.md)\> | - |
| <a id="property-limit"></a> `limit` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\> | A page limit: a positive safe integer no greater than [maxTaskPageLimit](../variables/maxTaskPageLimit.md). |
| <a id="property-owedquery"></a> `owedQuery` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOwedUpdateQuery`](IOwedUpdateQuery.md)\> | - |
| <a id="property-pagecursor"></a> `pageCursor` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`PageCursor`](../type-aliases/PageCursor.md)\> | A page cursor token. Only its syntax is checked here: whether it names a live handle, for this query and this generation, is the issuing repository's question. |
| <a id="property-query"></a> `query` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskQuery`](ITaskQuery.md)\> | - |
| <a id="property-selection"></a> `selection` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSelection`](ITaskSelection.md)\> | A selection whose `statuses` all belong to its `lifecycleClass`. |
| <a id="property-status"></a> `status` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md)\> | - |
