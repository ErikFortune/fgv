[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / ISqliteVecVectorIndexHandle

# Interface: ISqliteVecVectorIndexHandle

An index plus the connection [SqliteVecVectorIndex.open](../classes/SqliteVecVectorIndex.md#open) opened for it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-index"></a> `index` | `readonly` | [`SqliteVecVectorIndex`](../classes/SqliteVecVectorIndex.md) | The index, ready to use. |

## Methods

### close()

> **close**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Closes the connection **this `open` call created**. Idempotent — a second
`close` succeeds rather than failing.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

#### Remarks

The disposer travels on this handle rather than on the index class because an
index built by `create` holds a connection the **consumer** owns, and must stay
incapable of closing it. A `close()` method meaningful on some instances and
forbidden on others would be a lie in the type; here, only the caller that
caused the connection to exist is handed the means to end it.

The index is unusable afterwards — every operation on it will fail against a
closed connection.
