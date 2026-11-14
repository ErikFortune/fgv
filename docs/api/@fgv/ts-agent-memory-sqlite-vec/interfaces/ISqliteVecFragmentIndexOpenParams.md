[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / ISqliteVecFragmentIndexOpenParams

# Interface: ISqliteVecFragmentIndexOpenParams

Parameters for [SqliteVecFragmentIndex.open](../classes/SqliteVecFragmentIndex.md#open).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-identity"></a> `identity?` | `readonly` | `string` | The embedding identity this handle expects — see [ISqliteVecFragmentIndexCreateParams.identity](ISqliteVecFragmentIndexCreateParams.md#property-identity). |
| <a id="property-path"></a> `path` | `readonly` | `string` | Filesystem path to the database file, opened by this package rather than by the consumer. Created if it does not exist, exactly as `better-sqlite3` would. `':memory:'` is accepted and yields an owned ephemeral connection. **Two `open` calls on one path produce two independent connections, not a shared one** — see [ISqliteVecVectorIndexOpenParams.path](ISqliteVecVectorIndexOpenParams.md#property-path). To put a fragment index and a record index on one connection, open it yourself and pass it to both `create` methods. |
| <a id="property-tablename"></a> `tableName?` | `readonly` | `string` | Name of the `vec0` virtual table that holds the fragment embeddings. Must be a simple SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to `'memory_fragments'`. |
