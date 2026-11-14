[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / ISqliteVecVectorIndexOpenParams

# Interface: ISqliteVecVectorIndexOpenParams

Parameters for [SqliteVecVectorIndex.open](../classes/SqliteVecVectorIndex.md#open).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-identity"></a> `identity?` | `readonly` | `string` | The embedding identity this handle expects — see [ISqliteVecVectorIndexCreateParams.identity](ISqliteVecVectorIndexCreateParams.md#property-identity). |
| <a id="property-path"></a> `path` | `readonly` | `string` | Filesystem path to the database file, opened by this package rather than by the consumer. Created if it does not exist, exactly as `better-sqlite3` would. `':memory:'` is accepted and yields an owned ephemeral connection. **Two `open` calls on one path produce two independent connections, not a shared one.** That is legal in SQLite and has a different locking story than the single-connection case — writes contend, and a reader can see a `SQLITE_BUSY`. To put a record index and a fragment index on one connection (the intended shared-handle case), open the connection yourself and pass it to both `create` methods. |
| <a id="property-tablename"></a> `tableName?` | `readonly` | `string` | Name of the `vec0` virtual table that holds the embeddings. Must be a simple SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to `'memory_vectors'`. Supply a distinct name to hold more than one independent index in a single database file. |
