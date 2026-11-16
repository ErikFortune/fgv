[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / ISqliteVecFragmentIndexHandle

# Interface: ISqliteVecFragmentIndexHandle

An index plus the connection [SqliteVecFragmentIndex.open](../classes/SqliteVecFragmentIndex.md#open) opened for it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-index"></a> `index` | `readonly` | [`SqliteVecFragmentIndex`](../classes/SqliteVecFragmentIndex.md) | The index, ready to use. |

## Methods

### close()

> **close**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Closes the connection **this `open` call created**. Idempotent — a second
`close` succeeds rather than failing. See
[ISqliteVecVectorIndexHandle.close](ISqliteVecVectorIndexHandle.md#close) for why the disposer lives here
rather than on the index class.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>
