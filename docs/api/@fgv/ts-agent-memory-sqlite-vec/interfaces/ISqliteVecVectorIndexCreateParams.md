[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / ISqliteVecVectorIndexCreateParams

# Interface: ISqliteVecVectorIndexCreateParams

Parameters for [SqliteVecVectorIndex.create](../classes/SqliteVecVectorIndex.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-database"></a> `database` | `readonly` | `Database` | A `better-sqlite3` `Database` the consumer owns (bring-your-own, mirroring the boundary-package convention). The consumer opens it (`new Database(path)` for a persistent file, or `new Database(':memory:')` for an ephemeral index) and owns its lifecycle — this index never closes it. `create` loads the `sqlite-vec` extension onto the connection and, if the vector table already exists (a reopened persistent file), recovers its established dimension so no re-embedding is required on open. |
| <a id="property-identity"></a> `identity?` | `readonly` | `string` | The embedding identity this handle expects the stored vectors to have — an opaque string such as a model name and version. Optional. **Remarks** The identity is stored **inside the database file**, next to the vectors, so a copy, restore or snapshot carries it along. [SqliteVecVectorIndex.identity](../classes/SqliteVecVectorIndex.md#identity) compares it on every call, and `add` and `query` are fenced: while the stored identity differs from this one (`'mismatch'`), or a rebuild started and never finished (`'incomplete'`), they fail rather than mix vectors from two embedding spaces. `rebuild` is always allowed and commits this identity when it completes. Omit it and the index behaves as it did before identities existed; `identity()` then answers `'unchecked'`. The value is only ever bound as a SQL parameter, never interpolated. |
| <a id="property-tablename"></a> `tableName?` | `readonly` | `string` | Name of the `vec0` virtual table that holds the embeddings. Must be a simple SQL identifier (`[A-Za-z_][A-Za-z0-9_]*`). Defaults to `'memory_vectors'`. Supply a distinct name to hold more than one independent index in a single database file. |
